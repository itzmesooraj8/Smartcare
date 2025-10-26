import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// vite.config.ts
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
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
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  preview: {
    port: 5173,
    host: true,
  },
  // Build options: split vendor packages into separate chunks to avoid very large bundles
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Get the package name from the path
            const parts = id.split('node_modules/')[1].split('/');
            // Handle scoped packages like @scope/name
            const pkgName = parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
            return pkgName;
          }
        },
      },
    },
  },
}));
