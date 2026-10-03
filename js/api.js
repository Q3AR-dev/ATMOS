/* Обёртки над OpenWeatherMap API */
const API = {
  key: "ba4dff1b50f6ac9b2d872b569c17d3af",
  base: "https://api.openweathermap.org"
};

/* Текущий язык API (ru/en) — OpenWeatherMap поддерживает оба */
function apiLang() {
  return currentLang === "ru" ? "ru" : "en";
}

function buildUnits(unit) {
  return unit === "imperial" ? "imperial" : "metric";
}

/* Текущая погода */
async function fetchWeather(lat, lon, unit) {
  const url = `${API.base}/data/2.5/weather?lat=${lat}&lon=${lon}&units=${buildUnits(unit)}&lang=${apiLang()}&appid=${API.key}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) throw new Error("city");
    if (res.status === 401 || res.status === 429) throw new Error("api");
    throw new Error("network");
  }
  return res.json();
}

/* Прогноз (5 дней / 3 часа) */
async function fetchForecast(lat, lon, unit) {
  const url = `${API.base}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${buildUnits(unit)}&lang=${apiLang()}&appid=${API.key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("network");
  return res.json();
}

/* Геокодирование — поиск города (Open-Meteo, без ключа) */
function normName(s) {
  return String(s).toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
}

async function fetchGeo(query, limit = 6) {
  const lang = (currentLang === "ru" || /[а-яё]/i.test(query)) ? "ru" : "en";
  const count = Math.min(Math.max(limit * 6, 30), 100);
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=${count}&language=${lang}&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("network");
  const data = await res.json();
  const results = Array.isArray(data.results) ? data.results : [];
  const needle = normName(String(query).split(",")[0]);
  return results
    .map((r) => ({
      id: r.id,
      name: r.name,
      lat: r.latitude,
      lon: r.longitude,
      country: r.country || r.country_code || "",
      admin: r.admin1 || "",
      population: r.population || 0,
      isPlace: /^PPL/.test(r.feature_code || "")
    }))
    .map((c) => {
      const n = normName(c.name);
      c.tier = n.startsWith(needle) ? 2 : n.includes(needle) ? 1 : 0;
      return c;
    })
    .sort((a, b) =>
      (b.population - a.population) ||
      (b.tier - a.tier) ||
      ((b.isPlace) - (a.isPlace)) ||
      a.name.localeCompare(b.name)
    )
    .slice(0, limit);
}

/* Имя города на другом языке — по id из Open-Meteo */
async function fetchGeoById(id) {
  const lang = currentLang === "ru" ? "ru" : "en";
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/get?id=${encodeURIComponent(id)}&language=${lang}`);
  if (!res.ok) throw new Error("network");
  const data = await res.json();
  return data && !data.error ? data : null;
}

/* Обратное геокодирование — по координатам */
async function fetchReverseGeo(lat, lon) {
  const url = `${API.base}/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API.key}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("network");
  return res.json();
}
