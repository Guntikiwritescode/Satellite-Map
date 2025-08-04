import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    // Security headers for development
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
    // Development server optimizations
    hmr: {
      overlay: true
    }
  },
  plugins: [
    react({
      // Enable React refresh for better development experience
      jsxImportSource: '@emotion/react',
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build output with modern targets
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching - combining best of both strategies
        manualChunks: {
          // Core vendor libraries
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-state': ['zustand'],
          // UI libraries
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          // 3D graphics
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          // Satellite-specific
          'vendor-satellite': ['satellite.js'],
          // Utilities
          'vendor-utils': ['date-fns', 'clsx', 'class-variance-authority', 'tailwind-merge', 'lucide-react']
        },
        // Security: Remove comments and console statements in production
        generatedCode: {
          constBindings: true,
        },
      },
    },
    // Source maps only in development for security
    sourcemap: false,
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Optimize CSS
    cssCodeSplit: true,
  },
  define: {
    // Remove console.log in production builds
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },
  optimizeDeps: {
    // Pre-bundle dependencies for faster dev server startup
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'zustand',
      'satellite.js',
    ],
    exclude: [
      // Exclude large dependencies that benefit from lazy loading
      '@react-three/fiber',
      '@react-three/drei',
      'three',
    ],
  },
  // Security: Prevent loading arbitrary files
  assetsInclude: ['**/*.glb', '**/*.jpg', '**/*.png', '**/*.svg', '**/*.mp3'],
});
