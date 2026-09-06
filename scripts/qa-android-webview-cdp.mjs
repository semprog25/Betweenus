const list = await (await fetch('http://127.0.0.1:9223/json')).json()
const page = list.find((x) => x.title === 'Between Us' || (x.url || '').includes('localhost'))
if (!page) {
  console.error('Between Us page not found', list.map((x) => x.title))
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
    }, 15000)
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

const expression = `(() => {
  const body = document.body?.innerText || ''
  const hasRaw = /tutorial\\.(levels|back|checkin|share|next)/.test(body)
  return {
    title: document.title,
    hasRaw,
    bodyPreview: body.slice(0, 1200),
    storage: {
      onboarding: localStorage.getItem('hasCompletedOnboarding'),
      tutorial: localStorage.getItem('hasCompletedTutorial'),
      seeded: localStorage.getItem('between_us_hints_seeded'),
      exp: localStorage.getItem('between_us_onboarding_experience_v'),
    },
    hasStickyBottomNav: !!document.querySelector('nav.sticky.bottom-0'),
    buttons: [...document.querySelectorAll('button')].map((b) => (b.innerText || b.getAttribute('aria-label') || '').trim()).filter(Boolean).slice(0, 25),
    headings: [...document.querySelectorAll('h1,h2')].map((h) => h.innerText.trim()).slice(0, 10),
  }
})()`

const result = await send('Runtime.evaluate', {
  expression,
  returnByValue: true,
  awaitPromise: true,
})

console.log(JSON.stringify(result.result.value, null, 2))
ws.close()
