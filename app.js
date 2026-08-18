const CURRENT_VERSION = "v0.43-ai-voice-assisted-timeline";
const SIMPLE_STATE_KEY = "caseTimelineSimpleEvents:v1";
const LEGACY_STATE_KEY = "caseTimelineToolState";
const TAIPEI_TIME_ZONE = "Asia/Taipei";
const lanes = [
  "居住遷移史",
  "就業與就學史",
  "感情與家庭史",
  "疾病與身心健康史",
  "社會資源使用歷程",
  "重大財務事件"
];
const laneAliases = {
  "就業就學史": "就業與就學史",
  "感情家庭史": "感情與家庭史",
  "疾病身心史": "疾病與身心健康史",
  "疾病健康史": "疾病與身心健康史"
};
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

let events = loadEvents();
let drafts = [];
let voiceRecognition = null;
let voiceActive = false;
let voiceBaseText = "";
let voiceErrorMessage = "";
let aiSourceMode = "text";
let activeDialogEventId = "";
let lastDialogTrigger = null;
let lastInputDialogTrigger = null;
let restoreInputFocusOnClose = true;
let aiLoading = false;
let syncingTimelineScroll = false;

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function normalizeLane(value) {
  const normalized = laneAliases[value] || value;
  return lanes.includes(normalized) ? normalized : "重大財務事件";
}

function normalizeMonth(value) {
  const month = Number(value);
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : "";
}

function normalizeYear(value) {
  const year = Number(value);
  return Number.isInteger(year) && year > 0 && year <= 200 ? year : "";
}

function currentRocYear() {
  const adYear = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: TAIPEI_TIME_ZONE,
    year: "numeric"
  }).format(new Date()));
  return adYear - 1911;
}

function newEventId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function legacyActor(event, stakeholders = []) {
  const direct = String(event.actor || event.primaryActor || event.actorText || "").trim();
  if (direct) return direct;
  const ids = Array.isArray(event.actorIds) ? event.actorIds : [];
  const names = ids.map((id) => stakeholders.find((person) => person.id === id)?.label).filter(Boolean);
  return names.join("、") || "案主";
}

function normalizeEvent(event, stakeholders = []) {
  const summary = String(event.summary || event.fact || event.title || "").trim();
  return {
    id: String(event.id || newEventId()),
    rocYear: normalizeYear(event.rocYear ?? event.year),
    rocMonth: normalizeMonth(event.rocMonth ?? event.month),
    actor: legacyActor(event, stakeholders),
    lane: normalizeLane(event.lane || event.category),
    summary
  };
}

function parseJson(value) {
  try {
    return JSON.parse(value);
  } catch (_) {
    return null;
  }
}

function loadEvents() {
  const simple = parseJson(localStorage.getItem(SIMPLE_STATE_KEY));
  if (Array.isArray(simple?.events)) return simple.events.map((event) => normalizeEvent(event)).filter(validStoredEvent);

  const legacy = parseJson(localStorage.getItem(LEGACY_STATE_KEY));
  if (Array.isArray(legacy?.events)) {
    const migrated = legacy.events.map((event) => normalizeEvent(event, legacy.stakeholders || [])).filter(validStoredEvent);
    if (migrated.length) {
      localStorage.setItem(SIMPLE_STATE_KEY, JSON.stringify({ version: CURRENT_VERSION, migratedFrom: LEGACY_STATE_KEY, events: migrated }));
    }
    return migrated;
  }
  return [];
}

function validStoredEvent(event) {
  return Boolean(event.rocYear && event.actor && event.lane && event.summary);
}

function saveEvents() {
  localStorage.setItem(SIMPLE_STATE_KEY, JSON.stringify({ version: CURRENT_VERSION, events }));
}

function eventSortValue(event) {
  return Number(event.rocYear) * 13 + (normalizeMonth(event.rocMonth) || 13);
}

function sortedEvents(list = events) {
  return [...list].sort((a, b) => eventSortValue(a) - eventSortValue(b) || a.actor.localeCompare(b.actor, "zh-Hant") || a.id.localeCompare(b.id));
}

function periodKey(event) {
  return `${event.rocYear}-${event.rocMonth || 0}`;
}

function periodLabel(year, month) {
  return `民國 ${year} 年${month ? ` ${month} 月` : "・月份待確認"}`;
}

function compactPeriodLabel(year, month) {
  return month ? `${year} 年 ${month} 月` : `${year} 年・月份待確認`;
}

function laneClass(lane) {
  return ({
    "居住遷移史": "residence",
    "就業與就學史": "work",
    "感情與家庭史": "family",
    "疾病與身心健康史": "health",
    "社會資源使用歷程": "resource",
    "重大財務事件": "money"
  })[normalizeLane(lane)] || "money";
}

function showTool() {
  $("#toolApp").hidden = false;
  renderAll();
}

function setInputMode(mode, { focus = true } = {}) {
  const manualMode = mode === "manual";
  if (manualMode) stopVoice({ abort: true, silent: true });
  $("#manualPanel").hidden = !manualMode;
  $("#aiPanel").hidden = manualMode;
  $("#manualModeButton").classList.toggle("active", manualMode);
  $("#aiModeButton").classList.toggle("active", !manualMode);
  $("#manualModeButton").setAttribute("aria-selected", String(manualMode));
  $("#aiModeButton").setAttribute("aria-selected", String(!manualMode));
  $("#manualModeButton").tabIndex = manualMode ? 0 : -1;
  $("#aiModeButton").tabIndex = manualMode ? -1 : 0;
  if (focus) requestAnimationFrame(() => {
    if (manualMode) $("#eventYear").focus();
    else if (aiSourceMode === "voice") $("#startVoice").focus();
    else $("#aiInputText").focus();
  });
}

function openInputDialog({ event = null, trigger = null } = {}) {
  lastInputDialogTrigger = trigger || document.activeElement;
  restoreInputFocusOnClose = true;
  resetManualForm();
  resetAiPanel();
  if (event) fillManualForm(event);
  $("#inputModeSwitch").hidden = Boolean(event);
  setInputMode("manual", { focus: false });
  const dialogTitle = event ? "編輯事件" : "新增事件";
  $("#inputDialogTitle").textContent = dialogTitle;
  $("#closeInputDialog").setAttribute("aria-label", `關閉${dialogTitle}視窗`);
  if (!$("#inputDialog").open) $("#inputDialog").showModal();
  requestAnimationFrame(() => $("#eventYear").focus());
}

function showManual(event = null, trigger = null) {
  openInputDialog({ event, trigger });
}

function closeInputDialog({ restoreFocus = true } = {}) {
  if (aiLoading) return;
  stopVoice({ abort: true, silent: true });
  restoreInputFocusOnClose = restoreFocus;
  if ($("#inputDialog").open) $("#inputDialog").close();
}

function resetManualForm() {
  $("#eventForm").reset();
  $("#eventId").value = "";
  $("#eventYear").value = currentRocYear();
  $("#eventMonth").value = "";
  $("#eventLane").value = "居住遷移史";
  $("#saveEventButton").textContent = "加入時間軸";
  $("#cancelEditButton").hidden = true;
  $("#manualStatus").textContent = "";
}

function fillManualForm(event) {
  $("#eventId").value = event.id;
  $("#eventYear").value = event.rocYear;
  $("#eventMonth").value = event.rocMonth || "";
  $("#eventActor").value = event.actor;
  $("#eventLane").value = event.lane;
  $("#eventSummary").value = event.summary;
  $("#saveEventButton").textContent = "儲存變更";
  $("#cancelEditButton").hidden = false;
}

function eventFromForm(form) {
  const data = Object.fromEntries(new FormData(form));
  return normalizeEvent({
    id: data.eventId || newEventId(),
    rocYear: data.rocYear,
    rocMonth: data.rocMonth,
    actor: data.actor,
    lane: data.lane,
    summary: data.summary
  });
}

function saveManualEvent(form) {
  const next = eventFromForm(form);
  if (!validStoredEvent(next)) {
    $("#manualStatus").textContent = "請完成年度、事件人物、事件大分類與事件摘要。";
    return;
  }
  const existingIndex = events.findIndex((event) => event.id === next.id);
  if (existingIndex >= 0) events[existingIndex] = next;
  else events.push(next);
  saveEvents();
  renderAll();
  closeInputDialog({ restoreFocus: false });
  requestAnimationFrame(() => {
    scrollToEvent(next.id);
    openEventDialog(next.id, document.querySelector(`[data-event-id="${CSS.escape(next.id)}"]`));
  });
}

function resetAiPanel() {
  stopVoice({ abort: true, silent: true });
  setAiSourceMode("text", { focus: false });
  $("#aiInputText").value = "";
  $("#aiStatus").textContent = "AI 會辨識年月、人物、分類與事件摘要；沒有月份時保留待確認。";
  $("#voiceStatus").textContent = "辨識文字會出現在下方，可先修改再整理。";
  drafts = [];
  renderDrafts();
}

function setAiSourceMode(mode, { focus = true } = {}) {
  const voiceMode = mode === "voice";
  aiSourceMode = voiceMode ? "voice" : "text";
  $("#aiTextSource").classList.toggle("active", !voiceMode);
  $("#aiVoiceSource").classList.toggle("active", voiceMode);
  $("#aiTextSource").setAttribute("aria-pressed", String(!voiceMode));
  $("#aiVoiceSource").setAttribute("aria-pressed", String(voiceMode));
  $("#voiceControls").hidden = !voiceMode;
  $("#aiInputLabelText").textContent = voiceMode ? "語音辨識結果（可修改）" : "貼上待整理內容";
  if (!voiceMode) stopVoice({ abort: true, silent: true });
  if (focus) requestAnimationFrame(() => (voiceMode ? $("#startVoice") : $("#aiInputText")).focus());
}

function updateVoiceControls() {
  $("#startVoice").disabled = aiLoading || voiceActive;
  $("#stopVoice").disabled = aiLoading || !voiceActive;
  $("#analyzeButton").disabled = aiLoading || voiceActive;
  $("#aiInputText").readOnly = voiceActive;
  $("#aiInputText").setAttribute("aria-busy", String(voiceActive));
}

function setAiLoading(loading) {
  aiLoading = loading;
  $("#analyzeButton").textContent = loading ? "整理中…" : "整理成待確認草稿";
  ["closeInputDialog", "manualModeButton", "aiModeButton", "aiTextSource", "aiVoiceSource"].forEach((id) => {
    $("#" + id).disabled = loading;
  });
  updateVoiceControls();
}

function voiceErrorText(error) {
  return ({
    "not-allowed": "無法使用麥克風，請允許此網站存取麥克風後再試一次。",
    "service-not-allowed": "瀏覽器未允許語音辨識服務，請改用文字輸入。",
    "audio-capture": "找不到可用的麥克風，請檢查裝置後再試一次。",
    "no-speech": "沒有聽到語音，請靠近麥克風後再試一次。",
    "network": "語音辨識服務連線失敗，請稍後重試或改用文字輸入。"
  })[error] || "語音辨識中斷，請重試或改用文字輸入。";
}

function startVoice() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    $("#voiceStatus").textContent = "此瀏覽器不支援內建語音辨識，請改用文字輸入。";
    return;
  }

  stopVoice({ abort: true, silent: true });
  const recognition = new Recognition();
  voiceRecognition = recognition;
  voiceActive = true;
  voiceBaseText = $("#aiInputText").value.trim();
  voiceErrorMessage = "";
  recognition.lang = "zh-TW";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    if (voiceRecognition !== recognition) return;
    $("#voiceStatus").textContent = "語音輸入中，辨識文字會即時出現在下方。";
    updateVoiceControls();
  };
  recognition.onresult = (event) => {
    if (voiceRecognition !== recognition) return;
    const finalParts = [];
    const interimParts = [];
    for (let index = 0; index < event.results.length; index += 1) {
      const transcript = String(event.results[index][0]?.transcript || "").trim();
      if (!transcript) continue;
      (event.results[index].isFinal ? finalParts : interimParts).push(transcript);
    }
    const recognizedText = [...finalParts, ...interimParts].join(" ").trim();
    $("#aiInputText").value = [voiceBaseText, recognizedText].filter(Boolean).join("\n");
  };
  recognition.onerror = (event) => {
    if (voiceRecognition !== recognition || event.error === "aborted") return;
    voiceErrorMessage = voiceErrorText(event.error);
    $("#voiceStatus").textContent = voiceErrorMessage;
  };
  recognition.onend = () => {
    if (voiceRecognition !== recognition) return;
    voiceRecognition = null;
    voiceActive = false;
    updateVoiceControls();
    if (!voiceErrorMessage) {
      $("#voiceStatus").textContent = $("#aiInputText").value.trim()
        ? "語音輸入已停止，可先修改辨識文字再整理。"
        : "語音輸入已停止，但沒有辨識到文字。";
    }
  };

  updateVoiceControls();
  $("#voiceStatus").textContent = "正在啟動麥克風…";
  try {
    recognition.start();
  } catch (_) {
    voiceRecognition = null;
    voiceActive = false;
    updateVoiceControls();
    $("#voiceStatus").textContent = "無法啟動語音辨識，請重試或改用文字輸入。";
  }
}

function stopVoice({ abort = false, silent = false } = {}) {
  const recognition = voiceRecognition;
  if (!recognition) {
    voiceActive = false;
    updateVoiceControls();
    return;
  }
  if (abort) {
    voiceRecognition = null;
    voiceActive = false;
    try { recognition.abort(); } catch (_) { /* recognition may already be ending */ }
    updateVoiceControls();
    if (!silent) $("#voiceStatus").textContent = "語音輸入已取消。";
    return;
  }
  $("#voiceStatus").textContent = "正在停止語音輸入…";
  try {
    recognition.stop();
  } catch (_) {
    voiceRecognition = null;
    voiceActive = false;
    updateVoiceControls();
    $("#voiceStatus").textContent = "語音輸入已停止，可先修改辨識文字再整理。";
  }
}

async function analyzeInput() {
  const text = $("#aiInputText").value.trim();
  if (text.length < 6) {
    $("#aiStatus").textContent = "請先提供至少 6 個字的事件內容。";
    $("#aiInputText").focus();
    return;
  }

  setAiLoading(true);
  $("#aiStatus").textContent = "正在辨識年月、人物、分類與事件摘要…";
  try {
    let responseEvents = [];
    let usedLocalRules = false;
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, locale: "zh-Hant-TW", lanes })
      });
      if (response.ok) {
        const result = await response.json();
        responseEvents = Array.isArray(result.events) ? result.events : [];
        usedLocalRules = result.mode === "local-fallback" || responseEvents.length === 0;
      } else {
        usedLocalRules = true;
      }
    } catch (_) {
      usedLocalRules = true;
    }

    const source = responseEvents.length ? responseEvents : localAnalyze(text);
    drafts = source.map(normalizeDraft).filter((event) => event.summary).slice(0, 20);
    if (drafts.length) {
      $("#aiStatus").textContent = usedLocalRules
        ? `AI 服務目前無法使用，已用本機基本規則產生 ${drafts.length} 筆草稿；請逐筆確認。`
        : `已產生 ${drafts.length} 筆草稿；請逐筆確認五個欄位。`;
    } else {
      $("#aiStatus").textContent = "沒有辨識到可用事件，請補充人物、時間或發生的事情。";
    }
    renderDrafts();
    if (drafts.length) requestAnimationFrame(() => $("#draftSection").scrollIntoView({ behavior: "smooth", block: "start" }));
  } finally {
    setAiLoading(false);
  }
}

function normalizeDraft(event) {
  const sourceText = String(event.sourceText || event.summary || event.fact || event.title || "").trim();
  return normalizeEvent({
    id: newEventId(),
    rocYear: event.rocYear || event.year || extractYear(sourceText),
    rocMonth: event.rocMonth || event.month || extractMonth(sourceText),
    actor: event.actor || event.primaryActor || event.actorText || detectActor(sourceText),
    lane: event.lane || event.category || detectLane(sourceText),
    summary: event.summary || event.fact || event.title || sourceText
  });
}

function splitSentences(text) {
  return String(text)
    .split(/(?:\r?\n)+|(?<=[。！？!?；;])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 4);
}

function localAnalyze(text) {
  return splitSentences(text).slice(0, 20).map((summary) => ({
    rocYear: extractYear(summary),
    rocMonth: extractMonth(summary),
    actor: detectActor(summary),
    lane: detectLane(summary),
    summary
  }));
}

function extractYear(text) {
  const value = String(text);
  const ad = value.match(/(?:19|20)\d{2}\s*年?/);
  if (ad) return normalizeYear(Number(ad[0].replace(/\D/g, "")) - 1911);
  const roc = value.match(/(?:民國\s*)?(\d{2,3})\s*年/);
  if (roc) return normalizeYear(roc[1]);
  return "";
}

function extractMonth(text) {
  const match = String(text).match(/(?:^|[^\d])(1[0-2]|0?[1-9])\s*月/);
  return match ? normalizeMonth(match[1]) : "";
}

function detectActor(text) {
  const value = String(text);
  const cues = ["案主", "案母", "案父", "配偶", "伴侶", "子女", "孩子", "主要照顧者", "同住親屬"];
  const role = cues.find((cue) => value.includes(cue));
  if (role) return role;
  const labeledName = value.match(/(?:姓名|事件人物)\s*[:：]\s*([\u4e00-\u9fff]{2,4})/);
  if (labeledName) return labeledName[1];
  const leadingName = value.match(/^([\u4e00-\u9fff]{2,4})(?:於|在)(?:民國)?\s*\d/)
    || value.match(/^([\u4e00-\u9fff]{2,4})民國\s*\d/);
  return leadingName?.[1] || "案主";
}

function detectLane(text) {
  const value = String(text);
  const rules = [
    ["社會資源使用歷程", /低收入戶|中低收入戶|低收|中低收|補助|社工|轉介|資格|文件|租金補貼|社宅/],
    ["重大財務事件", /生活費|卡債|信用卡|負債|借款|借貸|貸款|利息|協商|還款|存款|財務|金錢|催收|\d+\s*(?:萬|元)/],
    ["疾病與身心健康史", /疾病|生病|就醫|診斷|用藥|精神|憂鬱|焦慮|健康|長照|醫療|住院/],
    ["感情與家庭史", /感情|婚姻|結婚|離婚|分居|伴侶|配偶|同居|親職|照顧孩子/],
    ["就業與就學史", /工作|就業|就學|學校|職訓|薪水|收入|失業|工時|排班|請假/],
    ["居住遷移史", /居住|租屋|搬家|搬遷|戶籍|房租|安置|住所/]
  ];
  return rules.find(([, pattern]) => pattern.test(value))?.[0] || "重大財務事件";
}

function monthOptions(selected) {
  const options = [`<option value="" ${selected ? "" : "selected"}>月份待確認</option>`];
  for (let month = 1; month <= 12; month += 1) {
    options.push(`<option value="${month}" ${Number(selected) === month ? "selected" : ""}>${month} 月</option>`);
  }
  return options.join("");
}

function laneOptions(selected) {
  return lanes.map((lane) => `<option value="${esc(lane)}" ${lane === normalizeLane(selected) ? "selected" : ""}>${esc(lane)}</option>`).join("");
}

function renderDrafts() {
  const section = $("#draftSection");
  section.hidden = drafts.length === 0;
  $("#draftCount").textContent = drafts.length ? `${drafts.length} 筆待確認` : "";
  $("#draftList").innerHTML = drafts.map((draft, index) => `
    <article class="draft-card" data-draft-index="${index}">
      <div class="draft-card-head"><strong>事件 ${index + 1}</strong><span>待人工確認</span></div>
      <div class="draft-fields">
        <label>年度（民國）<input name="rocYear" type="number" min="1" max="200" inputmode="numeric" value="${esc(draft.rocYear)}" required /></label>
        <label>月份<select name="rocMonth">${monthOptions(draft.rocMonth)}</select></label>
        <label>事件人物<input name="actor" type="text" maxlength="40" value="${esc(draft.actor)}" required /></label>
        <label>事件大分類<select name="lane">${laneOptions(draft.lane)}</select></label>
        <label class="full">事件摘要<textarea name="summary" rows="3" maxlength="300" required>${esc(draft.summary)}</textarea></label>
      </div>
      <div class="draft-status" role="status" aria-live="polite"></div>
      <div class="draft-actions">
        <button class="primary" type="button" data-confirm-draft="${index}">確認加入時間軸</button>
        <button class="ghost" type="button" data-discard-draft="${index}">不採用</button>
      </div>
    </article>`).join("");
}

function draftFromCard(card) {
  return normalizeEvent({
    id: newEventId(),
    rocYear: card.querySelector('[name="rocYear"]').value,
    rocMonth: card.querySelector('[name="rocMonth"]').value,
    actor: card.querySelector('[name="actor"]').value,
    lane: card.querySelector('[name="lane"]').value,
    summary: card.querySelector('[name="summary"]').value
  });
}

function confirmDraft(index) {
  const card = document.querySelector(`[data-draft-index="${index}"]`);
  if (!card) return;
  const event = draftFromCard(card);
  if (!validStoredEvent(event)) {
    card.querySelector(".draft-status").textContent = "請完成年度、事件人物、分類與摘要。";
    card.querySelector("input:invalid, textarea:invalid")?.focus();
    return;
  }
  events.push(event);
  drafts.splice(index, 1);
  saveEvents();
  renderAll();
  renderDrafts();
  if (!drafts.length) {
    closeInputDialog({ restoreFocus: false });
    requestAnimationFrame(() => {
      scrollToEvent(event.id);
      openEventDialog(event.id, document.querySelector(`[data-event-id="${CSS.escape(event.id)}"]`));
    });
  } else {
    requestAnimationFrame(() => $("#draftList [data-confirm-draft]")?.focus());
  }
}

function filteredEvents() {
  const actor = $("#actorFilter").value;
  const lane = $("#laneFilter").value;
  return sortedEvents(events.filter((event) => (actor === "all" || event.actor === actor) && (lane === "all" || event.lane === lane)));
}

function renderFilters() {
  const actorSelect = $("#actorFilter");
  const laneSelect = $("#laneFilter");
  const currentActor = actorSelect.value || "all";
  const currentLane = laneSelect.value || "all";
  const actors = [...new Set(events.map((event) => event.actor).filter(Boolean))].sort((a, b) => a.localeCompare(b, "zh-Hant"));
  actorSelect.innerHTML = `<option value="all">全部人物</option>${actors.map((actor) => `<option value="${esc(actor)}">${esc(actor)}</option>`).join("")}`;
  laneSelect.innerHTML = `<option value="all">全部分類</option>${lanes.map((lane) => `<option value="${esc(lane)}">${esc(lane)}</option>`).join("")}`;
  actorSelect.value = actors.includes(currentActor) ? currentActor : "all";
  laneSelect.value = lanes.includes(currentLane) ? currentLane : "all";
}

function renderMetrics() {
  $("#eventMetric").textContent = String(events.length);
  $("#actorMetric").textContent = String(new Set(events.map((event) => event.actor).filter(Boolean)).size);
  $("#laneMetric").textContent = `${new Set(events.map((event) => event.lane)).size}/6`;
}

function eventButton(event) {
  const monthText = event.rocMonth ? `${event.rocMonth} 月` : "月份待確認";
  const label = `${periodLabel(event.rocYear, event.rocMonth)}，${event.lane}，${event.actor}，查看摘要`;
  return `<button class="timeline-event ${laneClass(event.lane)}" type="button" data-event-id="${esc(event.id)}" aria-label="${esc(label)}" aria-haspopup="dialog">
    <span class="event-month">${esc(monthText)}</span>
    <strong>${esc(event.actor)}</strong>
    <span class="event-open">查看摘要</span>
  </button>`;
}

function renderTimeline() {
  const chart = $("#timelineChart");
  const visible = filteredEvents();
  const empty = $("#timelineEmpty");
  const oldScrollLeft = $("#timelineScroll").scrollLeft;
  empty.hidden = visible.length > 0;
  chart.hidden = visible.length === 0;
  if (!visible.length) {
    chart.innerHTML = "";
    chart.style.removeProperty("--timeline-width");
    updateTimelineNavigation();
    return;
  }

  const periodMap = new Map();
  visible.forEach((event) => {
    const key = periodKey(event);
    if (!periodMap.has(key)) periodMap.set(key, { key, year: event.rocYear, month: event.rocMonth });
  });
  const periods = [...periodMap.values()].sort((a, b) => a.year * 13 + (a.month || 13) - (b.year * 13 + (b.month || 13)));
  chart.style.setProperty("--timeline-width", `${Math.max(720, 136 + periods.length * 176)}px`);
  const visibleLanes = lanes.filter((lane) => visible.some((event) => event.lane === lane));
  let html = `<div class="timeline-grid" style="--period-count:${periods.length}"><div class="timeline-corner">分類</div>`;
  html += periods.map((period) => `<div class="timeline-period">${esc(compactPeriodLabel(period.year, period.month))}</div>`).join("");
  visibleLanes.forEach((lane) => {
    html += `<div class="timeline-lane-label ${laneClass(lane)}"><span>${esc(lane)}</span></div>`;
    periods.forEach((period) => {
      const cellEvents = visible.filter((event) => event.lane === lane && periodKey(event) === period.key);
      html += `<div class="timeline-cell">${cellEvents.map(eventButton).join("")}</div>`;
    });
  });
  html += "</div>";
  chart.innerHTML = html;
  requestAnimationFrame(() => {
    setTimelineScrollLeft(oldScrollLeft);
    updateTimelineNavigation();
  });
}

function renderAll() {
  renderFilters();
  renderMetrics();
  renderTimeline();
}

function updateTimelineNavigation() {
  const scroll = $("#timelineScroll");
  const chart = $("#timelineChart");
  const navigation = $("#timelineNavigation");
  const overflows = !chart.hidden && chart.scrollWidth > scroll.clientWidth + 2;
  navigation.hidden = !overflows;
  $("#swipeHint").hidden = !overflows;
  $("#timelineTopSpacer").style.width = `${chart.scrollWidth}px`;
  if (overflows) $("#timelineTopRail").scrollLeft = scroll.scrollLeft;
}

function setTimelineScrollLeft(value) {
  const scroll = $("#timelineScroll");
  const rail = $("#timelineTopRail");
  const max = Math.max(0, scroll.scrollWidth - scroll.clientWidth);
  const next = Math.max(0, Math.min(Number(value) || 0, max));
  syncingTimelineScroll = true;
  scroll.scrollLeft = next;
  rail.scrollLeft = next;
  requestAnimationFrame(() => { syncingTimelineScroll = false; });
}

function nudgeTimeline(direction) {
  const scroll = $("#timelineScroll");
  setTimelineScrollLeft(scroll.scrollLeft + direction * Math.max(220, scroll.clientWidth * 0.72));
}

function scrollToEvent(eventId) {
  const button = document.querySelector(`[data-event-id="${CSS.escape(eventId)}"]`);
  const scroll = $("#timelineScroll");
  if (!button || !scroll) return;
  const target = Math.max(0, button.offsetLeft - scroll.clientWidth * 0.42);
  setTimelineScrollLeft(target);
  button.focus({ preventScroll: true });
}

function openEventDialog(eventId, trigger = null) {
  const event = events.find((item) => item.id === eventId);
  if (!event) return;
  activeDialogEventId = eventId;
  lastDialogTrigger = trigger || document.querySelector(`[data-event-id="${CSS.escape(eventId)}"]`);
  $("#dialogTitle").textContent = event.actor;
  $("#eventDetail").innerHTML = `
    <dt>年度</dt><dd>民國 ${esc(event.rocYear)} 年</dd>
    <dt>月份</dt><dd>${event.rocMonth ? `${esc(event.rocMonth)} 月` : "月份待確認"}</dd>
    <dt>事件人物</dt><dd>${esc(event.actor)}</dd>
    <dt>事件大分類</dt><dd><span class="detail-lane ${laneClass(event.lane)}">${esc(event.lane)}</span></dd>
    <dt>事件摘要</dt><dd class="summary-text">${esc(event.summary)}</dd>`;
  $("#eventDialog").showModal();
}

function closeEventDialog() {
  if ($("#eventDialog").open) $("#eventDialog").close();
}

function editActiveEvent() {
  const event = events.find((item) => item.id === activeDialogEventId);
  if (!event) return;
  const trigger = lastDialogTrigger;
  closeEventDialog();
  showManual(event, trigger);
}

function deleteActiveEvent() {
  const event = events.find((item) => item.id === activeDialogEventId);
  if (!event) return;
  if (!confirm(`確定刪除「${event.actor}・${compactPeriodLabel(event.rocYear, event.rocMonth)}」這筆事件？`)) return;
  events = events.filter((item) => item.id !== activeDialogEventId);
  activeDialogEventId = "";
  saveEvents();
  closeEventDialog();
  renderAll();
}

function bindEvents() {
  $("#manualModeButton").addEventListener("click", () => setInputMode("manual"));
  $("#aiModeButton").addEventListener("click", () => setInputMode("ai"));
  $("#inputModeSwitch").addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    setInputMode(event.key === "ArrowLeft" ? "manual" : "ai");
  });
  $("#closeInputDialog").addEventListener("click", () => closeInputDialog());
  $("#eventForm").addEventListener("submit", (event) => {
    event.preventDefault();
    saveManualEvent(event.currentTarget);
  });
  $("#cancelEditButton").addEventListener("click", () => closeInputDialog());
  $("#aiTextSource").addEventListener("click", () => setAiSourceMode("text"));
  $("#aiVoiceSource").addEventListener("click", () => setAiSourceMode("voice"));
  $("#startVoice").addEventListener("click", startVoice);
  $("#stopVoice").addEventListener("click", () => stopVoice());
  $("#analyzeButton").addEventListener("click", analyzeInput);
  $("#draftList").addEventListener("click", (event) => {
    const confirmButton = event.target.closest("[data-confirm-draft]");
    const discardButton = event.target.closest("[data-discard-draft]");
    if (confirmButton) confirmDraft(Number(confirmButton.dataset.confirmDraft));
    if (discardButton) {
      drafts.splice(Number(discardButton.dataset.discardDraft), 1);
      renderDrafts();
      if (!drafts.length) $("#aiStatus").textContent = "目前沒有待確認草稿，可調整內容後重新整理。";
    }
  });
  $("#addEventButton").addEventListener("click", (event) => showManual(null, event.currentTarget));
  $("#emptyAddEventButton").addEventListener("click", (event) => showManual(null, event.currentTarget));
  $("#actorFilter").addEventListener("change", renderTimeline);
  $("#laneFilter").addEventListener("change", renderTimeline);
  $("#timelineChart").addEventListener("click", (event) => {
    const button = event.target.closest("[data-event-id]");
    if (button) openEventDialog(button.dataset.eventId, button);
  });
  $("#closeDialog").addEventListener("click", closeEventDialog);
  $("#editDialogEvent").addEventListener("click", editActiveEvent);
  $("#deleteDialogEvent").addEventListener("click", deleteActiveEvent);
  $("#eventDialog").addEventListener("click", (event) => {
    if (event.target === $("#eventDialog")) closeEventDialog();
  });
  $("#eventDialog").addEventListener("close", () => {
    if (lastDialogTrigger?.isConnected) lastDialogTrigger.focus({ preventScroll: true });
  });
  $("#inputDialog").addEventListener("click", (event) => {
    if (event.target === $("#inputDialog")) closeInputDialog();
  });
  $("#inputDialog").addEventListener("cancel", (event) => {
    if (aiLoading) event.preventDefault();
  });
  $("#inputDialog").addEventListener("close", () => {
    stopVoice({ abort: true, silent: true });
    if (restoreInputFocusOnClose && lastInputDialogTrigger?.isConnected) lastInputDialogTrigger.focus({ preventScroll: true });
    restoreInputFocusOnClose = true;
  });
  $("#scrollEarlier").addEventListener("click", () => nudgeTimeline(-1));
  $("#scrollLater").addEventListener("click", () => nudgeTimeline(1));
  $("#timelineTopRail").addEventListener("scroll", () => {
    if (!syncingTimelineScroll) setTimelineScrollLeft($("#timelineTopRail").scrollLeft);
  });
  $("#timelineScroll").addEventListener("scroll", () => {
    if (!syncingTimelineScroll) setTimelineScrollLeft($("#timelineScroll").scrollLeft);
  });
  $("#timelineTopRail").addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") { event.preventDefault(); nudgeTimeline(-0.22); }
    if (event.key === "ArrowRight") { event.preventDefault(); nudgeTimeline(0.22); }
  });
  window.addEventListener("resize", updateTimelineNavigation);
  if (globalThis.ResizeObserver) new ResizeObserver(updateTimelineNavigation).observe($("#timelineChart"));
}

bindEvents();
showTool();

window.caseTimelineTool = {
  version: CURRENT_VERSION,
  get events() { return structuredClone(events); },
  setEventsForTest(nextEvents) {
    events = Array.isArray(nextEvents) ? nextEvents.map((event) => normalizeEvent(event)).filter(validStoredEvent) : [];
    saveEvents();
    renderAll();
  },
  clearEvents() {
    events = [];
    saveEvents();
    renderAll();
  }
};
