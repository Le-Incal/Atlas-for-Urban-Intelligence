/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Layer colors
        'layer-0': '#2E2F2C', // Bio-Physical - Deep Slate
        'layer-1': '#4A5A63', // Observable Reality - Blue-Gray
        'layer-2': '#4F7A74', // Cyber-Physical - Desaturated Teal
        'layer-3': '#5A5F8C', // Logic/Knowledge - Muted Indigo
        'layer-4': '#7A6A9E', // Agentic Intelligence - Soft Amethyst
        'layer-5': '#9B6A5F', // Socio-Economic - Burnt Umber
        'layer-6': '#B89A5A', // Governance - Warm Brass
        // Accent
        'accent-lime': '#C8E66E',
        'accent-lime-light': '#E8F5C8',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        'glass': '20px',
      },
    },
  },
  plugins: [],
}
