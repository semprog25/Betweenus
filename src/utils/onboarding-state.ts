/**
 * Onboarding / tutorial / contextual-hint persistence.
 *
 * Legacy keys (preserved for migration safety):
 * - hasCompletedOnboarding
 * - hasCompletedTutorial
 *
 * New keys:
 * - between_us_onboarding_experience_v (version of welcome UX completed)
 * - between_us_hints_seeded (legacy | v2)
 * - between_us_hint_dismissed_<id>
 */

export const ONBOARDING_COMPLETED_KEY = 'hasCompletedOnboarding'
export const TUTORIAL_COMPLETED_KEY = 'hasCompletedTutorial'
export const ONBOARDING_EXPERIENCE_VERSION_KEY = 'between_us_onboarding_experience_v'
export const HINTS_SEEDED_KEY = 'between_us_hints_seeded'
export const CURRENT_ONBOARDING_EXPERIENCE_VERSION = '2'

export type ContextualHintId = 'discover' | 'share' | 'checkin' | 'community'

export const CONTEXTUAL_HINT_IDS: ContextualHintId[] = [
  'discover',
  'share',
  'checkin',
  'community',
]

export const WEB_FIRST_SESSION_KEY = 'between_us_web_first_session_v1'
export const WEB_ENTERED_APP_KEY = 'between_us_web_entered_app'

function hintDismissedKey(id: ContextualHintId): string {
  return `between_us_hint_dismissed_${id}`
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined'
}

export function isOnboardingCompleted(): boolean {
  if (!canUseStorage()) return false
  return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true'
}

export function isTutorialCompleted(): boolean {
  if (!canUseStorage()) return false
  return localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true'
}

export function markOnboardingCompleted(): void {
  if (!canUseStorage()) return
  localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true')
}

export function markTutorialCompleted(options?: { enableContextualHints?: boolean }): void {
  if (!canUseStorage()) return
  localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true')
  localStorage.setItem(ONBOARDING_EXPERIENCE_VERSION_KEY, CURRENT_ONBOARDING_EXPERIENCE_VERSION)
  if (options?.enableContextualHints === false) return
  // New welcome completers get contextual hints (unless already marked legacy).
  if (localStorage.getItem(HINTS_SEEDED_KEY) !== 'legacy') {
    localStorage.setItem(HINTS_SEEDED_KEY, 'v2')
  }
}

export function dismissContextualHint(id: ContextualHintId): void {
  if (!canUseStorage()) return
  localStorage.setItem(hintDismissedKey(id), 'true')
}

export function isContextualHintDismissed(id: ContextualHintId): boolean {
  if (!canUseStorage()) return true
  return localStorage.getItem(hintDismissedKey(id)) === 'true'
}

function dismissAllContextualHints(): void {
  for (const id of CONTEXTUAL_HINT_IDS) {
    localStorage.setItem(hintDismissedKey(id), 'true')
  }
}

/**
 * Migrate users who already finished the old tutorial so they are not
 * re-onboarded and do not suddenly see first-visit coach marks.
 *
 * Users mid-flow (onboarding done, tutorial not done) are left alone so the
 * new short welcome can enable hints after completion.
 */
export function seedOnboardingMigration(): void {
  if (!canUseStorage()) return
  if (localStorage.getItem(HINTS_SEEDED_KEY)) return

  const hadTutorial = localStorage.getItem(TUTORIAL_COMPLETED_KEY) === 'true'
  if (!hadTutorial) return

  dismissAllContextualHints()
  localStorage.setItem(HINTS_SEEDED_KEY, 'legacy')
  if (!localStorage.getItem(ONBOARDING_EXPERIENCE_VERSION_KEY)) {
    localStorage.setItem(ONBOARDING_EXPERIENCE_VERSION_KEY, '1')
  }
}

/**
 * Whether contextual hints should appear for this install.
 * Legacy migrated users are excluded.
 */
export function shouldShowContextualHints(): boolean {
  if (!canUseStorage()) return false
  seedOnboardingMigration()
  return localStorage.getItem(HINTS_SEEDED_KEY) === 'v2'
}

export function clearOnboardingLocalState(): void {
  if (!canUseStorage()) return
  localStorage.removeItem(ONBOARDING_COMPLETED_KEY)
  localStorage.removeItem(TUTORIAL_COMPLETED_KEY)
  localStorage.removeItem(ONBOARDING_EXPERIENCE_VERSION_KEY)
  localStorage.removeItem(HINTS_SEEDED_KEY)
  localStorage.removeItem(WEB_FIRST_SESSION_KEY)
  localStorage.removeItem(WEB_ENTERED_APP_KEY)
  for (const id of CONTEXTUAL_HINT_IDS) {
    localStorage.removeItem(hintDismissedKey(id))
  }
}

/** Keys that must survive localStorage cleanup when storage is near quota. */
export const ONBOARDING_STORAGE_KEEP_KEYS = [
  ONBOARDING_COMPLETED_KEY,
  TUTORIAL_COMPLETED_KEY,
  ONBOARDING_EXPERIENCE_VERSION_KEY,
  HINTS_SEEDED_KEY,
  WEB_FIRST_SESSION_KEY,
  WEB_ENTERED_APP_KEY,
  ...CONTEXTUAL_HINT_IDS.map(hintDismissedKey),
]

export function isWebFirstSessionPending(): boolean {
  if (!canUseStorage()) return false
  return localStorage.getItem(WEB_FIRST_SESSION_KEY) !== 'done'
}

export function markWebFirstSessionDone(): void {
  if (!canUseStorage()) return
  localStorage.setItem(WEB_FIRST_SESSION_KEY, 'done')
}

/** Prefer Stories as the first authenticated web destination for brand-new sessions. */
export function shouldLandWebOnStories(): boolean {
  if (!canUseStorage()) return false
  return !localStorage.getItem(WEB_ENTERED_APP_KEY)
}

export function markWebEnteredApp(): void {
  if (!canUseStorage()) return
  localStorage.setItem(WEB_ENTERED_APP_KEY, '1')
}
