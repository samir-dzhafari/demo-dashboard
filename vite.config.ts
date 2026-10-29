import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

const layers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'] as const

export default defineConfig({
  // GitHub Pages serves the site from /<repo>/; the deploy workflow sets VITE_BASE.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: Object.fromEntries(
      layers.map((layer) => [`@/${layer}`, fileURLToPath(new URL(`./src/${layer}`, import.meta.url))]),
    ),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./src/test-setup.ts'],
    testTimeout: 30_000,
  },
})
