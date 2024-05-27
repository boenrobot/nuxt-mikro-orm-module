import { defineNuxtModule, createResolver, addServerImportsDir, logger } from '@nuxt/kit';
import { type ForkOptions, type EntityManager } from "@mikro-orm/core";
import { defu } from 'defu';
import type { EventHandlerRequest, H3Event } from "h3";

export type ForkOptionsFactory = (event: H3Event<EventHandlerRequest>, name: string) => ForkOptions|undefined;

export interface ModuleOptions {
  /**
   * Default fork options.
   *
   * Key is the instance for which the fork options apply.
   * The default instance's key is "default".
   *
   * If an instance's options are left undefined, "{}" is used.
   */
  forkOptions?: Map<string, ForkOptions>;
}

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    mikroOrm: ModuleOptions
  }
}

declare module 'h3' {
  interface H3EventContext {
    mikroOrmEntityManagers?: Map<string, EntityManager>;
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

    logger.debug('MikroORM module is initialized');
  },
})
