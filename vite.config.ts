import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: '127.0.0.1' },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    clearMocks: true,
  },
})
