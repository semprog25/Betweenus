#!/usr/bin/env node
/**
 * Restyle existing public/journal HTML to shared Between Us chrome
 * without requiring a Supabase service-role regenerate.
 */
const fs = require('fs')
const path = require('path')
const {
  atmosphereHtml,
  headerHtml,
  footerHtml,
  navScript,
  headAssets,
  storeButtonsHtml,
} = require('./public-chrome.cjs')

const ROOT = path.resolve(__dirname, '..')
const JOURNAL = path.join(ROOT, 'public', 'journal')
const SITE = 'https://betweenus.fun'

function wrapDocument({ title, description, canonical, bodyMain, active = 'journal', extraHead = '', bodyEnd = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="google-adsense-account" content="ca-pub-3084834499411817" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${canonical}" />
  ${extraHead}
  ${headAssets({ site: SITE })}
</head>
<body class="bu-static">
  <div class="bu-static-root">
  ${atmosphereHtml()}
  ${headerHtml({ site: SITE, active })}
  ${bodyMain}
  ${footerHtml({
    site: SITE,
    note: 'Editorial content is separate from anonymous community stories in the app.',
  })}
  ${navScript()}
  </div>
  ${bodyEnd}
</body>
</html>
`
}

function extractBetween(html, startRe, endRe) {
  const start = html.search(startRe)
  if (start < 0) return null
  const afterStart = html.slice(start)
  const endMatch = afterStart.search(endRe)
  if (endMatch < 0) return null
  return afterStart.slice(0, endMatch)
}

function restyleIndex() {
  const file = path.join(JOURNAL, 'index.html')
  const html = fs.readFileSync(file, 'utf8')
  const main = extractBetween(html, /<main[\s>]/i, /<\/main>/i)
  if (!main) throw new Error('Could not extract journal index main')
  let nextMain = main
    .replace(/class="shell journal-index"/, 'class="bu-static-main bu-journal-index"')
    .replace(/class="eyebrow"/g, 'class="bu-section-eyebrow"')
    .replace(/class="featured"/g, 'class="bu-journal-featured"')
    .replace(/class="filters"/g, 'class="bu-filters filters"')
    .replace(/class="filter-chip/g, 'class="bu-filter-chip filter-chip')
    .replace(/class="grid"/g, 'class="bu-journal-grid"')
    .replace(/class="card-img"/g, 'class="bu-journal-card-img"')
    .replace(/class="tag-chip"/g, 'class="bu-tag-chip"')
    .replace(/class="cta"/g, 'class="bu-journal-cta"')
    .replace(/class="btn"/g, 'class="bu-btn-primary"')
    .replace(/class="empty"/g, 'class="bu-journal-empty"')
    .replace(/style="color:var\(--muted\)"/g, 'style="color:var(--bu-muted)"')
    .replace(/<h1>/, '<h1 class="bu-section-title">')
    .replace(
      /<p style="color:var\(--bu-muted\);max-width:40rem">/,
      '<p class="bu-section-copy">'
    )
    // journal cards: wrap styling
    .replace(/<article class="journal-card"/g, '<article class="bu-journal-card journal-card"')
    .replace(/style="color:inherit;text-decoration:none"/g, '')

  // Replace bottom CTA store buttons if present with chrome badges
  if (nextMain.includes('bu-journal-cta')) {
    nextMain = nextMain.replace(
      /<aside class="bu-journal-cta"[\s\S]*?<\/aside>/,
      `<aside class="bu-journal-cta" aria-label="Download Between Us">
  <h2>Join the conversation</h2>
  <p>Get Between Us on iOS and Android — spill, react, and stay in the conversation.</p>
  ${storeButtonsHtml({ site: SITE })}
</aside>`
    )
  }

  const filterScript = extractBetween(html, /<script>\s*\(function\(\)\{/, /<\/html>/)
  const bodyEnd = filterScript ? `${filterScript}</script>` : ''

  const out = wrapDocument({
    title: 'Journal | Between Us',
    description: 'Editorial stories and reflections from Between Us — relationships, friendship, secrets, and the things worth talking about.',
    canonical: `${SITE}/journal/`,
    bodyMain: `${nextMain}</main>`,
    extraHead: `<meta property="og:type" content="website" />
  <meta property="og:title" content="Between Us Journal" />
  <meta property="og:description" content="Editorial stories and reflections from Between Us." />
  <meta property="og:url" content="${SITE}/journal/" />
  <meta property="og:image" content="${SITE}/assets/betweenus-logo.png" />
  <meta name="twitter:card" content="summary_large_image" />`,
    bodyEnd,
  })
  fs.writeFileSync(file, out)
  console.log('Restyled', file)
}

function restyleArticle(dir) {
  const file = path.join(dir, 'index.html')
  if (!fs.existsSync(file)) return
  const html = fs.readFileSync(file, 'utf8')
  const main = extractBetween(html, /<main[\s>]/i, /<\/main>/i)
  if (!main) {
    console.warn('Skip (no main):', file)
    return
  }

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i)
  const descMatch = html.match(/name="description" content="([^"]*)"/i)
  const canonicalMatch = html.match(/rel="canonical" href="([^"]*)"/i)
  const ldJson = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)]
    .map((m) => m[0])
    .join('\n  ')

  let nextMain = main
    .replace(/class="article"/, 'class="bu-static-main bu-journal-prose"')
    .replace(/class="breadcrumb"/g, 'class="bu-journal-breadcrumb"')
    .replace(/class="eyebrow"/g, 'class="bu-section-eyebrow"')
    .replace(/class="meta"/g, 'class="bu-journal-meta"')
    .replace(/class="hero-img"/g, 'class="bu-journal-hero-img"')
    .replace(/class="article-body"/g, 'class="bu-journal-body"')
    .replace(/class="cta"/g, 'class="bu-journal-cta"')
    .replace(/class="btn"/g, 'class="bu-btn-primary"')
    .replace(/class="related"/g, 'class="bu-journal-related"')
    .replace(/class="related-grid"/g, 'class="bu-journal-related-grid"')
    .replace(/class="card"/g, 'class="bu-card"')
    .replace(/style="color:var\(--muted\)"/g, 'style="color:var(--bu-muted)"')
    .replace(/color:var\(--muted\)/g, 'color:var(--bu-muted)')

  // Replace store CTA asides that still use old buttons
  nextMain = nextMain.replace(
    /<aside class="bu-journal-cta" aria-label="Download Between Us">[\s\S]*?<\/aside>/,
    `<aside class="bu-journal-cta" aria-label="Download Between Us">
  <h2>Join the conversation</h2>
  <p>Get Between Us on iOS and Android — spill, react, and stay in the conversation.</p>
  ${storeButtonsHtml({ site: SITE })}
</aside>`
  )

  const out = wrapDocument({
    title: titleMatch ? titleMatch[1] : 'Journal | Between Us',
    description: descMatch ? descMatch[1] : 'Between Us Journal',
    canonical: canonicalMatch ? canonicalMatch[1] : `${SITE}/journal/`,
    bodyMain: `${nextMain}</main>`,
    extraHead: ldJson,
  })
  fs.writeFileSync(file, out)
  console.log('Restyled', file)
}

function main() {
  restyleIndex()
  for (const name of fs.readdirSync(JOURNAL)) {
    const dir = path.join(JOURNAL, name)
    if (!fs.statSync(dir).isDirectory()) continue
    if (name.startsWith('.')) continue
    restyleArticle(dir)
  }
}

main()
