export const landingModes = [
  {
    id: "unlimited classic",
    title: { fr: "Classique illimité", en: "Unlimited classic" },
    description: {
      fr: "Joue autant de parties que tu veux",
      en: "Play as many rounds as you want",
    },
    href: "/classic-unlimited.html",
  },
  {
    id: "daily classic",
    title: { fr: "Classique quotidien", en: "Daily classic" },
    description: {
      fr: "Un nouveau heros chaque jour",
      en: "One new hero everyday",
    },
    href: "/classic-daily.html",
  },
  {
    id: "unlimited silhouette",
    title: { fr: "Silhouette illimitée", en: "Unlimited silhouette" },
    description: {
      fr: "Trouve autant de silhouettes que tu veux",
      en: "Guess as many silhouettes as you want",
    },
    href: "/silhouette-unlimited.html",
  },
  {
    id: "daily silhouette",
    title: { fr: "Silhouette quotidienne", en: "Daily silhouette" },
    description: {
      fr: "Trouve la silhouette d'un nouveau héros chaque jour",
      en: "Guess the silhouette of a new hero every day",
    },
    href: "/silhouette-daily.html",
  },
];

export const landingText = {
  fr: {
    title: "Choisis ton mode de jeu",
    play: "Jouer",
  },
  en: {
    title: "Choose your game mode",
    play: "Play",
  },
};

export const attributeLabels = {
  en: {
    name: "Name",
    species: "Species",
    role: "Role",
    continent: "Continent",
    affiliation: "Affiliation",
    gender: "Gender",
    year: "Year",
  },
  fr: {
    name: "Nom",
    species: "Espèce",
    role: "Rôle",
    continent: "Continent",
    affiliation: "Affiliation",
    gender: "Genre",
    year: "Année",
  },
};

export const gameText = {
  en: {
    eyebrow: "OWDLE",
    title: "Find the hero",
    labelHero: "Hero name",
    placeholder: "Try Tracer, Mercy...",
    guess: "Guess",
    replay: "Replay",
    win: (name) => `🎉 Correct! The hero was ${name}.`,
    guesses: (count) => `Guesses: ${count}`,
    empty: "No guesses yet. Start by typing a hero name.",
    unknownHero: "Unknown hero. Pick a name from the list.",
    alreadyGuessed: "You already guessed that hero.",
    dailyCountdown: (time) => `Next hero in ${time}`,
  },
  fr: {
    eyebrow: "OWDLE",
    title: "Trouve le héros",
    labelHero: "Nom du héros",
    placeholder: "Essaie Tracer, Ange...",
    guess: "Essayer",
    replay: "Rejouer",
    win: (name) => `🎉 Bravo ! Le héros etait ${name}.`,
    guesses: (count) => `Essais : ${count}`,
    empty: "Pas encore d'essai. Commence par taper un héros.",
    unknownHero: "Héros inconnu. Choisis un nom dans la liste.",
    alreadyGuessed: "Tu as déjà essaye ce héros.",
    dailyCountdown: (time) => `Prochain héros dans ${time}`,
  },
};

export const silhouetteText = {
	en: {
    ...gameText.en,
		title: "Silhouette",
		subtitle: "Guess the hero from the silhouette",
		empty: "Start guessing to reveal the silhouette.",
	},
	fr: {
    ...gameText.fr,
		title: "Silhouette",
		subtitle: "Devine le héros à partir de sa silhouette",
		empty: "Commence à deviner pour révéler la silhouette.",
	},
};

export const valueTranslations = {
  fr: {
    role: {
      Damage: "Dégâts", 
      Tank: "Tank",
      Support: "Soutien",
    },
    subrole: {
      // Tank
      Bruiser: "Colosse",  
      Initiator: "Engagement",
      Stalwart: "Indéfectible",

      // DPS
      Recon: "Reconnaissance",
      Flanker: "Flanker",
      Sharpshooter: "Fine gâchette",
      Specialist: "Spécialiste",

      // Support
      Medic: "Secouriste",
      Tactician: "Tactique",
      Survivor: "Survie"
    },
    species: {
      Human: "Humain",
      Omnic: "Omniac",
      Animal: "Animal"
    },
    gender: {
      Female: "Femme",
      Male: "Homme",
      "Non-binary": "Non binaire",
      None: "Aucun",
    },
    continent: {
      Europe: "Europe",
      Asia: "Asie",
      Africa: "Afrique",
    },
    affiliation: {
      Overwatch: "Overwatch",
      Crusaders: "Croisés",
      "Shimada Clan": "Clan Shimada",
      MEKA: "MEKA",
      "Lucheng Interstellar": "Lucheng Interstellar",
      "Wuxing University": "Université Wuxing",
      "Null Sector": "Secteur Zéro",
      Vishkar: "Vishkar",
      "Russian Defense Forces": "Forces de défense russes",
      "Volskaya Industries": "Industries Volskaya",
      "Ironclad Guild": "Guilde des cuirassés",
      Talon: "La Griffe",
      "The Conspiracy": "La Conspiration",
      "Deadlock Gang": "Gang Deadlock",
      "Carribbean Coalition": "Coalition Caraibéenne",
      "Helix Security International": "Helix Sécurité Internationale",
      "Blackwatch": "Blackwatch",
      "Los Muertos": "Los Muertos",
      "Shambali": "Shambali",
      "Yokai": "Yokai",
      "Hashimoto Clan": "Clan Hashimoto",
      "Danish Armed Forces": "Forces armées danoises",
      "Junkers": "Junkers",
      "British Military": "Armée Britannique",
      "Phreaks": "Phreaks",
      "Inti Warriors": "Guerriers d'Inti",
      "Yamagami blades": "Lames Yamagami",
      "Project Red Promise": "Projet Promesse Rouge",
      "The Collective": "Le Collectif",
      "Atlas News": "Atlas News",
      "Deepsea Raiders": "Pilleurs des Abysses",
      "The Ministries": "Les Ministères",
      "Numbani": "Numbani",
      "Australian Liberation Front": "Front de Libération Australien",
      "Wayfinder Society": "Wayfinder Society",
    },
    continent: {
      Europe: "Europe",
      Asia: "Asie",
      Africa: "Afrique",
      Other: "Autre",
      America: "Amerique",
      Oceania: "Oceanie",
    },
    year: {
      2016: "2016",
      2017: "2017",
      2018: "2018",
      2019: "2019",
      2020: "2020",
      2021: "2021",
      2022: "2022",
      2023: "2023",
      2024: "2024",
      2025: "2025",
      2026: "2026",
    },
  },
};
