# Health Sync — Version history

The app and the docs share one version number. The script has its own (see below). To check which files you're using:

| File | Where to see its version |
|---|---|
| **App** (`index.html`) | At the bottom of every page, and **Settings → About** |
| **Script** (`email-to-drive.gs`) | Line 3 of the code, and the first line of the Execution log each time it runs |
| **README / SETUP / ALTERNATIVES / CHANGELOG** | At the top of README.md |
| **Your copies** | The Desktop folder name, like **Health Sync v2.13** |

### How versions are numbered (from v2.9 on)

**MAJOR.MINOR.PATCH**:
- **Major (3.0):** a big change in how Health Sync works, such as its architecture or a redesign. Rare, and agreed beforehand.
- **Minor (2.10, 2.11…):** a new feature or screen.
- **Patch (2.9.1…):** fixes and small tweaks to something that already exists. Bundled when possible.

**The script has its own version**, and it only goes up when the script's code changes. **If the script's version changes in a release, paste it in.** Otherwise leave it alone.

`config.js` has no version. It only holds your Client ID and never changes, so don't re-upload it.

### v2.13 (October 30, 2026)

- **New daily anchor: Steps.** A fourth box ticks itself at **7,500 steps or more**, using Apple Health's merged iPhone + Garmin count. While today is still going it shows your progress ("5,200 of 7,500 steps so far") rather than a miss. You can change the number in Settings › Daily anchors, which also has a new **Auto: steps** rule for any box.
- **Weekly goal is now 23 of 28** (about 80%, as 17 of 21 was). Your saved three-box settings get the Steps box added automatically. A custom goal is kept.
- **New: steps by time of day.** A **Time of day** chart on the Steps page shows average steps per hour across the range, plus the latest day, and the split before noon / noon–5 pm / after 5 pm. The Coach sees that split too.
  - It uses hourly (or minute) Health Auto Export files, scaled to the real daily total, so step counts never change.
  - It needs one extra Health Auto Export automation (README › Steps by time of day).
- **Fixed:** Lose It reports with no food in them, such as days you didn't log, said "didn't recognize the columns" or "found no dated rows". They now say **"no food logged on *day* in this Lose It report"**. As before, they stay in the Inbox and are checked again each time, and they don't change anything.
- **Removed a risky old repair:** it deleted a step total that exactly matched the sum of an hourly file. With good hourly data, that sum *is* the real total.
- Regression tests: 131 app checks (Steps box, the move from 3 boxes to 4, steps by hour on your real hourly sample, scaling, the chart, and empty Lose It reports, including Garmin-exercise-only ones).
- Script: unchanged (still v2.12.1).

### v2.12.1 (October 26, 2026)

- **Gentler with Garmin.** 2.12 sent 20 requests at once, and Garmin asked it to slow down within minutes. Now it sends 4 at a time with pauses in between, and history gets a fixed allowance each hour (about 2 weeks of days plus some workouts, so roughly a year a day). If Garmin still pushes back, the pauses grow: 1 hour, 2, 4, then up to 8.
- **History doesn't stop early** after months without the watch. It keeps going until it's past your oldest Garmin workout.
- **Fixed:** weeks without the watch could make the script decide a kind of data (such as HRV) "isn't offered" and skip it for older days. Now only days that have other data count.
- **Watch sync alert:** the Garmin row shows when your watch last synced to Garmin Connect. It turns amber after 12 hours, and you get an email after a day.
- **`garminCheck` is more useful:** it checks 14 days, reports which days came back for each kind of data, and says whether yesterday has data, when the watch last synced, and whether history is available. It also updates Data health straight away, and it waits instead of adding to Garmin's load when a pause is on.
- Regression tests: 106 app checks and 56 script checks. The fake Garmin account now has 5 months off the watch, and checks pacing and longer pauses.
- **Script: v2.12.1. Paste it (SETUP.md Step 13b), then run `setup`.**

### v2.12 (October 26, 2026)

- **New: all your Garmin data, straight from Garmin** (script v2.12, SETUP.md Step 13). Uses Garmin's free Personal API key. Every hour, the script saves everything Garmin offers into **Drive › Health Sync › Garmin**, complete and as Garmin sends it:
  - **days:** daily summary, steps, stress (with the curve), hydration, sleep (summary and detail), HRV (summary and readings), Body Battery (with the curve), weigh-ins and body composition, wellness activities, heart rate (with the curve), Pulse Ox, food logged in Garmin, and fitness age
  - **every workout:** summary, full detail, workout steps, and the original watch file
  - **profile:** settings, heart rate zones and weight goals
- **Your whole Garmin history** loads in the background, newest first, until it reaches your first Garmin day (`garminHistoryNow` speeds it up).
- **Key expiry is tracked:** amber and a weekly email from 30 days before, red once it expires.
- **Garmin row in Import › Data health:** last update, how far back history has loaded, and when the key expires.
- The app doesn't display the Garmin data yet. That comes in 2.13, built and tested on your real Garmin files.
- Regression tests: 103 app checks, plus 39 script checks that run the real script against a stand-in Google environment and a fake Garmin server built from Garmin's spec (sign-in, every endpoint, history, workouts and files, repeats, key expiry, rate limits).
- **Script: v2.12. Paste it (SETUP.md Step 13b).**

(2.11 was never uploaded. Its fixes and features ship here too.)

### v2.11 (October 26, 2026)

- **Fixed: hiding or showing a tile sometimes flipped other tiles.** If you made a change while the app was still saving the one before, the finishing save wiped it out. Saves now run one at a time, and anything changed meanwhile is kept and saved next. This also protects every other kind of edit, such as food, notes and settings. Tiles now merge one change at a time, so a tile hidden on one computer never gets un-hidden by another.
- **Fixed:** clicking **Sync** could throw away unsaved Coach or Plan changes. It now saves first.
- **New: Days to check** (Import tab). Lists days from the last 4 weeks with no food, under 800 calories, or no final Lose It report, and explains how to re-export them from loseit.com. **Looks right** hides a week.
- **New: automatic review rewrites.** Each review remembers the data it was based on. When food is added or removed, a day's calories change by 150 or more, or a workout is added, the Coach rewrites that week by itself and says why. Reviews written before 2.11 start being tracked from now on.
- Regression tests: 95 checks, including saves interrupted by a new change (these fail on 2.10.1), rewrites and the gap list.
- Script: unchanged (still v2.9).

### v2.10.1 (October 26, 2026)

- **Fixed:** the 👁 on a hidden tile didn't respond to clicks, because the tile's faded title row was covering it. It now shows the tile again.
- Regression tests: 82 checks, including one that checks the 👁 is clickable.
- Script: unchanged (still v2.9).

### v2.10 (October 26, 2026)

- **Hide dashboard tiles** (added from your home computer on Oct 21). Hover a tile and click 🙈 to hide it, or 👁 to show it again. You can also use the checkboxes under **Settings › Dashboard tiles**. Your choice is saved with your data in Drive, so it's the same on every computer.
- **The weekly Coach review waits until Monday at noon,** so Sunday's final Lose It report has time to arrive. After noon, it also waits for that report to show up (until Tuesday at the latest, then it writes the review anyway).
- If the app is already open at noon, the review starts within about 10 minutes. You don't have to reopen it.
- Script: unchanged (still v2.9). No need to paste it.

(2.9.1 was never uploaded. Its Coach change ships here.)

### v2.9 (October 19, 2026)

- **Vitamins and minerals.** About 29 micronutrients come in from Apple Health: potassium, calcium, magnesium, iron, zinc, vitamins A, B1, B2, B3, B5, B6, B12, C, D, E and K, folate, biotin, trace minerals, mono- and polyunsaturated fat, and caffeine. Lose It writes them there; its emailed report doesn't include them.
  - **Food card:** a fold-out list with % of daily value ("so far" on partial days).
  - **Calories page:** average per day against daily values.
  - **Coach:** flags clear, consistent shortfalls with plan-friendly foods, and treats the totals as a minimum.
- Regression tests: 71 checks (real Oct 15 values: potassium 1,856 mg, calcium 521 mg, vitamin C 75 mg …).
- Script: only the version number changed. Pasting it is optional.

### v2.8 (October 19, 2026)

- **Partial days are marked.** Until a day's final Lose It report arrives (always the case for today), its food is labelled:
  - **"So far today"** on the Food card
  - **"so far"** on the Calories tile
  - **(partial)** in the Calories page's Source column
  - partial in what the Coach is told
- Regression tests: 64 checks.
- Script: only the version number changed. Pasting it is optional.

### v2.7 (October 19, 2026)

- **Lose It weekly reports handled correctly.** The Monday weekly report includes a partial "today", and the app now uses each report's **send time**:
  - a day is final only once a report sent **after that day ended** arrives, so a 10:29 am snapshot of today doesn't count as the whole day
  - a report never overwrites a day with an **older** report's food
  - the Import tab notes when a report included a partial day
- Regression tests: 62 checks.
- Script: only the version number changed. Pasting it is optional.

### v2.6 (October 19, 2026)

- **Source tags:** every food item on the Dashboard and in Log today shows where it came from (Lose It, Apple Health, Strava, Manual). The Calories detail page's Daily log has a **Source** column (Lose It, Apple Health totals, Manual).
- Script: only the version number changed. Pasting it is optional.

### v2.5 (October 19, 2026)

- **Fixed:** food-based anchor boxes (Day Pack, Dinner Boundary) could tick for today before Lose It's report existed.
  - They now show **… Waiting for Lose It** for today, and for yesterday until its report arrives.
  - The Coach is told when a box is still pending.
  - Movement is unchanged: it ticks as soon as a workout arrives.
- Regression tests: 56 checks.
- Script: only the version number changed. Pasting it is optional.

### v2.4 (October 19, 2026)

- **Weight page, inspired by Happy Scale:**
  - **trend weight** (smoothed), with weigh-in dots and a dashed projection on the chart
  - **progress** to your goal, with round-number milestones
  - **trend change** over 7, 30 and 90 days and all time
  - **last-10-days** high, latest, trend and low
  - a **BMI** gauge with weight ranges for your height
  - **predictions** at your committed, current or overall rate, including your own **events**
  - goals and settings editable on the page
- The **Weight tile** now shows trend weight and its weekly rate.
- The **Coach** judges weight by the trend and its rate, not single weigh-ins, and knows your goal.
- Regression tests: 49 checks (the trend maths added).
- Script: only the version number changed. Pasting it is optional.

### v2.3 (October 19, 2026)

- **Data health monitor.** The Import tab shows when each source last delivered (Google script, Lose It, Apple Health, Strava, Coach), with what to do if one is late. A **⚠ data issue** chip appears at the top when something needs attention.
- **Alert emails:** the Google script checks every hour, even with the app closed. It emails you once a day per problem if Lose It or Health Auto Export goes quiet for 36 hours, if Health Auto Export switches to minute data, or if Strava fails. It also saves its status for the app (`health-sync-status.json`).
- **Regression tests** against your real sample files (45 checks), kept privately on your Mac.
- **Docs reorganised:** README (everyday use), SETUP (from scratch, your path), ALTERNATIVES (other routes) and CHANGELOG. Withings weight via Apple Health is documented.
- **Script v2.3: paste it, click Save, update the deployment (New version), and run `setup` once.**

### v2.2 (October 19, 2026)

- **Auto-reload support.** Tell Health Sync your console's auto-reload settings (e.g. add $20 when below $5), and the estimated balance includes each automatic top-up. There's no low-balance warning while auto-reload is on.
- Script: only the version number changed. Pasting it is optional.

### v2.1 (October 19, 2026)

- **Usage and estimated balance for the Coach.** Every call to Claude is logged with its exact token counts and cost.
  - The Coach tab shows the estimated balance and this month's spending, with a low-balance warning under $2.
  - Each review shows its cost.
  - **Settings › Coach** has **Add credit**, **Set balance** (to match the console) and a recent-calls log.
- Script: only the version number changed. Pasting it is optional.

### v2.0 (October 19, 2026)

- **New Coach tab.** Claude writes a weekly review (Mon–Sun) the first time you open the app on or after Monday, and emails it to you. Each review has:
  - a letter grade and why
  - a short narrative
  - went well / fell short / what's working / what isn't
  - a **nutrition mix** check (fiber, sodium, saturated fat, sugars, protein), with **swaps that fit your plan** and a **More swap ideas** button
  - focus for next week
- **Review now:** on-demand reviews for any dates, with an optional question and email.
- **Incomplete weeks** (food logged on fewer than half the days) aren't graded, and you can add a note to them.
- **Backfill:** weeks from September 7 are written automatically, the first time the Coach is turned on.
- **Settings › Coach:** API key, script address for email, your daily food plan, plan foods with nutrition, and nutrition targets.
- **Script v2.0: paste and redeploy (Step 14c).** It can now send the review email (`doPost` + `emailTest`).

### v1.12 (October 16, 2026)

- **Self-repair for double-counted values.** If a day still holds the inflated steps, active calories or flights saved by v1.10 or earlier from a minute/hourly file, Health Sync removes them. The day then shows "—" until a daily-total file brings the right number.
- After this update, every file in the Health Auto Export folder is **checked once more** with the improved importer, oldest first, so the newest copy of each day wins.
- Health Auto Export files are now found up to **3 folders deep** (it can create year or month subfolders).
- Script: only the version number changed. Pasting it is optional.

### v1.11 (October 16, 2026)

- **Fixed inflated steps from Health Auto Export.** Hourly or minute exports combine iPhone and Garmin samples and add them together (Oct 15 showed 14,922 instead of Apple's 11,442).
  - Health Sync now ignores **steps, active calories and flights** from those files, and the Import tab explains why. Set the automation's **Aggregation to Day** to get them.
  - Sleep, resting heart rate and other daily values from those files are still used.
- **Nutrition from Health Auto Export JSON.** Lose It's per-meal entries in Apple Health are added up per day. This is used as the backup for days with no Lose It report.
- Script: only the version number changed. Pasting it is optional.

### v1.10 (October 16, 2026)

- **Watches Health Auto Export's own Drive folder.** Health Auto Export's Google Drive automation can only save into a folder it created, usually **Health Auto Export**. Health Sync now checks that folder each time it syncs, and imports new or updated files from it.
  - Those files are left in place, because Health Auto Export keeps updating them.
  - The app remembers which version of each file it has already imported, on every computer.
- Script: only the version number changed. Pasting it is optional (if you do, update the deployment as in Step 13-1b).

### v1.9 (October 16, 2026)

- **Script can now receive Apple Health data directly** (`doPost`). Deploy it as a web app (README **Step 13-1b**), and Health Auto Export's **REST API** automation sends your data straight to it. The script saves it in your Drive Inbox, so the iPhone Files app isn't needed. A private key protects it, and the new `healthAddress` function prints the address to use.
- **Script: paste the new copy, then deploy it (Step 13-1b).** The app only changed its version number.

### v1.8 (October 16, 2026)

- Tested against a real **Health Auto Export ZIP** (manual CSV export). The app reads the daily summary file inside, and skips the per-workout detail files and empty extras (symptoms, ECG and so on). Workouts are skipped too, because Strava and Garmin already bring them in.
- **Nutrition backup from Apple Health.** Lose It writes your daily nutrition into Apple Health. On a day with **no Lose It report**, the app now shows those day totals (calories and all nutrients), labelled "from Apple Health". A Lose It report for that day always takes priority, and the two are never added together.
- **Fixed:** a Lose It CSV could be mistaken for a Health Auto Export file.
- Script: only the version number changed. Pasting the new copy is optional.

### v1.7 (October 16, 2026)

- **Health Auto Export support.** The app now reads the JSON and CSV files from the *Health Auto Export* iPhone app. It brings in steps, sleep, weight, resting heart rate, HRV, active calories, flights, water, VO₂ max, body fat and mindful minutes.
  - Units are converted automatically: kJ to calories, mL/L to fl oz, fractions to %.
  - Setup is in README **Step 13-1**. It's the recommended option when the iPhone Files app won't connect to Google Drive.
- Script: only the version number changed. Pasting the new copy is optional.

### v1.6 (October 16, 2026)

- **Apple Health import (iPhone).** A free iPhone Shortcut (README **Step 13**) copies your Apple Health data into the Drive Inbox whenever you close Lose It or Garmin Connect. Health Sync imports:
  - steps, sleep (awake time not counted) and weight
  - resting heart rate, heart rate variability, active calories, flights climbed, water, VO₂ max, body fat % and mindful minutes
- **New Body & recovery card** on the Dashboard. It appears once any of those extra measures has data, uses the same day or average setting as the tiles, and each item opens its own detail page.
- Steps and sleep from Apple Health take priority over the copies in a Lose It PDF.
- Script: only the version number changed. Pasting the new copy is optional.

### v1.5 (October 16, 2026)

- **Sortable tables.** Click any column header in a detail page's **Daily log** or the **History** tab to sort by it, and click again to reverse.
- **Custom date ranges on detail pages.** Choose **Custom range…** in the date dropdown and pick any **From** and **To** dates, or tap **This month**, **Last month**, **This year** or **Last year**.
  - Every stat, chart and table follows the range.
  - "vs previous period" compares with the same number of days just before it.
- Script: only the version number changed. Pasting the new copy is optional.

### v1.4 (October 16, 2026)

- **Automatic update check.** Each time you open the app, or switch back to it, it checks for a newer version. If there is one, a bar appears at the top: **"Version 1.x is available — Update now"**. Tap **Update now** to load it. This matters most on iPhone, where home-screen apps keep an old copy.
- Script: only the version number changed. Pasting the new copy is optional.

### v1.3 (October 16, 2026)

- **Day Pack now means "stayed within my daytime calorie budget"** instead of "had 3 shakes". It counts breakfast, lunch and snacks (everything except dinner) against a budget of **1,200 calories** to start.
  - The box shows the numbers, for example *"Auto · Daytime 1,215 of 1,200 cal"*.
  - Change the budget in **Settings → Daily anchors**. There's also a **Whole day** option.
- New rule type for any box: **Auto: calorie budget**.
- Script: only the version number changed. Pasting the new copy is optional.

### v1.2 (October 16, 2026)

- **Lose It daily CSV report** (the spreadsheet Lose It emails each day) now imports. It brings in every food, its meal, and all nutrients: protein, carbs, fat, saturated fat, fiber, sugars, sodium and cholesterol.
  - Exercise rows in that file that are copies of Garmin or Apple Health workouts are skipped, so nothing is counted twice.
  - Exercise you log directly in Lose It is still imported.
- **Nutrients everywhere:**
  - the Dashboard's Food card shows the day's nutrient totals
  - the Calories detail page shows average daily nutrients, plus fiber, sugars and sodium columns
  - the daily summary CSV download includes every nutrient
- **Fixed:** the status could stay stuck on "Importing 1 file…" when a file couldn't be read. Now it says which file it's working on, and if one can't be read it says "1 file not imported — see Import tab".
- **Fixed:** a file can no longer freeze the app. Each file has a time limit, and the PDF reader can't get stuck on long text.
- Script: only the version number changed. Pasting the new copy is optional.

### v1.1 (October 15, 2026)

- **Metric detail pages.** Click any chart, summary tile, the daily anchors box or the mood words on the Dashboard to see everything about that metric:
  - key stats, a daily chart with a 7-day average, and averages by day of the week
  - a breakdown for that metric
  - a day-by-day table
- Get back with **← Dashboard**, the **Esc** key, or your browser's Back button.
- Script: only the version number changed. Pasting the new copy is optional.

### v1.0 (October 15, 2026)

First numbered release. It includes:

- **Dashboard:**
  - summary tiles (a single day, or a 5/7/15/30-day average ending yesterday)
  - trend charts
  - mood word cloud
  - daily anchors (17 of 21 boxes a week)
- **Plan tab:** a written plan, plus PDFs, pictures and Google Docs from Drive
- **Daily anchors:** checked automatically from imported data, with a manual override
- **Log today:** feelings, plus fixing mistakes by moving or deleting a day
- **Imports:**
  - Lose It Daily Report PDFs
  - Garmin Activities CSV, plus steps, weight and sleep CSVs
  - Garmin full-export ZIP
  - Strava activities
- **Script:**
  - Lose It email attachments saved to the Drive Inbox every hour
  - Strava sync every hour, plus a one-time history backfill (`stravaBackfill`)
  - `stravaCheck` for troubleshooting
