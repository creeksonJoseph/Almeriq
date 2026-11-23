import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')

  return {
    plugins: [
      tailwindcss(),
      react(),
      sentryVitePlugin({
        org: 'joseph-charana',
        project: 'almeriq-frontend',
        authToken: env.SENTRY_AUTH_TOKEN,
      }),
    ],
    build: {
      sourcemap: true,
      rolldownOptions: {
        output: {
          codeSplitting: {
            minSize: 20000,
            groups: [
              {
                name: 'react-vendor',
                test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                priority: 30,
              },
              {
                name: 'router-vendor',
                test: /node_modules[\\/](react-router-dom|react-router|@remix-run)[\\/]/,
                priority: 20,
              },
              {
                name: 'charts-vendor',
                test: /node_modules[\\/](recharts|d3-[^\\/]+)[\\/]/,
                priority: 15,
              },
              {
                name: 'vendor',
                test: /node_modules[\\/]/,
                priority: 1,
              },
            ],
          },
        },
      },
    },
  }
})
