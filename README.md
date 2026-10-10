# Body Clock Overlay

A single-page tool for planning sleep, flights and caffeine around your body clock. It plots your home body-clock rhythm against the clock where you actually are, with an alertness estimate, sleep pressure, sun-based night shading and drag-to-edit sleep blocks.

Everything runs in the browser. Your trips are stored on your own device and are never sent anywhere.

## Install on a phone

1. Open the site's address in Safari (iPhone) or Chrome (Android).
2. iPhone: tap Share, then **Add to Home Screen**. Android: open the menu and tap **Install app**.
3. Open it from the new icon. From then on it works offline.

On iPhone, the home-screen app keeps its own storage, separate from Safari. Add it to the Home Screen first, then enter your trip there, or use Settings, then **Restore from file**.

## Updating

Replace `index.html` (and bump `VERSION` in `sw.js`). The app fetches the new copy whenever it has a connection and shows it the next time you open it. Settings shows the build number.

## Files

- `index.html`: the whole app
- `sw.js`: offline cache
- `manifest.webmanifest`, `icon*.png`, `apple-touch-icon.png`: install details
