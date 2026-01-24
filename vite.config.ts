import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import devServer from '@hono/vite-dev-server'

export default defineConfig({
  base: '/vatsim-zulu-event-planner/',
  plugins: [
    react(),
    tailwindcss(),
    devServer({
      entry: 'server/index.ts',
      exclude: [
        // Only send /api/* requests to Hono, exclude everything else
        /^(?!\/api\/).*/,
      ],
      injectClientScript: false,
    }),
  ],
})
