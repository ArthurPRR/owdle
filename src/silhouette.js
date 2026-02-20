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
} from "./heroAutocomplete.js";

import { getInitialLocale, getInitialTheme, applyTheme, toggleTheme, setLocale } from "./settings.js";

import { silhouetteText  } from "./translate.js";
import { applyWin } from "./winScroll.js";



const state = {
	mode: "daily",
	timeZone: "UTC",
	answer: null,
	rotation: 0,
	focusX: 50,
	focusY: 50,
	guesses: [],
	solved: false,
	message: "",
};


function changeTheme(){
  toggleTheme();
  render();
}

function changeLanguage(locale){
  setLocale(locale);
  render();
}


const root = document.getElementById("app");

const heroImageMap = buildHeroImageMap();

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

function pickDaily(list, timeZone = "UTC") {
	const key = getDateKey(timeZone);
	const index = hashString(`${key}-silhouette`) % list.length;
	return list[index];
}

function pickRandom(list) {
	const index = Math.floor(Math.random() * list.length);
	return list[index];
}

function getAvailableHeroes() {
  const guessed = new Set(state.guesses.map((guess) => guess.name));
  return heroes.filter((hero) => !guessed.has(hero.name));
}

function normalize(value) {
	return value.trim().toLowerCase();
}

function slugifyName(value) {
	return value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

function getHeroDisplayName(hero) {
	if (getInitialLocale() === "fr" && hero.nameFr) {
		return hero.nameFr;
	}

	return hero.name;
}

function getHeroImageUrl(hero) {
	const slug = hero.image ?? slugifyName(hero.name);
	return heroImageMap[slug] ?? null;
}

function getSilhouetteStyle() {
	const reveal = Math.min(state.guesses.length, 8);
	const blur = state.solved ? 0 : Math.max(0, 9 - reveal * 1.2);
	const rotation = state.solved || state.guesses.length >= 10 ? 0 : state.rotation;

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

function getTriedHeroItemHtml(hero) {
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

function render() {
	if (document?.documentElement) {
		document.documentElement.lang = getInitialLocale();
	}

	applyTheme(getInitialTheme());

	const ui = silhouetteText[getInitialLocale()] ?? silhouetteText.en;
	const imageUrl = getHeroImageUrl(state.answer);
	const attemptsUsed = state.guesses.length;
	const statusText = state.solved
		? ui.win(getHeroDisplayName(state.answer))
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
				<h1 class="title">${ui.title}</h1>
				<p class="subtitle">${ui.subtitle}</p>
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
					<label for="silhouette-input">${ui.labelHero}</label>
					<div class="autocomplete">
						<div class="input-row">
							<input
								id="silhouette-input"
								name="guess"
								autocomplete="off"
								aria-autocomplete="list"
								aria-controls="silhouette-suggestions"
								placeholder="${ui.placeholder}"
								${state.solved ? "disabled" : ""}
								required
							/>
							<button type="submit" class="submit-button" ${state.solved ? "disabled" : ""}>${ui.guess}</button>

						</div>
						<div class="suggestions" id="silhouette-suggestions" role="listbox" aria-label="${ui.labelHero}"></div>
					</div>
				</form>
				<p class="muted" style="margin-top: 10px;">${ui.guesses(attemptsUsed)}</p>
				<p class="message">${statusText || ""}</p>
			</section>

			<section class="results">
				${
					state.guesses.length
						? `<div class="silhouette-tried-grid">${state.guesses
								.map((hero) => getTriedHeroItemHtml(hero))
								.join("")}</div>`
						: `<p class="empty">${ui.empty}</p>`
				}
                ${
                    state.mode === "unlimited" && state.solved
                        ? `<div class="silhouette-replay-button">
                        <button type="button" id="silhouette-next-round">${ui.replay}</button>
                        </div>`
                        : ""
                }
			</section>

			${renderFooter()}
		</main>
	`;

	attachHeaderEvents(changeLanguage, changeTheme);

	const form = document.getElementById("silhouette-form");
	const input = document.getElementById("silhouette-input");
	const suggestions = document.getElementById("silhouette-suggestions");
	const replayButton = document.getElementById("silhouette-next-round");

	setupHeroAutocomplete({
		input,
		suggestions,
		getCandidates: () => getAvailableHeroes(),
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

            const available = getAvailableHeroes();
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
				state.message = ui.unknownHero;
				render();
				return;
			}

			if (state.guesses.some((guess) => guess.name === hero.name)) {
				state.message = ui.alreadyGuessed;
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

	if (state.mode === "daily") {
		state.answer = pickDaily(heroes, state.timeZone);
	} else {
		state.answer = pickRandom(heroes);
	}

	state.rotation = rotations[rotationIndex];
	state.focusX = 20 + Math.random() * 60;
	state.focusY = 20 + Math.random() * 60;

	state.guesses = [];
	state.solved = false;
	state.message = "";
	render();
}



export function initSilhouetteGame(options = {}) {
  const mode = options.mode ?? "random";
  const timeZone = options.timeZone ?? "UTC";
  const locale = options.locale ?? getInitialLocale() ?? "en";

  state.answer = mode === "daily" ? pickDaily(heroes, timeZone) : pickRandom(heroes);
  state.messageKey = "";
  state.guesses = [];
  state.solved = false;
  state.mode = mode;
  state.timeZone = timeZone;

  if (mode === "daily") {
    /*const saved = loadDailyState(timeZone);
    if (saved) {
      state.guesses = saved.guesses
        .map((name) => heroes.find((hero) => hero.name === name) || null)
        .filter(Boolean);
      state.solved = Boolean(saved.solved);
    }*/
  }

  render();
}


export function initDailySilhouetteGame(timeZone = "UTC") {
	initSilhouetteGame({mode: "daily", timeZone});
}
