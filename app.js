const lanes = ["個人事件", "家庭事件", "金錢事件", "制度事件", "時代背景", "服務介入"];
const sensitivityOptions = ["通過", "需遮罩", "需同意", "不得分享", "需督導確認"];

const contextRows = [
  ["卡債/雙卡風暴", "約2005-2006", "理解循環利息、最低應繳、催收恐懼與制度信任。", "https://www.npf.org.tw/2/3558"],
  ["消費者債務清理前置協商", "2008後制度化", "工具只準備資料與問題清單，不代談條件。", "https://www.banking.gov.tw/ch/home.jsp?id=742&parentpath=0%2C674%2C717%2C740&websitelink=artwebsite.jsp"],
  ["社會救助法低收/中低收", "現行制度", "記錄資格異動、家庭總收入、家庭財產與應計人口。", "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=D0050078"],
  ["兒童及少年未來教育與發展帳戶", "106年開辦", "遲繳是家庭財務壓力訊號，不直接推論不重視孩子。", "https://dep.mohw.gov.tw/dosaasw/cp-3841-51050-103.html"],
  ["信扶/家庭脫貧培力", "長期社工財務知能合作", "保留網絡合作、個案研討、財務諮詢與資源連結。", "https://cdj.sfaa.gov.tw/Journal/Content?gno=13248"],
  ["個人資料保護法", "現行法規", "家庭、醫療、財務與社會活動等資料均需最小必要。", "https://law.pdpc.gov.tw/LawContent.aspx?id=FL010627"],
  ["社會工作師倫理守則", "現行倫理", "自我決定、保密、客觀紀錄、轉介與文化脈絡。", "https://www.mohw.gov.tw/dl-85943-e9f2ffb0-f35e-4965-bf41-e8759f98ed2c.html"],
];

const languageRows = [
  ["亂花錢", "支出可能承載急迫需求、關係義務或情緒調節，需確認用途與情境。"],
  ["逃避債務", "暫時避開高壓訊息，以保留行動空間；需確認催收、安全與資訊障礙。"],
  ["不配合", "尚未取得回覆，仍需確認障礙或工作關係安全感。"],
  ["說法矛盾", "不同來源記載不一致。"],
  ["依賴補助", "在資源不足時使用可得支持。"],
  ["不會規劃", "長期規劃被短期風險擠壓。"],
  ["衝動", "在時間壓力與資訊不足下快速決策。"],
  ["不重視孩子", "照顧或教育承諾可能被現金流或制度門檻中斷。"],
];

const safetyItems = [
  ["身分識別", "姓名、身分證、地址、電話、照片、精確生日、學校或工作地點。"],
  ["家庭敏感資訊", "家暴、兒少/老人/身障保護、扶養糾紛、犯罪前科或高衝突關係。"],
  ["健康/醫療", "診斷、病歷、就醫、精神健康、成癮、自傷他傷資訊。"],
  ["財務資料", "帳號、債權人、借款契約、催收訊息、薪資、資產、存款。"],
  ["兒少資料", "未成年人的姓名、學校、出生年月日、保護或福利身份。"],
  ["來源信心", "低信心或待確認內容是否被寫成事實。"],
  ["推論語氣", "是否出現亂花錢、不配合、逃避、失能等責備語。"],
  ["金融越界", "是否含投資、保險、貸款、債務整合推薦或最佳還款策略承諾。"],
  ["法律越界", "是否含法律勝算、法院程序結論或正式法律建議。"],
  ["同意/法定依據", "分享對象、目的、期間、方式是否已告知並取得合適依據。"],
  ["外部版摘要", "外部版是否去識別化並只留下必要摘要。"],
  ["督導確認", "紅線事件是否需要督導、主管或合格專業確認。"],
];

const sampleEvents = [
  {
    id: "E001",
    rocYear: 86,
    age: 27,
    lane: "金錢事件",
    title: "信用卡付款中斷",
    fact: "付款中斷或只繳最低應繳，需確認循環利息、催收與安全狀態。",
    voice: "先撐過當月房租與孩子費用。",
    source: "當事人口述 / 帳單摘要",
    sensitivity: "高度敏感",
    confidence: "低",
    nextStep: "補債務清冊；必要時轉官方協商或法扶。"
  },
  {
    id: "E002",
    rocYear: 101,
    age: 42,
    lane: "家庭事件",
    title: "孩子出生",
    fact: "家庭照顧與支出責任增加。",
    voice: "希望孩子未來有一筆可以用的錢。",
    source: "當事人口述",
    sensitivity: "內部",
    confidence: "中",
    nextStep: "確認照顧分工與固定支出。"
  },
  {
    id: "E003",
    rocYear: 109,
    age: 50,
    lane: "制度事件",
    title: "福利身份或帳戶繳存異動",
    fact: "低收/中低收資格、兒少教育發展帳戶或補助資格需重新確認。",
    voice: "不是不想存，是那陣子先處理眼前的錢。",
    source: "轉介單 / 公文摘要",
    sensitivity: "內部",
    confidence: "中",
    nextStep: "與社工確認資格、文件與可調整方式。"
  }
];

const sampleDecisions = [
  {
    id: "D001",
    eventId: "E001",
    question: "付款中斷後如何處理？",
    options: "繳最低、協商、求助、延後付款、暫停其他支出。",
    fear: "居住、照顧或工作安排中斷。",
    interpretation: "在短期安全與長期債務成本間取捨，需確認當時資訊與可行選項。"
  },
  {
    id: "D002",
    eventId: "E003",
    question: "是否維持兒少教育發展帳戶繳存？",
    options: "續繳、降額、暫停、詢問社工。",
    fear: "孩子未來資產累積中斷，但當月生活費已不足。",
    interpretation: "家庭可能認同長期儲蓄，但短期現金流使承諾中斷。"
  }
];

let state = loadState();

function defaultState() {
  return {
    events: structuredClone(sampleEvents),
    decisions: structuredClone(sampleDecisions),
    checks: safetyItems.map(([name]) => ({ name, status: "通過" })),
    yearMode: "roc"
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("caseTimelineToolState") || "null");
    if (saved && Array.isArray(saved.events) && Array.isArray(saved.decisions)) return saved;
  } catch (_) {
    localStorage.removeItem("caseTimelineToolState");
  }
  return defaultState();
}

function saveState() {
  localStorage.setItem("caseTimelineToolState", JSON.stringify(state));
}

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function esc(text) {
  return String(text ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]);
}

function render() {
  saveState();
  renderSummary();
  renderTimeline();
  renderLaneChart();
  renderEventsTable();
  renderDecisionCards();
  renderSafetyList();
  updateExportProbe();
}

function renderSummary() {
  $("#metricEvents").textContent = state.events.length;
  $("#metricDecisions").textContent = state.decisions.length;
  $("#metricMoney").textContent = state.events.filter((e) => e.lane === "金錢事件").length;
  $("#metricSensitive").textContent = state.events.filter((e) => ["高度敏感", "不可外部分享"].includes(e.sensitivity)).length;
  $("#metricPending").textContent = state.events.filter((e) => e.confidence === "低").length;
}

function renderTimeline() {
  const chart = $("#timelineChart");
  const years = state.events.map((e) => Number(e.rocYear)).filter(Boolean);
  const min = Math.min(...years, 75);
  const max = Math.max(...years, 114);
  const span = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  chart.style.setProperty("--year-count", span.length);
  const label = (year) => state.yearMode === "ad" ? year + 1911 : year;
  let html = `<div class="timeline-grid"><div class="timeline-cell timeline-head">泳道</div>`;
  html += span.map((year) => `<div class="timeline-cell timeline-head">${label(year)}</div>`).join("");
  for (const lane of lanes) {
    html += `<div class="timeline-cell lane-label">${lane}</div>`;
    for (const year of span) {
      const events = state.events.filter((e) => e.lane === lane && Number(e.rocYear) === year);
      html += `<div class="timeline-cell">${events.map(eventPill).join("")}</div>`;
    }
  }
  html += "</div>";
  chart.innerHTML = html;
}

function eventPill(event) {
  const classes = ["event-pill"];
  if (event.lane === "金錢事件") classes.push("money");
  if (event.lane === "家庭事件") classes.push("family");
  if (event.lane === "制度事件") classes.push("system");
  if (["高度敏感", "不可外部分享"].includes(event.sensitivity)) classes.push("sensitive");
  return `<span class="${classes.join(" ")}"><strong>${esc(event.title)}</strong><br><small>${esc(event.age || "")}歲 ${esc(event.sensitivity)}</small></span>`;
}

function renderLaneChart() {
  const counts = lanes.map((lane) => ({ lane, count: state.events.filter((e) => e.lane === lane).length }));
  const max = Math.max(...counts.map((d) => d.count), 1);
  $("#laneChart").innerHTML = counts.map((d) => {
    const width = Math.max((d.count / max) * 100, d.count ? 8 : 0);
    return `
      <div class="bar-row">
        <span>${esc(d.lane)}</span>
        <div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div>
        <strong>${d.count}</strong>
      </div>`;
  }).join("");
}

function renderEventsTable() {
  $("#eventsTable").innerHTML = state.events.map((e) => `
    <tr>
      <td>${esc(e.id)}</td>
      <td>${esc(e.rocYear)}</td>
      <td>${esc(e.lane)}</td>
      <td><strong>${esc(e.title)}</strong><br><span>${esc(e.fact)}</span></td>
      <td><span class="badge ${e.sensitivity === "高度敏感" || e.sensitivity === "不可外部分享" ? "red" : ""}">${esc(e.sensitivity)}</span></td>
      <td>${esc(e.nextStep || "")}</td>
      <td class="row-actions"><button type="button" data-delete-event="${esc(e.id)}">刪除</button></td>
    </tr>
  `).join("");
}

function renderDecisionCards() {
  $("#decisionCards").innerHTML = state.decisions.map((d) => `
    <article class="decision-card">
      <h3>${esc(d.id)} ${esc(d.question)}</h3>
      <dl>
        <dt>連結事件</dt><dd>${esc(d.eventId || "未連結")}</dd>
        <dt>可選選項</dt><dd>${esc(d.options)}</dd>
        <dt>最大擔心</dt><dd>${esc(d.fear)}</dd>
        <dt>脈絡解讀</dt><dd>${esc(d.interpretation)}</dd>
      </dl>
    </article>
  `).join("");
}

function renderSafetyList() {
  $("#safetyList").innerHTML = safetyItems.map(([name, description], index) => {
    const current = state.checks[index]?.status || "通過";
    const options = sensitivityOptions.map((option) => `<option ${option === current ? "selected" : ""}>${option}</option>`).join("");
    return `
      <div class="check-item">
        <div><strong>${esc(name)}</strong><span>${esc(description)}</span></div>
        <select data-check-index="${index}">${options}</select>
      </div>`;
  }).join("");
}

function updateExportProbe() {
  const probe = document.querySelector("#exportProbe");
  if (!probe) return;
  const blob = buildXlsx();
  probe.dataset.eventCount = String(state.events.length);
  probe.dataset.decisionCount = String(state.decisions.length);
  probe.dataset.xlsxSize = String(blob.size);
  probe.dataset.mimeType = blob.type;
}

function nextId(prefix, items) {
  const max = items.reduce((acc, item) => {
    const n = Number(String(item.id || "").replace(prefix, ""));
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

function bindEvents() {
  $$(".tab").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".tab").forEach((tab) => tab.classList.remove("active"));
      $$(".workspace").forEach((panel) => panel.classList.remove("active"));
      button.classList.add("active");
      $(`#tab-${button.dataset.tab}`).classList.add("active");
    });
  });

  $("#yearMode").value = state.yearMode;
  $("#yearMode").addEventListener("change", (event) => {
    state.yearMode = event.target.value;
    render();
  });

  $("#eventForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.events.push({
      id: nextId("E", state.events),
      rocYear: Number(data.rocYear),
      age: Number(data.age || 0),
      lane: data.lane,
      title: data.title,
      fact: data.fact,
      voice: data.voice,
      source: "使用者新增",
      sensitivity: data.sensitivity,
      confidence: data.confidence,
      nextStep: data.confidence === "低" ? "補來源與當事人確認" : "納入下一次討論"
    });
    render();
  });

  $("#decisionForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.decisions.push({
      id: nextId("D", state.decisions),
      eventId: data.eventId,
      question: data.question,
      options: data.options,
      fear: data.fear,
      interpretation: data.interpretation
    });
    render();
  });

  document.addEventListener("click", (event) => {
    const id = event.target?.dataset?.deleteEvent;
    if (id) {
      state.events = state.events.filter((item) => item.id !== id);
      state.decisions = state.decisions.filter((item) => item.eventId !== id);
      render();
    }
  });

  $("#clearEvents").addEventListener("click", () => {
    if (confirm("清除目前瀏覽器裡的事件與決策節點？")) {
      state.events = [];
      state.decisions = [];
      render();
    }
  });

  $("#resetSample").addEventListener("click", () => {
    state = defaultState();
    render();
  });

  $("#resetChecks").addEventListener("click", () => {
    state.checks = safetyItems.map(([name]) => ({ name, status: "通過" }));
    render();
  });

  $("#safetyList").addEventListener("change", (event) => {
    const index = Number(event.target.dataset.checkIndex);
    if (Number.isFinite(index)) {
      state.checks[index] = { name: safetyItems[index][0], status: event.target.value };
      render();
    }
  });

  $("#downloadExcel").addEventListener("click", () => {
    const blob = buildXlsx();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `case-timeline-tool-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}

function buildXlsx() {
  const sheets = [
    {
      name: "事件時間軸",
      rows: [
        ["ID", "民國年", "西元年", "年齡", "泳道", "事件標題", "事件事實", "當事人說法", "來源", "敏感度", "信心", "下一步"],
        ...state.events.map((e) => [e.id, e.rocYear, Number(e.rocYear) + 1911, e.age, e.lane, e.title, e.fact, e.voice, e.source, e.sensitivity, e.confidence, e.nextStep])
      ]
    },
    {
      name: "決策節點卡",
      rows: [
        ["ID", "連結事件", "決策問題", "可選選項", "最大擔心", "脈絡化解讀"],
        ...state.decisions.map((d) => [d.id, d.eventId, d.question, d.options, d.fear, d.interpretation])
      ]
    },
    {
      name: "台灣制度背景",
      rows: [["主題", "時間/制度", "用途", "來源"], ...contextRows]
    },
    {
      name: "分享前檢查",
      rows: [["項目", "檢查內容", "狀態"], ...safetyItems.map(([name, description], index) => [name, description, state.checks[index]?.status || "通過"])]
    },
    {
      name: "非責備語言",
      rows: [["避免用語", "建議用語"], ...languageRows]
    }
  ];

  const files = {};
  files["[Content_Types].xml"] = contentTypes(sheets.length);
  files["_rels/.rels"] = rootRels();
  files["docProps/core.xml"] = coreProps();
  files["docProps/app.xml"] = appProps(sheets.map((s) => s.name));
  files["xl/workbook.xml"] = workbookXml(sheets.map((s) => s.name));
  files["xl/_rels/workbook.xml.rels"] = workbookRels(sheets.length);
  sheets.forEach((sheet, i) => {
    files[`xl/worksheets/sheet${i + 1}.xml`] = worksheetXml(sheet.rows);
  });
  return new Blob([zipFiles(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

function xml(text) {
  return String(text ?? "").replace(/[<>&'"]/g, (ch) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    '"': "&quot;"
  })[ch]);
}

function columnName(index) {
  let name = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function worksheetXml(rows) {
  const sheetData = rows.map((row, r) => {
    const cells = row.map((value, c) => {
      const ref = `${columnName(c)}${r + 1}`;
      if (typeof value === "number" && Number.isFinite(value)) {
        return `<c r="${ref}" t="n"><v>${value}</v></c>`;
      }
      return `<c r="${ref}" t="inlineStr"><is><t>${xml(value)}</t></is></c>`;
    }).join("");
    return `<row r="${r + 1}">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetData}</sheetData>
</worksheet>`;
}

function contentTypes(count) {
  let overrides = "";
  for (let i = 1; i <= count; i++) {
    overrides += `<Override PartName="/xl/worksheets/sheet${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`;
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  ${overrides}
</Types>`;
}

function rootRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;
}

function workbookXml(names) {
  const sheets = names.map((name, i) => `<sheet name="${xml(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>${sheets}</sheets>
</workbook>`;
}

function workbookRels(count) {
  let rels = "";
  for (let i = 1; i <= count; i++) {
    rels += `<Relationship Id="rId${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i}.xml"/>`;
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`;
}

function coreProps() {
  const now = new Date().toISOString();
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>個案時間軸整理工具</dc:title>
  <dc:creator>Case Timeline Tool</dc:creator>
  <dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>
</cp:coreProperties>`;
}

function appProps(names) {
  const titles = names.map((name) => `<vt:lpstr>${xml(name)}</vt:lpstr>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Case Timeline Tool</Application>
  <TitlesOfParts><vt:vector size="${names.length}" baseType="lpstr">${titles}</vt:vector></TitlesOfParts>
</Properties>`;
}

function zipFiles(files) {
  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(text);
    const crc = crc32(data);
    const local = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, data.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    localParts.push(local, data);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralParts.push(central);
    offset += local.length + data.length;
  }
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, Object.keys(files).length, true);
  ev.setUint16(10, Object.keys(files).length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  return new Blob([...localParts, ...centralParts, eocd]);
}

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

bindEvents();
render();

window.caseTimelineTool = {
  exportProbe() {
    const blob = buildXlsx();
    return {
      eventCount: state.events.length,
      decisionCount: state.decisions.length,
      xlsxSize: blob.size,
      mimeType: blob.type
    };
  }
};
