import "./styles.css";
import { landingModes, landingText } from "./translate.js";
import { renderHeader, attachHeaderEvents } from "./header.js";
import { renderFooter } from "./footer.js";

const modes = landingModes;
const uiText = landingText;

const localeStorageKey = "owdle-locale";
const themeStorageKey = "owdle-theme";
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

const state = {
  locale: getInitialLocale(),
  theme: getInitialTheme(),
};

const root = document.getElementById("app");

function render() {
  if (document?.documentElement) {
    document.documentElement.lang = state.locale;
  }

  applyTheme(state.theme);

  const text = uiText[state.locale] ?? uiText.en;

  root.innerHTML = `
    <main class="layout landing">
      ${renderHeader(state.locale, state.theme, (nextLocale) => {
        if (state.locale !== nextLocale) {
          state.locale = nextLocale;
          saveLocale(nextLocale);
          render();
        }
      }, () => {
        state.theme = state.theme === "dark" ? "light" : "dark";
        saveTheme(state.theme);
        render();
      })}
      <h1 class="title">${text.title}</h1>

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
      ${renderFooter(gitUrl, "GitHub")}
    </main>
  `;

  attachHeaderEvents((nextLocale) => {
    if (state.locale !== nextLocale) {
      state.locale = nextLocale;
      saveLocale(nextLocale);
      render();
    }
  }, () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    saveTheme(state.theme);
    render();
  });
}

render();
