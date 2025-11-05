import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
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
        'injected-scripts/pagination': path.resolve(__dirname, 'src/injected-scripts/pagination.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        // Force background worker to be inlined (no code splitting)
        manualChunks: (id) => {
          // Background worker must be standalone - no separate chunks
          if (id.includes('src/background')) {
            return undefined;
          }
        },
        // Inline dynamic imports for background worker
        inlineDynamicImports: false,
      },
      treeshake: {
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
    },
  },
}));
