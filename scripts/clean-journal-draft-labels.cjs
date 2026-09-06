#!/usr/bin/env node
/**
 * Strip leaked parser labels from existing draft bodies; preserve IDs/authors/status/prose.
 * Does not publish.
 */
const paste = require('../public/journal-article-parser.js')

const EDGE = process.env.BU_EDGE
const ANON = process.env.BU_ANON
const TOKEN = process.env.BU_TOKEN

async function api(pathname, opts = {}) {
  const res = await fetch(EDGE + pathname, {
    ...opts,
    headers: {
      Authorization: 'Bearer ' + TOKEN,
      apikey: ANON,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = { raw: text } }
  if (!res.ok) throw new Error(res.status + ' ' + JSON.stringify(data))
  return data
}

function hasLeak(html) {
  return /Final CTA paragraph:/i.test(html) ||
    /FINAL VERIFICATION/i.test(html) ||
    /<p>\s*(Paragraph|Heading|Block|Content|Callout|Tip)\s*:\s*<\/p>/i.test(html)
}

async function main() {
  const list = await api('/landing-cms/journal-articles')
  const slugs = [
    'the-gossip-we-all-pretend-we-dont-love',
    'when-your-friends-secret-isnt-really-a-secret',
    'things-people-say-behind-your-back',
    'the-office-gossip-nobody-asked-for',
  ]
  const results = []
  for (const slug of slugs) {
    const existing = (list.articles || []).find((a) => a.slug === slug)
    if (!existing) throw new Error('missing ' + slug)
    const before = existing.body || ''
    const after = paste.stripParserLabelsFromHtml(before)
    const changed = before !== after
    if (changed) {
      const saved = await api('/landing-cms/journal-articles/' + existing.id, {
        method: 'PATCH',
        body: JSON.stringify({
          body: after,
          status: 'draft',
          author: existing.author,
          title: existing.title,
          slug: existing.slug,
          excerpt: existing.excerpt,
          category: existing.category,
          tags: existing.tags,
          seo_title: existing.seo_title,
          seo_description: existing.seo_description,
          allow_missing_image: true,
        }),
      })
      const a = saved.article || saved
      if (a.id !== existing.id) throw new Error('id changed')
      if (a.status !== 'draft') throw new Error('not draft')
    }
    const reopen = await api('/landing-cms/journal-articles/' + existing.id)
    const a = reopen.article || reopen
    const body = a.body || ''
    results.push({
      slug,
      id: a.id,
      status: a.status,
      author: a.author,
      cleaned: changed,
      stillLeaks: hasLeak(body),
      reading_time_minutes: a.reading_time_minutes,
      estimated: paste.estimateReadingTimeMinutes(body),
      hasCtaText: /Tell us what happened|ridiculous piece of office gossip|strangest thing you've ever heard|everyone knew/i.test(body),
      wordApprox: body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length,
    })
  }
  const pub = (await api('/landing-cms/journal-articles')).articles.filter((a) => a.status === 'published')
  console.log(JSON.stringify({ results, publishedCount: pub.length }, null, 2))
  if (results.some((r) => r.stillLeaks || r.status !== 'draft') || pub.length) process.exit(1)
  console.log('OK: drafts cleaned of parser labels; still draft')
}

main().catch((e) => { console.error(e); process.exit(1) })
