#!/usr/bin/env node
/**
 * Replace content of existing journal drafts from paste-v2 fixtures.
 * Preserves id, author, draft status. Does not publish. No images.
 */
const fs = require('fs')
const path = require('path')

const EDGE = process.env.BU_EDGE
const ANON = process.env.BU_ANON
const TOKEN = process.env.BU_TOKEN

if (!EDGE || !ANON || !TOKEN) {
  console.error('Need BU_EDGE, BU_ANON, BU_TOKEN')
  process.exit(1)
}

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function normalizeTag(t) {
  return String(t || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '').slice(0, 40)
}

function parseTags(raw) {
  const out = []
  String(raw || '').split(/[,;\n]+/).forEach((p) => {
    const t = normalizeTag(p)
    if (t && out.indexOf(t) < 0) out.push(t)
  })
  return out.slice(0, 8)
}

/** Split block body on blank lines into natural prose chunks; keep emphasis lines. */
function splitNaturalParagraphs(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((chunk) => chunk.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function parseV2(rawText) {
  const lines = String(rawText || '').replace(/\r\n/g, '\n').split('\n')
  const meta = {
    title: '', slug: '', excerpt: '', category: '', tags: [],
    seoTitle: '', seoDescription: '', seoKeywords: '',
  }
  const sections = []
  let mode = 'meta'
  let field = null
  let buf = []
  let section = null
  let blockType = null
  let blockBuf = []

  function flushField() {
    if (!field) return
    const value = buf.join('\n').trim()
    if (field === 'tags') meta.tags = parseTags(value)
    else if (field === 'seoKeywords') meta.seoKeywords = value
    else meta[field] = value
    field = null
    buf = []
  }

  function flushBlock() {
    if (!blockType || !section) {
      blockType = null
      blockBuf = []
      return
    }
    const body = blockBuf.join('\n').replace(/^\n+|\n+$/g, '')
    if (blockType === 'callout' || blockType === 'tip') {
      const content = body.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim()
      if (content) section.blocks.push({ type: blockType, content })
    } else {
      splitNaturalParagraphs(body).forEach((p) => {
        section.blocks.push({ type: 'paragraph', content: p })
      })
    }
    blockType = null
    blockBuf = []
  }

  function flushSection() {
    flushBlock()
    if (section) sections.push(section)
    section = null
  }

  const fieldMap = {
    title: 'title',
    slug: 'slug',
    excerpt: 'excerpt',
    category: 'category',
    tags: 'tags',
    'seo title': 'seoTitle',
    'seo description': 'seoDescription',
    keywords: 'seoKeywords',
    'seo keywords': 'seoKeywords',
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    if (/^sections?\s*:?\s*$/i.test(trimmed)) {
      flushField()
      mode = 'sections'
      continue
    }
    if (/^section\s*0*\d+\s*:?\s*$/i.test(trimmed)) {
      flushField()
      flushSection()
      section = { heading: '', blocks: [] }
      mode = 'section'
      continue
    }

    const m = line.match(/^([A-Za-z][A-Za-z0-9 _]{0,40})\s*:\s*(.*)$/)
    const key = m ? m[1].toLowerCase().trim() : null
    const rest = m ? m[2] : ''

    if (mode === 'meta') {
      if (key && fieldMap[key]) {
        flushField()
        field = fieldMap[key]
        buf = rest ? [rest] : []
        continue
      }
      if (field) buf.push(line)
      continue
    }

    if (key === 'heading') {
      flushBlock()
      if (!section) section = { heading: '', blocks: [] }
      if (rest.trim()) section.heading = rest.trim()
      else {
        // next non-empty line(s) until blank or next key
        const hbuf = []
        while (i + 1 < lines.length) {
          const n = lines[i + 1]
          if (/^[A-Za-z][A-Za-z0-9 _]{0,40}\s*:/.test(n) || /^section\s*0*\d+/i.test(n.trim())) break
          i++
          if (!n.trim() && hbuf.length) break
          if (n.trim()) hbuf.push(n.trim())
        }
        section.heading = hbuf.join(' ').trim()
      }
      continue
    }

    if (key === 'paragraph' || key === 'callout' || key === 'tip') {
      flushBlock()
      if (!section) section = { heading: '', blocks: [] }
      blockType = key
      blockBuf = rest ? [rest] : []
      continue
    }

    if (blockType) {
      if (key === 'heading' || key === 'paragraph' || key === 'callout' || key === 'tip' || /^section\s*0*\d+/i.test(trimmed)) {
        i--
        flushBlock()
        continue
      }
      blockBuf.push(line)
    }
  }
  flushField()
  flushSection()
  return { ...meta, sections }
}

function serializeSections(sections) {
  const parts = []
  for (const section of sections || []) {
    const heading = String(section.heading || '').trim()
    if (heading) parts.push('<h2>' + esc(heading) + '</h2>')
    for (const block of section.blocks || []) {
      if (block.type === 'paragraph') {
        const t = String(block.content || '').trim()
        if (t) parts.push('<p>' + esc(t) + '</p>')
      } else if (block.type === 'tip') {
        const tip = String(block.content || '').trim()
        if (tip) parts.push('<blockquote><p><strong>Tip:</strong> ' + esc(tip) + '</p></blockquote>')
      } else if (block.type === 'callout') {
        const call = String(block.content || '').trim()
        if (call) parts.push('<blockquote><p><strong>Note:</strong> ' + esc(call) + '</p></blockquote>')
      }
    }
  }
  return parts.join('\n')
}

function wordCountFromHtml(html) {
  const text = String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return 0
  return text.split(' ').length
}

function oneSentenceParagraphRate(html) {
  const ps = [...String(html || '').matchAll(/<p>(.*?)<\/p>/gis)].map((m) => m[1].replace(/<[^>]+>/g, '').trim())
  if (!ps.length) return { total: 0, oneSentence: 0, rate: 0 }
  const one = ps.filter((p) => (p.match(/[.!?…]["”']?\s*$/) || p.length < 80) && !p.includes('. ') && !p.includes('? ') && !p.includes('! ')).length
  return { total: ps.length, oneSentence: one, rate: one / ps.length }
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
  const results = []

  for (const n of [1, 2, 3, 4]) {
    const raw = fs.readFileSync(
      path.join(__dirname, 'fixtures/journal-paste-v2', `article-${n}.txt`),
      'utf8',
    )
    const parsed = parseV2(raw)
    const existing = bySlug[parsed.slug]
    if (!existing) throw new Error('Missing draft for slug ' + parsed.slug)

    const body = serializeSections(parsed.sections)
    const payload = {
      title: parsed.title,
      slug: parsed.slug,
      excerpt: parsed.excerpt,
      body,
      category: parsed.category,
      author: existing.author || 'Between Us Editorial',
      tags: parsed.tags,
      locale: existing.locale || 'en',
      status: 'draft',
      seo_title: parsed.seoTitle || null,
      seo_description: parsed.seoDescription || null,
      // preserve existing media fields (should be empty)
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
    const article = saved.article || saved
    if (article.id !== existing.id) throw new Error('ID changed!')
    if (article.status !== 'draft') throw new Error('Status not draft')

    const reopen = await api('/landing-cms/journal-articles/' + existing.id)
    const a = reopen.article || reopen

    const words = wordCountFromHtml(a.body)
    const paraStats = oneSentenceParagraphRate(a.body)
    const h2Count = (a.body.match(/<h2>/g) || []).length
    const calloutCount = (a.body.match(/<strong>Note:<\/strong>/g) || []).length
    const pCount = (a.body.match(/<p>/g) || []).length

    const checks = {
      idSame: a.id === existing.id,
      statusDraft: a.status === 'draft',
      authorSame: a.author === existing.author,
      title: a.title === parsed.title,
      slug: a.slug === parsed.slug,
      excerpt: a.excerpt === parsed.excerpt,
      category: a.category === parsed.category,
      tags: JSON.stringify(a.tags || []) === JSON.stringify(parsed.tags),
      seoTitle: a.seo_title === parsed.seoTitle,
      seoDesc: a.seo_description === parsed.seoDescription,
      sections: h2Count === parsed.sections.length,
      bodyHasContent: (a.body || '').length > 500,
      noFeaturedImage: !a.featured_image,
    }

    results.push({
      n,
      id: a.id,
      title: a.title,
      slug: a.slug,
      status: a.status,
      author: a.author,
      category: a.category,
      tags: a.tags,
      sectionCount: h2Count,
      paragraphTags: pCount,
      callouts: calloutCount,
      wordCount: words,
      paraStats,
      checks,
      ok: Object.values(checks).every(Boolean),
    })
  }

  const pubCheck = await api('/landing-cms/journal-articles')
  const published = (pubCheck.articles || []).filter((a) => a.status === 'published')

  console.log(JSON.stringify({ results, publishedCount: published.length }, null, 2))
  if (results.some((r) => !r.ok) || published.length) {
    console.error('FAIL')
    process.exit(1)
  }
  console.log('OK: 4 drafts updated in place; none published')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
