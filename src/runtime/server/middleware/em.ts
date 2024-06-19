import { defineEventHandler, type EventHandlerRequest, type H3Event } from 'h3';
import { type NitroRouteRules } from 'nitropack';

import { getRouteRules, useRuntimeConfig } from '#imports';

import { handleRequestEvent, ormInstances } from '../utils/internal/orm';

// The type of getRouteRules is wrong. Patch it.
const patchedGetRouteRules = getRouteRules as unknown as (event: H3Event<EventHandlerRequest>) => NitroRouteRules;

export default defineEventHandler(async (event) => {
  const mikroOrmRouteRule = patchedGetRouteRules(event).mikroOrm;
  if (mikroOrmRouteRule === false) {
    return;
  }

  const runtimeOptions =
    typeof event.context.nitro?.runtimeConfig === 'undefined'
      ? useRuntimeConfig().mikroOrm
      : useRuntimeConfig(event).mikroOrm;

  for (const name of ormInstances.keys()) {
    if ((runtimeOptions.overrides?.[name]?.autoForking ?? runtimeOptions.autoForking) !== 'middleware') {
      continue;
    }
    if (mikroOrmRouteRule === true) {
      handleRequestEvent(event, true, name);
      continue;
    }

    if (typeof mikroOrmRouteRule === 'undefined') {
      const routeOptions = runtimeOptions.overrides?.[name]?.routeOptions ?? runtimeOptions.routeOptions ?? true;
      handleRequestEvent(event, routeOptions, name);
      continue;
    }

    if (!mikroOrmRouteRule.includes(name)) {
      continue;
    }
    handleRequestEvent(event, true, name);
  }
});
