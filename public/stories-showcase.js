(() => {
  const panel = document.querySelector('[data-bu-stories-panel]');
  if (!panel) return;

  const escapeText = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const truncate = (text, max = 180) => {
    const clean = String(text || '').trim();
    if (clean.length <= max) return clean;
    return clean.slice(0, max).trim() + '…';
  };

  const renderError = (message) => {
    panel.innerHTML =
      '<div class="bu-stories-static-fallback">' +
        '<p class="bu-stories-static-note">' + message + '</p>' +
        '<div class="bu-story-static-grid" style="margin-top:1rem">' +
          '<article class="bu-story-static-card"><p class="bu-story-static-meta">Journal</p><p class="bu-story-static-body">Editorial essays on gossip, friendship, and relationship drama.</p><a class="bu-story-static-link" href="/journal/">Read the Journal</a></article>' +
          '<article class="bu-story-static-card"><p class="bu-story-static-meta">Guides</p><p class="bu-story-static-body">Practical advice for sharing carefully and staying connected.</p><a class="bu-story-static-link" href="/guides/">Browse Guides</a></article>' +
          '<article class="bu-story-static-card"><p class="bu-story-static-meta">Features</p><p class="bu-story-static-body">See how Stories, Spill, Check-ins, and privacy work together.</p><a class="bu-story-static-link" href="/features">Explore Features</a></article>' +
        '</div>' +
        '<p class="bu-stories-static-note" style="margin-top:1rem"><a href="/?auth=signup">Sign up</a> for the full community feed and Spill.</p>' +
      '</div>';
  };

  const endpoint = 'https://qoqbdiixztolvtcjdnle.supabase.co/functions/v1/make-server-6c9b0e48/posts?feed=trending&limit=12&language=en&stats=0';
  const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g";

  fetch(endpoint, {
    headers: {
      apikey: anonKey,
      Authorization: 'Bearer ' + anonKey,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      // Feed responses may omit `success`; trust an array of posts when present.
      const posts = (data && Array.isArray(data.posts)) ? data.posts : [];
      if (!posts.length) {
        renderError('Live highlights are offline for a moment — explore these instead.');
        return;
      }
      const cards = posts.slice(0, 9).map((post) => {
        const id = encodeURIComponent(post.id || '');
        const votes = (post.upvotes || 0) - (post.downvotes || 0);
        const replies = post.replyCount || (post.replies && post.replies.length) || 0;
        return (
          '<article class="bu-story-static-card">' +
            '<p class="bu-story-static-meta">Anonymous</p>' +
            '<p class="bu-story-static-body">' + escapeText(truncate(post.content)) + '</p>' +
            '<p class="bu-story-static-stats">' + votes + ' votes · ' + replies + ' replies</p>' +
            '<a class="bu-story-static-link" href="/story/' + id + '">Open conversation</a>' +
          '</article>'
        );
      }).join('');
      panel.innerHTML =
        '<p class="bu-stories-static-intro">Recent community highlights (sanitized public posts):</p>' +
        '<div class="bu-story-static-grid">' + cards + '</div>' +
        '<p class="bu-stories-static-note" style="margin-top:1rem">Want to write your own? <a href="/?auth=signup">Sign up</a> to Spill. Prefer essays? Visit the <a href="/journal/">Journal</a> or <a href="/guides/">Guides</a>.</p>';
    })
    .catch(() => {
      renderError('Could not load community highlights right now.');
    });
})();
