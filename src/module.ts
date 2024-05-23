import {defineNuxtModule, createResolver, addServerPlugin, addServerImportsDir, logger, addImportsDir} from '@nuxt/kit';
import {type defineConfig, type ForkOptions, type MikroORM, type EntityManager} from "@mikro-orm/core";
import { defu } from 'defu';
import type {H3Event} from "h3";

export interface ModuleOptions {
  /**
   * Default fork options.
   *
   * Used for every request.
   *
   * Key is the instance for which the fork options apply.
   * The default instance's key is "default".
   */
  forkOptions?: Map<string, ForkOptions>;
  /**
   * Whether to enable fork options hook.
   *
   * If enabled, the default fork options are copied for each request,
   * and registered hook handlers for "mikroOrm:fork" are given the opportunity to modify those options
   * on a per-request basis by modifying the input args.
   */
  enableForkHook?: boolean;
}

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    mikroOrm: ModuleOptions
  }
}

export interface CreateHookArg {
  config: ReturnType<typeof defineConfig>;
  name?: string;
}

declare module 'nitropack' {
  export interface NitroRuntimeHooks {
    /**
     * MikroORM create hook.
     *
     * User plugins must call this hook to create a new
     * instance with the given config.
     *
     * @param out
     */
    'mikroOrm:create': (out: CreateHookArg) => void;

    /**
     * MikroORM init hook.
     *
     * Called by this module after each ORM instance creation.
     */
    'mikroOrm:init': (orm: MikroORM, name: string) => void;

    /**
     * Called before a fork of MikroORM's EntityManager, at the request context.
     *
     * Only registered if the "enableForkHook" option is set to `true`.
     *
     * User plugins may register for this hook, to provide different fork options for each request.
     *
     * @param event Event at which the fork is happening.
     * @param forkOptions Options for the particular fork.
     * @param name Name of the instance being forked.
     */
    'mikroOrm:fork': (event: H3Event, forkOptions: ForkOptions, name: string) => void;
  }
}

declare module 'h3' {
  interface H3EventContext {
    em?: Map<string, EntityManager>;
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-mikro-orm-module',
    configKey: 'mikroOrm',
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);

    nuxt.options.runtimeConfig.mikroOrm = defu(nuxt.options.runtimeConfig.mikroOrm, options);

    addServerImportsDir(resolve('./runtime/server/utils'));
    addServerPlugin(resolve('./runtime/server/plugins/mikro-orm'));
    addImportsDir(resolve('./runtime/composables'));

    logger.info('MikroORM module is initialized');
  },
})
