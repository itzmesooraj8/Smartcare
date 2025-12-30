import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";
import { componentTagger } from "lovable-tagger";

// vite.config.ts
export default defineConfig(({ mode }) => ({
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: false,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
      // Proxy Socket.IO to chatbot server to avoid cross-origin issues in dev
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}'],
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    port: 5173,
    host: "127.0.0.1",
  },
  // Build options: split vendor packages into separate chunks to avoid very large bundles
  build: {
    chunkSizeWarningLimit: 1000, // Suppress warnings for chunks up to 1MB (unavoidable for heavy video features)
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React ecosystem
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          
          // UI & styling
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-slot', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          
          // Animation
          animation: ['framer-motion'],
          
          // Heavy dependencies - isolate separately
          livekit: ['livekit-client', '@livekit/components-react', '@livekit/components-styles'],
          ai: ['openai', 'ai', '@ai-sdk/xai'],
          charts: ['recharts', 'react-chartjs-2', 'chart.js'],
          
          // Forms & validation
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
      },
    },
  },
}));
