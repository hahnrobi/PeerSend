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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { formatFileSize } from '../utils/files';
import { Button } from '@/components/ui/button';
import FileDownloadButton from './FileDownloadButton.vue';
import FileDetails from '@/components/FileDetails.vue';

const io = useSocketIo();
const userOffers = computed(() => io.userOffers);
const peerInfos = computed(() => io.peers);
const userIds = computed(() => Object.keys(userOffers.value));
const usersWithOffers = computed(() =>
  Object.keys(userOffers.value).map((id) => {
    return { id, name: peerInfos.value[id]?.name };
  })
);
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Offered Files</CardTitle>
      <CardDescription
        >You can download these files from other peers.</CardDescription
      >
    </CardHeader>
    <CardContent>
      <div v-if="!usersWithOffers.length" class="text-muted-foreground">
        No files offered yet.
      </div>
      <div
        v-for="user in usersWithOffers"
        :data-state="'open'"
        :value="user.id"
        :key="user.id"
      >
        <div class="text-lg mb-2">{{ user.name || user.id }}</div>
        <div>
          <div
            v-for="offer in userOffers[user.id]"
            :key="`${offer.name}_${offer.size}`"
            class="flex gap-2"
          >
            <FileDetails :file-offer="offer" />
            <FileDownloadButton :file-offer="offer" :peer-id="user.id" />
          </div>
        </div>
        <hr class="mt-2" />
      </div>
    </CardContent>
  </Card>
</template>
