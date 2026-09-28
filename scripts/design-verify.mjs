import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = process.env.EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9230
const BASE = 'http://localhost:4173'

const profile = mkdtempSync(join(tmpdir(), 'edge-cdp6-'))
let edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check', '--remote-allow-origins=*', 'about:blank'], { stdio: 'ignore' })

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
  const consoleLogs = []
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return }
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleLogs.push('[exception] ' + JSON.stringify(msg.params.exceptionDetails).slice(0, 400))
    }
  }
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })
  const evalJs = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })
    return r.result?.result?.value
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Network.enable')
  await send('Network.emulateNetworkConditions', { offline: false, latency: 350, downloadThroughput: 1500000, uploadThroughput: 800000 })

  const clickHref = async (href) => {
    await waitFor(30, () => evalJs(`!!document.querySelector('a[href="${href}"]')`))
    return evalJs(`(() => { const a = [...document.querySelectorAll('a[href]')].find(x => x.getAttribute('href') === '${href}'); if (a) { a.click(); return true } return false })()`)
  }
  const headInfo = () => evalJs(`(() => ({
    title: document.title,
    desc: document.querySelector('meta[name="description"]')?.content,
    ogTitle: document.querySelector('meta[property="og:title"]')?.content,
    ogSite: document.querySelector('meta[property="og:site_name"]')?.content,
    ogType: document.querySelector('meta[property="og:type"]')?.content,
    twitterCard: document.querySelector('meta[name="twitter:card"]')?.content,
    canonical: document.querySelector('link[rel="canonical"]')?.href,
  }))()`)

  // Warm home and dump SEO head
  await sleep(3500)
  console.log('SEO @ /', JSON.stringify(await headInfo(), null, 1))
  console.log('grain overlay present:', await evalJs(`(() => { const el = document.querySelector('.tex-grain'); return !!el && getComputedStyle(el).backgroundImage.includes('svg') })()`))
  console.log('banner carousel present:', await evalJs(`!!document.querySelector('section[aria-roledescription="carousel"] img')`))

  // Category page (brandless DB should still load fine)
  await clickHref('/category/audio')
  await sleep(3000)
  console.log('\nSEO @ /category/audio', JSON.stringify(await headInfo(), null, 1))
  console.log('category has products:', await evalJs(`document.body.innerText.includes('Aria Wireless Headphones')`))
  console.log('category has Explore more section:', await evalJs(`document.body.innerText.includes('Explore more categories')`))

  // Brand page on brand-less DB -> brand not found but page must not crash
  const brandResult = await evalJs(`(async () => { const r = await fetch('/brand/jbl'); const txt = await r.text(); return { status: r.status, hasRoot: txt.includes('id="root"') } })()`)
  console.log('\n/brand/jbl SSR-ish fetch:', JSON.stringify(brandResult))

  // Catalog page brand facet row should gracefully hide
  await evalJs(`history.pushState({}, '', '/catalog')`)
  await send('Page.reload', { ignoreCache: true })
  await sleep(3000)
  console.log('\nSEO @ /catalog', JSON.stringify(await headInfo(), null, 1))
  console.log('catalog has Brand facet row:', await evalJs(`!!document.querySelector('[role="group"][aria-label="Brand"]')`))
  console.log('catalog brand row shows only "All" (pre-migration):', await evalJs(`(() => { const g = document.querySelector('[role="group"][aria-label="Brand"]'); return g ? [...g.querySelectorAll('button')].map(b => b.innerText).join(',') : null })()`))

  // SEO @ /catalog product
  await clickHref('/product/pulse-portable-speaker')
  await sleep(3000)
  console.log('\nSEO @ /product/pulse', JSON.stringify(await headInfo(), null, 1))

  console.log('\n=== console errors ===')
  console.log(consoleLogs.length ? consoleLogs.join('\n') : '(none)')
  ws.close(); edge.kill(); process.exit(0)
}
main().catch((e) => { console.error('ERR', e); edge.kill(); process.exit(1) })