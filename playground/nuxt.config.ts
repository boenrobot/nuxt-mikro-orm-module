export default defineNuxtConfig({
  modules: ['../src/module'],
  runtimeConfig: {
    mikroOrm: {}
  },
  devtools: {
    enabled: true,
  },
  vite: {
    optimizeDeps: {
      exclude: [
        '@mikro-orm/better-sqlite',
        '@mikro-orm/migrations',
        '@mikro-orm/entity-generator',
        '@mikro-orm/mariadb',
        '@mikro-orm/mariadb',
        '@mikro-orm/mongodb',
        //'@mikro-orm/mysql',
        '@mikro-orm/postgresql',
        '@mikro-orm/seeder',
        '@mikro-orm/sqlite',
        '@vscode/sqlite3',
        'sqlite3',
        'better-sqlite3',
        //'mysql',
        //'mysql2',
        'oracledb',
        'pg',
        'pg-native',
        'pg-query-stream',
        'tedious',
        'libsql',
        'mariadb/callback',
      ],
    },
  }
})
