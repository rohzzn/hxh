import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@react-three/fiber') || id.includes('@react-three/drei')) {
            return 'three-react'
          }

          if (id.includes('/three/')) {
            return 'three-core'
          }

          return undefined
        },
      },
    },
  },
})
