import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The review harness renders the real React Native component tree via react-native-web.
// It is NOT the product: the shipping clients are apps/mobile and apps/tv.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      '@hallyu/shared': path.resolve(process.cwd(), '../../packages/shared/src'),
      '@hallyu/ui': path.resolve(process.cwd(), '../../packages/ui/src'),
    },
    extensions: ['.web.tsx', '.web.ts', '.tsx', '.ts', '.js', '.jsx'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
