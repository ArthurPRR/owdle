import "./styles.css";
import { landingModes, landingText } from "./translate.js";
import { renderHeader, attachHeaderEvents } from "./header.js";
import { renderFooter } from "./footer.js";

import { getInitialLocale, getInitialTheme, applyTheme, toggleTheme, setLocale } from "./settings.js";

const modes = landingModes;
const uiText = landingText;


function changeTheme(){
  toggleTheme();
  render();
}

function changeLanguage(locale){
  setLocale(locale);
  render();
}

const root = document.getElementById("app");

function render() {
  if (document?.documentElement) {
    document.documentElement.lang = getInitialLocale();
  }

  applyTheme(getInitialTheme());

  const text = uiText[getInitialLocale()] ?? uiText.en;

  root.innerHTML = `
    <main class="layout landing">
      ${renderHeader(getInitialLocale(), getInitialTheme(), null, null, setLocale, toggleTheme)}
      <h1 class="title">${text.title}</h1>

      <section class="mode-grid">
        ${modes
          .map(
            (mode) => `
          <a class="mode-card" href="${mode.href}?lang=${getInitialLocale()}" data-mode="${mode.id}">
            <h2>${mode.title[getInitialLocale()] ?? mode.title.en}</h2>
            <p>${mode.description[getInitialLocale()] ?? mode.description.en}</p>
            <span class="mode-cta">${text.play}</span>
          </a>
        `
          )
          .join("")}
      </section>
      ${renderFooter()}
    </main>
  `;

  attachHeaderEvents(changeLanguage, changeTheme);
}


render();
