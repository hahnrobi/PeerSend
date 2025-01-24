<script setup lang="ts">
import { useSocketIo } from '@/stores/socket-io';
import { computed } from 'vue';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatFileSize, makeFileOffer } from '../utils/files';
import FilePicker from '@/components/FilePicker.vue';
import { Button } from '@/components/ui/button';
import FileDetails from '@/components/FileDetails.vue';

const io = useSocketIo();
const files = computed(() => io.offeredFiles);
const fileOffers = computed(() => files.value?.map(makeFileOffer));
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Your Files</CardTitle>
      <CardDescription
      >These files are offered by you and available for download for other peers.</CardDescription
      >
    </CardHeader>
    <CardContent>
      <div
        v-for="offer in fileOffers"
        :key="`${offer.name}_${offer.size}`"
        class="flex gap-2"
      >
        <FileDetails :file-offer="offer" />
        <Button variant="destructive" @click="io.unOfferFile(offer)">Unoffer</Button>
      </div>
      <div v-if="fileOffers.length === 0" class="text-muted-foreground">No files offered. Pick some files.</div>
    </CardContent>
    <CardFooter>
      <FilePicker />
    </CardFooter>
  </Card>
</template>
