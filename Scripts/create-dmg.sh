#!/bin/bash
set -euo pipefail

# Flack Safari Extension — Build, Sign, Notarize, Release
# Adapted from Subversive Software shared pipeline (see ../SUBVERSIVE_BUILD_RELEASE.md)

APP_NAME="Flack"
BUNDLE_ID="com.subversivesoftware.flack"
IDENTITY="Developer ID Application"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SAFARI_PROJECT="$PROJECT_DIR/build/safari/Flack"
XCODEPROJ="$SAFARI_PROJECT/Flack.xcodeproj"
BUILD_DIR="$PROJECT_DIR/build"
INFO_PLIST="$PROJECT_DIR/safari/Info.plist"
WWW_UPDATES="$PROJECT_DIR/../www/static/updates/flack"

SKIP_NOTARIZE=false
if [ "${1:-}" = "--skip-notarize" ]; then
    SKIP_NOTARIZE=true
fi

echo "=== Flack Build Pipeline ==="

# Step 1: Regenerate Safari project (builds WXT + runs converter + patches)
echo ""
echo "--- Step 1: Generate Safari project ---"
bash "$PROJECT_DIR/Scripts/generate-safari-project.sh"

# Step 2: Version bump
echo ""
echo "--- Step 2: Version bump ---"
VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$INFO_PLIST")
CURRENT_BUILD=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$INFO_PLIST")
NEW_BUILD=$((CURRENT_BUILD + 1))
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW_BUILD" "$INFO_PLIST"

# Also update the copy in the build directory
cp "$INFO_PLIST" "$SAFARI_PROJECT/Flack/Info.plist"

TAG="v${VERSION}-b${NEW_BUILD}"
echo "Version: $VERSION  Build: $NEW_BUILD  Tag: $TAG"

# Step 3: Build
echo ""
echo "--- Step 3: Build ---"
xcodebuild -project "$XCODEPROJ" \
    -scheme Flack \
    -configuration Release \
    -derivedDataPath "$BUILD_DIR/derived" \
    ARCHS="arm64 x86_64" \
    ONLY_ACTIVE_ARCH=NO \
    DEVELOPMENT_TEAM=84CC987JU3 \
    clean build 2>&1 | tail -20

APP_PATH="$BUILD_DIR/derived/Build/Products/Release/Flack.app"

if [ ! -d "$APP_PATH" ]; then
    echo "ERROR: Build failed — $APP_PATH not found"
    exit 1
fi

echo "Built: $APP_PATH"

# Step 4: Deep sign
echo ""
echo "--- Step 4: Deep sign ---"

# Sign Sparkle internals (inside-out)
SPARKLE_FW="$APP_PATH/Contents/Frameworks/Sparkle.framework"
if [ -d "$SPARKLE_FW" ]; then
    # XPC services
    if [ -d "$SPARKLE_FW/Versions/B/XPCServices" ]; then
        for xpc in "$SPARKLE_FW"/Versions/B/XPCServices/*.xpc; do
            codesign --force --options runtime --sign "$IDENTITY" --timestamp "$xpc"
        done
    fi

    # Helper apps
    for app in "$SPARKLE_FW"/Versions/B/*.app 2>/dev/null; do
        [ -d "$app" ] && codesign --force --options runtime --sign "$IDENTITY" --timestamp "$app"
    done

    # Standalone executables
    for exe in Autoupdate Updater; do
        [ -f "$SPARKLE_FW/Versions/B/$exe" ] && \
            codesign --force --options runtime --sign "$IDENTITY" --timestamp "$SPARKLE_FW/Versions/B/$exe"
    done

    # Framework itself
    codesign --force --options runtime --sign "$IDENTITY" --timestamp "$SPARKLE_FW"
fi

# Sign the extension appex
EXTENSION_PATH="$APP_PATH/Contents/PlugIns/Flack Extension.appex"
if [ -d "$EXTENSION_PATH" ]; then
    codesign --force --options runtime --sign "$IDENTITY" --timestamp \
        --entitlements "$PROJECT_DIR/safari/FlackExtension.entitlements" \
        "$EXTENSION_PATH"
fi

# Sign the containing app
codesign --force --options runtime --sign "$IDENTITY" --timestamp \
    --entitlements "$PROJECT_DIR/safari/Flack.entitlements" \
    "$APP_PATH"

# Verify
codesign --verify --verbose=2 --deep "$APP_PATH"
echo "Signing verified."

# Step 5: Create DMG
echo ""
echo "--- Step 5: Create DMG ---"
DMG_NAME="${APP_NAME}-${VERSION}-b${NEW_BUILD}.dmg"
DMG_PATH="$BUILD_DIR/$DMG_NAME"
rm -f "$DMG_PATH"

if command -v create-dmg &>/dev/null; then
    create-dmg \
        --volname "$APP_NAME" \
        --window-pos 200 120 \
        --window-size 600 400 \
        --icon-size 100 \
        --icon "$APP_NAME.app" 175 190 \
        --hide-extension "$APP_NAME.app" \
        --app-drop-link 425 190 \
        "$DMG_PATH" \
        "$APP_PATH"
else
    echo "create-dmg not found, using hdiutil fallback..."
    STAGING="$BUILD_DIR/dmg-staging"
    rm -rf "$STAGING"
    mkdir -p "$STAGING"
    cp -R "$APP_PATH" "$STAGING/"
    ln -s /Applications "$STAGING/Applications"
    hdiutil create -volname "$APP_NAME" -srcfolder "$STAGING" -ov -format UDZO "$DMG_PATH"
    rm -rf "$STAGING"
fi

echo "Created: $DMG_PATH"

# Step 6: Notarize
if [ "$SKIP_NOTARIZE" = true ]; then
    echo ""
    echo "--- Step 6: Notarize (SKIPPED) ---"
else
    echo ""
    echo "--- Step 6: Notarize ---"
    xcrun notarytool submit "$DMG_PATH" \
        --apple-id "${APPLE_ID}" \
        --team-id "${TEAM_ID}" \
        --password "${APP_PASSWORD}" \
        --wait

    xcrun stapler staple "$DMG_PATH"
    echo "Notarization complete."
fi

# Step 7: Sparkle zip + appcast
echo ""
echo "--- Step 7: Sparkle appcast ---"
SPARKLE_DIR="$BUILD_DIR/sparkle"
rm -rf "$SPARKLE_DIR"
mkdir -p "$SPARKLE_DIR"
ZIP_NAME="${APP_NAME}-${VERSION}-b${NEW_BUILD}.zip"
ditto -c -k --keepParent "$APP_PATH" "$SPARKLE_DIR/$ZIP_NAME"

GENERATE_APPCAST=$(find "$BUILD_DIR/derived" -name generate_appcast -type f 2>/dev/null | head -1)
if [ -z "$GENERATE_APPCAST" ]; then
    GENERATE_APPCAST=$(find "$HOME/Library/Developer" -name generate_appcast -path "*/Sparkle/*" -type f 2>/dev/null | head -1)
fi
if [ -n "$GENERATE_APPCAST" ]; then
    "$GENERATE_APPCAST" "$SPARKLE_DIR"
    echo "Appcast generated."
else
    echo "Warning: generate_appcast not found. Run manually after build."
fi

# Step 8: Git tag + push
echo ""
echo "--- Step 8: Git tag ---"
cd "$PROJECT_DIR"
git add "$INFO_PLIST"
git commit -m "Build ${NEW_BUILD}"
git tag -a "$TAG" -m "$APP_NAME $VERSION build $NEW_BUILD"
git push && git push --tags

# Step 9: GitHub release
echo ""
echo "--- Step 9: GitHub release ---"
PREV_TAG=$(git tag --sort=-v:refname | grep -v "^${TAG}$" | head -1)
if [ -n "$PREV_TAG" ]; then
    RELEASE_NOTES=$(git log --pretty=format:"- %s" "${PREV_TAG}..${TAG}" -- . ':!safari/Info.plist' \
        | grep -v "^- Build [0-9]")
else
    RELEASE_NOTES="Initial release"
fi

gh release create "$TAG" \
    --title "$APP_NAME $VERSION (build $NEW_BUILD)" \
    --notes "$RELEASE_NOTES" \
    "$DMG_PATH" \
    "$SPARKLE_DIR/$ZIP_NAME"

# Step 10: Rewrite appcast URL + stage to website
echo ""
echo "--- Step 10: Stage appcast ---"
if [ -f "$SPARKLE_DIR/appcast.xml" ] && [ -d "$WWW_UPDATES" ]; then
    REPO_NAME=$(basename "$(git remote get-url origin)" .git)
    REPO_ORG=$(git remote get-url origin | sed 's|.*github.com[:/]\(.*\)/.*|\1|')
    GITHUB_URL="https://github.com/${REPO_ORG}/${REPO_NAME}/releases/download/${TAG}/${ZIP_NAME}"

    sed -i '' "s|${SPARKLE_DIR}/${ZIP_NAME}|${GITHUB_URL}|g" "$SPARKLE_DIR/appcast.xml"
    cp "$SPARKLE_DIR/appcast.xml" "$WWW_UPDATES/appcast.xml"
    echo "Appcast staged to $WWW_UPDATES"
    echo ""
    echo "Deploy website: cd ../www && git add -A && git commit -m 'Flack $VERSION build $NEW_BUILD' && git push"
else
    echo "Appcast or website directory not found. Manual staging required."
fi

echo ""
echo "=== Build complete: $APP_NAME $VERSION build $NEW_BUILD ==="
