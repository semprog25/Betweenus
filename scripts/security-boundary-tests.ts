/**
 * Authorization boundary smoke tests against the live Edge Function.
 * These are intentionally network tests (not UI) so they catch client-bypass attacks.
 *
 * Run: npx tsx scripts/security-boundary-tests.ts
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qoqbdiixztolvtcjdnle.supabase.co'
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''
const BASE = `${SUPABASE_URL}/functions/v1/make-server-6c9b0e48`

if (!ANON_KEY) {
  console.error('Missing anon key. Set VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY.')
  process.exit(1)
}

interface CaseResult {
  name: string
  ok: boolean
  detail: string
}

const results: CaseResult[] = []

async function request(
  path: string,
  init: RequestInit = {},
): Promise<{ status: number; json: any; text: string }> {
  const headers = new Headers(init.headers || {})
  if (!headers.has('apikey')) headers.set('apikey', ANON_KEY)
  if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${ANON_KEY}`)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  const res = await fetch(`${BASE}${path}`, { ...init, headers })
  const text = await res.text()
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }
  return { status: res.status, json, text }
}

function assert(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail })
  const mark = ok ? 'PASS' : 'FAIL'
  console.log(`${mark}  ${name} — ${detail}`)
}

async function main() {
  // 1. Public feed works and must not leak full voter lists / anonymous author ids
  {
    const { status, json } = await request('/posts?limit=5&sort=newest')
    assert('public feed readable', status === 200 && Array.isArray(json?.posts), `status=${status}`)
    const posts = json?.posts || []
    const leaksVoters = posts.some((p: any) =>
      Array.isArray(p.upvotedBy) && p.upvotedBy.length > 1,
    )
    const leaksAnonAuthor = posts.some(
      (p: any) => p.isAnonymous !== false && typeof p.userId === 'string' && p.userId.length > 0,
    )
    assert('feed does not leak multi-voter lists', !leaksVoters, leaksVoters ? 'found multi voter ids' : 'ok')
    assert('feed does not leak anonymous author userId', !leaksAnonAuthor, leaksAnonAuthor ? 'userId present on anon post' : 'ok')
  }

  // 2. Waitlist GET remains admin-gated
  {
    const { status } = await request('/waitlist')
    assert('waitlist GET blocked without admin', status === 401 || status === 403, `status=${status}`)
  }

  // 3. Privacy toggle requires auth
  {
    const { status } = await request('/posts/does-not-exist/privacy', {
      method: 'PATCH',
      body: JSON.stringify({ isAnonymous: false }),
    })
    assert('privacy PATCH requires auth', status === 401, `status=${status}`)
  }

  // 4. Community post edit requires auth
  {
    const { status } = await request('/community/posts/does-not-exist', {
      method: 'PUT',
      body: JSON.stringify({ content: 'hacked' }),
    })
    assert('community post edit requires auth', status === 401, `status=${status}`)
  }

  // 5. Vote spoofing rejected
  {
    const feed = await request('/posts?limit=1&sort=newest')
    const postId = feed.json?.posts?.[0]?.id
    if (!postId) {
      assert('vote spoofing check', false, 'no post available to test')
    } else {
      const { status } = await request(`/posts/${postId}/upvote`, {
        method: 'POST',
        body: JSON.stringify({ userId: '00000000-0000-4000-8000-000000000001' }),
      })
      assert('vote spoofing rejected', status === 401 || status === 403, `status=${status}`)
    }
  }

  // 6. Subscription IDOR
  {
    const { status } = await request('/subscription?userId=00000000-0000-4000-8000-000000000001')
    assert('subscription requires auth', status === 401, `status=${status}`)
  }

  // 7. Increment post without auth
  {
    const { status } = await request('/subscription/increment-post', {
      method: 'POST',
      body: JSON.stringify({ userId: '00000000-0000-4000-8000-000000000001' }),
    })
    assert('increment-post requires auth', status === 401, `status=${status}`)
  }

  // 8. Stats / user-posts IDOR
  {
    const stats = await request('/stats?userId=00000000-0000-4000-8000-000000000001')
    const posts = await request('/user-posts?userId=00000000-0000-4000-8000-000000000001')
    assert('stats requires auth', stats.status === 401, `status=${stats.status}`)
    assert('user-posts requires auth', posts.status === 401, `status=${posts.status}`)
  }

  // 9. Check-ins require auth
  {
    const { status } = await request('/check-ins')
    assert('check-ins require auth', status === 401, `status=${status}`)
  }

  // 10. Admin reports blocked
  {
    const { status } = await request('/admin/reports')
    assert('admin reports blocked', status === 401 || status === 403, `status=${status}`)
  }

  // 10b. Editorial Journal CMS (landing-cms) — anonymous blocked
  // Skip with clear message if Edge Function not yet redeployed with these routes.
  {
    const me = await request('/landing-cms/me')
    if (me.status === 404) {
      console.log('SKIP CMS authz matrix — deploy Edge Function with landing-cms routes first')
    } else {
      assert('CMS me requires auth', me.status === 401 || me.status === 403, `status=${me.status}`)

      const list = await request('/landing-cms/journal-articles')
      assert('CMS list requires auth', list.status === 401 || list.status === 403, `status=${list.status}`)

      const create = await request('/landing-cms/journal-articles', {
        method: 'POST',
        body: JSON.stringify({
          title: 'hack',
          slug: 'hack',
          excerpt: 'x',
          body: '<p>x</p>',
          category: 'Relationships',
          author: 'x',
        }),
      })
      assert('CMS create requires auth', create.status === 401 || create.status === 403, `status=${create.status}`)

      const patch = await request('/landing-cms/journal-articles/00000000-0000-4000-8000-000000000001', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'hack' }),
      })
      assert('CMS patch requires auth', patch.status === 401 || patch.status === 403, `status=${patch.status}`)

      const publish = await request('/landing-cms/journal-articles/00000000-0000-4000-8000-000000000001/publish', {
        method: 'POST',
        body: '{}',
      })
      assert('CMS publish requires auth', publish.status === 401 || publish.status === 403, `status=${publish.status}`)

      const pushLive = await request('/landing-cms/journal/push-live', {
        method: 'POST',
        body: '{}',
      })
      assert('CMS push-live requires auth', pushLive.status === 401 || pushLive.status === 403, `status=${pushLive.status}`)

      const upload = await request('/landing-cms/journal-images/signed-upload', {
        method: 'POST',
        body: JSON.stringify({ filename: 'x.jpg', contentType: 'image/jpeg', byteSize: 100 }),
      })
      assert('CMS image upload requires auth', upload.status === 401 || upload.status === 403, `status=${upload.status}`)
    }
  }

  // 10c. Bundle must not embed service-role / GitHub dispatch secrets (static check)
  {
    const fs = await import('fs')
    const path = await import('path')
    const distDir = path.join(process.cwd(), 'dist')
    let leaked = false
    let detail = 'dist not built yet — skipped'
    if (fs.existsSync(distDir)) {
      const walk = (dir: string): string[] => {
        const out: string[] = []
        for (const name of fs.readdirSync(dir)) {
          const full = path.join(dir, name)
          if (fs.statSync(full).isDirectory()) out.push(...walk(full))
          else if (/\.(js|html|css|json|map)$/.test(name)) out.push(full)
        }
        return out
      }
      for (const file of walk(distDir)) {
        const text = fs.readFileSync(file, 'utf8')
        if (
          text.includes('SERVICE_ROLE_KEY') ||
          text.includes('GITHUB_LANDING_DISPATCH') ||
          /supabase.*service_role/i.test(text)
        ) {
          leaked = true
          detail = `leak in ${path.relative(process.cwd(), file)}`
          break
        }
      }
      if (!leaked) detail = 'no service-role/github dispatch strings in dist'
    }
    assert('client bundle has no service-role/github secrets', !leaked, detail)
  }

  // 11. Production-style upgrade blocked without payment (expects auth first)
  {
    const { status } = await request('/subscription/upgrade', {
      method: 'POST',
      body: JSON.stringify({ tier: 'pro' }),
    })
    assert('upgrade requires auth', status === 401, `status=${status}`)
  }

  // 12. Account deletion requires auth
  {
    const { status } = await request('/auth/delete-account', { method: 'POST', body: '{}' })
    assert('delete-account requires auth', status === 401, `status=${status}`)
  }

  // 12b. Ephemeral signup → delete-account → cannot reuse session (complete deletion path)
  {
    const stamp = Date.now()
    const email = `delete-probe-${stamp}@betweenus-security.test`
    const password = `DelProbe_${stamp}_Aa1!`
    const signup = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name: 'Delete Probe' }),
    })
    const token = signup.json?.access_token
    const userId = signup.json?.user?.id
    if (signup.status !== 200 || !token || !userId) {
      assert(
        'delete-account ephemeral signup',
        false,
        `signup status=${signup.status} error=${signup.json?.error || ''}`,
      )
    } else {
      // Seed a private journal entry so deletion must clear non-post data
      await request('/journal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: 'delete probe journal', mood: 'okay' }),
      })
      const del = await request('/auth/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: '{}',
      })
      assert('delete-account succeeds for owner', del.status === 200 && del.json?.success === true, `status=${del.status}`)

      const after = await request('/auth/user', {
        headers: { Authorization: `Bearer ${token}` },
      })
      assert(
        'deleted session cannot load user',
        after.status === 401 || after.status === 403,
        `status=${after.status}`,
      )

      // Repeat deletion with same token must fail (user already gone)
      const delAgain = await request('/auth/delete-account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: '{}',
      })
      assert(
        'repeated delete-account rejected',
        delAgain.status === 401 || delAgain.status === 403 || delAgain.status === 500,
        `status=${delAgain.status}`,
      )
    }
  }

  // 13. Anonymous post cannot claim arbitrary UUID authorship
  {
    const { status, json } = await request('/posts', {
      method: 'POST',
      body: JSON.stringify({
        content: 'security boundary probe — discard',
        userId: '00000000-0000-4000-8000-000000000001',
        isAnonymous: true,
        languages: ['en'],
        categories: ['General'],
      }),
    })
    assert(
      'anon cannot spoof UUID authorship',
      status === 401 || status === 403,
      `status=${status} error=${json?.error || ''}`,
    )
  }

  // Optional authenticated cross-user checks if credentials provided
  const emailA = process.env.SECURITY_TEST_EMAIL_A
  const passA = process.env.SECURITY_TEST_PASSWORD_A
  const emailB = process.env.SECURITY_TEST_EMAIL_B
  const passB = process.env.SECURITY_TEST_PASSWORD_B

  if (emailA && passA && emailB && passB) {
    const supabase = createClient(SUPABASE_URL, ANON_KEY)
    const a = await supabase.auth.signInWithPassword({ email: emailA, password: passA })
    const b = await supabase.auth.signInWithPassword({ email: emailB, password: passB })
    const tokenA = a.data.session?.access_token
    const tokenB = b.data.session?.access_token
    const userA = a.data.user?.id
    const userB = b.data.user?.id

    if (tokenA && tokenB && userA && userB) {
      const create = await request('/posts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({
          content: `security ownership probe ${Date.now()}`,
          isAnonymous: true,
          languages: ['en'],
          categories: ['General'],
        }),
      })
      const postId = create.json?.post?.id
      assert('user A can create post', create.status === 200 && Boolean(postId), `status=${create.status}`)

      if (postId) {
        const editAsB = await request(`/community/posts/${postId}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${tokenB}` },
          body: JSON.stringify({ content: 'stolen edit' }),
        })
        assert('user B cannot edit A post', editAsB.status === 403, `status=${editAsB.status}`)

        const privacyAsB = await request(`/posts/${postId}/privacy`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${tokenB}` },
          body: JSON.stringify({ isAnonymous: false }),
        })
        assert('user B cannot change A privacy', privacyAsB.status === 403, `status=${privacyAsB.status}`)

        const deleteAsB = await request(`/posts/${postId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${tokenB}` },
        })
        assert('user B cannot delete A post', deleteAsB.status === 403, `status=${deleteAsB.status}`)

        const deleteAsA = await request(`/posts/${postId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${tokenA}` },
        })
        assert('user A can delete own post', deleteAsA.status === 200, `status=${deleteAsA.status}`)
      }

      const upgrade = await request('/subscription/upgrade', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenA}` },
        body: JSON.stringify({ tier: 'pro' }),
      })
      assert(
        'authenticated upgrade blocked in non-dev',
        upgrade.status === 403 && upgrade.json?.code === 'PAYMENT_REQUIRED',
        `status=${upgrade.status} code=${upgrade.json?.code}`,
      )

      // Normal authenticated users must not access Journal CMS
      const cmsMe = await request('/landing-cms/me', {
        headers: { Authorization: `Bearer ${tokenA}` },
      })
      if (cmsMe.status === 404) {
        console.log('SKIP CMS normal-user forbid — Edge not redeployed yet')
      } else {
        assert('normal user CMS me forbidden', cmsMe.status === 403, `status=${cmsMe.status}`)
        const cmsCreate = await request('/landing-cms/journal-articles', {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokenA}` },
          body: JSON.stringify({
            title: 'should fail',
            slug: 'should-fail',
            excerpt: 'x',
            body: '<p>x</p>',
            category: 'Relationships',
            author: 'x',
          }),
        })
        assert('normal user CMS create forbidden', cmsCreate.status === 403, `status=${cmsCreate.status}`)
        const cmsPublish = await request('/landing-cms/journal-articles/00000000-0000-4000-8000-000000000001/publish', {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokenA}` },
          body: '{}',
        })
        assert('normal user CMS publish forbidden', cmsPublish.status === 403, `status=${cmsPublish.status}`)
        const cmsPush = await request('/landing-cms/journal/push-live', {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokenA}` },
          body: '{}',
        })
        assert('normal user CMS push-live forbidden', cmsPush.status === 403, `status=${cmsPush.status}`)
      }
    } else {
      assert('authenticated pair login', false, 'could not sign in both security test users')
    }
  } else {
    console.log('SKIP authenticated cross-user matrix (set SECURITY_TEST_EMAIL_A/B + PASSWORD_A/B)')
  }

  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} passed`)
  if (failed.length) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
