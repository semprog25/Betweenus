#!/usr/bin/env node
/**
 * Parse paste fixtures and PATCH existing draft articles (status stays draft).
 * Does not publish.
 */
const fs = require('fs')
const path = require('path')
const paste = require('../public/journal-article-parser.js')

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

function markdownToHtml(text) {
  const raw = String(text || '').replace(/\r\n/g, '\n')
  if (!raw.trim()) return ''
  const lines = raw.split('\n')
  const html = []
  let inList = false
  function closeList() {
    if (inList) {
      html.push('</ul>')
      inList = false
    }
  }
  function inlineFmt(s) {
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<u>$1</u>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
  }
  lines.forEach((line) => {
    const m = line.match(/^\s*[-*]\s+(.+)$/)
    if (m) {
      if (!inList) {
        html.push('<ul>')
        inList = true
      }
      html.push('<li>' + inlineFmt(m[1]) + '</li>')
      return
    }
    closeList()
    if (!line.trim()) return
    html.push('<p>' + inlineFmt(line) + '</p>')
  })
  closeList()
  return html.join('')
}

function serializeSections(sections) {
  const parts = []
  for (const section of sections || []) {
    const heading = String(section.heading || '').trim()
    if (heading) {
      const level = section.headingLevel === 'h1' ? 'h1' : section.headingLevel === 'h3' ? 'h3' : 'h2'
      parts.push('<' + level + '>' + esc(heading) + '</' + level + '>')
    }
    for (const block of section.blocks || []) {
      if (block.type === 'paragraph') {
        const p = markdownToHtml(block.content)
        if (p) parts.push(p)
      } else if (block.type === 'tip') {
        const tip = String(block.content || '').trim()
        if (tip) parts.push('<blockquote><p><strong>Tip:</strong> ' + esc(tip) + '</p></blockquote>')
      } else if (block.type === 'callout') {
        const call = String(block.content || '').trim()
        if (call) parts.push('<blockquote><p><strong>Note:</strong> ' + esc(call) + '</p></blockquote>')
      } else if (block.type === 'quote') {
        const q = String(block.content || '').trim()
        if (q) parts.push('<blockquote><p>' + esc(q) + '</p></blockquote>')
      } else if (block.type === 'checklist') {
        const items = (block.items || []).map((it) => String(it || '').trim()).filter(Boolean)
        if (items.length) {
          parts.push('<ul>' + items.map((it) => '<li>☐ ' + esc(it) + '</li>').join('') + '</ul>')
        }
      } else if (block.type === 'table') {
        const rows = block.rows || []
        if (!rows.length) continue
        let t = '<table><tbody>'
        rows.forEach((row, ri) => {
          t += '<tr>' + (row || []).map((cell) => {
            const tag = ri === 0 ? 'th' : 'td'
            return '<' + tag + '>' + esc(cell || '') + '</' + tag + '>'
          }).join('') + '</tr>'
        })
        t += '</tbody></table>'
        parts.push(t)
      }
    }
  }
  return parts.join('\n')
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
  try {
    data = JSON.parse(text)
  } catch {
    data = { raw: text }
  }
  if (!res.ok) throw new Error(res.status + ' ' + JSON.stringify(data))
  return data
}

async function main() {
  const list = await api('/landing-cms/journal-articles')
  const bySlug = Object.fromEntries((list.articles || []).map((a) => [a.slug, a]))
  const results = []

  for (const n of [1, 2, 3, 4]) {
    const raw = fs.readFileSync(
      path.join(__dirname, 'fixtures/journal-paste', `article-${n}.txt`),
      'utf8',
    )
    const parsed = paste.parseArticle(raw)
    const cat = paste.suggestCategory(parsed)
    const seo = paste.suggestSeo(Object.assign({}, parsed, { category: cat.value }))
    const body = serializeSections(parsed.sections)
    const payload = {
      title: parsed.title,
      slug: parsed.slug,
      excerpt: parsed.excerpt,
      body,
      category: parsed.category || cat.value,
      author: 'Between Us Editorial',
      tags: parsed.tags.slice(0, 8),
      locale: 'en',
      status: 'draft',
      seo_title: seo.seoTitle,
      seo_description: seo.seoDescription,
      featured_image: null,
      thumbnail_image: null,
      social_image: null,
      featured_image_alt: null,
      allow_missing_image: true,
      related_article_ids: [],
    }

    const existing = bySlug[parsed.slug]
    let saved
    if (existing) {
      saved = await api('/landing-cms/journal-articles/' + existing.id, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      saved = await api('/landing-cms/journal-articles', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }

    const article = saved.article || saved
    const reopen = await api('/landing-cms/journal-articles/' + article.id)
    const a = reopen.article || reopen
    results.push({
      n,
      id: a.id,
      title: a.title,
      slug: a.slug,
      status: a.status,
      category: a.category,
      tags: a.tags,
      sectionCount: parsed.sectionCount,
      blockCount: parsed.blockCount,
      blockTypes: parsed.sections.flatMap((s) => s.blocks.map((b) => b.type)),
      bodyLen: (a.body || '').length,
      seo_title: a.seo_title,
      preserved: a.title === parsed.title && a.status === 'draft' && (a.body || '').includes('<h2>'),
    })
  }

  console.log(JSON.stringify(results, null, 2))
  const bad = results.filter((r) => r.status !== 'draft' || !r.preserved)
  if (bad.length) {
    console.error('FAIL', bad)
    process.exit(1)
  }
  console.log('OK: 4 drafts updated via paste parser serialization')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
