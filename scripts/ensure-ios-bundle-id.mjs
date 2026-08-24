/**
 * Capacitor sync may rewrite PRODUCT_BUNDLE_IDENTIFIER from capacitor.config appId.
 * Android stays com.betweenus.app; iOS must remain com.betweenus.fun.
 */
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const pbx = path.join(root, 'ios/App/App.xcodeproj/project.pbxproj')
const info = path.join(root, 'ios/App/App/Info.plist')
const IOS = 'com.betweenus.fun'
const ANDROID = 'com.betweenus.app'

if (!fs.existsSync(pbx)) {
  console.log('ensure-ios-bundle-id: no iOS project, skip')
  process.exit(0)
}

let pbxText = fs.readFileSync(pbx, 'utf8')
const before = pbxText
pbxText = pbxText.replaceAll(
  `PRODUCT_BUNDLE_IDENTIFIER = ${ANDROID};`,
  `PRODUCT_BUNDLE_IDENTIFIER = ${IOS};`,
)
if (!pbxText.includes(`PRODUCT_BUNDLE_IDENTIFIER = ${IOS};`)) {
  console.error('ensure-ios-bundle-id: failed to set iOS PRODUCT_BUNDLE_IDENTIFIER')
  process.exit(1)
}
if (pbxText !== before) {
  fs.writeFileSync(pbx, pbxText)
  console.log(`ensure-ios-bundle-id: restored PRODUCT_BUNDLE_IDENTIFIER to ${IOS}`)
} else {
  console.log(`ensure-ios-bundle-id: PRODUCT_BUNDLE_IDENTIFIER already ${IOS}`)
}

if (fs.existsSync(info)) {
  let infoText = fs.readFileSync(info, 'utf8')
  const infoBefore = infoText
  infoText = infoText.replaceAll(
    `<string>${ANDROID}</string>`,
    `<string>${IOS}</string>`,
  )
  // Only replace URL scheme entries — CFBundleIdentifier uses $(PRODUCT_BUNDLE_IDENTIFIER)
  if (infoText !== infoBefore) {
    fs.writeFileSync(info, infoText)
    console.log(`ensure-ios-bundle-id: restored Info.plist URL scheme to ${IOS}`)
  }
}
