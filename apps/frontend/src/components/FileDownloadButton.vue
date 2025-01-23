<template>
  <Button :disabled="isFileRequested" @click="requestFile()">
    {{ isFileRequested ? percentage + '%' : 'Download' }}
  </Button>
</template>
<script setup lang="ts">
import { useSocketIo } from '@/stores/socket-io';
import { FileOffer } from '@/definitions/file';
import { makeFileOfferId } from '@/utils/files';
import { computed } from 'vue';
import { Button } from '@/components/ui/button';

const props = defineProps<{
  fileOffer: FileOffer;
  peerId: string;
}>();
const offerId = computed(() => makeFileOfferId(props.fileOffer, props.peerId));

const io = useSocketIo();
const isFileRequested = computed(() => io.downloads[offerId.value]);
const percentage = computed(() => {
  const { receivedChunks, totalChunks } = io.downloads[offerId.value];
  return Math.round((receivedChunks / totalChunks) * 100);
});

const requestFile = () => {
  if (isFileRequested.value) {
    return;
  }
  io.requestFile(props.peerId, props.fileOffer);
};
</script>
