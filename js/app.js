/* ATMOS — главная логика (editorial / neubrutalist) */

const state = {
  unit: localStorage.getItem("atmos_unit") || "metric",
  lat: null,
  lon: null,
  cityName: null,
  geoId: null,
  weather: null,
  forecast: null
};

const $ = (id) => document.getElementById(id);
const els = {
  searchInput: $("searchInput"),
  suggestions: $("suggestions"),
  geoBtn: $("geoBtn"),
  errorCard: $("errorCard"),
  errorText: $("errorText"),
  loader: $("loader"),
  mainContent: $("mainContent"),
  cityName: $("cityName"),
  cityMeta: $("cityMeta"),
  temp: $("temp"),
  desc: $("desc"),
  feels: $("feels"),
  heroGlyph: $("heroGlyph"),
  heroGhost: $("heroGhost"),
  mFeels: $("mFeels"),
  mHumidity: $("mHumidity"),
  mWind: $("mWind"),
  mPressure: $("mPressure"),
  mVisibility: $("mVisibility"),
  mClouds: $("mClouds"),
  mSunrise: $("mSunrise"),
  mSunset: $("mSunset"),
  hourlyWrap: $("hourlyWrap"),
  daily: $("daily"),
  marqueeTrack: $("marqueeTrack")
};

/* ---------- Утилиты ---------- */
const weekdaysRu = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const weekdaysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function localDate(ts, offsetSec) {
  return new Date((ts + offsetSec) * 1000 + new Date().getTimezoneOffset() * 60000);
}
function fmtTemp(v) { return Math.round(v); }
function pressureValue(hpa) {
  return state.unit === "imperial"
    ? Math.round(hpa * 0.02953 * 10) / 10
    : Math.round(hpa * 0.750062);
}
function fmtTime(ts, offsetSec) {
  const d = localDate(ts, offsetSec);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function windDir(deg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}
function cityDayKey(ts, offsetSec) {
  return Math.floor((ts + offsetSec) / 86400);
}
function dayLabel(ts, offsetSec) {
  const d = localDate(ts, offsetSec);
  const diff = cityDayKey(ts, offsetSec) - cityDayKey(Date.now() / 1000, offsetSec);
  if (diff === 0) return t("today");
  if (diff === 1) return t("tomorrow");
  const names = currentLang === "ru" ? weekdaysRu : weekdaysEn;
  return names[d.getDay()];
}
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function weatherCategory(code) {
  if (code >= 200 && code < 300) return "thunder";
  if (code >= 300 && code < 600) return "rain";
  if (code >= 600 && code < 700) return "snow";
  if (code >= 700 && code < 800) return "mist";
  if (code === 800) return "clear";
  return "clouds";
}

/* ---------- Анимированные знаки погоды ---------- */
function rays(center) {
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += `<rect x="93" y="6" width="14" height="30" rx="4" transform="rotate(${i * 45} ${center} ${center})"/>`;
  }
  return out;
}

function weatherGlyph(code, night) {
  const cat = weatherCategory(code);
  const s = (inner) => `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  const cloudShape = `
    <g class="glyph-cloud" fill="var(--text-primary)">
      <path d="M 64 140 
               a 24 24 0 0 1 -4 -47 
               a 36 36 0 0 1 68 -12 
               a 28 28 0 0 1 36 28 
               a 24 24 0 0 1 -20 31 
               Z" />
    </g>`;

  const sunCore = `<circle cx="100" cy="100" r="42" fill="var(--accent)" stroke="var(--text-primary)" stroke-width="4"/>`;

  switch (cat) {
    case "clear":
      if (night) {
        return s(`
          <g class="glyph-star"><circle cx="40" cy="44" r="3" fill="var(--text-primary)"/></g>
          <g class="glyph-star" style="animation-delay:0.7s"><circle cx="160" cy="36" r="2.5" fill="var(--text-primary)"/></g>
          <g class="glyph-star" style="animation-delay:1.3s"><circle cx="50" cy="150" r="2" fill="var(--text-primary)"/></g>
          <circle class="glyph-moon" cx="100" cy="100" r="48" fill="var(--warning)" stroke="var(--text-primary)" stroke-width="4"/>
          <circle cx="122" cy="86" r="40" fill="var(--bg-card)"/>`);
      }
      return s(`
        <g class="glyph-sun-rays" fill="var(--text-primary)">${rays(100)}</g>
        ${sunCore}`);

    case "clouds":
      if (code === 801 || code === 802) {
        return s(`
          <circle cx="142" cy="62" r="26" fill="var(--accent)" stroke="var(--text-primary)" stroke-width="4"/>
          ${cloudShape}`);
      }
      return s(cloudShape);

    case "rain":
      return s(`
        ${cloudShape}
        <g class="glyph-rain" stroke="var(--accent)" stroke-width="6" stroke-linecap="round">
          <line x1="72" y1="140" x2="66" y2="164"/>
          <line x1="104" y1="140" x2="98" y2="164"/>
          <line x1="136" y1="140" x2="130" y2="164"/>
        </g>`);

    case "thunder":
      return s(`
        <g fill="var(--text-primary)"><circle cx="68" cy="112" r="24"/><circle cx="100" cy="96" r="32"/><circle cx="134" cy="114" r="20"/><rect x="62" y="108" width="80" height="26"/></g>
        <path class="glyph-bolt" d="M112 120 L86 148 h18 l-10 24 L132 136 h-20 Z" fill="var(--warning)" stroke="var(--text-primary)" stroke-width="3"/>`);

    case "snow":
      return s(`
        ${cloudShape}
        <g class="glyph-snow" fill="var(--accent)" stroke="var(--text-primary)" stroke-width="1.5">
          <circle cx="72" cy="146" r="6"/>
          <circle cx="104" cy="152" r="6"/>
          <circle cx="136" cy="146" r="6"/>
        </g>`);

    case "mist":
    default:
      return s(`
        <g stroke="var(--text-primary)" stroke-width="7" stroke-linecap="round">
          <line x1="30" y1="80" x2="170" y2="80"/>
          <line x1="40" y1="110" x2="160" y2="110"/>
          <line x1="30" y1="140" x2="170" y2="140"/>
        </g>`);
  }
}

/* ---------- Count-up ---------- */
function countUp(el, to, fmt, duration = 900) {
  const from = 0;
  const start = performance.now();
  function frame(now) {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(from + (to - from) * eased);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ---------- Тема ---------- */
function isNightTime(w) {
  const now = Date.now() / 1000;
  return now < w.sys.sunrise || now >= w.sys.sunset;
}
function applyTheme(w) {
  const cat = weatherCategory(w.weather[0].id);
  document.body.setAttribute("data-weather", cat);
}

/* ---------- Отображение ---------- */
function showError(key) {
  els.errorCard.classList.remove("hidden");
  els.errorText.textContent = t(key);
  els.mainContent.classList.add("hidden");
  els.loader.classList.add("hidden");
}
function hideError() { els.errorCard.classList.add("hidden"); }
function showLoader() {
  els.loader.classList.remove("hidden");
  els.mainContent.classList.add("hidden");
  hideError();
}
function showContent() {
  els.loader.classList.add("hidden");
  els.mainContent.classList.remove("hidden");
  hideError();
}
function mapError(e) {
  if (e.message === "city") return "errCity";
  if (e.message === "api") return "errApi";
  return "errNetwork";
}

function renderCurrent(w) {
  const offsetSec = w.timezone;
  const night = isNightTime(w);

  els.cityName.textContent = state.cityName || w.name;
  els.cityMeta.textContent = localDate(Date.now() / 1000, offsetSec).toLocaleString(
    currentLang === "ru" ? "ru-RU" : "en-US",
    { weekday: "long", day: "numeric", month: "long" }
  );
  els.desc.textContent = w.weather[0].description;
  els.feels.textContent = t("feels", fmtTemp(w.main.feels_like) + "°");
  els.heroGlyph.innerHTML = weatherGlyph(w.weather[0].id, night);
  els.heroGhost.textContent = w.weather[0].main.toUpperCase();

  countUp(els.temp, fmtTemp(w.main.temp), (v) => Math.round(v) + "", 1000);

  // метрики
  countUp(els.mFeels, w.main.feels_like, (v) => Math.round(v) + "°");
  countUp(els.mHumidity, w.main.humidity, (v) => Math.round(v) + "%");
  countUp(els.mClouds, w.clouds.all, (v) => Math.round(v) + "%");
  countUp(els.mPressure, pressureValue(w.main.pressure), (v) =>
    (state.unit === "imperial" ? v.toFixed(1) : Math.round(v)) + " " + t("pressureUnits." + state.unit));

  const vis = state.unit === "imperial" ? Math.round(w.visibility / 1609) : Math.round(w.visibility / 1000);
  countUp(els.mVisibility, vis, (v) => Math.round(v) + " " + t("visibilityUnits." + state.unit));

  const windUnit = t("windUnits." + state.unit);
  els.mWind.textContent = `${Math.round(w.wind.speed)} ${windUnit} ${windDir(w.wind.deg)}`;

  els.mSunrise.textContent = fmtTime(w.sys.sunrise, offsetSec);
  els.mSunset.textContent = fmtTime(w.sys.sunset, offsetSec);

  applyTheme(w);
}

/* ---------- Кривая температур (SVG) ---------- */
function renderHourly(list, offsetSec) {
  const items = list.slice(0, 8);
  const W = 1000, H = 260, PAD = 40;
  const temps = items.map((i) => i.main.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const range = max - min || 1;
  const step = (W - PAD * 2) / (items.length - 1);
  const x = (i) => PAD + i * step;
  const y = (v) => PAD + (1 - (v - min) / range) * (H - PAD * 2);

  const pts = items.map((it, i) => ({
    x: x(i), y: y(it.main.temp), t: it.main.temp,
    label: i === 0 ? t("now") : `${String(localDate(it.dt, offsetSec).getHours()).padStart(2, "0")}:00`,
    pop: it.pop ? Math.round(it.pop * 100) : null,
    icon: weatherGlyph(it.weather[0].id, it.sys.pod === "n")
  }));

  // Catmull-Rom → кубические Безье: кривая проходит строго через каждую точку
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }

  const area = `${d} L ${pts[pts.length - 1].x} ${H - PAD} L ${pts[0].x} ${H - PAD} Z`;

  const dots = pts.map((p, i) =>
    `<g class="c-pt">
       <circle class="c-hit" cx="${p.x}" cy="${p.y}" r="26" fill="transparent" data-i="${i}" style="cursor:pointer"/>
       <circle class="c-dot" cx="${p.x}" cy="${p.y}" r="9" fill="var(--bg-card)" stroke="var(--text-primary)" stroke-width="3"/>
     </g>`
  ).join("");

  const labels = pts.map((p) =>
    `<text x="${p.x}" y="${H - 8}" text-anchor="middle" font-family="Inter, sans-serif" font-size="22" font-weight="700" fill="var(--text-primary)" opacity="0.7">${p.label}</text>`
  ).join("");

  els.hourlyWrap.innerHTML = `
    <div class="curve-scroll">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="var(--accent)" stop-opacity="0.35"/>
            <stop offset="1" stop-color="var(--accent)" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${area}" fill="url(#areaGrad)"/>
        <path d="${d}" fill="none" stroke="var(--accent)" stroke-width="6" stroke-linecap="round"/>
        ${dots}
        ${labels}
      </svg>
      <div class="curve-tooltip" id="curveTip"></div>
    </div>`;

  const tip = els.hourlyWrap.querySelector("#curveTip");
  const svg = els.hourlyWrap.querySelector("svg");
  const scroll = els.hourlyWrap.querySelector(".curve-scroll");

  const showTip = (i) => {
    const p = pts[i];
    tip.textContent = `${p.label} · ${Math.round(p.t)}°${p.pop ? " · " + p.pop + "%" : ""}`;
    tip.style.opacity = "1";
    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width / W;
    tip.style.left = (p.x * scaleX - scroll.scrollLeft) + "px";
    tip.style.top = (p.y * (rect.height / H)) + "px";
  };
  const hideTip = () => { tip.style.opacity = "0"; };

  els.hourlyWrap.querySelectorAll(".c-hit").forEach((hit) => {
    const i = Number(hit.dataset.i);
    hit.addEventListener("mouseenter", () => showTip(i));
    hit.addEventListener("mousemove", () => showTip(i));
    hit.addEventListener("mouseleave", hideTip);
    hit.addEventListener("touchstart", (e) => { e.preventDefault(); showTip(i); }, { passive: false });
    hit.addEventListener("touchend", () => { setTimeout(hideTip, 900); });
  });
}

/* ---------- 5 дней ---------- */
function renderDaily(list, offsetSec) {
  const days = {};
  list.forEach((item) => {
    const key = cityDayKey(item.dt, offsetSec);
    if (!days[key]) days[key] = [];
    days[key].push(item);
  });

  const entries = Object.values(days).slice(0, 5);

  els.daily.innerHTML = entries.map((dayItems) => {
    const temps = dayItems.map((d) => d.main.temp);
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const peak = dayItems.find((d) => {
      const h = localDate(d.dt, offsetSec).getHours();
      return h >= 11 && h <= 15;
    }) || dayItems[Math.floor(dayItems.length / 2)];
    const label = dayLabel(dayItems[0].dt, offsetSec);
    return `
      <div class="day-row">
        <span class="day-name">${label}</span>
        <span class="day-icon">${weatherGlyph(peak.weather[0].id, peak.sys.pod === "n")}</span>
        <span class="day-temps">
          <span class="day-max">${fmtTemp(max)}°</span>
          <span class="day-min">${fmtTemp(min)}°</span>
        </span>
      </div>`;
  }).join("");
}

/* ---------- Marquee ---------- */
function renderMarquee(w) {
  const label = state.cityName || w.name;
  const chunk = `ATMOS · ${escapeHtml(label)} · ${fmtTemp(w.main.temp)}° · ${escapeHtml(w.weather[0].description)} · `;
  els.marqueeTrack.innerHTML = `<span>${chunk.repeat(4)}</span><span>${chunk.repeat(4)}</span>`;
}

/* ---------- Загрузка ---------- */
async function loadCity(lat, lon, name) {
  state.lat = lat;
  state.lon = lon;
  state.cityName = name;
  localStorage.setItem("atmos_last", JSON.stringify({ lat, lon, name, geoId: state.geoId }));
  showLoader();
  try {
    const [weather, forecast] = await Promise.all([
      fetchWeather(lat, lon, state.unit),
      fetchForecast(lat, lon, state.unit)
    ]);
    state.weather = weather;
    state.forecast = forecast;
    renderCurrent(weather);
    renderHourly(forecast.list, weather.timezone);
    renderDaily(forecast.list, weather.timezone);
    renderMarquee(weather);
    showContent();
  } catch (e) {
    showError(mapError(e));
  }
}

/* ---------- Поиск ---------- */
let debounceTimer = null;
els.searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const q = els.searchInput.value.trim();
  if (q.length < 2) { els.suggestions.classList.remove("show"); return; }
  debounceTimer = setTimeout(async () => {
    try {
      const results = await fetchGeo(q, 6);
      renderSuggestions(results);
    } catch (e) { els.suggestions.classList.remove("show"); }
  }, 350);
});

function renderSuggestions(list) {
  if (!list || !list.length) { els.suggestions.classList.remove("show"); return; }
  els.suggestions.innerHTML = list.map((c) => {
    const meta = [c.admin, c.country].filter(Boolean).join(", ");
    return `<div class="suggestion" data-lat="${c.lat}" data-lon="${c.lon}" data-id="${escapeHtml(c.id || "")}" data-name="${escapeHtml(c.name)}">
      <span class="s-name">${escapeHtml(c.name)}</span><span class="s-meta">${escapeHtml(meta)}</span>
    </div>`;
  }).join("");
  els.suggestions.classList.add("show");
}

function pickBest(list, q) {
  if (!list || !list.length) return null;
  const needle = normName(q).split(",")[0].trim();
  const exact = list.find((c) => normName(c.name) === needle);
  if (exact && exact.population * 2 >= list[0].population) return exact;
  return list[0];
}

els.suggestions.addEventListener("click", (e) => {
  const item = e.target.closest(".suggestion");
  if (!item) return;
  els.suggestions.classList.remove("show");
  els.searchInput.value = item.dataset.name;
  els.searchInput.blur();
  state.geoId = item.dataset.id ? parseInt(item.dataset.id, 10) : null;
  loadCity(parseFloat(item.dataset.lat), parseFloat(item.dataset.lon), item.dataset.name);
});

els.searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const q = els.searchInput.value.trim();
    if (!q) return;
    els.suggestions.classList.remove("show");
    (async () => {
      try {
        const results = await fetchGeo(q, 8);
        const best = pickBest(results, q);
        if (best) {
          state.geoId = best.id || null;
          loadCity(best.lat, best.lon, best.name);
        } else showError("errCity");
      } catch (e) { showError(mapError(e)); }
    })();
  }
  if (e.key === "Escape") { els.suggestions.classList.remove("show"); els.searchInput.blur(); }
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-box")) els.suggestions.classList.remove("show");
});

/* ---------- Геолокация ---------- */
els.geoBtn.addEventListener("click", () => {
  if (!navigator.geolocation) { showError("errGeo"); return; }
  els.geoBtn.classList.add("loading");
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      els.geoBtn.classList.remove("loading");
      state.geoId = null;
      try {
        const rev = await fetchReverseGeo(pos.coords.latitude, pos.coords.longitude);
        const name = rev && rev.length ? rev[0].name : "";
        loadCity(pos.coords.latitude, pos.coords.longitude, name);
      } catch (e) { loadCity(pos.coords.latitude, pos.coords.longitude, ""); }
    },
    () => { els.geoBtn.classList.remove("loading"); showError("errGeo"); },
    { timeout: 10000 }
  );
});

/* ---------- Переключатели ---------- */
document.querySelectorAll(".unit-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const unit = btn.getAttribute("data-unit");
    if (unit === state.unit) return;
    state.unit = unit;
    localStorage.setItem("atmos_unit", unit);
    document.querySelectorAll(".unit-btn").forEach((b) => b.classList.toggle("is-active", b.getAttribute("data-unit") === unit));
    if (state.lat && state.lon) loadCity(state.lat, state.lon, state.cityName);
  });
});
document.querySelectorAll(".lang-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const lang = btn.getAttribute("data-lang");
    if (lang === currentLang) return;
    setLang(lang);
    if (!state.lat || !state.lon) return;
    loadCity(state.lat, state.lon, await localizedCityName());
  });
});

/* Название текущего города на новом языке (по id из Open-Meteo) */
async function localizedCityName() {
  if (!state.geoId) return state.cityName;
  try {
    const r = await fetchGeoById(state.geoId);
    if (r && r.name) return r.name;
  } catch (e) {}
  return state.cityName;
}

/* ---------- Инициализация ---------- */
function init() {
  setLang(currentLang);
  document.querySelectorAll(".unit-btn").forEach((b) => b.classList.toggle("is-active", b.getAttribute("data-unit") === state.unit));

  const last = localStorage.getItem("atmos_last");
  if (last) {
    try {
      const p = JSON.parse(last);
      state.geoId = p.geoId || null;
      loadCity(p.lat, p.lon, p.name);
      return;
    } catch (e) {}
  }
  state.geoId = 524901;
  loadCity(55.7558, 37.6173, currentLang === "ru" ? "Москва" : "Moscow");
}

init();
