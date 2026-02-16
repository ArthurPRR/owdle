# owdle
Guessing game for Overwatch characters, inspired by Wordle.

## Overview
Vanilla JavaScript web app built with Vite. The player must guess a hero based on hints given by previous guesses.

## Features
- Wordle-like gameplay with comparisons and hints.
- Multiple pages (landing, daily, illimited).
- Local data for heroes.
- Fast interface, no framework.

## Installation
```bash
npm install
npm run dev
```

## Useful scripts
- `npm run dev` : start the dev server.
- `npm run build` : production build.
- `npm run preview` : preview the build.

## Project structure
```
src/
  app.js
  daily.js
  illimited.js
  landing.js
  styles.css
  translate.js
  assets/
  data/
```

## Data
Heroes are defined in [src/data/heroes.json](src/data/heroes.json). This file
feeds the pages and the game logic.
Images are stocked in src/assets

## Pages
- [index.html](index.html) : main page.
- [daily.html](daily.html) : daily mode.
- [illimited.html](illimited.html) : unlimited mode.

## Local development
1. Install dependencies.
2. Run `npm run dev`.
3. Open the URL printed by Vite.

## Contributing
Contributions are welcome. Open an issue or a pull request with a clear
description of the changes.

