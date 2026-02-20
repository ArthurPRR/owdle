const suggestionLimit = 8;

export function normalize(value) {
  return value.trim().toLowerCase();
}

export function normalizeLoose(value) {
  return normalize(value).replace(/[^a-z0-9]/g, "");
}

export function sortHeroesByName(list, locale, getDisplayName) {
  return [...list].sort((firstHero, secondHero) =>
    getDisplayName(firstHero).localeCompare(getDisplayName(secondHero), locale, {
      sensitivity: "base",
    })
  );
}

export function findHeroByName(name, list, options) {
  const target = normalize(name);
  const targetLoose = normalizeLoose(name);

  return (
    list.find((hero) => {
      const primaryName = options.getDisplayName(hero);
      const primary = normalize(primaryName);
      const primaryLoose = normalizeLoose(primaryName);
      const altName = options.getAltName ? options.getAltName(hero) : null;
      const altNormalized = altName ? normalize(altName) : null;
      const aliases = options.getAliases ? options.getAliases(hero) : hero.aliases ?? [];

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

export function getMatchingHeroes(query, list, options) {
  const target = normalize(query);
  const targetLoose = normalizeLoose(query);

  if (!target) {
    return [];
  }

  return list.filter((hero) => {
    const primaryName = options.getDisplayName(hero);
    const primary = normalize(primaryName);
    const primaryLoose = normalizeLoose(primaryName);

    if (primary.startsWith(target) || primaryLoose.startsWith(targetLoose)) {
      return true;
    }

    const aliases = options.getAliases ? options.getAliases(hero) : hero.aliases ?? [];
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

    const altName = options.getAltName ? options.getAltName(hero) : null;
    if (!altName) {
      return false;
    }

    const altNormalized = normalize(altName);
    const altLoose = normalizeLoose(altName);
    return altNormalized === target || altLoose === targetLoose;
  });
}

export function isAutoSelectMatch(hero, query, options) {
  const target = normalize(query);
  const targetLoose = normalizeLoose(query);

  const displayName = options.getDisplayName(hero);
  const display = normalize(displayName);
  const displayLoose = normalizeLoose(displayName);

  if (display.startsWith(target) || displayLoose.startsWith(targetLoose)) {
    return true;
  }

  const aliases = options.getAliases ? options.getAliases(hero) : hero.aliases ?? [];
  return aliases.some((alias) => {
    const aliasNormalized = normalize(alias);
    const aliasLoose = normalizeLoose(alias);
    return aliasNormalized.startsWith(target) || aliasLoose.startsWith(targetLoose);
  });
}

function buildSuggestions(query, list, locale, options) {
  if (!query) {
    return [];
  }

  const matches = getMatchingHeroes(query, list, options);
  return sortHeroesByName(matches, locale, options.getDisplayName).slice(0, suggestionLimit);
}

function getSuggestionItemHtml(hero, isActive, options) {
  const displayName = options.getDisplayName(hero);
  const imageUrl = options.getImageUrl ? options.getImageUrl(hero) : null;
  const imageHtml = imageUrl
    ? `<img class="hero-avatar" src="${imageUrl}" alt="${displayName}" loading="lazy" />`
    : "";
  const activeClass = isActive ? " active" : "";

  return `
    <button type="button" class="suggestion-button${activeClass}" role="option" aria-selected="${
      isActive
    }" data-hero="${hero.name}">
      <span class="hero-label">${imageHtml}<span>${displayName}</span></span>
    </button>
  `;
}

export function setupHeroAutocomplete(config) {
  const {
    input,
    suggestions,
    getCandidates,
    getAllHeroes,
    getLocale,
    options,
    onSelectSuggestion,
  } = config;

  if (!input || !suggestions) {
    return {
      updateSuggestions: () => {},
    };
  }

  let currentSuggestions = [];
  let activeIndex = -1;

  const renderSuggestions = () => {
    if (currentSuggestions.length === 0) {
      suggestions.innerHTML = "";
      suggestions.classList.remove("open");
      return;
    }

    suggestions.classList.add("open");
    suggestions.innerHTML = currentSuggestions
      .map((hero, index) => getSuggestionItemHtml(hero, index === activeIndex, options))
      .join("");
  };

  const updateSuggestions = () => {
    const query = input.value.trim();
    currentSuggestions = buildSuggestions(query, getCandidates(), getLocale(), options);

    if (activeIndex >= currentSuggestions.length) {
      activeIndex = currentSuggestions.length - 1;
    }

    renderSuggestions();
  };

  const selectSuggestion = (hero) => {
    onSelectSuggestion(hero);
    currentSuggestions = [];
    activeIndex = -1;
    renderSuggestions();
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
      return;
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

  suggestions.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  suggestions.addEventListener("click", (event) => {
    const target = event.target.closest(".suggestion-button");
    if (!target) {
      return;
    }

    const heroName = target.dataset.hero;
    const hero = getAllHeroes().find((entry) => entry.name === heroName);

    if (hero) {
      selectSuggestion(hero);
    }
  });

  return {
    updateSuggestions,
  };
}
