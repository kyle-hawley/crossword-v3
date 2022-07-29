/** @type {import('tailwindcss').Config} */

module.exports = {
	content: ["./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			fontFamily: {
				quicksand: ["Quicksand", "sans-serif"],
			},

			gridTemplateColumns: {
				15: "repeat(15, minmax(0, 1fr))",
			},
		},
	},
	plugins: [],
};
