<template>
  <Button @click="open">Pick a file</Button>
</template>
<script setup lang="ts">
import { useFileDialog } from '@vueuse/core';
import { Button } from '@/components/ui/button';
import { useSocketIo } from '@/stores/socket-io';
const io = useSocketIo();
const { files, open, reset, onCancel, onChange } = useFileDialog({
  accept: '*', // Set to accept only image files
});
onChange((files) => {
  const array = Array.from(files);
  console.log('File picked', array);
  if(array.length === 0){
    return;
  }
  io.offerFiles(array);
  /** do something with files */
});

onCancel(() => {
  /** do something on cancel */
});
</script>
