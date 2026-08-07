const CURRENT_VERSION = "v0.40-authenticated-five-field";
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
const TEST_TEXT = [
  "案主於民國115年3月開始餐飲排班工作。",
  "案母於民國115年5月開始協助照顧孩子。",
  "案主於民國115年7月取得中低收入戶資格。",
  "案父民國108年負債500萬元。"
].join("\n");

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

let events = loadEvents();
let drafts = [];
let voiceRecognition = null;
let activeDialogEventId = "";
let lastDialogTrigger = null;
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

function showLanding() {
  $("#landingPage").hidden = false;
  $("#toolApp").hidden = true;
}

function showTool({ focusChoice = false } = {}) {
  $("#landingPage").hidden = true;
  $("#toolApp").hidden = false;
  if (location.hash !== "#tool") history.pushState(null, "", "#tool");
  renderAll();
  if (focusChoice) requestAnimationFrame(() => $("#inputChoiceTitle")?.focus());
}

function showChoice() {
  stopVoice();
  $("#inputChoiceGrid").hidden = false;
  $("#manualPanel").hidden = true;
  $("#aiPanel").hidden = true;
  $("#inputEntry").hidden = false;
  requestAnimationFrame(() => {
    $("#inputEntry").scrollIntoView({ behavior: "smooth", block: "start" });
    $("#inputChoiceTitle").focus();
  });
}

function showManual(event = null) {
  stopVoice();
  $("#inputChoiceGrid").hidden = true;
  $("#aiPanel").hidden = true;
  $("#manualPanel").hidden = false;
  $("#inputEntry").hidden = false;
  resetManualForm();
  if (event) fillManualForm(event);
  requestAnimationFrame(() => {
    $("#manualPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    $("#eventYear").focus();
  });
}

function showAi() {
  $("#inputChoiceGrid").hidden = true;
  $("#manualPanel").hidden = true;
  $("#aiPanel").hidden = false;
  $("#inputEntry").hidden = false;
  setAiMode("text");
  renderDrafts();
  requestAnimationFrame(() => {
    $("#aiPanel").scrollIntoView({ behavior: "smooth", block: "start" });
    $("#aiInputText").focus();
  });
}

function resetManualForm() {
  $("#eventForm").reset();
  $("#eventId").value = "";
  $("#eventYear").value = currentRocYear();
  $("#eventMonth").value = "";
  $("#eventLane").value = "居住遷移史";
  $("#manualTitle").textContent = "新增一筆事件";
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
  $("#manualTitle").textContent = "編輯事件";
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
  showChoice();
  requestAnimationFrame(() => {
    scrollToEvent(next.id);
    openEventDialog(next.id, document.querySelector(`[data-event-id="${CSS.escape(next.id)}"]`));
  });
}

function setAiMode(mode) {
  const voiceMode = mode === "voice";
  $("#aiTextMode").classList.toggle("active", !voiceMode);
  $("#aiVoiceMode").classList.toggle("active", voiceMode);
  $("#aiTextMode").setAttribute("aria-pressed", String(!voiceMode));
  $("#aiVoiceMode").setAttribute("aria-pressed", String(voiceMode));
  $("#voiceControls").hidden = !voiceMode;
  $("#aiInputLabel").textContent = voiceMode ? "語音辨識結果（可修改）" : "輸入或貼上事件內容";
  if (!voiceMode) stopVoice();
  requestAnimationFrame(() => (voiceMode ? $("#startVoice") : $("#aiInputText")).focus());
}

function setAiLoading(loading) {
  $("#analyzeButton").disabled = loading;
  $("#analyzeButton").textContent = loading ? "AI 分析中…" : "開始 AI 分析";
  ["aiBack", "aiTextMode", "aiVoiceMode", "startVoice", "stopVoice", "useTestText"].forEach((id) => {
    $("#" + id).disabled = loading;
  });
}

async function analyzeInput() {
  const text = $("#aiInputText").value.trim();
  if (text.length < 6) {
    $("#aiStatus").textContent = "請先輸入一段事件內容。";
    $("#aiInputText").focus();
    return;
  }
  stopVoice();
  setAiLoading(true);
  $("#aiStatus").textContent = "正在辨識年月、人物、分類與事件摘要…";
  try {
    let responseEvents = [];
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, locale: "zh-Hant-TW", lanes })
      });
      if (response.ok) {
        const result = await response.json();
        responseEvents = Array.isArray(result.events) ? result.events : [];
      }
    } catch (_) {
      responseEvents = [];
    }
    const source = responseEvents.length ? responseEvents : localAnalyze(text);
    drafts = source.map((event) => normalizeDraft(event)).filter((event) => event.summary).slice(0, 20);
    $("#aiStatus").textContent = drafts.length
      ? `已產生 ${drafts.length} 筆事件初稿；請確認五個欄位後加入時間軸。`
      : "沒有辨識到可用事件，請補充人物、時間或發生的事情。";
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
  const roc = String(text).match(/(?:民國\s*)?(\d{2,3})\s*年/);
  if (roc) return normalizeYear(roc[1]);
  const ad = String(text).match(/(?:19|20)\d{2}\s*年?/);
  if (ad) return normalizeYear(Number(ad[0].replace(/\D/g, "")) - 1911);
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
        <label>年度<input name="rocYear" type="number" min="1" max="200" inputmode="numeric" value="${esc(draft.rocYear)}" required /></label>
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
    showChoice();
    requestAnimationFrame(() => scrollToEvent(event.id));
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
  closeEventDialog();
  showManual(event);
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

function startVoice() {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    $("#voiceStatus").textContent = "此瀏覽器不支援內建語音辨識，請改用文字輸入。";
    return;
  }
  stopVoice();
  voiceRecognition = new Recognition();
  voiceRecognition.lang = "zh-TW";
  voiceRecognition.continuous = true;
  voiceRecognition.interimResults = true;
  voiceRecognition.onstart = () => { $("#voiceStatus").textContent = "語音輸入中；請開始說明事件。"; };
  voiceRecognition.onerror = () => { $("#voiceStatus").textContent = "語音辨識中斷，可以改用文字輸入。"; };
  voiceRecognition.onend = () => { $("#voiceStatus").textContent = "語音輸入已停止，可先修改辨識文字再分析。"; };
  voiceRecognition.onresult = (recognitionEvent) => {
    let finalText = "";
    for (let index = recognitionEvent.resultIndex; index < recognitionEvent.results.length; index += 1) {
      if (recognitionEvent.results[index].isFinal) finalText += recognitionEvent.results[index][0].transcript;
    }
    if (finalText) $("#aiInputText").value = [$("#aiInputText").value.trim(), finalText.trim()].filter(Boolean).join("\n");
  };
  voiceRecognition.start();
}

function stopVoice() {
  if (voiceRecognition) {
    voiceRecognition.stop();
    voiceRecognition = null;
  }
}

function bindEvents() {
  $("#enterToolButton").addEventListener("click", () => showTool({ focusChoice: true }));
  $("#chooseManualInput").addEventListener("click", () => showManual());
  $("#chooseAiInput").addEventListener("click", showAi);
  $("#manualBack").addEventListener("click", showChoice);
  $("#aiBack").addEventListener("click", showChoice);
  $("#eventForm").addEventListener("submit", (event) => {
    event.preventDefault();
    saveManualEvent(event.currentTarget);
  });
  $("#cancelEditButton").addEventListener("click", showChoice);
  $("#aiTextMode").addEventListener("click", () => setAiMode("text"));
  $("#aiVoiceMode").addEventListener("click", () => setAiMode("voice"));
  $("#startVoice").addEventListener("click", startVoice);
  $("#stopVoice").addEventListener("click", stopVoice);
  $("#analyzeButton").addEventListener("click", analyzeInput);
  $("#useTestText").addEventListener("click", () => {
    $("#aiInputText").value = TEST_TEXT;
    $("#aiInputText").focus();
    $("#aiStatus").textContent = "已填入測試文字，可以開始 AI 分析。";
  });
  $("#draftList").addEventListener("click", (event) => {
    const confirmButton = event.target.closest("[data-confirm-draft]");
    const discardButton = event.target.closest("[data-discard-draft]");
    if (confirmButton) confirmDraft(Number(confirmButton.dataset.confirmDraft));
    if (discardButton) {
      drafts.splice(Number(discardButton.dataset.discardDraft), 1);
      renderDrafts();
    }
  });
  $("#addEventButton").addEventListener("click", () => showManual());
  $("#openAiButton").addEventListener("click", showAi);
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
  window.addEventListener("hashchange", () => {
    if (location.hash === "#tool") showTool();
    else showLanding();
  });
  window.addEventListener("resize", updateTimelineNavigation);
  if (globalThis.ResizeObserver) new ResizeObserver(updateTimelineNavigation).observe($("#timelineChart"));
}

bindEvents();
if (location.hash === "#tool" || new URLSearchParams(location.search).get("tool") === "1") showTool();
else showLanding();

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
