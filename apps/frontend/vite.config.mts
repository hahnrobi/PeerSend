/// <reference types='vitest' />
import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import vueDevTools from 'vite-plugin-vue-devtools';
import packageJson from '../../package.json';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({mode}) => {
  return {
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/frontend',
  envDir: resolve(__dirname, '../../'),
  server: {
    port: 4200,
    host: '0.0.0.0',
    allowedHosts: ['peersendtest.xenon.iva.hu'],
  },
  preview: {
    port: 4300,
    host: 'localhost',
  },
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(packageJson.version),
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  plugins: [
    vue(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    vueDevTools({
      launchEditor: 'webstorm',
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'assets/favicons/*', // Source folder
          dest: '.' // Destination root of the dist folder
        }
      ]
    })
  ],
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
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}});
