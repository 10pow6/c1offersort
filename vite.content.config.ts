import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => ({
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't clear dist folder
    lib: {
      entry: path.resolve(__dirname, 'src/content/index.ts'),
      name: 'content',
      fileName: () => 'content.js',
      formats: ['iife'], // Immediately Invoked Function Expression - no modules
    },
    rollupOptions: {
      output: {
        entryFileNames: 'content.js',
        // Inline everything - no external dependencies or code splitting
        inlineDynamicImports: true,
      },
    },
    minify: mode === 'production' ? 'terser' : false,
    terserOptions: {
      compress: {
        drop_console: mode === 'production' ? ['log', 'warn'] : false,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
    },
  },
}));
