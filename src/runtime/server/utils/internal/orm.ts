/**
 * @internal
 */

import { type ForkOptions, type MikroORM } from '@mikro-orm/core';
import consolaRoot from 'consola';
import { type EventHandlerRequest, type H3Event } from 'h3';

import type { ForkOptionsFactory, ModuleOptions } from '../../../../module';
import { useEntityManager } from '../orm';

/**
 * Consola instance, tagged with "MikroORM"
 *
 * @internal
 */
export const consola = consolaRoot.withTag('MikroORM');

/**
 * Interfered type of initialized MikroORM instance.
 *
 * @internal
 */
export type MikroOrmInstance = Awaited<ReturnType<(typeof MikroORM)['init']>>;

/**
 * The set of initialized MirkoORM instances.
 *
 * @internal
 */
export const ormInstances = new Map<
  string,
  {
    /**
     * The instance itself
     */
    instance: MikroOrmInstance;
    /**
     * The default fork options or factory for the instance
     */
    forkOptions?: ForkOptionsFactory | ForkOptions;
  }
>();

/**
 * Handle the ORM forking at a request event.
 *
 * This function is meant to be used internally by the Nuxt and Nitro plugins provided by "nuxt-mikro-orm-module".
 *
 * @param event The request event to process.
 * @param routeOptions The options to determine whether to fork or not
 * @param name The instance to be forked, if the options match.
 */
export function handleRequestEvent(
  event: H3Event<EventHandlerRequest>,
  routeOptions: NonNullable<ModuleOptions['routeOptions']>,
  name: string = 'default',
) {
  if (routeOptions === false) {
    return;
  }

  if (routeOptions === true) {
    useEntityManager(event, name);
    return;
  }

  if (event.path.startsWith('/api/')) {
    if (routeOptions.api) {
      useEntityManager(event, name);
    }
    return;
  }

  if (event.path.startsWith('/__nuxt_island/')) {
    if (routeOptions.islandComponents) {
      useEntityManager(event, name);
    }
    return;
  }

  if (routeOptions.routes) {
    useEntityManager(event, name);
  }
}
