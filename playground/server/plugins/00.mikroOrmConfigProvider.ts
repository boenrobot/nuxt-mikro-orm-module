import { initOrm } from "#imports";
import { defineConfig, type EntityManager, type MikroORM } from "@mikro-orm/mysql";

export default defineNitroPlugin(async (_nitro) => {
  const orm = await initOrm<MikroORM>(defineConfig({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    dbName: 'test',
    port: 3309,
    discovery: {
      warnWhenNoEntities: false,
    }
  }));

  await orm.schema.ensureDatabase({create: true});
  const em = orm.em as EntityManager;
  await em.execute(`
CREATE TABLE IF NOT EXISTS \`products\`
(
  \`product_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  \`name\`       VARCHAR(255) NOT NULL,
  PRIMARY KEY (\`product_id\`),
  UNIQUE INDEX \`name_UNIQUE\` (\`name\` ASC) VISIBLE
)
  ENGINE = InnoDB
`);
  const productCount = (await em.execute<[{count: number}]>('SELECT COUNT(*) AS count FROM `products`'))[0].count;
  if (productCount === 0) {
    await em.execute(`
INSERT INTO products SET name = 'product 1'
`);      await em.execute(`
INSERT INTO products SET name = 'product 2'
`);
  }
});
