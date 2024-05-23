import {useRequestEvent, type NuxtApp} from "#app";

/**
 * Get the MikroORM EntityManager for the current request.
 *
 * @param name Instance to get the EntityManager for. Defaults to "default".
 * @param app Locale the current request within a specific NuxtApp.
 */
export function useEntityManager(name?: string, app?: NuxtApp) {
  const em = useRequestEvent(app)?.context.em?.get(name ?? 'default');
  if (!em) {
    throw new Error(`MikroORM instance "${name}" does not have its entity manager forked. The instance may have been already closed.`);
  }
  return em;
}
