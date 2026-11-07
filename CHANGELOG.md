# Health Sync — Version history

**The app and the docs share one version number** (from v3.0 on): every app file, README, SETUP, ALTERNATIVES and this file. Each release bumps all of them together, and its notes say which files **only had their number changed**. **The Google script has its own number** (from v3.8): it changes only when `email-to-drive.gs` changes, so you paste it only when there's something new in it. To check which files you're using:

| File | Where to see its version |
|---|---|
| **App** (`index.html`, which loads `core.js`, `importers.js`, `rules.js`, `migrate.js`, `sync.js` and the screen files) | At the bottom of every page, and **Settings → About**. `APP_VERSION` is in `index.html` itself. Every script tag carries the same version in its address (`core.js?v=3.8`), so a phone never mixes old and new files |
| **Tests** (`tests.html`) | Uses whatever app files sit next to it, and fails if any file's version doesn't match `APP_VERSION` |
| **Script** (`email-to-drive.gs`) | Line 3 of the code, and the first line of the Execution log each time it runs. The app's `SCRIPT_LATEST` names the newest script. Data health turns amber only when yours is older. `tests.html` checks that the script file and `SCRIPT_LATEST` agree |
| **README / SETUP / ALTERNATIVES** | The line at the top of each file |
| **CHANGELOG** | Its newest entry |

### How versions are numbered

**MAJOR.MINOR.PATCH**:
- **Major (3.0, 4.0…):** a big change in how Health Sync works, such as where its data comes from, its architecture or a redesign. Rare, and agreed beforehand.
- **Minor (3.1, 3.2…):** a new feature or screen.
- **Patch (3.0.1…):** fixes and small tweaks to something that already exists. Bundled when possible.
- **Docs-only fixes** to the release just shipped keep its number, and are noted in its entry as a docs follow-up.
- **The script** gets the app's number at the time its code changes: for example, if a change lands in 3.9, the script becomes 3.9, and stays 3.9 through later app releases until it changes again. Before v3.8 every release bumped it, so older entries say "Version number only" for the script.

`config.js` has no version. It only holds your Client ID and never changes, so don't re-upload it.

### Every release, in this order

1. **Bump the app version:** `APP_VERSION` and the comment at the top of `index.html`, the `?v=` on every script tag in `index.html`, and the line at the top of README, SETUP and ALTERNATIVES. **Only if `email-to-drive.gs` changed:** set its line 3 and `SCRIPT_VERSION` to the new app version, and `SCRIPT_LATEST` in `index.html` to match.
2. **Update the docs** for whatever changed. In particular, README for anything you can see or do, and SETUP for anything about setting up.
3. **Add a CHANGELOG entry** with a table of every file and what changed in it. Mark files whose only change is the number as **Version number only**. Say whether the script changed (**Paste it**) or not.
4. **Add a check to `tests.html`** for each fix or new rule, so it can't break again unnoticed. A change to saved data's shape gets a new numbered step in `migrate.js` (never an edit to an old one).
5. **Run the type check, the tests and look at the screens:** `npx tsc -p jsconfig.json` with no errors, `tests.html` all green, and `SCREENS_OUT=dir node .github/screens.mjs` to eyeball the six screens. A new `.js` file goes in `jsconfig.json` and gets a script tag.
6. **Push or upload all the app files together.** They only work as a set.
7. **GitHub runs the type check, the tests and the screenshot comparison, and publishes only if all three pass.** Check for the ✅ next to the change on GitHub. A ❌ means it wasn't published: open it to see the failing check, or the changed screens under Artifacts. If a screen change was meant, run **Actions › Update screenshots**. Then, **only if the script changed**, paste it into script.google.com.

### v3.8.3 (November 7, 2026)

- **Fixed: the header on a phone.** With the ♥ pace chip and the ⚠ data-issues chip both showing, they pushed the status dot and **Sync** off the right edge and squeezed "Health Sync" onto two lines. On narrow screens the chips now get their own line under the logo, status and Sync; with no chips, the header is one line as before. Desktop is unchanged.
- **Tests:** GitHub's app start-up check now opens the app at phone width (360 px) with both chips showing, and fails if a chip covers the status dot or Sync, or the header runs off the edge. 178 checks unchanged.
- **Files:** `index.html` (phone styles, version), `.github/run-tests.mjs` (the phone header check), `README.md`, `SETUP.md`, `ALTERNATIVES.md` (version number only). `email-to-drive.gs` not changed: stays 3.7.1, nothing to paste.

### v3.8.2 (November 7, 2026)

- **Fixed: the Coach's instruction on the private marks.** It told Claude to treat declined days as weighing on your mood, which handed it a conclusion before it looked at your data. It now tells it to check: compare mood, energy and stress on and after those days with other days, mention a difference only with at least 3 such days and a gap of at least half a point, call it a pattern rather than a cause, and otherwise draw no link.
- **Files:** `coach.js` (the instruction, in both the weekly and period reviews), `index.html` (version), `README.md` (Log today › Private now describes the check), `SETUP.md`, `ALTERNATIVES.md` (version number only).
- Tests: no logic changed (the numbers the Coach is sent are the same), so the checks are unchanged; GitHub's type check, tests and screenshots passed. `email-to-drive.gs` not changed: stays 3.7.1, nothing to paste.

### v3.8.1 (November 7, 2026)

**No change in what the app does.** This release adds a type check, the last item from the architecture review.
- **New: a type check in GitHub's test run.** TypeScript's checker runs over every app file before the tests (`jsconfig.json`, `globals.d.ts`), with no build step: the app still ships as plain files, and nothing about how it runs changed.
  - It catches misspelled or missing names: a misspelled function name made it fail, *"Cannot find name 'weightRatez'. Did you mean 'weightRate'?"*.
  - It catches wrong kinds of arguments, and fields used on a day that aren't in its written description.
  - It does **not** reliably catch a misspelled property on a plain object, which would need strict mode and its hundreds of noisy warnings.
  - A guard fails the run if a file `index.html` loads isn't in the type check.
- **First run:** 136 complaints, **none of them real bugs** and no missing names anywhere. 74 were date arithmetic (`dateA - dateB`), now written with an explicit `+` to convert each date to a number first, which gives the same result. The rest needed small notes on types the checker couldn't work out by itself.
  - It also found that the written description of a day from v3.8 left out `stepsSource`, `weightSource`, `weightUnit`, `restingHR` and the Lose It report times. They're added now.
- **Not done, on purpose: JavaScript modules.** The type check gives most of what modules would, which is catching mistakes across files. Modules would mean rewriting how every file reaches the others, plus the three test suites that look inside the app (`tests.html`, the real-file suite, the screenshot run). The one real hazard left, a file using something from a file that loads later, is caught by GitHub's app start-up check, which crashes on it. Worth revisiting only if the app gets a second developer or a build step.
- Tests: 178 checks (unchanged) and all real-file suites pass.
- **Fixed in the screenshot check:** the first push of this release was stopped by it. Exactly 260 pixels changed on all six screens, which was the footer's version number (3.8 → 3.8.1). That would have happened every release, so the pictures now show a fixed version, and the reference pictures were saved again. Nothing else on any screen changed, which confirms the date rewrite left them as they were.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `jsconfig.json`, `globals.d.ts` | **New:** what the type check covers, and the names from outside |
  | `core.js`, `importers.js`, `rules.js`, `coach.js`, `health.js`, `main.js`, `metrics.js`, `weight.js` and the other app files | Date arithmetic written with an explicit `+` where flagged; type notes; the day's description completed. No change in behavior |
  | `.github/workflows/tests.yml` | Runs the type check; installs TypeScript |
  | `.github/run-tests.mjs` | Fails if a loaded file isn't type checked |
  | `index.html` | Version and script tags |
  | `README.md` | How the app is split › Type check; Tests |
  | `CHANGELOG.md` | Release checklist: the type check; this entry |
  | `SETUP.md`, `ALTERNATIVES.md` | **Version number only** |
  | `email-to-drive.gs` | **Not changed: stays 3.7.1. Nothing to paste.** |

### v3.8 (November 7, 2026)

**No new features: this release is about structure.** It's also the start of a **2–4 week feature freeze** while the learned burn, assignment results and waist record collect real data.

- **The screens are split into their own files.** `index.html` went from 3,634 lines to about 950, and is now just the page: its markup, styles and version. The code that ran inline is now 9 files, in the same order and unchanged:
  - `drive.js`: storage and the Problems log
  - `dashboard.js`, `log.js`, `coach.js` (which now also holds your why and reflections), `training.js`, `health.js`, `weight.js` and `metrics.js`
  - `main.js`: startup and wiring, loaded last

  Splitting it exposed one load-order trap, a file using something from a file that loads after it. It's fixed, and the comments say which files may depend on which.
- **New: screenshot comparison in GitHub's test run** (`.github/screens.mjs`). GitHub draws six screens with made-up data at a frozen date and time: the Dashboard, Weight, Log today and Training at computer size, and the Dashboard and Weight at phone size. It compares them pixel by pixel with the saved pictures in `.github/screens/`. If more than 50 pixels of a screen change, the run fails and publishing stops, and the changed pixels show in red under Artifacts. GitHub drew the same screens identically on two separate runs. Checked by breaking it on purpose: one changed word in a card title failed both Weight screens. Recolouring the progress gauge also failed both, once the limit became a fixed 50 pixels; a first version allowed 0.1% of the page, which let the gauge slip through on the long desktop page. An intended change: run **Actions › Update screenshots** (`.github/workflows/update-screens.yml`), which saves the new pictures. The first run has no saved pictures yet, so it passes. The pictures get saved by running Update screenshots once after this release.
- **New: one place to upgrade saved data** (`migrate.js`). Saved data now carries a `schemaVersion`. When data loads, numbered upgrade steps run in order, once. The 3 that existed (v1.3's calorie-budget Day Pack, v2.13's fourth box, v3.4's half boxes) used to run on every read inside `anchorCfg()`; they're now steps 1–3. `core.js` has a written description of a day's fields.
- **Changed: the Google script has its own version.** It changes only when its code does, so you paste it only when there's something new. **This release doesn't change it: it stays 3.7.1, and there's nothing to paste.** Data health turns amber only when your script is older than the newest one (`SCRIPT_LATEST`).
- **New: What you use** (Settings): how often you open each tab and detail page, added up across devices, with **never opened** at the bottom. Each device saves only its own counts, and counting alone never causes a save. After the freeze, the bottom of this list is what to cut.
- Tests: 178 checks, up from 169:
  - upgrading saved data: the steps run in order, very old settings come through every step, data that's already upgraded is left alone, running twice changes nothing, and nothing upgrades on read anymore
  - the script's own version
  - usage counts from two devices
  - the "nothing silently dropped" check now reads every file `index.html` loads

  The real-file suites were run against this version too.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `drive.js`, `dashboard.js`, `log.js`, `coach.js`, `training.js`, `health.js`, `weight.js`, `metrics.js`, `main.js` | **New:** the screens, moved out of `index.html` unchanged (plus usage counting in `main.js`, `metrics.js` and `log.js`) |
  | `migrate.js` | **New:** numbered upgrades of saved data |
  | `index.html` | Now just the page; loads the new files; `SCRIPT_LATEST`; What you use card; version and script tags |
  | `core.js` | `schemaVersion` and `usage` kept on save, `normalize()` runs the upgrades, a written description of a day |
  | `rules.js` | `anchorCfg()` no longer upgrades on read |
  | `sync.js` | Usage counts per device, `schemaVersion` merged |
  | `tests.html` | 9 new checks (178 in all) |
  | `.github/screens.mjs`, `.github/workflows/update-screens.yml` | **New:** screenshot comparison, and the workflow that saves new pictures |
  | `.github/workflows/tests.yml` | Runs the screenshot comparison; installs pixelmatch and pngjs |
  | `README.md` | How the app is split, Updating the app (the script's own version), Settings › What you use, Tests (screenshots) |
  | `SETUP.md` | File lists; version line |
  | `CHANGELOG.md` | The version rule, the release checklist, this entry |
  | `ALTERNATIVES.md` | **Version number only** |
  | `email-to-drive.gs` | **Not changed: stays 3.7.1. Nothing to paste.** |
  | `importers.js`, `config.js` | Not changed |

### v3.7.1 (November 6, 2026)

- **Changed: body composition without the Withings API.** Withings asks for a company or a paid plan before giving out API keys, so SETUP Step 14 usually isn't possible for a personal account. The Weight page's body composition now works from what Withings already shares with Apple Health:
  - **Lean Body Mass** is read from Health Auto Export (JSON and CSV, kept in kg). Add it to the automation (SETUP Step 11).
  - With only **Body Fat Percentage**, fat and lean mass are worked out from it and that day's weight. Your existing body fat history counts, so the fat-versus-lean breakdown may show straight away.
  - The card says *Withings via Apple Health*. Muscle, bone, water, visceral fat and BMR still need the API, and the Withings code in the script stays for that case.
- Tests: 169 checks, up from 164: Lean Body Mass in pounds read as kg, fat and lean from body fat % and weight, the CSV column, the loss mix from Apple Health alone, and Withings direct still winning when there is one.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `importers.js` | Lean Body Mass from Health Auto Export |
  | `rules.js` | `compOf`: body composition from Withings direct, or else from Apple Health |
  | `index.html` | Body composition card and the Coach use it; card says where it came from; version and script tags |
  | `tests.html` | 5 new checks (169 in all) |
  | `SETUP.md` | Step 11: tick Lean Body Mass; Step 14: needs Withings' paid or company plan |
  | `README.md` | Weight page › Body composition; Tests |
  | `CHANGELOG.md` | This entry |
  | `email-to-drive.gs` | **Version number only** (3.7 → 3.7.1) |
  | `ALTERNATIVES.md` | **Version number only** |
  | `core.js`, `sync.js`, `config.js`, `.github/` | Not changed |

### v3.7 (November 6, 2026)

- **New: Withings, read directly** (SETUP Step 14, optional). Apple Health only gets weight, body fat %, BMI and lean mass from Withings. The script now reads everything the scale measures: **muscle, bone, water, visceral fat, basal metabolic rate and metabolic age** too. Connecting goes through the script's web app address, because a Withings sign-in code lasts only 30 seconds, too short to copy by hand. The first sync loads your whole history. Each day keeps its **first** weigh-in (the morning one), which now ranks above Apple Health's copy; a weight typed in by hand still wins. Data health has a Withings row.
- **New on the Weight page:**
  - **Body composition:** each measure, with the change over 30 days, and **what the loss was made of**, fat versus lean (each end averages 3 readings, because one reading swings with water). Red if over about 30% of the loss is lean mass.
  - **Waist:** weekly, with waist ÷ height (under 0.5 is the usual healthy line).
  - **Your burn,** learned from your own numbers: average calories on fully logged days, plus what the scale says that did (3,500 cal per lb), over 4 weeks. It needs 21 of 28 days fully logged and 8 weigh-ins, and refuses numbers that can't be right. It shows what your calorie goal will do **as you get lighter** (about 10 cal a day less burn per lb lost, so loss slows; expected, not a plateau), and a **suggested day's calorie goal** (burn minus your committed rate, capped at 1% of body weight a week, never under 1,500) with a **Use it** button.
  - **Maintenance practice on the way down:** at each checkpoint (every 25 lb, so 250 and 225 by default), 2 weeks at your learned burn. Your meal boxes tick at that calorie level during it, and the page reports how steady you held.
  - **Your goal is a range** (goal ± 5). Inside it, **Switch to maintenance**: eat about your burn, and the ♥ alarm watches for drifting up instead (**Above your range** after 2 weeks over the top).
  - Goals and settings: goal range and checkpoints.
- **New: Today** (Dashboard): one thing to do, only when there is one: *take it easy* (readiness or a load spike) or *a good day to lift* (short of your strength sessions this week and nothing for 3 days). The header always shows **strength N of 2 this week**. It also reminds you when your waist or push-ups are due.
- **New: Measurements** (Log today): waist at the navel (weekly) and push-ups, most in one set (monthly).
- **Changed: Patterns** ask a short list of questions, each habit only against what it could plausibly change. It was 42 comparisons; now it's 15. A pattern must also **hold up in both halves** of the days it's based on (the same direction, at least half the size). The sugary-day comparison is gone, and next-day stress is now checked for ↗ Me · ♡ N.
- **New: did the assignment help?** Each report-card assignment names one measure. The next card shows it before and after (for example *Sleep: 6.4 → 6.9 h*), and you tap **Yes / Somewhat / No**. Later cards read the results and your answers.
- **The Coach** gets body composition, waist, push-ups, strength sessions, your learned burn, what the loss was made of, and your phase.
- Tests: 164 checks, up from 135. They cover the Withings reader (units, the first weigh-in, split readings, beating Apple Health both ways round, hand-typed weights winning), the loss mix, waist and push-ups, the learned burn (and refusing impossible numbers), the slowdown, the suggested goal, each phase, Today, assignment changes, and Patterns that hold in only one half. The script suite gets 16 Withings checks against a fake Withings server (75 in all): connecting through the web app, an old link refused, paging, only new weigh-ins, rotating refresh tokens and an expired sign-in. GitHub's app start-up check renders the new Weight cards and the Today card. Breaking the source order, the half-and-half rule or the token rotation makes them fail. Checked in screenshots at desktop size.
- **Not checked:** a real Withings account. The API calls follow Withings' published format and a maintained open-source client, but the first real connection is the real test. The suggested goal and maintenance calories depend on your learned burn, which needs 4 weeks of full logging.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `email-to-drive.gs` | Withings: `withingsLink`, sign-in through the web app (`doGet`), hourly `syncWithings`, status and alerts. **Paste it, and deploy a new version of the web app** (SETUP 14a). |
  | `importers.js` | Withings reader |
  | `core.js` | Withings ranks above Apple Health for weight; days with only body measures are kept |
  | `rules.js` | Body composition, loss mix, waist, push-ups, learned burn, slowdown, suggested goal, phases, range alarm, Today, assignment measures, Patterns rework |
  | `index.html` | Today card, Measurements, Body composition, Waist, Your burn, phase cards and settings, assignment results and *Did it help?*, Withings Data health row, Coach data; version and script tags |
  | `tests.html` | 29 new checks (164 in all) |
  | `.github/run-tests.mjs` | App start-up check renders the new cards |
  | `README.md` | Which source wins, Dashboard (Today, Patterns), Weight page, Log today, Coach assignments, Data health, Tests |
  | `SETUP.md` | **New Step 14: Withings** |
  | `CHANGELOG.md` | This entry |
  | `ALTERNATIVES.md` | **Version number only** |
  | `sync.js`, `config.js` | Not changed |

### v3.6.1 (November 6, 2026)

- **Fixed: an app window left open never saw new reports.** The app only looked in the Drive Inbox when it started or when you clicked **Sync** or **Check Inbox now**, and it never reloaded what your other devices had saved. So the Nov 6 Lose It report was saved to Drive by the script at 8:25, as its log shows, but an app window open since earlier didn't show it. Now an open window brings itself up to date when you come back to it, and every 10 minutes while it's on screen (at most once every 5 minutes). It saves, reloads, imports from the Inbox and refreshes Data health. It waits while you have unsaved changes in Log today or the plan.
- **After about an hour,** Google's sign-in can only be renewed by a click, so the window can't update itself. Instead of looking current, the status at the top now says **Synced 8:10 AM · click Sync**.
- Checked: the Nov 5 Lose It file itself imports correctly (7 entries, 1,714 cal, 132.7 g protein), and it's now a check in the private real-file suite.
- Tests: GitHub's app start-up check now runs the background sync against a stand-in Drive. It picks up another device's save and checks the Inbox, waits while you're mid-edit, doesn't run twice within 5 minutes, and says **click Sync** once the sign-in has expired. Disabling the background sync makes the check fail. 135 checks in `tests.html` (unchanged), and all real-file suites pass.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `index.html` | Background sync on return and every 10 minutes; "click Sync" status once the sign-in expires; version and script tags |
  | `.github/run-tests.mjs` | Background sync check |
  | `README.md` | Signing in: what an open window does |
  | `CHANGELOG.md` | This entry |
  | `email-to-drive.gs` | **Version number only** (3.6 → 3.6.1). **Paste it** so Data health shows the same version. |
  | `SETUP.md`, `ALTERNATIVES.md` | **Version number only** |
  | `core.js`, `importers.js`, `rules.js`, `sync.js`, `tests.html`, `config.js` | Not changed |

### v3.6 (November 5, 2026)

- **New: two private marks on Log today.** In the Feelings card, **Private** has two marks with no words on them: **↗** is **Me** or **Her**, and **♡** is **Y** or **N**. Tap the lit one again to clear it. They're saved with your data in Drive and sync between devices field by field; *Move* and *Delete feelings* include them. They aren't shown elsewhere on screen, and aren't graded.
- **The Coach uses them.** Each day it's sent who started it and whether it happened; each period, the counts (started by you, by her, happened, and ↗ Me · ♡ N), with your average mood on those days and the day after, and energy and stress the day after, against your other days. Weekly reviews and report cards are asked to treat ↗ Me · ♡ N as weighing on mood and attitude, say so plainly when the numbers show it, and keep the wording discreet.
- **Patterns:** "days marked ↗ Me · ♡ N" is compared with the days it happened, against the next day's sleep, HRV, energy and mood, like drinks and late workouts. It shows only with at least 5 days each way.
- Tests: 135 checks, up from 126: a day with only these marks is kept, unset marks keep nothing, a "no" counts, two devices' marks merge, what the Coach is sent for a day, the period counts, mood and stress on and after ↗ Me · ♡ N days against other days, nothing sent when nothing is marked, and the Pattern. GitHub's app start-up check also taps the marks on the real Log today page, saves, and confirms what the Coach is sent. Screenshots checked at desktop (dark) and phone (light) sizes. The real-file suites were run too. No Coach review was written in testing, so the wording Claude uses hasn't been seen yet.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `core.js` | `hasPv`, `pvOf`, `pvDeclined`; a day with only private marks is kept |
  | `rules.js` | `intimacySummary` for the Coach; the ↗ Me · ♡ N pattern |
  | `index.html` | The marks on Log today, saving, Move and Delete feelings; sent to the Coach per day and per period; Coach instructions; version and script tags |
  | `tests.html` | 9 new checks (135 in all) |
  | `.github/run-tests.mjs` | App start-up check for the marks |
  | `README.md` | Log today › Private |
  | `CHANGELOG.md` | This entry |
  | `email-to-drive.gs` | **Version number only** (3.5.2 → 3.6). **Paste it** so Data health shows the same version. |
  | `SETUP.md`, `ALTERNATIVES.md` | **Version number only** |
  | `importers.js`, `sync.js`, `config.js` | Not changed |

### v3.5.2 (November 5, 2026)

- **Fixed: Predictions disagreed with your weigh-ins.** They started from the trend weight (several pounds behind when losing fast), still listed 270 after you'd weighed in under it, and "Overall" was worked out from the trend too. Now:
  - Predictions start from your **latest weigh-in**, and list only the milestones still ahead (the same ones as Progress).
  - **Last 4 weeks** (now the default): a straight line through your weigh-ins from the last 4 weeks.
  - **Average:** your average loss a week since your start date, from your start weight to your latest weigh-in.
  - **Commitment:** the rate you set.
  - Progress's forecast dates use the Last 4 weeks rate too, so the two cards match. The chart's dashed projection starts at your latest weigh-in.
- **Changed: Weight page layout.** On a computer, Progress (the long card with every milestone) has its own column, and Trend change, Last 10 days, BMI and Predictions pack beside it instead of stretching to its height. Goals and settings sits underneath across the page. On a phone everything stacks as before.
- Tests: 126 checks, up from 125: predictions start at the latest weigh-in; the last-4-weeks and average rates both come out at the real 3.5 lb a week while the trend says less; a forecast date and weight; gaining never reaches the goal; and Progress and Predictions give the same date. Screenshots checked in dark mode at desktop and phone sizes, with data shaped like yours. The real-file suites were run too.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `rules.js` | `weightRate` prefers the weigh-in line; `weightRates`, `forecastDay`, `forecastWeight` |
  | `index.html` | Predictions card and chart projection from the latest weigh-in; two-column Weight layout; version and script tags |
  | `tests.html` | 1 new check (126 in all) |
  | `README.md` | Predictions and layout |
  | `CHANGELOG.md` | This entry |
  | `email-to-drive.gs` | **Version number only** (3.5.1 → 3.5.2). **Paste it** so Data health shows the same version. |
  | `SETUP.md`, `ALTERNATIVES.md` | **Version number only** |
  | `core.js`, `importers.js`, `sync.js`, `config.js`, `.github/` | Not changed |

### v3.5.1 (November 5, 2026)

- **Fixed: the Progress gauge was drawn wrong** once you were more than halfway through a milestone: the arc swung round the outside of the circle. Arcs on a half-circle gauge now always bend the short way. (The same drawing code is used by the BMI gauge.)
- **Fixed: an old weigh-in dragged the trend.** A reading from months before Oct 8 was joined to the new ones, so the trend looked flat (+0.1 lb a week over 30 days, while losing about 3.5) and every milestone forecast showed "—". The trend now **starts again after 3 weeks with no weigh-ins**, and days in such a gap have no trend. When the 30-day trend doesn't reach back far enough, forecasts use a straight line through the last 4 weeks of weigh-ins.
- **Changed: a milestone counts the first day you weigh in at or under it.** It used to wait for the trend weight, which runs several pounds behind when losing fast (267.4 on the scale, 271 trend, so 270 showed as not reached). Progress, % of the way, lost and pounds to go are measured from your latest weigh-in. A milestone stays reached after a heavier day.
- The Coach's weight line uses the same rate, and the first trend in the period rather than one inside a gap.
- Tests: 125 checks, up from 124: a 274.8 → 267.4 loss with the trend still above 270 marks 270 reached; an old weigh-in 200 days earlier doesn't drag the trend, the rate shows the real 3.5 lb a week and forecasts come back. One 3.5 check was reversed (a single weigh-in now counts). GitHub's app start-up check also draws an 80% gauge arc and checks it bends the short way. Screenshots checked in dark mode with data shaped like yours. The real-file suites were run too.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `rules.js` | Trend restarts after a 3-week gap; `weightRate`; milestones count from weigh-ins and measure from the latest one |
  | `index.html` | Gauge arc fix; recent rate in Trend change, Predictions, chart and Coach; milestone footnote; version and script tags |
  | `tests.html` | 2 new checks, 1 reversed (125 in all) |
  | `.github/run-tests.mjs` | Gauge arc check |
  | `README.md` | Trend weight and milestones |
  | `CHANGELOG.md` | This entry |
  | `email-to-drive.gs` | **Version number only** (3.5 → 3.5.1). **Paste it** so Data health shows the same version. |
  | `SETUP.md`, `ALTERNATIVES.md` | **Version number only** |
  | `core.js`, `importers.js`, `sync.js`, `config.js` | Not changed |

### v3.5 (November 5, 2026)

- **New: your latest weigh-in, front and center, with how old it is.**
  - **Weight page:** a large *Latest weigh-in* card at the top, with the date and its age. Up to 2 days old it's current; from 3 days it's amber (*getting old*); from a week it's red and says *you've probably changed since then*, with an estimate of where your trend likely is now at your pace before it. The trend weight sits beside it.
  - **Dashboard Weight tile:** leads with the latest weigh-in and its age (red *weigh in* after a week), with the trend underneath. On the average views the tile keeps the trend and adds the latest weigh-in and its age.
- **New: Progress works like Happy Scale.**
  - The arc now fills through the **current milestone**, with pounds to go and its forecast date in the middle. It used to show the whole way to the goal.
  - A start-to-goal bar with a tick for each milestone and the % done.
  - **Every milestone is listed**: the date you reached it, the next one highlighted with pounds to go, and a forecast date for each one ahead (at your last 30 days' rate). Before, milestones were unlabeled dots.
  - A milestone counts when your trend weight reaches it, not one low reading.
- Tests: 124 checks, up from 117: fresh, getting-old and out-of-date weigh-ins, the estimate after 10 days, the latest weigh-in rather than the trend, milestones with dates reached, pounds to go and forecasts, one low reading not counting, and no goal. The real-file suites in the private repository were run against this version too. The new screens were checked in screenshots at desktop and phone sizes, with made-up weigh-ins.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `rules.js` | `weighInAge` and `weightMilestones`; `weightGoals` moved here from `index.html` |
  | `index.html` | Latest weigh-in card, new Progress card and milestone list, Weight tile shows the latest weigh-in and its age; version and script tags |
  | `tests.html` | 7 new checks (124 in all) |
  | `README.md` | Weight page: latest weigh-in, Progress, milestones |
  | `CHANGELOG.md` | This entry |
  | `email-to-drive.gs` | **Version number only** (3.4.1 → 3.5). **Paste it** so Data health shows the same version. |
  | `SETUP.md`, `ALTERNATIVES.md` | **Version number only** |
  | `core.js`, `importers.js`, `sync.js`, `config.js`, `.github/` | Not changed |

### v3.4.1 (November 5, 2026)

- **Fixed: losing weight too fast showed up as a "data issue".** The pace alarm is about your health, not about data arriving, so it no longer counts in Data health or the **⚠ data issue** chip. It has its own chip at the top of every screen instead: red **♥ Losing too fast**, or amber **♥ Watch your pace**. Tap it to open the Weight page, which explains the pace and what to do. The alarm's rules haven't changed.
- Tests: 117 checks, up from 116: the alarm gives a red or amber health alert of its own, and none at a safe pace. GitHub's app start-up check also confirms the ♥ chip appears and Data health has no pace row. The real-file suites in the private repository were run against this version too.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `rules.js` | `paceAlert`: the pace alarm as a health alert |
  | `index.html` | Pace removed from Data health; new ♥ chip that opens the Weight page; version and script tags |
  | `tests.html` | 1 new check (117 in all) |
  | `.github/run-tests.mjs` | App start-up check: 5 weeks of fast loss shows the red ♥ chip, and Data health has no pace row |
  | `README.md` | Data health and Pace alarm: the ♥ chip |
  | `SETUP.md` | Step 12c no longer names an old script version |
  | `CHANGELOG.md` | This entry |
  | `email-to-drive.gs` | **Version number only** (3.4 → 3.4.1). **Paste it** so Data health shows the same version. |
  | `ALTERNATIVES.md` | **Version number only** |
  | `core.js`, `importers.js`, `sync.js`, `config.js` | Not changed |

### v3.4 (November 2, 2026)

- **New: other ways to fill the daily anchor boxes.**
  - **Day Pack and Dinner Boundary:** staying within the **day's calorie goal** ticks both, however the calories were split between meals. The goal starts at the two meal limits added up (1,200 + 750 = 1,950); change it in Settings › Daily anchors, or set 0 to turn it off. It only applies on days at or above the 1,500 calorie floor, so a half-logged or barely-eaten day can't tick both.
  - **Steps:** still 7,500 for a full box. **5,000 or more is half a box.**
  - **Movement:** **20 minutes** of any recorded workout counts. It was 10.
- **Half boxes count 0.5** everywhere: the week's total (for example 22½ of 28), the bars and dots (half filled), the anchors detail page, report-card grades and what the Coach is told.
- **Saved settings are upgraded once:** Movement becomes 20 minutes, Steps gets half credit at 5,000, and reminders still at their old default wording are updated. Reminders you wrote yourself are kept.
- Tests: 116 checks, up from 104: the day's calorie goal (both directions, over the goal, under the floor, switched off), full, half and no step credit, 20 versus 19 minutes, a 3½-box day, hand-set boxes beating half credit, upgrading saved settings, and showing halves. GitHub's app start-up check also confirms a ½ box appears for 6,000 steps.
- **Files in this release:**

  | File | What changed |
  |---|---|
  | `rules.js` | Day's calorie goal, half step credit, 20-minute Movement, settings upgrade, half boxes in counts and grades |
  | `index.html` | ½ boxes, half-filled bars and dots, totals like 22½, new settings (half steps, day's calorie goal); version and script tags |
  | `tests.html` | 12 new checks (116 in all) |
  | `.github/run-tests.mjs` | App start-up check looks for the ½ box |
  | `README.md` | Daily anchors: the "Or…" column, day's calorie goal, half boxes, upgrade of saved settings |
  | `CHANGELOG.md` | This entry |
  | `email-to-drive.gs` | **Version number only** (3.3.2 → 3.4). **Paste it** so Data health shows the same version. |
  | `SETUP.md`, `ALTERNATIVES.md` | **Version number only** |
  | `core.js`, `importers.js`, `sync.js`, `config.js` | Not changed |

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
- **Docs follow-up, same release:** the real-file suite moves to a private repository, `abgentner/health-sync-real-tests`, which runs it nightly against the live app. The README's Tests section says where it is.
- **Docs follow-up (Nov 3):** the old suite wasn't lost; it was on the work Mac. Both full suites are now in the private repository and pass on 3.4: 133 app checks against your real files (three updated for 3.4's new anchor rules) and 59 script checks.
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
