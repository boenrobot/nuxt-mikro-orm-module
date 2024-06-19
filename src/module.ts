import { type EntityManager, type ForkOptions } from '@mikro-orm/core';
import {
  addImportsDir,
  addServerHandler,
  addServerImportsDir,
  createResolver,
  defineNuxtModule,
  logger,
} from '@nuxt/kit';
import { defu } from 'defu';
import { type EventHandlerRequest, type H3Event } from 'h3';

/**
 * Type signature of a forkOptionsFactory function.
 *
 * @param event The request even for which a fork is about to be creted.
 * @param name The name of the instance being forked.
 *
 * @return The fork options that will be used in the new fork.
 */
export type ForkOptionsFactory = (event: H3Event<EventHandlerRequest>, name: string) => ForkOptions | undefined;

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
   * This is used in {@link "runtime/server/utils/orm"!initOrm | initOrm} and
   * {@link "runtime/server/utils/orm"!registerGlobalOrm | registerGlobalOrm}
   * when the forkOptionsFactory function is either undefined,
   * or returns undefined.
   */
  forkOptions?: ForkOptions;
  /**
   * Default force close option.
   *
   * This is used in {@link "runtime/server/utils/orm"!closeOrm | closeOrm} whenever a force option is not
   * explicitly provided.
   * Notably, this includes the close hook registered
   * with {@link "runtime/server/utils/orm"!registerGlobalOrm | registerGlobalOrm}.
   */
  forceClose?: boolean;
  /**
   * Where to do the EntityManager request fork.
   *
   * When using {@link "runtime/server/utils/orm"!registerGlobalOrm | registerGlobalOrm},
   * a "close" hook is always registered.
   * Then, depending on this setting,
   * auto forking may happen in one of two points - a Nitro request hook or a (global) Nitro middleware.
   *
   * "hook" does it at a Nitro request hook.
   * If fine-grained control over the forking behavior is desired,
   * it can be performed at any Nitro request hook registered before the call
   * to {@link "runtime/server/utils/orm"!registerGlobalOrm | registerGlobalOrm}.
   * This is the default behavior, and when combined with {@link ModuleOptions.routeOptions} being set to a boolean,
   * it can be more efficient, as the setting is done at startup time,
   * and per-request overrides are not even checked for.
   *
   * "middleware" does it at (global) Nitro middleware.
   * If fine-grained control over the forking behavior is desired,
   * it can be performed at any Nitro request hook (regardless of when that hook was registered),
   * or via nuxt config's "routeRules", which adds a route override over the defaults defined
   * by {@link ModuleOptions.routeOptions}.
   * Note that the middleware is always triggered per request, even with {@link ModuleOptions.routeOptions} being set
   * to a boolean.
   *
   * Setting this option to `false` disables auto forking altogether.
   */
  autoForking: 'hook' | 'middleware' | false;
  /**
   * Default route options for auto forking.
   *
   * When using {@link "runtime/server/utils/orm"!registerGlobalOrm | registerGlobalOrm},
   * a "close" hook is always registered.
   * Then, depending on the setting {@link ModuleOptions.autoForking},
   * auto forking may happen in one of two points - a Nitro request hook or a (global) Nitro middleware.
   *
   * Per-route rules can be defined in nuxt config's "routeRules", but if the "mikroOrm" option is not specified
   * for the route, it will use the defaults here.
   *
   * Setting to `true` performs a fork for all requests (default if left undefined).
   *
   * Setting to `false` skips forking for all requests.
   *
   * Setting an object allows further customizing the different known types of requests for which fork
   * should or should not happen. Defaults in the object are all "false".
   *
   * Note that setting a boolean, combined with {@link ModuleOptions.autoForking} being set to "hook" enforces
   * the setting at startup time, whereas an object enforces it at request time regardless of whether
   * {@link ModuleOptions.autoForking} was set to "hook" or "middleware".
   * Setting this option to `false` while {@link ModuleOptions.autoForking} is set to `"middleware"` effectively
   * disables auto forking by default, while letting you enable it per route via Nuxt's route rules.
   */
  routeOptions?:
    | boolean
    | {
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
      };
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
    [instanceName: string]: Omit<ModuleOptions, 'overrides'>;
  };
}

declare module '@nuxt/schema' {
  interface RuntimeConfig {
    /**
     * Runtime config of "nuxt-mikro-orm-module".
     *
     * @see {@link ModuleOptions}
     */
    mikroOrm: ModuleOptions;
  }
}

declare module 'h3' {
  interface H3EventContext {
    /**
     * Already forked MikroORM instances, available to the current request.
     *
     * Each key is an instance name, and each value is the EntityManager for that instance,
     * forked for the current request.
     */
    mikroOrmEntityManagers?: {
      [instanceName: string]: EntityManager;
    };
  }
}

declare module 'nitropack' {
  interface NitroRouteConfig {
    /**
     * Whether to do forking of MikroORM at this route.
     *
     * Setting to `false` disables MikroORM for the matched route.
     * Setting to `true` enables forking for all registered instances at this route.
     * Setting an array of strings will perform forks only for the matched instances.
     *
     * Note that the defaults are defined in {@link ModuleOptions.routeOptions}.
     *
     * Note also that {@link ModuleOptions.autoForking} needs to be set to `"middleware"`
     * (either at the instance override level, or the default level) for this setting to be honored.
     */
    mikroOrm?: boolean | string[];
  }
}

export default defineNuxtModule<ModuleOptions>({
  defaults(_nuxt) {
    return {
      autoForking: 'hook',
      routeOptions: true,
      forceClose: false,
    };
  },
  meta: {
    name: 'nuxt-mikro-orm-module',
    configKey: 'mikroOrm',
  },
  setup: function (options, nuxt) {
    const { resolve } = createResolver(import.meta.url);

    nuxt.options.runtimeConfig.mikroOrm = defu(nuxt.options.runtimeConfig.mikroOrm, options);
    (nuxt.options.nitro.runtimeConfig ??= {}).mikroOrm ??= nuxt.options.runtimeConfig.mikroOrm;

    addServerImportsDir(resolve('./runtime/server/utils'));
    addImportsDir(resolve('./runtime/composables'));
    addImportsDir(resolve('./runtime/utils'));

    // Only register the middleware if in use.
    if (
      nuxt.options.nitro.runtimeConfig.mikroOrm.autoForking === 'middleware' ||
      Object.values(
        nuxt.options.nitro.runtimeConfig.mikroOrm.overrides ??
          ({} as NonNullable<typeof nuxt.options.nitro.runtimeConfig.mikroOrm.overrides>),
      ).find((o) => o?.autoForking === 'middleware')
    ) {
      addServerHandler({
        middleware: true,
        handler: resolve('./runtime/server/middleware/em'),
      });
    }

    logger.debug('MikroORM module is initialized');
  },
});
