# Body Clock Overlay

A single-page tool for planning sleep, flights and caffeine around your body clock. It plots your home body-clock rhythm against the clock where you actually are, with an alertness estimate, sleep pressure, sun-based night shading and drag-to-edit sleep blocks.

Everything runs in the browser. Your trips are stored on your own device and are never sent anywhere.

## Plan sleep

Enter your real flights and sleeps. In each flight, set your role: **Operate** (the planner scores it) or **Commute** (it does not, and it assumes you cannot sleep aboard). On an Operate flight you can also enter the **expected relief rest** in hours. Settings holds **Landing to bed** (default 2 h) and **When the clocks disagree** (home time, balanced, or local time).

Tap **Plan sleep**, choose the Operate flight and give the van pickup time (on the clock you choose), how long you need to get ready and the earliest you can go to bed. The earliest bedtime starts at the layover, which is the previous Operate flight's landing plus your landing-to-bed time. **Compare plans** shows up to five options: normal night, sleep sooner, stay up later, nap after landing and nap before the flight. Each card gives alertness at landing, the lowest point, hours asleep, how easily you would fall asleep, how much of the sleep falls in your usual night, and hours under high sleep pressure. Tap a card and **Add to plan** puts its blocks on the chart as planned sleeps you can still slide. Adding a plan replaces the planned sleeps inside the layover. Planned sleeps outside it stay, and so do sleeps marked Actual.

**Clear planned sleeps** is at the bottom of the Log. It removes every sleep marked Planned, including planned naps and relief rests. Actual sleeps, flights and coffees stay. It asks you to tap twice.

With no flight ahead, choose "No flight, just a wake-up time" and it aims at the 8 hours after you get up.

A warning's **Plan sleep** button opens a new planned sleep in the editor. Set the times yourself, or tap **Auto plan** to let the planner fill them in.

## Zoom the chart

Pinch the chart with two fingers to zoom the time axis, and drag with two fingers to move along it. The buttons under the chart do the same: plus and minus zoom, the arrows move by half a screen, Fit shows the whole trip. On a computer, hold Ctrl and scroll. One finger still moves the pointer, drags blocks and scrolls the page. Tick labels get finer as you zoom, down to half hours, and the line under the chart shows which stretch is on screen (home clock).

## Night and places

Night shading is drawn where you are: for the city used for each zone (Atlanta for US Eastern, Dallas for US Central, São Paulo, London, Doha, Delhi and so on), and along the straight line between cities during a flight. The sun position is checked against an independent sunrise equation to within a minute. A custom UTC offset has no city, so it assumes 40°N, which makes nights too long near the equator and in the southern hemisphere. Pick a listed zone when you can.

## Flight summary

Under the readout, each Operate flight gets one line: the lowest alertness while you are awake on board, when it happens (home clock), and your alertness at landing. Numbers below 25 show in red. Time asleep on board, such as a relief rest, is left out, but sleep inertia after waking is counted.

## Warnings

Where, while you are awake, sleep pressure is above 70% or alertness is below 25, the chart is shaded amber and the same stretch shows as an amber bar in the sleep row, so you can slide a sleep block over it. Shading looks ahead from now to 6 hours after your last landing. One warning box under the readout lists every flagged stretch, with past stretches in grey, and says when to plan a sleep by. When only past stretches remain, the box turns grey and the Plan sleep button goes away.

## Fatigue ratings

Off by default. Turn on "Rate how tired you feel" in Settings to add Fatigue rating to the Add menu. Pick 1 to 7 on the Samn-Perelli scale (1 fully alert, 7 completely exhausted); the time defaults to now, on the home clock when you are in the air. Ratings show as numbered circles on the alertness line and in the Log. After 5 ratings the Trip summary shows the correlation between your ratings and the model's alertness (a perfect match is −1). Ratings carry over when you start a new trip or load the example, so the comparison builds across trips. Ratings the model has you asleep for are left out. Turning the setting off hides ratings but keeps them.

## Start a new trip

Open Settings. **Start new trip** clears all flights, sleeps and coffees. It keeps your home zone, bed and wake times, light setting and graph options. The chart starts at your most recent usual wake-up. **Load example trip** replaces everything with the built-in DFW → LHR → DFW → ATL trip, which is handy for testing. Both buttons ask you to click twice. Use **Back up trip** first if you want to keep what you have.

## Install on a phone

1. Open the site's address in Safari (iPhone) or Chrome (Android).
2. iPhone: tap Share, then **Add to Home Screen**. Android: open the menu and tap **Install app**.
3. Open it from the new icon. From then on it works offline.

On iPhone, the home-screen app keeps its own storage, separate from Safari. Add it to the Home Screen first, then enter your trip there, or use Settings, then **Restore from file**.

## Updating

Replace `index.html` (and bump `VERSION` in `sw.js`). The app fetches the new copy whenever it has a connection and shows it the next time you open it. Settings shows the build number.

To force an update on a phone, open Settings and tap **Update app**. It asks the server for the newest build with a unique address, which skips every cache on the way. If a newer build exists, it removes the saved copy and reloads. If you already have the newest build, tap again to clear the saved copy and reload anyway. Your trip is not touched. GitHub Pages can take up to about 10 minutes to publish a push, so a build may not be there yet.

## Files

- `index.html`: the whole app
- `sw.js`: offline cache
- `manifest.webmanifest`, `icon*.png`, `apple-touch-icon.png`: install details
