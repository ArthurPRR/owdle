export { renderHeader, attachHeaderEvents };

import logoUrl from "./assets/logo/logo.png";
import { landingModes } from "./translate.js";

function renderHeader(locale, theme, mode, currentGameMode, onLocaleChange, onThemeChange) {
  return `
    <header>
      <div class="mode-indicator">
        ${mode != null ? mode.toUpperCase() : ""}
      </div>
      <div class="header-controls">
        <div class="lang-toggle" role="group" aria-label="Language">
          <button type="button" class="lang-button ${
            locale === "fr" ? "active" : ""
          }" data-lang="fr">FR</button>
          <button type="button" class="lang-button ${
            locale === "en" ? "active" : ""
          }" data-lang="en">EN</button>
        </div>
        <button type="button" class="theme-toggle" data-theme="dark" aria-label="Toggle dark mode" title="${theme === "dark" ? "Light mode" : "Dark mode"}">
          <span class="theme-icon">${theme === "dark" ? "☀️" : "🌙"}</span>
        </button>
      </div>
      <a class="eyebrow home-link" href="/index.html" aria-label="OWDLE">
        <img class="logo" src="${logoUrl}" alt="OWDLE" />
      </a>
      ${
        mode !== null ? `
        <div class="gamemode-indicator">
            ${makeModeButtons(mode, currentGameMode, locale)}
        </div>
        ` : ""
      }
    </header>
  `;
}

function makeModeButtons(mode, currentGameMode, locale){
  return landingModes
    .filter((landingMode) => landingMode.mode === mode)
    .map((landingMode) => 
      `<a href="${landingMode.href}" class="gamemode-button ${landingMode.gameMode === currentGameMode ? 'active' : ''}">
        ${landingMode.gameMode}
      </a>`
    )
    .join('');
}

function attachHeaderEvents(onLocaleChange, onThemeChange) {
  const langButtons = document.querySelectorAll(".lang-button");
  langButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextLocale = button.dataset.lang ?? "en";
      onLocaleChange(nextLocale);
    });
  });

  const themeButton = document.querySelector(".theme-toggle");
  if (themeButton) {
    themeButton.addEventListener("click", () => {
      onThemeChange();
    });
  }
}
