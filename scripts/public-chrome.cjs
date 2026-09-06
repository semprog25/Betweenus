/**
 * Shared static HTML chrome for Between Us public pages (Journal generator, download.html).
 * Mirrors src/web/public-chrome.tsx React header/footer structure.
 */

const SITE_DEFAULT = 'https://betweenus.fun'

function link(href, label, active, key) {
  return `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`
}

function atmosphereHtml() {
  return `<div class="bu-public-atmosphere" aria-hidden="true">
  <div class="bu-public-atmosphere-radials"></div>
  <div class="bu-public-atmosphere-glow bu-public-atmosphere-glow--purple"></div>
  <div class="bu-public-atmosphere-glow bu-public-atmosphere-glow--violet"></div>
  <div class="bu-public-atmosphere-glow bu-public-atmosphere-glow--orange"></div>
  <div class="bu-public-atmosphere-glow bu-public-atmosphere-glow--pink"></div>
  <div class="bu-public-atmosphere-stars"></div>
  <div class="bu-public-atmosphere-dots"></div>
</div>`
}

function headerHtml({ site = SITE_DEFAULT, active = 'home' } = {}) {
  // Root-relative nav so local preview and production stay same-origin.
  // `site` reserved for absolute canonicals elsewhere; ignore for chrome hrefs.
  void site
  const featureActive = active === 'features' || String(active).startsWith('features')
  const guidesActive = active === 'guides'
  return `<header class="bu-public-header">
  <div class="bu-public-shell bu-public-header-inner">
    <a class="bu-public-logo-link" href="/" aria-label="Between Us home">
      <img src="/assets/betweenus-logo.png" alt="Between Us" class="bu-public-logo-img" width="176" height="36" />
    </a>
    <nav class="bu-public-nav-desktop" aria-label="Primary">
      ${link('/stories', 'Stories', active, 'stories')}
      ${link('/features', 'Features', featureActive ? 'features' : active, 'features')}
      ${link('/journal/', 'Journal', active, 'journal')}
      ${link('/guides/', 'Guides', guidesActive ? 'guides' : active, 'guides')}
      ${link('/download', 'Download', active, 'download')}
    </nav>
    <div class="bu-public-header-actions">
      <a class="bu-public-login-btn" href="/?auth=login">Log in</a>
      <a class="bu-public-signup-btn" href="/?auth=signup">Sign up</a>
      <button type="button" class="bu-public-nav-toggle" aria-label="Open menu" aria-expanded="false" data-bu-nav-toggle>☰</button>
    </div>
  </div>
  <div class="bu-public-mobile-menu" data-bu-mobile-menu hidden>
    ${link('/stories', 'Stories', active, 'stories')}
    ${link('/features', 'Features', featureActive ? 'features' : active, 'features')}
    ${link('/journal/', 'Journal', active, 'journal')}
    ${link('/guides/', 'Guides', guidesActive ? 'guides' : active, 'guides')}
    ${link('/download', 'Download', active, 'download')}
    <a href="/?auth=login">Log in</a>
    <a href="/?auth=signup">Sign up</a>
  </div>
</header>`
}

function footerHtml({ site = SITE_DEFAULT, note = '' } = {}) {
  void site
  const year = new Date().getFullYear()
  const noteHtml = note ? `<p class="bu-journal-footer-note">${note}</p>` : ''
  return `<footer class="bu-public-footer">
  <div class="bu-public-shell bu-public-footer-inner">
    <div class="bu-public-footer-brand">
      <a class="bu-public-footer-logo-link" href="/" aria-label="Between Us home">
        <img src="/assets/betweenus-logo.png" alt="Between Us" class="bu-public-logo-img" width="160" height="32" />
      </a>
      <p class="bu-public-footer-tagline">Say what you can't say anywhere else. Anonymous stories from people who get it.</p>
    </div>
    <nav class="bu-public-footer-nav" aria-label="Footer">
      <a href="/stories">Stories</a>
      <a href="/features">Features</a>
      <a href="/journal/">Journal</a>
      <a href="/guides/">Guides</a>
      <a href="/journey">Journey</a>
      <a href="/download">Download</a>
      <a href="/privacy">Privacy</a>
      <a href="/terms">Terms</a>
      <a href="/support">Support</a>
    </nav>
    <p class="bu-public-footer-copy">© ${year} Between Us</p>
    ${noteHtml}
  </div>
</footer>`
}

function navScript() {
  return `<script>
(function(){
  var toggle=document.querySelector('[data-bu-nav-toggle]');
  var menu=document.querySelector('[data-bu-mobile-menu]');
  if(!toggle||!menu) return;
  toggle.addEventListener('click',function(){
    var open=menu.classList.toggle('is-open');
    menu.hidden=!open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
})();
</script>`
}

function headAssets({ site = SITE_DEFAULT } = {}) {
  // Root-relative CSS so local preview and production share the same paths
  void site
  return `<link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/bu-public.css" />
  <link rel="stylesheet" href="/bu-journal.css" />`
}

/** Google Preferred Sources — load once per editorial article page (see generateJournal.js). */
function preferredSourceHeadScript() {
  return '<script async src="https://news.google.com/swg/js/v1/publisher.js"></script>'
}

function preferredSourceAsideHtml() {
  return `<aside class="bu-journal-preferred-source" aria-label="Follow Between Us on Google">
  <p class="bu-journal-preferred-source-text">Follow Between Us editorial stories in Google Search.</p>
  <div google-add-preferred-source-btn data-theme="dark"></div>
</aside>`
}

function storeButtonsHtml({
  site = SITE_DEFAULT,
  playStoreUrl = 'https://play.google.com/store/apps/details?id=com.betweenus.app',
  hasAppStore = false,
} = {}) {
  const play = `<a class="bu-store-badge bu-store-badge--google" href="${playStoreUrl}" rel="noopener noreferrer" target="_blank">
  <span class="bu-store-badge-text"><span class="bu-store-badge-label">Get it on</span><span class="bu-store-badge-name">Google Play</span></span>
</a>`
  const apple = hasAppStore
    ? `<a class="bu-store-badge bu-store-badge--apple" href="${site}/download"><span class="bu-store-badge-text"><span class="bu-store-badge-label">Download on the</span><span class="bu-store-badge-name">App Store</span></span></a>`
    : `<span class="bu-store-badge bu-store-badge--apple is-disabled" aria-label="App Store listing coming soon"><span class="bu-store-badge-text"><span class="bu-store-badge-label">Coming soon</span><span class="bu-store-badge-name">App Store</span></span></span>`
  return `<div class="bu-store-buttons">${apple}${play}</div>`
}

module.exports = {
  SITE_DEFAULT,
  atmosphereHtml,
  headerHtml,
  footerHtml,
  navScript,
  headAssets,
  preferredSourceHeadScript,
  preferredSourceAsideHtml,
  storeButtonsHtml,
}
