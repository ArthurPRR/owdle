
const localeStorageKey = "owdle-locale";
const themeStorageKey = "owdle-theme";

export { saveLocale, saveTheme, getInitialLocale, getInitialTheme, applyTheme, toggleTheme, setLocale };

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

function setLocale(locale) {
  if (getInitialLocale() === locale) {
    return;
  }

  saveLocale(locale);
}

function toggleTheme() {
  const newTheme = getInitialTheme() === "dark" ? "light" : "dark";
  saveTheme(newTheme);
}