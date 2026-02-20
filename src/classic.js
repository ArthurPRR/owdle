import heroes from "./data/heroes.json";
import { gameText } from "./translate.js";
import { renderHeader, attachHeaderEvents } from "./header.js";
import { renderFooter } from "./footer.js";
import {
  findHeroByName,
  getMatchingHeroes,
  isAutoSelectMatch,
  setupHeroAutocomplete,
  sortHeroesByName,
  getAvailableHeroes,
} from "./heroAutocomplete.js";

import { getText, getAttributeLabel, translateValue,
    pickDaily, pickRandom, getHeroSuggestionName,
    startCountdown, getHeroDisplayName,
    getHeroImageUrl, getHeroAltName,
    saveDailyState, loadDailyState, normalize } from "./data-utils.js";

import { getInitialLocale, getInitialTheme, applyTheme, toggleTheme, setLocale } from "./settings.js";

import { applyWin } from "./winScroll.js";

const state = {
  answer: null,
  guesses: [],
  messageKey: "",
  solved: false,
  mode: "unlimited",
  timeZone: "UTC",
};

const gameMode = "classic";

function changeTheme(){
  toggleTheme();
  render();
}

function changeLanguage(locale){
  setLocale(locale);
  render();
}


const attributeKeys = ["name", "species", "role", "continent", "affiliation", "gender", "year"];

const uiText = gameText;

const root = document.getElementById("app");





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
    return `<p class=\"empty\">${getText(uiText,"empty")}</p>`;
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
    document.documentElement.lang = getInitialLocale();
  }

  applyTheme(getInitialTheme());

  const guessCount = state.guesses.length;
  const solved = state.solved;
  const message = state.messageKey ? getText(uiText,state.messageKey) : "";

  root.innerHTML = `
    <main class=\"layout\">
      ${renderHeader(getInitialLocale(), getInitialTheme(), changeLanguage, changeTheme)}

      <section class=\"controls\">
				<p class="subtitle">${getText(uiText, "subtitle")}</p>
        <form id=\"guess-form\">
          <label for=\"guess-input\">${getText(uiText, "labelHero")}</label>
          <div class=\"autocomplete\">
            <div class=\"input-row\">
              <input id=\"guess-input\" name=\"guess\" autocomplete=\"off\" aria-autocomplete=\"list\" aria-controls=\"hero-suggestions\" placeholder=\"${getText(
                uiText,
                "placeholder"
              )}\" required ${
                solved ? "disabled" : ""
              } />
              <button type=\"submit\" class=\"submit-button\" ${solved ? "disabled" : ""}\">${getText(uiText,
                "guess"
              )}</button>
            </div>
            <div class=\"suggestions\" id=\"hero-suggestions\" role=\"listbox\" aria-label=\"${getText(uiText, 
              "labelHero"
            )}\"></div>
          </div>
          <p class=\"message\">${message}</p>
          <p class=\"muted\">${getText(uiText, "guesses", state.guesses.length)}</p>
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
                <p class=\"win\">${getText(uiText, "win", getHeroDisplayName(state.answer))}</p>
                ${
                  state.mode !== "daily"
                    ? `<button type=\"button\" class=\"replay\" id=\"replay-button\">${getText(uiText, 
                        "replay"
                      )}</button>`
                    : ""
                }
              </div>`
            : ``
        }
      </section>
      ${renderFooter()}
    </main>
  `;

  const form = document.getElementById("guess-form");
  const input = document.getElementById("guess-input");
  const suggestions = document.getElementById("hero-suggestions");
  const replayButton = document.getElementById("replay-button");

  attachHeaderEvents(changeLanguage, changeTheme);

  setupHeroAutocomplete({
    input,
    suggestions,
    getCandidates: () => getAvailableHeroes(state.guesses),
    getAllHeroes: () => heroes,
    getLocale: () => getInitialLocale(),
    options: {
      getDisplayName: (hero) => getHeroSuggestionName(hero),
      getAltName: (hero) => getHeroAltName(hero),
      getImageUrl: (hero) => getHeroImageUrl(hero),
      getAliases: (hero) => hero.aliases ?? [],
    },
    onSelectSuggestion: (hero) => {
      input.value = getHeroSuggestionName(hero);

      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.dispatchEvent(new Event("submit", { cancelable: true }));
      }
    },
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

    const available = getAvailableHeroes(state.guesses);
    let hero = findHeroByName(value, heroes, {
      getDisplayName: (entry) => getHeroDisplayName(entry),
      getAltName: (entry) => getHeroAltName(entry),
      getAliases: (entry) => entry.aliases ?? [],
    });

    if (!hero) {
      const matches = sortHeroesByName(
        getMatchingHeroes(value, available, {
          getDisplayName: (entry) => getHeroSuggestionName(entry),
          getAltName: (entry) => getHeroAltName(entry),
          getAliases: (entry) => entry.aliases ?? [],
        }),
        getInitialLocale(),
        (entry) => getHeroSuggestionName(entry)
      ).filter((entry) =>
        isAutoSelectMatch(entry, value, {
          getDisplayName: (item) => getHeroSuggestionName(item),
          getAliases: (item) => item.aliases ?? [],
        })
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

    const justWon = !state.solved && hero.name === state.answer.name;
    if (justWon) {
      applyWin();
    }


    state.messageKey = "";
    state.guesses = [hero, ...state.guesses];
    state.solved = hero.name === state.answer.name;
    if (state.mode === "daily") {
      saveDailyState(state, state.timeZone, gameMode);
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
  if (state.mode === "daily") {
    startCountdown(state.timeZone);
  }
}

export function initGame(options = {}) {
  const mode = options.mode ?? "random";
  const timeZone = options.timeZone ?? "UTC";
  const locale = options.locale ?? getInitialLocale() ?? "en";

  state.answer = mode === "daily" ? pickDaily(heroes, timeZone, 1) : pickRandom(heroes);
  state.messageKey = "";
  state.guesses = [];
  state.solved = false;
  state.mode = mode;
  state.timeZone = timeZone;
  setLocale(locale);

  if (mode === "daily") {
    const saved = loadDailyState(timeZone, gameMode);
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
