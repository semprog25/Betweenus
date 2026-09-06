#!/usr/bin/env node
/**
 * One-off patch: add Google Preferred Sources to existing static Journal article HTML.
 * Safe to re-run — skips files that already include the publisher script.
 */
const fs = require('fs')
const path = require('path')
const {
  preferredSourceHeadScript,
  preferredSourceAsideHtml,
} = require('./public-chrome.cjs')

const ROOT = path.resolve(__dirname, '..')
const JOURNAL_DIR = path.join(ROOT, 'public', 'journal')
const HEAD_SNIPPET = preferredSourceHeadScript()
const ASIDE_SNIPPET = preferredSourceAsideHtml()

function patchArticle(filePath) {
  let html = fs.readFileSync(filePath, 'utf8')
  let changed = false
  if (!html.includes('news.google.com/swg/js/v1/publisher.js')) {
    html = html.replace(/<\/head>/, `  ${HEAD_SNIPPET}\n</head>`)
    changed = true
  }
  const bottomCta = '<aside class="bu-journal-cta" aria-label="Download Between Us">'
  if (!html.includes('bu-journal-preferred-source') && html.includes(bottomCta)) {
    html = html.replace(bottomCta, `${ASIDE_SNIPPET}\n    ${bottomCta}`)
    changed = true
  }
  if (!changed) {
    return { filePath, status: 'skipped' }
  }
  fs.writeFileSync(filePath, html)
  return { filePath, status: 'patched' }
}

function walkArticles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const indexHtml = path.join(full, 'index.html')
      if (fs.existsSync(indexHtml)) files.push(indexHtml)
    }
  }
  return files
}

const results = walkArticles(JOURNAL_DIR).map(patchArticle)
for (const r of results) {
  console.log(`${r.status}: ${path.relative(ROOT, r.filePath)}`)
}
