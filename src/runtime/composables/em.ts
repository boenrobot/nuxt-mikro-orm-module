import type { EntityManager } from '@mikro-orm/core';
import type { EventHandlerRequest, H3Event } from 'h3';

import { NuxtMikroOrmForkUnavailable } from '../utils/errors';

/**
 * Use the request's EntityManager.
 *
 * This function is intended for use in island components.
 *
 * Unlike {@link "runtime/server/utils/orm"!useEntityManager | its "utils" counterpart of the same name},
 * it does not automatically fork the ORM instance.
 * The ORM instance must have been forked previously with the other function,
 * at any point in which it has access to the request event.
 * These include a "request" hook from a Nitro plugin,
 * a Nuxt server plugin, or a defineRequestEvent() handler function.
 * Only then, this function can access that fork.
 *
 * Depending on the current runtimeConfig (see {@link "module"!ModuleOptions | ModuleOptions}),
 * the utils function may be automatically called for all routes, making this one always available.
 *
 * @template T Type of the EntityManager instance. Typically, the "EntityManager" export of your MikroORM driver.
 *
 * @param event The associated request of the EntityManager.
 * Mostly kept for consistency with the "utils" counterpart.
 * @param name The name of the MikroORM instance to fork.
 *
 * @return The request's associated EntityManager fork.
 *
 * @throws {@link "runtime/utils/errors"!NuxtMikroOrmForkUnavailable | NuxtMikroOrmForkUnavailable} When trying to use
 * an instance that wasn't forked previously.
 */
export function useEntityManager<T extends EntityManager = EntityManager>(
  event: H3Event<EventHandlerRequest>,
  name: string = 'default',
): T {
  const em = event.context.mikroOrmEntityManagers?.[name];
  if (!em) {
    throw new NuxtMikroOrmForkUnavailable(
      import.meta.dev
        ? `MikroORM instance "${name}" is either not initialized, or not forked for this request. Create a nitro plugin in which you call either initOrm() or registerGlobalOrm(), and call useEntityManager() at any point before rendering of .vue files. Any point which has access to the request event will do ("request" hook in a Nitro module, Nuxt plugin, or a defineEventHandler() handler function in Nuxt).`
        : `MikroORM instance "${name}" is either not initialized, or not forked for this request`,
      name,
    );
  }
  return em as T;
}
