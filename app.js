const streams = [
  { id: "yangjae", name: "양재천 · 영동1교 구간", area: "서울 서초구", aliases: ["양재천", "영동1교", "서초", "서초동"], status: "warning", level: "0.82", rain: "2.4", updated: "19:24" },
  { id: "tancheon", name: "탄천 · 대곡교 구간", area: "서울 강남구", aliases: ["탄천", "대곡교", "강남", "수서"], status: "safe", level: "0.54", rain: "0.8", updated: "19:21" },
  { id: "banpo", name: "반포천 · 반포교 구간", area: "서울 서초구", aliases: ["반포천", "반포교", "반포", "서초"], status: "danger", level: "1.74", rain: "8.1", updated: "19:25" },
  { id: "yeoui", name: "여의천 · 양재시민의숲 구간", area: "서울 서초구", aliases: ["여의천", "시민의숲", "양재", "서초"], status: "safe", level: "0.48", rain: "0.4", updated: "19:18" }
];

const statusInfo = {
  safe: {
    label: "안전", state: "통행 가능", title: "현재 산책로는 통행 가능한 상태예요.",
    description: "화면 시안의 예시 상태입니다. 실제 현장 상황을 확인하고 주변 안내를 따라주세요.",
    hint: "강우 시 하천 수위는 빠르게 변할 수 있어요.", icon: "✓", gauge: "36%",
    detail: "안전 · 통행 가능", detailText: "화면 시안용 예시 상태입니다. 실제 현장 상황을 확인하고 주변 안내를 따라주세요."
  },
  warning: {
    label: "주의", state: "산책로 진입 자제", title: "수위가 오르고 있을 수 있습니다. 하천변 대신 지상 도로를 이용해 주세요.",
    description: "수위 상승 가능성이 있는 예시 상태입니다. 하천변 진입을 피하고 지상 도로를 이용하세요.",
    hint: "하천 산책로 진입을 피하고, 지상 도로를 이용해 주세요.", icon: "!", gauge: "55%",
    detail: "주의 · 산책로 진입 자제", detailText: "수위 상승 가능성이 있는 예시 상태입니다. 하천변 진입을 피하고 지상 도로를 이용하세요."
  },
  danger: {
    label: "통제", state: "산책로 진입 금지", title: "침수 위험이 있습니다. 산책로에 들어가지 마세요.",
    description: "통제 상태 예시입니다. 하천변에서 멀어져 안전한 높은 곳으로 이동하세요.",
    hint: "하천변에서 멀어져 안전한 높은 곳으로 이동하세요.", icon: "×", gauge: "92%",
    detail: "통제 · 산책로 진입 금지", detailText: "통제 상태 예시입니다. 산책로에 진입하지 말고 이미 안에 있다면 가장 가까운 출구로 대피하세요."
  }
};

let selectedStream = streams[0];
let selectedStatus = selectedStream.status;
let currentFilter = "all";
const alerts = [
  { id: 1, type: "danger", title: "반포천 산책로 진입 금지 (예시)", body: "통제 상태 화면 예시입니다. 하천변에서 멀어져 높은 곳으로 이동하세요.", time: "오늘 19:16", unread: true },
  { id: 2, type: "warning", title: "양재천 수위 상승 주의 (예시)", body: "주의 상태 화면 예시입니다. 산책로 진입을 자제하고 지상 도로를 이용하세요.", time: "오늘 18:52", unread: true },
  { id: 3, type: "info", title: "주변 하천 정보 갱신 시안", body: "실제 데이터 연동 전이며 화면 구성을 위한 예시 알림입니다.", time: "오늘 18:20", unread: false }
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const toastTimer = { id: null };

function showToast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(toastTimer.id);
  toastTimer.id = setTimeout(() => element.classList.remove("show"), 2700);
}

function showView(name) {
  const target = $(`[data-view="${name}"]`);
  if (!target) return;
  $$(".view").forEach(view => {
    const active = view === target;
    view.classList.toggle("is-active", active);
    view.hidden = !active;
  });
  $$(".nav-item").forEach(button => button.classList.toggle("is-active", button.dataset.nav === name));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderStatus(statusKey) {
  const info = statusInfo[statusKey] || statusInfo.warning;
  selectedStatus = statusKey;
  const hero = $("#statusHero");
  hero.dataset.status = statusKey;
  $("#statusBadge span").textContent = info.label;
  $("#stateSymbol").textContent = info.icon;
  $("#stateLabel").textContent = info.state;
  $("#stateDescription").textContent = info.title;
  $("#safetyHint span").textContent = info.hint;
  $("#gaugeFill").style.width = info.gauge;
  $("#detailStatus").dataset.status = statusKey;
  $("#detailStatusTitle").textContent = info.detail;
  $("#detailStatusText").textContent = info.detailText;
  $("#detailBadgeText").textContent = info.label;
  $("#heroAction").innerHTML = statusKey === "danger"
    ? '진입 금지 · 행동 요령 <span aria-hidden="true">→</span>'
    : '하천 상세 정보 <span aria-hidden="true">→</span>';
  updateStreamCards();
}

function updateStreamCards() {
  const row = $("#view-dashboard .entry-row");
  if (!row) return;
  const badge = $(".entry-state", row);
  const label = selectedStatus === "safe" ? "통행 가능" : statusInfo[selectedStatus].label;
  badge.className = `entry-state ${selectedStatus === "safe" ? "state-safe" : selectedStatus === "warning" ? "state-warning" : "state-danger"}`;
  badge.textContent = label;
}

function chooseStream(stream) {
  selectedStream = stream;
  $("#areaLabel").textContent = stream.area.replace("서울 ", "");
  $("#riverTitle").textContent = stream.name;
  $("#detailHeading").textContent = `${stream.name.split(" · ")[0]} 상세 현황`;
  $("#updatedTime").textContent = stream.updated;
  $(".level-readout strong").textContent = `${stream.level}m`;
  $(".detail-water-reading strong").innerHTML = `${stream.level} <small>m</small>`;
  $(".metric-card:nth-child(1) .metric-value").innerHTML = `${stream.rain} <small>mm/h</small>`;
  $(".metric-card:nth-child(2) .metric-value").innerHTML = `${stream.level} <small>m</small>`;
  $("#streamQuery").value = "";
  $("#dialogQuery").value = "";
  renderStatus(stream.status);
  showView("detail");
}

function streamMarkup(stream) {
  const info = statusInfo[stream.status];
  const className = stream.status === "danger" ? "state-danger" : stream.status === "warning" ? "state-warning" : "state-safe";
  const badge = stream.status === "safe" ? "통행 가능" : info.label;
  return `<button class="stream-card" type="button" data-stream-id="${stream.id}">
    <span class="stream-icon" aria-hidden="true">≈</span>
    <span class="stream-meta"><strong>${stream.name}</strong><span>${stream.area} · 관측 갱신 시안 ${stream.updated}</span></span>
    <span class="stream-card-end"><span class="entry-state ${className}">${badge}</span><span class="stream-arrow" aria-hidden="true">›</span></span>
  </button>`;
}

function renderStreams(query = "") {
  const normalized = query.trim().toLocaleLowerCase("ko-KR");
  const matches = streams.filter(stream => {
    if (!normalized) return true;
    const searchable = [stream.name, stream.area, ...stream.aliases].join(" ").toLocaleLowerCase("ko-KR");
    return searchable.includes(normalized);
  });
  $("#streamList").innerHTML = matches.map(streamMarkup).join("");
  $("#resultCount").textContent = `${matches.length}개 구간`;
  $("#noStreamResults").hidden = matches.length > 0;
  $("#streamList").hidden = matches.length === 0;
}

function renderAlerts() {
  const shown = alerts.filter(alert => currentFilter === "all" || alert.type === currentFilter);
  const mark = type => type === "danger" ? "!" : type === "warning" ? "△" : "i";
  $("#alertList").innerHTML = shown.map(alert => `<article class="alert-card ${alert.unread ? "is-unread" : ""}" data-type="${alert.type}">
    <span class="alert-marker" aria-hidden="true">${mark(alert.type)}</span>
    <div class="alert-content"><h3>${alert.title}</h3><p>${alert.body}</p><span class="alert-time">${alert.time}</span></div>
    ${alert.unread ? `<button class="alert-mark" data-mark-read="${alert.id}">읽음</button>` : ""}
  </article>`).join("");
  $("#noAlerts").hidden = shown.length > 0;
}

function renderException(kind) {
  const content = {
    location: {
      icon: "⌖", title: "현재 위치를 확인할 수 없습니다",
      message: "정확한 주변 정보가 필요하면 위치 권한을 확인하거나 동 이름·하천명을 직접 검색해 주세요.",
      actions: '<button class="button button-primary" data-nav="nearby">지역 직접 검색</button><button class="button button-outline" data-nav="settings">위치 안내 보기</button>'
    },
    none: {
      icon: "⌖", title: "주변에 모니터링 중인 소하천이 없습니다",
      message: "현재 위치 근처에서 수위 관리 대상 소하천을 찾지 못했습니다. 다른 지역을 검색할 수 있습니다.",
      actions: '<button class="button button-primary" data-nav="nearby">다른 지역 검색하기</button>'
    },
    error: {
      icon: "!", title: "기상·수위 데이터를 불러올 수 없습니다",
      message: "네트워크 연결 또는 데이터 제공 상태를 확인해 주세요. 시안에서는 실제 API 재호출을 하지 않습니다.",
      actions: '<button class="button button-primary" id="retryDemo">다시 시도</button><button class="button button-outline" data-nav="nearby">다른 지역 검색</button>'
    }
  }[kind];
  if (!content) return;
  $("#exceptionIcon").textContent = content.icon;
  $("#exceptionTitle").textContent = content.title;
  $("#exceptionMessage").textContent = content.message;
  $("#exceptionActions").innerHTML = content.actions;
  showView("exception");
}

function performSearch(value, dialog = false) {
  const query = value.trim();
  if (query.length < 2) {
    showToast("2자 이상 입력해 주세요.");
    return;
  }
  if (dialog && $("#locationDialog").open) $("#locationDialog").close();
  showView("nearby");
  $("#streamQuery").value = query;
  renderStreams(query);
  if (!streams.some(stream => [stream.name, stream.area, ...stream.aliases].join(" ").toLocaleLowerCase("ko-KR").includes(query.toLocaleLowerCase("ko-KR")))) {
    showToast("검색 결과가 없습니다. 동 이름이나 하천명을 확인해 주세요.");
  }
}

function refreshDemo() {
  const now = new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());
  $("#updatedTime").textContent = now;
  showToast("화면 시안을 갱신했습니다. 실제 데이터는 연동되지 않았습니다.");
}

document.addEventListener("click", event => {
  const nav = event.target.closest("[data-nav]");
  if (nav) {
    event.preventDefault();
    showView(nav.dataset.nav);
    return;
  }
  const statusButton = event.target.closest("[data-set-status]");
  if (statusButton) {
    renderStatus(statusButton.dataset.setStatus);
    showToast(`${statusInfo[statusButton.dataset.setStatus].label} 상태 시안입니다.`);
    return;
  }
  const exceptionButton = event.target.closest("[data-exception]");
  if (exceptionButton) {
    renderException(exceptionButton.dataset.exception);
    return;
  }
  const streamButton = event.target.closest("[data-stream-id]");
  if (streamButton) {
    const stream = streams.find(item => item.id === streamButton.dataset.streamId);
    if (stream) chooseStream(stream);
    return;
  }
  const queryButton = event.target.closest("[data-query]");
  if (queryButton) {
    $("#dialogQuery").value = queryButton.dataset.query;
    performSearch(queryButton.dataset.query, true);
    return;
  }
  const readButton = event.target.closest("[data-mark-read]");
  if (readButton) {
    const alert = alerts.find(item => item.id === Number(readButton.dataset.markRead));
    if (alert) alert.unread = false;
    renderAlerts();
    showToast("알림을 읽음으로 표시했습니다.");
    return;
  }
  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    currentFilter = filterButton.dataset.filter;
    $$(".filter-chip").forEach(chip => {
      const active = chip === filterButton;
      chip.classList.toggle("is-selected", active);
      chip.setAttribute("aria-pressed", String(active));
    });
    renderAlerts();
    return;
  }
  const entryButton = event.target.closest("[data-entry]");
  if (entryButton) {
    showView("detail");
    showToast(`${entryButton.dataset.entry} · 진입로 상태 시안`);
  }
});

$("#heroAction").addEventListener("click", () => showView(selectedStatus === "danger" ? "emergency" : "detail"));
$("#openLocation").addEventListener("click", () => $("#locationDialog").showModal());
$("#refreshButton").addEventListener("click", refreshDemo);
$("#detailRefresh").addEventListener("click", refreshDemo);
$("#nearbyLocationButton").addEventListener("click", () => renderException("location"));
$("#locationGuideButton").addEventListener("click", () => renderException("location"));
$("#manualSearchButton").addEventListener("click", () => { showView("nearby"); $("#streamQuery").focus(); });
$("#emptySearchButton").addEventListener("click", () => $("#locationDialog").showModal());
$("#settingsHelp").addEventListener("click", () => showToast("화면 속 정보는 예시이며 실시간 안전 정보가 아닙니다."));
$("#clearReadAlerts").addEventListener("click", () => {
  const unreadCount = alerts.filter(alert => alert.unread).length;
  if (!unreadCount) return showToast("읽은 알림이 없습니다.");
  for (let index = alerts.length - 1; index >= 0; index--) if (!alerts[index].unread) alerts.splice(index, 1);
  renderAlerts();
  showToast("읽은 알림을 지웠습니다.");
});
$("#streamSearch").addEventListener("submit", event => {
  event.preventDefault();
  performSearch($("#streamQuery").value);
});
$("#dialogSearchForm").addEventListener("submit", event => {
  event.preventDefault();
  performSearch($("#dialogQuery").value, true);
});
$("#streamQuery").addEventListener("input", event => {
  const query = event.target.value.trim();
  renderStreams(query.length < 2 ? "" : query);
});
$("#shareButton").addEventListener("click", async () => {
  const shareText = `${selectedStream.name} · ${statusInfo[selectedStatus].label} (화면 시안)`;
  try {
    if (navigator.share) await navigator.share({ title: "물결안심 하천 정보", text: shareText, url: location.href });
    else if (navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareText} ${location.href}`);
      showToast("하천 정보 링크를 복사했습니다.");
    } else showToast(shareText);
  } catch (error) {
    if (error.name !== "AbortError") showToast("공유를 완료하지 못했습니다.");
  }
});

document.addEventListener("click", event => {
  if (event.target.id === "retryDemo") {
    showView("dashboard");
    refreshDemo();
  }
});

renderStreams();
renderAlerts();
renderStatus(selectedStatus);

