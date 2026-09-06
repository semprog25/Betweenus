#!/usr/bin/env bash
# Build a Play-ready Android App Bundle with JDK 21.
# Never commits keystores or passwords.
#
# Required for a *signed* AAB (Play upload):
#   export BETWEENUS_UPLOAD_STORE_FILE=/absolute/path/to/betweenus-upload.jks
#   export BETWEENUS_UPLOAD_STORE_PASSWORD=...
#   export BETWEENUS_UPLOAD_KEY_ALIAS=...
#   export BETWEENUS_UPLOAD_KEY_PASSWORD=...
#
# Optional JDK override:
#   export BETWEENUS_JAVA_HOME=/path/to/jdk-21
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

JAVA21_DEFAULT="/opt/homebrew/Cellar/openjdk@21/21.0.11/libexec/openjdk.jdk/Contents/Home"
JAVA_HOME_EFFECTIVE="${BETWEENUS_JAVA_HOME:-$JAVA21_DEFAULT}"

if [[ ! -x "$JAVA_HOME_EFFECTIVE/bin/java" ]]; then
  echo "ERROR: JDK 21 not found at $JAVA_HOME_EFFECTIVE"
  echo "Install: brew install openjdk@21"
  echo "Or set BETWEENUS_JAVA_HOME to a JDK 21 home."
  exit 1
fi

JAVA_VER="$("$JAVA_HOME_EFFECTIVE/bin/java" -version 2>&1 | head -1 || true)"
if ! echo "$JAVA_VER" | grep -qE 'version "21'; then
  echo "ERROR: Expected JDK 21, got: $JAVA_VER"
  exit 1
fi

export JAVA_HOME="$JAVA_HOME_EFFECTIVE"
export PATH="$JAVA_HOME/bin:$PATH"

# Keep gradle.properties org.gradle.java.home aligned when overridden
GRADLE_PROPS="$ROOT/android/gradle.properties"
if [[ -f "$GRADLE_PROPS" ]] && [[ -n "${BETWEENUS_JAVA_HOME:-}" ]]; then
  if grep -q '^org.gradle.java.home=' "$GRADLE_PROPS"; then
    sed -i.bak "s|^org.gradle.java.home=.*|org.gradle.java.home=$JAVA_HOME|" "$GRADLE_PROPS"
    rm -f "$GRADLE_PROPS.bak"
  fi
fi

echo "Using JAVA_HOME=$JAVA_HOME"
"$JAVA_HOME/bin/java" -version

if [[ -z "${BETWEENUS_UPLOAD_STORE_FILE:-}" ]]; then
  echo "WARN: BETWEENUS_UPLOAD_STORE_FILE unset — release build will NOT be Play-signed."
  echo "      Create a Between Us upload keystore outside the repo, then export the four BETWEENUS_UPLOAD_* vars."
else
  if [[ ! -f "$BETWEENUS_UPLOAD_STORE_FILE" ]]; then
    echo "ERROR: Keystore not found: $BETWEENUS_UPLOAD_STORE_FILE"
    exit 1
  fi
  echo "Signing with store file: $BETWEENUS_UPLOAD_STORE_FILE"
fi

npm run build
npm run cap:sync

cd "$ROOT/android"
./gradlew clean bundleRelease

AAB="$ROOT/android/app/build/outputs/bundle/release/app-release.aab"
if [[ -f "$AAB" ]]; then
  echo "AAB ready: $AAB"
  ls -lh "$AAB"
else
  echo "ERROR: AAB not found at $AAB"
  exit 1
fi
