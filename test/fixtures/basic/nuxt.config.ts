import NuxtMikroOrmModule from '../../../src/module'

export default defineNuxtConfig({
  ssr: true,
  modules: [
    NuxtMikroOrmModule,
  ],
  experimental: {
    componentIslands: true,
  },
  logLevel: "verbose",
  nitro: {
    logLevel: 0,
    logging: {
      compressedSizes: true,
      buildSuccess: true,
    }
  },
  devtools: {
    enabled: true,
  },
})
