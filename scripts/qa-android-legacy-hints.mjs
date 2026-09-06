/**
 * Android QA: legacy user migration + start-exploring without tour + hint dismiss.
 */
const list = await (await fetch('http://127.0.0.1:9223/json')).json()
const page = list.find((x) => x.title === 'Between Us' || (x.url || '').includes('localhost'))
const ws = new WebSocket(page.webSocketDebuggerUrl)
let id = 0
const pending = new Map()
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const i = ++id
    pending.set(i, { resolve, reject })
    ws.send(JSON.stringify({ id: i, method, params }))
    setTimeout(() => { if (pending.has(i)) { pending.delete(i); reject(new Error('timeout '+method)) } }, 15000)
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
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject) })
await send('Runtime.enable')
async function evalJson(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  return result.result.value
}

// Scenario A/B: simulate legacy completed user then reload app state via location reload
const legacy = await evalJson(`(() => {
  localStorage.clear()
  localStorage.setItem('hasCompletedOnboarding', 'true')
  localStorage.setItem('hasCompletedTutorial', 'true')
  location.reload()
  return true
})()`)
console.log('set legacy', legacy)
await new Promise((r) => setTimeout(r, 3500))
ws.close()

// reconnect after reload
const list2 = await (await fetch('http://127.0.0.1:9223/json')).json()
const page2 = list2.find((x) => x.title === 'Between Us' || (x.url || '').includes('localhost'))
const ws2 = new WebSocket(page2.webSocketDebuggerUrl)
let id2 = 0
const pending2 = new Map()
function send2(method, params = {}) {
  return new Promise((resolve, reject) => {
    const i = ++id2
    pending2.set(i, { resolve, reject })
    ws2.send(JSON.stringify({ id: i, method, params }))
    setTimeout(() => { if (pending2.has(i)) { pending2.delete(i); reject(new Error('timeout '+method)) } }, 15000)
  })
}
ws2.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data.toString())
  if (msg.id && pending2.has(msg.id)) {
    const { resolve, reject } = pending2.get(msg.id)
    pending2.delete(msg.id)
    if (msg.error) reject(new Error(JSON.stringify(msg.error)))
    else resolve(msg.result)
  }
})
await new Promise((resolve, reject) => { ws2.addEventListener('open', resolve); ws2.addEventListener('error', reject) })
await send2('Runtime.enable')
async function evalJson2(expression) {
  const result = await send2('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  return result.result.value
}

const afterLegacy = await evalJson2(`(() => {
  const body = document.body?.innerText || ''
  return {
    bodyPreview: body.slice(0, 500),
    hasWelcome: /Welcome to Between Us|Start exploring/i.test(body),
    hasHint: /Discover real conversations here/i.test(body),
    hasDiscover: /Trending|Discover/i.test(body) && !!document.querySelector('nav.sticky.bottom-0'),
    storage: {
      onboarding: localStorage.getItem('hasCompletedOnboarding'),
      tutorial: localStorage.getItem('hasCompletedTutorial'),
      seeded: localStorage.getItem('between_us_hints_seeded'),
      exp: localStorage.getItem('between_us_onboarding_experience_v'),
      hintDiscover: localStorage.getItem('between_us_hint_dismissed_discover'),
    },
    hasRaw: /tutorial\\.levels/.test(body),
  }
})()`)
console.log('LEGACY RESULT', JSON.stringify(afterLegacy, null, 2))

if (afterLegacy.hasWelcome) throw new Error('legacy user saw welcome')
if (afterLegacy.hasHint) throw new Error('legacy user saw contextual hint')
if (afterLegacy.storage.seeded !== 'legacy') throw new Error('expected seeded=legacy')
if (!afterLegacy.hasDiscover) throw new Error('legacy user did not enter app')
console.log('LEGACY MIGRATION ANDROID: PASS')

// Hint dismiss persistence for a v2 user path briefly
await evalJson2(`(() => {
  localStorage.clear()
  localStorage.setItem('hasCompletedOnboarding', 'true')
  localStorage.setItem('hasCompletedTutorial', 'true')
  localStorage.setItem('between_us_hints_seeded', 'v2')
  localStorage.setItem('between_us_onboarding_experience_v', '2')
  location.reload()
  return true
})()`)
await new Promise((r) => setTimeout(r, 3500))
ws2.close()

const list3 = await (await fetch('http://127.0.0.1:9223/json')).json()
const page3 = list3.find((x) => x.title === 'Between Us' || (x.url || '').includes('localhost'))
const ws3 = new WebSocket(page3.webSocketDebuggerUrl)
let id3 = 0
const pending3 = new Map()
function send3(method, params = {}) {
  return new Promise((resolve, reject) => {
    const i = ++id3
    pending3.set(i, { resolve, reject })
    ws3.send(JSON.stringify({ id: i, method, params }))
    setTimeout(() => { if (pending3.has(i)) { pending3.delete(i); reject(new Error('timeout '+method)) } }, 15000)
  })
}
ws3.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data.toString())
  if (msg.id && pending3.has(msg.id)) {
    const { resolve, reject } = pending3.get(msg.id)
    pending3.delete(msg.id)
    if (msg.error) reject(new Error(JSON.stringify(msg.error)))
    else resolve(msg.result)
  }
})
await new Promise((resolve, reject) => { ws3.addEventListener('open', resolve); ws3.addEventListener('error', reject) })
await send3('Runtime.enable')
async function evalJson3(expression) {
  const result = await send3('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  return result.result.value
}

const withHint = await evalJson3(`(() => {
  const body = document.body?.innerText || ''
  const dismiss = [...document.querySelectorAll('button')].find((b) => /dismiss tip/i.test(b.getAttribute('aria-label') || b.innerText || ''))
  const before = /Discover real conversations here/i.test(body)
  if (dismiss) dismiss.click()
  return {
    before,
    afterClickStorage: localStorage.getItem('between_us_hint_dismissed_discover'),
  }
})()`)
console.log('HINT DISMISS', withHint)
await new Promise((r) => setTimeout(r, 400))
const afterDismiss = await evalJson3(`(() => ({
  stillVisible: /Discover real conversations here/i.test(document.body?.innerText || ''),
  storage: localStorage.getItem('between_us_hint_dismissed_discover'),
}))()`)
console.log('AFTER DISMISS', afterDismiss)
if (withHint.before && afterDismiss.stillVisible) throw new Error('hint still visible after dismiss')
if (withHint.before && afterDismiss.storage !== 'true') throw new Error('dismiss not persisted')
console.log('HINT DISMISS ANDROID: PASS')
ws3.close()
