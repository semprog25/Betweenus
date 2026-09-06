/**
 * Smoke tests for onboarding migration contracts.
 * Keep in sync with src/utils/onboarding-state.ts
 * Run: node scripts/test-onboarding-state.mjs
 */

import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
}

const TUTORIAL_COMPLETED_KEY = 'hasCompletedTutorial'
const ONBOARDING_EXPERIENCE_VERSION_KEY = 'between_us_onboarding_experience_v'
const HINTS_SEEDED_KEY = 'between_us_hints_seeded'
const CURRENT = '2'
const IDS = ['discover', 'share', 'checkin', 'community']
const hintKey = (id) => `between_us_hint_dismissed_${id}`

function dismissAll() {
  for (const id of IDS) localStorage.setItem(hintKey(id), 'true')
}

function seedOnboardingMigration() {
  if (localStorage.getItem(HINTS_SEEDED_KEY)) return
  if (localStorage.getItem(TUTORIAL_COMPLETED_KEY) !== 'true') return
  dismissAll()
  localStorage.setItem(HINTS_SEEDED_KEY, 'legacy')
  if (!localStorage.getItem(ONBOARDING_EXPERIENCE_VERSION_KEY)) {
    localStorage.setItem(ONBOARDING_EXPERIENCE_VERSION_KEY, '1')
  }
}

function markTutorialCompleted({ enableContextualHints } = {}) {
  localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true')
  localStorage.setItem(ONBOARDING_EXPERIENCE_VERSION_KEY, CURRENT)
  if (enableContextualHints === false) return
  if (localStorage.getItem(HINTS_SEEDED_KEY) !== 'legacy') {
    localStorage.setItem(HINTS_SEEDED_KEY, 'v2')
  }
}

function shouldShowContextualHints() {
  seedOnboardingMigration()
  return localStorage.getItem(HINTS_SEEDED_KEY) === 'v2'
}

function reset() {
  store.clear()
}

function assertSourceContracts() {
  const src = fs.readFileSync(path.join(root, 'src/utils/onboarding-state.ts'), 'utf8')
  assert.match(src, /HINTS_SEEDED_KEY = 'between_us_hints_seeded'/)
  assert.match(src, /CURRENT_ONBOARDING_EXPERIENCE_VERSION = '2'/)
  assert.match(src, /hadTutorial/)
  assert.match(src, /!== 'legacy'/)

  const tutorial = fs.readFileSync(path.join(root, 'src/components/Tutorial.tsx'), 'utf8')
  assert.match(tutorial, /Start exploring|welcome\.cta\.start/)
  assert.match(tutorial, /How it works|welcome\.cta\.howItWorks/)
  assert.doesNotMatch(tutorial, /tutorial\.levels\.title/)

  const en = fs.readFileSync(path.join(root, 'src/components/LanguageContext.tsx'), 'utf8')
  assert.match(en, /'tutorial\.levels\.title':/)
  assert.match(en, /'tutorial\.back':/)
  assert.match(en, /'welcome\.title':/)
  assert.match(en, /'hint\.discover':/)
}

function main() {
  assertSourceContracts()

  reset()
  localStorage.setItem('hasCompletedTutorial', 'true')
  localStorage.setItem('hasCompletedOnboarding', 'true')
  seedOnboardingMigration()
  assert.equal(localStorage.getItem('between_us_hints_seeded'), 'legacy')
  assert.equal(shouldShowContextualHints(), false)
  assert.equal(localStorage.getItem(hintKey('discover')), 'true')

  reset()
  localStorage.setItem('hasCompletedOnboarding', 'true')
  seedOnboardingMigration()
  assert.equal(localStorage.getItem('between_us_hints_seeded'), null)
  markTutorialCompleted({ enableContextualHints: true })
  assert.equal(localStorage.getItem('between_us_hints_seeded'), 'v2')
  assert.equal(shouldShowContextualHints(), true)

  reset()
  markTutorialCompleted({ enableContextualHints: true })
  assert.equal(shouldShowContextualHints(), true)

  reset()
  localStorage.setItem('hasCompletedTutorial', 'true')
  seedOnboardingMigration()
  markTutorialCompleted({ enableContextualHints: true })
  assert.equal(localStorage.getItem('between_us_hints_seeded'), 'legacy')
  assert.equal(shouldShowContextualHints(), false)

  console.log('onboarding-state tests: OK')
}

main()
