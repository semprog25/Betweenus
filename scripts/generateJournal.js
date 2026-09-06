#!/usr/bin/env node
/**
 * Between Us Journal static site generator.
 *
 * Reads published editorial articles from Supabase (service role — build env only)
 * and writes SEO-friendly HTML into public/journal/ (copied to betweenus_landing via deploy).
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/generateJournal.js
 *
 * Never emits service-role / GitHub secrets into HTML or client JS.
 */
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = process.env.JOURNAL_OUT_DIR
  ? path.resolve(process.env.JOURNAL_OUT_DIR)
  : path.join(ROOT, 'public', 'journal')
const SITEMAP_PATH = process.env.JOURNAL_SITEMAP_PATH
  ? path.resolve(process.env.JOURNAL_SITEMAP_PATH)
  : path.join(ROOT, 'public', 'sitemap.xml')
const SITE = 'https://betweenus.fun'
const PROJECT_URL = process.env.SUPABASE_URL || 'https://qoqbdiixztolvtcjdnle.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.betweenus.app'
const HAS_APP_STORE_LISTING = process.env.HAS_APP_STORE_LISTING === 'true'

const {
  injectInContentAds,
  adsenseHeadSnippet,
  adSlotCss,
  loadAdConfigFromEnv,
  renderAdSlotHtml,
  isAdsLive,
} = require('./journal-ad-placement.cjs')

const {
  atmosphereHtml,
  headerHtml,
  footerHtml,
  navScript,
  headAssets,
  preferredSourceHeadScript,
  preferredSourceAsideHtml,
  storeButtonsHtml: chromeStoreButtons,
} = require('./public-chrome.cjs')

/** Ads stay off until real ca-pub + slot IDs + BETWEENUS_ADSENSE_CONSENT_READY=true */
const AD_CONFIG = loadAdConfigFromEnv(process.env)
const ADS_LIVE = isAdsLive(AD_CONFIG)

const THEMES = ['rose', 'violet', 'sunset', 'ocean']

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function publicImageUrl(ref) {
  if (!ref) return ''
  if (/^https?:\/\//i.test(ref) || ref.startsWith('/')) return ref
  return `${PROJECT_URL}/storage/v1/object/public/journal-images/${ref.replace(/^\//, '')}`
}

function isLiveArticle(row, now = Date.now()) {
  if (row.status === 'published') return true
  if (row.status === 'scheduled' && row.published_at) {
    return new Date(row.published_at).getTime() <= now
  }
  return false
}

function articleUrl(article) {
  if (article.locale && article.locale !== 'en') {
    return `${SITE}/${article.locale}/journal/${article.slug}/`
  }
  return `${SITE}/journal/${article.slug}/`
}

/** Root-relative article path for in-page links (local preview + production). */
function articleHref(article) {
  return articleUrl(article).replace(SITE, '')
}

function articlePath(article) {
  if (article.locale && article.locale !== 'en') {
    return path.join(ROOT, 'public', article.locale, 'journal', article.slug, 'index.html')
  }
  return path.join(OUT_DIR, article.slug, 'index.html')
}

function sharedCss() {
  // Page-specific overrides only — chrome tokens live in /bu-public.css + /bu-journal.css
  return `
${adSlotCss()}
`
}

function storeButtonsHtml() {
  return chromeStoreButtons({
    site: SITE,
    playStoreUrl: PLAY_STORE_URL,
    hasAppStore: HAS_APP_STORE_LISTING,
  })
}

function pageHeaderHtml() {
  return headerHtml({ site: SITE, active: 'journal' })
}

function pageFooterHtml() {
  return footerHtml({
    site: SITE,
    note: 'Editorial content is separate from anonymous community stories in the app.',
  })
}

function pageShellOpen() {
  return `${atmosphereHtml()}
${pageHeaderHtml()}`
}

function pageShellClose() {
  return `${pageFooterHtml()}
${navScript()}`
}

function ctaHtml(kind) {
  if (kind === 'mid') {
    return `<aside class="bu-journal-cta" aria-label="Share your story">
  <h2>Have your own story?</h2>
  <p>Share it anonymously on Between Us — no public identity attached.</p>
  <a class="bu-btn-primary" href="/?utm_source=journal&utm_medium=article&utm_campaign=mid_cta">Join Between Us</a>
</aside>`
  }
  return `<aside class="bu-journal-cta" aria-label="Download Between Us">
  <h2>Join the conversation</h2>
  <p>Get Between Us on iOS and Android — spill, react, and stay in the conversation.</p>
  ${storeButtonsHtml()}
</aside>`
}

function relatedHtml(article, allLive) {
  const relatedIds = Array.isArray(article.related_article_ids) ? article.related_article_ids : []
  let related = allLive.filter((a) => relatedIds.includes(a.id) && a.id !== article.id)
  if (related.length < 3) {
    const more = allLive
      .filter((a) => a.id !== article.id && a.category === article.category && !related.some((r) => r.id === a.id))
      .slice(0, 3 - related.length)
    related = related.concat(more)
  }
  if (related.length < 3) {
    const more = allLive
      .filter((a) => a.id !== article.id && !related.some((r) => r.id === a.id))
      .slice(0, 3 - related.length)
    related = related.concat(more)
  }
  if (!related.length) return ''
  return `<section class="bu-journal-related" aria-label="Related articles">
  <h2>Related articles</h2>
  <div class="bu-journal-related-grid">
    ${related.map((r) => `<a class="bu-card" href="${escapeHtml(articleHref(r))}"><strong>${escapeHtml(r.title)}</strong><br /><span style="color:var(--bu-muted);font-size:.85rem">${escapeHtml(r.excerpt || '').slice(0, 120)}</span></a>`).join('')}
  </div>
</section>`
}

function renderArticle(article, allLive) {
  const url = articleUrl(article)
  const title = article.seo_title || `${article.title} | Between Us Journal`
  const description = article.seo_description || article.excerpt || ''
  const image = publicImageUrl(article.social_image || article.featured_image) || `${SITE}/assets/betweenus-logo.png`
  const published = article.published_at || article.updated_at
  const modified = article.updated_at || published
  const canonical = article.canonical_url || url
  const robots = article.noindex ? 'noindex,follow' : 'index,follow'
  // Ads are presentation-only — article.body from CMS stays content-only
  const injected = injectInContentAds(article.body || '', AD_CONFIG)
  const afterAd = injected.useAfterContent
    ? renderAdSlotHtml('article-after-content', AD_CONFIG, injected.emitAfterContent)
    : ''
  const jsonLdArticle = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description,
    image: [image],
    datePublished: published,
    dateModified: modified,
    author: { '@type': 'Person', name: article.author || 'Between Us Editorial' },
    publisher: {
      '@type': 'Organization',
      name: 'Between Us',
      logo: { '@type': 'ImageObject', url: `${SITE}/assets/betweenus-logo.png` },
    },
    mainEntityOfPage: canonical,
  }
  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: 'Journal', item: SITE + '/journal/' },
      { '@type': 'ListItem', position: 3, name: article.title, item: url },
    ],
  }

  return `<!DOCTYPE html>
<html lang="${escapeHtml(article.locale || 'en')}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="google-adsense-account" content="ca-pub-3084834499411817" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta name="robots" content="${robots}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Between Us" />
  <meta property="og:title" content="${escapeHtml(article.seo_title || article.title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(url)}" />
  <meta property="og:image" content="${escapeHtml(image)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(article.seo_title || article.title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${escapeHtml(image)}" />
  ${headAssets({ site: SITE })}
  <style>${sharedCss()}</style>
  ${adsenseHeadSnippet(AD_CONFIG)}
  <script type="application/ld+json">${JSON.stringify(jsonLdArticle)}</script>
  <script type="application/ld+json">${JSON.stringify(jsonLdBreadcrumb)}</script>
  ${preferredSourceHeadScript()}
</head>
<body class="bu-static">
  <div class="bu-static-root">
  ${pageShellOpen()}
  <main class="bu-static-main bu-journal-prose">
    <nav class="bu-journal-breadcrumb" aria-label="Breadcrumb"><a href="/">Home</a> · <a href="/journal/">Journal</a> · ${escapeHtml(article.category || 'Editorial')}</nav>
    <p class="bu-section-eyebrow">Between Us Journal · Editorial</p>
    <p class="bu-journal-meta" style="margin:0">${escapeHtml(article.category || '')}</p>
    <h1>${escapeHtml(article.title)}</h1>
    ${article.subtitle ? `<p style="font-size:1.15rem;color:var(--bu-muted)">${escapeHtml(article.subtitle)}</p>` : ''}
    <p class="bu-journal-meta">By ${escapeHtml(article.author || 'Between Us Editorial')} · ${escapeHtml(new Date(published).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))}${article.reading_time_minutes ? ` · ${article.reading_time_minutes} min read` : ''}</p>
    ${article.featured_image ? `<img class="bu-journal-hero-img" src="${escapeHtml(publicImageUrl(article.featured_image))}" alt="${escapeHtml(article.featured_image_alt || article.title)}" width="1200" height="675" fetchpriority="high" />` : ''}
    <div class="bu-journal-body">${injected.html}</div>
    ${ctaHtml('mid')}
    ${afterAd}
    ${relatedHtml(article, allLive)}
    ${preferredSourceAsideHtml()}
    ${ctaHtml('bottom')}
  </main>
  ${pageShellClose()}
  </div>
</body>
</html>`
}

function cardImage(article) {
  return publicImageUrl(article.thumbnail_image || article.featured_image)
}

function renderIndex(live) {
  const featured = live.find((a) => a.featured) || live[0] || null
  const latest = live.filter((a) => !featured || a.id !== featured.id)
  const preferredCats = [
    'Confessions', 'Dating', 'Friend Drama', 'Work Drama', 'Family Drama',
    'Celebrity', 'Funny Stories', 'Advice', 'Hot Takes', 'Social Media',
  ]
  const liveCats = [...new Set(live.map((a) => a.category).filter(Boolean))]
  const categories = [
    ...preferredCats.filter((c) => liveCats.includes(c)),
    ...liveCats.filter((c) => !preferredCats.includes(c)),
  ]
  const tags = [...new Set(live.flatMap((a) => Array.isArray(a.tags) ? a.tags : []).filter(Boolean))]
    .sort()
    .slice(0, 40)

  const featuredImg = featured ? cardImage(featured) : null
  const featuredBlock = featured
    ? `<section class="bu-journal-featured" aria-label="Featured article" data-category="${escapeHtml(featured.category || '')}" data-tags="${escapeHtml((featured.tags || []).join(','))}">
  <div>
    <p class="bu-section-eyebrow">Featured</p>
    <h2 style="margin:.25rem 0 .75rem;font-size:1.75rem;font-family:Syne,system-ui,sans-serif"><a href="${escapeHtml(articleHref(featured))}" style="color:inherit;text-decoration:none">${escapeHtml(featured.title)}</a></h2>
    <p style="color:var(--bu-muted)">${escapeHtml(featured.excerpt || '')}</p>
    <p><a class="bu-btn-primary" href="${escapeHtml(articleHref(featured))}">Read article</a></p>
  </div>
  ${featuredImg ? `<img src="${escapeHtml(featuredImg)}" alt="${escapeHtml(featured.featured_image_alt || featured.title)}" width="800" height="450" />` : ''}
</section>`
    : `<div class="bu-journal-empty"><p>No Journal articles published yet.</p><p>Editorial stories will appear here once the team publishes the first piece.</p></div>`

  const cards = latest.map((a) => {
    const img = cardImage(a)
    const tagAttr = (a.tags || []).join(',')
    const tagHtml = (a.tags || []).slice(0, 4).map((t) => `<span class="bu-tag-chip">#${escapeHtml(t)}</span>`).join('')
    return `<article class="bu-journal-card journal-card" data-category="${escapeHtml(a.category || '')}" data-tags="${escapeHtml(tagAttr)}">
  <a href="${escapeHtml(articleHref(a))}">
    ${img ? `<img class="bu-journal-card-img" src="${escapeHtml(img)}" alt="${escapeHtml(a.featured_image_alt || a.title)}" loading="lazy" width="640" height="360" />` : ''}
    <p class="bu-section-eyebrow">${escapeHtml(a.category || '')}</p>
    <h3 style="margin:.25rem 0;font-family:Syne,system-ui,sans-serif;color:#fff">${escapeHtml(a.title)}</h3>
    <p style="color:var(--bu-muted);font-size:.92rem">${escapeHtml(a.excerpt || '')}</p>
    ${tagHtml ? `<p style="margin:.35rem 0 0">${tagHtml}</p>` : ''}
  </a>
</article>`
  }).join('\n')

  const catFilters = [
    `<button type="button" class="bu-filter-chip filter-chip active" data-filter-type="category" data-filter-value="all" aria-pressed="true">All</button>`,
    ...categories.map((c) => `<button type="button" class="bu-filter-chip filter-chip" data-filter-type="category" data-filter-value="${escapeHtml(c)}" aria-pressed="false">${escapeHtml(c)}</button>`),
  ].join('')
  const tagFilters = tags.map((t) => `<button type="button" class="bu-filter-chip filter-chip" data-filter-type="tag" data-filter-value="${escapeHtml(t)}" aria-pressed="false">#${escapeHtml(t)}</button>`).join('')

  const filterScript = `<script>
(function(){
  var cat='all', tag='';
  var chips=document.querySelectorAll('.filter-chip');
  var cards=document.querySelectorAll('.journal-card');
  function apply(){
    cards.forEach(function(card){
      var c=(card.getAttribute('data-category')||'');
      var tags=(card.getAttribute('data-tags')||'').split(',').filter(Boolean);
      var okCat=cat==='all'||c===cat;
      var okTag=!tag||tags.indexOf(tag)>=0;
      card.hidden=!(okCat&&okTag);
    });
  }
  chips.forEach(function(chip){
    chip.addEventListener('click',function(){
      var type=chip.getAttribute('data-filter-type');
      var value=chip.getAttribute('data-filter-value')||'';
      if(type==='category'){
        cat=value;
        chips.forEach(function(c){ if(c.getAttribute('data-filter-type')==='category'){ c.classList.toggle('active',c===chip); c.setAttribute('aria-pressed',c===chip?'true':'false'); }});
      } else {
        tag = (tag===value) ? '' : value;
        chips.forEach(function(c){ if(c.getAttribute('data-filter-type')==='tag'){ var on=c.getAttribute('data-filter-value')===tag; c.classList.toggle('active',on); c.setAttribute('aria-pressed',on?'true':'false'); }});
      }
      apply();
    });
  });
})();
</script>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="google-adsense-account" content="ca-pub-3084834499411817" />
  <title>Journal | Between Us</title>
  <meta name="description" content="Editorial stories and reflections from Between Us — relationships, friendship, secrets, and the things worth talking about." />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${SITE}/journal/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Between Us Journal" />
  <meta property="og:description" content="Editorial stories and reflections from Between Us." />
  <meta property="og:url" content="${SITE}/journal/" />
  <meta property="og:image" content="${SITE}/assets/betweenus-logo.png" />
  <meta name="twitter:card" content="summary_large_image" />
  ${headAssets({ site: SITE })}
  <style>${sharedCss()}</style>
</head>
<body class="bu-static">
  <div class="bu-static-root">
  ${pageShellOpen()}
  <main class="bu-static-main bu-journal-index">
    <p class="bu-section-eyebrow">Between Us Journal</p>
    <h1 class="bu-section-title">Editorial stories &amp; reflections</h1>
    <p class="bu-section-copy">Confessions, dating drama, advice, and the messy middle of relationships. Separate from the anonymous community Stories feed.</p>
    ${featuredBlock}
    <section aria-label="Filter Journal">
      <div class="bu-filters filters" role="toolbar" aria-label="Category filters">${catFilters}</div>
      ${tagFilters ? `<div class="bu-filters filters" role="toolbar" aria-label="Tag filters">${tagFilters}</div>` : ''}
    </section>
    <section aria-label="Latest articles">
      <h2 style="font-family:Syne,system-ui,sans-serif;color:#fff">Latest</h2>
      ${latest.length ? `<div class="bu-journal-grid">${cards}</div>` : (featured ? '<p style="color:var(--bu-muted)">More stories coming soon.</p>' : '')}
    </section>
    ${ctaHtml('bottom')}
  </main>
  ${pageShellClose()}
  </div>
  ${filterScript}
</body>
</html>`
}

function writeHomeCards(live) {
  const cards = live.slice(0, 4).map((a, i) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    copy: a.excerpt || '',
    theme: THEMES[i % THEMES.length],
    imageUrl: publicImageUrl(a.thumbnail_image || a.featured_image) || '/assets/journal/healing-breakup.jpg',
    imageAlt: a.featured_image_alt || a.title,
    href: `/journal/${a.slug}/`,
  }))
  const payload = {
    generatedAt: new Date().toISOString(),
    articles: cards,
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(path.join(OUT_DIR, 'home-cards.json'), JSON.stringify(payload, null, 2))
  fs.writeFileSync(path.join(OUT_DIR, 'articles.json'), JSON.stringify({
    generatedAt: payload.generatedAt,
    articles: live.map((a) => ({
      id: a.id,
      slug: a.slug,
      locale: a.locale,
      title: a.title,
      excerpt: a.excerpt,
      category: a.category,
      tags: a.tags || [],
      author: a.author,
      featured: a.featured,
      publishedAt: a.published_at,
      href: articleUrl(a).replace(SITE, ''),
      imageUrl: publicImageUrl(a.thumbnail_image || a.featured_image),
    })),
  }, null, 2))
}

function updateSitemap(live) {
  const sitemapPath = SITEMAP_PATH
  const urls = [
    { loc: `${SITE}/`, changefreq: 'hourly', priority: '1.0' },
    { loc: `${SITE}/journal/`, changefreq: 'weekly', priority: '0.9' },
    { loc: `${SITE}/stories`, changefreq: 'hourly', priority: '0.8' },
    { loc: `${SITE}/privacy`, changefreq: 'monthly', priority: '0.4' },
    { loc: `${SITE}/terms`, changefreq: 'monthly', priority: '0.4' },
    { loc: `${SITE}/support`, changefreq: 'monthly', priority: '0.4' },
  ]
  for (const a of live) {
    if (a.noindex) continue
    urls.push({
      loc: articleUrl(a),
      lastmod: (a.updated_at || a.published_at || '').slice(0, 10),
      changefreq: 'monthly',
      priority: '0.7',
    })
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`
  fs.writeFileSync(sitemapPath, xml)
}

async function fetchArticles() {
  if (!SERVICE_KEY && !ANON_KEY) {
    throw new Error('Set SUPABASE_SERVICE_ROLE_KEY (preferred) or SUPABASE_ANON_KEY for generateJournal')
  }
  const key = SERVICE_KEY || ANON_KEY
  if (!SERVICE_KEY) {
    console.warn('[generateJournal] Using anon key — RLS blocks public reads; prefer SUPABASE_SERVICE_ROLE_KEY')
  }
  const supabase = createClient(PROJECT_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await supabase
    .from('journal_articles')
    .select('*')
    .in('status', ['published', 'scheduled'])
    .order('published_at', { ascending: false })
  if (error) throw error
  return data || []
}

function cleanGeneratedDirs(live) {
  // Remove stale English article dirs not in live set (keep index + json)
  if (!fs.existsSync(OUT_DIR)) return
  const keep = new Set(['index.html', 'home-cards.json', 'articles.json', 'feed.xml'])
  live.filter((a) => !a.locale || a.locale === 'en').forEach((a) => keep.add(a.slug))
  for (const name of fs.readdirSync(OUT_DIR)) {
    if (keep.has(name)) continue
    const full = path.join(OUT_DIR, name)
    if (fs.statSync(full).isDirectory()) {
      fs.rmSync(full, { recursive: true, force: true })
      console.log('[generateJournal] removed stale', name)
    }
  }
}

async function main() {
  console.log('[generateJournal] fetching editorial articles…')
  const rows = await fetchArticles()
  const now = Date.now()
  const live = rows
    .filter((r) => isLiveArticle(r, now))
    .filter((r) => (r.locale || 'en') === 'en') // Phase 3: English first
    .sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0))

  fs.mkdirSync(OUT_DIR, { recursive: true })
  cleanGeneratedDirs(live)

  for (const article of live) {
    const out = articlePath(article)
    fs.mkdirSync(path.dirname(out), { recursive: true })
    fs.writeFileSync(out, renderArticle(article, live))
    console.log('[generateJournal] wrote', path.relative(ROOT, out))
  }

  fs.writeFileSync(path.join(OUT_DIR, 'index.html'), renderIndex(live))
  writeHomeCards(live)
  updateSitemap(live)
  console.log(`[generateJournal] done — ${live.length} live English article(s)`)
  if (ADS_LIVE) {
    console.log('[generateJournal] AdSense LIVE on article templates (consent + IDs configured)')
  } else {
    console.log('[generateJournal] AdSense OFF — article templates ready; set ca-pub, slot IDs, and BETWEENUS_ADSENSE_CONSENT_READY=true after CMP')
  }
}

main().catch((err) => {
  console.error('[generateJournal] failed:', err.message || err)
  process.exit(1)
})
