import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = process.env.EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9227
const BASE = 'http://localhost:4173'

const profile = mkdtempSync(join(tmpdir(), 'edge-cdp5-'))
let edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check', '--remote-allow-origins=*', 'about:blank'], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function waitFor(tries, fn) {
  for (let i = 0; i < tries; i++) {
    try { const v = await fn(); if (v) return v } catch {}
    await sleep(300)
  }
  return null
}

async function main() {
  await waitFor(40, async () => (await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok)
  const tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?${encodeURIComponent(BASE + '/')}`, { method: 'PUT' })).json()
  const ws = new WebSocket(tab.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
  let id = 0
  const pending = new Map()
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) } }
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Network.enable')
  await send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: 1200000, uploadThroughput: 600000 })

  const clickHref = (href) => evalJs(`(() => { const a = [...document.querySelectorAll('a[href]')].find(x => x.getAttribute('href') === '${href}'); if (!a) return false; a.click(); return true })()`)
  const waitAnchor = (href) => waitFor(40, () => evalJs(`!!document.querySelector('a[href="${href}"]')`))
  const bodyHas = (t) => evalJs(`document.body.innerText.includes('${t}')`)
  const skeletonCount = () => evalJs(`document.querySelectorAll('[class*="animate-pulse"]').length`)

  await waitAnchor('/category/wearables')
  await clickHref('/category/wearables')
  await sleep(4000)
  console.log('wearables page has Ridge (product):', await bodyHas('Ridge Smart Watch'), '| skeleton:', await skeletonCount())

  await clickHref('/category/audio')
  await sleep(4000)
  console.log('audio page has Aria (product):', await bodyHas('Aria Wireless Headphones'), '| has Ridge (correctly gone):', !(await bodyHas('Ridge Smart Watch')), '| skeleton:', await skeletonCount())

  await clickHref('/product/pulse-portable-speaker')
  await sleep(4000)
  console.log('product pulse body:', await evalJs(`document.querySelector('h1')?.innerText`))

  await clickHref('/product/aria-wireless-headphones')
  await sleep(4000)
  console.log('product aria body:', await evalJs(`document.querySelector('h1')?.innerText`))

  ws.close(); edge.kill(); process.exit(0)
}
main().catch((e) => { console.error('ERR', e); edge.kill(); process.exit(1) })