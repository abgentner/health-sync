# Health Sync — Version history

Every release has one version number, shared by all its files. To check you're using the same files:

| File | Where to see its version |
|---|---|
| **App** (`index.html`) | At the bottom of every page, and **Settings → About** |
| **Script** (`email-to-drive.gs`) | Line 3 of the code, and the first line of the Execution log each time it runs |
| **README / SETUP / ALTERNATIVES / CHANGELOG** | At the top of README.md |
| **Your copies** | The Desktop folder name, like **Health Sync v2.4** |

`config.js` has no version. It only holds your Client ID and never changes, so don't re-upload it.

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
