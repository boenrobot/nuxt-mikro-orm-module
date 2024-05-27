# Nuxt MikroORM module

My new Nuxt module for doing amazing things.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
- [🏀 Online playground](https://stackblitz.com/github/boenrobot/nuxt-mikro-orm-module?file=playground%2Fapp.vue)

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add nuxt-mikro-orm-module
```

After that, ideally in a Nitro plugin, call initOrm() with the instance's config.

Call useEntityManager() in a request context to get a forked EntityManager you can immediately use.
If you are working in a different context, such as a cron job, you may call useOrm(), and manually call `fork()` to get a locally scoped EntityManager.

## API

- `initOrm<T extends MikroOrmInstance = MikroOrmInstance>(config: ReturnType<typeof defineConfig>, name: string = 'default', forkOptionsFactory?: (event: H3Event<EventHandlerRequest>, name: string) => ForkOptions|undefined): Promise<T>` - Initialize a MikroORM instance with the given config. Optionally provide a name and fork options callback (called on each request where EntityManager is used; must not be async). Returns a promise that resolves with the initialized MikroORM instance.
- `useEntityManager<T extends EntityManager = EntityManager>(event: H3Event<EventHandlerRequest>, name: string = 'default'): T` - Get an entity manager with the current request context.
- `useOrm<T extends MikroOrmInstance = MikroOrmInstance>(name: string = 'default'): T` - Get the MikroORM instance.
- `closeOrm(name: string = 'default', force: boolean = false)` - Close an existing MikroORM instance. The name also becomes available for reuse after close.

## Module options / Runtime options

This module's options are used as defaults for runtime options, under the `mikroOrm` key.

Available options:

- `forkOptions` - Default fork options when calling initOrm() without a `forkOptionsFactory`, or when the `forkOptionsFactory` function returns undefined.

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
