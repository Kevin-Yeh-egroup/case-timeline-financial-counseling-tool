const zlib = require("zlib");

const MAX_FILE_BYTES = 8 * 1024 * 1024;

module.exports = async function handler(req, res) {
  setNoStore(res);

  if (req.method !== "POST") {
    return json(res, 405, { error: "method_not_allowed" });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    return json(res, 400, { error: "invalid_json", message: error.message });
  }

  const name = String(body.name || "uploaded-file");
  const mimeType = String(body.mimeType || "");
  const base64 = String(body.base64 || "");
  const ext = extensionOf(name);

  if (!base64) return json(res, 400, { error: "missing_file" });

  let buffer;
  try {
    buffer = Buffer.from(base64, "base64");
  } catch (error) {
    return json(res, 400, { error: "invalid_base64", message: error.message });
  }

  if (buffer.length > MAX_FILE_BYTES) {
    return json(res, 413, { error: "file_too_large", message: "單檔上限為 8MB。" });
  }

  try {
    const extracted = extractText({ name, ext, mimeType, buffer });
    return json(res, 200, {
      name,
      mimeType,
      mode: extracted.mode,
      text: trimForAnalysis(extracted.text),
      note: extracted.note
    });
  } catch (error) {
    return json(res, 200, {
      name,
      mimeType,
      mode: "unsupported",
      text: `檔案：${name}\n尚未能可靠抽取此檔案內容，請貼上摘要或轉成可複製文字後再分析。`,
      note: error.message || "抽取失敗"
    });
  }
};

function extractText({ name, ext, mimeType, buffer }) {
  if (["txt", "csv", "md"].includes(ext) || mimeType.startsWith("text/")) {
    return { mode: "plain-text", text: buffer.toString("utf8"), note: "已讀取文字內容。" };
  }

  if (ext === "docx") {
    return { mode: "docx", text: extractDocxText(buffer), note: "已從 Word 文件抽取文字；格式與表格可能已簡化。" };
  }

  if (ext === "xlsx") {
    return { mode: "xlsx", text: extractXlsxText(buffer), note: "已從 Excel 活頁簿抽取文字；公式與格式不會保留。" };
  }

  if (ext === "pdf" || mimeType === "application/pdf") {
    return { mode: "pdf-basic", text: extractPdfText(buffer), note: "已嘗試從 PDF 抽取文字；掃描影像 PDF 可能需要 OCR。" };
  }

  throw new Error(`不支援的檔案格式：${name}`);
}

function extractDocxText(buffer) {
  const entries = readZipEntries(buffer);
  const xmlParts = [
    "word/document.xml",
    ...Object.keys(entries).filter((name) => /^word\/(header|footer|footnotes|endnotes)\d*\.xml$/.test(name))
  ];
  const text = xmlParts
    .map((name) => entries[name] ? wordXmlToText(entries[name].toString("utf8")) : "")
    .filter(Boolean)
    .join("\n");
  if (!text.trim()) throw new Error("Word 文件未抽到可讀文字。");
  return text;
}

function extractXlsxText(buffer) {
  const entries = readZipEntries(buffer);
  const sharedStrings = parseSharedStrings(entries["xl/sharedStrings.xml"]);
  const sheetNames = Object.keys(entries).filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
  const text = sheetNames.map((name, index) => {
    const rows = sheetXmlToRows(entries[name].toString("utf8"), sharedStrings)
      .filter((row) => row.some(Boolean))
      .map((row) => row.join(" | "));
    return rows.length ? `工作表 ${index + 1}\n${rows.join("\n")}` : "";
  }).filter(Boolean).join("\n\n");
  if (!text.trim()) throw new Error("Excel 檔未抽到可讀文字。");
  return text;
}

function extractPdfText(buffer) {
  const source = buffer.toString("latin1");
  const chunks = [];

  const streamPattern = /<<(.*?)>>\s*stream\r?\n([\s\S]*?)\r?\nendstream/g;
  for (const match of source.matchAll(streamPattern)) {
    const header = match[1];
    const rawStream = Buffer.from(match[2], "latin1");
    if (/\/FlateDecode/.test(header)) {
      try {
        chunks.push(zlib.inflateSync(rawStream).toString("latin1"));
      } catch (_) {
        // Ignore unreadable compressed streams and continue with other text.
      }
    } else {
      chunks.push(match[2]);
    }
  }

  chunks.push(source);
  const text = chunks.map(extractPdfStrings).join("\n").replace(/\s+/g, " ").trim();
  if (!text) throw new Error("PDF 未抽到可讀文字；可能是掃描影像或加密檔。");
  return decodePossiblyUtf16(text);
}

function readZipEntries(buffer) {
  const centralDirectory = readCentralDirectory(buffer);
  if (centralDirectory) return centralDirectory;

  const entries = {};
  let offset = 0;

  while (offset + 30 < buffer.length) {
    const signature = buffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) break;

    const method = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + fileNameLength + extraLength;
    const name = buffer.slice(nameStart, nameStart + fileNameLength).toString("utf8");
    const data = buffer.slice(dataStart, dataStart + compressedSize);

    if (!name.endsWith("/")) {
      entries[name] = inflateZipEntry(data, method);
    }

    offset = dataStart + compressedSize;
  }

  return entries;
}

function readCentralDirectory(buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  if (eocdOffset < 0) return null;

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const directoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = {};
  let offset = directoryOffset;

  for (let index = 0; index < entryCount && offset + 46 < buffer.length; index++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) break;

    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const nameStart = offset + 46;
    const name = buffer.slice(nameStart, nameStart + fileNameLength).toString("utf8");

    if (!name.endsWith("/") && compressedSize !== 0xffffffff && localHeaderOffset !== 0xffffffff) {
      const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
      const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const data = buffer.slice(dataStart, dataStart + compressedSize);
      entries[name] = inflateZipEntry(data, method);
    }

    offset = nameStart + fileNameLength + extraLength + commentLength;
  }

  return Object.keys(entries).length ? entries : null;
}

function findEndOfCentralDirectory(buffer) {
  const minOffset = Math.max(0, buffer.length - 65557);
  for (let offset = buffer.length - 22; offset >= minOffset; offset--) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  return -1;
}

function inflateZipEntry(data, method) {
  if (method === 0) return data;
  if (method === 8) return zlib.inflateRawSync(data);
  return Buffer.alloc(0);
}

function wordXmlToText(xml) {
  return xml
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<\/w:tr>/g, "\n")
    .replace(/<\/w:tc>/g, " | ")
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map((line) => decodeXml(line).replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function parseSharedStrings(buffer) {
  if (!buffer) return [];
  const xml = buffer.toString("utf8");
  return [...xml.matchAll(/<si[\s\S]*?<\/si>/g)].map((match) => wordXmlToText(match[0]));
}

function sheetXmlToRows(xml, sharedStrings) {
  return [...xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((rowMatch) => {
    const cells = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2];
      const ref = attrs.match(/r="([A-Z]+)\d+"/)?.[1];
      const columnIndex = ref ? columnToIndex(ref) : cells.length;
      const type = attrs.match(/t="([^"]+)"/)?.[1] || "";
      const rawValue = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] || body.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] || "";
      const value = type === "s" ? sharedStrings[Number(rawValue)] || "" : decodeXml(rawValue);
      cells[columnIndex] = value.replace(/\s+/g, " ").trim();
    }
    return cells.map((value) => value || "");
  });
}

function extractPdfStrings(text) {
  const literalStrings = [...text.matchAll(/\((?:\\.|[^\\)]){2,}\)/g)]
    .map((match) => match[0].slice(1, -1).replace(/\\([nrtbf()\\])/g, (_, code) => {
      const replacements = { n: "\n", r: "\r", t: "\t", b: "\b", f: "\f", "(": "(", ")": ")", "\\": "\\" };
      return replacements[code] || code;
    }));
  const hexStrings = [...text.matchAll(/<([0-9A-Fa-f]{4,})>/g)]
    .map((match) => decodeHexString(match[1]));
  return [...literalStrings, ...hexStrings].join(" ");
}

function decodeHexString(hex) {
  const bytes = Buffer.from(hex.length % 2 ? `${hex}0` : hex, "hex");
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return bytes.slice(2).toString("utf16le");
  if (bytes.some((byte) => byte === 0)) return bytes.swap16().toString("utf16le");
  return bytes.toString("utf8");
}

function decodePossiblyUtf16(text) {
  return text.replace(/\u0000/g, "").replace(/[^\S\r\n]+/g, " ").trim();
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'");
}

function columnToIndex(column) {
  return column.split("").reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function extensionOf(name) {
  const parts = String(name).toLowerCase().split(".");
  return parts.length > 1 ? parts.pop() : "";
}

function trimForAnalysis(text) {
  return String(text || "").replace(/\s+\n/g, "\n").trim().slice(0, 18000);
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function setNoStore(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

function json(res, status, payload) {
  res.statusCode = status;
  res.end(JSON.stringify(payload));
}
