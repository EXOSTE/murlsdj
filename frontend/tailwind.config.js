/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Couleurs exactes extraites de lesilencedesjustes.fr
        creme: "#F7F9FB",    // fond très clair (quasi-blanc bleuté) du site LSDJ
        encre: "#050E1F",    // bleu nuit profond — titres, fonds sombres
        bleu: "#16479E",     // bleu principal LSDJ
        jaune: "#F2D411",    // jaune LSDJ
        sepia: "#F2D411",    // alias → même que jaune (compat)
      },
      fontFamily: {
        serif: ["Georgia", "Cambria", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
