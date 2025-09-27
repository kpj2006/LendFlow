import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Gaming-inspired neon colors
        neon: {
          pink: '#ff0080',
          blue: '#0080ff',
          green: '#00ff80',
          yellow: '#ffff00',
          purple: '#8000ff',
          cyan: '#00ffff',
        },
        // Dark gaming background colors
        dark: {
          bg: '#0a0a0a',
          card: '#1a1a1a',
          surface: '#2a2a2a',
          border: '#3a3a3a',
        },
        // Gaming UI colors
        game: {
          primary: '#ff0080',
          secondary: '#0080ff',
          success: '#00ff80',
          warning: '#ffff00',
          error: '#ff4040',
          small: '#00ff80',
          whale: '#ff0080',
        },
      },
      fontFamily: {
        'pixel': ['Courier New', 'monospace'],
        'gaming': ['Orbitron', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'neon-gradient': 'linear-gradient(45deg, #ff0080, #0080ff, #00ff80)',
        'game-gradient': 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2a2a2a 100%)',
      },
      boxShadow: {
        'neon-pink': '0 0 20px rgba(255, 0, 128, 0.5)',
        'neon-blue': '0 0 20px rgba(0, 128, 255, 0.5)',
        'neon-green': '0 0 20px rgba(0, 255, 128, 0.5)',
        'gaming': '0 4px 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 0, 128, 0.2)',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 3s ease-in-out infinite',
        'matrix': 'matrix 20s linear infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { 
            boxShadow: '0 0 20px rgba(255, 0, 128, 0.5)',
            borderColor: 'rgba(255, 0, 128, 0.8)',
          },
          '50%': { 
            boxShadow: '0 0 40px rgba(255, 0, 128, 0.8)',
            borderColor: 'rgba(255, 0, 128, 1)',
          },
        },
        'glow': {
          'from': { textShadow: '0 0 20px rgba(255, 0, 128, 0.5)' },
          'to': { textShadow: '0 0 30px rgba(255, 0, 128, 1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'matrix': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        'gaming': '4px',
      },
    },
  },
  plugins: [],
}
export default config