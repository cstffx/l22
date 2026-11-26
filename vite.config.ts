import { defineConfig } from 'vite';
import solid from '@solidjs/vite-plugin';
import dts from 'vite-plugin-dts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    solid(),
    dts({
      entryRoot: 'src',
      outDirs: 'dist',
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.ts'],
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'esnext',
    lib: {
      entry: path.resolve(root, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
      cssFileName: 'l22',
    },
    rollupOptions: {
      external: [/^solid-js(\/|$)/, /^@solidjs\//, /^@kobalte(\/|$)/],
    },
  },
});
