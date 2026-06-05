import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts')) return 'recharts'
          if (id.includes('lucide-react')) return 'lucide'
          if (id.includes('@reduxjs/toolkit') || id.includes('react-redux'))
            return 'redux'
          if (id.includes('react-router')) return 'react-router'
          if (id.includes('formik') || id.includes('yup')) return 'forms'
          if (id.includes('react-dom')) return 'react-dom'
          if (id.includes('/react/') || id.includes('\\react\\')) return 'react'
          return undefined
        },
      },
    },
  },
})
