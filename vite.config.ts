import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Plugin to generate asset manifest for offline precaching
function assetManifestPlugin() {
  return {
    name: 'asset-manifest',
    writeBundle(options, bundle) {
      const assets: string[] = [];
      for (const [fileName] of Object.entries(bundle)) {
        // Include JS and CSS files
        if (fileName.endsWith('.js') || fileName.endsWith('.css')) {
          assets.push(`/assets/${fileName.replace('assets/', '')}`);
        }
      }

      const manifest = {
        assets,
        generatedAt: new Date().toISOString(),
      };

      const outDir = options.dir || 'dist';
      fs.writeFileSync(
        path.join(outDir, 'asset-manifest.json'),
        JSON.stringify(manifest, null, 2)
      );
      console.log(`[asset-manifest] Generated manifest with ${assets.length} assets`);
    },
  };
}

export default defineConfig({
  plugins: [react(), assetManifestPlugin()],
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
