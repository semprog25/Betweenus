#!/usr/bin/env node
/**
 * Restore journal drafts 1 & 4 (and optionally all) from paste-v2 fixtures.
 * Preserves article IDs, authors, draft status. Does not publish.
 */
const fs = require('fs')
const path = require('path')
const paste = require('../public/journal-article-parser.js')

const EDGE = process.env.BU_EDGE
const ANON = process.env.BU_ANON
const TOKEN = process.env.BU_TOKEN
const ONLY = (process.env.ONLY_SLUGS || '').split(',').map((s) => s.trim()).filter(Boolean)

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function serializeSections(sections) {
  const parts = []
  for (const section of sections || []) {
    const heading = String(section.heading || '').trim()
    if (heading && !paste.isParserLabelOnly(heading)) {
      parts.push('<h2>' + esc(heading) + '</h2>')
    }
    for (const block of section.blocks || []) {
      if (block.type === 'paragraph') {
        if (paste.isParserLabelOnly(block.content)) continue
        // One editor paragraph block → one public <p> (prose already consolidated)
        const text = String(block.content || '').replace(/\s+/g, ' ').trim()
        if (text) parts.push('<p>' + esc(text) + '</p>')
      } else if (block.type === 'callout') {
        const call = String(block.content || '').replace(/\s+/g, ' ').trim()
        if (call && !paste.isParserLabelOnly(call)) {
          parts.push('<blockquote><p><strong>Note:</strong> ' + esc(call) + '</p></blockquote>')
        }
      } else if (block.type === 'tip') {
        const tip = String(block.content || '').replace(/\s+/g, ' ').trim()
        if (tip && !paste.isParserLabelOnly(tip)) {
          parts.push('<blockquote><p><strong>Tip:</strong> ' + esc(tip) + '</p></blockquote>')
        }
      } else if (block.type === 'quote') {
        const q = String(block.content || '').replace(/\s+/g, ' ').trim()
        if (q && !paste.isParserLabelOnly(q)) {
          parts.push('<blockquote><p>' + esc(q) + '</p></blockquote>')
        }
      }
    }
  }
  return paste.stripParserLabelsFromHtml(parts.join('\n'))
}

function wordCount(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean).length
}

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

async function main() {
  const list = await api('/landing-cms/journal-articles')
  const bySlug = Object.fromEntries((list.articles || []).map((a) => [a.slug, a]))
  const targets = [
    { n: 1, slug: 'the-gossip-we-all-pretend-we-dont-love' },
    { n: 2, slug: 'when-your-friends-secret-isnt-really-a-secret' },
    { n: 3, slug: 'things-people-say-behind-your-back' },
    { n: 4, slug: 'the-office-gossip-nobody-asked-for' },
  ].filter((t) => !ONLY.length || ONLY.includes(t.slug))

  const results = []
  for (const t of targets) {
    const existing = bySlug[t.slug]
    if (!existing) throw new Error('missing draft ' + t.slug)
    const raw = fs.readFileSync(
      path.join(__dirname, 'fixtures/journal-paste-v2', `article-${t.n}.txt`),
      'utf8',
    )
    const parsed = paste.parseArticle(raw)
    const body = serializeSections(parsed.sections)
    const payload = {
      title: parsed.title || existing.title,
      slug: parsed.slug || existing.slug,
      excerpt: parsed.excerpt || existing.excerpt,
      body,
      category: parsed.category || existing.category,
      author: existing.author || 'Between Us Editorial',
      tags: (parsed.tags && parsed.tags.length ? parsed.tags : existing.tags || []).slice(0, 8),
      locale: existing.locale || 'en',
      status: 'draft',
      seo_title: parsed.seoTitle || existing.seo_title,
      seo_description: parsed.seoDescription || existing.seo_description,
      featured_image: existing.featured_image || null,
      thumbnail_image: existing.thumbnail_image || null,
      social_image: existing.social_image || null,
      featured_image_alt: existing.featured_image_alt || null,
      related_article_ids: existing.related_article_ids || [],
      allow_missing_image: true,
      featured: !!existing.featured,
      noindex: !!existing.noindex,
    }
    const saved = await api('/landing-cms/journal-articles/' + existing.id, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    const art = saved.article || saved
    const reopen = await api('/landing-cms/journal-articles/' + existing.id)
    const a = reopen.article || reopen
    const headings = [...(a.body || '').matchAll(/<h2>(.*?)<\/h2>/g)].map((m) => m[1])
    results.push({
      n: t.n,
      id: a.id,
      idSame: a.id === existing.id,
      status: a.status,
      author: a.author,
      title: a.title,
      slug: a.slug,
      category: a.category,
      tags: a.tags,
      seo_title: a.seo_title,
      sectionCount: headings.length,
      headings,
      wordCount: wordCount(a.body),
      reading_time_minutes: a.reading_time_minutes,
      estimated: paste.estimateReadingTimeMinutes(a.body),
      leaks: /Final CTA paragraph:|FINAL VERIFICATION|<p>\s*(Paragraph|Heading|Block|Content)\s*:\s*<\/p>/i.test(a.body || ''),
      hasExpectedHeading: headings.includes(parsed.sections[0].heading),
    })
  }

  const pub = (await api('/landing-cms/journal-articles')).articles.filter((a) => a.status === 'published')
  console.log(JSON.stringify({ results, publishedCount: pub.length }, null, 2))
  const bad = results.filter((r) =>
    !r.idSame || r.status !== 'draft' || r.leaks || r.wordCount < 850,
  )
  if (bad.length || pub.length) {
    console.error('FAIL', bad)
    process.exit(1)
  }
  console.log('OK: restored drafts with full prose; still draft; nothing published')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
