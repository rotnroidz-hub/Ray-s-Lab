import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = process.env.EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9226
const BASE = process.env.BASE || 'http://localhost:4173'

const profile = mkdtempSync(join(tmpdir(), 'edge-cdp4-'))
let edge = spawn(EDGE, [
  '--headless=new', '--disable-gpu',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + profile,
  '--no-first-run', '--no-default-browser-check',
  '--remote-allow-origins=*',
  'about:blank',
], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function waitFor(tries, fn) {
  for (let i = 0; i < tries; i++) {
    try { const v = await fn(); if (v) return v } catch {}
    await sleep(250)
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
  const logs = []
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return }
    if (msg.method === 'Runtime.consoleAPICalled') {
      const t = msg.params.type
      const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ')
      if (t === 'error') logs.push('[error] ' + text.slice(0, 300))
    }
    if (msg.method === 'Runtime.exceptionThrown') logs.push('[exception] ' + JSON.stringify(msg.params.exceptionDetails).slice(0, 500))
  }
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Network.enable')
  await send('Network.emulateNetworkConditions', { offline: false, latency: 300, downloadThroughput: 1200000, uploadThroughput: 600000 })

  const snap = async (label) => {
    const s = await evalJs(`(() => {
      const main = document.querySelector('main')
      const h = document.querySelector('h1, h2')
      return {
        path: location.pathname,
        busy: !!document.querySelector('[aria-busy]'),
        len: (main ? main.innerText.length : 0),
        h1: h ? h.innerText : null,
        skeleton: document.querySelectorAll('[class*="animate-pulse"]').length,
      }
    })()`)
    console.log(label, JSON.stringify(s))
  }

  const waitAnchor = (href) => waitFor(40, () => evalJs(`!!document.querySelector('a[href="${href}"]')`))
  const clickLink = async (href) => evalJs(`document.querySelector('a[href="${href}"]').click()`)

  // everything must actually render (no blank during client-side nav)
  const track = async (href, label, expect) => {
    const has = await waitAnchor(href)
    if (!has) { console.log(label, 'NO ANCHOR FOUND'); return false }
    // poll during and after the click to catch transient blanks
    const trail = []
    await clickLink(href)
    let settled = false
    for (let i = 0; i < 60 && !settled; i++) {
      await sleep(200)
      const s = await evalJs(`(() => { const m = document.querySelector('main'); const h = document.querySelector('h1, h2'); return { p: location.pathname, len: m ? m.innerText.length : 0, h: h ? h.innerText : null } })()`)
      trail.push(s)
      if (s.p.endsWith(expect) && s.len > 0) settled = true
    }
    const final = trail[trail.length - 1]
    console.log(label, 'settled=' + settled, 'final:', JSON.stringify(final))
    const blankFrames = trail.filter((s) => s.len === 0).length
    console.log('   blank frames during transition:', blankFrames)
    return settled
  }

  await waitFor(60, () => evalJs(`!!document.querySelector('a[href="/category/wearables"]')`))
  await snap('HOME ready')

  await track('/category/wearables', '-> /category/wearables', '/category/wearables')
  await track('/category/audio', '   -> /category/audio (param change)', '/category/audio')
  await snap('   audio page')
  const hasAria = await evalJs(`document.body.innerText.includes('Aria')`)
  console.log('   audio shows Aria:', hasAria)

  await track('/product/pulse-portable-speaker', '-> /product/pulse', '/product/pulse-portable-speaker')
  await track('/product/aria-wireless-headphones', '   -> /product/aria (param change)', '/product/aria-wireless-headphones')
  const hasAria2 = await evalJs(`document.body.innerText.includes('Aria Wireless')`)
  console.log('   product switch shows Aria:', hasAria2)

  console.log('\n=== console errors ===')
  console.log(logs.length ? logs.join('\n') : '(none)')
  ws.close(); edge.kill(); process.exit(0)
}

main().catch((e) => { console.error('ERR', e); edge.kill(); process.exit(1) })