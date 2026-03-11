# owdle
Guessing game for Overwatch characters, inspired by Wordle.

## Overview
Vanilla JavaScript web app built with Vite. The player must guess a hero based on hints given by previous guesses.

## Features
- Wordle-like gameplay with comparisons and hints.
- Multiple pages (landing + classic, silhouette, and quote in daily/unlimited variants).
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
  classic.js
  classic-daily.js
  classic-unlimited.js
  silhouette.js
  silhouette-daily.js
  silhouette-unlimited.js
  quote.js
  quote-daily.js
  quote-unlimited.js
  landing.js
  styles.css
  translate.js
  assets/
data/
  heroes.json
```

## Data
Heroes are defined in [src/data/heroes.json](src/data/heroes.json). This file
feeds the pages and the game logic.
Images are stocked in src/assets

## Pages
- [index.html](index.html) : main page.
- [classic-daily.html](classic-daily.html) : classic daily mode.
- [classic-unlimited.html](classic-unlimited.html) : classic unlimited mode.
- [silhouette-daily.html](silhouette-daily.html) : silhouette daily mode.
- [silhouette-unlimited.html](silhouette-unlimited.html) : silhouette unlimited mode.
- [quote-daily.html](quote-daily.html) : quote daily mode.
- [quote-unlimited.html](quote-unlimited.html) : quote unlimited mode.

## Local development
1. Install dependencies.
2. Run `npm run dev`.
3. Open the URL printed by Vite.

## Contributing
Contributions are welcome. Open an issue or a pull request with a clear
description of the changes.

