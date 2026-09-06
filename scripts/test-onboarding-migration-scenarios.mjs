/**
 * Explicit migration scenarios A–E for onboarding QA.
 * Run: node scripts/test-onboarding-migration-scenarios.mjs
 */

import assert from 'node:assert/strict'

const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
}

const ONBOARDING = 'hasCompletedOnboarding'
const TUTORIAL = 'hasCompletedTutorial'
const EXPERIENCE = 'between_us_onboarding_experience_v'
const SEEDED = 'between_us_hints_seeded'
const IDS = ['discover', 'share', 'checkin', 'community']
const hintKey = (id) => `between_us_hint_dismissed_${id}`

function dismissAll() {
  for (const id of IDS) localStorage.setItem(hintKey(id), 'true')
}

function seedOnboardingMigration() {
  if (localStorage.getItem(SEEDED)) return
  if (localStorage.getItem(TUTORIAL) !== 'true') return
  dismissAll()
  localStorage.setItem(SEEDED, 'legacy')
  if (!localStorage.getItem(EXPERIENCE)) localStorage.setItem(EXPERIENCE, '1')
}

function markTutorialCompleted({ enableContextualHints } = {}) {
  localStorage.setItem(TUTORIAL, 'true')
  localStorage.setItem(EXPERIENCE, '2')
  if (enableContextualHints === false) return
  if (localStorage.getItem(SEEDED) !== 'legacy') localStorage.setItem(SEEDED, 'v2')
}

function markOnboardingCompleted() {
  localStorage.setItem(ONBOARDING, 'true')
}

function shouldShowContextualHints() {
  seedOnboardingMigration()
  return localStorage.getItem(SEEDED) === 'v2'
}

function wouldShowWelcome() {
  return localStorage.getItem(TUTORIAL) !== 'true'
}

function wouldShowOnboarding() {
  return localStorage.getItem(ONBOARDING) !== 'true'
}

function reset() {
  store.clear()
}

function scenarioA() {
  reset()
  localStorage.setItem(ONBOARDING, 'true')
  localStorage.setItem(TUTORIAL, 'true')
  seedOnboardingMigration()
  assert.equal(wouldShowOnboarding(), false)
  assert.equal(wouldShowWelcome(), false)
  assert.equal(localStorage.getItem(SEEDED), 'legacy')
  assert.equal(shouldShowContextualHints(), false)
  console.log('A existing completed user: PASS')
}

function scenarioB() {
  reset()
  localStorage.setItem(ONBOARDING, 'true')
  localStorage.setItem(TUTORIAL, 'true')
  seedOnboardingMigration()
  assert.equal(localStorage.getItem(SEEDED), 'legacy')
  assert.equal(localStorage.getItem(EXPERIENCE), '1')
  assert.equal(shouldShowContextualHints(), false)
  assert.equal(localStorage.getItem(hintKey('discover')), 'true')
  console.log('B legacy tutorial completed: PASS')
}

function scenarioC() {
  reset()
  assert.equal(wouldShowOnboarding(), true)
  assert.equal(wouldShowWelcome(), true)
  markOnboardingCompleted()
  assert.equal(wouldShowWelcome(), true)
  markTutorialCompleted({ enableContextualHints: true })
  assert.equal(wouldShowWelcome(), false)
  assert.equal(localStorage.getItem(SEEDED), 'v2')
  assert.equal(shouldShowContextualHints(), true)
  console.log('C brand-new user: PASS')
}

function scenarioD() {
  // Skip welcome/tour = still markTutorialCompleted (Start exploring or Skip)
  reset()
  markOnboardingCompleted()
  markTutorialCompleted({ enableContextualHints: true })
  assert.equal(wouldShowWelcome(), false)
  assert.equal(wouldShowOnboarding(), false)
  // reload simulation
  assert.equal(wouldShowWelcome(), false)
  assert.equal(wouldShowOnboarding(), false)
  console.log('D skip welcome still enters app: PASS')
}

function scenarioE() {
  // Matches ProfileTab sign-out: only clears hasCompletedOnboarding
  reset()
  localStorage.setItem(ONBOARDING, 'true')
  localStorage.setItem(TUTORIAL, 'true')
  localStorage.setItem(SEEDED, 'legacy')
  localStorage.removeItem(ONBOARDING)
  assert.equal(wouldShowOnboarding(), true)
  assert.equal(wouldShowWelcome(), false) // tutorial flag preserved
  markOnboardingCompleted()
  assert.equal(wouldShowOnboarding(), false)
  assert.equal(wouldShowWelcome(), false)
  assert.equal(localStorage.getItem(SEEDED), 'legacy')
  assert.equal(shouldShowContextualHints(), false)
  console.log('E logout/login no welcome loop: PASS')
}

function scenarioWebLegacyBeforeFlags() {
  // AuthenticatedWebApp: seed BEFORE writing flags
  reset()
  localStorage.setItem(ONBOARDING, 'true')
  localStorage.setItem(TUTORIAL, 'true')
  seedOnboardingMigration()
  const isLegacyUser = localStorage.getItem(SEEDED) === 'legacy'
  markOnboardingCompleted()
  if (isLegacyUser) localStorage.setItem(TUTORIAL, 'true')
  else markTutorialCompleted({ enableContextualHints: true })
  assert.equal(isLegacyUser, true)
  assert.equal(shouldShowContextualHints(), false)
  console.log('Web legacy mount order: PASS')
}

function scenarioWebNewUser() {
  reset()
  seedOnboardingMigration()
  const isLegacyUser = localStorage.getItem(SEEDED) === 'legacy'
  markOnboardingCompleted()
  if (isLegacyUser) localStorage.setItem(TUTORIAL, 'true')
  else markTutorialCompleted({ enableContextualHints: true })
  assert.equal(isLegacyUser, false)
  assert.equal(shouldShowContextualHints(), true)
  assert.equal(wouldShowWelcome(), false) // web skips welcome UI
  console.log('Web new user hints without welcome UI: PASS')
}

scenarioA()
scenarioB()
scenarioC()
scenarioD()
scenarioE()
scenarioWebLegacyBeforeFlags()
scenarioWebNewUser()
console.log('All migration scenarios: OK')
