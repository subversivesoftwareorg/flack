#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SAFARI_BUILD="$PROJECT_DIR/build/safari"
SAFARI_OVERLAY="$PROJECT_DIR/safari"
XCODEPROJ="$SAFARI_BUILD/Flack/Flack.xcodeproj/project.pbxproj"

echo "=== Flack Safari Project Generator ==="

# Step 1: Build WXT Safari extension
echo "Building Safari extension..."
cd "$PROJECT_DIR"
npm run build:safari

# Step 2: Run the converter
echo "Generating Xcode project..."
rm -rf "$SAFARI_BUILD/Flack"
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

# Step 3: Overlay custom files
echo "Applying customizations..."
cp "$SAFARI_OVERLAY/AppDelegate.swift" "$SAFARI_BUILD/Flack/Flack/AppDelegate.swift"
cp "$SAFARI_OVERLAY/Info.plist" "$SAFARI_BUILD/Flack/Flack/Info.plist"
cp "$SAFARI_OVERLAY/Resources/Base.lproj/Main.html" "$SAFARI_BUILD/Flack/Flack/Resources/Base.lproj/Main.html"
cp "$SAFARI_OVERLAY/Resources/Style.css" "$SAFARI_BUILD/Flack/Flack/Resources/Style.css"
cp "$SAFARI_OVERLAY/Resources/Script.js" "$SAFARI_BUILD/Flack/Flack/Resources/Script.js"

# Step 4: Generate app icons from SVG
echo "Generating app icons..."
ICON_SVG="$PROJECT_DIR/public/icon.svg"
ICONSET_DIR="$SAFARI_BUILD/Flack/Flack/Assets.xcassets/AppIcon.appiconset"
LARGE_ICON_DIR="$SAFARI_BUILD/Flack/Flack/Assets.xcassets/LargeIcon.imageset"

if command -v rsvg-convert &>/dev/null; then
    for size in 16 32 64 128 256 512 1024; do
        rsvg-convert -w "$size" -h "$size" "$ICON_SVG" > "$ICONSET_DIR/icon_${size}.png"
    done
    # LargeIcon for the containing app view
    rsvg-convert -w 256 -h 256 "$ICON_SVG" > "$LARGE_ICON_DIR/LargeIcon.png"
    rsvg-convert -w 512 -h 512 "$ICON_SVG" > "$LARGE_ICON_DIR/LargeIcon@2x.png"
    # Also update the Icon.png used in the HTML view
    rsvg-convert -w 128 -h 128 "$ICON_SVG" > "$SAFARI_BUILD/Flack/Flack/Resources/Icon.png"
elif command -v sips &>/dev/null; then
    # Fallback: convert SVG to PNG via sips (macOS built-in, limited SVG support)
    # First create a high-res base PNG
    qlmanage -t -s 1024 -o /tmp "$ICON_SVG" 2>/dev/null && \
        mv /tmp/icon.svg.png /tmp/flack_icon_base.png || true
    if [ -f /tmp/flack_icon_base.png ]; then
        for size in 16 32 64 128 256 512 1024; do
            sips -z "$size" "$size" /tmp/flack_icon_base.png --out "$ICONSET_DIR/icon_${size}.png" 2>/dev/null
        done
        sips -z 256 256 /tmp/flack_icon_base.png --out "$LARGE_ICON_DIR/LargeIcon.png" 2>/dev/null
        sips -z 512 512 /tmp/flack_icon_base.png --out "$LARGE_ICON_DIR/LargeIcon@2x.png" 2>/dev/null
        sips -z 128 128 /tmp/flack_icon_base.png --out "$SAFARI_BUILD/Flack/Flack/Resources/Icon.png" 2>/dev/null
        rm -f /tmp/flack_icon_base.png
    else
        echo "Warning: Could not generate icons. Install librsvg: brew install librsvg"
    fi
else
    echo "Warning: No SVG converter found. Install librsvg: brew install librsvg"
fi

# Write AppIcon Contents.json
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

# Write LargeIcon Contents.json
cat > "$LARGE_ICON_DIR/Contents.json" << 'LARGEICONJSON'
{
  "images" : [
    { "filename" : "LargeIcon.png",    "idiom" : "universal", "scale" : "1x" },
    { "filename" : "LargeIcon@2x.png", "idiom" : "universal", "scale" : "2x" }
  ],
  "info" : { "author" : "xcode", "version" : 1 }
}
LARGEICONJSON

# Step 5: Patch pbxproj
echo "Patching Xcode project settings..."

# Fix deployment targets
sed -i '' 's/MACOSX_DEPLOYMENT_TARGET = 10\.14/MACOSX_DEPLOYMENT_TARGET = 14.0/g' "$XCODEPROJ"
sed -i '' 's/MACOSX_DEPLOYMENT_TARGET = 26\.5/MACOSX_DEPLOYMENT_TARGET = 14.0/g' "$XCODEPROJ"

# Fix app bundle identifier (capital F → lowercase)
sed -i '' 's/com\.subversivesoftware\.Flack/com.subversivesoftware.flack/g' "$XCODEPROJ"

# Add DEVELOPMENT_TEAM to all target build configs
sed -i '' 's/CODE_SIGN_STYLE = Automatic;/CODE_SIGN_STYLE = Automatic;\
					DEVELOPMENT_TEAM = 84CC987JU3;/g' "$XCODEPROJ"

# Add CODE_SIGN_ENTITLEMENTS to the app target configs (contains INFOPLIST_FILE = Flack\/Info.plist)
# For the app target
sed -i '' '/INFOPLIST_FILE = Flack\/Info.plist;/{
    a\
\				\	CODE_SIGN_ENTITLEMENTS = Flack/Flack.entitlements;
}' "$XCODEPROJ"

# For the extension target
sed -i '' '/INFOPLIST_FILE = "Flack Extension\/Info.plist";/{
    a\
\				\	CODE_SIGN_ENTITLEMENTS = "Flack Extension/FlackExtension.entitlements";
}' "$XCODEPROJ"

# Copy entitlements files into the build directory
cp "$SAFARI_OVERLAY/Flack.entitlements" "$SAFARI_BUILD/Flack/Flack/Flack.entitlements"
cp "$SAFARI_OVERLAY/FlackExtension.entitlements" "$SAFARI_BUILD/Flack/Flack Extension/FlackExtension.entitlements"

# Step 6: Add Sparkle SPM dependency
echo "Adding Sparkle dependency..."

python3 -c "
import sys

path = '$XCODEPROJ'
with open(path, 'r') as f:
    content = f.read()

PKG_REF = 'AA0000000000000000000001'
PROD_DEP = 'AA0000000000000000000002'
BUILD_FILE = 'AA0000000000000000000003'

build_file_line = f'\t\t{BUILD_FILE} /* Sparkle in Frameworks */ = {{isa = PBXBuildFile; productRef = {PROD_DEP} /* Sparkle */; }};\n'
content = content.replace(
    '/* End PBXBuildFile section */',
    build_file_line + '/* End PBXBuildFile section */'
)

# Add Sparkle to the FIRST Frameworks build phase (the app target's — has empty files)
import re
content = re.sub(
    r'(/\* Frameworks \*/ = \{\s*isa = PBXFrameworksBuildPhase;\s*buildActionMask = 2147483647;\s*files = \(\s*\);)',
    r'/* Frameworks */ = {\n\t\t\tisa = PBXFrameworksBuildPhase;\n\t\t\tbuildActionMask = 2147483647;\n\t\t\tfiles = (\n\t\t\t\t' + BUILD_FILE + r' /* Sparkle in Frameworks */,\n\t\t\t);',
    content,
    count=1
)

# packageProductDependencies is indented with 3 tabs
content = content.replace(
    '\t\t\tpackageProductDependencies = (\n\t\t\t);\n\t\t\tproductName = Flack;',
    f'\t\t\tpackageProductDependencies = (\n\t\t\t\t{PROD_DEP} /* Sparkle */,\n\t\t\t);\n\t\t\tproductName = Flack;'
)

# projectRoot is indented with 3 tabs in the converter output
content = content.replace(
    '\t\t\tprojectRoot = \"\";\n',
    f'\t\t\tpackageReferences = (\n\t\t\t\t{PKG_REF} /* XCRemoteSwiftPackageReference \"Sparkle\" */,\n\t\t\t);\n\t\t\tprojectRoot = \"\";\n'
)

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

# Insert before the closing of the objects dict (the line with just '};\n\trootObject')
content = content.replace('\t};\n\trootObject', sparkle_sections + '\t};\n\trootObject')

with open(path, 'w') as f:
    f.write(content)

print('Sparkle SPM references injected.')
"

# Step 7: Resolve Sparkle package
echo "Resolving Sparkle package..."
xcodebuild -project "$SAFARI_BUILD/Flack/Flack.xcodeproj" \
    -scheme Flack \
    -resolvePackageDependencies \
    2>&1 | tail -5

echo ""
echo "=== Safari project generated at: $SAFARI_BUILD/Flack ==="
echo "To open in Xcode: open $SAFARI_BUILD/Flack/Flack.xcodeproj"
echo "To build: xcodebuild -project $SAFARI_BUILD/Flack/Flack.xcodeproj -scheme Flack -configuration Release build"
