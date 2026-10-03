/* Глобальные словари перевода RU/EN */
const I18N = {
  ru: {
    searchPlaceholder: "Поиск города...",
    geoTitle: "Моя геолокация",
    sunrise: "Восход",
    sunset: "Закат",
    wind: "Ветер",
    humidity: "Влажность",
    pressure: "Давление",
    visibility: "Видимость",
    clouds: "Облачность",
    feelsLike: "Ощущается",
    hourly: "Почасовой прогноз",
    daily: "5 дней",
    powered: "данные",
    feels: (t) => `Ощущается как ${t}`,
    now: "Сейчас",
    today: "Сегодня",
    tomorrow: "Завтра",
    errNetwork: "Нет соединения с сетью. Проверьте интернет и попробуйте снова.",
    errCity: "Город не найден. Проверьте название.",
    errApi: "Сервис временно недоступен. Попробуйте позже.",
    errGeo: "Не удалось определить местоположение.",
    loading: "Загрузка...",
    windUnits: {
      metric: "м/с",
      imperial: "миль/ч"
    },
    visibilityUnits: {
      metric: "км",
      imperial: "миль"
    },
    pressureUnits: {
      metric: "мм",
      imperial: "дюйм рт. ст."
    }
  },
  en: {
    searchPlaceholder: "Search city...",
    geoTitle: "My location",
    sunrise: "Sunrise",
    sunset: "Sunset",
    wind: "Wind",
    humidity: "Humidity",
    pressure: "Pressure",
    visibility: "Visibility",
    clouds: "Cloudiness",
    feelsLike: "Feels like",
    hourly: "Hourly forecast",
    daily: "5 days",
    powered: "data by",
    feels: (t) => `Feels like ${t}`,
    now: "Now",
    today: "Today",
    tomorrow: "Tomorrow",
    errNetwork: "No network connection. Check your internet and try again.",
    errCity: "City not found. Check the name.",
    errApi: "Service temporarily unavailable. Try again later.",
    errGeo: "Unable to determine your location.",
    loading: "Loading...",
    windUnits: {
      metric: "m/s",
      imperial: "mph"
    },
    visibilityUnits: {
      metric: "km",
      imperial: "mi"
    },
    pressureUnits: {
      metric: "mmHg",
      imperial: "inHg"
    }
  }
};

/* Текущий язык */
let currentLang = localStorage.getItem("atmos_lang") || "ru";

function t(key, ...args) {
  const dict = I18N[currentLang] || I18N.ru;
  let val = dict;
  for (const part of key.split(".")) {
    val = val ? val[part] : undefined;
  }
  if (val === undefined) return key;
  if (typeof val === "function") return val(...args);
  return val;
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("atmos_lang", lang);
  document.documentElement.lang = lang;
  applyTranslations();
}

/* Применяет атрибуты data-i18n к элементам */
function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.setAttribute("title", t(el.getAttribute("data-i18n-title")));
  });
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    btn.classList.toggle("is-active", btn.getAttribute("data-lang") === currentLang);
  });
}
