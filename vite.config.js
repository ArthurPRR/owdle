import { defineConfig } from "vite";

export default defineConfig({
	build: {
		rollupOptions: {
			input: {
				main: "index.html",
				daily: "daily.html",
				illimited: "illimited.html",
			},
		},
	},
});
