import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	test: {
		environment: 'happy-dom',
		globals: true,
		include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			thresholds: {
				lines: 80,
				functions: 80,
				branches: 80,
				statements: 80,
			},
		},
	},
});
