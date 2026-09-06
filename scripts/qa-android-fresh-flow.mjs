/**
 * Drive Android WebView fresh-user onboarding via CDP.
 * Prerequisites: app running, webview debug port forwarded to 9223.
 */

const list = await (await fetch('http://127.0.0.1:9223/json')).json()
const page = list.find((x) => x.title === 'Between Us' || (x.url || '').includes('localhost'))
if (!page) {
  console.error('page not found')
  process.exit(1)
}

const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const pending = new Map()

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const i = ++id
    pending.set(i, { resolve, reject })
    ws.send(JSON.stringify({ id: i, method, params }))
    setTimeout(() => {
      if (pending.has(i)) {
        pending.delete(i)
        reject(new Error('timeout ' + method))
      }
    }, 20000)
  })
}

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data.toString())
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id)
    pending.delete(msg.id)
    if (msg.error) reject(new Error(JSON.stringify(msg.error)))
    else resolve(msg.result)
  }
})

await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve)
  ws.addEventListener('error', reject)
})

await send('Runtime.enable')

async function evalJson(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  })
  return result.result.value
}

async function snapshot(label) {
  const data = await evalJson(`(() => {
    const body = document.body?.innerText || ''
    return {
      label: ${JSON.stringify(label)},
      hasRaw: /tutorial\\.(levels|back|checkin|share)/.test(body),
      bodyPreview: body.slice(0, 900),
      storage: {
        onboarding: localStorage.getItem('hasCompletedOnboarding'),
        tutorial: localStorage.getItem('hasCompletedTutorial'),
        seeded: localStorage.getItem('between_us_hints_seeded'),
        exp: localStorage.getItem('between_us_onboarding_experience_v'),
        hintDiscover: localStorage.getItem('between_us_hint_dismissed_discover'),
      },
      progress: (body.match(/(\\d)\\s*\\/\\s*(\\d)/) || []).slice(1),
      buttons: [...document.querySelectorAll('button')].map((b) => (b.innerText || b.getAttribute('aria-label') || '').trim().replace(/\\s+/g,' ')).filter(Boolean).slice(0, 20),
      headings: [...document.querySelectorAll('h1,h2')].map((h) => h.innerText.trim()).slice(0, 8),
      hasStickyBottomNav: !!document.querySelector('nav.sticky.bottom-0'),
      hasDiscoverFilters: /Trending|New|Hot|Random/i.test(body),
      hasWelcome: /Welcome to Between Us|Start exploring|How it works/i.test(body),
      hasHint: /Discover real conversations here/i.test(body),
    }
  })()`)
  console.log(JSON.stringify(data, null, 2))
  return data
}

async function clickButtonMatching(reSource) {
  const clicked = await evalJson(`(() => {
    const re = new RegExp(${JSON.stringify(reSource)}, 'i')
    const buttons = [...document.querySelectorAll('button')]
    const btn = buttons.find((b) => {
      const label = ((b.innerText || '') + ' ' + (b.getAttribute('aria-label') || '')).replace(/\\s+/g, ' ').trim()
      return re.test(label)
    })
    if (!btn) return { ok: false, available: buttons.map((b) => (b.innerText || '').trim().replace(/\\s+/g,' ').slice(0,40)) }
    if (btn.disabled) return { ok: false, disabled: true, text: (btn.innerText || '').trim() }
    btn.click()
    return { ok: true, text: (btn.innerText || btn.getAttribute('aria-label') || '').trim().slice(0,80) }
  })()`)
  console.log('click', clicked)
  if (!clicked.ok) throw new Error('button not found for ' + reSource)
  await new Promise((r) => setTimeout(r, 700))
}

console.log('=== STEP: language ===')
await snapshot('language-start')
await clickButtonMatching('English')
await clickButtonMatching('^Next$')

console.log('=== STEP: name ===')
await snapshot('name')
// skip name / continue
await clickButtonMatching('^Next$')

console.log('=== STEP: auth ===')
await snapshot('auth')
// Prefer skip if available
const skip = await evalJson(`(() => {
  const buttons = [...document.querySelectorAll('button,a')]
  const btn = buttons.find((b) => /skip|continue without|later/i.test(b.innerText || ''))
  if (!btn) return { ok: false, available: buttons.map((b) => (b.innerText || '').trim().slice(0,60)).filter(Boolean).slice(0,25) }
  btn.click()
  return { ok: true, text: btn.innerText.trim().slice(0,80) }
})()`)
console.log('auth skip attempt', skip)
await new Promise((r) => setTimeout(r, 900))
await snapshot('after-auth')

console.log('=== STEP: welcome ===')
await snapshot('welcome')
const welcomeState = await evalJson(`(() => ({
  hasHow: /How it works/i.test(document.body.innerText),
  hasStart: /Start exploring/i.test(document.body.innerText),
  tourStepsVisible: false,
}))()`)
console.log('welcome flags', welcomeState)

if (welcomeState.hasHow) {
  await clickButtonMatching('How it works')
  await snapshot('tour-1')
  await clickButtonMatching('^Next$|^Weiter$|^Siguiente$')
  await snapshot('tour-2')
  // back then next
  await clickButtonMatching('^Back$|^Atrás$|^Zurück$')
  await snapshot('tour-back')
  await clickButtonMatching('^Next$')
  await snapshot('tour-2-again')
  await clickButtonMatching('^Next$')
  await snapshot('tour-3')
  await clickButtonMatching('Start exploring|Get Started|Jetzt entdecken|Empezar')
} else if (welcomeState.hasStart) {
  await clickButtonMatching('Start exploring')
}

await new Promise((r) => setTimeout(r, 1000))
console.log('=== STEP: discover ===')
const final = await snapshot('discover')
ws.close()

if (final.hasRaw) {
  console.error('FAIL: raw translation keys visible')
  process.exit(1)
}
if (!final.storage.onboarding || final.storage.onboarding !== 'true') {
  console.error('FAIL: onboarding not completed')
  process.exit(1)
}
if (!final.storage.tutorial || final.storage.tutorial !== 'true') {
  console.error('FAIL: tutorial/welcome not completed')
  process.exit(1)
}
if (final.storage.seeded !== 'v2') {
  console.error('FAIL: expected seeded=v2 for new user, got', final.storage.seeded)
  process.exit(1)
}
if (!final.hasStickyBottomNav && !final.hasDiscoverFilters) {
  console.error('FAIL: did not reach main app discover')
  process.exit(1)
}
console.log('ANDROID FRESH FLOW: PASS')
