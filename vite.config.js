import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base so the build serves from https://rajat-lt.github.io/<repo>/.
  base: './',
  server: { port: 5183, strictPort: true },
})
