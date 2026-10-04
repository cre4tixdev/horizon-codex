import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  outputDir: 'test-results/auth',
  testDir: './tests/auth', fullyParallel: false, workers: 1,
  forbidOnly: Boolean(process.env.CI), reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4174', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    { command: 'python3 tests/pocketbase/check_auth.py --serve', url: 'http://127.0.0.1:18090/api/health', reuseExistingServer: false },
    { command: 'pnpm dev --port 4174 --strictPort', env: { VITE_POCKETBASE_URL: 'http://127.0.0.1:18090' }, url: 'http://127.0.0.1:4174', reuseExistingServer: false },
  ],
})
