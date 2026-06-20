#!/bin/bash
set -euo pipefail

# Flack Safari Extension — Build, Sign, Notarize, Release
# Adapted from Subversive Software shared pipeline (see ../SUBVERSIVE_BUILD_RELEASE.md)

APP_NAME="Flack"
BUNDLE_ID="com.subversivesoftware.flack"
IDENTITY="Developer ID Application"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SAFARI_BUILD="$PROJECT_DIR/build/safari"
SAFARI_OVERLAY="$PROJECT_DIR/safari"
SAFARI_PROJECT="$SAFARI_BUILD/Flack"
BUILD_DIR="$PROJECT_DIR/build"
INFO_PLIST="$PROJECT_DIR/safari/Info.plist"
WWW_UPDATES="$PROJECT_DIR/../www/static/updates/flack"
PBXPROJ="$SAFARI_PROJECT/Flack.xcodeproj/project.pbxproj"

SKIP_NOTARIZE=false
if [ "${1:-}" = "--skip-notarize" ]; then
    SKIP_NOTARIZE=true
fi

echo "=== Flack Build Pipeline ==="

# --- Step 1: Build WXT Safari extension ---
echo ""
echo "--- Step 1: Build extension ---"
cd "$PROJECT_DIR"
npm run build:safari

# --- Step 2: Generate Xcode project ---
echo ""
echo "--- Step 2: Generate Xcode project ---"
rm -rf "$SAFARI_PROJECT"
xcrun safari-web-extension-converter "$PROJECT_DIR/.output/safari-mv2" \
    --project-location "$SAFARI_BUILD" \
    --app-name "Flack" \
    --bundle-identifier com.subversivesoftware.flack \
    --swift \
    --macos-only \
    --copy-resources \
    --no-open \
    --no-prompt \
    --force

# --- Step 3: Apply customizations ---
echo ""
echo "--- Step 3: Apply customizations ---"

# Overlay custom source files
cp "$SAFARI_OVERLAY/AppDelegate.swift" "$SAFARI_PROJECT/Flack/AppDelegate.swift"
cp "$SAFARI_OVERLAY/Resources/Base.lproj/Main.html" "$SAFARI_PROJECT/Flack/Resources/Base.lproj/Main.html"
cp "$SAFARI_OVERLAY/Resources/Style.css" "$SAFARI_PROJECT/Flack/Resources/Style.css"
cp "$SAFARI_OVERLAY/Resources/Script.js" "$SAFARI_PROJECT/Flack/Resources/Script.js"

# Copy entitlements
cp "$SAFARI_OVERLAY/Flack.entitlements" "$SAFARI_PROJECT/Flack/Flack.entitlements"
cp "$SAFARI_OVERLAY/FlackExtension.entitlements" "$SAFARI_PROJECT/Flack Extension/FlackExtension.entitlements"

# Generate app icons from SVG
echo "Generating app icons..."
ICON_SVG="$PROJECT_DIR/public/icon.svg"
ICONSET_DIR="$SAFARI_PROJECT/Flack/Assets.xcassets/AppIcon.appiconset"
LARGE_ICON_DIR="$SAFARI_PROJECT/Flack/Assets.xcassets/LargeIcon.imageset"

if command -v rsvg-convert &>/dev/null; then
    for size in 16 32 64 128 256 512 1024; do
        rsvg-convert -w "$size" -h "$size" "$ICON_SVG" > "$ICONSET_DIR/icon_${size}.png"
    done
    rsvg-convert -w 256 -h 256 "$ICON_SVG" > "$LARGE_ICON_DIR/LargeIcon.png"
    rsvg-convert -w 512 -h 512 "$ICON_SVG" > "$LARGE_ICON_DIR/LargeIcon@2x.png"
    rsvg-convert -w 128 -h 128 "$ICON_SVG" > "$SAFARI_PROJECT/Flack/Resources/Icon.png"
elif command -v sips &>/dev/null; then
    qlmanage -t -s 1024 -o /tmp "$ICON_SVG" 2>/dev/null && \
        mv /tmp/icon.svg.png /tmp/flack_icon_base.png || true
    if [ -f /tmp/flack_icon_base.png ]; then
        for size in 16 32 64 128 256 512 1024; do
            sips -z "$size" "$size" /tmp/flack_icon_base.png --out "$ICONSET_DIR/icon_${size}.png" 2>/dev/null
        done
        sips -z 256 256 /tmp/flack_icon_base.png --out "$LARGE_ICON_DIR/LargeIcon.png" 2>/dev/null
        sips -z 512 512 /tmp/flack_icon_base.png --out "$LARGE_ICON_DIR/LargeIcon@2x.png" 2>/dev/null
        sips -z 128 128 /tmp/flack_icon_base.png --out "$SAFARI_PROJECT/Flack/Resources/Icon.png" 2>/dev/null
        rm -f /tmp/flack_icon_base.png
    else
        echo "Warning: Could not generate icons. Install librsvg: brew install librsvg"
    fi
else
    echo "Warning: No SVG converter found. Install librsvg: brew install librsvg"
fi

cat > "$ICONSET_DIR/Contents.json" << 'ICONJSON'
{
  "images" : [
    { "filename" : "icon_16.png",   "idiom" : "mac", "scale" : "1x", "size" : "16x16" },
    { "filename" : "icon_32.png",   "idiom" : "mac", "scale" : "2x", "size" : "16x16" },
    { "filename" : "icon_32.png",   "idiom" : "mac", "scale" : "1x", "size" : "32x32" },
    { "filename" : "icon_64.png",   "idiom" : "mac", "scale" : "2x", "size" : "32x32" },
    { "filename" : "icon_128.png",  "idiom" : "mac", "scale" : "1x", "size" : "128x128" },
    { "filename" : "icon_256.png",  "idiom" : "mac", "scale" : "2x", "size" : "128x128" },
    { "filename" : "icon_256.png",  "idiom" : "mac", "scale" : "1x", "size" : "256x256" },
    { "filename" : "icon_512.png",  "idiom" : "mac", "scale" : "2x", "size" : "256x256" },
    { "filename" : "icon_512.png",  "idiom" : "mac", "scale" : "1x", "size" : "512x512" },
    { "filename" : "icon_1024.png", "idiom" : "mac", "scale" : "2x", "size" : "512x512" }
  ],
  "info" : { "author" : "xcode", "version" : 1 }
}
ICONJSON

cat > "$LARGE_ICON_DIR/Contents.json" << 'LARGEICONJSON'
{
  "images" : [
    { "filename" : "LargeIcon.png",    "idiom" : "universal", "scale" : "1x" },
    { "filename" : "LargeIcon@2x.png", "idiom" : "universal", "scale" : "2x" }
  ],
  "info" : { "author" : "xcode", "version" : 1 }
}
LARGEICONJSON

# --- Step 4: Patch Xcode project ---
echo ""
echo "--- Step 4: Patch Xcode project ---"

# Fix deployment targets
sed -i '' 's/MACOSX_DEPLOYMENT_TARGET = 10\.14/MACOSX_DEPLOYMENT_TARGET = 14.0/g' "$PBXPROJ"
sed -i '' 's/MACOSX_DEPLOYMENT_TARGET = 26\.5/MACOSX_DEPLOYMENT_TARGET = 14.0/g' "$PBXPROJ"

# Fix app bundle identifier (capital F → lowercase)
sed -i '' 's/com\.subversivesoftware\.Flack/com.subversivesoftware.flack/g' "$PBXPROJ"

# Add DEVELOPMENT_TEAM
sed -i '' 's/CODE_SIGN_STYLE = Automatic;/CODE_SIGN_STYLE = Automatic;\
					DEVELOPMENT_TEAM = 84CC987JU3;/g' "$PBXPROJ"

# Add CODE_SIGN_ENTITLEMENTS for app target
sed -i '' '/INFOPLIST_FILE = Flack\/Info.plist;/{
    a\
\				\	CODE_SIGN_ENTITLEMENTS = Flack/Flack.entitlements;
}' "$PBXPROJ"

# Add CODE_SIGN_ENTITLEMENTS for extension target
sed -i '' '/INFOPLIST_FILE = "Flack Extension\/Info.plist";/{
    a\
\				\	CODE_SIGN_ENTITLEMENTS = "Flack Extension/FlackExtension.entitlements";
}' "$PBXPROJ"

# Inject Sparkle SPM dependency into pbxproj
python3 -c "
import re, sys

path = '$PBXPROJ'
with open(path, 'r') as f:
    content = f.read()

PKG_REF = 'AA0000000000000000000001'
PROD_DEP = 'AA0000000000000000000002'
BUILD_FILE = 'AA0000000000000000000003'

# PBXBuildFile entry
build_file_line = f'\t\t{BUILD_FILE} /* Sparkle in Frameworks */ = {{isa = PBXBuildFile; productRef = {PROD_DEP} /* Sparkle */; }};\n'
content = content.replace(
    '/* End PBXBuildFile section */',
    build_file_line + '/* End PBXBuildFile section */'
)

# Add to app target's Frameworks build phase (first one with empty files list)
content = re.sub(
    r'(/\* Frameworks \*/ = \{\s*isa = PBXFrameworksBuildPhase;\s*buildActionMask = 2147483647;\s*files = \(\s*\);)',
    r'/* Frameworks */ = {\n\t\t\tisa = PBXFrameworksBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tfiles = (\n\t\t\t\t' + BUILD_FILE + r' /* Sparkle in Frameworks */,\n\t\t\t);',
    content,
    count=1
)

# Add to packageProductDependencies in Flack target
content = content.replace(
    '\t\t\tpackageProductDependencies = (\n\t\t\t);\n\t\t\tproductName = Flack;',
    f'\t\t\tpackageProductDependencies = (\n\t\t\t\t{PROD_DEP} /* Sparkle */,\n\t\t\t);\n\t\t\tproductName = Flack;'
)

# Add packageReferences to PBXProject
content = content.replace(
    '\t\t\tprojectRoot = \"\";\n',
    f'\t\t\tpackageReferences = (\n\t\t\t\t{PKG_REF} /* XCRemoteSwiftPackageReference \"Sparkle\" */,\n\t\t\t);\n\t\t\tprojectRoot = \"\";\n'
)

# Add XCRemoteSwiftPackageReference and XCSwiftPackageProductDependency sections
sparkle_sections = '''
/* Begin XCRemoteSwiftPackageReference section */
\t\t''' + PKG_REF + ''' /* XCRemoteSwiftPackageReference \"Sparkle\" */ = {
\t\t\tisa = XCRemoteSwiftPackageReference;
\t\t\trepositoryURL = \"https://github.com/sparkle-project/Sparkle\";
\t\t\trequirement = {
\t\t\t\tkind = upToNextMajorVersion;
\t\t\t\tminimumVersion = 2.0.0;
\t\t\t};
\t\t};
/* End XCRemoteSwiftPackageReference section */

/* Begin XCSwiftPackageProductDependency section */
\t\t''' + PROD_DEP + ''' /* Sparkle */ = {
\t\t\tisa = XCSwiftPackageProductDependency;
\t\t\tpackage = ''' + PKG_REF + ''' /* XCRemoteSwiftPackageReference \"Sparkle\" */;
\t\t\tproductName = Sparkle;
\t\t};
/* End XCSwiftPackageProductDependency section */
'''
content = content.replace('\t};\n\trootObject', sparkle_sections + '\t};\n\trootObject')

with open(path, 'w') as f:
    f.write(content)

print('Sparkle SPM references injected.')
"

# Resolve Sparkle package
echo "Resolving Sparkle package..."
xcodebuild -project "$SAFARI_PROJECT/Flack.xcodeproj" \
    -scheme Flack \
    -resolvePackageDependencies \
    2>&1 | tail -5

# --- Step 5: Version bump ---
echo ""
echo "--- Step 5: Version bump ---"
VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$INFO_PLIST")
CURRENT_BUILD=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$INFO_PLIST")
NEW_BUILD=$((CURRENT_BUILD + 1))
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW_BUILD" "$INFO_PLIST"
cp "$INFO_PLIST" "$SAFARI_PROJECT/Flack/Info.plist"

TAG="v${VERSION}-b${NEW_BUILD}"
echo "Version: $VERSION  Build: $NEW_BUILD  Tag: $TAG"

# --- Step 6: Build ---
echo ""
echo "--- Step 6: Build ---"
xcodebuild -project "$SAFARI_PROJECT/Flack.xcodeproj" \
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

# --- Step 7: Deep sign ---
echo ""
echo "--- Step 7: Deep sign ---"

# Sign Sparkle internals (inside-out)
SPARKLE_FW="$APP_PATH/Contents/Frameworks/Sparkle.framework"
if [ -d "$SPARKLE_FW" ]; then
    if [ -d "$SPARKLE_FW/Versions/B/XPCServices" ]; then
        for xpc in "$SPARKLE_FW"/Versions/B/XPCServices/*.xpc; do
            codesign --force --options runtime --sign "$IDENTITY" --timestamp "$xpc"
        done
    fi

    for app in "$SPARKLE_FW"/Versions/B/*.app 2>/dev/null; do
        [ -d "$app" ] && codesign --force --options runtime --sign "$IDENTITY" --timestamp "$app"
    done

    for exe in Autoupdate Updater; do
        [ -f "$SPARKLE_FW/Versions/B/$exe" ] && \
            codesign --force --options runtime --sign "$IDENTITY" --timestamp "$SPARKLE_FW/Versions/B/$exe"
    done

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

codesign --verify --verbose=2 --deep "$APP_PATH"
echo "Signing verified."

# --- Step 8: Create DMG ---
echo ""
echo "--- Step 8: Create DMG ---"
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

# --- Step 9: Notarize ---
if [ "$SKIP_NOTARIZE" = true ]; then
    echo ""
    echo "--- Step 9: Notarize (SKIPPED) ---"
else
    echo ""
    echo "--- Step 9: Notarize ---"
    xcrun notarytool submit "$DMG_PATH" \
        --apple-id "${APPLE_ID}" \
        --team-id "${TEAM_ID}" \
        --password "${APP_PASSWORD}" \
        --wait

    xcrun stapler staple "$DMG_PATH"
    echo "Notarization complete."
fi

# --- Step 10: Sparkle appcast ---
echo ""
echo "--- Step 10: Sparkle appcast ---"
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

# --- Step 11: Git tag + push ---
echo ""
echo "--- Step 11: Git tag ---"
cd "$PROJECT_DIR"
git add "$INFO_PLIST"
git commit -m "Build ${NEW_BUILD}"
git tag -a "$TAG" -m "$APP_NAME $VERSION build $NEW_BUILD"
git push && git push --tags

# --- Step 12: GitHub release ---
echo ""
echo "--- Step 12: GitHub release ---"
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

# --- Step 13: Stage appcast ---
echo ""
echo "--- Step 13: Stage appcast ---"
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
