import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

function copyManifest() {
  return {
    name: 'copy-manifest',
    closeBundle() {
      const dist = resolve(__dirname, 'dist');
      if (!existsSync(dist)) mkdirSync(dist);
      copyFileSync(
        resolve(__dirname, 'tonconnect-manifest.json'),
        resolve(dist, 'tonconnect-manifest.json')
      );
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
      protocolImports: true,
    }),
    copyManifest(),
  ],
  base: '/vetementstest/',
  server: { port: 5173 },
  build: {
    target: 'esnext',
    commonjsOptions: { transformMixedEsModules: true },
  },
  optimizeDeps: {
    include: [
      '@ton/core',
      '@ton/crypto',
      '@ton/ton',
      '@tonconnect/ui-react',
      'buffer',
    ],
  },
});
