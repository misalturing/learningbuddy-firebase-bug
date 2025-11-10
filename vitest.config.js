import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test-setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['services/**/*.js', 'App.jsx'],
      exclude: ['**/*.test.js', '**/*.spec.js', 'node_modules/**']
    }
  },
  resolve: {
    alias: {
      '../services': '/app/services',
      '../constants.js': '/app/constants.js',
      '../components': '/app/components'
    }
  }
});
