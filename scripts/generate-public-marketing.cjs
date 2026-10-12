#!/usr/bin/env node
/**
 * Generate crawlable static marketing HTML for GitHub Pages (HTTP 200).
 * SPA-only routes return 404 on GH Pages — these files fix that.
 *
 * Run: node scripts/generate-public-marketing.cjs
 */
const fs = require('fs')
const path = require('path')
const {
  SITE_DEFAULT,
  atmosphereHtml,
  headerHtml,
  footerHtml,
  navScript,
  headAssets,
  storeButtonsHtml,
} = require('./public-chrome.cjs')
const { patchJournalPublicHtml } = require('./journal-public-seo.cjs')

const ROOT = path.join(__dirname, '..')
const PUBLIC = path.join(ROOT, 'public')
const SITE = SITE_DEFAULT

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function writeFile(relPath, contents) {
  const full = path.join(PUBLIC, relPath)
  ensureDir(path.dirname(full))
  fs.writeFileSync(full, contents, 'utf8')
  console.log('wrote', relPath)
}

function pageShell({
  title,
  description,
  canonicalPath,
  active,
  bodyHtml,
  jsonLd,
  ogType = 'website',
  extraHead = '',
}) {
  const canonical = `${SITE}${canonicalPath}`
  const safeTitle = escapeHtml(title)
  const safeDesc = escapeHtml(description)
  const ldBlocks = (Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [])
    .filter(Boolean)
    .map((entry) => `<script type="application/ld+json">${JSON.stringify(entry)}</script>`)
    .join('\n  ')
  const ld = ldBlocks

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="google-adsense-account" content="ca-pub-3084834499411817" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="${escapeHtml(ogType)}" />
  <meta property="og:site_name" content="Between Us" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${SITE}/assets/betweenus-logo.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  ${headAssets({ site: SITE })}
  ${extraHead}
  ${ld}
</head>
<body class="bu-static">
  <div class="bu-static-root">
    ${atmosphereHtml()}
    ${headerHtml({ site: SITE, active })}
    <main class="bu-static-main bu-marketing-page">
      ${bodyHtml}
    </main>
    ${footerHtml({ site: SITE })}
  </div>
  ${navScript()}
</body>
</html>
`
}

function proseSection(title, paragraphs) {
  const paras = paragraphs.map((p) => `<p>${p}</p>`).join('\n')
  return `<section class="bu-prose-section">
  <h2>${escapeHtml(title)}</h2>
  ${paras}
</section>`
}

function ctaRow(primaryHref, primaryLabel, secondaryHref, secondaryLabel) {
  return `<div class="bu-marketing-cta-row">
  <a class="bu-btn-primary" href="${primaryHref}">${escapeHtml(primaryLabel)}</a>
  <a class="bu-btn-secondary" href="${secondaryHref}">${escapeHtml(secondaryLabel)}</a>
</div>`
}

function stripTags(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function faqSection(faq) {
  if (!faq || !faq.length) return ''
  const items = faq
    .map((item) => `<h3>${escapeHtml(item.question)}</h3>\n<p>${item.answer}</p>`)
    .join('\n')
  return `<section class="bu-prose-section" id="faq">
  <h2>Common questions</h2>
  ${items}
</section>`
}

function faqJsonLd(faq) {
  if (!faq || !faq.length) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: stripTags(item.answer) },
    })),
  }
}

const HELP_SECTION = [
  'If you need more than a peer community',
  [
    'Between Us is a place to read and share anonymously with peers. It is not a crisis service, a clinic, or legal advice. If someone is hurting you, or you might hurt yourself, get help from a person who can act in the real world.',
    'If you are in immediate danger, contact local emergency services. In the United States, call or text 988 (Suicide and Crisis Lifeline). In the UK and Ireland, Samaritans are available at 116 123 and at <a href="https://www.samaritans.org/">samaritans.org</a>. For other countries, the International Association for Suicide Prevention lists support at <a href="https://www.iasp.info/suicidalthoughts/">iasp.info/suicidalthoughts/</a>, and <a href="https://findahelpline.com/">findahelpline.com</a> can point you to a local line.',
  ],
]

function prepareGuide(guide) {
  if (!guide.includeHelp) return guide
  if (guide.sections.some(([title]) => title === HELP_SECTION[0])) return guide
  return { ...guide, sections: [...guide.sections, HELP_SECTION] }
}

function guideWordCount(guide) {
  const prepared = prepareGuide(guide)
  const parts = [prepared.lead || '']
  for (const [title, paragraphs] of prepared.sections || []) {
    parts.push(title, ...(paragraphs || []))
  }
  for (const item of prepared.faq || []) {
    parts.push(item.question, item.answer)
  }
  return stripTags(parts.join(' ')).split(/\s+/).filter(Boolean).length
}

function loadSearchIntentGuides() {
  const file = path.join(ROOT, 'content', 'guides', 'search-intent-guides.cjs')
  if (!fs.existsSync(file)) return []
  const guides = require(file)
  for (const guide of guides) {
    const words = guideWordCount(guide)
    if (words < 900 || words > 1500) {
      throw new Error(`Guide "${guide.slug}" is ${words} words; expected 900–1500`)
    }
  }
  return guides.map(prepareGuide)
}

function relatedLinks(items) {
  const links = items
    .map((item) => `<li><a href="${item.href}">${escapeHtml(item.label)}</a> — ${escapeHtml(item.blurb)}</li>`)
    .join('\n')
  return `<nav class="bu-related-links" aria-label="Related pages">
  <h2>Keep exploring</h2>
  <ul>${links}</ul>
</nav>`
}

function featureCard(href, title, copy) {
  return `<a class="bu-feature-link-card" href="${href}">
  <h3>${escapeHtml(title)}</h3>
  <p>${escapeHtml(copy)}</p>
</a>`
}

const FEATURES = [
  {
    slug: 'anonymous-stories',
    title: 'Anonymous Stories',
    nav: 'features',
    description:
      'Read and share anonymous community stories on Between Us — relationship secrets, friendship drama, and the things you cannot say with your name attached.',
    lead:
      'Anonymous Stories is the public community feed: real people writing about real situations without putting their identity on the line.',
    sections: [
      [
        'What it is',
        [
          'Between Us Stories are text-first posts (optionally with an image) published to a shared community feed. To other readers, posts appear as <strong>Anonymous</strong> — your account email and real name are not shown on the story card.',
          'You can browse popular and recent stories on the public website. Signing in unlocks voting, replies, and writing your own Spill.',
        ],
      ],
      [
        'How couples, friends, and anyone use it',
        [
          'People use Stories when they need distance from a situation: a fight that keeps looping, a secret that is eating them up, or a workplace rumor they cannot safely discuss under their own name.',
          'Readers often come for recognition — “someone else has been here too” — then stay to reply with perspective once they create an account.',
        ],
      ],
      [
        'Why it helps',
        [
          'Named social feeds reward performance. Anonymity lowers the cost of honesty, which is useful when the topic is messy, intimate, or socially risky.',
          'Between Us still requires an account for writing and interacting, so moderation and reporting remain possible without turning the feed into a public identity brand.',
        ],
      ],
      [
        'Practical example',
        [
          'You are stuck between loyalty to a friend and discomfort about what they did. You write the story without names, read replies from people who have been in similar binds, and decide your next conversation with clearer language — not because strangers decide for you, but because you practiced saying the hard part out loud.',
        ],
      ],
    ],
    related: [
      { href: '/features/spill', label: 'Spill', blurb: 'how posting works' },
      { href: '/features/react-and-discuss', label: 'React & Discuss', blurb: 'votes and replies' },
      { href: '/guides/sharing-hard-truths-anonymously', label: 'Guide', blurb: 'when anonymity helps' },
      { href: '/stories', label: 'Stories', blurb: 'browse the public showcase' },
    ],
  },
  {
    slug: 'spill',
    title: 'Spill',
    nav: 'features',
    description:
      'Spill is how you write on Between Us — post an anonymous story to the community when you need to get something off your chest.',
    lead:
      'Spill is the create flow: a focused writing experience for the story you have been carrying, published into the anonymous community feed.',
    sections: [
      [
        'What it is',
        [
          'Spill is Between Us’ name for posting. You write what happened (or how it felt), optionally add an image, and publish to Stories. The community sees Anonymous — not your email, not your profile brand.',
          'Spill lives in the authenticated app and web experience after sign-in. The public website explains the feature and showcases stories; writing requires an account so abuse controls can work.',
        ],
      ],
      [
        'How people use it',
        [
          'Use Spill when a thought is looping: the apology you cannot send, the suspicion you cannot confirm, the crush you cannot admit, the family secret that never got a safe audience.',
          'Many writers draft once, edit for clarity (without naming people who could be harmed), then publish when the piece feels honest rather than retaliatory.',
        ],
      ],
      [
        'Why it is useful',
        [
          'Writing forces structure. A Spill turns a foggy feeling into a narrative with a beginning, conflict, and question — which makes replies more useful and your own next step clearer.',
          'Because the feed is anonymous by design, Spill is built for honesty without the social media scoreboard attached to your real identity.',
        ],
      ],
      [
        'Practical example',
        [
          'After a breakup, you keep rehearsing one night in your head. You Spill the timeline, the ambiguity, and the question you still have. Replies do not “solve” the relationship — they help you notice patterns and decide what you need to say (or stop saying) offline.',
        ],
      ],
    ],
    related: [
      { href: '/features/anonymous-stories', label: 'Anonymous Stories', blurb: 'where Spills appear' },
      { href: '/features/safety-and-privacy', label: 'Safety & Privacy', blurb: 'boundaries that protect you' },
      { href: '/download', label: 'Download', blurb: 'write on mobile' },
      { href: '/?auth=signup', label: 'Sign up', blurb: 'create an account to Spill' },
    ],
  },
  {
    slug: 'react-and-discuss',
    title: 'React & Discuss',
    nav: 'features',
    description:
      'Vote and reply on Between Us stories. React to posts that resonate and discuss anonymously with people who understand the situation.',
    lead:
      'React & Discuss covers voting and replies — the ways signed-in members respond to Stories without turning the feed into a popularity contest about real names.',
    sections: [
      [
        'What it is',
        [
          'On Stories you can upvote or downvote and leave replies once you are signed in. Public visitors can read showcase stories; interaction is gated behind authentication so the community stays accountable enough to moderate.',
          'Replies are text discussion threaded under a story. Votes help surface posts that resonate with more people — useful for discovery, not a substitute for careful reading.',
        ],
      ],
      [
        'How people use it',
        [
          'Readers upvote when a story names a feeling they recognize. They reply when they can add a concrete perspective: what they tried, what they would avoid, or a question that helps the writer think.',
          'Good replies avoid doxxing, pile-ons, and fake certainty. The best discussions treat the writer as a person under pressure, not a character in a drama.',
        ],
      ],
      [
        'Why it is useful',
        [
          'Silent reading helps; response helps more when it is specific. A thoughtful reply can reframe a stuck narrative (“you are describing a boundary problem, not a personality failure”) without requiring anyone to reveal who they are.',
          'Voting and discussion also create a living archive of situations — so new visitors find stories that already collected useful conversation.',
        ],
      ],
      [
        'Practical example',
        [
          'A workplace story about being left out of meetings collects replies from people who have navigated similar politics. One reply suggests documenting invites and asking a clarifying question in writing. The original poster does not need the commenter’s name — they need a usable next step.',
        ],
      ],
    ],
    related: [
      { href: '/features/anonymous-stories', label: 'Anonymous Stories', blurb: 'the feed you react to' },
      { href: '/features/spill', label: 'Spill', blurb: 'start a conversation' },
      { href: '/guides/when-gossip-crosses-a-line', label: 'Guide', blurb: 'healthier discussion norms' },
      { href: '/stories', label: 'Stories', blurb: 'read the showcase' },
    ],
  },
  {
    slug: 'daily-check-ins',
    title: 'Daily Check-ins',
    nav: 'features',
    description:
      'Private daily mood check-ins on Between Us help you notice patterns without posting to the public Stories feed.',
    lead:
      'Daily Check-ins are a private reflection tool inside the app — mood and notes for you, not content for the anonymous community feed.',
    sections: [
      [
        'What it is',
        [
          'Check-ins let you log how you feel, add notes, and look back at patterns over time. They are part of the authenticated experience and are intentionally separate from public Stories and the editorial Between Us Journal.',
          'Nothing about a private check-in is meant to appear on the marketing website or community feed. That separation is the point: some honesty is for an audience; some honesty is for yourself.',
        ],
      ],
      [
        'How people use it',
        [
          'Use a check-in after a hard conversation, before bed, or whenever your mood shifts without a clear reason. Over a week, tags and notes often reveal triggers you would otherwise dismiss as “just a bad day.”',
          'Couples and friends sometimes discuss check-in insights offline (“I noticed I crash every Sunday night”) without pasting private notes into a shared chat.',
        ],
      ],
      [
        'Why it is useful',
        [
          'Public storytelling and private tracking solve different problems. Stories help you feel less alone; check-ins help you notice your own baseline so you can intervene earlier.',
          'Because check-ins are optional, they support wellness habits without forcing every Between Us visit to become emotional labor.',
        ],
      ],
      [
        'Practical example',
        [
          'You Spill once about a friendship rupture, then use daily check-ins for two weeks. The private log shows anxiety spikes before group plans. That pattern becomes a clearer request offline: smaller hangouts, earlier leave times, or a direct conversation — without publishing every mood to the feed.',
        ],
      ],
    ],
    related: [
      { href: '/guides/building-a-private-check-in-habit', label: 'Guide', blurb: 'make check-ins stick' },
      { href: '/features/safety-and-privacy', label: 'Safety & Privacy', blurb: 'what stays private' },
      { href: '/features/anonymous-stories', label: 'Anonymous Stories', blurb: 'when you do want an audience' },
      { href: '/download', label: 'Download', blurb: 'check in on mobile' },
    ],
  },
  {
    slug: 'editorial-journal',
    title: 'Between Us Journal',
    nav: 'journal',
    description:
      'The Between Us Journal is editorial storytelling about relationships, friendship, secrets, and social drama — separate from anonymous community Stories.',
    lead:
      'The Journal is written by the Between Us team: longer editorial pieces that explore the themes the community cares about, without replacing user Stories.',
    sections: [
      [
        'What it is',
        [
          'Journal articles are published as static, crawlable pages under <a href="/journal/">/journal/</a>. They are editorial — not your private check-in diary, and not the anonymous community feed.',
          'Each piece aims to stand alone as useful reading: cultural observations, friendship dynamics, workplace rumor culture, and the gray areas of modern secrecy.',
        ],
      ],
      [
        'How people use it',
        [
          'Readers use the Journal when they want depth without logging in: a thoughtful essay before browsing Stories, or a shared link that does not require an account.',
          'Writers and community members often bounce between Journal themes and Stories — the editorial layer names patterns; the community layer fills them with lived detail.',
        ],
      ],
      [
        'Why it is useful',
        [
          'A community feed alone can feel chaotic. Editorial Journal pages give structure, vocabulary, and context — which also makes the public website a real content destination for searchers and AdSense-quality browsing.',
          'Keeping Journal separate from private check-ins and anonymous Spills protects clarity: different tools for different kinds of honesty.',
        ],
      ],
      [
        'Practical example',
        [
          'You read a Journal piece about gossip you pretend not to love, then open Stories and find people describing the exact social bind. The essay gave you language; the community gave you company.',
        ],
      ],
    ],
    related: [
      { href: '/journal/', label: 'Journal index', blurb: 'all editorial articles' },
      { href: '/guides/', label: 'Guides', blurb: 'practical evergreen resources' },
      { href: '/features/anonymous-stories', label: 'Anonymous Stories', blurb: 'community side' },
      { href: '/journey', label: 'Journey', blurb: 'why Between Us exists' },
    ],
  },
  {
    slug: 'safety-and-privacy',
    title: 'Safety & Privacy',
    nav: 'features',
    description:
      'How Between Us separates anonymous public Stories from private check-ins, and what moderation and reporting are for.',
    lead:
      'Safety & Privacy is not a slogan slide — it is how the product is structured: account for access, anonymity for publication, private tools that never belong on the public feed.',
    sections: [
      [
        'What it is',
        [
          'Between Us uses accounts (email or OAuth) so people can sign in across web and apps. Public Stories still display as Anonymous to other users. Private check-ins and personal journal entries stay out of the community feed and off the marketing site.',
          'Reporting and moderation exist because anonymity without accountability becomes a harassment tool. The goal is honest conversation with guardrails — not lawless dumping.',
        ],
      ],
      [
        'How people use it',
        [
          'Before you Spill, remove identifying details that could harm someone else. Use reporting when a post crosses into threats, hate, or doxxing. Use private check-ins for moods that do not need an audience.',
          'If you are in crisis, Between Us is not emergency care — contact local emergency services or a crisis line. The community is peer support, not clinical treatment.',
        ],
      ],
      [
        'Why it matters',
        [
          'Trust is the product. People only write hard truths when they believe the system will not casually expose them or amplify harm.',
          'Clear separation between public Stories, editorial Journal, and private check-ins also helps visitors understand what the website is for — and what requires signing in.',
        ],
      ],
      [
        'Practical example',
        [
          'You want to discuss a family conflict without relatives finding a searchable post under your name. You Spill with careful redaction, read replies, and keep the rawest feelings in a private check-in note instead of the public feed.',
        ],
      ],
    ],
    related: [
      { href: '/privacy', label: 'Privacy policy', blurb: 'data practices summary' },
      { href: '/terms', label: 'Terms', blurb: 'community standards' },
      { href: '/support', label: 'Support', blurb: 'get help' },
      { href: '/features/spill', label: 'Spill', blurb: 'write with care' },
    ],
  },
]

const CORE_GUIDES = [
  {
    slug: 'sharing-hard-truths-anonymously',
    title: 'Sharing hard truths without using your name',
    description:
      'A practical guide to writing anonymously about sensitive situations — what to share, what to redact, and when a private note is wiser than a public post.',
    lead:
      'Anonymity can make honesty possible. It can also make cruelty easier. This guide helps you use anonymous writing as a clarifying tool — not a weapon.',
    sections: [
      [
        'Start with the question you actually need answered',
        [
          'Before you write, name the decision or feeling stuck underneath the story. “Should I confront them?” and “Am I overreacting?” produce better posts than a vent with no ask.',
          'If you cannot find a question, write privately first (a note or a Between Us check-in). Public posts work better when you already know what kind of help you want: perspective, language, or solidarity.',
        ],
      ],
      [
        'Redact like someone who knows your life is reading',
        [
          'Remove names, workplaces, schools, rare job titles, and timestamped details that create a unique fingerprint. Swap specifics for categories (“a friend from work,” “my partner,” “someone in my friend group”).',
          'Ask: if this reached the person involved, would it escalate danger or humiliation without solving anything? If yes, rewrite or keep it private.',
        ],
      ],
      [
        'Prefer clarity over performance',
        [
          'Anonymous feeds sometimes reward the hottest framing. Resist writing for applause. Include what you might have contributed to the mess — readers trust posts that show self-scrutiny.',
          'End with what you have already tried. That prevents reply piles that repeat advice you rejected for good reasons.',
        ],
      ],
      [
        'After you publish',
        [
          'Read replies for patterns, not for a verdict. One cruel comment is noise; three people naming the same boundary issue is signal.',
          'Decide one offline action within 48 hours — a conversation, a pause, or a boundary — so the post does not become a substitute for living.',
        ],
      ],
    ],
    faq: [
      {
        question: 'Should I post anonymously if someone might still recognize the story?',
        answer:
          'Only if you can remove the details that make it recognizable. If the people involved would know it is you, keep the note private or rewrite until the useful question survives without the fingerprint.',
      },
      {
        question: 'What should I remove before I publish?',
        answer:
          'Names, workplaces, schools, rare job titles, and timestamps that only your circle would know. Describe roles (“a friend from work,” “my partner”) instead of identities.',
      },
      {
        question: 'When is a private note better than a public post?',
        answer:
          'When you cannot find the question you want answered, or when the post would escalate danger or humiliation. Write it privately first, then publish only the redacted version that asks for perspective.',
      },
    ],
    published: '2026-09-06',
    modified: '2026-10-12',
    related: [
      { href: '/features/spill', label: 'Spill', blurb: 'the writing flow' },
      { href: '/features/safety-and-privacy', label: 'Safety & Privacy', blurb: 'product boundaries' },
      { href: '/guides/how-to-vent-anonymously-and-safely', label: 'Vent anonymously', blurb: 'a safer way to get it out' },
    ],
  },
  {
    slug: 'conversation-prompts-for-tough-relationship-talks',
    title: 'Conversation prompts for tough relationship talks',
    description:
      'Concrete prompts for honest conversations with a partner or close friend — useful before or after reading anonymous stories about similar conflicts.',
    lead:
      'Stories help you feel less alone. Offline conversations still need language. These prompts are for the talk you keep postponing.',
    sections: [
      [
        'Use prompts as openings, not scripts',
        [
          'A good prompt lowers defensiveness and states a need. It is not a courtroom monologue. Speak about your experience, then leave space.',
          'If emotions are too high, agree on a 20-minute window and a pause word. Structure is kindness when the topic is charged.',
        ],
      ],
      [
        'Prompts for clarity',
        [
          '“When X happened, I felt Y, and I made up a story that Z. Can you tell me what it was like from your side?”',
          '“What do you need from me in the next week that you have not asked for directly?”',
          '“Which part of this conflict feels most unfinished to you — and which part feels finished to me?”',
        ],
      ],
      [
        'Prompts for repair',
        [
          '“I want to repair how I showed up when I ____. What would a meaningful repair look like to you?”',
          '“What should we stop doing in arguments, even if we still disagree about the topic?”',
          '“If we imagined this going well in three months, what habit would we have practiced weekly?”',
        ],
      ],
      [
        'When a story helped you prepare',
        [
          'If a Between Us story clarified your feelings, you do not need to quote it. Translate the insight: “Reading other people’s situations helped me notice I shut down when plans change last minute.”',
          'Keep the other person’s dignity intact. Anonymous reading is for your courage — not ammunition.',
        ],
      ],
    ],
    faq: [
      {
        question: 'Do I have to use these prompts word for word?',
        answer:
          'No. They are openings, not a script. Use the shape — what happened, what you felt, what you need — in your own words, then leave room for the other person.',
      },
      {
        question: 'What if the other person shuts down?',
        answer:
          'Agree on a short window and a pause word before you start, if you can. If they still shut down, stop for the day and name a time to come back. A paused talk is better than a forced one.',
      },
      {
        question: 'Should I mention that an anonymous story helped me prepare?',
        answer:
          'You do not need to quote it. Translate the insight into your own experience. Anonymous reading is for your courage, not ammunition.',
      },
    ],
    published: '2026-09-06',
    modified: '2026-10-12',
    related: [
      { href: '/features/anonymous-stories', label: 'Anonymous Stories', blurb: 'find shared situations' },
      { href: '/guides/how-to-tell-a-friend-something-hard', label: 'Tell a friend something hard', blurb: 'take the talk out of rehearsal' },
      { href: '/journal/', label: 'Journal', blurb: 'editorial essays on relationship themes' },
    ],
  },
  {
    slug: 'when-gossip-crosses-a-line',
    title: 'When gossip crosses a line',
    description:
      'How to tell the difference between processing a social situation and harming someone — for readers and writers in anonymous communities.',
    lead:
      'Gossip is social information. It becomes harm when it aims to punish, expose, or recruit a pile-on. Anonymous spaces need an extra ethical brake.',
    sections: [
      [
        'Processing vs performing',
        [
          'Processing sounds like: “I am confused and hurt; here is what happened; what am I missing?” Performing sounds like: “Here is a villain; join me in condemning them.”',
          'If your draft only works when readers hate a specific person, rewrite until the useful question survives without the humiliation.',
        ],
      ],
      [
        'Lines that usually mean stop',
        [
          'Posting contact details, workplace names meant to invite harassment, sexual content about someone without consent, or threats — stop and delete.',
          'Repeating a rumor you cannot source, especially about someone’s health, immigration status, or private relationships, is not “just asking.”',
        ],
      ],
      [
        'Healthier alternatives',
        [
          'Talk to one trusted person offline. Write a private check-in. Spill a redacted version focused on your decision, not their destruction.',
          'If you are the subject of gossip, document what you know, avoid public retaliation, and use support channels that do not escalate the blast radius.',
        ],
      ],
      [
        'How Between Us fits',
        [
          'Community Stories and Journal essays often explore gossip culture because it is real. The product still expects community standards: no doxxing, no hate, no harassment.',
          'Report posts that cross the line. Anonymity is a tool for honesty — not a shield for cruelty.',
        ],
      ],
    ],
    faq: [
      {
        question: 'Is all gossip harmful?',
        answer:
          'No. Processing a confusing situation with one trusted person is different from performing a villain story so other people will pile on. The line is humiliation, exposure, and punishment.',
      },
      {
        question: 'When should I delete a draft instead of posting it?',
        answer:
          'Delete it when it only works if readers hate a specific person, or when it includes contact details, a workplace meant to invite harassment, or a rumor you cannot source.',
      },
      {
        question: 'What if I am the person being talked about?',
        answer:
          'Document what you know and avoid a public retaliation post. Deal with the people who have a real consequence, and use support channels that do not make the blast radius bigger.',
      },
    ],
    published: '2026-09-06',
    modified: '2026-10-12',
    related: [
      { href: '/journal/the-gossip-we-all-pretend-we-dont-love/', label: 'Journal essay', blurb: 'gossip we pretend we do not love' },
      { href: '/guides/how-to-vent-anonymously-and-safely', label: 'Vent anonymously', blurb: 'get it out without a pile-on' },
      { href: '/terms', label: 'Terms', blurb: 'community standards' },
    ],
  },
  {
    slug: 'building-a-private-check-in-habit',
    title: 'Building a private check-in habit',
    description:
      'A simple routine for daily mood check-ins that stays private — so you notice patterns without performing your feelings for an audience.',
    lead:
      'Public storytelling is powerful. A private check-in habit is quieter — and often more useful for catching patterns early.',
    sections: [
      [
        'Keep the ritual tiny',
        [
          'Pick one anchor: after coffee, after work, or before sleep. Log a mood in under two minutes. If you miss a day, restart without streak shame.',
          'Between Us daily check-ins are built for this private loop. They are not published to Stories and are not the editorial Journal.',
        ],
      ],
      [
        'Capture context, not essays',
        [
          'Add one line of context: “argument with roommate,” “skipped lunch,” “good walk.” Context makes weekly review meaningful.',
          'Save long processing for a Spill when you want community perspective — or a longer private note when you do not.',
        ],
      ],
      [
        'Review weekly, act on one insight',
        [
          'Once a week, scan for repeats. Choose one small adjustment: sleep, a boundary, a conversation, or less caffeine before hard talks.',
          'Habits fail when review becomes self-critique. Treat the log like weather data — useful, not moral.',
        ],
      ],
      [
        'Combine with community carefully',
        [
          'If a check-in pattern points to a relational issue, you might later Spill a careful anonymous version. You do not need to post every mood.',
          'Privacy is a feature. Use the audience when you want one — not by default.',
        ],
      ],
    ],
    faq: [
      {
        question: 'Are daily check-ins visible to other people?',
        answer:
          'No. Between Us daily check-ins are a private loop. They are not published to Stories and they are not the editorial Journal.',
      },
      {
        question: 'What if I miss a day?',
        answer:
          'Restart without treating the gap as a moral failure. The habit is a tiny anchor, not a streak you have to protect.',
      },
      {
        question: 'When should a check-in become a Spill?',
        answer:
          'When a pattern points at a relational question you want perspective on, and you can redact it. You do not need to post every mood.',
      },
    ],
    published: '2026-09-06',
    modified: '2026-10-12',
    related: [
      { href: '/features/daily-check-ins', label: 'Daily Check-ins', blurb: 'how the feature works' },
      { href: '/guides/when-you-cant-talk-to-anyone-about-your-relationship', label: 'When you cannot tell anyone', blurb: 'if the private note is not enough' },
      { href: '/download', label: 'Download', blurb: 'check in on your phone' },
    ],
  },
  {
    slug: 'staying-connected-when-you-live-apart',
    title: 'Staying connected when you live apart',
    description:
      'Practical rituals for long-distance partners and friends — honest conversation habits that complement anonymous community support.',
    lead:
      'Distance amplifies ambiguity. These rituals keep connection concrete without pretending an app can replace presence.',
    sections: [
      [
        'Schedule honesty, not only logistics',
        [
          'Logistics chats (“Did you land?”) are necessary and insufficient. Add a weekly honesty window: 30 minutes with phones down, one highlight, one hard thing, one appreciation.',
          'If conflict appears, prefer voice or video over text for tone — then summarize agreements in writing so they survive the week.',
        ],
      ],
      [
        'Shared questions beat shared scrolling',
        [
          'Trade one substantive question twice a week. Examples: “What felt lonely this week?” “What are you proud of that I might have missed?” “What do you need from me that is hard to ask for?”',
          'Anonymous Stories can surface language for feelings you have not named yet — use that language in your own words with the person you miss.',
        ],
      ],
      [
        'Protect private from public',
        [
          'Do not out your partner’s private struggles into a public Spill. If you need community perspective, redact heavily and focus on your choices.',
          'Private check-ins can track your own mood around time-zone friction without turning every low day into a shared emergency.',
        ],
      ],
      [
        'Plan reunion moments that are small enough to be real',
        [
          'Grand plans collapse under pressure. Plan one small shared ritual for the next visit: a walk route, a meal you both cook, a conversation you postponed.',
          'Between visits, connection is consistency — not constant messaging.',
        ],
      ],
    ],
    faq: [
      {
        question: 'How often should we talk when we live apart?',
        answer:
          'Keep logistics as needed, and add one honesty window a week rather than constant messaging. Consistency matters more than being available every hour.',
      },
      {
        question: 'Should I post about my partner while we are apart?',
        answer:
          'Do not put their private struggles into a public Spill. If you need perspective, redact heavily and write about your choices, not their secrets.',
      },
      {
        question: 'What if texting makes fights worse?',
        answer:
          'Move the conflict to voice or video so tone survives, then write down the agreement you actually made. Text is a poor room for a charged repair.',
      },
    ],
    published: '2026-09-06',
    modified: '2026-10-12',
    related: [
      { href: '/guides/conversation-prompts-for-tough-relationship-talks', label: 'Conversation prompts', blurb: 'language for hard talks' },
      { href: '/features/daily-check-ins', label: 'Daily Check-ins', blurb: 'private mood tracking' },
      { href: '/features/anonymous-stories', label: 'Anonymous Stories', blurb: 'perspective when you feel stuck' },
    ],
  },
]

const GUIDES = [...loadSearchIntentGuides(), ...CORE_GUIDES]

function renderFeaturePage(feature) {
  const sections = feature.sections
    .map(([title, paragraphs]) => proseSection(title, paragraphs))
    .join('\n')
  return pageShell({
    title: `${feature.title} | Between Us`,
    description: feature.description,
    canonicalPath: `/features/${feature.slug}`,
    active: feature.nav,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: feature.title,
      description: feature.description,
      isPartOf: { '@type': 'WebSite', name: 'Between Us', url: SITE },
      url: `${SITE}/features/${feature.slug}`,
    },
    bodyHtml: `
      <p class="bu-section-eyebrow">Feature</p>
      <h1 class="bu-section-title">${escapeHtml(feature.title)}</h1>
      <p class="bu-marketing-lead">${feature.lead}</p>
      ${sections}
      ${ctaRow('/?auth=signup', 'Join Between Us', '/stories', 'Explore Stories')}
      ${relatedLinks(feature.related)}
    `,
  })
}

function renderGuidePage(guide) {
  const prepared = prepareGuide(guide)
  const sections = prepared.sections
    .map(([title, paragraphs]) => proseSection(title, paragraphs))
    .join('\n')
  const pageUrl = `${SITE}/guides/${prepared.slug}`
  const cta = prepared.cta || {
    primaryHref: '/features',
    primaryLabel: 'See product features',
    secondaryHref: '/journal/',
    secondaryLabel: 'Read the Journal',
  }
  const published = prepared.published || '2026-09-06'
  const modified = prepared.modified || published
  return pageShell({
    title: `${prepared.title} | Between Us Guides`,
    description: prepared.description,
    canonicalPath: `/guides/${prepared.slug}`,
    active: 'guides',
    ogType: 'article',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: prepared.title,
        description: prepared.description,
        datePublished: published,
        dateModified: modified,
        image: [`${SITE}/assets/betweenus-logo.png`],
        author: { '@type': 'Organization', name: 'Between Us' },
        publisher: {
          '@type': 'Organization',
          name: 'Between Us',
          url: SITE,
          logo: { '@type': 'ImageObject', url: `${SITE}/assets/betweenus-logo.png` },
        },
        mainEntityOfPage: pageUrl,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE}/guides/` },
          { '@type': 'ListItem', position: 3, name: prepared.title, item: pageUrl },
        ],
      },
      faqJsonLd(prepared.faq),
    ],
    bodyHtml: `
      <p class="bu-section-eyebrow">Guide</p>
      <h1 class="bu-section-title">${escapeHtml(prepared.title)}</h1>
      <p class="bu-marketing-lead">${prepared.lead}</p>
      ${sections}
      ${faqSection(prepared.faq)}
      ${ctaRow(cta.primaryHref, cta.primaryLabel, cta.secondaryHref, cta.secondaryLabel)}
      ${relatedLinks(prepared.related)}
    `,
  })
}

function featuresIndexHtml() {
  const cards = FEATURES.map((f) =>
    featureCard(`/features/${f.slug}`, f.title, f.description)
  ).join('\n')
  return pageShell({
    title: 'Features | Between Us',
    description:
      'Explore Between Us features: anonymous stories, Spill, reactions and discussion, private daily check-ins, editorial Journal, and safety-first privacy design.',
    canonicalPath: '/features',
    active: 'features',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Between Us Features',
      url: `${SITE}/features`,
    },
    bodyHtml: `
      <p class="bu-section-eyebrow">Product</p>
      <h1 class="bu-section-title">What Between Us actually does</h1>
      <p class="bu-marketing-lead">
        Between Us is an anonymous community for stories you cannot say anywhere else — plus private check-ins and an editorial Journal.
        These pages explain real product capabilities, not vaporware.
      </p>
      <div class="bu-feature-link-grid">
        ${cards}
      </div>
      ${ctaRow('/stories', 'Explore Stories', '/download', 'Download the app')}
      ${relatedLinks([
        { href: '/guides/', label: 'Guides', blurb: 'practical evergreen resources' },
        { href: '/journey', label: 'Journey', blurb: 'why we built this' },
        { href: '/journal/', label: 'Journal', blurb: 'editorial essays' },
      ])}
    `,
  })
}

function guidesIndexHtml() {
  const cards = GUIDES.map((g) =>
    featureCard(`/guides/${g.slug}`, g.title, g.description)
  ).join('\n')
  return pageShell({
    title: 'Guides | Between Us',
    description:
      'Practical Between Us guides on telling a friend something hard, one-sided friendships, anonymous venting, boundaries, and the relationship talks you keep postponing.',
    canonicalPath: '/guides/',
    active: 'guides',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Between Us Guides',
      url: `${SITE}/guides/`,
      description:
        'Practical guides for anonymous sharing, hard friendship conversations, and safer venting.',
      isPartOf: { '@type': 'WebSite', name: 'Between Us', url: SITE },
    },
    bodyHtml: `
      <p class="bu-section-eyebrow">Resources</p>
      <h1 class="bu-section-title">Guides for honest conversations</h1>
      <p class="bu-marketing-lead">
        Practical pages for the conversations people rehearse and do not send. These guides complement anonymous Stories and the editorial Journal.
      </p>
      <div class="bu-feature-link-grid">
        ${cards}
      </div>
      ${ctaRow('/features', 'Explore features', '/journal/', 'Read the Journal')}
    `,
  })
}

function journeyHtml() {
  return pageShell({
    title: 'Journey | Between Us',
    description:
      'Why Between Us exists: an anonymous community for relationship secrets, hidden truths, and conversations you cannot have under your real name.',
    canonicalPath: '/journey',
    active: 'journey',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'The Between Us journey',
      url: `${SITE}/journey`,
      description:
        'Why Between Us exists: an anonymous community for relationship secrets, hidden truths, and conversations you cannot have under your real name.',
      isPartOf: { '@type': 'WebSite', name: 'Between Us', url: SITE },
    },
    bodyHtml: `
      <p class="bu-section-eyebrow">Our story</p>
      <h1 class="bu-section-title">The Between Us journey</h1>
      <p class="bu-marketing-lead">
        Between Us is an anonymous community for sharing stories you cannot say anywhere else —
        relationship secrets, hidden truths, and the things you need to get off your chest without performing for an audience.
      </p>
      ${proseSection('Why we built this', [
        'Some truths are easier to share when your name is not attached. We separate your account (used to sign in) from what you publish publicly as Anonymous — so you can be honest without building a personal brand around your most vulnerable moments.',
        'Named platforms reward polish. Between Us is built for the draft you would never post to your grid: the conflict, the confession, the question you are afraid will sound dramatic until someone else says “same.”',
      ])}
      ${proseSection('What you can do', [
        'Spill anonymous text-and-image stories, discover what others share, vote and reply when signed in, and keep private mood check-ins separate from the public feed.',
        'Editorial Journal pieces explore the themes the community cares about — gossip culture, friendship ruptures, workplace rumor — without replacing community Stories.',
      ])}
      ${proseSection('Where we are headed', [
        'Between Us is available on Android via Google Play, with an iOS release in progress. The authenticated web experience works after signing in.',
        'We are growing the community carefully — with moderation, privacy, and real conversation first. The public website exists so anyone can read editorial Journal pieces, understand the product, and browse a showcase of Stories before creating an account.',
      ])}
      ${ctaRow('/stories', 'Explore Stories', '/download', 'Download the App')}
      ${relatedLinks([
        { href: '/features', label: 'Features', blurb: 'product capabilities' },
        { href: '/guides/', label: 'Guides', blurb: 'practical resources' },
        { href: '/journal/', label: 'Journal', blurb: 'editorial stories' },
      ])}
    `,
  })
}

function storiesHtml() {
  return pageShell({
    title: 'Stories | Between Us',
    description:
      'Browse anonymous community stories on Between Us — relationship drama, secrets, friendship conflicts, and real conversations without real names.',
    canonicalPath: '/stories',
    active: 'stories',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Anonymous Stories',
      url: `${SITE}/stories`,
      description:
        'Browse anonymous community stories on Between Us — relationship drama, secrets, friendship conflicts, and real conversations without real names.',
      isPartOf: { '@type': 'WebSite', name: 'Between Us', url: SITE },
    },
    bodyHtml: `
      <p class="bu-section-eyebrow">Community</p>
      <h1 class="bu-section-title">Anonymous Stories</h1>
      <p class="bu-marketing-lead">
        Stories is the public showcase of Between Us community posts. Read situations that sound familiar.
        Sign in when you want to vote, reply, or Spill your own.
      </p>
      ${proseSection('What you will find', [
        'People write about relationships, friendships, family pressure, workplace politics, and the secrets that do not fit neatly into a status update.',
        'Posts appear as Anonymous. The goal is honesty with less identity risk — not content that helps anyone track down a real person.',
      ])}
      ${proseSection('How to use this page', [
        'Start with the live showcase in the Between Us web app experience after the page loads interactive cards, or jump into editorial Journal reading if you want deeper essays first.',
        'If a story resonates, create an account to reply with care. If you need to write, use Spill. If you need private tracking instead of an audience, use daily check-ins.',
      ])}
      <div class="bu-stories-static-panel" id="bu-stories-panel" data-bu-stories-panel>
        <p class="bu-stories-static-note">Loading community highlights…</p>
      </div>
      ${ctaRow('/?auth=signup', 'Sign up to join the conversation', '/features/anonymous-stories', 'How Stories work')}
      ${relatedLinks([
        { href: '/features/spill', label: 'Spill', blurb: 'write your own' },
        { href: '/journal/', label: 'Journal', blurb: 'editorial essays' },
        { href: '/guides/sharing-hard-truths-anonymously', label: 'Guide', blurb: 'share carefully' },
      ])}
    `,
    extraHead: `<script src="/stories-showcase.js" defer></script>`,
  })
}

function downloadHtml() {
  return pageShell({
    title: 'Download | Between Us',
    description:
      'Download Between Us for Android on Google Play. iOS App Store listing coming soon. Spill, react, and stay in the conversation.',
    canonicalPath: '/download',
    active: 'download',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Download Between Us',
      url: `${SITE}/download`,
      description:
        'Download Between Us for Android on Google Play. iOS App Store listing coming soon.',
      isPartOf: { '@type': 'WebSite', name: 'Between Us', url: SITE },
    },
    bodyHtml: `
      <div class="bu-download-static-inner">
        <p class="bu-section-eyebrow">Get the app</p>
        <h1 class="bu-section-title">Take Between Us with you</h1>
        <p class="bu-marketing-lead">Spill, react, check in privately, and stay in the conversation on your phone.</p>
        ${storeButtonsHtml({ site: SITE })}
        ${proseSection('What you get in the apps', [
          'The mobile apps include the full authenticated experience: Spill anonymous stories, browse community feeds with filters, vote and reply, and use private daily check-ins.',
          'The public website remains the home for editorial Journal articles, product education, and discovery before you sign in.',
        ])}
        ${relatedLinks([
          { href: '/features', label: 'Features', blurb: 'what the product includes' },
          { href: '/stories', label: 'Stories', blurb: 'browse the showcase' },
          { href: '/support', label: 'Support', blurb: 'need help installing or signing in' },
        ])}
      </div>
    `,
  })
}

function privacyHtml() {
  return pageShell({
    title: 'Privacy | Between Us',
    description:
      'How Between Us handles account data, anonymous stories, private check-ins, infrastructure, and website advertising.',
    canonicalPath: '/privacy',
    active: 'privacy',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy',
      url: `${SITE}/privacy`,
      description:
        'How Between Us handles account data, anonymous stories, private check-ins, infrastructure, and website advertising.',
      isPartOf: { '@type': 'WebSite', name: 'Between Us', url: SITE },
    },
    bodyHtml: `
      <h1 class="bu-section-title">Privacy</h1>
      <p class="bu-marketing-lead">This summary describes how Between Us handles data on the public website and in the app. It is not a substitute for legal counsel.</p>
      ${proseSection('Account information', [
        'When you sign up, we collect the information required to authenticate you — typically an email address and, if you choose, a display name. OAuth providers (Google, Apple) may share basic profile details according to their policies.',
      ])}
      ${proseSection('Stories, reactions & comments', [
        'Public posts you publish appear as <strong>Anonymous</strong> to other users. Your account email is not shown on posts. Community votes, replies, and story metadata are stored so the service can operate.',
        'Anonymity on a public platform is a design goal — not an absolute guarantee against all forms of identification.',
      ])}
      ${proseSection('Private check-ins & personal journal', [
        'Personal check-ins and private journal entries in the app are separate from the public community feed. They are not displayed on the public marketing website.',
      ])}
      ${proseSection('Infrastructure', [
        'Between Us uses Supabase for authentication and data storage. Service providers process data as needed to host and secure the product. We do not sell personal data.',
      ])}
      ${proseSection('Website advertising', [
        'The Between Us Journal on the website may use Google AdSense when advertising is enabled. Google and partners may then use cookies or similar technologies, including for advertising, subject to applicable consent requirements in the EEA/UK.',
        'Ads are not shown in the Journal CMS editor. Mobile apps may use Google AdMob separately from website AdSense. Ad units are not placed on login, signup, empty, or private application screens without a clear publisher-content context.',
      ])}
      ${proseSection('Your choices', [
        'You can sign out at any time. Account deletion and data requests can be initiated through in-app settings where available, or by contacting us.',
        'Privacy questions: <a href="mailto:privacy@betweenus.semprog.de">privacy@betweenus.semprog.de</a>.',
      ])}
    `,
  })
}

function termsHtml() {
  return pageShell({
    title: 'Terms | Between Us',
    description:
      'Community standards and terms for using Between Us — anonymous storytelling with respect, legality, and safety.',
    canonicalPath: '/terms',
    active: 'terms',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Terms',
      url: `${SITE}/terms`,
      description:
        'Community standards and terms for using Between Us — anonymous storytelling with respect, legality, and safety.',
      isPartOf: { '@type': 'WebSite', name: 'Between Us', url: SITE },
    },
    bodyHtml: `
      <h1 class="bu-section-title">Terms</h1>
      <p class="bu-marketing-lead">By using Between Us you agree to participate respectfully and lawfully in our anonymous community.</p>
      ${proseSection('Community standards', [
        'Do not dox, harass, or threaten others.',
        'Do not post hate speech or content targeting protected groups.',
        'Do not use Between Us as a substitute for professional medical or mental-health care.',
        'Respect intellectual property and applicable laws in your jurisdiction.',
      ])}
      ${proseSection('Your content', [
        'You are responsible for what you Spill. Do not post illegal content. Do not share other people’s private information. We may remove content and restrict accounts that violate these standards.',
      ])}
      ${proseSection('Accounts', [
        'Keep your login secure. Account deletion is available in Settings where offered. Contact support if you need help.',
      ])}
      ${proseSection('Contact', [
        'Questions: <a href="mailto:support@betweenus.semprog.de">support@betweenus.semprog.de</a>. Legal: <a href="mailto:legal@betweenus.semprog.de">legal@betweenus.semprog.de</a>.',
      ])}
    `,
  })
}

function supportHtml() {
  return pageShell({
    title: 'Support | Between Us',
    description:
      'Get help with Between Us accounts, Stories, privacy, reporting, and app issues on Android or iOS.',
    canonicalPath: '/support',
    active: 'support',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ContactPage',
      name: 'Support',
      url: `${SITE}/support`,
      description:
        'Get help with Between Us accounts, Stories, privacy, reporting, and app issues on Android or iOS.',
      isPartOf: { '@type': 'WebSite', name: 'Between Us', url: SITE },
    },
    bodyHtml: `
      <h1 class="bu-section-title">Support</h1>
      <p class="bu-marketing-lead">Need help with Between Us? We are here for account, app, and community questions.</p>
      ${proseSection('Common topics', [
        'Account &amp; login (Google, Apple, email)',
        'Reading and writing stories (Spill)',
        'Privacy and anonymity',
        'Reporting content',
        'App issues on Android or iOS',
      ])}
      ${proseSection('Contact support', [
        'Email <a href="mailto:support@betweenus.semprog.de">support@betweenus.semprog.de</a>. If you use the app, you can also send feedback from Settings → Feedback.',
        'Privacy-specific requests: <a href="mailto:privacy@betweenus.semprog.de">privacy@betweenus.semprog.de</a>.',
      ])}
      ${proseSection('Crisis resources', [
        'Between Us is a peer community — not emergency or clinical care. If you are in crisis, contact local emergency services or a crisis helpline in your country.',
      ])}
      ${relatedLinks([
        { href: '/features/safety-and-privacy', label: 'Safety & Privacy', blurb: 'how the product separates public and private' },
        { href: '/download', label: 'Download', blurb: 'get the apps' },
        { href: '/guides/', label: 'Guides', blurb: 'self-serve resources' },
      ])}
    `,
  })
}

function aboutHtml() {
  // /about is the same document as /journey. Canonical stays on /journey
  // so the two URLs are not indexed as competing copies.
  return journeyHtml().replace(
    '<title>Journey | Between Us</title>',
    '<title>About | Between Us</title>'
  )
}

function buildSitemap() {
  const urls = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/stories', priority: '0.9', changefreq: 'hourly' },
    { loc: '/features', priority: '0.9', changefreq: 'weekly' },
    { loc: '/guides/', priority: '0.85', changefreq: 'weekly' },
    { loc: '/journal/', priority: '0.9', changefreq: 'weekly' },
    { loc: '/journey', priority: '0.7', changefreq: 'monthly' },
    { loc: '/download', priority: '0.7', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.4', changefreq: 'monthly' },
    { loc: '/terms', priority: '0.4', changefreq: 'monthly' },
    { loc: '/support', priority: '0.4', changefreq: 'monthly' },
  ]

  for (const feature of FEATURES) {
    urls.push({
      loc: `/features/${feature.slug}`,
      priority: '0.8',
      changefreq: 'monthly',
    })
  }
  for (const guide of GUIDES) {
    urls.push({
      loc: `/guides/${guide.slug}`,
      priority: '0.75',
      changefreq: 'monthly',
      lastmod: guide.modified || guide.published,
    })
  }

  // Preserve existing journal article URLs when present
  const articlesPath = path.join(PUBLIC, 'journal', 'articles.json')
  if (fs.existsSync(articlesPath)) {
    try {
      const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf8'))
      const list = Array.isArray(articles) ? articles : articles.articles || []
      for (const article of list) {
        const slug = article.slug || article.path
        if (!slug) continue
        const clean = String(slug).replace(/^\/?journal\//, '').replace(/\/$/, '')
        urls.push({
          loc: `/journal/${clean}/`,
          priority: '0.7',
          changefreq: 'monthly',
          lastmod: article.published_at || article.publishedAt || article.updated_at || article.lastmod,
        })
      }
    } catch {
      // keep core urls
    }
  }

  const body = urls
    .map((u) => {
      const last = u.lastmod ? `\n    <lastmod>${String(u.lastmod).slice(0, 10)}</lastmod>` : ''
      return `  <url>
    <loc>${SITE}${u.loc}</loc>${last}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`
}

function robotsTxt() {
  return `User-agent: *
Allow: /
Disallow: /app
Disallow: /story/
Disallow: /journal-admin.html
Disallow: /landing-cms

Sitemap: ${SITE}/sitemap.xml
`
}

function storiesShowcaseJs() {
  // Public anon key is already shipped in the SPA client (src/utils/supabase/info.tsx).
  const anonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvcWJkaWl4enRvbHZ0Y2pkbmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NDEwNjcsImV4cCI6MjA3NzAxNzA2N30.MpuwFgrc1rhlhaCG73LQWgjahM3m0uR4cEd7xvnLO6g'
  return `(() => {
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
  const anonKey = ${JSON.stringify(anonKey)};

  fetch(endpoint, {
    headers: {
      apikey: anonKey,
      Authorization: 'Bearer ' + anonKey,
    },
  })
    .then((res) => res.json())
    .then((data) => {
      // Feed responses may omit success; trust an array of posts when present.
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
`
}

function main() {
  writeFile('features.html', featuresIndexHtml())
  for (const feature of FEATURES) {
    writeFile(path.join('features', `${feature.slug}.html`), renderFeaturePage(feature))
  }

  ensureDir(path.join(PUBLIC, 'guides'))
  writeFile(path.join('guides', 'index.html'), guidesIndexHtml())
  for (const guide of GUIDES) {
    writeFile(path.join('guides', `${guide.slug}.html`), renderGuidePage(guide))
  }

  writeFile('journey.html', journeyHtml())
  writeFile('about.html', aboutHtml())
  writeFile('stories.html', storiesHtml())
  writeFile('download.html', downloadHtml())
  writeFile('privacy.html', privacyHtml())
  writeFile('terms.html', termsHtml())
  writeFile('support.html', supportHtml())
  writeFile('stories-showcase.js', storiesShowcaseJs())
  writeFile('sitemap.xml', buildSitemap())
  writeFile('robots.txt', robotsTxt())
  patchJournalPublicHtml(PUBLIC)
  console.log('Public marketing pages generated.')
}

main()
