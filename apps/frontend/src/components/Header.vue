<script setup lang="ts">
import ThemeToggleButton from '@/components/ThemeToggleButton.vue';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/vue';
import { env } from '@/utils/env';
const envType = env().MODE;
const version = env().PACKAGE_VERSION;
</script>
<template>
  <header class="w-full h-16 bg-background p-3">
    <div class="flex justify-between items-center max-w-[1000px] mx-auto">
      <div class="flex items-center gap-6">
        <RouterLink to="/" class="text-violet-800 flex gap-2 items-center">
          <img src="/assets/PeerSend.svg" alt="PeerSend" class="h-10 w-10">
          PeerSend
        </RouterLink>
        <ThemeToggleButton />
      </div>
      <div class="flex gap-2 text-sm text-muted-foreground items-center">
        Version {{ version }} ({{ envType }})
        <Button variant="outline" as-child>
          <a href="https://github.com/hahnrobi/PeerSend" target="_blank">
            <Icon icon="lucide:github" />
          </a>
        </Button>
      </div>
    </div>
  </header>
</template>
