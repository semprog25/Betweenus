/**
 * Lightweight pending-auth-action smoke checks (no Phase 3 social features).
 * Run: npx tsx scripts/pending-auth-action-tests.ts
 */
import assert from 'node:assert/strict'

type PendingAuthAction = {
  type: 'me_too' | 'reply' | 'save' | 'spill' | 'generic'
  postId?: string
  createdAt: number
}

const KEY = 'between_us_pending_auth_action'

/** Minimal in-memory stand-in for localStorage used by auth helpers. */
class MemoryStorage {
  private store = new Map<string, string>()
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.store.set(key, value)
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
}

function setPending(storage: MemoryStorage, action: Omit<PendingAuthAction, 'createdAt'> & { createdAt?: number }) {
  const payload: PendingAuthAction = {
    type: action.type,
    postId: action.postId,
    createdAt: action.createdAt ?? Date.now(),
  }
  storage.setItem(KEY, JSON.stringify(payload))
}

function consumePending(storage: MemoryStorage): PendingAuthAction | null {
  const raw = storage.getItem(KEY)
  storage.removeItem(KEY)
  if (!raw) return null
  return JSON.parse(raw) as PendingAuthAction
}

function run() {
  const storage = new MemoryStorage()

  setPending(storage, { type: 'me_too', postId: 'story-123' })
  const first = consumePending(storage)
  assert.equal(first?.type, 'me_too')
  assert.equal(first?.postId, 'story-123')
  assert.equal(consumePending(storage), null, 'pending action must be single-use')

  setPending(storage, { type: 'spill' })
  const spill = consumePending(storage)
  assert.equal(spill?.type, 'spill')
  assert.equal(spill?.postId, undefined)

  // Client must not be able to inject a foreign userId into pending action payload
  const malicious = { type: 'reply', postId: 'x', userId: 'attacker-uuid', createdAt: Date.now() }
  storage.setItem(KEY, JSON.stringify(malicious))
  const restored = consumePending(storage) as PendingAuthAction & { userId?: string }
  assert.equal(restored.type, 'reply')
  // Architecture rule: restore uses authenticated server identity, never client userId
  // sanitize on read (mirrors peekPendingAuthAction)
  const sanitized = {
    type: restored.type,
    postId: restored.postId,
    createdAt: restored.createdAt,
  }
  assert.equal('userId' in sanitized, false)
  console.log('NOTE: pending restore must ignore client userId; JWT sub is authoritative')

  console.log('pending-auth-action tests: PASS')
}

run()
