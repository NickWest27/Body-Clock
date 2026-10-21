# Body Clock

A phone-first, offline web app that plans your sleep around long-haul trips. Enter your flights with airport codes; it works out the time zones, daylight saving and sun times, models your sleep pressure and body clock, and tells you when to sleep.

Live at https://nickwest27.github.io/Body-Clock/ (add it to your home screen from Safari's Share menu).

## Screens

- **Now**: what to do now (for example "Nap now, bed 11:00, wake 13:00", with the reason), the next few things coming up, and a colour ribbon of your alertness until you land. During an operating flight it shows your crew rest times for your Watch.
- **Trip**: one timeline of the whole trip, past and future, with a Now line: flights, crew rest, sleeps and naps you logged, sleeps the app plans, the crew night out and each layover's plan. Tap a flight or a logged sleep to change it; tap a planned sleep to open it in the calculator. + adds a flight or a sleep you took.
- **Layover**: the main decision, nap now or later. The app compares nap now, nap later, both and no nap, each with your main sleep moved earlier or later, and suggests one, with the last-drink time.
- **Calculator**: Bed, Wake and Flight. Leave Bed or Wake on Auto and it works out the best time (both on Auto gives the best sleep for that flight); type a time to set it yourself. Next sleep shows that sleep through to landing; Whole trip shows every sleep and flight to the end of the trip. Results are a timeline with a daylight rail (yellow day, blue night) and icons for bed, wake, van, flight and landing. Auto aims for the flight or your body clock. Use as my plan keeps it; Log as a sleep I took records it.
- **Charts** (tap the ribbon): Alertness; Sleep pressure, coloured low to high, with the sleep threshold (shaded red between the lines when you are tired enough to sleep, green when not), how long you have been awake and how easily you would fall asleep now; Body clock as the big three-ring clock with thin rings for the days before.
- **Body clock card** on Now, when a trip moves you an hour or more: a 24-hour dial on the local clock, noon at the top, with three named rings of daylight: outer where you are, middle the day your body expects (wider and outlined), inner home. When the middle ring lines up with the outer one you have adjusted. Tap it for a big version with thin rings for the six days before: where you were (between the outer and body rings) and your body's day (between the body and home rings).
- **Crew rest**: enter the rest times in UTC, as the crew gives them. You get Lie down and Alarm times on your Watch (assumed to be on departure time) and a timer length.
- **Settings**: home airport, usual bedtime and wake time, landing to hotel bed, van and get-ready times, layover balance, caffeine advice and cut-off, last drink before the van, destinations, backups.

## Caffeine

The Now screen has a caffeine card: the last time for caffeine before your next sleep of 1.5 hours or more (6 hours by default, crew rest included), the best coffee time for your next operating flight (about 45 minutes before the predicted low point, or as you wake from crew rest) with what it does to the lowest point and landing, and how much is in you now. Log caffeine from the card or the + on Trip (tea or cola about 50 mg, coffee about 100 mg, large or strong about 200 mg). Logged caffeine is in the model: it peaks about 45 minutes after you drink it and half is gone after 5 hours; while it is in you it lifts alertness a little, makes falling asleep harder and sleep less restful. Turn the advice off or change the cut-off in Settings.

The layover screen shows the last-drink time (12 hours before the van by default; set your company rule in Settings, the FAA minimum is 8 hours). Alcohol is not modelled.

## The model

The two-process model of sleep (Borbély, Daan and Beersma): sleep pressure rises while you are awake and clears while you sleep, and a body-clock rhythm shifts slowly with daylight where you are. Sleep inertia after waking is included. Alertness is a 0 to 100 index: Sharp 55 and up, Okay 40 to 54, Drowsy 25 to 39, Very tired below 25. The numbers are for comparing plans, not a fitness-for-duty measure.

Each layover plan is scored on alertness from wake-up to landing, the last 90 minutes counting most. Plans lose points when you would have to fall asleep at a time you probably could not, when they leave you up for long stretches under high sleep pressure, when they put the main sleep far from your usual night,. Until you enter actual crew rest, the plan assumes your expected rest in the middle of the flight.

## Find the best

- **The flight**: every candidate (5 to 10 hours of sleep, or 30 minutes to 3½ hours for a nap, in 30-minute steps) is tried with the rest of the layover re-planned around it, and scored on alertness from the van to landing, the last 90 minutes counting most, less a penalty when you are unlikely to fall asleep at that time or at your next sleep.
- **Body clock**: the most sleep in your body's own night (your usual bedtime to wake-up on your body's clock, an "anchor sleep"), as long as landing and the lowest point in flight stay within 5 points of the best for the flight.
- **Whole plan**: the layover planner's own comparison of nap now, nap later, both and none, with the main sleep earlier or later; every other night of a long layover is your usual night on the clock the balance setting picks.

## Data

Everything stays on the device. Back up trip saves a file you can keep or AirDrop to another device; Restore from file loads it. Import trip from the classic app reads the trip saved by the old app on the same device (flights whose labels name two known airport codes, like DFWGRU).

## The classic app

The previous version (build 17) lives at `classic/` (https://nickwest27.github.io/Body-Clock/classic/) and on the branch `archive/classic-v17`. It is frozen; fixes go into the new app.

## Updating

Settings › Update app checks for a newer build and reloads. GitHub Pages can take about 10 minutes to publish a change.

## Files

- `index.html`: the app's screens.
- `engine.js`: time zones, the sleep model and the layover planner.
- `airports.js`: airport codes with time zones and positions, and the starting destination list.
- `sw.js`, `manifest.webmanifest`, icons: offline use and home-screen install.
- `classic/`: the frozen classic app.
