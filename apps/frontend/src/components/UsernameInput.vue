<template>
  <Button
    v-if="!isEditMode"
    @click="isEditMode = true"
    variant="ghost"
    class="text-2xl"
  >
    {{ localstorageUsername }}
  </Button>
  <div
    v-if="isEditMode"
    class="flex w-full justify-center mx-auto max-w-sm items-center gap-1.5 text-2xl"
  >
    <Input
      type="text"
      placeholder="Username"
      class="text-xl"
      v-model="username"
    />
    <Button type="submit" class="text-lg" @click="localstorageUsername = username; isEditMode = false"> Save </Button>
  </div>
</template>
<script lang="ts" setup>
import { useLocalStorage } from '@vueuse/core';
import { generateUsername } from 'unique-username-generator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { onMounted, ref, useTemplateRef, watch } from 'vue';

const isEditMode = ref(false);
const input = useTemplateRef('username-input');

const existingUserName = useLocalStorage(
  'PeerSend_username',
  ""
);
const username = ref(existingUserName.value);


const localstorageUsername = useLocalStorage(
  'PeerSend_username',
  generateUsername('', 3)
);

</script>
