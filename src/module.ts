import { addImportsDir, addServerImportsDir, createResolver, defineNuxtModule, logger } from '@nuxt/kit';
import { type EntityManager, type ForkOptions } from "@mikro-orm/core";
import { defu } from 'defu';
import { type EventHandlerRequest, type H3Event } from "h3";

/**
 * Type signature of a forkOptionsFactory function.
 *
 * @param event The request even for which a fork is about to be creted.
 * @param name The name of the instance being forked.
 *
 * @return The fork options that will be used in the new fork.
 */
export type ForkOptionsFactory = (event: H3Event<EventHandlerRequest>, name: string) => ForkOptions|undefined;

/**
 * Options to configure the module with.
 *
 * Available in nuxt config from the "mikroOrm" key.
 *
 * Copied to "runtimeConfig.mikroOrm" and "nitro.runtimeConfig.mikroOrm",
 * when those are not defined.
 */
export interface ModuleOptions {
  /**
   * Default fork options.
   *
   * This is used in {@link "runtime/server/utils/orm"!initOrm | initOrm} and {@link "runtime/server/utils/orm"!registerGlobalOrm | registerGlobalOrm}
   * when the forkOptionsFactory function is either undefined,
   * or returns undefined.
   */
  forkOptions?: ForkOptions,
  /**
   * Default force close option.
   *
   * This is used in {@link "runtime/server/utils/orm"!closeOrm | closeOrm} whenever a force option is not explicitly provided.
   * Notably, this includes the close hook registered with {@link "runtime/server/utils/orm"!registerGlobalOrm | registerGlobalOrm}.
   */
  forceClose?: boolean,
  /**
   * Default request hooking options.
   *
   * When using {@link "runtime/server/utils/orm"!registerGlobalOrm | registerGlobalOrm}, "request" and "close" hooks get registered.
   * This option fine-tunes the behavior of the request hook.
   * The "close" hook is always registered.
   *
   * Setting to `false` disables registration of the request hook altogether.
   * Setting to `true` performs a fork on all requests that reach the server.
   * Setting an object allows further customizing the different known types of requests for which fork
   * should or should not happen. Defaults in the object are all "false".
   *
   * Note that setting a boolean enforces the setting at startup time, whereas an object enforces it at request time.
   * If you modify your runtime config per request, and want to have certain defaults, use an object in your
   * nuxt config. Per request overrides may then be boolean or object.
   */
  globalHooks?: boolean | {
    /**
     * Whether to fork on api requests (URLs beginning with "/api/").
     */
    api?: boolean;
    /**
     * Whether to fork on island component requests (URLs beginning with "/__nuxt_island/").
     */
    islandComponents?: boolean;
    /**
     * Whether to fork on any request other than api or island components.
     */
    routes?: boolean;
  },
  /**
   * Overrides of the default options.
   *
   * If an instance is not in this map,
   * all the default options are used.
   *
   * If an instance in its map, but misses a given option,
   * the defaults for that option are used.
   *
   * If an instance is in this map and specifies an option,
   * the values are NOT merged, but instead, the specified value here is used in its entirety.
   */
  overrides?: {
    [instanceName: string]: Omit<ModuleOptions, 'overrides'>
  }
}

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    mikroOrm: ModuleOptions
  }
}

declare module 'h3' {
  interface H3EventContext {
    mikroOrmEntityManagers?: {
      [instanceName: string]: EntityManager
    };
  }
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-mikro-orm-module',
    configKey: 'mikroOrm',
  },
  defaults(_nuxt) {
    return {
      globalHooks: true,
      forceClose: false,
    };
  },
  setup(options, nuxt) {
    const { resolve } = createResolver(import.meta.url);

    nuxt.options.runtimeConfig.mikroOrm = defu(nuxt.options.runtimeConfig.mikroOrm, options);
    (nuxt.options.nitro.runtimeConfig ??= {}).mikroOrm ??= nuxt.options.runtimeConfig.mikroOrm;

    addServerImportsDir(resolve('./runtime/server/utils'));
    addImportsDir(resolve('./runtime/composables'));
    addImportsDir(resolve('./runtime/utils'));

    logger.debug('MikroORM module is initialized');
  },
})
