<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { useSocketIo } from '@/stores/socket-io';
import { onBeforeUnmount } from 'vue';
import { useColorMode } from '@vueuse/core';
import { Icon } from '@iconify/vue';
import { Button } from '@/components/ui/button';
const io = useSocketIo();
io.connect();
onBeforeUnmount(() => io.disconnect());
const mode = useColorMode();

const toggleTheme = () => {
  mode.value === 'dark' ? (mode.value = 'light') : (mode.value = 'dark');
};
</script>

<template>
  <header>
    <nav>
      <RouterLink to="/">Home</RouterLink>
    </nav>
    <Button variant="outline" @click="toggleTheme">
      <Icon
        v-if="mode === 'dark'"
        icon="radix-icons:moon"
      />
      <Icon
        v-if="mode === 'light'"
        icon="radix-icons:sun"
      />
      <span class="sr-only">Toggle theme</span>
    </Button>
  </header>
  <RouterView />
</template>

<style scoped lang="css">
header {
  line-height: 1.5;
  max-width: 100vw;
}

nav > a {
  padding-left: 1rem;
  padding-right: 1rem;
}

@media (min-width: 768px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
    margin-left: auto;
    margin-right: auto;
    max-width: 768px;
  }

  nav {
    text-align: left;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
