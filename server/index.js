import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const PORT = Number(process.env.PORT || 3000)

// For true persistence on Railway, mount a volume and set ATLAS_DATA_DIR=/data.
// We default to /data in production if ATLAS_DATA_DIR isn't provided.
const dataDir = process.env.ATLAS_DATA_DIR
  ? path.resolve(process.env.ATLAS_DATA_DIR)
  : (process.env.NODE_ENV === 'production' ? '/data' : path.join(projectRoot, 'data'))
const layoutFile = process.env.ATLAS_LAYOUT_FILE
  ? path.resolve(process.env.ATLAS_LAYOUT_FILE)
  : path.join(dataDir, 'layout.json')

const ADMIN_PASSWORD = process.env.ATLAS_ADMIN_PASSWORD || ''

function timingSafeEqualStr(a, b) {
  const aBuf = Buffer.from(String(a))
  const bBuf = Buffer.from(String(b))
  if (aBuf.length !== bBuf.length) return false
  return crypto.timingSafeEqual(aBuf, bBuf)
}

async function readLayout() {
  try {
    const raw = await fs.readFile(layoutFile, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    if (e?.code === 'ENOENT') return null
    throw e
  }
}

async function writeLayout(data) {
  await fs.mkdir(path.dirname(layoutFile), { recursive: true })
  const tmp = `${layoutFile}.tmp`
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8')
  await fs.rename(tmp, layoutFile)
}

function validatePositions(positions) {
  if (!positions || typeof positions !== 'object' || Array.isArray(positions)) return false
  const entries = Object.entries(positions)
  if (entries.length > 2000) return false
  for (const [, p] of entries) {
    if (!p || typeof p !== 'object') return false
    const { x, y, z } = p
    if (![x, y, z].every((n) => typeof n === 'number' && Number.isFinite(n))) return false
  }
  return true
}

function createApp(distDir) {
  const app = express()
  app.use(express.json({ limit: '3mb' }))

  app.get('/api/layout', async (req, res) => {
    try {
      const existing = await readLayout()
      if (!existing?.positions) return res.status(404).json({ ok: false })
      return res.json(existing)
    } catch (e) {
      return res.status(500).json({ ok: false, error: 'failed_to_read_layout' })
    }
  })

  app.post('/api/layout', async (req, res) => {
    const provided = req.header('x-atlas-admin-password') || ''
    if (!ADMIN_PASSWORD || !timingSafeEqualStr(provided, ADMIN_PASSWORD)) {
      return res.status(401).send('Unauthorized')
    }

    const positions = req.body?.positions
    if (!validatePositions(positions)) {
      return res.status(400).send('Invalid positions')
    }

    try {
      await writeLayout({ positions, updatedAt: new Date().toISOString() })
      return res.json({ ok: true })
    } catch (e) {
      return res.status(500).send('Failed to save')
    }
  })

  app.use(express.static(distDir))

  // SPA fallback: only for app routes; don't return HTML for asset paths (so 404s are visible)
  app.get('*', (req, res, next) => {
    const p = req.path
    if (p.startsWith('/assets/') || (p.includes('.') && !p.endsWith('.html'))) {
      return res.status(404).send('Not found')
    }
    res.sendFile(path.join(distDir, 'index.html'), (err) => {
      if (err) next(err)
    })
  })

  return app
}

async function start() {
  const candidates = [
    path.join(projectRoot, 'dist'),
    path.join(process.cwd(), 'dist')
  ]
  let distDir = null
  for (const dir of candidates) {
    try {
      await fs.access(path.join(dir, 'index.html'))
      distDir = dir
      break
    } catch {
      continue
    }
  }
  if (!distDir) {
    // eslint-disable-next-line no-console
    console.error('Build output missing: no dist/index.html at', candidates.join(' or '))
    process.exit(1)
  }
  // eslint-disable-next-line no-console
  console.log(`Serving static from ${distDir}`)

  const app = createApp(distDir)
  app.listen(PORT, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`Atlas server listening on :${PORT}`)
  })
}

start()

