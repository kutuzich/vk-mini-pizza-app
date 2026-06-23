import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    // Default Vite port is 5173; keep host enabled for easier tunneling.
    host: true,
  },
})
