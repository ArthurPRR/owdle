import "./styles.css";
import { landingModes, landingText } from "./translate.js";

const modes = landingModes;
const uiText = landingText;

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

const state = {
  locale: getInitialLocale(),
};

const root = document.getElementById("app");

function render() {
  if (document?.documentElement) {
    document.documentElement.lang = state.locale;
  }

  const text = uiText[state.locale] ?? uiText.en;

  root.innerHTML = `
    <main class="layout landing">
      <header>
        <div class="header-row">
          <a class="eyebrow home-link" href="/index.html">OWDLE</a>
          <div class="lang-toggle" role="group" aria-label="Language">
            <button type="button" class="lang-button ${
              state.locale === "fr" ? "active" : ""
            }" data-lang="fr">FR</button>
            <button type="button" class="lang-button ${
              state.locale === "en" ? "active" : ""
            }" data-lang="en">EN</button>
          </div>
        </div>
        <h1>${text.title}</h1>
        
      </header>

      <section class="mode-grid">
        ${modes
          .map(
            (mode) => `
          <a class="mode-card" href="${mode.href}?lang=${state.locale}" data-mode="${mode.id}">
            <h2>${mode.title[state.locale] ?? mode.title.en}</h2>
            <p>${mode.description[state.locale] ?? mode.description.en}</p>
            <span class="mode-cta">${text.play}</span>
          </a>
        `
          )
          .join("")}
      </section>
    </main>
  `;

  const langButtons = document.querySelectorAll(".lang-button");
  langButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextLocale = button.dataset.lang ?? "en";
      if (state.locale !== nextLocale) {
        state.locale = nextLocale;
        saveLocale(nextLocale);
        render();
      }
    });
  });
}

render();
