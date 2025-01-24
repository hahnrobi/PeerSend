<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router';
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
import CurrentUrlQrCode from '@/components/CurrentUrlQrCode.vue';
import { Icon } from '@iconify/vue';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrentAbsoluteUrl } from '@/utils/url';
import InviteDialogs from '@/components/InviteDialogs.vue';

const io = useSocketIo();
const route = useRoute();
const currentRoom = ref<string | null>(null);
const users = computed(() => Object.values(io.peers));
const id = computed(() => (route.params.room as string)?.trim());
const url = useCurrentAbsoluteUrl();

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
    <Button variant="outline" class="w-full" as-child>
      <RouterLink to="/">
        <Icon icon="lucide:door-open" />Leave room</RouterLink
      ></Button
    >

    <Card>
      <CardHeader> Invite others to join</CardHeader>
      <CardContent class="flex flex-col gap-2">
        <InviteDialogs />
      </CardContent>
    </Card>
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
