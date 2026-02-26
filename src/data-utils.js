export { getText, getAttributeLabel, translateValue,
    pickDaily, pickRandom, getCountdownText,
    startCountdown, stopCountdown, getHeroDisplayName,
    getHeroSuggestionName, slugifyName,
    getHeroImageUrl, getHeroAltName,
    saveDailyState, loadDailyState, normalize,
    getTriedHeroItemHtml };
 

import { getInitialLocale } from "./settings.js";
import { gameText, valueTranslations, attributeLabels } from "./translate.js";



let countdownTimer = null;

function buildHeroImageMap() {
  const images = import.meta.glob("./assets/heroes/*.{png,jpg,jpeg,webp}", {
    eager: true,
    import: "default",
  });

  return Object.fromEntries(
    Object.entries(images).map(([path, url]) => {
      const filename = path.split("/").pop() ?? "";
      const slug = filename.replace(/\.(png|jpe?g|webp)$/i, "").toLowerCase();
      return [slug, url];
    })
  );
}


const heroImageMap = buildHeroImageMap();

// pick related utils
function pickRandom(list) {
  const index = Math.floor(Math.random() * list.length);
  return list[index];
}

function getDateKey(timeZone) {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    return formatter.format(new Date());
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

function hashString(value) {
  let hash = 5381;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }

  return Math.abs(hash);
}


// seed offset is for different game modes, pick a different number for each game mode
function pickDaily(list, timeZone, seedOffset = 0) {
  const key = getDateKey(timeZone);

  const compositeKey = `${key}-${seedOffset}`;

  const index = hashString(compositeKey) % list.length;
  return list[index];
}



// save related utils
const dailyStateKeyPrefix = "owdle-daily";

function getDailyStorageKey({ timeZone, mode }) {
  const dateKey = getDateKey(timeZone);
  return `${dailyStateKeyPrefix}-${mode}-${dateKey}`;
}

function loadDailyState(timeZone, mode) {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const storageKey = getDailyStorageKey({ timeZone, mode });

  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDailyState(state, timeZone, mode) {
  if (typeof localStorage === "undefined") {
    return;
  }

  const storageKey = getDailyStorageKey({ timeZone, mode });

  const payload = {
    guesses: state.guesses.map((guess) => guess.name),
    solved: state.solved,
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    return;
  }
}


//translation related utils
function getText(uiText, key, ...args) {
  const entry = uiText[getInitialLocale()]?.[key] ?? uiText.en[key];

  if (typeof entry === "function") {
    return entry(...args);
  }

  return entry ?? "";
}

function getAttributeLabel(key) {
  return attributeLabels[getInitialLocale()]?.[key] ?? attributeLabels.en[key] ?? key;
}

function translateValue(key, value) {
  const translations = valueTranslations[getInitialLocale()]?.[key];

  if (!translations) {
    return value;
  }

  return translations[value] ?? value;
}

// countdown related utils
function getDateParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function getTimeZoneOffsetMs(date, timeZone) {
  const parts = getDateParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return asUtc - date.getTime();
}

function getNextMidnight(timeZone) {
  const now = new Date();
  const parts = getDateParts(now, timeZone);
  const offsetMs = getTimeZoneOffsetMs(now, timeZone);
  const nextMidnightLocalUtc =
    Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0) + 24 * 60 * 60 * 1000;

  return new Date(nextMidnightLocalUtc - offsetMs);
}

function formatDuration(ms) {
  const clamped = Math.max(0, ms);
  const totalSeconds = Math.floor(clamped / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

function getCountdownText(timeZone) {

  const nextMidnight = getNextMidnight(timeZone);
  const diffMs = nextMidnight.getTime() - Date.now();
  return getText(gameText,"dailyCountdown", formatDuration(diffMs));
}

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function startCountdown(timeZone) {
  stopCountdown();


  const countdown = document.getElementById("daily-countdown");

  if (!countdown) {
    return;
  }

  const update = () => {
    countdown.textContent = getCountdownText(timeZone);
  };

  update();
  countdownTimer = setInterval(update, 1000);
}


// hero related utils
function normalize(value) {
  return value.trim().toLowerCase();
}

function getHeroSuggestionName(hero) {
  return getHeroDisplayName(hero);
}

function slugifyName(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}


function getHeroDisplayName(hero, locale = getInitialLocale()) {
  if (locale === "fr" && hero.nameFr) {
    return hero.nameFr;
  }

  return hero.name;
}

function getHeroImageUrl(hero) {
  const slug = hero.image ?? slugifyName(hero.name);
  return heroImageMap[slug] ?? null;
}

function getHeroAltName(hero, locale = getInitialLocale()) {
  if (locale === "fr") {
    return hero.name;
  }

  return hero.nameFr ?? null;
}


function getTriedHeroItemHtml(hero, state) {
  const name = getHeroDisplayName(hero);
  const imageUrl = getHeroImageUrl(hero);

  return `
    <div class="silhouette-tried-item${hero.name === state.answer.name ? " is-correct" : ""}" title="${name}">
      ${
        imageUrl
          ? `<img class="silhouette-tried-avatar" src="${imageUrl}" alt="${name}" loading="lazy" />`
          : `<div class="silhouette-tried-avatar silhouette-tried-avatar-empty" aria-hidden="true"></div>`
      }
      <span>${name}</span>
    </div>
  `;
}