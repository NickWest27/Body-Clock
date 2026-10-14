# Body Clock Overlay

A single-page tool for planning sleep, flights and caffeine around your body clock. It plots your home body-clock rhythm against the clock where you actually are, with an alertness estimate, sleep pressure, sun-based night shading and drag-to-edit sleep blocks.

Everything runs in the browser. Your trips are stored on your own device and are never sent anywhere.

## Plan sleep

Enter your real flights and sleeps. In each flight, set your role: **Operate** (the planner scores it) or **Commute** (it does not, and it assumes you cannot sleep aboard). On an Operate flight you can also enter the **expected relief rest** in hours. Settings holds **Landing to bed** (default 2 h) and **When the clocks disagree** (home time, balanced, or local time).

Tap **Plan sleep**, choose the Operate flight and give the van pickup time (on the clock you choose), how long you need to get ready and the earliest you can go to bed. The earliest bedtime starts at the layover, which is the previous Operate flight's landing plus your landing-to-bed time. **Compare plans** shows up to five options: normal night, sleep sooner, stay up later, nap after landing and nap before the flight. Each card gives alertness at landing, the lowest point, hours asleep, how easily you would fall asleep, how much of the sleep falls in your usual night, and hours under high sleep pressure. Tap a card and **Add to plan** puts its blocks on the chart as planned sleeps you can still slide. Adding a plan replaces the planned sleeps inside the layover. Planned sleeps outside it stay, and so do sleeps marked Actual.

With no flight ahead, choose "No flight, just a wake-up time" and it aims at the 8 hours after you get up.

A warning's **Plan sleep** button opens a new planned sleep in the editor. Set the times yourself, or tap **Auto plan** to let the planner fill them in.

## Warnings

Where, while you are awake, sleep pressure is above 70% or alertness is below 25, the chart is shaded amber and the same stretch shows as an amber bar in the sleep row, so you can slide a sleep block over it. Shading and the warning box look ahead from now to 6 hours after your last landing. A list under the readout keeps every flagged stretch, past and future.

## Start a new trip

Open Settings. **Start new trip** clears all flights, sleeps and coffees. It keeps your home zone, bed and wake times, light setting and graph options. The chart starts at your most recent usual wake-up. **Load example trip** replaces everything with the built-in DFW → LHR → DFW → ATL trip, which is handy for testing. Both buttons ask you to click twice. Use **Back up trip** first if you want to keep what you have.

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
