import NuxtMikroOrmModule from '../../../src/module';

export default defineNuxtConfig({
  ssr: true,
  modules: [NuxtMikroOrmModule],
  experimental: {
    componentIslands: true,
  },
  routeRules: {
    '/about': { mikroOrm: false },
  },
  mikroOrm: {
    autoForking: 'middleware',
  },
  devtools: {
    enabled: true,
  },
});
