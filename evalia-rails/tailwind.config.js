/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/views/**/*.html.erb',
    './app/helpers/**/*.rb',
    './app/assets/javascripts/**/*.js',
    './app/javascript/**/*.js',
    './app/javascript/**/*.jsx',
    './app/javascript/**/*.ts',
    './app/javascript/**/*.tsx',
  ],
  theme: {
    extend: {
      colors: {
        background: '#ede8dd',
        primary: {
          DEFAULT: '#0ba2b0',
          dark: '#088996'
        },
        secondary: {
          DEFAULT: '#f58220',
          dark: '#e67617'
        },
        success: {
          DEFAULT: '#4caf50',
          dark: '#3d8b40'
        },
        warning: {
          DEFAULT: '#ff9800',
          dark: '#f08000'
        },
        error: {
          DEFAULT: '#f44336',
          dark: '#e53935'
        },
        info: {
          DEFAULT: '#2196f3',
          dark: '#1976d2'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Quicksand', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
}