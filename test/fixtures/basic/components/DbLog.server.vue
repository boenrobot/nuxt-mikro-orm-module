<script setup lang="ts" v-pre>
import { type EntityManager } from "@mikro-orm/knex";
const { productName } = await (async () => {
  try {
    const em = useEntityManager<EntityManager>(useRequestEvent()!);
    const productName = (await em.execute<[{name: string}]>('SELECT name FROM products LIMIT 1'))[0].name;
    return { productName };
  } catch (e) {
    return {productName: 'No product for you!'};
  }
})();
</script>

<template>
  <div>
    This is only rendered on the server. Product: {{ productName }}
  </div>
</template>
