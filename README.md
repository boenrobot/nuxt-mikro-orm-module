# Nuxt MikroORM module

Nuxt module for easy integration with MikroORM into your Nuxt application.

- [✨ &nbsp;Release Notes](https://github.com/boenrobot/nuxt-mikro-orm-module/blob/main/CHANGELOG.md)

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add nuxt-mikro-orm-module
```

After that, ideally in a Nitro plugin, call [registerGlobalOrm()](https://boenrobot.github.io/nuxt-mikro-orm-module/functions/runtime_server_utils_orm.registerGlobalOrm.html) with the instance's config.

Example:

```ts
import { defineConfig, type MikroORM } from "@mikro-orm/mysql";

export default defineNitroPlugin(async (nitro) => {
  const orm = await registerGlobalOrm<MikroORM>(nitro, defineConfig({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    dbName: 'test',
    port: 3306,
  }));

  // any additional checks on the DB you may want to do on startup

});
```

Call useEntityManager() [in a request context](https://boenrobot.github.io/nuxt-mikro-orm-module/functions/runtime_server_utils_orm.useEntityManager.html) or [in an island component](https://boenrobot.github.io/nuxt-mikro-orm-module/functions/runtime_composables_em.useEntityManager.html) to get a forked EntityManager you can immediately use.

If you are working in a different context, such as a Nitro task, you may call [useOrm()](https://boenrobot.github.io/nuxt-mikro-orm-module/functions/runtime_server_utils_orm.useOrm.html), and manually call `fork()` to get a locally scoped EntityManager.

## Module options / Runtime options

This module's options are used as defaults for runtime options, under the `mikroOrm` key.

See [ModuleOptions](https://boenrobot.github.io/nuxt-mikro-orm-module/interfaces/module.ModuleOptions.html) for details.

## API

Have a look at [the typedoc generated docs](https://boenrobot.github.io/nuxt-mikro-orm-module) for the full feature set.

In addition to the previously mentioned functions, if more fine-grained control over the MikroORM instance is needed,
you can also use [initOrm()](https://boenrobot.github.io/nuxt-mikro-orm-module/functions/runtime_server_utils_orm.initOrm.html) to init a MikroORM instance,
without making it available for all requests. You will need to call useEntityManager() [in a request context](https://boenrobot.github.io/nuxt-mikro-orm-module/functions/runtime_server_utils_orm.useEntityManager.html)
at the routes you want to enable the instance at. You should also call [closeOrm()](https://boenrobot.github.io/nuxt-mikro-orm-module/functions/runtime_server_utils_orm.closeOrm.html) when you are done with the instance,
be it at a Nitro close hook, or some other time at which you know the connection needs to be closed.

## Contribution

<details>
  <summary>Local development</summary>
  
  ```bash
  # Install dependencies
  yarn install
  
  # Generate type stubs
  yarn run dev:prepare
  
  # Start docker container, to host the sample database
  docker compose up -d
  
  # Develop with the playground
  yarn run dev
  
  # Build the playground
  yarn run dev:build
  
  # Run ESLint
  yarn run lint
  
  # Run Vitest
  yarn run test
  yarn run test:watch
  
  # Release new version
  yarn run release
  ```

</details>
