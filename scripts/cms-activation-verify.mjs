/**
 * One-off CMS activation verification. Do not commit secrets.
 * Run: SRK=... node scripts/cms-activation-verify.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

const URL = 'https://qoqbdiixztolvtcjdnle.supabase.co'
const ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
const SRK = process.env.SRK
const EDGE = `${URL}/functions/v1/make-server-6c9b0e48`
const ADMIN_EMAIL = 'sharanestone@gmail.com'
const ADMIN_ID = 'c4c33d2e-b3d6-4621-9a59-52fc086c5c62'
const NON_ADMIN_EMAIL = 'sharan9190@gmail.com'

if (!SRK) {
  console.error('Set SRK env to service role key')
  process.exit(1)
}

const results = []
function note(name, ok, detail) {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name} — ${detail}`)
}

async function api(path, { token, method = 'GET', body } = {}) {
  const headers = {
    apikey: ANON,
    Authorization: `Bearer ${token || ANON}`,
    'Content-Type': 'application/json',
  }
  const res = await globalThis.fetch(`${EDGE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* ignore */
  }
  return { status: res.status, json, text: text.slice(0, 400) }
}

async function sessionFor(email) {
  const admin = createClient(URL, SRK, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (error) throw error
  const token_hash = data.properties.hashed_token
  const anon = createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const verified = await anon.auth.verifyOtp({ type: 'email', token_hash })
  if (verified.error) throw verified.error
  return verified.data.session.access_token
}

async function main() {
  const anonMe = await api('/landing-cms/me')
  note('anon GET /me', anonMe.status === 401 || anonMe.status === 403, `status=${anonMe.status}`)

  const anonCreate = await api('/landing-cms/journal-articles', {
    method: 'POST',
    body: {
      title: 'x',
      slug: 'x',
      excerpt: 'x',
      body: '<p>x</p>',
      category: 'Relationships',
      author: 'x',
    },
  })
  note('anon POST create', anonCreate.status === 401 || anonCreate.status === 403, `status=${anonCreate.status}`)

  const adminToken = await sessionFor(ADMIN_EMAIL)
  const me = await api('/landing-cms/me', { token: adminToken })
  note(
    'admin GET /me',
    me.status === 200 && me.json?.role === 'admin' && me.json?.userId === ADMIN_ID,
    `status=${me.status} role=${me.json?.role} userId=${me.json?.userId}`,
  )

  const nonAdminToken = await sessionFor(NON_ADMIN_EMAIL)
  const nonMe = await api('/landing-cms/me', { token: nonAdminToken })
  note('non-admin GET /me', nonMe.status === 403, `status=${nonMe.status} body=${nonMe.text}`)
  const nonCreate = await api('/landing-cms/journal-articles', {
    token: nonAdminToken,
    method: 'POST',
    body: {
      title: 'hack',
      slug: 'hack-me',
      excerpt: 'x',
      body: '<p>x</p>',
      category: 'Relationships',
      author: 'x',
    },
  })
  note('non-admin POST create', nonCreate.status === 403, `status=${nonCreate.status}`)
  const nonPublish = await api(
    '/landing-cms/journal-articles/00000000-0000-4000-8000-000000000001/publish',
    { token: nonAdminToken, method: 'POST', body: {} },
  )
  note('non-admin publish', nonPublish.status === 403, `status=${nonPublish.status}`)

  const create = await api('/landing-cms/journal-articles', {
    token: adminToken,
    method: 'POST',
    body: {
      title: 'CMS Test — DELETE ME',
      slug: 'cms-test-delete-me',
      excerpt: 'Temporary CMS activation test. Delete me.',
      body: '<p>Hello</p><script>alert(1)</script><img src=x onerror=alert(1) /><a href="javascript:alert(1)">bad</a><p>Safe <strong>text</strong></p>',
      category: 'Relationships',
      author: 'Between Us Editorial',
      status: 'draft',
      featured: false,
    },
  })
  note('admin create draft', create.status === 200 && Boolean(create.json?.article?.id), `status=${create.status} id=${create.json?.article?.id}`)
  const articleId = create.json?.article?.id
  const bodySanitized = create.json?.article?.body || ''
  note(
    'XSS sanitized',
    !/script|onerror|javascript:/i.test(bodySanitized) && bodySanitized.includes('Safe'),
    `body=${bodySanitized.slice(0, 160)}`,
  )

  const preview = await api(`/landing-cms/journal-articles/${articleId}/preview`, {
    token: adminToken,
    method: 'POST',
    body: {},
  })
  note(
    'admin preview',
    preview.status === 200 && preview.json?.preview?.isPreview === true && preview.json?.preview?.public === false,
    `status=${preview.status}`,
  )

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  )
  const signed = await api('/landing-cms/journal-images/signed-upload', {
    token: adminToken,
    method: 'POST',
    body: { filename: 'cms-test.png', contentType: 'image/png', byteSize: png.length },
  })
  note(
    'admin signed upload URL',
    signed.status === 200 && Boolean(signed.json?.signedUrl) && Boolean(signed.json?.path),
    `status=${signed.status} path=${signed.json?.path}`,
  )

  if (signed.json?.signedUrl) {
    const up = await globalThis.fetch(signed.json.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: png,
    })
    note('admin image PUT', up.ok, `status=${up.status}`)
    if (signed.json.publicUrl) {
      const get = await globalThis.fetch(signed.json.publicUrl)
      note('public image URL readable', get.ok, `status=${get.status}`)
    }
  }

  const badMime = await api('/landing-cms/journal-images/signed-upload', {
    token: adminToken,
    method: 'POST',
    body: { filename: 'evil.exe', contentType: 'application/x-msdownload', byteSize: 100 },
  })
  note('reject executable mime', badMime.status === 400, `status=${badMime.status}`)

  const oversized = await api('/landing-cms/journal-images/signed-upload', {
    token: adminToken,
    method: 'POST',
    body: { filename: 'big.jpg', contentType: 'image/jpeg', byteSize: 9_000_000 },
  })
  note('reject oversized', oversized.status === 400, `status=${oversized.status}`)

  const nonUpload = await api('/landing-cms/journal-images/signed-upload', {
    token: nonAdminToken,
    method: 'POST',
    body: { filename: 'x.png', contentType: 'image/png', byteSize: 10 },
  })
  note('non-admin upload forbidden', nonUpload.status === 403, `status=${nonUpload.status}`)

  if (articleId && signed.json?.path) {
    const patch = await api(`/landing-cms/journal-articles/${articleId}`, {
      token: adminToken,
      method: 'PATCH',
      body: { featured_image: signed.json.path, featured_image_alt: '1x1 test' },
    })
    note(
      'admin edit draft',
      patch.status === 200 && patch.json?.article?.featured_image === signed.json.path,
      `status=${patch.status}`,
    )
  }

  const list = await api('/landing-cms/journal-articles?status=draft', { token: adminToken })
  const found = (list.json?.articles || []).find((a) => a.id === articleId)
  note('draft in CMS list', Boolean(found) && found.status === 'draft', `found=${Boolean(found)}`)

  // Ensure draft is NOT in public generator live set yet (status draft)
  note('draft not published status', found?.status === 'draft', `status=${found?.status}`)

  // Write state for follow-up scripts (tmp only)
  const statePath = join(tmpdir(), 'betweenus-cms-activation.json')
  writeFileSync(
    statePath,
    JSON.stringify(
      {
        articleId,
        imagePath: signed.json?.path || null,
        publicUrl: signed.json?.publicUrl || null,
      },
      null,
      2,
    ),
  )
  console.log('STATE_FILE=' + statePath)

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} CMS API checks passed`)
  if (failed.length) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
