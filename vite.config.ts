import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Definimos el objeto process.env para que las librerías que lo usan no rompan la app.
      'process.env': {
        API_KEY: JSON.stringify(env.VITE_API_KEY || env.API_KEY || ''),
        NODE_ENV: JSON.stringify(mode),
      }
    }
  }
})