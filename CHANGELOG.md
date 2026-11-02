# Health Sync — Version history

**Every file shares one version number** (from v3.0 on): the app, the script, README, SETUP, ALTERNATIVES and this file. Each release bumps all of them together, and its notes say which files **only had their number changed**. To check which files you're using:

| File | Where to see its version |
|---|---|
| **App** (`index.html`, with `core.js`, `importers.js`, `rules.js`, `sync.js`) | At the bottom of every page, and **Settings → About**. `index.html` loads the other four with the same version in their address (`core.js?v=3.2.1`), so a phone never mixes old and new files |
| **Tests** (`tests.html`) | Uses whatever `core.js`, `importers.js`, `rules.js` and `sync.js` sit next to it, and fails if any file's version doesn't match `APP_VERSION` |
| **Script** (`email-to-drive.gs`) | Line 3 of the code, and the first line of the Execution log each time it runs. Data health turns amber if it doesn't match the app |
| **README / SETUP / ALTERNATIVES** | The line at the top of each file |
| **CHANGELOG** | Its newest entry |
| **Your copies** | The Desktop folder name, like **Health Sync v3.3** |

### How versions are numbered

**MAJOR.MINOR.PATCH**:
- **Major (3.0, 4.0…):** a big change in how Health Sync works, such as where its data comes from, its architecture or a redesign. Rare, and agreed beforehand.
- **Minor (3.1, 3.2…):** a new feature or screen.
- **Patch (3.0.1…):** fixes and small tweaks to something that already exists. Bundled when possible.
- **Docs-only fixes** to the release just shipped keep its number, and are noted in its entry as a docs follow-up. That way you don't paste the script again for a wording change. Any change to code gets a new number.

**Paste the script every release**, even if only its number changed, so everything stays on one version (README › Updating the app). Before v3.0 the script had its own number, which is why older entries below mention script versions such as 2.12.1.

`config.js` has no version. It only holds your Client ID and never changes, so don't re-upload it.

### Every release, in this order

1. **Bump the version in every file:** `APP_VERSION` and the comment at the top of `index.html`; the `?v=` on its four script tags (`core.js`, `importers.js`, `rules.js`, `sync.js`); line 3 and `SCRIPT_VERSION` in `email-to-drive.gs`; and the line at the top of README, SETUP and ALTERNATIVES.
2. **Update the docs** for whatever changed. In particular, README for anything you can see or do, and SETUP for anything about setting up.
3. **Add a CHANGELOG entry** with a table of every file and what changed in it. Mark files whose only change is the number as **Version number only**.
4. **Add a check to `tests.html`** for each fix or new rule, so it can't break again unnoticed.
5. **Open `tests.html` and confirm it's all green.**
6. **Push or upload all the app files together.** `index.html`, `core.js`, `importers.js`, `rules.js` and `sync.js` only work as a set.
7. **GitHub runs the tests and publishes only if they pass** (since v3.3). Check for the ✅ next to the change on GitHub. A ❌ means it wasn't published; open it to see the failing check. Then **paste the script** into script.google.com.

### v3.3.2 (November 2, 2026)

- **Fixed: Garmin day history stopped moving back while workouts were loading.** Each hourly run has 2 minutes for history, and it did workouts first. Each old workout takes about 6 seconds (its detail plus the original watch file), so about 10 workouts used up the time, and the days never got a turn. Your log showed *workouts 585–594 checked* while days stayed at Sep 29 for a week. Now each run loads **a week of days first**, then workouts with whatever time is left. Both keep moving, and the run stays inside Google's 90-minutes-a-day limit.
- Tests: the script suite on the work Mac (`script-tests.html`, which runs the real script against a stand-in Google and a fake Garmin) has a new check: with workouts still to load, every hourly run moves the days back by a week. It fails on 3.3.1. `tests.html` doesn't load the script, so it has no change except its version check.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `email-to-drive.gs` | History loads a week of days first, then workouts. **Paste it** (README › Updating the app). |
  | `SETUP.md` | Step 13: how history loads, and the example log |
  | `index.html` | **Version number only** (with the four `?v=` script tags) |
  | `README.md` | **Version number only** |
  | `ALTERNATIVES.md` | **Version number only** |
  | `CHANGELOG.md` | This entry |

### v3.3.1 (November 1, 2026)

- **Fixed: a save could wipe what another device logged that day.** A save replaced the whole day in Drive with this device's copy. So if the Mac had been open for hours and imported Apple Health for today, drinks, mood or food logged on the phone for today were lost. Now each save compares this device's copy with how it was when it last loaded or saved, and writes **only the fields it changed**, one field at a time (inside an entry too, so mood from one device and stress from another both stay). If both devices change the same field, the last save wins. Food and workout lists are taken whole.
- **Saving and merging moved to its own file, `sync.js`, and is now tested.** It used to live in `index.html`, untested.
- Tests: 104 checks, up from 71.
  - Two devices, using a pretend Drive: same-day edits from both, the same field on both, lists, a cleared field, a deleted day, a stale copy of a day, tiles hidden on both, reviews, clearing the Problems log.
  - Failures and timing: a failed save keeps the change and logs it; a change made during a save; two saves at once.
  - Nothing silently dropped: every field in the saved file must have a merge check, and every field the code writes must be kept by `normalize()`. Both have caused bugs before.
  - One version everywhere: fails if the app, the four script tags, the script or any doc has a different version. That rule used to rely on remembering.
  - Checked: putting the old whole-day save back makes 4 of the new checks fail, and a mismatched version fails the version check.
- **Follow-up, same release:** GitHub's test run now also starts the real app (this-computer-only mode, a made-up day), saves an edit, and fails on any page error. Before, that check only existed on one computer. CI only, no app change, so it's still 3.3.1.
- **Docs follow-up, same release:** the real-file suite moves to a private repository, `abgentner/health-sync-real-tests`, which runs it nightly against the live app. It is no longer only on the home Mac. The README's Tests section says where it is.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `sync.js` | **New:** saving and merging, moved from `index.html`; field-by-field merge |
  | `index.html` | Saving moved out; loads `sync.js`; version and script tags |
  | `tests.html` | 33 new checks (104 in all); loads `sync.js` |
  | `core.js` | Comment only (mentions `sync.js`) |
  | `README.md` | New question: the phone and a computer on the same day; Tests; how the app is split; file lists |
  | `SETUP.md` | File lists include `sync.js`; version line |
  | `CHANGELOG.md` | This entry; file table and release checklist mention `sync.js` |
  | `email-to-drive.gs` | **Version number only** (3.3 → 3.3.1). **Paste it** so Data health shows the same version. |
  | `ALTERNATIVES.md` | **Version number only** |
  | `.github/run-tests.mjs` | Also starts the real app, saves an edit, and fails on any page error (follow-up, same release) |
  | `importers.js`, `rules.js`, `config.js` | Not changed |

### v3.3 (October 31, 2026)

- **New: Your why** (Coach tab): what you're doing this for, in your own words. Report cards connect the period to it where it fits.
- **New: weekly Reflection** (Coach tab): *What got in the way?* and *What helped?*, for this week or last week. Report cards read it, and monthly and longer cards read every week inside them. It can explain a grade, and the criticism and suggestion take it into account, **but it never changes the grade.** No extra Claude cost: it goes into the report card that's being written anyway.
- **New: weight-loss pace alarm.**
  - **Red**, "Losing too fast": over 1% of body weight a week across 4 weeks, which costs muscle as well as fat.
  - **Amber**, "Watch your pace": over 1.25% a week across the last 2 weeks, or over twice your committed rate.
  - It shows in Data health (red or amber also lights the ⚠ chip), on the Weight page and to the Coach.
  - The pace is a straight line through the actual weigh-ins. The first version used the smoothed trend, and a test showed it lagged so much that it wouldn't warn until about 2% a week. Daily water swings of ±2 lb don't set it off; that's tested.
- **New: alcohol.** Drinks per day come from three places, in this order: a number you type in Log today (0 for a dry day); Apple Health's *Number of Alcoholic Beverages*; or the drinks in your Lose It log, counted by quantity. Foods that only sound like drinks, such as root beer, beer-battered fish or wine vinegar, are left out. Drinks show in Body & recovery and feed Patterns and the Coach.
- **New: Patterns** (Dashboard). For drinks, a big dinner, a salty day, a sugary day, under-eating or a late workout, it compares the next night and morning (sleep, sleep score, HRV, resting heart rate, energy, mood, the scale) with days without, over the last 90 days. It only shows a pattern with 5+ days each way and a difference bigger than your normal swing, and it's labelled a pattern, not proof. The Coach gets them too. Rules only, so no Claude cost.
- **New: Problems log** (Import tab). Errors from any device, kept with your data: failed syncs, unreadable files, report cards that couldn't be written, failed saves and emails, unexpected app errors. Repeats within a minute are counted, not listed again. **Clear** empties it everywhere.
- **Faster Garmin syncs.** Every sync used to list every Garmin file ever saved, and that grows daily. Now the app remembers the newest file time it has read in each Garmin folder and asks Drive only for files changed since then. A file that fails holds the mark back so it's read again. The old list of every file read is removed from the data file (about 70 KB for two years of history). Correction to the v3.2.1 review: the data file was never going to get heavy from that list; the cost was the listing on every sync. Your day-by-day data grows by about 1–1.5 MB a year, which is fine for years.
- **New: GitHub runs the tests on every change and publishes the site only if every check passes** (`.github/workflows/tests.yml`, with `.github/run-tests.mjs`). A failing check shows ❌ on GitHub, and your app stays on the previous version. GitHub Pages was switched from "publish the main branch" to "publish from this workflow" for this. I checked that a deliberately broken rule makes the run fail.
- **Follow-up, same release:** the workflow now uses the current GitHub actions (`checkout@v5`, `setup-node@v5`, Node 24), because GitHub is retiring the Node 20 runtime the first version used. This is CI only, with no app change, so it's still 3.3.
- Tests: 71 checks, up from 52: the pace alarm (including water swings and sparse weigh-ins), alcohol (counting, look-alikes, which source wins), Patterns (finds a real effect, ignores a non-effect, needs 5 days each way), the Garmin file mark, and saving the new data.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `index.html` | Why and Reflection cards, Patterns card, pace alarm in Data health and on the Weight page, drinks in Log today, Problems log, faster Garmin listing, reflections and the problems log synced between devices; version and script tags |
  | `rules.js` | Pace alarm, drinks, Patterns; what the Coach is told about why, reflections, patterns and pace |
  | `importers.js` | Garmin newest-file mark; Apple Health alcoholic beverages; errors go to the Problems log |
  | `core.js` | Saves reflections, the Garmin mark and the Problems log; drinks in Body & recovery |
  | `tests.html` | 19 new checks (71 in all) |
  | `.github/workflows/tests.yml`, `.github/run-tests.mjs` | **New:** test, then publish |
  | `README.md` | Patterns, pace alarm, why and reflection, drinks, Problems log, Data health table, how publishing works now, Tests |
  | `SETUP.md` | Step 11: Number of Alcoholic Beverages (optional); version line |
  | `CHANGELOG.md` | This entry; release checklist step 7 |
  | `email-to-drive.gs` | **Version number only** (3.2.1 → 3.3). **Paste it** so Data health shows the same version. |
  | `ALTERNATIVES.md` | **Version number only** |
  | `config.js` | Not changed (it has no version) |

### v3.2.1 (October 31, 2026)

- **New: `tests.html`, a test page anyone can run.** Open it, and 52 checks run against made-up sample files, each shown green or red. They cover every importer, which source wins, keeping one copy of each workout, training load, readiness, pain flags, the weight trend and the report-card grades. It contains no health data, so it lives on GitHub, and either computer can check a release before it goes out (README › Tests).
- **The app is split into four files, so the tests can load the logic without the screens:**
  - `core.js`: helpers and the data model
  - `importers.js`: Lose It, Apple Health, Garmin, Strava
  - `rules.js`: anchors, training load and readiness, weight trend, report-card grades
  - `index.html`: screens, Drive and the Coach

  The code was moved by a script, block for block, not retyped. **Nothing changes in what the app does.**
- **What the tests caught straight away:** three small helpers (`avg`, `windowKeys`, `plural`) that the moved code needed were still in the screen code. The app worked only because everything happened to be loaded together. They're in `core.js` now.
- I checked that the tests can fail: breaking which source wins, or how load is worked out, turns the matching checks red with a clear message.
- **Releasing now means:** bump the version in every file, including the `?v=` on the three script tags in `index.html`; run `tests.html`; and upload or push all the app files together. The full checklist is at the top of this file (Every release, in this order).
- **Docs follow-up, same release:** README › Updating the app now lists all the files, says to upload them together and to run `tests.html` once live, and the release checklist is at the top of this file. No code changed, so the version stays 3.2.1.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `index.html` | Split: loads `core.js`, `importers.js` and `rules.js`, keeps the screens. No change in behaviour |
  | `core.js`, `importers.js`, `rules.js` | **New files,** moved from `index.html` |
  | `tests.html` | **New** |
  | `README.md` | New Tests section, and how the files are split; which files to upload |
  | `SETUP.md` | The file list for a fresh setup; version line |
  | `CHANGELOG.md` | This entry, and the files table at the top |
  | `email-to-drive.gs` | **Version number only** (3.2 → 3.2.1). **Paste it** so Data health shows the same version. |
  | `ALTERNATIVES.md` | **Version number only** |
  | `config.js` | Not changed (it has no version) |

### v3.2 (October 31, 2026)

- **New: report cards, weekly, monthly, quarterly and yearly.** Every period gets a grade for each subject and a GPA, like school (README › Coach):
  - **Subjects:** Daily anchors (3 credits), Nutrition (3), Training (2), Sleep habits (2), Logging (1) and Assignments (1).
  - **Results that aren't graded:** weight, HRV, resting heart rate, mood and pain are tracked next to the grades.
- **The app works out the grades; Claude only writes the words.** Before, Claude chose the letter, so the same week could get a B one time and a B+ the next. Now every grade comes from fixed rules against your targets, so grades can be compared across weeks, months and years, and each card shows the parts behind each grade. The one exception is Assignments, which Claude marks done, partly or missed, citing the data.
- **Each subject gets praise, criticism and a suggestion.** Praise is left empty when nothing went well, and the Coach is told not to pad or flatter.
- **Assignments carry forward with a limit.** Each card marks last period's assignments and sets 1–3 new ones. An unfinished one can carry over twice. After that it needs a stated reason, or it has to be retired with one.
- **A Logging subject closes a loophole:** skipping the log on bad days would otherwise raise the Nutrition grade.
- **Nutrition grades food quality,** not calories: protein, fiber, sodium, saturated fat, sugars and a 1,500-calorie safety floor. Calories against your budgets are already graded under the anchors.
- **Monthly, quarterly and yearly cards** are written on the 1st of each, from noon. Claude gets the grades, the summaries of the shorter cards inside them, and the foods behind each nutrition problem (per serving and in total), rather than every day, so they cost about the same as a weekly one. Quarterly and yearly cards compare with the same period last year. Each card rewrites itself if one of its grades changes later.
- **New: Coach › Report cards is a nested history:** years › quarters › months › weeks, each row showing its grade, GPA and headline, and opening to its full card and the level below. Periods still running show their grades so far, worked out live. Past periods without a written card show their grades too, with a **Write report** button. The grades work even without an API key.
- **New: Settings › Coach › Report card targets.**
  - Targets: protein **100 g** (your plan gives about 86–150 g a day), calorie floor **1,500**, **4 workouts a week** of 10+ min (anything in Garmin or Strava counts), **2 strength sessions**, **7 h** asleep, in bed by **10:00 pm**.
  - The credits for each subject are set there too.
- **Bedtime is now recorded** from Garmin and Health Auto Export, for the Sleep habits grade.
- Weekly reviews written before v3.2 keep their old layout until they're regenerated or their data changes.
- Tests: 29 new checks: grade parts and scale, credit-weighted GPA, the same data getting the same grade, the logging loophole, bedtimes across midnight, period dates, assignments marked and carried (including the third-carry rule), weekly and monthly digests, quarterly and yearly digests, and the history tree. Claude was replaced by a stand-in for these, so no real report was written. **The real-file suite on the home Mac wasn't run.**
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `index.html` | Everything above |
  | `README.md` | Coach section rewritten for report cards, with the full rubric; setup table; Every day; regression note |
  | `SETUP.md` | Step 12 rewritten: report cards at every level, cost, where to get the API key, report card targets; version line |
  | `CHANGELOG.md` | This entry |
  | `email-to-drive.gs` | **Version number only** (3.1 → 3.2), no code changes. **Paste it** so Data health shows the same version. |
  | `ALTERNATIVES.md` | **Version number only** |
  | `config.js` | Not changed (it has no version) |

### v3.1 (October 31, 2026)

- **New: Training tab.** Shows how hard to train, and whether your training is building sensibly (README › Training):
  - **Readiness:** *Ready for a hard session*, *Normal training* or *Take it easy today*. It compares last night's HRV, resting heart rate and sleep with your own usual (the 28 days before), and adds yesterday's load, any load spike and your body log. Every reason is listed. A short version is on the Dashboard, under the tiles.
  - **Training load:** your last 7 days against your usual week (the 4 weeks before), with a 12-week chart. It flags *building fast* (1.3–1.5×) and *spike* (over 1.5×).
  - **Intensity mix:** easy, moderate and hard heart-rate-zone minutes, for 7 days and 4 weeks.
  - **Strength:** sessions per week, and sets and reps by exercise.
  - **Body log** and **Workouts** for the last 2 weeks.
- **New: Garmin workouts with full detail.** The app now reads the workout files the script has saved since v2.12 (Drive › Health Sync › Garmin › activities). Each workout gets:
  - heart-rate zones
  - Garmin's training load and training effect
  - strength sets and reps

  The Garmin copy of a workout replaces the Strava or Activities-CSV copy (best copy first: Garmin's file, then the CSV, then Strava). Workouts without Garmin's load get an estimate, marked "est.".
- **New: body log** in Log today. Log soreness, pain or stiffness by body area, 0–10, with a note. Pain that repeats 3 days running, gets worse 3 times in a row, or reaches 7/10 is flagged, with advice to ease off and when to see a physical therapist or doctor.
- **Coach:** reviews have a new **Training and recovery** section: load, intensity mix, strength, recovery, pain to watch, and one or two suggestions for next week. The Coach now also sees each workout's zones, load, training effect and sets, the body log and each day's readiness.
  - **Note:** past weekly reviews rewrite themselves when a workout is added to their week (since v2.11). If Garmin brings in workouts that never reached Strava, some past weeks may be rewritten, at most 3 every 10 minutes. Each rewrite is a normal Coach call.
- Tests: 25 new checks against data built in each format: workout files, best-copy rules (Garmin file over CSV over Strava, in both orders), readiness on a poor-recovery day and an ordinary day, load and intensity numbers, the pain flag, the body log form, the Coach's data and the Training tab on desktop and phone. The v3.0 duplicate and sleep rules were re-checked too. **The real-file suite on the home Mac wasn't run.**
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `index.html` | Everything above |
  | `README.md` | New Training section; Readiness on the Dashboard; Log today › Body; Coach review contents; workouts in Which source wins; setup table; privacy, FAQ and troubleshooting rows |
  | `SETUP.md` | Step 13: what the app uses from Garmin's workout files, and what to look for after the first sync; version line |
  | `ALTERNATIVES.md` | The Activities CSV isn't needed with Step 13, and how its copies rank; version line |
  | `CHANGELOG.md` | This entry |
  | `email-to-drive.gs` | **Version number only** (3.0.1 → 3.1), no code changes. **Paste it** so Data health shows the same version. No need to run `setup` or make a new deployment. |
  | `config.js` | Not changed (it has no version) |

### v3.0.1 (October 31, 2026)

- **The script shows its progress, step by step.** The Garmin step takes 1–3 minutes, because it pauses between requests to stay gentle with Garmin. It used to print nothing until the end, so a normal run looked stuck after "Strava: nothing new." Now every step logs as it starts and as it finishes:
  - **Email:** what it's looking for, how many new emails it found, and what it saved
  - **Strava:** checking, how many new workouts, then saved or nothing new. It now says "not connected, skipped" instead of saying nothing.
  - **Garmin:** the last 3 days (with how long they took), then history week by week and workouts page by page. It says "not connected, skipped" without a key.
  - **Data health:** checking, then how many problems there are, named, and which ones it emailed you about
  - **The end of the run:** `Done in … s`, and which steps failed, if any
  - **`stravaBackfill`, `garminHistoryNow` and the Apple Health receiver** log their progress too.

  Example in SETUP.md Step 13d.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `email-to-drive.gs` | The progress lines above. Nothing else changes in what it does. **Paste it** (README › Updating the app). No need to run `setup`. If you use the Health Auto Export receiver or the Coach email, also make a **New version** deployment so the receiver logs too. |
  | `SETUP.md` | Step 9c, 10e and 13d: what the log looks like now, with a full example run; version line |
  | `CHANGELOG.md` | This entry |
  | `index.html` | **Version number only** (3.0 → 3.0.1) |
  | `README.md` | **Version number only** |
  | `ALTERNATIVES.md` | **Version number only** |
  | `config.js` | Not changed (it has no version) |

### v3.0 (October 31, 2026)

- **Garmin data now shows up in the app.** Since v2.12 the script has saved everything Garmin offers into Drive › Health Sync › Garmin, but the app never read it. That's why sleep was blank. Now, on every sync, it reads new and updated Garmin day files:
  - **sleep with sleep score**
  - **overnight HRV, Body Battery (high) and stress**, as new measures in Body & recovery, with their own detail pages; the Coach sees them too
  - **resting heart rate**
  - **steps and weight** on days Apple Health doesn't cover
  - The first sync reads your whole Garmin history, 6 files at a time, with a counter in the status.
- **Fixed: Apple Health sleep could be dropped.** Health Auto Export sometimes sends a night with `totalSleep: 0` and the real hours in `asleep` (how Garmin writes sleep into Apple Health) or only in the Core/Deep/REM stages. Those nights were thrown away. Now the app reads whichever field holds the night, in both the JSON and CSV formats. A sleep record it still can't read is reported in Import results with its field names, instead of being skipped silently. Your existing Health Auto Export files are read once more to fill in missed nights.
- **One rule for which source wins** (README › Which source wins). Before, a day's steps, sleep and weight came from whichever file was imported last, so the same day could change depending on import order.
- **Fixed: hand-entered values could be overwritten.** The Steps, Sleep and Weight CSV importers replaced values you'd typed in.
- **Fixed: Lose It workouts could be counted twice.** The three Lose It import paths skipped different mirrored workouts, and Lose It's copy of a Strava workout was never caught. Now all three skip copies named after Garmin, Strava, Apple Health or Apple Watch, and drop any Lose It workout with the same minutes (±1) and similar calories as a Garmin or Strava workout that day, whichever arrives first. This affected exercise minutes and the Movement box.
- **Data health checks each measure.** New rows for Steps, Sleep, Weight, Resting heart rate and Food show the newest value and turn amber or red when one stops, even while its source keeps sending files.
- **Where it came from:** the Sleep, Steps and Weight pages name the device behind Apple Health's value, for example "Apple Health (Garmin Connect)".
- Tests: 31 new checks against sample files built in each format (Health Auto Export JSON and CSV sleep variants, Garmin day files, CSVs, Lose It duplicates, Data health rows). **The 131-check regression suite and your real sample files are on the home Mac and weren't run for this release.** Run them there before relying on it.
- **One version for every file.** The script, app and docs are all v3.0 now, and move together from here on. If the script you've pasted doesn't match the app, Data health's Google script row turns amber.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `index.html` | Everything above |
  | `email-to-drive.gs` | **Version number only** (2.12.1 → 3.0), no code changes. **Paste it** so Data health shows the same version (README › Updating the app). No need to run `setup` or make a new deployment. |
  | `README.md` | Which source wins, Body & recovery, Garmin in the setup table, measure rows in Data health, new troubleshooting rows, versions, privacy, FAQ |
  | `SETUP.md` | Step 13 now describes what the app shows from Garmin and how to check it; Steps 11 and 11b explain how Apple Health and Garmin share the work; version line added |
  | `ALTERNATIVES.md` | Brought in line with Garmin-direct (manual Garmin files and the full export are now only for filling gaps); which source wins for manual files; version line added |
  | `CHANGELOG.md` | This entry, and the one-version rule |
  | `config.js` | Not changed (it has no version) |

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
