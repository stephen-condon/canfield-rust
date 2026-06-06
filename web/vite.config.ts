import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

export default defineConfig({
  plugins: [wasm(), topLevelAwait()],
  test: {
    environment: 'jsdom',
    include: ['src/tests/**/*.test.ts'],
    coverage: { provider: 'v8', thresholds: { lines: 80 } }
  }
})
