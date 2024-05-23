# Nuxt MikroORM module

My new Nuxt module for doing amazing things.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
- [🏀 Online playground](https://stackblitz.com/github/boenrobot/nuxt-mikro-orm-module?file=playground%2Fapp.vue)

## Quick Setup

Install the module to your Nuxt application with one command:

```bash
npx nuxi module add nuxt-mikro-orm-module
```

After that, a plugin needs to be created, which calls the "mikroOrm:create" hook.
If multiple MikroORM instances are required, this hook may be called multiple times, with different names.
The plugin should ideally call this hook before the server is ready.

The hook "mikroOrm:init" will be called for every new instance.

## Helper functions

- `getEntityManager(name?: string)` - Get an entity manager with the current request context. Intended for use in server components.
- `useOrm(name?: string)` - Get the MikroORM instance. Intended for use in server components.


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
