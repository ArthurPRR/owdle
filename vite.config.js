import { defineConfig } from "vite";

export default defineConfig({
	build: {
		rollupOptions: {
			input: {
				main: "index.html",
				classicDaily: "classic-daily.html",
				classicUnlimited: "classic-unlimited.html",
				silhouetteDaily: "silhouette-daily.html",
				silhouetteUnlimited: "silhouette-unlimited.html",
				quoteDaily: "quote-daily.html",
				quoteUnlimited: "quote-unlimited.html",
			},
		},
	},
});
