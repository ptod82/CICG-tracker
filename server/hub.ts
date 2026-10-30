import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'

type Pledge = {
  id: string
  countryCode: string
  countryName: string
  shortName: string
  amountMillion: number
  at: number
}

type TrackerSnapshot = {
  startMillion: number
  targetMillion: number
  pledges: Pledge[]
}

type ServerMessage =
  | { type: 'state'; snapshot: TrackerSnapshot }
  | { type: 'pledge'; pledge: Pledge; snapshot: TrackerSnapshot }
  | { type: 'reset'; snapshot: TrackerSnapshot }

const STATE_FILE = path.resolve('data/state.json')
const PIN_FILE = path.resolve('data/pin.txt')
const COOKIE_NAME = 'cicg_op'

const initialSnapshot = (): TrackerSnapshot => ({
  startMillion: 135,
  targetMillion: 600,
  pledges: [],
})

function readState(): TrackerSnapshot {
  try {
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) as TrackerSnapshot
    if (
      typeof parsed.startMillion === 'number' &&
      typeof parsed.targetMillion === 'number' &&
      Array.isArray(parsed.pledges)
    ) {
      return parsed
    }
  } catch {
    /* first run */
  }
  return initialSnapshot()
}

function writeState(snapshot: TrackerSnapshot): void {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true })
  fs.writeFileSync(STATE_FILE, JSON.stringify(snapshot, null, 2))
}

function resolvePin(): string {
  if (process.env.CONTROL_PIN) return process.env.CONTROL_PIN
  if (process.env.NODE_ENV !== 'production') return ''
  try {
    const existing = fs.readFileSync(PIN_FILE, 'utf8').trim()
    if (existing) return existing
  } catch {
    /* generate a pin for this deployment */
  }
  const generated = String(Math.floor(100000 + Math.random() * 900000))
  fs.mkdirSync(path.dirname(PIN_FILE), { recursive: true })
  fs.writeFileSync(PIN_FILE, generated)
  console.log(`\n  Operator PIN: ${generated}\n  Open /control and enter this PIN.\n`)
  return generated
}

function pinToken(pin: string): string {
  return createHash('sha256').update(`cicg-tracker:${pin}`).digest('hex')
}

function parseCookies(header?: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key) out[key] = decodeURIComponent(rest.join('='))
  }
  return out
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(chunk as Buffer))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export function createHub(options: { persistPin?: boolean } = {}) {
  let snapshot = readState()
  const clients = new Set<ServerResponse>()
  const pin = options.persistPin ? resolvePin() : process.env.CONTROL_PIN || ''
  const expectedToken = pin ? pinToken(pin) : ''

  const persist = (next: TrackerSnapshot) => {
    snapshot = next
    writeState(next)
  }

  const broadcast = (message: ServerMessage) => {
    const payload = `data: ${JSON.stringify(message)}\n\n`
    for (const client of clients) {
      client.write(payload)
    }
  }

  setInterval(() => {
    for (const client of clients) {
      client.write(': ping\n\n')
    }
  }, 20000).unref()

  const isUnlocked = (req: IncomingMessage) => {
    if (!pin) return true
    return parseCookies(req.headers.cookie)[COOKIE_NAME] === expectedToken
  }

  const handle = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const url = req.url?.split('?')[0] ?? ''
    if (url === '/health') {
      sendJson(res, 200, { ok: true })
      return
    }
    if (!url.startsWith('/api/')) {
      next()
      return
    }

    if (url === '/api/auth' && req.method === 'GET') {
      sendJson(res, 200, { pinRequired: Boolean(pin), unlocked: isUnlocked(req) })
      return
    }

    if (url === '/api/unlock' && req.method === 'POST') {
      const body = JSON.parse((await readBody(req)) || '{}') as { pin?: string }
      if (!pin || body.pin === pin) {
        const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''
        res.setHeader(
          'Set-Cookie',
          `${COOKIE_NAME}=${expectedToken || 'open'}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${secure}`,
        )
        sendJson(res, 200, { ok: true })
        return
      }
      sendJson(res, 401, { error: 'Wrong PIN' })
      return
    }

    if (url === '/api/state' && req.method === 'GET') {
      sendJson(res, 200, snapshot)
      return
    }

    if (url === '/api/stream' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      })
      res.write(`data: ${JSON.stringify({ type: 'state', snapshot } satisfies ServerMessage)}\n\n`)
      clients.add(res)
      req.on('close', () => {
        clients.delete(res)
      })
      return
    }

    if (!isUnlocked(req)) {
      sendJson(res, 401, { error: 'Unlock the operator console first' })
      return
    }

    if (url === '/api/pledges' && req.method === 'POST') {
      const body = JSON.parse(await readBody(req)) as {
        countryCode: string
        countryName: string
        shortName: string
        amountMillion: number
      }
      const amount = Number(body.amountMillion)
      if (!body.countryCode || !body.countryName || !Number.isFinite(amount) || amount <= 0) {
        sendJson(res, 400, { error: 'Invalid pledge' })
        return
      }
      const pledge: Pledge = {
        id: crypto.randomUUID(),
        countryCode: body.countryCode,
        countryName: body.countryName,
        shortName: body.shortName || body.countryName,
        amountMillion: amount,
        at: Date.now(),
      }
      persist({ ...snapshot, pledges: [...snapshot.pledges, pledge] })
      const message: ServerMessage = { type: 'pledge', pledge, snapshot }
      broadcast(message)
      sendJson(res, 200, message)
      return
    }

    if (url === '/api/undo' && req.method === 'POST') {
      persist({ ...snapshot, pledges: snapshot.pledges.slice(0, -1) })
      const message: ServerMessage = { type: 'reset', snapshot }
      broadcast(message)
      sendJson(res, 200, message)
      return
    }

    if (url === '/api/reset' && req.method === 'POST') {
      persist({ ...snapshot, pledges: [] })
      const message: ServerMessage = { type: 'reset', snapshot }
      broadcast(message)
      sendJson(res, 200, message)
      return
    }

    if (url === '/api/settings' && req.method === 'POST') {
      const body = JSON.parse(await readBody(req)) as {
        startMillion?: number
        targetMillion?: number
      }
      const startMillion =
        typeof body.startMillion === 'number' && Number.isFinite(body.startMillion)
          ? body.startMillion
          : snapshot.startMillion
      const targetMillion =
        typeof body.targetMillion === 'number' && Number.isFinite(body.targetMillion)
          ? body.targetMillion
          : snapshot.targetMillion
      persist({ ...snapshot, startMillion, targetMillion })
      const message: ServerMessage = { type: 'state', snapshot }
      broadcast(message)
      sendJson(res, 200, message)
      return
    }

    sendJson(res, 404, { error: 'Not found' })
  }

  return { handle, pinRequired: Boolean(pin) }
}
