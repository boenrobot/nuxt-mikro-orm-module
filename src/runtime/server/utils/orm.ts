import { useRuntimeConfig } from "#imports";
import { type defineConfig, MikroORM, type ForkOptions, type EntityManager } from "@mikro-orm/core";
import type { EventHandlerRequest, H3Event } from "h3";
import type { ForkOptionsFactory } from "~/src/module";

type MikroOrmInstance = Awaited<ReturnType<typeof MikroORM['init']>>;

const ormInstances = new Map<string, {instance: MikroOrmInstance, forkOptions: ForkOptionsFactory | ForkOptions}>();

/**
 * Closes an instance.
 *
 * Closes an instance, and inherently prevents further calls of useOrm() or useEntityManager() with that name.
 * After the returned promise settles, initOrm() may be called again with the same name.
 *
 * This function is effectively a no-op if the instance is already closed.
 *
 * @param name The name of the instance to be closed.
 * @param force Whether to force the connection to be closed.
 *
 * @return A promise that resolves once the MikroORM instance is closed, and the name is unregistered.
 */
export async function closeOrm(name: string = 'default', force: boolean = false)
{
  await ormInstances.get(name)?.instance.close(force);
  ormInstances.delete(name);
}

/**
 * Use an existing MikroORM instance.
 *
 * @param name The name of the instance.
 *
 * @return The MikroORM instance for the given name.
 */
export function useOrm<T extends MikroOrmInstance = MikroOrmInstance>(name: string = 'default'): T {
  const orm = ormInstances.get(name);
  if (!orm) {
    throw new Error(`MikroORM instance "${name}" is not initialized.`);
  }
  return orm.instance as T;
}

/**
 *
 * @param config The config to use for the new instance.
 * @param name The name to set for this instance.
 * @param forkOptionsFactory A function to create the fork options for a request. If left undefined, or returns undefined,
 * the default fork options defined in the runtime config are used.
 * This function is called the first time per request, when {@link useEntityManager()} is used.
 *
 * @return The initialized MikroORM instance (same as if you had called useOrm() with the same name).
 */
export async function initOrm<T extends MikroOrmInstance = MikroOrmInstance>(
  config: ReturnType<typeof defineConfig>,
  name: string = 'default',
  forkOptionsFactory?: (event: H3Event<EventHandlerRequest>, name: string) => ForkOptions|undefined
): Promise<T> {
  if (ormInstances.has(name)) {
    throw new Error(`MikroORM instance with name "${name}" is already initialized`);
  }

  const orm = await MikroORM.init(config);

  const moduleRuntimeConfig = useRuntimeConfig().mikroOrm;
  const forkOptions = moduleRuntimeConfig.forkOptions?.get(name) ?? {};

  ormInstances.set(name, {instance: orm, forkOptions: forkOptionsFactory ?? forkOptions});

  return orm as T;
}

/**
 *
 * @param event The associated request of the entity manager.
 * The EntityManager is forked once per request, after which,
 * the same fork is used across calls with the same request.
 * @param name The name of the MikroORM instance to fork.
 *
 * @return The request's associated EntityManager fork.
 */
export function useEntityManager<T extends EntityManager = EntityManager>(event: H3Event<EventHandlerRequest>, name: string = 'default'): T
{
  const existingRequestInstance = event.context.mikroOrmEntityManagers?.get(name);
  if (existingRequestInstance) {
    return existingRequestInstance as T;
  }

  const orm = ormInstances.get(name);
  if (!orm) {
    throw new Error(`MikroORM instance "${name}" is not initialized.`);
  }

  let forkOptions = orm.forkOptions;
  if (typeof forkOptions === 'function') {
    forkOptions = forkOptions(event, name) ?? useRuntimeConfig(event).mikroOrm.forkOptions?.get(name) ?? {};
  }

  const em = (orm.instance.em as T).fork(forkOptions);
  event.context.mikroOrmEntityManagers ??= new Map();
  event.context.mikroOrmEntityManagers.set(name, em);

  return em;
}
