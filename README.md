# Body Clock

A phone-first, offline web app that plans your sleep around long-haul trips. Enter your flights with airport codes; it works out the time zones, daylight saving and sun times, models your sleep pressure and body clock, and tells you when to sleep.

Live at https://nickwest27.github.io/Body-Clock/ (add it to your home screen from Safari's Share menu).

## Screens

- **Now**: what to do now (for example "Nap now, bed 11:00, wake 13:00", with the reason), the next few things coming up, and a colour ribbon of your alertness until you land. During an operating flight it shows your crew rest times on the departure city's clock.
- **Trip**: one timeline of the whole trip, past and future, with a Now line: flights, crew rest, sleeps and naps you logged, sleeps the app plans, caffeine you logged and each layover's plan. Tap a flight or a logged sleep to change it; tap a planned sleep to open it in the calculator. + adds a flight, a sleep you took or caffeine.
- **Layover**: the main decision, nap now or later. The app compares nap now, nap later, both and no nap, each with your main sleep moved earlier or later, and suggests one, with the last-drink time.
- **Change a sleep**: tap a planned sleep on Trip (or Change on Now) to try other bed and wake times, or Best wake-up for this bedtime. A timeline shows what follows: the app's re-plan of the rest of the layover, caffeine cut-off and coffee time, the van, the lowest point in flight and landing, each against the current plan. Use this keeps it; Back to the app's plan undoes it; for a past sleep, Log as a sleep I took records it.
- **Charts** (tap the ribbon): Alertness; Sleep pressure, coloured low to high, with the sleep threshold (shaded red between the lines when you are tired enough to sleep, green when not), how long you have been awake and how easily you would fall asleep now; Body clock as a tunnel (see below).
- **Body clock card** on Now, when a trip moves you an hour or more: a small body clock tunnel for the last 4 days (see Body clock tunnel), how far out of step you are, and the time where you are, on your body and at home. Tap it for the full tunnel.
- **Crew rest**: a big UTC clock, then the settings (3 or 4 pilots, which rest you take, takeoff and landing in UTC as hhmm, rest begins minutes after takeoff or a time or Now, rest ends minutes before landing, and fine tune: round to 5 minutes, a 10-minute gap between rests for the crew change, the wake-up call, one or two rests each), then the plan: flight, total and each rest, a strip of the rests and the schedule with start, end and wake-up times. Below that, your rest as Lie down and Alarm on the departure city's clock (the one you left on).
- **Settings**: home airport, usual bedtime and wake time, landing to hotel bed, van and get-ready times, layover balance, caffeine advice and cut-off, last drink before you leave, destinations, backups.

## Caffeine

The Now screen has a caffeine card: how much caffeine is in you, as a word (Trace under 25 mg, Light under 75, Strong under 150, Wired above) with the amount, the last time for caffeine before your next sleep of 1.5 hours or more (6 hours by default, crew rest included), the best coffee time for your next operating flight (about 45 minutes before the predicted low point, or as you wake from crew rest) with what it does to the lowest point and landing, and how much is in you now. Log caffeine from the card or the + on Trip (tea or cola about 50 mg, coffee about 100 mg, large or strong about 200 mg). Logged caffeine is in the model: it peaks about 45 minutes after you drink it and half is gone after 5 hours; while it is in you it lifts alertness a little, makes falling asleep harder and sleep less restful. Turn the advice off or change the cut-off in Settings.

The layover screen shows the last-drink time (12 hours before you leave for the airport by default; set your company rule in Settings, the FAA minimum is 8 hours). Alcohol is not modelled.

## Crew meetup and van pickup

On a layover you can add a crew meetup (Trip + or the layover screen) with its start and end; the plan keeps you awake for it and sleeps around it, and you can change the end if it ran late. Each flight can carry its own van pickup time. It is optional: with none (a same-day connection at the airport, or driving from home) no van is shown, and the plan only assumes you leave for the airport 2 hours before departure, less your get-ready time, to know when you must be up.

When you log a sleep or caffeine you can type the time on the local clock, the clock of the city you departed from, or UTC; the buttons are named by city.

## The model

The two-process model of sleep (Borbély, Daan and Beersma): sleep pressure rises while you are awake and clears while you sleep, and a body-clock rhythm shifts slowly with daylight where you are. Sleep inertia after waking is included. A third part, sleep debt, keeps a running balance of sleep owed beyond a usual day: each hour awake runs up half an hour owed (with an 8 h usual night), each hour asleep pays one back, bunk sleep in crew rest counts at three quarters, and unpaid debt fades over about three days. Each hour of debt takes 3 points off alertness and makes sleep come a little more easily. A planned sleep you have not logged that should already have started counts from the moment you open the app, because you are clearly awake. Alertness is a 0 to 100 index: Sharp 55 and up, Okay 40 to 54, Drowsy 25 to 39, Very tired below 25. The numbers are for comparing plans, not a fitness-for-duty measure.

Each layover plan is scored on alertness from wake-up to landing, the last 90 minutes counting most. Plans lose points when you would have to fall asleep at a time you probably could not, when they leave you up for long stretches under high sleep pressure, when they put the main sleep far from your usual night. Until you enter actual crew rest, the plan assumes your expected rest in the middle of the flight. Plans are built on your usual nights on the Layover sleep clock you set, and also on local time and home time, because on a long east-west layover one of those can be far better (two proper nights rather than a nap and a very long day); the score already counts the cost of sleeping away from your usual night. Only plans worth considering are offered: not one you would struggle to fall asleep in, not far behind the best, and not one that another plan beats or matches on score, lowest in flight, landing and the crew meetup. Often that leaves one plan, and then only that one is shown. The flight out is scored with your crew rest as the app predicts it, so a nap before you leave counts against the sleep you would then get in the bunk; each plan shows what your crew rest would be like, and when the plan is to nap, a Nap, or push through? card says what skipping the nap would do. Naps before you leave come in long (2 to 3 hours) and short (1 to 1.5 hours) versions. A short nap is offered as the Safer bet when it is nearly as good and leaves you much more likely to sleep in your crew rest, so less rides on one sleep. Which rest you take (1st, 2nd or 3rd) changes all of this, so set it on the flight. Your own times, and an option you picked, always stay on the list.

## Find the best

- **The flight**: every candidate (5 to 10 hours of sleep, or 30 minutes to 3½ hours for a nap, in 30-minute steps) is tried with the rest of the layover re-planned around it, and scored on alertness from leaving for the airport to landing, the last 90 minutes counting most, less a penalty when you are unlikely to fall asleep at that time or at your next sleep.
- **Body clock**: the most sleep in your body's own night (your usual bedtime to wake-up on your body's clock, an "anchor sleep"), as long as landing and the lowest point in flight stay within 5 points of the best for the flight.
- **Whole plan**: the layover planner's own comparison of nap now, nap later, both and none, with the main sleep earlier or later; every other night of a long layover is your usual night on the clock the balance setting picks.

## Auto plans, your times and change notices

Planned sleeps on Trip are labelled Auto (the app's plan, which moves whenever anything it depends on changes), Auto · option you picked (you chose nap now or later on the layover; the times still follow changes) or Your times (you set them with Change sleep; they stay put). Logged sleeps are facts. Every change re-plans at once, and a Plan updated card on Now and Trip says what moved: alertness at landing or the low point, the planned sleep times, and, when you are on your own times or a picked option, a better plan from the app with one tap to use it. If your times no longer fit (a flight or van moved), the app's plan comes back and the card says so.

## Crew rest calculator

Settings › Tools › Crew rest calculator (`crew-rest.html`) is the same layout without a trip: type takeoff and landing in UTC and it splits the rest window. Two pilots are always at the controls, so with 3 pilots one rests at a time in three numbered rests and with 4 pilots two rest at a time in two. Who takes which rest varies by flight (often FB, then PF, then PM). Each rest starts as the one before ends, unless Gap between rests is on. The layout is shared with the app's Crew rest screen (`crew-ui.js`). On an operated flight the same plan sets your crew rest in the sleep model; timing changed there is for that flight only until you tap Save as default. A crew rest is not a hotel bed, so the app predicts what you will get from each one from how easy sleep is when it starts (sleep pressure, body clock, caffeine, sleep debt): easy, and you fall asleep in about 15 minutes; very hard, and you lie awake about 90 minutes and then only doze. Trip and the Crew rest screen show the prediction (Should sleep well, Some sleep likely, Mostly dozing, Little or no sleep). A sleep you log during a flight you operate replaces the prediction and counts as bunk sleep.

## Body clock tunnel

The body clock is drawn as a tunnel of time. Your body's clock is fixed with its noon at the top, so its 6 in the morning is at 9 o'clock and its 6 in the evening at 3 o'clock. Time spirals inward into the past, one turn a day and each day smaller, so now is the outer edge (the blue dot). The colours are the daylight where you were at each moment, with your sleeps in purple and flights as a thin edge. In step, sunrise sits near 9 o'clock and sunset near 3; after a flight they swing round, then creep back as your body adapts. The thin frame outside is your body's usual day, from your wake time to your bedtime, and does not move. Now shows a small version for the last 4 days; tap it for the full one (6 days, with sunrise, sunset and the cities you arrived in).

## Sync between devices

Settings › Sync with your other devices keeps a phone and an iPad the same through one file in a private (secret) gist on your GitHub account. You need a classic GitHub token with only the “gist” permission and a passphrase of 8 or more characters; use the same token and passphrase on each device. The first device makes the gist; the next finds it and merges. The data is encrypted on the device before it is sent (PBKDF2-SHA-256, 310,000 rounds, then AES-GCM 256), so GitHub only holds scrambled data. Each device keeps the token and the key made from the passphrase, not the passphrase itself.

Sync runs when the app opens, when you come back to it, every few minutes while it is open and a few seconds after each change. It is a three-way merge of this device, the gist and the copy from the last sync: a change on one side wins, a change on both keeps this device's, and flights, logged sleeps and coffees merge one by one, so adding things on both devices offline loses nothing and a delete on one device deletes on the other. New items get time-based ids so two devices never reuse one. Notices stay on each device. If GitHub can't be reached, the app keeps working and tries again later.

## Data

Everything stays on your devices (and, with sync on, in your encrypted gist). Back up trip saves a file you can keep or AirDrop to another device; Restore from file loads it.

## Updating

Settings › Update app checks for a newer build and reloads. GitHub Pages can take about 10 minutes to publish a change. Development happens on `main`, which GitHub Pages publishes; for a new build, bump `BUILD` in `index.html` and `VERSION` in `sw.js`.

## Files

- `index.html`: the app's screens.
- `engine.js`: time zones, the sleep model and the layover planner.
- `airports.js`: airport codes with time zones and positions, and the starting destination list.
- `crew-rest.html`: the crew rest calculator.
- `crew-ui.js`: the crew rest layout, shared by the calculator and the app's Crew rest screen.
- `sw.js`, `manifest.webmanifest`, icons: offline use and home-screen install.
- `next/`: a notice for the old preview address (BC New), which moved to the main address.
