<script setup lang="ts">
import { PeerInfo, useSocketIo } from '@/stores/socket-io';
import { computed } from 'vue';
import { getInitials } from '@/utils/initials';
import { Icon } from '@iconify/vue';
import { Skeleton } from '@/components/ui/skeleton';

const props = defineProps<{
  peerInfo: PeerInfo;
}>();
const io = useSocketIo();
const initials = computed(() => getInitials(props.peerInfo.name || ''));
const isLoading = computed(() => !props.peerInfo.name);
const isSelf = computed(() => props.peerInfo.id === io.peer?.id);
</script>

<template>
  <div class="flex gap-2 items-center">
    <template v-if="isLoading">
      <Skeleton class="w-10 h-10 rounded-lg" />
    </template>
    <template v-if="!isLoading">
      <div
        class="rounded-lg text-2xl font-bold text-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 w-10 h-10 p-1 flex items-center justify-center"
      >
        <Icon
          v-if="!initials?.length || isSelf"
          :icon="isSelf ? 'lucide:circle-user-round' : 'lucide:user'"
          class="w-6 h-6"
        />
        <template v-if="!isSelf">
          {{ initials }}
        </template>
      </div>
    </template>
    <div class="flex-1 flex flex-col gap-1">
      <template v-if="isLoading">
        <Skeleton class="w-24 h-[1rem] rounded" />
      </template>
      <template v-if="!isLoading">
        <div class="text-sm font-medium">{{ peerInfo.name }}</div>
      </template>
    </div>
  </div>
</template>
