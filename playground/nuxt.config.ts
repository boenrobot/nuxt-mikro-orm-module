export default defineNuxtConfig({
  modules: ['../src/module'],
  routeRules: {
    '/about': {mikroOrm: false}
  },
  mikroOrm: {
    autoForking: 'middleware',
  },
  experimental: {
    componentIslands: true,
  },
  logLevel: 'verbose',
  devtools: {
    enabled: true,
  },
});
