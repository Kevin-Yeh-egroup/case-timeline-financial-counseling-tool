const DEFAULT_LANES = [
  "居住遷徙史",
  "就業就學史",
  "感情家庭史",
  "疾病健康史",
  "社會資源使用史",
  "重大財務事件"
];

const GEMINI_GENERATE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_OPENAI_MODEL = "gpt-5-mini";

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

  const text = String(body.text || "").trim();
  const lanes = Array.isArray(body.lanes) && body.lanes.length ? body.lanes : DEFAULT_LANES;
  if (text.length < 6) {
    return json(res, 400, { error: "input_too_short" });
  }

  const clippedText = text.slice(0, 18000);
  const clippedWarning = clippedText.length < text.length ? "輸入內容已截短為前 18,000 字。" : "";
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openAiApiKey = process.env.OPENAI_API_KEY;
  const providers = buildProviderOrder(body.provider || process.env.AI_ANALYSIS_PROVIDER, {
    hasGemini: Boolean(geminiApiKey),
    hasOpenAi: Boolean(openAiApiKey)
  });

  if (!providers.length) {
    return json(res, 200, localFallbackPayload(
      "AI API 尚未設定，前端會改用瀏覽器內的基本語意規則。",
      [clippedWarning, "本次沒有將文字送往外部 AI 服務。"].filter(Boolean)
    ));
  }

  const providerWarnings = [];
  for (const provider of providers) {
    try {
      const analysis = provider === "gemini"
        ? await runGeminiAnalysis(clippedText, lanes, [clippedWarning], geminiApiKey)
        : await runOpenAiAnalysis(clippedText, lanes, [clippedWarning], openAiApiKey);
      return json(res, 200, analysis);
    } catch (error) {
      providerWarnings.push(`${provider === "gemini" ? "Gemini" : "OpenAI"} 分析失敗：${error.message}`);
    }
  }

  return json(res, 200, localFallbackPayload(
    "外部 AI 分析失敗，前端會改用瀏覽器內的基本語意規則。",
    [clippedWarning, ...providerWarnings].filter(Boolean)
  ));
};

async function runGeminiAnalysis(text, lanes, baseWarnings, apiKey) {
  const model = process.env.GEMINI_SEMANTIC_MODEL || process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const response = await fetch(`${GEMINI_GENERATE_URL}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [{ text: `${analysisInstructions()}\n\n請依 schema 輸出 JSON，不要加入 Markdown。\n\n${text}` }]
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseJsonSchema: analysisSchema(lanes),
        maxOutputTokens: 2200,
        temperature: 0.2
      }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || data.message || `Gemini analysis failed with ${response.status}.`);
  }
  const parsed = JSON.parse(stripJsonFences(extractGeminiOutputText(data)));
  return normalizeAnalysis(parsed, collectWarnings(parsed, baseWarnings), "gemini", lanes);
}

async function runOpenAiAnalysis(text, lanes, baseWarnings, apiKey) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
      store: false,
      max_output_tokens: 2200,
      input: [
        { role: "system", content: [{ type: "input_text", text: analysisInstructions() }] },
        { role: "user", content: [{ type: "input_text", text }] }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "case_timeline_five_field_analysis",
          strict: true,
          schema: analysisSchema(lanes)
        }
      }
    })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error?.message || data.message || `OpenAI analysis failed with ${response.status}.`);
  }
  const parsed = parseResponseJson(data);
  return normalizeAnalysis(parsed, collectWarnings(parsed, baseWarnings), "openai", lanes);
}

function analysisInstructions() {
  return [
    "你是協助台灣助人工作者整理生命歷程事件的資料整理助手。",
    "只抽取事件，不做診斷、風險評分、法律判斷、理財建議或處遇建議。",
    "每一筆事件只保留：rocYear、rocMonth、actor、lane、summary。",
    "rocYear 使用民國年數字字串；若原文是西元年，請正確換算為民國年。",
    "rocMonth 使用 1 到 12 的數字字串。原文沒有月份時必須輸出空字串，不可猜測或自動補 1 月。",
    "actor 是事件發生人物。多人在不同情境或時間發生事件時，拆成不同事件。",
    "lane 必須從提供的六個事件大分類中選一個最主要分類。",
    "summary 使用簡潔、客觀、去推測的繁體中文，保留原意，不加入來源未提及的因果。",
    "同一段如果包含不同年月、人物或分類，應拆成多筆事件。",
    "warnings 只放無法可靠判斷的整體提示；不要額外輸出其他欄位。"
  ].join("\n");
}

function analysisSchema(lanes) {
  return {
    type: "object",
    additionalProperties: false,
    required: ["events", "warnings"],
    properties: {
      events: {
        type: "array",
        maxItems: 16,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["rocYear", "rocMonth", "actor", "lane", "summary"],
          properties: {
            rocYear: { type: "string", description: "民國年數字字串" },
            rocMonth: { type: "string", description: "1 到 12；原文未提供時為空字串" },
            actor: { type: "string", description: "事件發生人物" },
            lane: { type: "string", enum: lanes },
            summary: { type: "string", description: "客觀、精簡的事件摘要" }
          }
        }
      },
      warnings: {
        type: "array",
        maxItems: 6,
        items: { type: "string" }
      }
    }
  };
}

function normalizeAnalysis(parsed, warnings, mode, lanes = DEFAULT_LANES) {
  return {
    mode,
    events: (Array.isArray(parsed.events) ? parsed.events : []).map((item) => {
      const month = String(item.rocMonth || "").trim();
      return {
        rocYear: String(item.rocYear || "").replace(/\D/g, ""),
        rocMonth: /^(?:[1-9]|1[0-2])$/.test(month) ? month : "",
        actor: String(item.actor || "").trim(),
        lane: lanes.includes(item.lane) ? item.lane : DEFAULT_LANES[5],
        summary: String(item.summary || "").trim()
      };
    }).filter((item) => item.rocYear && item.actor && item.summary),
    warnings
  };
}

function collectWarnings(parsed, baseWarnings) {
  return [
    ...(Array.isArray(baseWarnings) ? baseWarnings : []),
    ...(Array.isArray(parsed.warnings) ? parsed.warnings : [])
  ].filter(Boolean);
}

function buildProviderOrder(preferred, availability) {
  const normalized = String(preferred || "").trim().toLowerCase();
  const available = [];
  if (availability.hasGemini) available.push("gemini");
  if (availability.hasOpenAi) available.push("openai");
  if (!available.length) return [];
  if (normalized === "openai") return ["openai", "gemini"].filter((provider) => available.includes(provider));
  if (normalized === "gemini") return ["gemini", "openai"].filter((provider) => available.includes(provider));
  return available;
}

function localFallbackPayload(message, warnings) {
  return { mode: "local-fallback", message, events: [], warnings };
}

function parseResponseJson(data) {
  const direct = typeof data.output_text === "string" ? data.output_text : "";
  const nested = direct || (Array.isArray(data.output)
    ? data.output.flatMap((item) => Array.isArray(item.content) ? item.content : [])
        .find((content) => content.type === "output_text" && typeof content.text === "string")?.text
    : "");
  if (!nested) throw new Error("OpenAI response did not include output_text.");
  return JSON.parse(nested);
}

function extractGeminiOutputText(payload) {
  const texts = [];
  (payload.candidates || []).forEach((candidate) => {
    (candidate.content?.parts || []).forEach((part) => {
      if (part.text) texts.push(part.text);
    });
  });
  const text = texts.join("\n").trim();
  if (!text) throw new Error("Gemini response did not include text output.");
  return text;
}

function stripJsonFences(text) {
  return String(text || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
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
