import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCase',
    },
    preprocessorOptions: {
      scss: {
        // Make variables available in all SCSS files
        additionalData: `@use "@/styles/variables" as *;`,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy API calls to Express backend during development
      '/api': {
        target: 'http://localhost:3018',
        changeOrigin: true,
      },
    },
  },
});
