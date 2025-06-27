import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://qrgenious.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    sourcemap: false, // disables .map files in dist
    outDir: 'dist',   // default is fine unless you're customizing
  },
  css: {
    postcss: './postcss.config.js',
  },

})


// https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })
