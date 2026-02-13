import heroes from "./data/heroes.json";
import { attributeLabels, gameText, valueTranslations } from "./i18n.js";

const state = {
  answer: null,
  guesses: [],
  messageKey: "",
  solved: false,
  mode: "random",
  timeZone: "UTC",
  locale: getInitialLocale(),
};

let countdownTimer = null;

const attributeKeys = ["name", "species", "role", "continent", "affiliation", "gender", "year"];

const uiText = gameText;

const root = document.getElementById("app");

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

function pickDaily(list, timeZone) {
  const key = getDateKey(timeZone);
  const index = hashString(key) % list.length;
  return list[index];
}

const localeStorageKey = "owdle-locale";

function getUrlLocale() {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const value = params.get("lang");
  return value === "fr" || value === "en" ? value : null;
}

function loadSavedLocale() {
  if (typeof localStorage === "undefined") {
    return null;
  }

  try {
    return localStorage.getItem(localeStorageKey);
  } catch {
    return null;
  }
}

function saveLocale(locale) {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(localeStorageKey, locale);
  } catch {
    return;
  }
}

function getInitialLocale() {
  const savedLocale = loadSavedLocale();
  if (savedLocale === "fr" || savedLocale === "en") {
    return savedLocale;
  }

  const urlLocale = getUrlLocale();
  if (urlLocale) {
    return urlLocale;
  }

  return "en";
}

function getText(key, ...args) {
  const entry = uiText[state.locale]?.[key] ?? uiText.en[key];

  if (typeof entry === "function") {
    return entry(...args);
  }

  return entry ?? "";
}

function getAttributeLabel(key) {
  return attributeLabels[state.locale]?.[key] ?? attributeLabels.en[key] ?? key;
}

function translateValue(key, value) {
  const translations = valueTranslations[state.locale]?.[key];

  if (!translations) {
    return value;
  }

  return translations[value] ?? value;
}

function setLocale(locale) {
  if (state.locale === locale) {
    return;
  }

  state.locale = locale;
  saveLocale(locale);
  render();
}

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

function getCountdownText() {
  if (state.mode !== "daily") {
    return "";
  }

  const nextMidnight = getNextMidnight(state.timeZone);
  const diffMs = nextMidnight.getTime() - Date.now();
  return getText("dailyCountdown", formatDuration(diffMs));
}

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function startCountdown() {
  stopCountdown();

  if (state.mode !== "daily") {
    return;
  }

  const countdown = document.getElementById("daily-countdown");

  if (!countdown) {
    return;
  }

  const update = () => {
    countdown.textContent = getCountdownText();
  };

  update();
  countdownTimer = setInterval(update, 1000);
}

function normalize(value) {
  return value.trim().toLowerCase();
}

function findHeroByName(name) {
  const target = normalize(name);
  return (
    heroes.find((hero) => {
      const primary = normalize(getHeroDisplayName(hero));
      const alt = getHeroAltName(hero);
      const altNormalized = alt ? normalize(alt) : null;

      return primary === target || (altNormalized && altNormalized === target);
    }) || null
  );
}

function getHeroDisplayName(hero, locale = state.locale) {
  if (locale === "fr" && hero.nameFr) {
    return hero.nameFr;
  }

  return hero.name;
}

function getHeroAltName(hero, locale = state.locale) {
  if (locale === "fr") {
    return hero.name;
  }

  return hero.nameFr ?? null;
}

function compareRoles(guess, answer) {
  const guessRole = normalize(String(guess.role ?? ""));
  const answerRole = normalize(String(answer.role ?? ""));
  const guessSubrole = normalize(String(guess.subrole ?? ""));
  const answerSubrole = normalize(String(answer.subrole ?? ""));

  if (guessRole && guessRole === answerRole && guessSubrole === answerSubrole) {
    return "cell correct";
  }

  if (guessRole && guessRole === answerRole) {
    return "cell partial";
  }

  return "cell wrong";
}

function getAvailableHeroes() {
  const guessed = new Set(state.guesses.map((guess) => guess.name));
  return heroes.filter((hero) => !guessed.has(hero.name));
}

function sortHeroesByName(list, locale = state.locale) {
  return [...list].sort((a, b) =>
    getHeroDisplayName(a, locale).localeCompare(getHeroDisplayName(b, locale), locale, {
      sensitivity: "base",
    })
  );
}

function updateHeroOptions(query = "") {
  const datalist = document.getElementById("hero-options");
  if (!datalist) {
    return;
  }

  const available = getAvailableHeroes();
  const filtered = query ? getMatchingHeroes(query, available) : available;
  const sorted = sortHeroesByName(filtered);

  datalist.innerHTML = sorted
    .map((hero) => `<option value=\"${getHeroDisplayName(hero)}\"></option>`)
    .join("");
}

function getMatchingHeroes(query, list) {
  const target = normalize(query);
  if (!target) {
    return [];
  }

  return list.filter((hero) => {
    const primary = normalize(getHeroDisplayName(hero));
    if (primary.startsWith(target)) {
      return true;
    }

    const alt = getHeroAltName(hero);
    return alt ? normalize(alt) === target : false;
  });
}

function compareValues(guess, answer, key) {
  if (key === "role") {
    return compareRoles(guess, answer);
  }

  const guessValue = guess[key];
  const answerValue = answer[key];

  const guessList = Array.isArray(guessValue) ? guessValue : [guessValue];
  const answerList = Array.isArray(answerValue) ? answerValue : [answerValue];

  const normalizedGuess = guessList
    .map((item) => normalize(String(item ?? "")))
    .filter(Boolean);
  const normalizedAnswer = answerList
    .map((item) => normalize(String(item ?? "")))
    .filter(Boolean);

  const isExact =
    normalizedGuess.length === normalizedAnswer.length &&
    normalizedGuess.every((item) => normalizedAnswer.includes(item));

  if (isExact) {
    return "cell correct";
  }

  const hasPartial = normalizedGuess.some((item) => normalizedAnswer.includes(item));

  if (key === "affiliation" && hasPartial) {
    return "cell partial";
  }

  return "cell wrong";
}

function formatValue(hero, key) {
  if (key === "name") {
    return getHeroDisplayName(hero);
  }

  if (key === "role") {
    const roleLabel = translateValue("role", hero.role);
    const subroleLabel = hero.subrole ? translateValue("subrole", hero.subrole) : "";
    return subroleLabel ? `${roleLabel} · ${subroleLabel}` : roleLabel;
  }

  const value = hero[key];
  if (Array.isArray(value)) {
    return value.map((item) => translateValue(key, item)).join(", ");
  }

  if (value === null || value === undefined) {
    return "";
  }

  return translateValue(key, value);
}

function renderGuesses() {
  if (state.guesses.length === 0) {
    return `<p class=\"empty\">${getText("empty")}</p>`;
  }

  const rows = state.guesses
    .map((guess) => {
      const cells = attributeKeys
        .map((key) => {
          const cellClass = compareValues(guess, state.answer, key);
          return `<td class=\"${cellClass}\">${formatValue(guess, key)}</td>`;
        })
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");

  const header = attributeKeys
    .map((key) => `<th>${getAttributeLabel(key)}</th>`)
    .join("");

  return `<table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table>`;
}

function render() {
  if (document?.documentElement) {
    document.documentElement.lang = state.locale;
  }

  const guessCount = state.guesses.length;
  const solved = state.solved;
  const message = state.messageKey ? getText(state.messageKey) : "";

  root.innerHTML = `
    <main class=\"layout\">
      <header>
        <div class=\"header-row\">
          <a class=\"eyebrow home-link\" href=\"/index.html\">${getText("eyebrow")}</a>
          <div class=\"lang-toggle\" role=\"group\" aria-label=\"Language\">
            <button type=\"button\" class=\"lang-button ${
              state.locale === "fr" ? "active" : ""
            }\" data-lang=\"fr\">FR</button>
            <button type=\"button\" class=\"lang-button ${
              state.locale === "en" ? "active" : ""
            }\" data-lang=\"en\">EN</button>
          </div>
        </div>
      </header>

      <section class=\"controls\">
        <form id=\"guess-form\">
          <label for=\"guess-input\">${getText("labelHero")}</label>
          <div class=\"input-row\">
            <input id=\"guess-input\" name=\"guess\" list=\"hero-options\" autocomplete=\"off\" placeholder=\"${getText(
              "placeholder"
            )}\" required ${
              solved ? "disabled" : ""
            } />
            <button type=\"submit\" ${solved ? "disabled" : ""}>${getText(
              "guess"
            )}</button>
          </div>
          <datalist id=\"hero-options\"></datalist>
          <p class=\"message\">${message}</p>
        </form>
      </section>

      <section class=\"results\">
        ${renderGuesses()}
      </section>

      <section class=\"status\">
        ${
          state.mode === "daily"
            ? `<p class=\"daily-countdown\" id=\"daily-countdown\"></p>`
            : ""
        }
        ${
          solved
            ? `<div class=\"win-row\">
                <p class=\"win\">${getText("win", getHeroDisplayName(state.answer))}</p>
                <button type=\"button\" class=\"replay\" id=\"replay-button\">${getText(
                  "replay"
                )}</button>
              </div>`
            : `<p class=\"muted\">${getText("guesses", state.guesses.length)}</p>`
        }
      </section>
    </main>
  `;

  const form = document.getElementById("guess-form");
  const input = document.getElementById("guess-input");
  const replayButton = document.getElementById("replay-button");
  const langButtons = document.querySelectorAll(".lang-button");

  updateHeroOptions(input.value);

  input.addEventListener("input", () => {
    updateHeroOptions(input.value.trim());
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (state.solved) {
      return;
    }

    const value = input.value.trim();
    if (!value) {
      return;
    }

    const available = getAvailableHeroes();
    let hero = findHeroByName(value);

    if (!hero) {
      const matches = sortHeroesByName(getMatchingHeroes(value, available));
      if (matches.length > 0) {
        hero = matches[0];
        input.value = getHeroDisplayName(hero);
      }
    }

    if (!hero) {
      state.messageKey = "unknownHero";
      render();
      return;
    }

    if (state.guesses.some((guess) => guess.name === hero.name)) {
      state.messageKey = "alreadyGuessed";
      render();
      return;
    }

    state.messageKey = "";
    state.guesses = [hero, ...state.guesses];
    state.solved = hero.name === state.answer.name;
    input.value = "";
    render();
  });

  if (replayButton) {
    replayButton.addEventListener("click", () => {
      initGame();
    });
  }

  langButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setLocale(button.dataset.lang ?? "en");
    });
  });

  startCountdown();
}

export function initGame(options = {}) {
  const mode = options.mode ?? "random";
  const timeZone = options.timeZone ?? "UTC";
  const locale = options.locale ?? state.locale ?? getInitialLocale();

  state.answer = mode === "daily" ? pickDaily(heroes, timeZone) : pickRandom(heroes);
  state.guesses = [];
  state.messageKey = "";
  state.solved = false;
  state.mode = mode;
  state.timeZone = timeZone;
  state.locale = locale;
  render();
}

export function initDailyGame(timeZone = "UTC") {
  initGame({ mode: "daily", timeZone });
}
