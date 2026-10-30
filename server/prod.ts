import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { createHub } from './hub'

process.env.NODE_ENV = process.env.NODE_ENV || 'production'

const DIST = path.resolve('dist')
const PORT = Number(process.env.PORT || 4173)

const MIME: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

const hub = createHub()

function sendFile(res: http.ServerResponse, filePath: string): void {
  const ext = path.extname(filePath).toLowerCase()
  const headers: Record<string, string> = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
  }
  if (ext === '.html') headers['Cache-Control'] = 'no-store'
  res.writeHead(200, headers)
  fs.createReadStream(filePath).pipe(res)
}

const server = http.createServer((req, res) => {
  void hub.handle(req, res, () => {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0] || '/')
    const relative = urlPath === '/' ? '/index.html' : urlPath
    const filePath = path.normalize(path.join(DIST, relative))
    if (!filePath.startsWith(DIST)) {
      res.statusCode = 403
      res.end()
      return
    }
    fs.stat(filePath, (error, stats) => {
      if (!error && stats.isFile()) {
        sendFile(res, filePath)
        return
      }
      sendFile(res, path.join(DIST, 'index.html'))
    })
  })
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`CICG tracker ready on http://localhost:${PORT}`)
  console.log(`  TV display:     http://localhost:${PORT}/`)
  console.log(`  Operator panel: http://localhost:${PORT}/control`)
})
