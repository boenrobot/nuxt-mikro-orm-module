<template>
  <div>
    This is only rendered on the server. Product: {{ productName }}
  </div>
</template>

<script setup lang="ts">
import { type EntityManager } from "@mikro-orm/knex";

const event = useRequestEvent()!;
const em = useEntityManager<EntityManager>(event);
const productName = (await em.execute<[{name: string}]>('SELECT name FROM products LIMIT 1'))[0].name;
</script>
