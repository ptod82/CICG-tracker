import type { Plugin } from 'vite'
import { createHub } from './hub'

export function pledgeHub(): Plugin {
  const hub = createHub()

  return {
    name: 'pledge-hub',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        void hub.handle(req, res, next)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        void hub.handle(req, res, next)
      })
    },
  }
}
