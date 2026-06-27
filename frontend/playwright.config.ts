import { defineConfig } from 'playwright/test';

const baseURL = 'http://127.0.0.1:4173';

export default defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	retries: process.env.CI ? 1 : 0,
	timeout: 30_000,
	use: {
		baseURL,
		trace: 'on-first-retry',
	},
	projects: [
		{
			name: 'chromium',
			use: {
				browserName: 'chromium',
			},
		},
	],
	webServer: {
		command: 'npm run dev -- --host 127.0.0.1 --port 4173',
		url: `${baseURL}/`,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000,
	},
});
