import {defineConfig} from 'vitest/config';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
export default defineConfig({plugins:[react()],resolve:{alias:{'virtual:pwa-register':fileURLToPath(new URL('./tests/sw-stub.ts',import.meta.url))}},test:{environment:'jsdom',include:['tests/*.test.tsx'],setupFiles:['./tests/setup.ts'],testTimeout:20000}});
