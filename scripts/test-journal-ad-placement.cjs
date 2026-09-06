#!/usr/bin/env node
/**
 * Unit tests for Journal ad placement (no network, no publish).
 */
'use strict'

const assert = require('assert')
const {
  estimateWordCount,
  maxAdSlotsForLength,
  injectInContentAds,
  isAdsLive,
  adsenseHeadSnippet,
} = require('./journal-ad-placement.cjs')

function makeParagraphs(count, wordsPer = 40) {
  const word = 'word '
  const p = `<p>${word.repeat(wordsPer).trim()}.</p>`
  const parts = []
  for (let i = 0; i < count; i++) {
    if (i > 0 && i % 3 === 0) parts.push(`<h2>Section ${i}</h2>`)
    parts.push(p)
  }
  return parts.join('\n')
}

function testBudgets() {
  assert.strictEqual(maxAdSlotsForLength(200), 0)
  assert.strictEqual(maxAdSlotsForLength(500), 1)
  assert.strictEqual(maxAdSlotsForLength(900), 2)
  assert.strictEqual(maxAdSlotsForLength(1500), 3)
  console.log('OK budgets')
}

function testShortArticle() {
  const html = makeParagraphs(8, 50) // ~400 words
  const wc = estimateWordCount(html)
  assert.ok(wc < 700, 'expected short')
  const off = injectInContentAds(html, {
    clientId: '',
    slots: {},
    consentReady: false,
  })
  assert.strictEqual(off.live, false)
  assert.ok(!off.html.includes('adsbygoogle'), 'no ad markup when off')
  assert.ok(off.plannedPlacements.length <= 1)
  assert.strictEqual(off.useAfterContent, false)
  console.log('OK short', { wc, planned: off.plannedPlacements })
}

function testMediumArticle() {
  const html = makeParagraphs(20, 50) // ~1000 words
  const wc = estimateWordCount(html)
  assert.ok(wc >= 700 && wc < 1200, `expected medium got ${wc}`)
  const off = injectInContentAds(html, {
    clientId: '',
    slots: {},
    consentReady: false,
  })
  assert.strictEqual(off.maxSlots, 2)
  assert.deepStrictEqual(off.plannedPlacements, ['article-mid-1'])
  assert.strictEqual(off.useAfterContent, true)
  assert.ok(!off.html.includes('adsbygoogle'))
  console.log('OK medium', { wc, planned: off.plannedPlacements })
}

function testLongArticle() {
  const html = makeParagraphs(35, 50) // ~1750
  const wc = estimateWordCount(html)
  assert.ok(wc >= 1200, `expected long got ${wc}`)
  const off = injectInContentAds(html, {
    clientId: '',
    slots: {},
    consentReady: false,
  })
  assert.strictEqual(off.maxSlots, 3)
  assert.ok(off.plannedPlacements.length <= 2)
  assert.strictEqual(off.useAfterContent, true)
  console.log('OK long', { wc, planned: off.plannedPlacements })
}

function testLiveEmitsMarkup() {
  const html = makeParagraphs(20, 50)
  const config = {
    clientId: 'ca-pub-1234567890123456',
    slots: {
      articleMid1: '1111111111',
      articleMid2: '2222222222',
      articleAfterContent: '3333333333',
    },
    consentReady: true,
  }
  assert.strictEqual(isAdsLive(config), true)
  const live = injectInContentAds(html, config)
  assert.ok(live.html.includes('adsbygoogle'))
  assert.ok(live.html.includes('data-ad-slot="1111111111"'))
  assert.ok(adsenseHeadSnippet(config).includes('pagead2.googlesyndication.com'))
  console.log('OK live markup')
}

function testConsentBlocks() {
  const config = {
    clientId: 'ca-pub-1234567890123456',
    slots: { articleMid1: '1111111111', articleMid2: '', articleAfterContent: '' },
    consentReady: false,
  }
  assert.strictEqual(isAdsLive(config), false)
  assert.strictEqual(adsenseHeadSnippet(config), '')
  console.log('OK consent gate')
}

testBudgets()
testShortArticle()
testMediumArticle()
testLongArticle()
testLiveEmitsMarkup()
testConsentBlocks()
console.log('All journal ad placement tests passed')
