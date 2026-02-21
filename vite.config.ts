import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // Force CJS version of dagre so named exports (graphlib, layout) work
      '@dagrejs/dagre': path.resolve('./node_modules/@dagrejs/dagre/dist/dagre.cjs.js'),
    },
  },
})
