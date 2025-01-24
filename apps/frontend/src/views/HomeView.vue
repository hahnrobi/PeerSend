<template>
  <main class="w-full max-w-[1000px] text-center mx-auto">
    <div class="flex flex-col gap-4">
      <h2 class="text-xl">Welcome</h2>
      <div class="text-2xl">
        <UsernameInput />
      </div>
      <p class="text-muted-foreground">
        Hint: Click on your username to change it.
      </p>
    </div>
    <div class="mt-10 flex flex-col gap-10 max-w-[400px] mx-auto">
      <Button class="text-xl" @click="enterRandomRoom()"> Create Room </Button>
      <Separator label="or enter with room ID" />
      <form
        class="flex w-full justify-center mx-auto max-w-sm items-center gap-1.5 text-2xl"
        v-on:submit.prevent="enterRoom"
      >
        <Input
          type="text"
          placeholder="Room ID"
          v-model="roomId"
          class="bg-background"
        />
        <Button type="submit" class="text-lg" @click="enterRoom">
          Enter
        </Button>
      </form>
    </div>
  </main>
</template>

<script setup lang="ts">
import UsernameInput from '@/components/UsernameInput.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { generateUsername } from 'unique-username-generator';
const router = useRouter();

const roomId = ref('');
const enterRandomRoom = () => {
  const randomRoomId = generateUsername('', 10);
  router.push(`/${randomRoomId}`);
};
const enterRoom = () => {
  router.push(`/${roomId.value}`);
};
</script>
