<script setup lang="ts">
import { FileOffer } from '@/definitions/file';
import { useMimeIcon } from '@/utils/mime-icon';
import { formatFileSize } from '@/utils/files';
import { computed } from 'vue';
import { Icon } from '@iconify/vue';

const props = defineProps<{
  fileOffer: FileOffer;
}>();

const mimeIcon = useMimeIcon(props.fileOffer.mime);

const formattedFileSize = computed(() => formatFileSize(props.fileOffer.size));
</script>

<template>
  <div class="flex w-full align-middle gap-2">
    <div v-if="mimeIcon" :class="mimeIcon.classes" class="w-10 h-10 p-2 rounded-xl">
      <Icon :icon="mimeIcon.icon" class="w-6 h-6" />
    </div>
    <div class="flex-1 flex flex-col gap-1">
      {{ fileOffer.name }}
      <span class="text-sm text-muted-foreground">
        {{ formattedFileSize }}
      </span>
    </div>
  </div>
</template>
