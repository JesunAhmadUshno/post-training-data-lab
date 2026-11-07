import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// The site reads ../level-*/ results, data and docs at build time, so every number on the page is generated, never typed.
export default defineConfig({
  base: '/post-training-data-lab/',
  plugins: [react()],
  server: { fs: { allow: ['..'] } },
});
