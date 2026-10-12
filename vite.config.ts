import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `base: './'` hace que la web funcione en cualquier ruta (por ejemplo
// https://<usuario>.github.io/c-gamechanger/) sin tocar nada.
export default defineConfig({
  base: './',
  plugins: [react()],
  worker: { format: 'es' },
  test: {
    include: ['src/**/*.test.ts'],
    testTimeout: 60000,
  },
});
