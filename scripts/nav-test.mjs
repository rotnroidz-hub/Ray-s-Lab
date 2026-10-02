import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const EDGE = process.env.EDGE || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9224
const BASE = 'http://localhost:5173'

const profile = mkdtempSync(join(tmpdir(), 'edge-cdp2-'))
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
  throw new Error('timeout')
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
    if (msg.method === 'Runtime.consoleAPICalled') {
      const type = msg.params.type
      const text = (msg.params.args || []).map((a) => a.value ?? a.description ?? '').join(' ')
      if (type === 'error' || type === 'warning') consoleLogs.push('[' + type + '] ' + text.slice(0, 300))
    }
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

  const clickHref = async (selector, href) => {
    // Wait until the anchor actually exists (page may still be loading under
    // throttled network conditions) before clicking it.
    await waitFor(30, () => evalJs(`!!document.querySelector('${selector}[href="${href}"]')`))
    return evalJs(`(() => { const a = [...document.querySelectorAll('${selector}')].find(x => x.getAttribute('href') === '${href}'); if (a) { a.click(); return true } return false })()`)
  }

  const state = async (label) => {
    const s = await evalJs(`(() => ({ path: location.pathname + location.search, bodyLen: document.body.innerText.length, hasRoot: !!document.getElementById('root')?.children.length, loader: !!document.querySelector('[aria-busy]'), mainText: (document.querySelector('main')?.innerText || '').slice(0, 60).replace(/\\n/g, ' | ') }))()`)
    console.log(label, JSON.stringify(s))
  }

  // warm home
  await sleep(3000)
  await state('WARM home')

  // category -> category (same route, param change)
  await clickHref('a[href]', '/category/creatine')
  await sleep(1800)
  await state('1) category/creatine')
  const body1 = await evalJs('document.body.innerText')

  await clickHref('a[href]', '/category/supplement')
  await sleep(1800)
  await state('2) category/supplement (param change)')
  const body2 = await evalJs('document.body.innerText')
  console.log('  supplement page shows products:', body2.includes('Myprotein'))
  console.log('  supplement page shows creatine products (STALE?):', body2.includes('Optimum Nutrition Micronized Creatine Powder') && !body2.includes('Myprotein'))

  // product -> product (same route, param change)
  await clickHref('a[href]', '/product/100-whey-gold-standard-optimum-nutrition')
  await sleep(1800)
  await state('3) product/100-whey')
  const body3 = await evalJs('document.body.innerText')
  await clickHref('a[href]', '/product/myprotein-impact-whey-protein')
  await sleep(1800)
  await state('4) product/myprotein-impact-whey (param change)')
  const body4 = await evalJs('document.body.innerText')
  console.log('  product switch shows Myprotein:', body4.includes('Myprotein'))

  // fast double navigation: rapidly click supplement then creatine
  await clickHref('a[href]', '/category/supplement')
  await clickHref('a[href]', '/category/creatine')
  await sleep(2500)
  await state('5) rapid nav to creatine')
  const body5 = await evalJs('document.body.innerText')
  console.log('  creatine final shows products:', body5.includes('available') || body5.includes('Myprotein Impact Whey Protein') || body5.includes('100% Whey Gold Standard Optimum Nutrition') || body5.includes('Optimum Nutrition Micronized Creatine Powder'))

  console.log('\n=== console errors/warnings ===')
  console.log(consoleLogs.length ? consoleLogs.join('\n') : '(none)')

  ws.close()
  edge.kill()
  process.exit(0)
}

main().catch((e) => { console.error('ERR', e); edge.kill(); process.exit(1) })