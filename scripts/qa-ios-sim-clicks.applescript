#!/usr/bin/env osascript
-- Click English, Next, Next, Skip, then Welcome CTAs on iOS Simulator
-- Window bounds captured dynamically

on clickAt(px, py)
  tell application "System Events"
    click at {px, py}
  end tell
  delay 0.8
end clickAt

tell application "Simulator" to activate
delay 0.8

tell application "System Events"
  tell process "Simulator"
    set frontmost to true
    set win to window 1
    set {wx, wy} to position of win
    set {ww, wh} to size of win
  end tell
end tell

-- Approximate content mapping inside Simulator window (includes chrome)
-- Language English card ~ left column, first row of grid
set englishX to wx + (ww * 0.30)
set englishY to wy + (wh * 0.42)
clickAt(englishX, englishY)

-- Next button near bottom
set nextX to wx + (ww * 0.50)
set nextY to wy + (wh * 0.88)
clickAt(nextX, nextY)

-- Name step Next
clickAt(nextX, nextY)

-- Auth Skip for now — lower area above Back
set skipY to wy + (wh * 0.82)
clickAt(nextX, skipY)

delay 1.0

-- Capture after reaching Welcome (or still on Auth)
do shell script "xcrun simctl io booted screenshot /tmp/ios-mid-flow.png"

-- Try Start exploring (primary CTA)
set startY to wy + (wh * 0.72)
clickAt(nextX, startY)

delay 1.0
do shell script "xcrun simctl io booted screenshot /tmp/ios-after-start.png"

return "done"
