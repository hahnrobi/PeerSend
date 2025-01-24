<template>
  <img ref="qrElement" :src="qrData" alt="QR Code" />
</template>
<script lang="ts" setup>
import { computedAsync, templateRef } from '@vueuse/core';
import { toDataURL } from 'qrcode';
import { useCurrentAbsoluteUrl } from '@/utils/url';

const qrElement = templateRef('qrElement');
const url = useCurrentAbsoluteUrl();

const qrData = computedAsync(async () => {
  return await toDataURL(url, { width: 500 });
}, '');
</script>
