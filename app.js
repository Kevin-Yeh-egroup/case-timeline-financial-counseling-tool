const CURRENT_VERSION = "v0.42-manual-only-timeline";
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
let activeDialogEventId = "";
let lastDialogTrigger = null;
let lastInputDialogTrigger = null;
let restoreInputFocusOnClose = true;
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

function openInputDialog({ event = null, trigger = null } = {}) {
  lastInputDialogTrigger = trigger || document.activeElement;
  restoreInputFocusOnClose = true;
  resetManualForm();
  if (event) fillManualForm(event);
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
  restoreInputFocusOnClose = restoreFocus;
  if ($("#inputDialog").open) $("#inputDialog").close();
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
  closeInputDialog({ restoreFocus: false });
  requestAnimationFrame(() => {
    scrollToEvent(next.id);
    openEventDialog(next.id, document.querySelector(`[data-event-id="${CSS.escape(next.id)}"]`));
  });
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
  $("#closeInputDialog").addEventListener("click", () => closeInputDialog());
  $("#eventForm").addEventListener("submit", (event) => {
    event.preventDefault();
    saveManualEvent(event.currentTarget);
  });
  $("#cancelEditButton").addEventListener("click", () => closeInputDialog());
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
  $("#inputDialog").addEventListener("close", () => {
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
