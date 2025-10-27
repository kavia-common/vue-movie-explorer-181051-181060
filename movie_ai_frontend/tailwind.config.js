/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#8B5CF6',   // Royal Purple primary
        secondary: '#6B7280', // Warm gray accent
        success: '#10B981',
        error: '#EF4444',
        background: '#F3E8FF',
        surface: '#FFFFFF',
        text: '#374151',
      },
      borderRadius: {
        xl: '1rem',
      },
      boxShadow: {
        soft: '0 10px 25px -10px rgba(139, 92, 246, 0.35)',
      },
      backgroundImage: {
        'royal-gradient': 'linear-gradient(to bottom right, #F3E8FF, #D8B4FE)',
      },
    },
  },
  plugins: [],
}
