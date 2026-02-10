import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],

  theme: {
    extend: {
      colors: {
        ink: {
          50: '#e7f5fd',
          100: '#d0ebfb',
          200: '#a1d8f7',
          300: '#71c4f4',
          400: '#42b0f0',
          500: '#139cec',
          600: '#0f7dbd',
          700: '#0b5e8e',
          800: '#083f5e',
          900: '#041f2f',
          950: '#031621'
        },
        teal: {
          50: '#effafb',
          100: '#d7f0f3',
          200: '#b3e2e7',
          300: '#81cbd4',
          400: '#49abb7',
          500: '#2d8e9a',
          600: '#287581', 
          700: '#25606a',
          800: '#255059',
          900: '#22444b',
          950: '#132d33',
        },
        vanilla: {
          50: '#faf6ea',
          100: '#f6edd5',
          200: '#eddaab',
          300: '#e3c882',
          400: '#dab558',
          500: '#d1a32e',
          600: '#a78225',
          700: '#7d621c',
          800: '#544112',
          900: '#2a2109',
          950: '#1d1706'
        }
      }
    }
  },

  plugins: []
} satisfies Config;