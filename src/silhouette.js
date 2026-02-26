import "./styles.css";
import heroes from "./data/heroes.json";
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

import { getHeroDisplayName, getHeroImageUrl, pickDaily, pickRandom,
	getText, saveDailyState, loadDailyState, getTriedHeroItemHtml,
 } from "./data-utils.js";


import { getInitialLocale, getInitialTheme, applyTheme, toggleTheme, setLocale } from "./settings.js";

import { silhouetteText, landingModes  } from "./translate.js";
import { applyWin } from "./winScroll.js";



const state = {
	mode: "unlimited",
	timeZone: "UTC",
	answer: null,
	rotation: 0,
	focusX: 50,
	focusY: 50,
	guesses: [],
	solved: false,
	message: "",
};
const gameMode = "silhouette";
const nextGameMode = landingModes.find((mode) => mode.id === "daily classic");

function changeTheme(){
  toggleTheme();
  render();
}

function changeLanguage(locale){
  setLocale(locale);
  render();
}


const root = document.getElementById("app");



function getSilhouetteStyle() {
	if (state.solved) {
		return`
			width: 100%;
			height: 100%;
			display: block;
			object-fit: cover;
			transition: transform 280ms ease, filter 280ms ease;
	`;}

	const reveal = Math.min(state.guesses.length, 8);
	const blur = state.solved ? 0 : Math.max(0, 9 - reveal * 1.2);
	const rotation = state.guesses.length >= 10 ? 0 : state.rotation;

	return `
		width: 100%;
		height: 100%;
		display: block;
		object-fit: cover;
		object-position: ${state.focusX}% ${state.focusY}%;
		transform: rotate(${rotation}deg);
		filter: grayscale(1) brightness(0.12) contrast(1.35) blur(${blur}px);
		transition: transform 280ms ease, filter 280ms ease;
	`;
}


function render() {
	if (document?.documentElement) {
		document.documentElement.lang = getInitialLocale();
	}

	applyTheme(getInitialTheme());

	const uiText = silhouetteText;
	const imageUrl = getHeroImageUrl(state.answer);
	const attemptsUsed = state.guesses.length;
	const statusText = state.solved
		? getText(uiText, "win", getHeroDisplayName(state.answer))
		: state.message;

	root.innerHTML = `
		<main class="layout">
			${renderHeader(
				getInitialLocale(),
				getInitialTheme(),
				changeLanguage,
				changeTheme
			)}

			<section class="controls">
				<p class="subtitle">${getText(uiText, "subtitle")}</p>
			</section>

			<section class="frame" style="margin-bottom: 24px;">
				${
					imageUrl
						? `<div class="silhouette-frame"><img src="${imageUrl}" alt="silhouette" style="${getSilhouetteStyle()}" /></div>`
						: ""
				}
			</section>

			<section class="controls">
				<form id="silhouette-form">
					<label for="silhouette-input">${getText(uiText, "labelHero")}</label>
					<div class="autocomplete">
						<div class="input-row">
							<input
								id="silhouette-input"
								name="guess"
								autocomplete="off"
								aria-autocomplete="list"
								aria-controls="silhouette-suggestions"
								placeholder="${getText(uiText, "placeholder")}"
								${state.solved ? "disabled" : ""}
								required
							/>
							<button type="submit" class="submit-button" ${state.solved ? "disabled" : ""}>${getText(uiText, "guess")}</button>

						</div>
						<div class="suggestions" id="silhouette-suggestions" role="listbox" aria-label="${getText(uiText, "labelHero")}"></div>
					</div>
				</form>
				<p class="muted" style="margin-top: 10px;">${getText(uiText, "guesses", attemptsUsed)}</p>
			</section>

			<section class="results">
				${
					state.guesses.length
						? `<div class="silhouette-tried-grid">${state.guesses
								.map((hero) => getTriedHeroItemHtml(hero, state))
								.join("")}</div>`
						: `<p class="empty">${getText(uiText, "empty")}</p>`
				}
			</section>
		<section class=\"status\">
        ${
          state.mode === "daily"
            ? `<p class=\"daily-countdown\" id=\"daily-countdown\"></p>`
            : ""
        }
        ${
          state.solved
            ? `<div class=\"win-row\">
                <p class=\"win\">${getText(uiText, "win", getHeroDisplayName(state.answer))}</p>
                ${
                  state.mode !== "daily"
                    ? `<button type=\"button\" class=\"replay\" id=\"replay-button\">${getText(uiText, 
                        "replay"
                      )}</button>`
                    : `<a href="${nextGameMode.href || "#"}" class=\"next-mode\" id=\"next-mode-card\">
					  ${nextGameMode.title[getInitialLocale()]} &rarr;
                      </a>`
                }
              </div>`
            : ``
        }

			${renderFooter()}
		</main>
	`;

	attachHeaderEvents(changeLanguage, changeTheme);

	const form = document.getElementById("silhouette-form");
	const input = document.getElementById("silhouette-input");
	const suggestions = document.getElementById("silhouette-suggestions");
	const replayButton = document.getElementById("replay-button");

	setupHeroAutocomplete({
		input,
		suggestions,
		getCandidates: () => getAvailableHeroes(state.guesses),
		getAllHeroes: () => heroes,
		getLocale: getInitialLocale,
		options: {
			getDisplayName: (hero) => getHeroDisplayName(hero),
			getAltName: (hero) => (getInitialLocale() === "fr" ? hero.name : hero.nameFr ?? null),
			getImageUrl: (hero) => getHeroImageUrl(hero),
			getAliases: (hero) => hero.aliases ?? [],
		},
		onSelectSuggestion: (hero) => {
			input.value = getHeroDisplayName(hero);

			if (typeof form.requestSubmit === "function") {
				form.requestSubmit();
			} else {
				form.dispatchEvent(new Event("submit", { cancelable: true }));
			}
		},
	});
    

	if (form && input) {
		form.addEventListener("submit", (event) => {
			event.preventDefault();

			const value = input.value.trim();
			if (!value || state.solved) {
				return;
			}

			let hero = findHeroByName(value, heroes, {
				getDisplayName: (entry) => getHeroDisplayName(entry),
				getAltName: (entry) => (getInitialLocale() === "fr" ? entry.name : entry.nameFr ?? null),
				getAliases: (entry) => entry.aliases ?? [],
			});

            const available = getAvailableHeroes(state.guesses);
			if (!hero) {
				const matches = sortHeroesByName(
					getMatchingHeroes(value, available, {
						getDisplayName: (entry) => getHeroDisplayName(entry),
						getAltName: (entry) => (getInitialLocale() === "fr" ? entry.name : entry.nameFr ?? null),
						getAliases: (entry) => entry.aliases ?? [],
					}),
					getInitialLocale(),
					(entry) => getHeroDisplayName(entry)
				).filter((entry) =>
					isAutoSelectMatch(entry, value, {
						getDisplayName: (item) => getHeroDisplayName(item),
						getAliases: (item) => item.aliases ?? [],
					})
				);

				if (matches.length > 0) {
					hero = matches[0];
					input.value = getHeroDisplayName(hero);
				}
			}

			if (!hero) {
				state.message = uiText.unknownHero;
				render();
				return;
			}

			if (state.guesses.some((guess) => guess.name === hero.name)) {
				state.message = uiText.alreadyGuessed;
				render();
				return;
			}

            const justWon = !state.solved && hero.name === state.answer.name;
            if (justWon) {
                applyWin();
            }

			state.guesses = [...state.guesses, hero];
			state.solved = hero.name === state.answer.name;
			state.message = "";
			if (state.mode === "daily") {
				saveDailyState(state, state.timeZone, gameMode);
			}
			render();
		});
	}

    
    const nextInput = document.getElementById("silhouette-input");
    if (nextInput && !state.solved) {
        nextInput.focus();
    }

	if (replayButton) {
		replayButton.addEventListener("click", () => {
			startNewRound();
		});
	}
}

function startNewRound() {
	const rotations = [0, 90, 180, 270];
	const rotationIndex = Math.floor(Math.random() * rotations.length);

	
    state.answer = state.mode === "daily" ? pickDaily(heroes, state.timeZone, 3273) : pickRandom(heroes);

	state.rotation = rotations[rotationIndex];

	// unused except if we want to zoom instead of blurring
	state.focusX = 20 + Math.random() * 60;
	state.focusY = 20 + Math.random() * 60;

	state.guesses = [];
	state.solved = false;
	state.message = "";
}



export function initSilhouetteGame(options = {}) {
  state.mode = options.mode ?? "unlimited";
  state.timeZone = options.timeZone ?? "UTC";
  //const locale = options.locale ?? getInitialLocale() ?? "en";
  startNewRound();

  if (state.mode === "daily") {
    const saved = loadDailyState(state.timeZone, gameMode);
    if (saved) {
      state.guesses = saved.guesses
        .map((name) => heroes.find((hero) => hero.name === name) || null)
        .filter(Boolean);
      state.solved = Boolean(saved.solved);
    }
  }
  render();	
}


export function initDailySilhouetteGame(timeZone = "UTC") {
	initSilhouetteGame({mode: "daily", timeZone});
}
