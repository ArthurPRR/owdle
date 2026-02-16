# owdle
Jeu de devinette pour les personnages d'Overwatch, inspire de Wordle.

## Apercu
Application web en JavaScript vanilla, construite avec Vite. Le joueur doit
deviner un hero en un nombre limite de tentatives a partir d'indices.

## Fonctionnalites
- Gameplay type Wordle avec comparaisons et indices.
- Plusieurs pages (landing, daily, illimited).
- Donnees locales pour les heros.
- Interface rapide, sans framework.

## Installation
```bash
npm install
npm run dev
```

## Scripts utiles
- `npm run dev` : lance le serveur de developpement.
- `npm run build` : build de production.
- `npm run preview` : previsualisation du build.

## Structure du projet
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

## Donnees
Les heros sont definis dans [src/data/heroes.json](src/data/heroes.json). Ce
fichier alimente les pages et la logique du jeu.

## Pages
- [index.html](index.html) : page principale.
- [daily.html](daily.html) : mode quotidien.
- [illimited.html](illimited.html) : mode illimite.

## Dev local
1. Installe les dependances.
2. Lance `npm run dev`.
3. Ouvre l'URL affichee par Vite.

## Contribuer
Les contributions sont les bienvenues. Ouvre une issue ou une pull request avec
un descriptif clair des changements.

## Licence
Preciser la licence ici.
