export default defineNuxtConfig({
  modules: ['../src/module'],
  experimental: {
    componentIslands: true,
  },
  logLevel: "verbose",
  devtools: {
    enabled: true,
  },
})
