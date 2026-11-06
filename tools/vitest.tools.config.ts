import { defineConfig } from 'vitest/config';

/** Dev scripts that reuse game code; kept out of `npm test`. */
export default defineConfig({
  test: {
    include: ['tools/**/*.run.ts'],
  },
});
