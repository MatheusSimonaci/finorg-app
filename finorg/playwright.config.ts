import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
  reporter: [
    ['list'], 
    ['json', { outputFile: 'tests/results/report.json' }],
    ['html', { outputFolder: 'tests/results/html' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'local',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /e2e-production\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3000',
      },
    },
    {
      name: 'production',
      testMatch: /e2e-production\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
        baseURL: 'https://finorg-app.vercel.app',
      },
    },
  ],
  // No webServer — we manage it ourselves
});
