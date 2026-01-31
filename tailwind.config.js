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
        'layer-0': '#8B8682', // Bio-Physical - Grey Olive
        'layer-1': '#9DACB3', // Observable Reality - Cool Steel
        'layer-2': '#C1ED93', // Cyber-Physical - Lime Cream
        'layer-3': '#68D3F0', // Logic/Knowledge - Sky Blue
        'layer-4': '#BF7BE6', // Agentic Intelligence - Bright Lavender
        'layer-5': '#6ECBB1', // Socio-Economic - Pearl Aqua
        'layer-6': '#D49174', // Governance - Toasted Almond
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
