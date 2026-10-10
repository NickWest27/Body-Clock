# Body Clock Overlay

A single-page tool for planning sleep, flights and caffeine around your body clock. It plots your home body-clock rhythm against the clock where you actually are, with an alertness estimate, sleep pressure, sun-based night shading and drag-to-edit sleep blocks.

Everything runs in the browser. Your trips are stored on your own device and are never sent anywhere.

## Plan sleep

Enter your real flights, naps and sleeps, then tap **Plan sleep**. For an upcoming flight, give it the van pickup time (on the clock you choose, local by default), how long you need to get ready and the earliest you can go to bed. With no flight ahead, choose "No flight, just a wake-up time" and it aims at the 8 hours after you get up. It tries every sleep window that ends in time, runs the full model for each, and picks the one with the best alertness. **Add to plan** puts it on the chart as a planned block you can still slide.

A warning's **Plan sleep** button opens a new planned sleep in the editor. Set the times yourself, or tap **Auto plan** to let the planner fill them in.

## Warnings

Where, while you are awake, sleep pressure is above 70% or alertness is below 25, the chart is shaded amber and the same stretch shows as an amber bar in the sleep row, so you can slide a sleep block over it. Shading and the warning box look ahead from now to 6 hours after your last landing. A list under the readout keeps every flagged stretch, past and future.

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
