import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  base: '/events/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'html-version',
      transformIndexHtml(html) {
        return html.replace('__VERSION__', version)
      },
    },
  ],
})
