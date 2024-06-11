import { useRuntimeConfig } from "#imports";
import { type defineConfig, MikroORM, type ForkOptions, type EntityManager } from "@mikro-orm/core";
import { type EventHandlerRequest, type H3Event } from "h3";
import { type ForkOptionsFactory } from "~/src/module";
import { type NitroApp, type NitroRuntimeHooks } from 'nitropack';
import { NuxtMikroOrmNotInitialized, NuxtMikroOrmAlreadyInitialized } from "../../utils/errors";
import consolaRoot from 'consola';

const consola = consolaRoot.withTag('MikroORM');

type MikroOrmInstance = Awaited<ReturnType<typeof MikroORM['init']>>;

const ormInstances = new Map<string, {instance: MikroOrmInstance, forkOptions?: ForkOptionsFactory | ForkOptions}>();

/**
 * Closes an instance.
 *
 * Closes an instance, and inherently prevents further calls of {@link useOrm} or {@link useEntityManager} with that name.
 * After the returned promise settles, {@link initOrm} may be called again with the same name.
 *
 * This function is effectively a no-op if the instance is already closed.
 *
 * @param name The name of the instance to be closed.
 * @param force Whether to force the connection to be closed.
 *
 * @return A promise that resolves once the MikroORM instance is closed, and the name is unregistered.
 */
export async function closeOrm(name: string = 'default', force?: boolean)
{
  await ormInstances.get(name)?.instance.close(force ?? useRuntimeConfig().mikroOrm.overrides?.[name]?.forceClose ?? useRuntimeConfig().mikroOrm.forceClose ?? false);
  ormInstances.delete(name);
}

/**
 * Use an existing MikroORM instance.
 *
 * @template T Type of the MikroORM instance. Typically, the "MikroORM" export of your MikroORM driver.
 *
 * @param name The name of the instance.
 *
 * @return The MikroORM instance for the given name.
 *
 * @throws {@link "runtime/utils/errors"!NuxtMikroOrmNotInitialized | NuxtMikroOrmNotInitialized} When trying to use an instance that wasn't previously initialized
 * with {@link initOrm} or {@link registerGlobalOrm}.
 */
export function useOrm<T extends MikroOrmInstance = MikroOrmInstance>(name: string = 'default'): T {
  const orm = ormInstances.get(name);
  if (!orm) {
    throw new NuxtMikroOrmNotInitialized(`MikroORM instance "${name}" is not initialized.`, name);
  }
  return orm.instance as T;
}

/**
 * Initialize a MikroORM instance.
 *
 * Initializes a MikroORM instance, and inherently making it available for future forks.
 *
 * @template T Type of the MikroORM instance. Typically, the "MikroORM" export of your MikroORM driver.
 *
 * @param config The config to use for the new instance.
 * @param name The name to set for this instance.
 * @param forkOptionsFactory A function to create the fork options for a request. If left undefined, or returns undefined,
 * the default fork options defined in the runtime config are used.
 * This function is called the first time per request, when {@link useEntityManager} is used.
 *
 * @return The initialized MikroORM instance (same as if you had called {@link useOrm} with the same name).
 *
 * @throws {@link "runtime/utils/errors"!NuxtMikroOrmAlreadyInitialized | NuxtMikroOrmAlreadyInitialized} When trying to initialize an instance that was previously initialized via {@link initOrm} or {@link registerGlobalOrm}, and still not closed via {@link closeOrm}.
 */
export async function initOrm<T extends MikroOrmInstance = MikroOrmInstance>(
  config: ReturnType<typeof defineConfig>,
  name: string = 'default',
  forkOptionsFactory?: (event: H3Event<EventHandlerRequest>, name: string) => ForkOptions|undefined
): Promise<T> {
  if (ormInstances.has(name)) {
    throw new NuxtMikroOrmAlreadyInitialized(`MikroORM instance with name "${name}" is already initialized`, name);
  }

  const orm = await MikroORM.init(config);

  const moduleRuntimeConfig = useRuntimeConfig().mikroOrm;
  const forkOptions = moduleRuntimeConfig.overrides?.[name]?.forkOptions ?? moduleRuntimeConfig.forkOptions;

  ormInstances.set(name, {instance: orm, forkOptions: forkOptionsFactory ?? forkOptions});

  return orm as T;
}

/**
 * Use the request's EntityManager.
 *
 * This function is intended for use at any point where you have access to the request event,
 * such as "request" hooks in Nitro plugins, or defineEventHandler() handler functions.
 *
 * Depending on the current runtimeConfig (see {@link "module"!ModuleOptions | ModuleOptions}),
 * this function may be automatically called for all routes.
 *
 * Unlike {@link "runtime/composables/em"!useEntityManager | its "composables" counterpart of the same name},
 * the EntityManager is forked once per request if not already forked.
 * Further calls with the same request and name will return the same EntityManager instance.
 * When using island components, this function must be called before the island component is rendered,
 * so that the other function has access to the now forked EntityManager.
 *
 * @template T Type of the EntityManager instance. Typically, the "EntityManager" export of your MikroORM driver.
 *
 * @param event The associated request of the EntityManager.
 * @param name The name of the MikroORM instance to fork.
 *
 * @return The request's associated EntityManager fork.
 *
 * @throws {@link "runtime/utils/errors"!NuxtMikroOrmNotInitialized | NuxtMikroOrmNotInitialized} When trying to use an instance that wasn't previously initialized
 * with {@link initOrm} or {@link registerGlobalOrm}.
 *
 */
export function useEntityManager<T extends EntityManager = EntityManager>(event: H3Event<EventHandlerRequest>, name: string = 'default'): T
{
  const existingRequestInstance = event.context.mikroOrmEntityManagers?.[name];
  if (existingRequestInstance) {
    return existingRequestInstance as T;
  }

  const orm = ormInstances.get(name);
  if (!orm) {
    throw new NuxtMikroOrmNotInitialized(`MikroORM instance "${name}" is not initialized.`, name);
  }

  let forkOptions = orm.forkOptions;
  if (typeof forkOptions === 'function') {
    forkOptions = forkOptions(event, name);
  }
  if (!forkOptions) {
    event.context.nitro ??= {};
    const runtimeConfig = useRuntimeConfig(event).mikroOrm;
    forkOptions = runtimeConfig.overrides?.[name]?.forkOptions ?? runtimeConfig.forkOptions ?? {};
  }

  const em = (orm.instance.em as T).fork(forkOptions);
  (event.context.mikroOrmEntityManagers ??= {})[name] = em;

  return em;
}

/**
 * Initializes MikroORM, and register hooks to fork and close it.
 *
 * Calls {@link initOrm} and registers hooks
 * to automatically enable the entity manager for every request with its own context.
 * Limited configuration of the request hook is available as part of {@link "module"!ModuleOptions | ModuleOptions}.
 *
 * If you need more fine-grained permissions for ORM instances,
 * consider setting "globalHooks" to "false", and do whatever checks you need,
 * either in a "request" hook from a Nitro plugin,
 * or in a defineRequestEvent() handler function.
 *
 * This function also registers a hook to automatically close the ORM on nitro close
 * and unregisters the hooks it registered after the ORM closes successfully.
 * Whether the closing of the ORM is forced or not can be controlled with the runtime config.
 *
 * @template T Type of the MikroORM instance. Typically, the "MikroORM" export of your MikroORM driver.
 *
 * @param nitro The nitro app to add hooks to.
 * @param config The config to use for the new instance.
 * @param name The name to set for this instance.
 * @param forkOptionsFactory A function to create the fork options for a request. If left undefined, or returns undefined,
 * the default fork options defined in the runtime config are used.
 * This function is called the first time per request, when {@link useEntityManager} is used.
 *
 * @return The initialized MikroORM instance (same as if you had called {@link useOrm} with the same name).
 */
export async function registerGlobalOrm<T extends MikroOrmInstance = MikroOrmInstance>(
  nitro: NitroApp,
  config: ReturnType<typeof defineConfig>,
  name: string = 'default',
  forkOptionsFactory?: (event: H3Event<EventHandlerRequest>, name: string) => ForkOptions|undefined,
): Promise<T> {
  const orm = await initOrm<T>(config, name, forkOptionsFactory);

  const initTimeConfig = useRuntimeConfig().mikroOrm;
  const initTimeGlobalHooks = initTimeConfig.overrides?.[name]?.globalHooks ?? initTimeConfig.globalHooks ?? true;

  const hooks: Partial<NitroRuntimeHooks> = {
    close: async () => {
      await closeOrm(name);
      nitro.hooks.removeHooks(hooks);
    },
  };

  if (typeof initTimeGlobalHooks === 'object') {
    hooks.request = (event) => {
      const runtimeOptions = typeof event.context.nitro === 'undefined'
        ? useRuntimeConfig().mikroOrm
        : useRuntimeConfig(event).mikroOrm;
      const reqHookOptions = runtimeOptions.overrides?.[name]?.globalHooks ?? runtimeOptions.globalHooks ?? initTimeGlobalHooks;

      if (reqHookOptions === false) {
        return;
      }

      if (reqHookOptions === true) {
        useEntityManager(event, name);
        return;
      }

      if (event.path.startsWith('/api/')) {
        if (reqHookOptions.api) {
          useEntityManager(event, name);
        }
        return;
      }

      if (event.path.startsWith('/__nuxt_island/')) {
        if (reqHookOptions.islandComponents) {
          useEntityManager(event, name);
        }
        return;
      }

      if (reqHookOptions.routes) {
        useEntityManager(event, name);
      }
    }

    consola.debug(`Instance ${name} was registered globally with per request handler. Init time options: `, initTimeGlobalHooks);
  } else {
    if (initTimeGlobalHooks) {
      hooks.request = (event) => {
        useEntityManager(event, name);
      };

      consola.debug(`Instance "${name}" was registered globally with universal request handler`);
    }
  }

  nitro.hooks.addHooks(hooks);
  consola.debug(`Hooks for instance "${name}" added`);

  return orm;
}
