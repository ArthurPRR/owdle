import heroes from "./data/heroes.json";
import { attributeLabels, gameText, valueTranslations } from "./translate.js";
import { renderHeader, attachHeaderEvents } from "./header.js";
import { renderFooter } from "./footer.js";

const state = {
  answer: null,
  guesses: [],
  messageKey: "",
  solved: false,
  mode: "random",
  timeZone: "UTC",
  locale: getInitialLocale(),
  theme: getInitialTheme(),
};

let countdownTimer = null;

const attributeKeys = ["name", "species", "role", "continent", "affiliation", "gender", "year"];

const uiText = gameText;

const root = document.getElementById("app");

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
const dailyStateKeyPrefix = "owdle-daily";
const gitUrl = "https://github.com/";

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

function getDailyStorageKey(timeZone) {
  const dateKey = getDateKey(timeZone);
  return `${dailyStateKeyPrefix}-${dateKey}`;
}

function loadDailyState(timeZone) {
  if (typeof localStorage === "undefined") {
    return null;
  }

  const storageKey = getDailyStorageKey(timeZone);

  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveDailyState(timeZone) {
  if (typeof localStorage === "undefined") {
    return;
  }

  const storageKey = getDailyStorageKey(timeZone);
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

function getInitialTheme() {
  if (typeof localStorage === "undefined") {
    return "light";
  }

  try {
    const saved = localStorage.getItem("owdle-theme");
    return saved === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function saveTheme(theme) {
  if (typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem("owdle-theme", theme);
  } catch {
    return;
  }
}

function applyTheme(theme) {
  if (document?.documentElement) {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }
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

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  saveTheme(state.theme);
  render();
}

function launchConfetti() {
  const container = document.createElement("div");
  container.className = "confetti-container";
  document.body.appendChild(container);

  const colors = ["#f2a43c", "#3a7f5c", "#ef4444", "#4f46e5", "#f59e0b", "#06b6d4"];
  const pieces = 90;

  for (let index = 0; index < pieces; index += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";

    const left = Math.random() * 100;
    const duration = 1200 + Math.random() * 1200;
    const delay = Math.random() * 220;
    const drift = -40 + Math.random() * 80;
    const size = 6 + Math.random() * 7;
    const rotation = Math.random() * 360;

    piece.style.left = `${left}%`;
    piece.style.setProperty("--confetti-color", colors[index % colors.length]);
    piece.style.setProperty("--confetti-duration", `${duration}ms`);
    piece.style.setProperty("--confetti-delay", `${delay}ms`);
    piece.style.setProperty("--confetti-drift", `${drift}px`);
    piece.style.width = `${size}px`;
    piece.style.height = `${Math.max(4, size * 0.6)}px`;
    piece.style.transform = `translateY(-12vh) rotate(${rotation}deg)`;

    container.appendChild(piece);
  }

  setTimeout(() => {
    container.remove();
  }, 3200);
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

function normalizeLoose(value) {
  return normalize(value).replace(/[^a-z0-9]/g, "");
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

function findHeroByName(name) {
  const target = normalize(name);
  const targetLoose = normalizeLoose(name);
  return (
    heroes.find((hero) => {
      const primaryName = getHeroDisplayName(hero);
      const primary = normalize(primaryName);
      const primaryLoose = normalizeLoose(primaryName);
      const alt = getHeroAltName(hero);
      const altNormalized = alt ? normalize(alt) : null;
      const aliases = hero.aliases ?? [];
      const aliasMatch = aliases.some((alias) => {
        const aliasNormalized = normalize(alias);
        const aliasLoose = normalizeLoose(alias);
        return (
          aliasNormalized === target ||
          aliasLoose === targetLoose ||
          (targetLoose && aliasLoose === targetLoose)
        );
      });

      return (
        primary === target ||
        primaryLoose === targetLoose ||
        (altNormalized && altNormalized === target) ||
        aliasMatch
      );
    }) || null
  );
}

function getHeroDisplayName(hero, locale = state.locale) {
  if (locale === "fr" && hero.nameFr) {
    return hero.nameFr;
  }

  return hero.name;
}

function getHeroImageUrl(hero) {
  const slug = hero.image ?? slugifyName(hero.name);
  return heroImageMap[slug] ?? null;
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

function sortHeroesByName(list) {
  return [...list].sort((a, b) =>
    getHeroSuggestionName(a).localeCompare(getHeroSuggestionName(b), state.locale, {
      sensitivity: "base",
    })
  );
}

const suggestionLimit = 8;

function buildSuggestions(query) {
  if (!query) {
    return [];
  }

  const available = getAvailableHeroes();
  const matches = getMatchingHeroes(query, available);
  return sortHeroesByName(matches).slice(0, suggestionLimit);
}

function getSuggestionItemHtml(hero, isActive) {
  const displayName = getHeroSuggestionName(hero);
  const imageUrl = getHeroImageUrl(hero);
  const imageHtml = imageUrl
    ? `<img class=\"hero-avatar\" src=\"${imageUrl}\" alt=\"${displayName}\" loading=\"lazy\" />`
    : "";
  const activeClass = isActive ? " active" : "";

  return `
    <button type=\"button\" class=\"suggestion-button${activeClass}\" role=\"option\" aria-selected=\"${
      isActive
    }\" data-hero=\"${hero.name}\">
      <span class=\"hero-label\">${imageHtml}<span>${displayName}</span></span>
    </button>
  `;
}

function getMatchingHeroes(query, list) {
  const target = normalize(query);
  const targetLoose = normalizeLoose(query);
  if (!target) {
    return [];
  }

  return list.filter((hero) => {
    const primaryName = getHeroSuggestionName(hero);
    const primary = normalize(primaryName);
    const primaryLoose = normalizeLoose(primaryName);
    if (primary.startsWith(target) || primaryLoose.startsWith(targetLoose)) {
      return true;
    }

    const aliases = hero.aliases ?? [];
    const aliasMatch = aliases.some((alias) => {
      const aliasNormalized = normalize(alias);
      const aliasLoose = normalizeLoose(alias);
      return (
        aliasNormalized.startsWith(target) ||
        aliasLoose.startsWith(targetLoose) ||
        aliasNormalized === target ||
        aliasLoose === targetLoose
      );
    });
    if (aliasMatch) {
      return true;
    }

    const alt = getHeroAltName(hero);
    if (alt) {
      const altNormalized = normalize(alt);
      return altNormalized === target;
    }

    return false;
  });
}

function isAutoSelectMatch(hero, query) {
  const target = normalize(query);
  const targetLoose = normalizeLoose(query);
  const displayName = getHeroSuggestionName(hero);
  const display = normalize(displayName);
  const displayLoose = normalizeLoose(displayName);

  if (display.startsWith(target) || displayLoose.startsWith(targetLoose)) {
    return true;
  }

  const aliases = hero.aliases ?? [];
  return aliases.some((alias) => {
    const aliasNormalized = normalize(alias);
    const aliasLoose = normalizeLoose(alias);
    return aliasNormalized.startsWith(target) || aliasLoose.startsWith(targetLoose);
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
    const displayName = getHeroDisplayName(hero);
    const imageUrl = getHeroImageUrl(hero);
    const imageHtml = imageUrl
      ? `<img class=\"hero-avatar\" src=\"${imageUrl}\" alt=\"${displayName}\" loading=\"lazy\" />`
      : "";

    return `<span class=\"hero-label\">${imageHtml}<span>${displayName}</span></span>`;
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
          let cellValue = formatValue(guess, key);

          if (key === "year" && cellClass === "cell wrong") {
            const guessYear = Number(guess.year);
            const answerYear = Number(state.answer?.year);

            if (!Number.isNaN(guessYear) && !Number.isNaN(answerYear)) {
              const isEarlier = guessYear < answerYear;
              const arrowClass = isEarlier ? "year-up" : "year-down";
              const arrowSymbol = isEarlier ? "&uarr;" : "&darr;";
              cellValue = `${cellValue}<span class=\"year-arrow ${arrowClass}\" aria-hidden=\"true\">${arrowSymbol}</span>`;
            }
          }

          return `<td class=\"${cellClass}\">${cellValue}</td>`;
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

  applyTheme(state.theme);

  const guessCount = state.guesses.length;
  const solved = state.solved;
  const message = state.messageKey ? getText(state.messageKey) : "";

  root.innerHTML = `
    <main class=\"layout\">
      ${renderHeader(state.locale, state.theme, (nextLocale) => setLocale(nextLocale), () => toggleTheme())}

      <section class=\"controls\">
        <form id=\"guess-form\">
          <label for=\"guess-input\">${getText("labelHero")}</label>
          <div class=\"autocomplete\">
            <div class=\"input-row\">
              <input id=\"guess-input\" name=\"guess\" autocomplete=\"off\" aria-autocomplete=\"list\" aria-controls=\"hero-suggestions\" placeholder=\"${getText(
                "placeholder"
              )}\" required ${
                solved ? "disabled" : ""
              } />
              <button type=\"submit\" class=\"submit-button\" ${solved ? "disabled" : ""}\">${getText(
                "guess"
              )}</button>
            </div>
            <div class=\"suggestions\" id=\"hero-suggestions\" role=\"listbox\" aria-label=\"${getText(
              "labelHero"
            )}\"></div>
          </div>
          <p class=\"message\">${message}</p>
          <p class=\"muted\">${getText("guesses", state.guesses.length)}</p>
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
                ${
                  state.mode !== "daily"
                    ? `<button type=\"button\" class=\"replay\" id=\"replay-button\">${getText(
                        "replay"
                      )}</button>`
                    : ""
                }
              </div>`
            : ``
        }
      </section>
      ${renderFooter(gitUrl, "GitHub")}
    </main>
  `;

  const form = document.getElementById("guess-form");
  const input = document.getElementById("guess-input");
  const suggestions = document.getElementById("hero-suggestions");
  const replayButton = document.getElementById("replay-button");

  attachHeaderEvents((nextLocale) => setLocale(nextLocale), () => toggleTheme());

  let currentSuggestions = [];
  let activeIndex = -1;

  const renderSuggestions = () => {
    if (!suggestions) {
      return;
    }

    if (currentSuggestions.length === 0) {
      suggestions.innerHTML = "";
      suggestions.classList.remove("open");
      return;
    }

    suggestions.classList.add("open");
    suggestions.innerHTML = currentSuggestions
      .map((hero, index) => getSuggestionItemHtml(hero, index === activeIndex))
      .join("");
  };

  const updateSuggestions = () => {
    currentSuggestions = buildSuggestions(input.value.trim());
    if (activeIndex >= currentSuggestions.length) {
      activeIndex = currentSuggestions.length - 1;
    }
    renderSuggestions();
  };

  const selectSuggestion = (hero) => {
    input.value = getHeroSuggestionName(hero);
    currentSuggestions = [];
    activeIndex = -1;
    renderSuggestions();

    if (typeof form.requestSubmit === "function") {
      form.requestSubmit();
    } else {
      form.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  };

  updateSuggestions();

  input.addEventListener("input", () => {
    activeIndex = -1;
    updateSuggestions();
  });

  input.addEventListener("keydown", (event) => {
    if (!currentSuggestions.length) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % currentSuggestions.length;
      renderSuggestions();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + currentSuggestions.length) % currentSuggestions.length;
      renderSuggestions();
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(currentSuggestions[activeIndex]);
    }

    if (event.key === "Escape") {
      currentSuggestions = [];
      activeIndex = -1;
      renderSuggestions();
    }
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      currentSuggestions = [];
      activeIndex = -1;
      renderSuggestions();
    }, 120);
  });

  if (suggestions) {
    suggestions.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });

    suggestions.addEventListener("click", (event) => {
      const target = event.target.closest(".suggestion-button");
      if (!target) {
        return;
      }

      const heroName = target.dataset.hero;
      const hero = heroes.find((entry) => entry.name === heroName);
      if (hero) {
        selectSuggestion(hero);
      }
    });
  }

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
      const matches = sortHeroesByName(getMatchingHeroes(value, available)).filter((entry) =>
        isAutoSelectMatch(entry, value)
      );
      if (matches.length > 0) {
        hero = matches[0];
        input.value = getHeroSuggestionName(hero);
      } else {
        state.messageKey = "unknownHero";
        render();
        const nextInput = document.getElementById("guess-input");
        if (nextInput) {
          nextInput.focus();
        }
        return;
      }
    }

    if (state.guesses.some((guess) => guess.name === hero.name)) {
      state.messageKey = "alreadyGuessed";
      render();
      return;
    }

    const shouldScrollToWin = !state.solved && hero.name === state.answer.name;
    state.messageKey = "";
    state.guesses = [hero, ...state.guesses];
    state.solved = hero.name === state.answer.name;
    if (state.mode === "daily") {
      saveDailyState(state.timeZone);
    }
    input.value = "";
    render();

    const latestRow = document.querySelector(".results tbody tr");
    if (latestRow) {
      latestRow.classList.add("hero-selected-row");
      setTimeout(() => {
        latestRow.classList.remove("hero-selected-row");
      }, 1200);
    }

    if (shouldScrollToWin) {
      launchConfetti();
    }

    if (shouldScrollToWin) {
      const winMessage = document.querySelector(".win");
      if (winMessage) {
        const targetTop =
          winMessage.getBoundingClientRect().top + window.scrollY - 16;
        console.log("scrollY:", window.scrollY);
        console.log("targetTop:", targetTop);
        window.scrollTo({
          top: targetTop,
          behavior: "smooth"
        });
      }
    }

    const nextInput = document.getElementById("guess-input");
    if (nextInput && !state.solved) {
      nextInput.focus();
    }
  });

  if (replayButton) {
    replayButton.addEventListener("click", () => {
      initGame();
    });
  }

  startCountdown();
}

export function initGame(options = {}) {
  const mode = options.mode ?? "random";
  const timeZone = options.timeZone ?? "UTC";
  const locale = options.locale ?? state.locale ?? getInitialLocale();

  state.answer = mode === "daily" ? pickDaily(heroes, timeZone) : pickRandom(heroes);
  state.messageKey = "";
  state.guesses = [];
  state.solved = false;
  state.mode = mode;
  state.timeZone = timeZone;
  state.locale = locale;

  if (mode === "daily") {
    const saved = loadDailyState(timeZone);
    if (saved) {
      state.guesses = saved.guesses
        .map((name) => heroes.find((hero) => hero.name === name) || null)
        .filter(Boolean);
      state.solved = Boolean(saved.solved);
    }
  }

  render();
}

export function initDailyGame(timeZone = "UTC") {
  initGame({ mode: "daily", timeZone });
}
