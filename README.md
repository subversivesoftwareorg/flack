# Flack - Tracking Data Poisoner

A browser extension that protects your privacy by flooding tracking services with fake data.

## How It Works

When websites send your data to tracking services like Google Analytics and Facebook Pixel, Flack detects these requests and responds by sending multiple fake tracking requests with randomly generated data. Instead of blocking trackers (which they can detect), Flack **poisons** the data by diluting your real information with noise.

**Key features:**
- Detects tracking requests from Google Analytics, Facebook, Google Ads, Criteo, TikTok, LinkedIn, and more
- Sends 5-15 fake requests per detected tracker (configurable)
- Generates realistic fake data: user agents, devices, sessions, page views, events
- Rate limiting prevents detection by tracking services
- Works across Chrome, Firefox, Safari, Edge, and Opera

## Installation

### Prerequisites

- Node.js 18+
- npm or pnpm

### Building from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/flack.git
cd flack

# Install dependencies
npm install

# Build for all browsers
npm run build:all
```

### Loading the Extension

#### Chrome / Edge / Opera

1. Build the extension: `npm run build:chrome` (or `build:edge` / `build:opera`)
2. Open your browser's extension page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Opera: `opera://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `.output/chrome-mv3` directory (or appropriate browser output)

#### Firefox

1. Build the extension: `npm run build:firefox`
2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select any file in the `.output/firefox-mv3` directory

For permanent installation, you'll need to sign the extension via [Firefox Add-ons](https://addons.mozilla.org).

#### Safari

Safari requires building a native app wrapper:

1. Build the extension: `npm run build:safari`
2. Convert to Xcode project:
   ```bash
   xcrun safari-web-extension-converter .output/safari-mv3 \
     --project-location ./build/safari \
     --app-name "Flack" \
     --bundle-identifier com.yourcompany.flack
   ```
3. Open the generated Xcode project
4. Build and run (requires Apple Developer account for distribution)

## Development

```bash
# Start development server with hot reload (Chrome)
npm run dev

# Start development server for Firefox
npm run dev:firefox

# Type checking
npm run typecheck
```

## Configuration

### Popup

Click the Flack icon in your browser toolbar to:
- Toggle the extension on/off
- View statistics (trackers detected, fake requests sent, poison ratio)
- See breakdown by tracker type
- Reset statistics

### Options Page

Access via the popup's "Settings" button or right-click the extension icon:

**Flooding Behavior:**
- Min/max fake requests per tracker (default: 5-15)
- Delay between requests in ms (default: 100-2000ms)

**Enabled Trackers:**
- Toggle individual tracking services on/off

**Rate Limiting:**
- Max requests per minute per tracker (default: 30)
- Global max per minute (default: 100)

## Supported Trackers

| Tracker | Domains |
|---------|---------|
| Google Analytics 4 | google-analytics.com, analytics.google.com |
| Universal Analytics | google-analytics.com |
| Facebook Pixel | facebook.com |
| Google Ads | googleads.g.doubleclick.net, googleadservices.com |
| Criteo | criteo.com, criteo.net |
| TikTok Pixel | analytics.tiktok.com |
| LinkedIn Insight | px.ads.linkedin.com |

## Project Structure

```
flack/
├── src/
│   ├── entrypoints/
│   │   ├── background.ts      # Service worker
│   │   ├── popup/             # Extension popup UI
│   │   └── options/           # Options page
│   ├── core/
│   │   ├── tracker-detector.ts
│   │   ├── request-flooder.ts
│   │   └── rate-limiter.ts
│   ├── trackers/              # Tracker definitions
│   ├── generators/            # Fake data generators
│   ├── storage/               # Config & stats storage
│   └── types/                 # TypeScript types
├── public/
│   └── icon.svg               # Extension icon
├── wxt.config.ts              # WXT configuration
└── package.json
```

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Development mode (Chrome) |
| `npm run dev:firefox` | Development mode (Firefox) |
| `npm run build:chrome` | Production build for Chrome |
| `npm run build:firefox` | Production build for Firefox |
| `npm run build:safari` | Production build for Safari |
| `npm run build:edge` | Production build for Edge |
| `npm run build:opera` | Production build for Opera |
| `npm run build:all` | Build for all browsers |
| `npm run zip:chrome` | Create Chrome Web Store package |
| `npm run zip:firefox` | Create Firefox Add-ons package |

## Privacy

Flack does not collect, store, or transmit any personal data. All fake tracking data is generated locally in your browser. Statistics (tracker counts) are stored locally and never leave your device.

## Future Plans

- **User Profiles**: Define custom personas with specific demographics and behaviors
- **Registration System**: Sync profiles across devices
- **More Trackers**: Pinterest, Snapchat, Reddit, and other ad platforms
- **Advanced Evasion**: Fingerprint randomization and timing variations

## Technical Notes

- Built with [WXT](https://wxt.dev) for cross-browser compatibility
- Uses Manifest V3 (MV3) for Chrome/Edge/Safari, with Firefox compatibility
- Observational request monitoring (doesn't block requests)
- Token bucket rate limiting to prevent IP blocking

## Contributing

Contributions are welcome! Please open an issue or pull request.

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Disclaimer**: This extension is for privacy protection and educational purposes. Use responsibly and in accordance with applicable laws and terms of service.
