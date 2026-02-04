import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'vite-deploy-nsd-testing.apps.gaspar.ontampa.dev'
    ]
  }
})
