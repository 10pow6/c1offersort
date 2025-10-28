import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  publicDir: 'public',
  build: {
    outDir: 'dist',
    minify: 'terser',
    copyPublicDir: true,
    terserOptions: {
      compress: {
        drop_console: mode === 'production' ? ['log', 'warn'] : false,
        drop_debugger: true,
        ...(mode === 'production' && { pure_funcs: ['console.log', 'console.warn'] }),
        passes: 2,
        pure_getters: true,
      },
      format: {
        comments: false,
      },
      mangle: {
        safari10: false,
      },
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        content: path.resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
      treeshake: {
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },
  },
}));
