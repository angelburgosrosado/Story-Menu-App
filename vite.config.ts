import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3001,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('@splinetool/runtime/build/physics') || (id.includes('@splinetool') && id.includes('physics'))) {
                return 'spline-physics';
              }
              if (id.includes('@splinetool/react-spline') || id.includes('@splinetool/runtime/build/runtime')) {
                return 'spline-runtime';
              }
            }
          }
        }
      }
    };
});
