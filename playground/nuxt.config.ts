export default defineNuxtConfig({
  modules: ['../src/module'],
  runtimeConfig: {
    mikroOrm: {}
  },
  devtools: {
    enabled: true,
  },
})
