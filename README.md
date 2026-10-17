# Body Clock

A phone-first, offline web app that plans your sleep around long-haul trips. Enter your flights with airport codes; it works out the time zones, daylight saving and sun times, models your sleep pressure and body clock, and tells you when to sleep.

Live at https://nickwest27.github.io/Body-Clock/ (add it to your home screen from Safari's Share menu).

## Screens

- **Now**: what to do now (for example "Nap now, bed 11:00, wake 13:00", with the reason), the next few things coming up, and a colour ribbon of your alertness until you land. During an operating flight it shows your crew rest times for your Watch.
- **Trip**: one timeline of the whole trip, past and future, with a Now line: flights, crew rest, sleeps and naps you logged, sleeps the app plans, the crew night out and each layover's plan. Tap a flight or a logged sleep to change it; tap a planned sleep to open it in the calculator. + adds a flight or a sleep you took.
- **Layover**: the main decision, nap now or later. The app compares nap now, nap later, both and no nap, each with your main sleep moved earlier or later, and suggests one. It shows how you will feel on the night out and at landing.
- **Calculator**: pick a bedtime and a wake-up (or tap Best wake-up for this bedtime) and see how easy falling asleep will be, how you will feel on waking, at the van, lowest on the next flight and at landing, each against the current plan. It re-plans the rest of the layover around that sleep. Use as my plan keeps it; Log as a sleep I took records it.
- **Alertness**: the chart until you land or for the whole trip.
- **Crew rest**: enter the rest times in UTC, as the crew gives them. You get Lie down and Alarm times on your Watch (assumed to be on departure time) and a timer length.
- **Settings**: home airport, usual bedtime and wake time, landing to hotel bed, van and get-ready times, layover balance, the crew night out rules, destinations, backups.

## Crew night out

When the evening of arrival is far enough before duty (12 hours by default), the app assumes a crew night out from 19:00 to 23:00, local time. It shows the last-drink time (12 hours before the van by default; set your company rule, the FAA minimum is 8 hours). Each layover has its own switch. Drinks are modelled only as somewhat less restful sleep afterwards, which probably flatters a big night.

## The model

The two-process model of sleep (Borbély, Daan and Beersma): sleep pressure rises while you are awake and clears while you sleep, and a body-clock rhythm shifts slowly with daylight where you are. Sleep inertia after waking is included. Alertness is a 0 to 100 index: Sharp 55 and up, Okay 40 to 54, Drowsy 25 to 39, Very tired below 25. The numbers are for comparing plans, not a fitness-for-duty measure.

Each layover plan is scored on alertness from wake-up to landing, the last 90 minutes counting most. Plans lose points when you would have to fall asleep at a time you probably could not, when they leave you up for long stretches under high sleep pressure, when they put the main sleep far from your usual night, or when they leave you less than Okay for the night out. Until you enter actual crew rest, the plan assumes your expected rest in the middle of the flight.

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
