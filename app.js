const CURRENT_STATE_VERSION = "v0.5-related-people";
const lanes = ["居住遷移史", "就業與就學史", "感情與家庭史", "疾病與身心健康史", "社會資源使用歷程", "重大財務事件"];
const laneAliases = {
  "就業就學史": "就業與就學史",
  "感情家庭史": "感情與家庭史",
  "疾病身心史": "疾病與身心健康史",
  "疾病健康史": "疾病與身心健康史"
};
const sensitivityOptions = ["通過", "需遮罩", "需同意", "不得分享", "需督導確認"];

const historyGuides = [
  {
    name: "居住遷移史",
    focus: "住在哪裡、跟誰住、何時搬、搬遷是否與安全、房租、就學、照顧或工作有關。",
    lookFor: "第一次獨立租屋、寄住、安置、中途之家、戶籍/居住地不一致、租金補貼或社宅資源。",
    decisionMeaning: "搬遷常是風險控制與可用資源的結果，不宜直接解讀為不穩定或不負責。",
    caution: "地址、庇護/安置地點、保護案件資訊不得外部分享。"
  },
  {
    name: "就業與就學史",
    focus: "學歷、職訓、工作型態、收入穩定度、工時、照顧責任與資格門檻如何互相影響。",
    lookFor: "非典型工作、失業、留停、照顧中斷、就學轉換、職訓、薪資與社保紀錄。",
    decisionMeaning: "沒有穩定工作可能反映照顧、健康、交通、文件或制度誘因，不等於沒有動機。",
    caution: "不要把收入推估寫成事實；須標示來源與待確認。"
  },
  {
    name: "感情與家庭史",
    focus: "交往、婚姻、分居離婚、親職、扶養、家庭衝突與支持網絡如何影響金錢決策。",
    lookFor: "孩子出生、前段婚姻、扶養費、照顧分工、伴侶借貸、家暴/高衝突關係。",
    decisionMeaning: "關係義務常會改變支出優先順序；先理解誰在影響決策，再談財務方案。",
    caution: "保護案件、未成年資料與高衝突關係需督導確認。"
  },
  {
    name: "疾病與身心健康史",
    focus: "疾病、就醫、身心狀態、照顧負荷與醫療費用如何影響收入、支出與判斷力。",
    lookFor: "就醫中斷、慢性病、精神健康、成癮、自傷他傷、長照需求、家庭照顧者負荷。",
    decisionMeaning: "付款延遲、資源中斷或回覆困難，可能與症狀、照顧壓力或醫療可近性有關。",
    caution: "醫療與精神健康資料屬高度敏感，只記錄工作必要範圍。"
  },
  {
    name: "社會資源使用歷程",
    focus: "低收/中低收、急難、兒少教育發展帳戶、租金補貼、法扶、社工與網絡資源的使用與中斷。",
    lookFor: "資格異動、文件卡關、轉介單、資源申請成敗、跨網絡分工、服務中斷原因。",
    decisionMeaning: "反覆求助可能是制度門檻與現金流壓力的訊號，不應只解讀為依賴資源。",
    caution: "避免把未確認的福利身分、補助紀錄或服務紀錄外部揭露。"
  },
  {
    name: "重大財務事件",
    focus: "借貸、卡債、催收、保險、銀行帳戶、地下錢莊、協商與大額支出如何改變行動選項。",
    lookFor: "最低應繳、循環利息、債權人、還款承諾、代辦、親友借貸、重大資金用途。",
    decisionMeaning: "財務事件要連回當時的安全、家庭與制度選項；工具只協助整理，不代替金融或法律建議。",
    caution: "帳號、債權人細節、借據與催收內容需去識別化。"
  }
];

const contextRows = [
  ["卡債/雙卡風暴", "約2005-2006", "理解循環利息、最低應繳、催收恐懼與制度信任。", "https://www.npf.org.tw/2/3558"],
  ["消費者債務清理前置協商", "2008後制度化", "工具只準備資料、問題清單與轉介線索，不代談條件。", "https://www.banking.gov.tw/ch/home.jsp?id=742&parentpath=0%2C674%2C717%2C740&websitelink=artwebsite.jsp"],
  ["社安網/脆弱家庭", "107年起推動", "單一金錢困難常連動貧窮、失業、精神疾病、家庭衝突與社會疏離。", "https://mohw.gov.tw/ss/cp-4531-50117-204.html"],
  ["社會救助與脫貧措施", "現行制度", "記錄資格異動、家庭總收入、工作/職訓收入與自立脫貧誘因。", "https://www.mohw.gov.tw/cp-88-79005-1.html"],
  ["兒童及少年未來教育與發展帳戶", "106年開辦", "遲繳是家庭財務壓力訊號，不直接推論不重視孩子。", "https://dep.mohw.gov.tw/dosaasw/cp-3841-51050-103.html"],
  ["租金補貼與租屋家庭", "111年起擴大", "居住遷移、房租與租約文件會牽動就學、工作、債務與資源申請。", "https://www.moi.gov.tw/News_Content.aspx?n=4&s=260249&sms=9009"],
  ["家庭照顧與長照資源", "現行服務", "疾病與照顧負荷會改變可工作時間、收入穩定度與求助能力。", "https://www.mohw.gov.tw/cp-3210-23630-1.html"],
  ["信扶/家庭脫貧培力", "長期社工財務知能合作", "保留網絡合作、個案研討、財務諮詢與資源連結。", "https://cdj.sfaa.gov.tw/Journal/Content?gno=13248"],
  ["個人資料保護法", "現行法規", "婚姻、家庭、教育、職業、病歷、健康、財務與社會活動等資料均需最小必要。", "https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=I0050021"],
  ["社會工作師倫理守則", "現行倫理", "自我決定、保密、客觀紀錄、轉介與文化脈絡。", "https://www.mohw.gov.tw/dl-85943-e9f2ffb0-f35e-4965-bf41-e8759f98ed2c.html"],
];

const researchRows = [
  ["使用者提供之財務諮詢師培訓素材", "重大財務事件會反覆牽動居住、照顧、工作與資源資格。", "事件表新增六大歷程面向，不只記錄金錢流水帳。"],
  ["使用者提供之脫貧培力/經濟輔導課程素材", "社工、主管與財務諮詢師需要共同語言，並把家庭財務盤點放進網絡合作。", "Excel 匯出增加歷程解讀與研究依據摘要。"],
  ["社安網與脆弱家庭官方資料", "家庭脆弱性需看多重因子，不能只從單一求助議題判斷。", "歷程卡提示使用者同步看居住、工作、家庭、疾病與資源。"],
  ["個資法與倫理界線", "歷程資料含婚姻、家庭、教育、職業、醫療、健康、財務與社會活動。", "分享前檢查保留高敏感、最小必要與外部摘要檢核。"]
];

const workbookSheetNames = ["事件時間軸", "決策節點卡", "關係人", "待確認草稿", "六大歷程解讀", "台灣制度背景", "研究依據摘要", "分享前檢查", "非責備語言"];

const languageRows = [
  ["亂花錢", "支出可能承載急迫需求、關係義務或情緒調節，需確認用途與情境。"],
  ["逃避債務", "暫時避開高壓訊息，以保留行動空間；需確認催收、安全與資訊障礙。"],
  ["不配合", "尚未取得回覆，仍需確認障礙或工作關係安全感。"],
  ["說法矛盾", "不同來源記載不一致。"],
  ["依賴補助", "在資源不足時使用可得支持。"],
  ["不會規劃", "長期規劃被短期風險擠壓。"],
  ["衝動", "在時間壓力與資訊不足下快速決策。"],
  ["不重視孩子", "照顧或教育承諾可能被現金流或制度門檻中斷。"],
  ["工作不穩定", "工作型態可能受照顧、健康、交通、資格與非典型勞動市場影響。"],
  ["資源用太多", "資源使用歷程是制度可近性與安全網狀態的線索。"],
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

const sampleStakeholders = [
  {
    id: "A001",
    label: "案主本人",
    relation: "本人",
    stance: "主要當事人",
    sensitivity: "內部",
    notes: "所有事件預設與案主本人有關；公開版只使用稱謂，不填真名。"
  },
  {
    id: "A002",
    label: "子女",
    relation: "子女",
    stance: "受影響者",
    sensitivity: "高度敏感",
    notes: "涉及未成年資料時需最小必要，外部分享前應去識別化。"
  },
  {
    id: "A003",
    label: "主要照顧者",
    relation: "主要照顧者",
    stance: "支持/壓力並存",
    sensitivity: "內部",
    notes: "可能影響照顧安排、居住選擇與就業可行性。"
  },
  {
    id: "A004",
    label: "社工/承辦窗口",
    relation: "社工/承辦",
    stance: "資源窗口",
    sensitivity: "內部",
    notes: "用於標示資源申請、資格確認與轉介分工。"
  },
  {
    id: "A005",
    label: "債權人/金融機構",
    relation: "債權人/金融機構",
    stance: "壓力來源",
    sensitivity: "高度敏感",
    notes: "只記錄角色與互動壓力，不在公開版放帳號、姓名或催收細節。"
  }
];

const sampleEvents = [
  {
    id: "E001",
    rocYear: 85,
    age: 16,
    lane: "居住遷移史",
    title: "照顧安排改變後搬遷",
    fact: "家庭照顧安排改變，案主搬到親屬或安置地；就學與支持網絡重新整理。",
    voice: "那時候先有地方住比較重要。",
    source: "當事人口述 / 社工摘要",
    actorIds: ["A001", "A003"],
    sensitivity: "內部",
    confidence: "低",
    impact: "安全感、就學穩定與後續對制度的信任。",
    unknowns: "搬遷原因、是否涉及保護/安置、當時主要支持者。",
    nextStep: "確認搬遷資料與是否可外部分享。"
  },
  {
    id: "E002",
    rocYear: 97,
    age: 28,
    lane: "就業與就學史",
    title: "工作型態轉為不定時",
    fact: "收入來源改為臨時或不定時工作，薪資、工時與勞保狀態需再確認。",
    voice: "哪邊有工作就去哪邊做。",
    source: "當事人口述",
    actorIds: ["A001"],
    sensitivity: "內部",
    confidence: "中",
    impact: "現金流不穩，可能影響固定支出、租金與還款承諾。",
    unknowns: "工作中斷是否與健康、照顧、交通或資格門檻有關。",
    nextStep: "補收入區間、工作型態與就服/職訓資源。"
  },
  {
    id: "E003",
    rocYear: 101,
    age: 32,
    lane: "感情與家庭史",
    title: "孩子出生與照顧分工改變",
    fact: "家庭照顧與固定支出增加，伴侶、親屬或主要照顧者的支持程度影響金錢決策。",
    voice: "希望孩子未來有一筆可以用的錢。",
    source: "當事人口述 / 轉介單摘要",
    actorIds: ["A001", "A002", "A003"],
    sensitivity: "內部",
    confidence: "中",
    impact: "照顧時間、就業安排與儲蓄承諾互相拉扯。",
    unknowns: "扶養費、照顧分工、親屬支持與前段關係責任。",
    nextStep: "確認照顧分工與孩子相關固定支出。"
  },
  {
    id: "E004",
    rocYear: 105,
    age: 36,
    lane: "疾病與身心健康史",
    title: "就醫與照顧負荷增加",
    fact: "家庭成員就醫或身心狀態影響工作時間、交通與支出安排，需只記錄工作必要資訊。",
    voice: "那時候很多事情先顧身體和家裡。",
    source: "當事人口述 / 醫療相關摘要",
    actorIds: ["A001", "A003"],
    sensitivity: "高度敏感",
    confidence: "低",
    impact: "可能造成收入減少、回覆延遲、付款中斷或資源申請困難。",
    unknowns: "是否有正式診斷、長照需求、照顧者支持或醫療費用文件。",
    nextStep: "標示醫療資料界線；必要時轉介醫療/心理/長照資源。"
  },
  {
    id: "E005",
    rocYear: 109,
    age: 40,
    lane: "社會資源使用歷程",
    title: "福利身分或兒少帳戶繳存異動",
    fact: "低收/中低收資格、兒少教育發展帳戶或補助資格需重新確認。",
    voice: "不是不想存，是那陣子先處理眼前的錢。",
    source: "轉介單 / 公文摘要",
    actorIds: ["A001", "A002", "A004"],
    sensitivity: "內部",
    confidence: "中",
    impact: "短期現金流可能使長期資產形成承諾中斷。",
    unknowns: "資格異動原因、繳存中斷期間、是否曾詢問承辦窗口。",
    nextStep: "與社工確認資格、文件與可調整方式。"
  },
  {
    id: "E006",
    rocYear: 110,
    age: 41,
    lane: "重大財務事件",
    title: "信用卡或借貸付款中斷",
    fact: "付款中斷或只繳最低應繳，需確認循環利息、催收、借貸來源與安全狀態。",
    voice: "先撐過當月房租與孩子費用。",
    source: "當事人口述 / 帳單摘要",
    actorIds: ["A001", "A002", "A005"],
    sensitivity: "高度敏感",
    confidence: "低",
    impact: "可能牽動居住、家庭照顧、正式協商與對銀行/制度信任。",
    unknowns: "債權人、總額、利率、是否有代辦或地下借貸。",
    nextStep: "補債務清冊；必要時轉官方協商或法扶。"
  }
];

const sampleDecisions = [
  {
    id: "D001",
    eventId: "E006",
    question: "付款中斷後如何處理？",
    options: "繳最低、協商、求助、延後付款、暫停其他支出。",
    actorIds: ["A001", "A002", "A005"],
    fear: "居住、照顧或工作安排中斷。",
    interpretation: "在短期安全與長期債務成本間取捨，需確認當時資訊與可行選項。"
  },
  {
    id: "D002",
    eventId: "E003",
    question: "是否維持兒少教育發展帳戶繳存？",
    options: "續繳、降額、暫停、詢問社工。",
    actorIds: ["A001", "A002", "A004"],
    fear: "孩子未來資產累積中斷，但當月生活費已不足。",
    interpretation: "家庭可能認同長期儲蓄，但短期現金流使承諾中斷。"
  },
  {
    id: "D003",
    eventId: "E002",
    question: "是否接受不定時工作以先補現金流？",
    options: "接短工、找正式職缺、先處理照顧/就醫、連結就服或職訓。",
    actorIds: ["A001", "A003"],
    fear: "正式工作可能讓福利資格、照顧安排或身心狀態更不穩。",
    interpretation: "工作選擇不是單純意願問題，需同步看資格門檻、照顧責任與健康可負荷程度。"
  }
];

let state = loadState();

function defaultState() {
  return {
    version: CURRENT_STATE_VERSION,
    stakeholders: structuredClone(sampleStakeholders),
    events: structuredClone(sampleEvents),
    decisions: structuredClone(sampleDecisions),
    drafts: [],
    checks: safetyItems.map(([name]) => ({ name, status: "通過" })),
    yearMode: "roc"
  };
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("caseTimelineToolState") || "null");
    if (saved && Array.isArray(saved.events) && Array.isArray(saved.decisions)) {
      const base = defaultState();
      const stakeholders = normalizeStakeholders(saved.stakeholders || base.stakeholders);
      return {
        ...base,
        ...saved,
        version: CURRENT_STATE_VERSION,
        stakeholders,
        events: saved.events.map((event) => ({ ...event, lane: normalizeLane(event.lane), actorIds: normalizeActorIds(event.actorIds, stakeholders) })),
        decisions: saved.decisions.map((decision) => ({ ...decision, actorIds: normalizeActorIds(decision.actorIds, stakeholders) })),
        drafts: Array.isArray(saved.drafts) ? saved.drafts.map((draft) => draft.type === "event" ? { ...draft, lane: normalizeLane(draft.lane) } : draft) : [],
        checks: Array.isArray(saved.checks) ? saved.checks : base.checks,
        yearMode: saved.yearMode === "ad" ? "ad" : "roc"
      };
    }
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

function normalizeLane(lane) {
  const value = laneAliases[lane] || lane;
  return lanes.includes(value) ? value : "重大財務事件";
}

function normalizeStakeholders(items) {
  const list = Array.isArray(items) ? items : [];
  const normalized = list.map((item, index) => ({
    id: item.id || `A${String(index + 1).padStart(3, "0")}`,
    label: item.label || item.name || "未命名關係人",
    relation: item.relation || "其他網絡成員",
    stance: item.stance || "待釐清",
    sensitivity: item.sensitivity || "內部",
    notes: item.notes || ""
  }));
  if (!normalized.some((item) => item.id === "A001")) {
    normalized.unshift(structuredClone(sampleStakeholders[0]));
  }
  return normalized;
}

function normalizeActorIds(actorIds, stakeholders = state?.stakeholders || sampleStakeholders) {
  const validIds = new Set(stakeholders.map((item) => item.id));
  const ids = Array.isArray(actorIds) ? actorIds : [];
  const filtered = ids.filter((id) => validIds.has(id));
  return filtered.length ? [...new Set(filtered)] : ["A001"];
}

function stakeholderNames(actorIds) {
  const lookup = new Map(state.stakeholders.map((item) => [item.id, item.label]));
  return normalizeActorIds(actorIds).map((id) => lookup.get(id) || id).join("、");
}

function render() {
  saveState();
  renderSummary();
  renderStakeholderList();
  renderStakeholderOptions();
  renderTimeline();
  renderLaneChart();
  renderEventsTable();
  renderDraftList();
  renderHistoryGuide();
  renderContextIndex();
  renderDecisionCards();
  renderSafetyList();
  updateExportProbe();
}

function renderSummary() {
  $("#metricEvents").textContent = state.events.length;
  $("#metricDecisions").textContent = state.decisions.length;
  $("#metricCovered").textContent = `${new Set(state.events.map((e) => normalizeLane(e.lane)).filter((lane) => lanes.includes(lane))).size}/${lanes.length}`;
  $("#metricMoney").textContent = state.events.filter((e) => normalizeLane(e.lane) === "重大財務事件").length;
  $("#metricSensitive").textContent = state.events.filter((e) => ["高度敏感", "不可外部分享"].includes(e.sensitivity)).length;
  $("#metricStakeholders").textContent = state.stakeholders.filter((item) => item.id !== "A001").length;
  $("#metricPending").textContent = state.events.filter((e) => e.confidence === "低").length;
}

function renderStakeholderList() {
  const target = $("#stakeholderList");
  if (!target) return;
  target.innerHTML = state.stakeholders.map((item) => `
    <article class="stakeholder-card">
      <div>
        <h3>${esc(item.label)}</h3>
        <p>${esc(item.relation)} / ${esc(item.stance)}</p>
      </div>
      <span class="badge ${item.sensitivity === "高度敏感" || item.sensitivity === "不可外部分享" ? "red" : "amber"}">${esc(item.sensitivity)}</span>
      <p class="full">${esc(item.notes || "尚未補充關係脈絡。")}</p>
      ${item.id === "A001" ? "" : `<button type="button" data-delete-stakeholder="${esc(item.id)}">移除</button>`}
    </article>
  `).join("");
}

function renderStakeholderOptions() {
  const html = state.stakeholders.map((item) => `
    <label class="choice-item">
      <input type="checkbox" name="actorIds" value="${esc(item.id)}" ${item.id === "A001" ? "checked" : ""} />
      <span>${esc(item.label)}</span>
    </label>
  `).join("");
  const eventOptions = $("#eventStakeholderOptions");
  const decisionOptions = $("#decisionStakeholderOptions");
  if (eventOptions) eventOptions.innerHTML = html;
  if (decisionOptions) decisionOptions.innerHTML = html;
}

function renderTimeline() {
  const chart = $("#timelineChart");
  const years = state.events.map((e) => Number(e.rocYear)).filter(Boolean);
  const min = Math.min(...years, 75);
  const max = Math.max(...years, 114);
  const span = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  chart.style.setProperty("--year-count", span.length);
  const label = (year) => state.yearMode === "ad" ? year + 1911 : year;
  let html = `<div class="timeline-grid"><div class="timeline-cell timeline-head">歷程</div>`;
  html += span.map((year) => `<div class="timeline-cell timeline-head">${label(year)}</div>`).join("");
  for (const lane of lanes) {
    html += `<div class="timeline-cell lane-label">${lane}</div>`;
    for (const year of span) {
      const events = state.events.filter((e) => normalizeLane(e.lane) === lane && Number(e.rocYear) === year);
      html += `<div class="timeline-cell">${events.map(eventPill).join("")}</div>`;
    }
  }
  html += "</div>";
  chart.innerHTML = html;
}

function eventPill(event) {
  const classes = ["event-pill", laneClass(event.lane)];
  if (["高度敏感", "不可外部分享"].includes(event.sensitivity)) classes.push("sensitive");
  return `<span class="${classes.join(" ")}"><strong>${esc(event.title)}</strong><br><small>${esc(event.age || "")}歲 ${esc(event.sensitivity)} ${esc(event.confidence || "")}</small></span>`;
}

function laneClass(lane) {
  const normalized = normalizeLane(lane);
  return ({
    "居住遷移史": "residence",
    "就業與就學史": "work",
    "感情與家庭史": "relationship",
    "疾病與身心健康史": "health",
    "社會資源使用歷程": "resource",
    "重大財務事件": "money"
  })[normalized] || "resource";
}

function renderLaneChart() {
  const counts = lanes.map((lane) => ({ lane, count: state.events.filter((e) => normalizeLane(e.lane) === lane).length }));
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
      <td>${esc(normalizeLane(e.lane))}</td>
      <td>
        <div class="event-detail">
          <strong>${esc(e.title)}</strong>
          <span>${esc(e.fact)}</span>
          <span><em>關係人</em> ${esc(stakeholderNames(e.actorIds))}</span>
          <span><em>影響</em> ${esc(e.impact || "待補")}</span>
          <span><em>待釐清</em> ${esc(e.unknowns || "待補")}</span>
        </div>
      </td>
      <td><span class="badge ${e.sensitivity === "高度敏感" || e.sensitivity === "不可外部分享" ? "red" : ""}">${esc(e.sensitivity)}</span></td>
      <td>${esc(e.nextStep || "")}</td>
      <td class="row-actions"><button type="button" data-delete-event="${esc(e.id)}">刪除</button></td>
    </tr>
  `).join("");
}

function renderDraftList() {
  const target = $("#draftList");
  if (!target) return;
  if (!state.drafts.length) {
    target.innerHTML = `<div class="field-note">尚無待確認草稿。貼上文字、上傳檔案或語音輸入後，按「分析成待確認草稿」。</div>`;
    return;
  }
  target.innerHTML = state.drafts.map((draft, index) => draft.type === "decision" ? decisionDraftCard(draft, index) : eventDraftCard(draft, index)).join("");
}

function eventDraftCard(draft, index) {
  const laneOptions = lanes.map((lane) => `<option ${lane === draft.lane ? "selected" : ""}>${esc(lane)}</option>`).join("");
  const sensitivity = ["一般", "內部", "高度敏感", "不可外部分享"].map((value) => `<option ${value === draft.sensitivity ? "selected" : ""}>${value}</option>`).join("");
  const confidence = ["低", "中", "高"].map((value) => `<option ${value === draft.confidence ? "selected" : ""}>${value}</option>`).join("");
  return `
    <article class="draft-card" data-draft-card="${index}">
      <h3>事件草稿 ${esc(draft.title || "未命名")}</h3>
      <div class="draft-grid">
        <label>民國年<input data-draft-field="rocYear" value="${esc(draft.rocYear || "")}" /></label>
        <label>案主年齡<input data-draft-field="age" value="${esc(draft.age || "")}" /></label>
        <label>歷程面向<select data-draft-field="lane">${laneOptions}</select></label>
        <label>敏感度<select data-draft-field="sensitivity">${sensitivity}</select></label>
        <label>信心<select data-draft-field="confidence">${confidence}</select></label>
        <label class="full">事件標題<input data-draft-field="title" value="${esc(draft.title || "")}" /></label>
        <label class="full">事件事實<textarea data-draft-field="fact" rows="3">${esc(draft.fact || "")}</textarea></label>
        <label class="full">案主說法<textarea data-draft-field="voice" rows="2">${esc(draft.voice || "")}</textarea></label>
        <label class="full">脈絡影響<textarea data-draft-field="impact" rows="2">${esc(draft.impact || "")}</textarea></label>
        <label class="full">待釐清<textarea data-draft-field="unknowns" rows="2">${esc(draft.unknowns || "")}</textarea></label>
      </div>
      <div class="draft-actions">
        <button type="button" data-confirm-draft="${index}">確認加入時間軸</button>
        <button type="button" data-discard-draft="${index}">略過</button>
      </div>
    </article>`;
}

function decisionDraftCard(draft, index) {
  return `
    <article class="draft-card" data-draft-card="${index}">
      <h3>決策草稿 ${esc(draft.question || "未命名")}</h3>
      <div class="draft-grid">
        <label>連結事件 ID<input data-draft-field="eventId" value="${esc(draft.eventId || "")}" /></label>
        <label>信心<input data-draft-field="confidence" value="${esc(draft.confidence || "低")}" /></label>
        <label class="full">決策問題<input data-draft-field="question" value="${esc(draft.question || "")}" /></label>
        <label class="full">當時可行選項<textarea data-draft-field="options" rows="2">${esc(draft.options || "")}</textarea></label>
        <label class="full">最大擔心<textarea data-draft-field="fear" rows="2">${esc(draft.fear || "")}</textarea></label>
        <label class="full">脈絡解讀<textarea data-draft-field="interpretation" rows="3">${esc(draft.interpretation || "")}</textarea></label>
      </div>
      <div class="draft-actions">
        <button type="button" data-confirm-draft="${index}">確認加入決策卡</button>
        <button type="button" data-discard-draft="${index}">略過</button>
      </div>
    </article>`;
}

function updateDraftFromField(target) {
  const card = target.closest("[data-draft-card]");
  if (!card) return;
  const index = Number(card.dataset.draftCard);
  const field = target.dataset.draftField;
  if (!Number.isInteger(index) || !field || !state.drafts[index]) return;
  state.drafts[index][field] = target.value;
  saveState();
}

function confirmDraft(index) {
  const draft = state.drafts[index];
  if (!draft) return;
  if (draft.type === "decision") {
    state.decisions.push({
      id: nextId("D", state.decisions),
      eventId: draft.eventId || "",
      question: draft.question || "待補決策問題",
      actorIds: normalizeActorIds(draft.actorIds),
      options: draft.options || "待補當時可行選項",
      fear: draft.fear || "待補最大擔心",
      interpretation: draft.interpretation || "待補脈絡解讀"
    });
  } else {
    state.events.push({
      id: nextId("E", state.events),
      rocYear: Number(draft.rocYear || 0),
      age: Number(draft.age || 0),
      lane: normalizeLane(draft.lane),
      title: draft.title || "待補事件標題",
      fact: draft.fact || "待補事件事實",
      voice: draft.voice || "",
      source: draft.source || "AI 匯入草稿",
      actorIds: normalizeActorIds(draft.actorIds),
      sensitivity: draft.sensitivity || "內部",
      confidence: draft.confidence || "低",
      impact: draft.impact || "待補脈絡影響",
      unknowns: draft.unknowns || "待補待釐清",
      nextStep: draft.nextStep || "社工已確認草稿後加入；下次會談補證據。"
    });
  }
  state.drafts.splice(index, 1);
  render();
}

function renderHistoryGuide() {
  const target = $("#historyGuide");
  if (!target) return;
  target.innerHTML = historyGuides.map((item) => `
    <article class="guide-card">
      <h3>${esc(item.name)}</h3>
      <p>${esc(item.focus)}</p>
      <dl>
        <dt>看什麼</dt><dd>${esc(item.lookFor)}</dd>
        <dt>怎麼讀</dt><dd>${esc(item.decisionMeaning)}</dd>
        <dt>界線</dt><dd>${esc(item.caution)}</dd>
      </dl>
    </article>
  `).join("");
}

function renderContextIndex() {
  const target = $("#contextIndex");
  if (!target) return;
  target.innerHTML = contextRows.map(([topic, period, use, source]) => `
    <article class="context-row">
      <h3>${esc(topic)}</h3>
      <p><strong>${esc(period)}</strong> ${esc(use)}</p>
      <a href="${esc(source)}" target="_blank" rel="noopener noreferrer">來源</a>
    </article>
  `).join("");
}

function renderDecisionCards() {
  $("#decisionCards").innerHTML = state.decisions.map((d) => `
    <article class="decision-card">
      <h3>${esc(d.id)} ${esc(d.question)}</h3>
      <dl>
        <dt>連結事件</dt><dd>${esc(d.eventId || "未連結")}</dd>
        <dt>相關關係人</dt><dd>${esc(stakeholderNames(d.actorIds))}</dd>
        <dt>當時可行選項</dt><dd>${esc(d.options)}</dd>
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
  probe.dataset.stakeholderCount = String(state.stakeholders.length);
  probe.dataset.draftCount = String(state.drafts.length);
  probe.dataset.historyCoverage = String(new Set(state.events.map((e) => normalizeLane(e.lane)).filter((lane) => lanes.includes(lane))).size);
  probe.dataset.sheetCount = String(workbookSheetNames.length);
  probe.dataset.historyGuideCount = String(historyGuides.length);
  probe.dataset.researchRows = String(researchRows.length);
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

  $("#stakeholderForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    state.stakeholders.push({
      id: nextId("A", state.stakeholders),
      label: data.label,
      relation: data.relation,
      stance: data.stance,
      sensitivity: data.sensitivity,
      notes: data.notes
    });
    event.currentTarget.reset();
    render();
  });

  $("#eventForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData);
    state.events.push({
      id: nextId("E", state.events),
      rocYear: Number(data.rocYear),
      age: Number(data.age || 0),
      lane: normalizeLane(data.lane),
      title: data.title,
      fact: data.fact,
      voice: data.voice,
      source: "使用者新增",
      actorIds: normalizeActorIds(formData.getAll("actorIds")),
      sensitivity: data.sensitivity,
      confidence: data.confidence,
      impact: data.impact,
      unknowns: data.unknowns,
      nextStep: data.confidence === "低" ? "補來源與當事人確認" : "納入下一次討論"
    });
    render();
  });

  $("#decisionForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData);
    state.decisions.push({
      id: nextId("D", state.decisions),
      eventId: data.eventId,
      question: data.question,
      actorIds: normalizeActorIds(formData.getAll("actorIds")),
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
    const stakeholderId = event.target?.dataset?.deleteStakeholder;
    if (stakeholderId) {
      state.stakeholders = state.stakeholders.filter((item) => item.id !== stakeholderId);
      state.events = state.events.map((item) => ({ ...item, actorIds: normalizeActorIds((item.actorIds || []).filter((id) => id !== stakeholderId)) }));
      state.decisions = state.decisions.map((item) => ({ ...item, actorIds: normalizeActorIds((item.actorIds || []).filter((id) => id !== stakeholderId)) }));
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

  $("#aiInputForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const formText = new FormData(event.currentTarget).get("intakeText") || "";
    const combined = $("#aiCombinedText").value || "";
    const text = [formText, combined].map((part) => String(part).trim()).filter(Boolean).join("\n\n");
    await analyzeIntakeText(text);
  });

  $("#fileInput").addEventListener("change", async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    $("#fileStatus").textContent = `讀取 ${files.length} 個檔案中...`;
    const results = [];
    for (const file of files) results.push(await extractFileText(file));
    const usableText = results.map((item) => item.text).filter(Boolean).join("\n\n");
    $("#aiCombinedText").value = [$("#aiCombinedText").value, usableText].map((part) => part.trim()).filter(Boolean).join("\n\n");
    $("#fileStatus").textContent = results.map((item) => `${item.name}: ${item.note}`).join("；");
  });

  $("#startVoice").addEventListener("click", startVoiceInput);
  $("#stopVoice").addEventListener("click", stopVoiceInput);

  $("#clearDrafts").addEventListener("click", () => {
    state.drafts = [];
    render();
  });

  $("#draftList").addEventListener("input", (event) => updateDraftFromField(event.target));
  $("#draftList").addEventListener("change", (event) => updateDraftFromField(event.target));
  $("#draftList").addEventListener("click", (event) => {
    const confirmIndex = event.target?.dataset?.confirmDraft;
    const discardIndex = event.target?.dataset?.discardDraft;
    if (confirmIndex !== undefined) confirmDraft(Number(confirmIndex));
    if (discardIndex !== undefined) {
      state.drafts.splice(Number(discardIndex), 1);
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

async function analyzeIntakeText(text) {
  const cleanText = String(text || "").trim();
  if (cleanText.length < 6) {
    setAiStatus("請先輸入或匯入足夠文字。");
    return;
  }
  setAiStatus("分析中；完成後會先放入待確認草稿。");
  let analysis = null;
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: cleanText, locale: "zh-Hant-TW", lanes })
    });
    if (response.ok) analysis = await response.json();
  } catch (_) {
    analysis = null;
  }
  const drafts = normalizeAnalysisDrafts(analysis, cleanText);
  state.drafts = [...drafts, ...state.drafts].slice(0, 20);
  render();
  const mode = analysis?.mode === "openai" ? "AI 輔助整理" : "初步規則整理";
  setAiStatus(`${mode}完成：產生 ${drafts.length} 筆待確認草稿。請社工逐筆確認後再加入時間軸。`);
}

function normalizeAnalysisDrafts(analysis, fallbackText) {
  const apiDrafts = [
    ...(Array.isArray(analysis?.events) ? analysis.events.map((item) => normalizeEventDraft(item)) : []),
    ...(Array.isArray(analysis?.decisions) ? analysis.decisions.map((item) => normalizeDecisionDraft(item)) : [])
  ].filter(Boolean);
  if (analysis?.mode === "openai" && apiDrafts.length) return apiDrafts;
  return localSemanticDrafts(fallbackText);
}

function normalizeEventDraft(item) {
  if (!item) return null;
  const lane = normalizeLane(item.lane || detectLane([item.title, item.fact, item.voice].join(" ")));
  return {
    type: "event",
    rocYear: item.rocYear || "",
    age: item.age || "",
    lane,
    title: item.title || "待確認事件",
    fact: item.fact || "",
    voice: item.voice || "",
    impact: item.impact || guideForLane(lane).decisionMeaning,
    unknowns: item.unknowns || guideForLane(lane).lookFor,
    sensitivity: item.sensitivity || defaultSensitivity(lane),
    confidence: item.confidence || "低",
    source: "AI 匯入草稿",
    nextStep: "社工確認後加入；必要時補來源與佐證。"
  };
}

function normalizeDecisionDraft(item) {
  if (!item) return null;
  return {
    type: "decision",
    eventId: item.eventId || "",
    question: item.question || "待確認決策問題",
    options: item.options || "待補當時可行選項",
    fear: item.fear || "待補最大擔心",
    interpretation: item.interpretation || "待補脈絡解讀",
    confidence: item.confidence || "低"
  };
}

function localSemanticDrafts(text) {
  const sentences = String(text)
    .replace(/\s+/g, " ")
    .split(/(?<=[。！？!?])|\n|；|;/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 8);
  const selected = sentences.length ? sentences.slice(0, 6) : [String(text).slice(0, 140)];
  const eventDrafts = selected.map((sentence) => {
    const lane = detectLane(sentence);
    const guide = guideForLane(lane);
    return {
      type: "event",
      rocYear: extractRocYear(sentence),
      age: extractAge(sentence),
      lane,
      title: titleFromSentence(sentence, lane),
      fact: sentence,
      voice: extractVoice(sentence),
      impact: guide.decisionMeaning,
      unknowns: guide.lookFor,
      sensitivity: defaultSensitivity(lane),
      confidence: extractRocYear(sentence) ? "中" : "低",
      source: "初步整理草稿",
      nextStep: "社工確認後加入；必要時補來源與佐證。"
    };
  });
  const decisionDrafts = /選擇|決定|是否|要不要|協商|搬|工作|繳|還款|借|轉介|申請/.test(text)
    ? [{
        type: "decision",
        eventId: "",
        question: "目前資料中需要釐清的關鍵決策是什麼？",
        options: "維持現況、補文件、連結資源、暫緩、轉介專業、調整支出或還款安排。",
        fear: "可能擔心居住、照顧、工作、福利資格或催收風險被影響。",
        interpretation: "此草稿由本機規則產生；請社工依會談資料確認當時資訊、可行選項與壓力來源。",
        confidence: "低"
      }]
    : [];
  return [...eventDrafts, ...decisionDrafts];
}

function detectLane(text) {
  const value = String(text || "");
  const rules = [
    ["重大財務事件", /卡債|信用卡|債|借|貸款|錢莊|欠|利息|協商|還款|帳戶|存款|保險|財務|金錢|繳/],
    ["社會資源使用歷程", /低收|中低收|急難|補助|社工|政府|方案|轉介|法扶|網絡|服務|資格|文件|兒少教育發展帳戶/],
    ["疾病與身心健康史", /疾病|生病|就醫|醫院|精神|憂鬱|焦慮|健康|長照|照顧者|失能|醫療/],
    ["感情與家庭史", /感情|交往|婚|離婚|伴侶|先生|太太|孩子|小孩|扶養|家暴|親職|家庭/],
    ["就業與就學史", /工作|就業|就學|學校|學歷|職訓|薪水|收入|失業|工時|留停/],
    ["居住遷移史", /居住|租屋|搬家|搬|遷|住宿|戶籍|房租|安置|中途之家|住所/]
  ];
  return rules.find(([, pattern]) => pattern.test(value))?.[0] || "重大財務事件";
}

function guideForLane(lane) {
  const normalized = normalizeLane(lane);
  return historyGuides.find((item) => item.name === normalized) || historyGuides[historyGuides.length - 1];
}

function defaultSensitivity(lane) {
  const normalized = normalizeLane(lane);
  if (normalized === "疾病與身心健康史" || normalized === "重大財務事件") return "高度敏感";
  if (normalized === "感情與家庭史" || normalized === "社會資源使用歷程") return "內部";
  return "一般";
}

function extractRocYear(text) {
  const value = String(text || "");
  const roc = value.match(/民國\s*(\d{2,3})\s*年?/);
  if (roc) return Number(roc[1]);
  const ad = value.match(/(19|20)\d{2}\s*年/);
  if (ad) return Number(ad[0].replace(/\D/g, "")) - 1911;
  const shortYear = value.match(/(^|[^\d])(\d{2,3})\s*年/);
  if (shortYear) return Number(shortYear[2]);
  return "";
}

function extractAge(text) {
  const match = String(text || "").match(/(\d{1,3})\s*歲/);
  return match ? Number(match[1]) : "";
}

function extractVoice(text) {
  const match = String(text || "").match(/[「『\"]([^」』\"]{3,80})[」』\"]/);
  return match ? match[1] : "";
}

function titleFromSentence(sentence, lane) {
  const cleaned = String(sentence || "").replace(/[，。！？、；:：]/g, " ").replace(/\s+/g, " ").trim();
  const title = cleaned.slice(0, 18);
  return title ? `${lane}：${title}` : `${lane}草稿`;
}

function setAiStatus(message) {
  const target = $("#aiStatus");
  if (target) target.textContent = message;
}

async function extractFileText(file) {
  const name = file.name || "未命名檔案";
  const ext = name.toLowerCase().split(".").pop() || "";
  if (["txt", "csv", "md"].includes(ext) || file.type.startsWith("text/")) {
    return { name, text: await file.text(), note: "已讀取文字內容" };
  }
  if (["pdf", "docx", "xlsx"].includes(ext)) {
    try {
      return await extractFileTextViaApi(file);
    } catch (_) {
      // Local static previews do not expose Vercel API routes; fall back to manual summary guidance.
    }
  }
  if (ext === "pdf") {
    const raw = await file.text();
    const extracted = raw.replace(/[^\u4e00-\u9fff\u3000-\u303f\uff00-\uffefa-zA-Z0-9，。！？；、：\s]/g, " ").replace(/\s+/g, " ").trim();
    if (extracted.length > 80) return { name, text: `檔案：${name}\n${extracted.slice(0, 8000)}`, note: "已做 PDF 粗略文字抽取" };
    return { name, text: `檔案：${name}\nPDF 已上傳，但目前無法可靠抽取文字；掃描影像 PDF 請先 OCR 或貼上摘要。`, note: "PDF 需文字層或 OCR" };
  }
  if (["doc", "docx", "xls", "xlsx"].includes(ext)) {
    return { name, text: `檔案：${name}\nWord/Excel 已選取；DOCX/XLSX 可由系統嘗試抽取，舊版 DOC/XLS 請轉存或貼上摘要文字。`, note: "Word/Excel 需可讀格式" };
  }
  return { name, text: `檔案：${name}\n檔案類型尚未支援自動抽取，請貼上摘要文字。`, note: "類型未支援" };
}

async function extractFileTextViaApi(file) {
  const base64 = await fileToBase64(file);
  const response = await fetch("/api/extract-file", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: file.name,
      mimeType: file.type,
      base64
    })
  });
  if (!response.ok) throw new Error("file extract api unavailable");
  const result = await response.json();
  return {
    name: result.name || file.name,
    text: `檔案：${result.name || file.name}\n${result.text || ""}`,
    note: result.note || "已抽取檔案文字"
  };
}

async function fileToBase64(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

let voiceRecognition = null;

function startVoiceInput() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    setAiStatus("此瀏覽器不支援內建語音辨識；可以先用文字貼上。");
    return;
  }
  voiceRecognition = new Recognition();
  voiceRecognition.lang = "zh-TW";
  voiceRecognition.continuous = true;
  voiceRecognition.interimResults = true;
  voiceRecognition.onresult = (event) => {
    let finalText = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) finalText += event.results[i][0].transcript;
    }
    if (finalText) {
      $("#aiCombinedText").value = [$("#aiCombinedText").value, finalText].map((part) => part.trim()).filter(Boolean).join("\n");
    }
  };
  voiceRecognition.onerror = () => setAiStatus("語音辨識中斷；可改用文字輸入。");
  voiceRecognition.onstart = () => setAiStatus("語音輸入中；請用假資料測試，真實個資需在機構規範內使用。");
  voiceRecognition.onend = () => setAiStatus("語音輸入已停止。");
  voiceRecognition.start();
}

function stopVoiceInput() {
  if (voiceRecognition) voiceRecognition.stop();
}

function buildXlsx() {
  const sheets = [
    {
      name: "事件時間軸",
      rows: [
        ["ID", "民國年", "西元年", "年齡", "歷程面向", "事件標題", "事件事實", "案主說法", "相關關係人", "脈絡影響", "待釐清", "來源", "敏感度", "信心", "下一步"],
        ...state.events.map((e) => [e.id, e.rocYear, Number(e.rocYear) + 1911, e.age, normalizeLane(e.lane), e.title, e.fact, e.voice, stakeholderNames(e.actorIds), e.impact || "", e.unknowns || "", e.source, e.sensitivity, e.confidence, e.nextStep])
      ]
    },
    {
      name: "決策節點卡",
      rows: [
        ["ID", "連結事件", "決策問題", "相關關係人", "當時可行選項", "最大擔心", "脈絡解讀"],
        ...state.decisions.map((d) => [d.id, d.eventId, d.question, stakeholderNames(d.actorIds), d.options, d.fear, d.interpretation])
      ]
    },
    {
      name: "關係人",
      rows: [
        ["ID", "稱謂或角色", "與案主關係", "目前互動狀態", "敏感度", "關係脈絡"],
        ...state.stakeholders.map((item) => [item.id, item.label, item.relation, item.stance, item.sensitivity, item.notes])
      ]
    },
    {
      name: "待確認草稿",
      rows: [
        ["類型", "歷程/連結事件", "標題/問題", "事實/選項", "案主說法/最大擔心", "脈絡影響", "待釐清/解讀", "信心"],
        ...state.drafts.map((draft) => draft.type === "event"
          ? ["事件", normalizeLane(draft.lane), draft.title, draft.fact, draft.voice, draft.impact, draft.unknowns, draft.confidence]
          : ["決策", draft.eventId, draft.question, draft.options, draft.fear, "", draft.interpretation, draft.confidence || "低"])
      ]
    },
    {
      name: "六大歷程解讀",
      rows: [
        ["歷程", "整理重點", "觀察線索", "決策解讀", "資料界線"],
        ...historyGuides.map((item) => [item.name, item.focus, item.lookFor, item.decisionMeaning, item.caution])
      ]
    },
    {
      name: "台灣制度背景",
      rows: [["主題", "時間/制度", "用途", "來源"], ...contextRows]
    },
    {
      name: "研究依據摘要",
      rows: [["來源類型", "研究觀察", "工具設計回應"], ...researchRows]
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
      stakeholderCount: state.stakeholders.length,
      draftCount: state.drafts.length,
      historyCoverage: new Set(state.events.map((e) => normalizeLane(e.lane)).filter((lane) => lanes.includes(lane))).size,
      sheetCount: workbookSheetNames.length,
      historyGuideCount: historyGuides.length,
      researchRows: researchRows.length,
      workbookSheetNames,
      xlsxSize: blob.size,
      mimeType: blob.type
    };
  }
};
