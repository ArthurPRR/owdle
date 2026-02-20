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

const localeStorageKey = "owdle-locale";
const themeStorageKey = "owdle-theme";
const gitUrl = "https://github.com/";

const text = {
	en: {
		title: "Silhouette Daily",
		subtitle: "Guess the hero from the silhouette",
		label: "Hero name",
		placeholder: "Type a hero...",
		guess: "Guess",
		attempts: (count) => `Attempts: ${count}`,
		win: (name) => `🎉 Well done! It was ${name}.`,
		unknown: "Unknown hero",
		already: "You already tried this hero",
		empty: "Start guessing to reveal the silhouette.",
	},
	fr: {
		title: "Silhouette du jour",
		subtitle: "Devine le héros à partir de sa silhouette",
		label: "Nom du héros",
		placeholder: "Entre un héros...",
		guess: "Valider",
		attempts: (count) => `Essais : ${count}`,
		win: (name) => `🎉 Bravo ! C'était ${name}.`,
		unknown: "Héros inconnu",
		already: "Tu as déjà essayé ce héros",
		empty: "Commence à deviner pour révéler la silhouette.",
	},
};

const state = {
	locale: getInitialLocale(),
	theme: getInitialTheme(),
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

function getInitialTheme() {
	if (typeof localStorage === "undefined") {
		return "light";
	}

	try {
		const saved = localStorage.getItem(themeStorageKey);
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
		localStorage.setItem(themeStorageKey, theme);
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
	if (state.locale === "fr" && hero.nameFr) {
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
	const rotation = state.solved ? 0 : state.rotation;

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
		<div class="silhouette-tried-item">
			${
				imageUrl
					? `<img class="silhouette-tried-avatar" src="${imageUrl}" alt="${name}" loading="lazy" />`
					: `<div class="silhouette-tried-avatar silhouette-tried-avatar-empty" aria-hidden="true"></div>`
			}
			<span>${name}</span>
		</div>
	`;
}

function getUiText() {
	const localeText = text[state.locale] ?? text.en;

	if (state.mode === "unlimited") {
		return {
			...localeText,
			title: state.locale === "fr" ? "Silhouette Illimité" : "Silhouette Unlimited",
			subtitle:
				state.locale === "fr"
					? "Enchaîne les héros sans limite"
					: "Keep guessing heroes with no daily limit",
			nextRound: state.locale === "fr" ? "Héros suivant" : "Next hero",
		};
	}

	return {
		...localeText,
		nextRound: state.locale === "fr" ? "Héros suivant" : "Next hero",
	};
}

function render() {
	if (document?.documentElement) {
		document.documentElement.lang = state.locale;
	}

	applyTheme(state.theme);

	const ui = getUiText();
	const imageUrl = getHeroImageUrl(state.answer);
	const attemptsUsed = state.guesses.length;
	const statusText = state.solved
		? ui.win(getHeroDisplayName(state.answer))
		: state.message;

	root.innerHTML = `
		<main class="layout">
			${renderHeader(
				state.locale,
				state.theme,
				(nextLocale) => {
					if (state.locale !== nextLocale) {
						state.locale = nextLocale;
						saveLocale(nextLocale);
						render();
					}
				},
				() => {
					state.theme = state.theme === "dark" ? "light" : "dark";
					saveTheme(state.theme);
					render();
				}
			)}

			<section class="controls">
				<h1 class="title">${ui.title}</h1>
				<p class="subtitle">${ui.subtitle}</p>
			</section>

			<section class="results" style="margin-bottom: 24px;">
				${
					imageUrl
						? `<div class="silhouette-frame"><img src="${imageUrl}" alt="silhouette" style="${getSilhouetteStyle()}" /></div>`
						: ""
				}
			</section>

			<section class="controls">
				<form id="silhouette-form">
					<label for="silhouette-input">${ui.label}</label>
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
							<button type="submit" ${state.solved ? "disabled" : ""}>${ui.guess}</button>
							${
								state.mode === "unlimited" && state.solved
									? `<button type="button" id="silhouette-next-round">${ui.nextRound}</button>`
									: ""
							}
						</div>
						<div class="suggestions" id="silhouette-suggestions" role="listbox" aria-label="${ui.label}"></div>
					</div>
				</form>
				<p class="muted" style="margin-top: 10px;">${ui.attempts(attemptsUsed)}</p>
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
			</section>

			${renderFooter(gitUrl, "GitHub")}
		</main>
	`;

	attachHeaderEvents(
		(nextLocale) => {
			if (state.locale !== nextLocale) {
				state.locale = nextLocale;
				saveLocale(nextLocale);
				render();
			}
		},
		() => {
			state.theme = state.theme === "dark" ? "light" : "dark";
			saveTheme(state.theme);
			render();
		}
	);

	const form = document.getElementById("silhouette-form");
	const input = document.getElementById("silhouette-input");
	const suggestions = document.getElementById("silhouette-suggestions");
	const nextRoundButton = document.getElementById("silhouette-next-round");

	setupHeroAutocomplete({
		input,
		suggestions,
		getCandidates: () => heroes,
		getAllHeroes: () => heroes,
		getLocale: () => state.locale,
		options: {
			getDisplayName: (hero) => getHeroDisplayName(hero),
			getAltName: (hero) => (state.locale === "fr" ? hero.name : hero.nameFr ?? null),
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
				getAltName: (entry) => (state.locale === "fr" ? entry.name : entry.nameFr ?? null),
				getAliases: (entry) => entry.aliases ?? [],
			});

			if (!hero) {
				const matches = sortHeroesByName(
					getMatchingHeroes(value, heroes, {
						getDisplayName: (entry) => getHeroDisplayName(entry),
						getAltName: (entry) => (state.locale === "fr" ? entry.name : entry.nameFr ?? null),
						getAliases: (entry) => entry.aliases ?? [],
					}),
					state.locale,
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
				state.message = ui.unknown;
				render();
				return;
			}

			if (state.guesses.some((guess) => guess.name === hero.name)) {
				state.message = ui.already;
				render();
				return;
			}

			state.guesses = [...state.guesses, hero];
			state.solved = hero.name === state.answer.name;
			state.message = "";
			render();
		});
	}

	if (nextRoundButton) {
		nextRoundButton.addEventListener("click", () => {
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

export function initDailySilhouetteGame(timeZone = "UTC") {
	state.mode = "daily";
	state.timeZone = timeZone;
	startNewRound();
}

export function initUnlimitedSilhouetteGame() {
	state.mode = "unlimited";
	startNewRound();
}