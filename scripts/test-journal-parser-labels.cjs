#!/usr/bin/env node
/** Regression tests for Journal paste parser label handling. */
const assert = require('assert')
const paste = require('../public/journal-article-parser.js')

function visibleText(article) {
  return (article.sections || []).flatMap((s) => {
    const parts = []
    if (s.heading) parts.push(s.heading)
    ;(s.blocks || []).forEach((b) => {
      if (b.content) parts.push(b.content)
      if (b.items) parts.push(b.items.join(' '))
    })
    return parts
  }).join('\n')
}

function assertNoLabels(text) {
  const bad = [
    'Final CTA paragraph:',
    'Paragraph:',
    'Heading:',
    'Block:',
    'Content:',
    'Callout:',
    'Tip:',
    'Sections:',
  ]
  bad.forEach((label) => {
    assert.ok(
      !new RegExp('^' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'im').test(text) &&
        !text.split('\n').some((l) => l.trim() === label),
      'leaked label: ' + label + ' in:\n' + text,
    )
  })
}

// 1) Final CTA
{
  const a = paste.parseArticle(
    'Title:\nT\n\nSections:\n\nSECTION 1\nHeading:\nH\n\nFinal CTA paragraph:\nHave you ever received gossip that you absolutely could not believe?\n',
  )
  const text = visibleText(a)
  assert.ok(text.includes('Have you ever received gossip that you absolutely could not believe?'))
  assert.ok(!/Final CTA paragraph/i.test(text))
  assertNoLabels(text)
}

// 2) Paragraph label
{
  const a = paste.parseArticle('Title:\nT\n\nSections:\n\nSECTION 1\nHeading:\nH\n\nParagraph:\nThis is a paragraph.\n')
  const text = visibleText(a)
  assert.equal(text.includes('This is a paragraph.'), true)
  assert.ok(!/^Paragraph:/m.test(text))
  assert.ok(!text.split('\n').includes('Paragraph:'))
}

// 3) Heading
{
  const a = paste.parseArticle('Title:\nT\n\nSections:\n\nSECTION 1\nHeading:\nWhy Everyone Loves Gossip\n\nParagraph:\nBody.\n')
  assert.equal(a.sections[0].heading, 'Why Everyone Loves Gossip')
  assert.ok(!/Heading:/i.test(visibleText(a)))
}

// 4) Block Callout Content
{
  const a = paste.parseArticle(
    'Title:\nT\n\nSections:\n\nSECTION 1\nHeading:\nH\n\nBlock:\nCallout\n\nContent:\nYou didn\'t hear this from me.\n',
  )
  const call = a.sections[0].blocks.find((b) => b.type === 'callout')
  assert.ok(call, 'expected callout')
  assert.equal(call.content.trim(), "You didn't hear this from me.")
  assert.ok(!/Block:|Content:|Callout:/i.test(visibleText(a)))
}

// 5) Case insensitivity
{
  const a = paste.parseArticle('Title:\nT\n\nSections:\n\nsection 01\nHEADING:\nHi\n\nPARAGRAPH:\nHello.\n\nCALLOUT:\nNote me.\n')
  assert.equal(a.sections[0].heading, 'Hi')
  assert.ok(a.sections[0].blocks.some((b) => b.type === 'paragraph' && b.content.includes('Hello.')))
  assert.ok(a.sections[0].blocks.some((b) => b.type === 'callout' && b.content.includes('Note me.')))
}

// 6) Legitimate prose must survive
{
  const a = paste.parseArticle(
    'Title:\nT\n\nSections:\n\nSECTION 1\nHeading:\nH\n\nParagraph:\nHere\'s the final paragraph of the article.\n\nThe heading was surprisingly controversial.\n',
  )
  const text = visibleText(a)
  assert.ok(text.includes("Here's the final paragraph of the article."))
  assert.ok(text.includes('The heading was surprisingly controversial.'))
}

// 7) HTML strip of leaked labels
{
  const dirty =
    '<h2>End</h2>\n<p>So yes.</p>\n<p>Final CTA paragraph:</p>\n<p>Tell us what happened.</p>\n<p>FINAL VERIFICATION</p>\n<p>Do not publish.</p>'
  const clean = paste.stripParserLabelsFromHtml(dirty)
  assert.ok(clean.includes('Tell us what happened.'))
  assert.ok(!/Final CTA paragraph/i.test(clean))
  assert.ok(!/FINAL VERIFICATION/i.test(clean))
}

// 8) Reading time uses cleaned text @ ~225 wpm
{
  const words = Array.from({ length: 900 }, () => 'word').join(' ')
  const html = '<p>' + words + '</p><p>Final CTA paragraph:</p>'
  const mins = paste.estimateReadingTimeMinutes(html)
  assert.ok(mins >= 4 && mins <= 5, 'expected ~4–5 min for 900 words, got ' + mins)
}

// 9) Legitimate prose containing reserved words must survive HTML scrub
{
  const html = [
    '<p>This is the final paragraph of the article.</p>',
    '<p>The content spread quickly.</p>',
    '<p>The heading caused an argument.</p>',
    "<p>Here's a useful tip.</p>",
    '<p>The verification process was surprisingly simple.</p>',
    '<p>Final CTA paragraph:</p>',
    '<p>Have you ever heard a story like this?</p>',
  ].join('\n')
  const clean = paste.stripParserLabelsFromHtml(html)
  assert.ok(clean.includes('This is the final paragraph of the article.'))
  assert.ok(clean.includes('The content spread quickly.'))
  assert.ok(clean.includes('The heading caused an argument.'))
  assert.ok(clean.includes("Here's a useful tip."))
  assert.ok(clean.includes('The verification process was surprisingly simple.'))
  assert.ok(clean.includes('Have you ever heard a story like this?'))
  assert.ok(!/Final CTA paragraph/i.test(clean))
}

// 10) Broad FINAL keyword must NOT wipe preceding article body
{
  const html =
    '<h2>Keep Me</h2>\n<p>Hundreds of words of office gossip prose stay here.</p>\n'.repeat(20) +
    '<p>FINAL VERIFICATION</p>\n<p>1. Return to the article list.</p>\n<p>Do not publish the four articles.</p>'
  const clean = paste.stripParserLabelsFromHtml(html)
  assert.ok(clean.includes('Keep Me'))
  assert.ok(clean.includes('Hundreds of words of office gossip prose stay here.'))
  assert.ok(!/FINAL VERIFICATION/i.test(clean))
  assert.ok(!/Return to the article list/i.test(clean))
  const words = clean.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length
  assert.ok(words > 100, 'expected substantial retained prose, got ' + words)
}

// 11) Fixture articles 1 & 4 must parse to full length
{
  const fs = require('fs')
  const path = require('path')
  function serialize(sections) {
    const parts = []
    for (const s of sections) {
      if (s.heading) parts.push('<h2>' + s.heading + '</h2>')
      for (const b of s.blocks || []) {
        if (b.type === 'paragraph' && b.content) {
          parts.push('<p>' + String(b.content).replace(/\s+/g, ' ').trim() + '</p>')
        } else if (b.type === 'callout' && b.content) {
          parts.push('<p>' + b.content.replace(/\s+/g, ' ').trim() + '</p>')
        }
      }
    }
    return paste.stripParserLabelsFromHtml(parts.join('\n'))
  }
  for (const [n, minWords] of [[1, 900], [4, 1000]]) {
    const raw = fs.readFileSync(path.join(__dirname, 'fixtures/journal-paste-v2', `article-${n}.txt`), 'utf8')
    const a = paste.parseArticle(raw)
    const html = serialize(a.sections)
    const words = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(/\s+/).filter(Boolean).length
    assert.ok(words >= minWords, `article ${n} expected >= ${minWords} words, got ${words}`)
    assert.ok(!/Final CTA paragraph/i.test(html))
  }
}

// 12) Blank-line sentences must NOT become one block per sentence
{
  const a = paste.parseArticle(
    'Title:\nT\n\nSections:\n\nSECTION 1\nHeading:\nWhy Gossip Spreads\n\nParagraph:\nThis is sentence one.\n\nThis is sentence two.\n\nThis is sentence three.\n\nThis is sentence four.\n',
  )
  const paras = a.sections[0].blocks.filter((b) => b.type === 'paragraph')
  assert.ok(paras.length >= 1 && paras.length <= 2, 'expected 1–2 paragraph blocks, got ' + paras.length)
  const joined = paras.map((p) => p.content).join(' ')
  assert.ok(joined.includes('This is sentence one.'))
  assert.ok(joined.includes('This is sentence four.'))
}

// 13) Structural boundaries still create separate blocks
{
  const a = paste.parseArticle(
    'Title:\nT\n\nSections:\n\nSECTION 1\nHeading:\nWhy Gossip Spreads\n\nParagraph:\nThis is sentence one.\n\nThis is sentence two.\n\nCallout:\nThis is important.\n\nParagraph:\nThis is sentence three.\n',
  )
  const types = a.sections[0].blocks.map((b) => b.type)
  assert.equal(a.sections[0].heading, 'Why Gossip Spreads')
  assert.ok(types.includes('callout'), 'expected callout')
  assert.ok(types.filter((t) => t === 'paragraph').length <= 3, 'too many paragraph blocks: ' + types.join(','))
  const call = a.sections[0].blocks.find((b) => b.type === 'callout')
  assert.equal(call.content.trim(), 'This is important.')
  // sentence one+two should be consolidated, not two tiny blocks before callout
  const beforeCall = []
  for (const b of a.sections[0].blocks) {
    if (b.type === 'callout') break
    if (b.type === 'paragraph') beforeCall.push(b)
  }
  assert.ok(beforeCall.length === 1, 'expected one paragraph before callout, got ' + beforeCall.length)
  assert.ok(beforeCall[0].content.includes('This is sentence one.'))
  assert.ok(beforeCall[0].content.includes('This is sentence two.'))
}

// 14) Full gossip fixture should stay compact in the editor
{
  const fs = require('fs')
  const path = require('path')
  const raw = fs.readFileSync(path.join(__dirname, 'fixtures/journal-paste-v2/article-1.txt'), 'utf8')
  const a = paste.parseArticle(raw)
  const paraBlocks = a.sections.reduce((n, s) => n + s.blocks.filter((b) => b.type === 'paragraph').length, 0)
  const totalBlocks = a.sections.reduce((n, s) => n + s.blocks.length, 0)
  assert.ok(paraBlocks <= 12, 'gossip fixture too many paragraph blocks: ' + paraBlocks)
  assert.ok(totalBlocks <= 16, 'gossip fixture too many total blocks: ' + totalBlocks)
  assert.ok(paraBlocks >= 6, 'gossip fixture unexpectedly few paragraph blocks: ' + paraBlocks)
}

console.log('OK: journal paste parser regression tests passed')
