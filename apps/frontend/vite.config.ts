/// <reference types='vitest' />
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/frontend',
  server: {
    port: 4200,
    host: '0.0.0.0',
    allowedHosts: ['peersendtest.xenon.iva.hu'],
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  plugins: [vue(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md']), vueDevTools({
    launchEditor: 'webstorm'
  }),],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  build: {
    outDir: '../../dist/apps/frontend',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
