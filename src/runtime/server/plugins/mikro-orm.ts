import { useRuntimeConfig } from "#imports";
import {MikroORM} from "@mikro-orm/core";
import {consola} from "consola";
import {colors} from "consola/utils";
import { type NitroApp } from "nitropack";
import {setOrm, unsetOrm, useOrm} from "../utils/orm";

/**
 * Due to an upstream bug in Nuxt 3 we need to stub the plugin here, track:https://github.com/nuxt/nuxt/issues/18556
 */
type NitroAppPlugin = (nitro: NitroApp) => void

function defineNitroPlugin(def: NitroAppPlugin): NitroAppPlugin {
  return def
}

export default defineNitroPlugin( async (nitroApp) => {
  if (nitroApp.h3App.options.debug) {
    nitroApp.hooks.hook('mikroOrm:init', async (orm, name) => {

      try {
        const info = await orm.checkConnection();
        if (info.ok) {
          consola.box(colors.bold(colors.green(`MikroORM connection for "${name}" successful.`)));
        } else {
          consola.error(`Failed connection check on "${name}":`, info.error);
        }
      } catch (error) {
        consola.error(`Failed to perform connection check on "${name}":`, error);
      }
    });
  }

  nitroApp.hooks.hook('mikroOrm:init', async (orm, name) => {

    const moduleRuntimeConfig = useRuntimeConfig().mikroOrm;
    const forkOptions = moduleRuntimeConfig.forkOptions?.get(name) ?? {};

    if (moduleRuntimeConfig.enableForkHook) {
      nitroApp.hooks.hook('request', async (event) => {
        const eventForkOptions = structuredClone(forkOptions);
        await nitroApp.hooks.callHook('mikroOrm:fork', event, eventForkOptions, name);
        event.context.em ??= new Map();
        event.context.em.set(name, orm.em.fork(eventForkOptions));
      });
    } else {
      nitroApp.hooks.hook('request', async (event) => {
        event.context.em ??= new Map();
        event.context.em.set(name, orm.em.fork(forkOptions));
      });
    }

    nitroApp.hooks.hook('close', async () => {
      await orm.close();
      unsetOrm(name);
    });
  });

  nitroApp.hooks.hook('mikroOrm:create', async (settings) => {
    const { config } = settings;
    const name = settings.name ?? 'default';

    let hasInstanceAlready = false;
    try {
      useOrm(name);
      hasInstanceAlready = true;
    } catch (error) {
      // Instance does not exit.
    }
    if (hasInstanceAlready) {
      throw new Error(`MikroORM instance with name "${name}" is already initialized`);
    }

    try {
      const orm = await MikroORM.init(config);
      setOrm(orm, name);
      nitroApp.hooks.callHook('mikroOrm:init', orm, name);
    } catch (error) {
      consola.error('Failed to create MikroORM instance:', error)
    }
  });
})
