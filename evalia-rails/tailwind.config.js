module.exports = {
  content: [
    './app/views/**/*.{html,html.erb,erb}',
    './app/helpers/**/*.rb',
    './app/assets/stylesheets/**/*.css',
    './app/javascript/**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        background: '#ede8dd',
        primary: '#0ba2b0',
        'primary-light': '#3cb7c3',
        'primary-dark': '#098a96',
      },
    },
  },
  plugins: [],
}