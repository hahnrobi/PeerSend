<script lang="ts" setup>
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import CurrentUrlQrCode from '@/components/CurrentUrlQrCode.vue';
import { Icon } from '@iconify/vue';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useCurrentAbsoluteUrl } from '@/utils/url';
import { useClipboard } from '@vueuse/core';
const url = useCurrentAbsoluteUrl();
const { text, copy, copied, isSupported } = useClipboard({ source: url });
</script>
<template>
  <Dialog>
    <DialogTrigger as-child>
      <Button variant="outline">
        <Icon icon="lucide:qr-code" />
        with QR Code
      </Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Invite others</DialogTitle>
        <DialogDescription>
          <div class="mb-2">
            Scan this QR code with another device to invite them to this room.
          </div>
          <CurrentUrlQrCode />
        </DialogDescription>
      </DialogHeader>
    </DialogContent>
  </Dialog>
  <Dialog>
    <DialogTrigger as-child>
      <Button variant="outline">
        <Icon icon="lucide:link" />
        with Link
      </Button>
    </DialogTrigger>
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Share link</DialogTitle>
        <DialogDescription>
          Anyone who has this link will be able to join.
        </DialogDescription>
      </DialogHeader>
      <div class="flex items-center space-x-2">
        <div class="grid flex-1 gap-2">
          <Label for="link" class="sr-only"> Link </Label>
          <Input id="link" :default-value="url" read-only />
        </div>
        <Button type="submit" size="sm" class="px-3" @click="copy(url)">
          <template v-if="!copied">
            <span class="sr-only">Copy</span>
            <Icon icon="lucide:copy" />
          </template>
          <template v-if="copied"> Copied </template>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
