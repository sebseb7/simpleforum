import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const port = env.PORT || '3001';

  return {
    root: path.resolve(__dirname, 'client'),
    plugins: [react()],
    envDir: __dirname,
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, 'shared'),
      },
    },
    server: {
      port: 5173,
      fs: {
        allow: [path.resolve(__dirname)],
      },
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${port}`,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: path.resolve(__dirname, 'dist'),
      emptyOutDir: true,
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'react',
                test: /[/\\]node_modules[/\\](?:react|react-dom|scheduler)[/\\]/,
              },
              {
                name: 'mui',
                test: /[/\\]node_modules[/\\](?:@mui|@emotion)[/\\]/,
              },
              {
                name: 'quill',
                test: /[/\\]node_modules[/\\](?:react-quill-new|quill|quill-delta|quill-resize-image|parchment)[/\\]/,
              },
              {
                name: 'vendor',
                test: /[/\\]node_modules[/\\]/,
              },
            ],
          },
        },
      },
    },
  };
});
