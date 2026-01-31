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
        'layer-0': '#5D554C', // Bio-Physical - Warm Taupe
        'layer-1': '#4A5A63', // Observable Reality - Blue-Gray
        'layer-2': '#4F7A74', // Cyber-Physical - Desaturated Teal
        'layer-3': '#5A658C', // Logic/Knowledge - Muted Indigo
        'layer-4': '#8B6A9E', // Agentic Intelligence - Soft Amethyst
        'layer-5': '#9C615F', // Socio-Economic - Burnt Umber
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
