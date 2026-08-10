/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FAF8F5",       // Warm off-white page background
        warmBeige: "#F3EDE4",   // Accent backgrounds & borders
        warmCard: "#FFFDFB",    // Pure clean warm card background
        charcoal: "#1A1A1A",    // High-contrast clean dark tone
        terracotta: "#D95D39",  // Brand primary warm accent color
        terracottaGlow: "rgba(217, 93, 57, 0.15)",
        clay: "#8C5E45",        // Secondary text/icons (warm brown)
        emergency: "#C23B22",   // Warm crimson SOS color
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
        heading: ["var(--font-plus-jakarta)", "var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-plus-jakarta)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        'float': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
};
