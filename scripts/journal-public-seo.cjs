/**
 * Absolute canonicals, Open Graph tags, and visible FAQ blocks for Journal HTML.
 * Used by generate:marketing (patches committed pages) and generateJournal (future renders).
 * Does not read or write Supabase.
 */
const fs = require('fs')
const path = require('path')

const SITE = 'https://betweenus.fun'
const ROOT = path.join(__dirname, '..')
const OVERLAY_PATH = path.join(ROOT, 'content', 'journal-faq.json')

function decodeHtml(value) {
  return String(value || '')
    .replace(/&amp;amp;/g, '&amp;')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function loadJournalFaq() {
  if (!fs.existsSync(OVERLAY_PATH)) return {}
  const data = JSON.parse(fs.readFileSync(OVERLAY_PATH, 'utf8'))
  return data.articles || data
}

function faqJsonLd(faq) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: String(item.answer || '').replace(/<[^>]+>/g, '').trim(),
      },
    })),
  }
}

function journalFaqHtml(faq) {
  if (!faq || !faq.length) return ''
  const blocks = faq
    .map(
      (item) =>
        `<h3>${escapeHtml(item.question)}</h3>\n<p>${escapeHtml(item.answer)}</p>`
    )
    .join('\n')
  return `<section class="bu-journal-faq" id="faq">\n<h2>Common questions</h2>\n${blocks}\n</section>\n`
}

function socialMeta({ title, description, url, image }) {
  const safeTitle = escapeHtml(title)
  const safeDesc = escapeHtml(description)
  const safeUrl = escapeHtml(url)
  const safeImage = escapeHtml(image)
  return [
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="Between Us" />`,
    `<meta property="og:title" content="${safeTitle}" />`,
    `<meta property="og:description" content="${safeDesc}" />`,
    `<meta property="og:url" content="${safeUrl}" />`,
    `<meta property="og:image" content="${safeImage}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${safeTitle}" />`,
    `<meta name="twitter:description" content="${safeDesc}" />`,
    `<meta name="twitter:image" content="${safeImage}" />`,
  ].join('\n  ')
}

function canonicalForSlug(slug) {
  return `${SITE}/journal/${slug}/`
}

/**
 * Force a CMS or relative canonical onto the public journal article URL.
 * @param {string} value
 * @param {string} fallback absolute article URL
 */
function absoluteArticleCanonical(value, fallback) {
  const raw = String(value || '').trim()
  let url = fallback
  if (/^https?:\/\//i.test(raw)) url = raw
  else if (raw.startsWith('/')) url = `${SITE}${raw}`
  if (/\/journal\/[^/?#]+$/.test(url)) url += '/'
  return url
}

function patchArticleHtml(html, slug) {
  const canonical = canonicalForSlug(slug)
  const faq = loadJournalFaq()[slug] || []
  let next = html.replace(
    /<link rel="canonical" href="[^"]*"\s*\/>/,
    `<link rel="canonical" href="${canonical}" />`
  )

  const title = decodeHtml((next.match(/<title>([^<]*)<\/title>/) || [])[1] || 'Between Us Journal')
  const description = decodeHtml(
    (next.match(/<meta name="description" content="([^"]*)"/) || [])[1] || ''
  )
  const imageMatch = next.match(/"image":\["([^"]+)"\]/)
  const image = imageMatch ? imageMatch[1] : `${SITE}/assets/betweenus-logo.png`

  if (!next.includes('property="og:title"')) {
    next = next.replace(
      /<link rel="canonical" href="[^"]*"\s*\/>/,
      `<link rel="canonical" href="${canonical}" />\n  ${socialMeta({
        title,
        description,
        url: canonical,
        image,
      })}`
    )
  } else {
    next = next.replace(
      /<meta property="og:url" content="[^"]*"\s*\/>/,
      `<meta property="og:url" content="${canonical}" />`
    )
  }

  next = next.replace(/"mainEntityOfPage":"[^"]*"/, `"mainEntityOfPage":"${canonical}"`)
  const bare = `${SITE}/journal/${slug}`
  next = next.split(`${bare}"`).join(`${canonical}"`)
  next = next.split(`${bare}/"`).join(`${canonical}"`)

  next = next.replace(/&amp;amp;/g, '&amp;')

  if (faq.length && !next.includes('"@type":"FAQPage"') && !next.includes('id="faq"')) {
    const ld = `<script type="application/ld+json">${JSON.stringify(faqJsonLd(faq))}</script>`
    next = next.replace(
      /(<script type="application\/ld\+json">\{"@context":"https:\/\/schema.org","@type":"BreadcrumbList"[\s\S]*?<\/script>)/,
      `$1\n  ${ld}`
    )
    const faqBlock = journalFaqHtml(faq)
    const ctaPattern = /<\/div>\s*<aside class="bu-journal-cta" aria-label="Share your story">/
    if (ctaPattern.test(next)) {
      next = next.replace(
        ctaPattern,
        `${faqBlock}</div>\n    <aside class="bu-journal-cta" aria-label="Share your story">`
      )
    }
  }

  return next
}

function patchJournalIndexHtml(html) {
  let next = html
  if (!next.includes('property="og:site_name"')) {
    next = next.replace(
      '<meta property="og:type" content="website" />',
      '<meta property="og:type" content="website" />\n  <meta property="og:site_name" content="Between Us" />'
    )
  }
  if (!next.includes('name="twitter:title"')) {
    next = next.replace(
      '<meta name="twitter:card" content="summary_large_image" />',
      `<meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Journal | Between Us" />
  <meta name="twitter:description" content="Editorial stories and reflections from Between Us — relationships, friendship, secrets, and the things worth talking about." />
  <meta name="twitter:image" content="${SITE}/assets/betweenus-logo.png" />`
    )
  }
  if (!next.includes('"@type":"Blog"')) {
    const ld = `<script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: 'Between Us Journal',
      description:
        'Editorial stories and reflections from Between Us — relationships, friendship, secrets, and the things worth talking about.',
      url: `${SITE}/journal/`,
      publisher: { '@type': 'Organization', name: 'Between Us', url: SITE },
    })}</script>`
    next = next.replace('</head>', `  ${ld}\n</head>`)
  }
  return next
}

function patchJournalPublicHtml(publicDir) {
  const journalDir = path.join(publicDir, 'journal')
  if (!fs.existsSync(journalDir)) return
  const indexPath = path.join(journalDir, 'index.html')
  if (fs.existsSync(indexPath)) {
    const before = fs.readFileSync(indexPath, 'utf8')
    const after = patchJournalIndexHtml(before)
    if (after !== before) {
      fs.writeFileSync(indexPath, after)
      console.log('patched journal/index.html SEO')
    }
  }
  for (const name of fs.readdirSync(journalDir)) {
    const dir = path.join(journalDir, name)
    if (!fs.statSync(dir).isDirectory()) continue
    const articlePath = path.join(dir, 'index.html')
    if (!fs.existsSync(articlePath)) continue
    const before = fs.readFileSync(articlePath, 'utf8')
    const after = patchArticleHtml(before, name)
    if (after !== before) {
      fs.writeFileSync(articlePath, after)
      console.log('patched journal SEO', name)
    }
  }
}

module.exports = {
  SITE,
  loadJournalFaq,
  faqJsonLd,
  journalFaqHtml,
  absoluteArticleCanonical,
  patchArticleHtml,
  patchJournalIndexHtml,
  patchJournalPublicHtml,
}
