<template>
  <Button variant="outline" @click="toggleTheme">
    <Icon v-if="mode === 'dark'" icon="radix-icons:moon" />
    <Icon v-if="mode === 'light'" icon="radix-icons:sun" />
    <span class="sr-only">Toggle theme</span>
  </Button>
</template>
<script setup lang="ts">
import { Icon } from '@iconify/vue';
import { Button } from '@/components/ui/button';
import { useColorMode } from '@vueuse/core';
const mode = useColorMode();

const toggleTheme = () => {
  mode.value === 'dark' ? (mode.value = 'light') : (mode.value = 'dark');
};
</script>
