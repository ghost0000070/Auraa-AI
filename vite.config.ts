/// <reference types="vitest" />
import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react-swc"
 
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: 'src/setupTests.ts',    
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI component libraries
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-accordion',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-toggle',
          ],
          // AI and data libraries
          'ai-vendor': ['@google/generative-ai'],
          'data-vendor': ['@supabase/supabase-js', '@tanstack/react-query'],
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
    target: 'es2020',
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
  },
})
