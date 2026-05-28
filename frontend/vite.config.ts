import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-dom') || id.includes('react-router-dom') || (id.includes('node_modules/react/') && !id.includes('react-dom'))) return 'vendor-react'
          if (id.includes('framer-motion')) return 'vendor-motion'
          if (id.includes('gsap')) return 'vendor-gsap'
          if (id.includes('qrcode') || id.includes('react-helmet-async')) return 'vendor-ui'
        },
      },
    },
  },
})
