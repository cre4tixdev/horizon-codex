import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: [{ find: /^pagedjs-preview-runtime(?=\?|$)/, replacement: fileURLToPath(new URL('./node_modules/pagedjs/dist/paged.min.js', import.meta.url)) }] },
  optimizeDeps: { exclude: ['pagedjs-preview-runtime?raw'] },
  server: { host: '127.0.0.1' },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    clearMocks: true,
  },
})
