
import { type MikroORM } from "@mikro-orm/core";

const ormInstances = new Map<string, Awaited<ReturnType<typeof MikroORM['init']>>>();

export function setOrm(orm: Awaited<ReturnType<typeof MikroORM['init']>>, name: string = 'default') {
  ormInstances.set(name, orm);
}

export function unsetOrm(name: string)
{
  ormInstances.delete(name);
}

export function useOrm(name: string = 'default') {
  const orm = ormInstances.get(name);
  if (!orm) {
    throw new Error(`MikroORM instance "${name}" is not initialized.`);
  }
  return orm;
}
