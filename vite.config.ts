import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build for better performance
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Vendor libraries
          'vendor-react': ['react', 'react-dom'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-satellite': ['satellite.js'],
          'vendor-state': ['zustand', '@tanstack/react-query'],
          'vendor-utils': ['date-fns', 'clsx', 'class-variance-authority', 'tailwind-merge', 'lucide-react']
        }
      }
    },
    // Increase chunk size warning limit for the Globe3D component
    chunkSizeWarningLimit: 1000,
    // Optimize CSS
    cssCodeSplit: true,
    // Target modern browsers for better optimization
    target: 'esnext',
    // Use default minification
    minify: true
  },
  server: {
    // Development server optimizations
    hmr: {
      overlay: true
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'satellite.js',
      'zustand'
    ]
  }
})
