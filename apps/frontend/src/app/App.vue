<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { useSocketIo } from '@/stores/socket-io';
import { onBeforeUnmount, onMounted } from 'vue';
import { useColorMode } from '@vueuse/core';
import { Icon } from '@iconify/vue';
import { Button } from '@/components/ui/button';
import PerlinBg from '@/components/PerlinBg.vue';
import Header from '@/components/Header.vue';
import { env } from '@/utils/env';
const io = useSocketIo();
io.connect();
const e = env();
onMounted(() => {
  console.log('App mounted', e);
});
onBeforeUnmount(() => io.disconnect());
</script>

<template>
  <PerlinBg />
  <Header />
  <RouterView />
</template>

