<script setup lang="ts">
import { useRoute } from 'vue-router';
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
  watch,
} from 'vue';
import { useSocketIo } from '@/stores/socket-io';
import FilePicker from '@/components/FilePicker.vue';
import UserFileOffers from '@/components/UserFileOffers.vue';
import MyFileOffers from '@/components/MyFileOffers.vue';
import UserCard from '@/components/UserCard.vue';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

const io = useSocketIo();
const route = useRoute();
const currentRoom = ref<string | null>(null);
const users = computed(() => Object.values(io.peers));
const id = computed(() => (route.params.room as string)?.trim());

const selfInfo = computed(() => ({
  ...io.selfInfo,
  id: io.peer?.id,
  name: `${io.selfInfo.name} (You)`,
}));

const join = (room: string) => {
  if (currentRoom.value) {
    io.leaveRoom(room);
  }
  setTimeout(() => io.joinRoom(room), 1000);
};

onMounted(() => {
  join(id.value);
});

onUnmounted(() => io.leaveRoom());
</script>
<template>
  <div class="flex flex-col gap-2 w-full max-w-[400px] mx-auto">
    <Card>
      <CardHeader> Users in the room </CardHeader>
      <CardContent class="flex flex-col gap-2">
        <UserCard :peer-info="selfInfo" />
        <UserCard v-for="user in users" :key="user.id" :peer-info="user" />
      </CardContent>
    </Card>

    <UserFileOffers />
    <MyFileOffers />
  </div>
</template>
