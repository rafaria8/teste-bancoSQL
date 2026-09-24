import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Encaminha chamadas da interface à API durante o desenvolvimento.
      '/api': 'http://localhost:3001',
    },
  },
});
