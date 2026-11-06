import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  // Relative base lets the same build work on GitHub Pages under /<repo>/.
  base: './',
  plugins: [preact()],
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
