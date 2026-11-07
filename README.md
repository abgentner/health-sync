# Health Sync

> **Version 3.8.2** · November 7, 2026 · same version as the app and the other docs (the Google script has its own number, now 3.7.1) · [Setup](SETUP.md) · [Alternatives](ALTERNATIVES.md) · [Version history](CHANGELOG.md)

**Health Sync is your private health dashboard.** It brings **food, workouts, steps, sleep, weight, heart rate and how you feel** together in one place, and it updates itself. A Claude-powered **Coach** reviews each week.

It's a web page you open like an app (on your Mac via Brave, on your iPhone from the home screen). Your data lives only in **your own Google Drive**.

---

## Your setup at a glance

| Source | What it brings | How it gets in | How often |
|---|---|---|---|
| **Lose It** | Every food, meals, all nutrients | Daily report email → your Google script → Drive Inbox | Daily |
| **Strava** (fed by Garmin) | Workouts | Your Google script asks Strava → Drive Inbox | About hourly |
| **Apple Health** (fed by Garmin, Withings, Lose It) | Steps, sleep, resting heart rate, active calories, flights, weight, body fat, nutrition backup | Health Auto Export → its Drive folder | Daily (yesterday's totals) |
| **Garmin** (straight from Garmin) | Sleep with sleep score, overnight HRV, Body Battery, stress, resting heart rate; **every workout with heart-rate zones, training load, training effect and strength sets**; steps and weight for days Apple Health misses | Your Google script asks Garmin → Drive › Health Sync › Garmin | Hourly |
| **You** | Mood, energy, stress, notes, **soreness and pain (body log)**, anchor overrides, your plan | The app | Whenever |
| **Claude** | Report cards (weekly, monthly, quarterly, yearly) + email | The app (with your API key) → your script sends the email | When each period ends, or on demand |

```
Lose It ──email──┐                         ┌── Health Auto Export (iPhone)
Strava ──────────┤──► Google script ──► Drive ◄─┘
                 │     (hourly)           │
                 └── data health check    ▼
                                    Health Sync app ──► Coach (Claude)
```

Everything is automatic. The **Data health** panel (Import tab) and alert emails tell you if any source stops.

---

## Every day

There's nothing to do. Open the app when you like:

1. It **syncs** on open: new files from the Drive Inbox, the Health Auto Export folder and the Garmin folder are imported. The first time after v3.0, it reads your whole Garmin history, which can take a few minutes. The status at the top counts the days as it goes.
2. **Yesterday is complete**; today usually isn't, because most sources send a day's totals the next morning. That's why averages always end yesterday.
3. **Log how you feel** in **Log today** (mood, energy, stress, tags, notes), and override an anchor box if the data got it wrong.
4. **Mondays at noon:** the Coach writes last week's report card and emails it to you. Monthly, quarterly and yearly report cards follow on the 1st of each.

**Where nutrition comes from:** **Lose It's report** brings every food with calories, protein, carbs, fat, saturated fat, sugars, fiber, sodium and cholesterol. **Vitamins and minerals** (potassium, calcium, iron, magnesium, vitamins A, B, C, D, E and K, folate, zinc and more, plus caffeine) come from **Apple Health**, where Lose It writes them, via Health Auto Export. They appear under **Food card › Vitamins and minerals** and on the Calories page, as % of the daily value. Only foods with that data in Lose It count, so totals are a minimum.

**Lose It sends two kinds of report:** a **daily** report each morning (yesterday, complete) and a **weekly** report on Mondays, which includes a *partial* today. A day only counts as final once a report sent **after that day ended** has arrived, and an older report never overwrites a newer one. Until then, that day's food is marked **so far**: on the Food card, on the Calories tile, as *(partial)* in the Calories page's Source column, and to the Coach.

**Re-importing never doubles anything.** A newer report for the same day replaces the old one, the same workout from Garmin and Strava is kept once, and anything you type in by hand is never overwritten.

### Which source wins

Several sources often report the same thing. For each measure the app keeps one value per day, and it always picks the same source regardless of which file arrived first:

| Measure | Used first → last | Why |
|---|---|---|
| **Steps** | You → Apple Health → Garmin → Lose It | Apple Health's daily total already merges your iPhone and Garmin steps without double counting |
| **Sleep** | You → Garmin → Apple Health → Lose It | Garmin's own data has the sleep score; Apple Health's copy is the same night without it |
| **Weight** | You → Withings (direct) → Apple Health → Garmin → Lose It | Read straight from Withings (v3.7+, SETUP Step 14) the app keeps each day's **first** weigh-in, the morning one, with its body composition. Without that connection, Withings' copy in Apple Health is used |
| **Resting heart rate** | Apple Health → Garmin | |
| **HRV** | Apple Health and Garmin are kept as **two separate measures** | They aren't the same number: Apple's is SDNN, Garmin's is overnight RMSSD |
| **Body Battery, stress** | Garmin only | |
| **Workouts** | Garmin's workout file → Garmin's Activities CSV → Strava, and Lose It for anything else | Copies of one workout (starting within 3 minutes of each other) are kept once, using the copy with the most detail. Lose It's copies of Garmin, Strava and Apple Health workouts are skipped: by name, or because they have the same minutes and similar calories as a Garmin or Strava workout that day |

The Sleep, Steps and Weight pages show where each day's value came from, including the device behind Apple Health's copy, for example **Apple Health (Garmin Connect)**.

---

## Data health and alerts

**Import tab › Data health** shows when each source last delivered, and what to do if one is late:

| Row | Green when | Amber / red when |
|---|---|---|
| **Google script** | It ran in the last few hours | It hasn't run for 3+ hours (check its hourly trigger) |
| **Lose It report** | An email arrived in the last 36 h | No email for 36 h (amber) or 72 h (red), or saving failed |
| **Apple Health** | Health Auto Export updated in the last 36 h | Late, or it's sending **minute-by-minute** data (set Time Grouping to **Day**) |
| **Strava** | Connected, no errors | The sync failed (run `stravaCheck`) |
| **Withings** | Connected; shows the last weigh-in it read | The sync failed, or the sign-in expired (run `withingsLink` again). Gray means not connected: weight still comes through Apple Health |
| **Garmin** | Updated in the last few hours; shows when your watch last synced, how far back history has loaded, and when the key expires | Watch not synced for 12 h (amber; email after a day), key expires within 30 days (amber, plus a weekly email), key expired or sync failed (red), Garmin asked the script to slow down (amber with the time it resumes, no email) |
| **Coach** | Last week's review is written | It's 2+ days late (see the Coach tab) |
| **Steps, Sleep, Weight, Resting heart rate, Food** | The newest automatic value is from yesterday or the day before (weight: within the last week) | Steps, sleep, resting heart rate and food: newest value 3–4 days old (amber) or older (red). Weight: over a week old (amber) or over two weeks (red). Each row says what to check |

The measure rows exist because a source can keep delivering files while one measure inside them stops. For example, Health Auto Export can keep updating while its file has no sleep in it. The app checks these rows when it's open; they don't send alert emails.

- When anything is amber or red, a **⚠ data issue** chip appears at the top of every screen. Tap it to open this panel.
- Data health is only about your data arriving. Your **weight-loss pace** is a health alert, so it has its own **♥** chip instead (Weight › Pace alarm).
- **Alert emails:** your Google script checks every hour, even when the app is closed. It emails you **once a day per problem** if Lose It or Health Auto Export goes quiet for 36 hours, if Health Auto Export switches to minute data, or if Strava fails.

### Days to check (catching up after travel)

**Import tab › Days to check** lists days from the last 4 weeks that look under-logged: no food at all, under 800 calories, or no final Lose It report. Yesterday and today aren't included, because their report may still be on its way.

- **If you've since logged those days in Lose It:** go to **loseit.com**, open your **Log**, go to that week, choose **Export to spreadsheet**, and drop the file in **Health Sync › Inbox**. A file you add by hand counts as the newest report, so it replaces what the app had for those days.
- **If a day really was like that** (a fast, or a day you chose not to track): click **Looks right**. The week stays hidden on every computer unless something else changes in it.
- Lose It's **Monday weekly report** already re-sends the whole previous week, so anything you fix within the same week comes in automatically.

---

## What each screen does

### Dashboard

- **Date bar:** use **‹ ›** to move between days, or **Today** to jump back.
- **Day / 5 / 7 / 15 / 30-day average buttons:** choose what the six summary tiles show.
- **Hide a tile:** hover over it and click 🙈 (or 👁 to bring it back), or use **Settings › Dashboard tiles**. Your choice is saved with your data, so it's the same on every computer.
  - **Day** shows just the selected day.
  - The **average** buttons always **end the day before** the selected date. Lose It and Garmin data usually arrives a day late, so today's numbers would be incomplete.
  - Days with no data for a measure are **skipped**, so they don't pull the average down. Each tile says how many days it's based on.
  - **Exercise** is minutes per day across all days that have any data, so a day without a workout counts as 0.
  - The app remembers which button you picked.
- **Tabs along the top:** Dashboard · **Training** · **Coach** · **Plan** · Log today · History · Import · Settings.
- **Today** (under the tiles): **one thing to do today, only when there is one.** It says *Take it easy today* when readiness or a training-load spike calls for it, or *A good day to lift* when you're short of your strength sessions for the week (2 by default) and haven't lifted in 3 days. Otherwise it says nothing needs changing. The header always shows **strength N of 2 this week**, because lifting is what keeps muscle while you lose weight. On today it also reminds you when your **waist** (weekly) or **push-ups** (monthly) are due.
- **Readiness** (under the tiles): today's training call, *Ready for a hard session*, *Normal training* or *Take it easy today*, with the main reasons. **Training ›** opens the [Training](#training) tab. It follows the date you pick, so you can look back at any day.
- **Daily anchors** (top of the Trends card): this week's habit boxes, for example **15 of 28 · goal 23**.
  - A bar of 28 boxes fills in as you go. The dashed boxes after the goal are your **weekly buffer** for real life.
  - Next to it, a little grid shows how many boxes you got each day (Mon–Sun).
  - Under it, a message tells you how many more you need and how many days are left.
  - The **Daily anchors per week** chart shows each week's total against a dashed **goal line**. The current week is shown lighter, because it isn't finished yet.
- **Click any chart, tile, the anchors box or the mood words** to open that metric's [detail page](#metric-detail-pages).
- **Tiles:** steps, calories eaten (with protein, carbs and fat), exercise, weight, mood and sleep (with Garmin's sleep score when there is one).
- **Body & recovery:** resting heart rate, Apple Health's HRV, active calories, alcoholic drinks and the rest of Apple Health's measures, plus **Overnight HRV, Body Battery (high) and Stress** from Garmin. Only measures you actually have are shown. Click one for its detail page.
- **Patterns:** what your evenings do to the next day, over the last 90 days. Since v3.7 it asks a **short list of questions**, each habit only against what it could plausibly change:
  - drinks → sleep, sleep score, HRV, resting heart rate
  - a big dinner (over your Dinner Boundary) → sleep, sleep score, the next morning's weigh-in
  - a workout after 7 pm → sleep, sleep score
  - under-eating (below the calorie floor) → next-day energy and mood
  - a salty day → the next morning's weigh-in
  - ↗ Me · ♡ N → next-day mood, energy and stress

  It used to compare every habit with every outcome (42 comparisons), and with that many, two or three look real by chance alone. Each one compares the next night and morning with days without the habit, and it must also **hold up in both halves**: the earlier and the later half of those days have to point the same way. One odd stretch can't make a pattern. For example: *"After evenings with a drink (20 of them): lower HRV (43 vs 50 ms), less sleep (6.4 vs 7.2 h)."* A pattern only shows with **at least 5 days each way**, and only when the difference is bigger than your normal day-to-day swing. It's a pattern, not proof: it can't rule out something else that tends to happen on the same days. The Coach sees these too.
- **Workouts / Food / How you felt:** the details for the selected day.
- **Trends:** charts for steps, weight, calories, exercise, mood and sleep. Pick the last 7 days, 30 days, 90 days or 12 months. Hover over a bar or point to see its exact number.
- **Mood words:** a word cloud of your feelings over the same period as the Trends charts.
  - **Bigger** words came up on more days.
  - **Color** shows your average mood on days with that word: **orange** = lower mood, **gray** = in between, **blue** = higher mood.
  - It uses your **tags**, plus **feeling words** from your notes (happy, anxious, tired, sore…). Ordinary words like "the", "of" or "another" are ignored.
  - Negatives are left out, so "*not* tired" doesn't add "tired".
  - Untick **Include feelings from notes** to use only your tags.
  - Hover over a word for the details.

### Metric detail pages

Click any chart or summary tile on the Dashboard (or the daily anchors box, or the mood words) to open a full page for that metric. **Details ›** appears when you hover over a chart.

- **Date range** (top right): last 30 days, 90 days, 6 months, 12 months, all time, or **Custom range…**. The preset ranges end on the date selected on the Dashboard.
  - **Custom range…** shows **From** and **To** date boxes. Pick any two dates, and the whole page updates.
  - It also has quick buttons for **This month**, **Last month**, **This year** and **Last year**.
  - The custom range stays the same as you move between metrics, so you can compare steps, sleep and mood for the same weeks.
- **Key stats:**
  - average (and median)
  - best and lowest day
  - total, or change for weight, or days logged
  - **vs previous period** (the same number of days just before)
  - **trend** (how much it's going up or down per week)
- **Day by day chart:** each day, plus a smooth **7-day average** line. Click a day on the chart to open it on the Dashboard.
- **By day of the week:** your average for each weekday, Monday to Sunday.
- **Time of day** (Steps only): your average steps for each hour of the day across the period, as bars, plus a line for the latest day. Underneath, it shows how your steps split between before noon, noon–5 pm and after 5 pm. See **Steps by time of day** below for the one-time setup.
- **Breakdown**, different for each metric:

  | Metric | Breakdown |
  |---|---|
  | Steps | How many days fell into each range (under 5,000 … 10,000+) |
  | Calories | Average protein/carbs/fat (with % of calories), average calories per meal, most-logged foods |
  | Exercise | Minutes and number of workouts for each activity type, total distance, longest workout |
  | Weight | Weekly averages and the change from the week before |
  | Mood | How often you felt each mood, average energy and stress, your top tags and the mood on those days |
  | Sleep | How many nights fell into each range (under 6 h … 8 h+), average sleep score |
  | Daily anchors | How often each box was checked, how many full weeks met the goal, and your current streak 🔥 |

- **Daily log table:** every day in the period, newest first. **Click any column header to sort by it** (▼ highest/newest first). Click it again to reverse (▲). Blank days always go to the bottom. Click a row to open that day on the Dashboard.

### Weight page (trend, goals, BMI, predictions)

Open it by clicking the Weight tile or chart. Weigh-ins come in automatically from your **Withings scale**: directly, with body composition, once it's connected (SETUP Step 14), or through Apple Health and Health Auto Export. Weighing **most mornings** works best: same time, after the bathroom, before food or drink.

- **Latest weigh-in (top of the page):** your most recent reading, large, with its date and how old it is. Up to 2 days old it's current. From **3 days** it turns amber ("getting old"). From **a week** it turns red: it says you've probably changed since then, and estimates where your trend likely is now at your pace before it. The trend weight sits beside it. The Dashboard's Weight tile also leads with the latest weigh-in and its age (red "weigh in" after a week), with the trend underneath.
- **Pace alarm:** losing faster than about **1% of body weight a week for 4 weeks** costs muscle as well as fat. The Weight page then shows **Losing too fast** in red, and a red **♥ Losing too fast** chip appears at the top of every screen; tap it to open the Weight page. It isn't counted as a data issue. Over **1.25% a week across the last 2 weeks** only, or over twice your committed rate, shows **Watch your pace** in amber, with an amber ♥ chip. The pace is a straight line fitted through your actual weigh-ins, because the smoothed trend reacts too slowly to warn in time. Daily water swings of a couple of pounds don't set it off. It needs 3 weeks of weigh-ins, with at least 6 in the last 2 weeks. The fix it suggests: eat a little more on very low days, keep protein at target, and keep strength training.

- **Trend weight:** a smoothed weight that moves 10% of the way toward each new weigh-in. It ignores day-to-day water swings (1–4 lb is normal) and shows what's really happening. It runs a few pounds behind when you're losing fast. After **3 weeks with no weigh-ins**, it starts again from your next weigh-in, so an old reading can't drag it. Trend change and the **Coach** use it.
- **Chart:** your weigh-ins as faint dots, the trend as a bold line, and a **dashed projection** to your goal at the selected rate.
- **Progress** (like Happy Scale): **milestones** sit on round numbers between your start and goal (every 5 lb by default).
  - The **arc** fills as you work through the **current milestone**, with the pounds to go and its forecast date in the middle ("3.4 lb to 185 · about Dec 2").
  - A **bar** shows the whole way from start to goal, with a tick for each milestone and the % done.
  - Lost, milestones reached (for example 5 of 7) and amount to go.
  - **Every milestone is listed:** ✓ with the date you reached it, the next one highlighted with pounds to go, and a forecast date for each one ahead.
  - A milestone counts the **first day you weigh in at or under it**, and stays reached. Progress and pounds to go are measured from your latest weigh-in, like the scale. Forecasts use your recent rate.
- **Trend change:** trend weight change over 7 days, 30 days, 90 days and all time, plus your rate per week.
- **Last 10 days:** high, latest, trend and low, so a heavy morning has context.
- **Body mass index:** a BMI gauge for your trend weight, and the weight range for each category at your height. BMI is a rough screen that doesn't separate muscle from fat, so body composition and your waist are better guides.
- **Predictions** start from your **latest weigh-in**. Pick the rate:
  - **Last 4 weeks** (the default): a straight line through your recent weigh-ins. Progress uses the same rate, so their dates match.
  - **Average:** everything you've lost since your start date, per week.
  - **Commitment:** the rate you set.

  You'll see the date you're projected to reach each milestone still ahead and your goal, plus your predicted weight on any **events** you add (a reunion, a trip). The chart's dashed projection follows the same choice. These are straight lines, so treat distant dates as rough.
- **Layout:** on a computer, Progress has its own column on the left, and Trend change, Last 10 days, BMI and Predictions sit beside it. On a phone they stack.
- **Body composition:** body fat %, fat mass and lean mass from what your Withings scale shares with Apple Health. Tick **Body Fat Percentage** and **Lean Body Mass** in Health Auto Export (SETUP Step 11); with only body fat %, fat and lean are worked out from it and that day's weight. Each one shows the change over 30 days. With Withings' developer API (SETUP Step 14, which needs a company or a paid plan) it adds muscle, water, bone, visceral fat and the scale's basal metabolic rate. Underneath, **what the loss was made of**: *"Of the 9 lb lost, about 6.5 is fat and 2.4 lean mass (27% lean)."* Each end is the average of 3 readings, because a single reading swings with water. If more than about 30% of the loss is lean mass, it turns red and says why: protein toward 130 g and two strength sessions a week protect it.
- **Waist:** your latest measurement, the change since the first, and waist ÷ height.
- **Your burn:** what you **actually** burn a day, learned from your own numbers (the way MacroFactor works): your average calories on fully logged days, plus what the scale says that eating did (3,500 cal per lb), over the last 4 weeks. It needs 21 of 28 days fully logged in Lose It and 8 weigh-ins; missed snacks make the burn look lower than it is. Then:
  - **As you get lighter:** what your current calorie goal will do at each weight ahead. You burn about 10 cal a day less per pound lost, so the same food loses less each month. That slowdown is expected, not a plateau.
  - **Suggested day's calorie goal:** your burn minus enough to lose your committed rate, capped at 1% of body weight a week, never under the 1,500 floor. **Use it** sets the day's calorie goal for the meal boxes.
- **Maintenance, practised on the way down:** most people regain because the plan stops at the goal. So at each **checkpoint** (every 25 lb: 250 and 225 by default), the page offers **2 weeks of maintenance practice** at your learned burn. During it, your meal boxes tick when the day is within that, and the card shows how steady you're holding. The scale may rise 2–4 lb in the first days: that's water and stored carbs refilling, not fat. **Skip this one** is fine too.
- **Your goal is a range** (your goal ± 5 lb by default). When your trend is inside it, the page offers **Switch to maintenance**: you eat about your burn, and the ♥ alarm watches for drifting up instead. It turns amber (**Above your range**) when your trend has been over the top for 2 weeks. **Back to losing** undoes it any time.
- **Goals and settings** (bottom of the page): goal weight, height, starting weight and date (the first weigh-in if left blank), milestone size, committed rate, **goal range** and **maintenance practice checkpoints**, and events. They sync to all your devices.

**Getting back to the Dashboard:** click **← Dashboard** (top left), press **Esc**, or use your browser's or mouse's **Back** button.

### Training

How hard to train, and whether your training is building sensibly. It uses the date picked on the Dashboard. It's a guide based on **your own usual**, not medical advice.

- **Readiness:** last night compared with **your usual** (the 28 days before; it needs about a week of history):
  - **HRV:** Garmin's overnight HRV, or Apple Health's if there's no Garmin. Lower than usual is a sign you haven't fully recovered.
  - **Resting heart rate:** higher than usual can mean stress, poor sleep, illness or hard training.
  - **Sleep:** under 6 h counts against, 7.5 h or more counts for. A poor or great sleep score moves it one more step.
  - **Body Battery,** only when there's no HRV (Garmin builds it from HRV, so using both would count it twice).
  - **Load:** a training-load spike, or a hard day yesterday (high load, or Garmin training effect 4+ aerobic or 3+ anaerobic).
  - **Body log:** very sore (7+) counts against. **Pain** 4+ keeps the call at *Normal* at most and says to keep training away from that area; pain 7+ makes it *Take it easy*.

  Each reason is listed, so you can see why. Chips underneath open the HRV, resting heart rate, sleep, Body Battery and stress pages.
- **Training load:** Garmin's training load for each workout, added up per week. Workouts without it (Strava-only, Lose It, typed in) get an estimate: heart-rate-zone minutes × zone number, or minutes × 2 with no heart rate. These are marked **est.**
  - **Last 7 days against your usual week** (the average of the 4 weeks before): 0.8–1.3× is steady, 1.3–1.5× is building fast, over 1.5× is a **spike**. It's a common rule of thumb for spotting load that climbs faster than your body adapts. It needs 4 weeks of workouts.
  - **Chart:** 12 weeks of weekly load (Monday–Sunday), with your usual week as a dashed line. This week is lighter because it isn't finished.
- **Intensity mix:** minutes in easy (zones 1–2), moderate (zone 3) and hard (zones 4–5) heart-rate zones, for the last 7 days and the last 4 weeks, with the hard share. Endurance training usually works best mostly easy, with around 20% hard.
- **Strength:** sessions in the last 4 weeks (two a week is the usual minimum for keeping muscle), and sets and reps by exercise from Garmin.
- **Body log:** everything logged in the last 2 weeks. **Pain that repeats 3 days running, gets worse 3 times in a row, or reaches 7/10** is flagged with what to do. Soreness after training is expected and isn't flagged. **Log it** jumps to Log today › Body.
- **Workouts:** the last 2 weeks, each with its source, Garmin's training-effect label (Tempo, Aerobic Base…), a bar of time in each heart-rate zone, its load, and strength sets.

### Coach

**Report cards**, like school: every week, month, quarter and year gets a grade for each subject, and a GPA. Set up in [SETUP.md Step 12](SETUP.md#step-12--report-cards-by-claude-weekly-monthly-quarterly-yearly).

**The app works out every grade from your data with fixed rules, and Claude only writes the words.** So the same data always gets the same grade, a B means the same thing in a week as in a year, and you can see exactly why you got it. The one exception is Assignments, which Claude marks from the data.

**What's graded, and how** (all targets editable in **Settings › Coach › Report card targets**):

| Subject | Credits | Score |
|---|---|---|
| **Daily anchors** | 3 | Boxes ticked ÷ your weekly goal (23 of 28), scaled to the period, up to 100% |
| **Nutrition** | 3 | Food *quality* on fully logged days: protein ≥ 100 g (25%), fiber ≥ 25 g (20%), sodium ≤ 2,300 mg (20%), saturated fat ≤ 10% of calories (15%), sugars ≤ 50 g (10%), calories ≥ 1,500 (10%). Each part is the share of days that hit it, with half credit within 10% of the target. Calories against your budgets are already graded under anchors, so they aren't counted twice. Needs 4 fully logged days a week, otherwise **I** |
| **Logging** | 1 | Days fully logged in Lose It. **This closes a loophole:** without it, skipping the log on a bad day would raise your Nutrition grade |
| **Training** | 2 | Workouts of 10+ minutes from Garmin or Strava against 4 a week (35%), strength against 2 a week (30%), load against your usual week, 0.8–1.3× (20%), hard share of zone minutes ≤ 25% (15%) |
| **Sleep habits** | 2 | Average sleep against 7 h, with zero at 6 h (50%), nights of 7 h or more (25%), in bed within 30 minutes of 10:00 pm, with zero at 90+ minutes off (25%) |
| **Assignments** | 1 | Last period's assignments, marked by Claude as done (1), partly (½) or missed (0), with the evidence |

- **Grade scale:** 97+ A+, 93 A, 90 A−, 87 B+, 83 B, 80 B−, 77 C+, 73 C, 70 C−, 67 D+, 63 D, 60 D−, below 60 F.
- **GPA:** points of A = 4.0, A− = 3.7, B+ = 3.3 … F = 0, averaged by credits. A subject without enough data gets **I** (incomplete) and is left out, and the card says how many credits were graded.
- **Not graded, but tracked:** weight trend (and whether it's on pace), HRV, resting heart rate, mood, energy, stress and pain flags. These are results, not choices. Claude connects them to the grades in words (for example "short-sleep weeks were your low-HRV weeks").
- **Parts that have no data** drop out and the rest are re-weighted. For example, load needs 4 weeks of workouts, and the hard share needs heart-rate zones.

**What's in each report card:**
- a headline and a summary: 3–4 sentences for a week, a paragraph for a month, two or three paragraphs for a quarter, about a page for a year
- for each subject: grade, trend against last time, **praise** (left empty if nothing went well, never padding), **criticism** (the biggest shortfall and its cost), one **suggestion**, and the parts behind the grade
- results (not graded), swaps that fit your plan, and attendance (days logged)
- **assignments:** last period's marked done, partly or missed, and 1–3 new ones (3 goals for next year on a yearly card). An unfinished assignment can carry over, and the card shows **carried 2×**. **After two carries, it can only carry again with a stated reason; otherwise it must be retired with one.** Nothing is dropped quietly.
  - **Did it help?** Each assignment names one measure that should move if it works (sleep, steps, protein, strength sessions, drinks…). On the next card, the app shows that measure for the period the assignment was set in against the period it was for, for example *"Sleep: 6.4 → 6.9 h"*, green when it moved the right way. It's a link, not proof, because other things change at the same time. Under each one you tap **Did it help? Yes / Somewhat / No**. Later report cards read the results and your answers, build on what worked, and don't set again what didn't.
- the **GPA**, the change from last time, and your **year-to-date GPA**

**When they're written:**
- **Weekly:** from **Monday at noon**, once Sunday's final Lose It report is in (on Tuesday it writes anyway). If the app is already open, it starts within about 10 minutes; otherwise it starts the next time you open the app. A report card takes about **20–40 seconds**, and you can keep using the app meanwhile.
- **Monthly:** on the 1st. **Quarterly:** on the first day of each quarter. **Yearly:** on January 1. Each is written from noon, once the last day's Lose It report is in.
- **Monthly and longer report cards** are written from the grades, from the weekly (or monthly, or quarterly) report cards inside them, and from the foods behind each nutrition problem, not from every day. So they cost about the same as a weekly one. Quarterly and yearly cards also compare with the same period a year earlier, once there is one.
- A quarter or year that began before your data starts is graded from the day it starts, and the card says so.

**Your why and your reflection** (top of the Coach tab):
- **Your why:** what you're doing this for, in your own words. Every report card connects the period to it, where it fits, without quoting it back at you.
- **Reflection:** for this week, or last week until its report card is written: *What got in the way?* and *What helped?* The week's report card reads it, and monthly and longer cards read all the weeks inside them. It can **explain** a grade (for example travel or illness), and the criticism and suggestion take it into account, but **it never changes the grade**. If you save a reflection after the week's card was written, the box says so, and **Regenerate** includes it.
- **Both are free.** They go into the report card that's being written anyway; there's no extra Claude call.

**Coach › Report cards** shows every report card ever written, nested: **years › quarters › months › weeks**. A week sits under the month its Thursday is in. Each row shows its grade, headline and GPA. Open a row to see its full report card and the level below.
- **A period that's still running** shows its grades so far, worked out live (the dashed badge).
- **A past period without a written card** still shows its grades from the data, with a **Write report** button.
- **Weekly reviews written before v3.2** keep their old layout until you Regenerate them, or until their data changes.

**Other controls:**
- **More swap ideas:** asks Claude for more swaps within your plan's rules.
- **Regenerate:** rewrites a report card whenever you like.
- **Automatic rewrites:** a weekly card rewrites itself if its week's data changes (food added or removed for a day, a day's calories changing by **150 or more**, or a new workout). A monthly, quarterly or yearly card rewrites itself when one of its grades changes. The card then says *"↻ Rewritten … because the data changed"* and lists what changed. Rewrites aren't emailed. At most 3 are written per check, and each costs about the same as a report card.
- **Incomplete weeks:** if food was logged on fewer than half the days, the week isn't written up. You can **add a note** (e.g. "On vacation") that later report cards take into account, or tap **Write a review anyway**. Months and longer are always graded; missing days show up in Logging.
- **On demand:** tap **Review now**, then pick dates (or a quick range), optionally ask a question, and optionally tick **Email it to me**. These are kept under **On demand**, and you can delete them.
- It's coaching, not medical advice. If something looks risky, it says so and suggests checking with a doctor or dietitian.

### Plan

A place to keep your **workout and lifestyle plan**, readable from any computer or phone. There are two ways to use it, and you can use both.

**1. Write your plan in the app**

1. Click **Edit**. The first time, a starter outline appears (weekly workouts, nutrition, sleep, habits, goals). Fill it in or replace it.
2. Use these simple codes to format it:

   | Type this | To get |
   |---|---|
   | `# Fall plan` | A big title |
   | `## Weekly workouts` | A section heading |
   | `- Walk 45 min` | A bullet point |
   | `1. Warm up` | A numbered step |
   | `- [ ] Lights out by 10:30` | An empty checkbox |
   | `- [x] Drink water` | A ticked checkbox |
   | `**bold**` / `*italic*` | **bold** / *italic* |
   | `---` | A divider line |

3. Click **Save plan**.

Your plan is saved in your Google Drive data file, alongside everything else, and it shows up on every computer.

**2. Show plan documents you already have**

1. In Google Drive, open **Health Sync → Plan**. The app creates this folder for you.
2. Drop in **PDFs**, **pictures** (such as a photo of a printed plan) or **Google Docs**.
3. In the app, open the **Plan** tab. Your documents are listed as buttons; click one to read it right on the page.
   - **Google Docs** always show their latest version, so you can keep editing the plan in Google Docs and the app stays up to date.
   - Added a file while the app was open? Click **Refresh**.
   - **PDFs** are drawn right on the page, one page under another. Click **Open in Google Drive** under the document if you need to zoom or download it.
   - **Word files (.docx)** can't be shown directly. Open the file in Google Drive and choose **File → Save as Google Docs**, or save it as a PDF.

> Your plan stays private. It lives in your Google Drive, not on GitHub.

### Daily anchors (habit boxes)

Your plan's **4 daily anchor boxes**, with a weekly goal of **23 out of 28** (about 80%, the same as the old 17 of 21 with three boxes):

| Box | Checks itself automatically when… | Or… |
|---|---|---|
| **Day Pack** | Your **daytime calories** (breakfast + lunch + snacks, everything except dinner) are **1,200 or less** | The whole day is within your **day's calorie goal** (1,950) |
| **Dinner Boundary** | Your Lose It **Dinner** adds up to **750 calories or less** | The whole day is within your **day's calorie goal** (1,950) |
| **Movement** | You have **at least 20 minutes** of workouts that day (anything recorded: Garmin, Strava, Lose It or typed in, walks included) | |
| **Steps** | You have **7,500 steps or more** (Apple Health's count, which merges your iPhone and Garmin) | **5,000 or more is half a box** (½) |

- **The day's calorie goal** ticks **both** meal boxes, however the calories were split. A big lunch and a light dinner count, as long as the day stays within the goal. It starts at your two meal limits added up (1,200 + 750 = 1,950), and you can change it in **Settings › Daily anchors**; 0 turns it off.
  - It only applies on days at or above your **calorie floor (1,500)**. Otherwise logging only breakfast, or barely eating, would tick both. On those days each meal box is judged on its own, as before.
- **Half boxes:** a ½ box counts 0.5 toward the week, so weekly totals can read **22½ of 28**. The bars and dots show it half filled, and report cards count it as half.
- **Steps today:** until you reach 7,500, the box shows your progress, like **… 5,200 of 7,500 steps so far · half a box already**, rather than a miss. It ticks itself as soon as you get there.
- **Changing the numbers:** in **Settings › Daily anchors**, Box 4 (*Auto: steps*) has the full and half step counts, and Box 3 has the workout minutes. The weekly goal and the day's calorie goal are there too.
- **Saved settings from before v3.4 are upgraded once.** Movement becomes 20 minutes, Steps gets half credit at 5,000, and reminders still at their old wording are updated. Reminders you wrote yourself are kept.

**Overriding a box:**

- Each box in **Log today** says why it's checked or not, for example *"Auto · 32 min of exercise"* or *"Auto · Day 1,840 of 1,950 cal · within the day's goal"*.
- **Click a box to override it.** A box set by hand counts as a full box or nothing, never a half. For example, tick Dinner Boundary if you stuck to the one-plate rule but Lose It didn't log dinner. It then says **"Set by hand"**. Click **Save day**.
- To go back to automatic, click **use imported data** on that box, or click the box back to whatever the data says.
- **Food boxes wait for Lose It.** Day Pack and Dinner Boundary show **… Waiting for Lose It** for today, and for yesterday until its report arrives (usually by morning). Then they're judged. Movement ticks as soon as a workout arrives.

**Changing the boxes:** in **Settings → Daily anchors**, you can rename each box, change its reminder, change how it's checked, and change the weekly goal. How it's checked can be:

- a **calorie budget**, either daytime (everything but dinner) or the whole day
- workout minutes
- matching food words
- a meal's calories
- **Check by hand only**

Click **Save anchors**. The changes sync to all your computers.

### Steps by time of day

Your step **total** comes from Apple Health's daily count, which is the only one that merges iPhone and Garmin without counting steps twice. Garmin's own count is used only on a day Apple Health missed. To see **when** you walked, Health Sync also needs your steps **by the hour**. That takes one extra automation in Health Auto Export, set up once:

1. On your iPhone, open **Health Auto Export → Automations** and tap **+**.
2. Choose the same destination as your existing automation (**Google Drive**, same folder).
3. Set:
   - **Name:** `Health Sync steps by hour`
   - **Data type:** Health Metrics → select **Step Count** only
   - **Export format:** JSON
   - **Date range:** Today
   - **Aggregation / Time Grouping:** **Hour**
   - **Sync cadence:** every hour
4. Save it. Leave your existing **Day** automation exactly as it is.

Health Sync picks the new files up by itself.
- They only show the shape of your day, scaled to the real daily total, so they never change your step count.
- The Steps page gets its **Time of day** chart.
- The Coach sees how your steps split across the day (before noon, noon–5 pm, after 5 pm).
- Any hourly or minute files already in that folder are read again once, so recent days may show up straight away.

### Log today

The **Daily anchors** boxes are at the top (see above). Below them, record your feelings, weight, steps, workouts and food by hand for any day. Use the date bar to fill in past days. **Always click Save day.**

**Measurements** (next to Weight and Steps):
- **Waist, at the navel, weekly.** Same spot, same time of day (morning), tape snug but not pressing. During fast weight loss it shows fat coming off better than the scale can. The Weight page shows it against your height: under half your height is the usual healthy line (36 in at 6′0″).
- **Push-ups, the most in one set, monthly.** A simple check that muscle is holding while you lose weight: if the number holds or rises, it is.
- The card says when either is due, and so does the Dashboard's **Today** card.

**Body:** log anything sore, stiff or painful. Pick the area, choose **Soreness** (muscle, after training), **Pain** (sharp, in a joint, or not from training) or **Stiffness**, give it 0–10, add a note if you like ("worse on stairs"), and click **Add**. Log it again on the following days, even if it's lower, so the app can see whether it's settling. Readiness and the Coach use it, and the Training tab flags pain that keeps coming back.

**Private** (in Feelings): two personal marks with no words on them, whose meaning is yours. **↗** is **Me** or **Her**; **♡** is **Y** or **N**. Tap the lit one again to clear it. They're saved with your data in Google Drive and aren't shown elsewhere on screen, except as a **Pattern** worded only as "↗ Me · ♡ N" if one shows up. **The Coach sees them**: who started it, whether it happened, and the counts for the period. It's asked to check, not assume, whether ↗ Me · ♡ N days line up with your mood: it compares your mood, energy and stress on and after those days with other days, mentions a difference only with at least 3 such days and a gap of at least half a point, calls it a pattern rather than a cause, and keeps the wording discreet (since v3.8.2). They aren't graded.

**Alcoholic drinks** (next to Sleep): leave it blank and the app counts drinks for you. It uses Apple Health's *Number of Alcoholic Beverages* if Health Auto Export sends it, or otherwise the drinks in your Lose It log, by quantity (a beer, a glass of wine, a cocktail). Foods that only sound like drinks, such as root beer, beer-battered fish or red wine vinegar, are left out. Type a number to override it, including **0** for a dry day. Drinks feed Patterns, Body & recovery and the Coach.

**Fix a mistake** (at the bottom of the Log today screen):

- **Logged on the wrong day?**
  1. Go to the wrong day.
  2. Pick the right day in **"Move what I entered on this day to"**.
  3. Click **Move**.

  This moves your mood, energy, stress, tags and notes, plus anything you typed in by hand. Imported Lose It and Garmin data stays on its real date. If the other day already has feelings, the app asks before replacing them.
- **Delete feelings for this day:** removes just the mood, energy, stress, tags and notes.
- **Delete everything on this day:** removes all data for that day. Imported data comes back if you import that day's Lose It or Garmin file again.
- You can also delete single food or workout entries with the **×** next to them.

### History

A table with one row per day. **Click any column header to sort** (click again to reverse). Click a row to open that day on the Dashboard.

### Import

- **Check Inbox now:** looks for new files in your Drive Inbox right away.
- **Open folder in Drive:** jumps straight to your Inbox.
- **Import from this computer:** drag files from your computer straight in, without using Drive.
- **Import results / Import history:** what was imported, and anything that was skipped and why.
- **Problems log** (under Data health): every error from any of your devices, newest first: a sync that failed, a file that couldn't be read, a report card that couldn't be written, a save that failed. Each entry has when, where and which device, and a repeat within a minute is counted (×3) rather than listed again. It's saved with your data, so a failure while you weren't looking is still there later. **Clear** empties it on every device.

### Settings

**What you use** (top of Settings, since v3.8): how often you've opened each tab and detail page, added up across your devices, most-used first, with **never opened** at the bottom. Each device counts its own opens and saves them with its next save, so two devices never overwrite each other. It exists for the **feature freeze**: from v3.8, no new features for 2–4 weeks while the learned burn, assignment results and waist record collect data. After that, anything near the bottom of this list is a candidate to cut.

- **Where your data lives:** shows which Google account you're connected as. **Sign out** disconnects this computer.
- **Units:** miles or kilometers. Match whatever Garmin Connect uses.
- **Backup:** download or restore your data. See [Backups](#backups).
- **Theme:** light, dark, or match your computer.

---

## Signing in: what to expect

| Situation | What happens |
|---|---|
| **First time on a new computer** | Click **Connect Google Drive** and sign in ([SETUP.md Step 7](SETUP.md#step-7--open-the-app-for-the-first-time)). |
| **You reopen the app within about an hour** | It opens straight to your dashboard. No click needed. |
| **You reopen it later than that** | Click **Connect Google Drive**. The Google window usually opens and closes by itself, because the app remembers your account. |
| **The app stays open** | It keeps itself current: when you come back to the window, and every 10 minutes while it's on screen, it reloads what your other devices saved and imports anything new in the Drive Inbox, such as the morning's Lose It report. It waits while you have unsaved changes in Log today or the plan. |
| **The app stays open longer than an hour** | Google's sign-in can only be renewed by a click, so it stops updating by itself. The status at the top says **Synced 7:10 AM · click Sync**. Click **Sync**: a Google window flashes for a second and everything comes in. Nothing is lost. |
| **About once a week** | Google asks you to **approve the app again**: pick your account, tick the Drive box, click **Continue**. This happens because the app is in "Testing" mode. It takes about 10 seconds, all inside the app's sign-in window. **You never need to go back to the Google Cloud pages.** |

---

## Updating the app

Each release is either pushed straight to GitHub (when Claude works in your copy of the repository) or comes as a Desktop folder named **Health Sync vX.Y**, whose files you upload to GitHub: every `.html`, `.js`, `.gs` and `.md` file, and the `.github` folder. **Upload them together.** The app's `.js` files only work as a set from the same version. **Never upload `config.js`**, because your GitHub copy holds your Client ID.

1. Go to `https://github.com/YOUR-USERNAME/health-sync`
2. Click **Add file → Upload files**.
3. Drag in **all the new files at once**: every `.html`, `.js`, `.gs` and `.md` file (not `config.js`). Each one **replaces** the old file with the same name.
4. Click **Commit changes**.
5. Wait **2–5 minutes**, then open `https://YOUR-USERNAME.github.io/health-sync/tests.html`. It should say **All … passed**. If anything is red, don't use the new version yet: ask Claude to fix it first.
6. Open the app.
   - From v1.4 on, a bar at the top says **"Version 1.x is available"**. Tap **Update now**.
   - On a computer, **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows) also works.

**Updating never touches your data.** Your data lives in Google Drive, not on GitHub.

> **Is the update live yet?** On your repository page, look next to the latest change for a small **dot**:
> - 🟡 = the tests are running, or it's publishing
> - ✅ = the tests passed and the update is live
> - ❌ = **a test failed, so the update was NOT published.** Your app keeps running the previous version. Click the ❌ › **Details** to see which check failed, and ask Claude to fix it.
>
> **Since v3.3, GitHub runs `tests.html` on every change and only publishes the site if every check passes** (`.github/workflows/tests.yml`). A broken release can't reach your phone.

**Versions:** MAJOR.MINOR.PATCH (3.0, 3.1, 3.1.1…). **The app and the docs share one version:** `index.html`, `core.js`, `importers.js`, `rules.js`, `migrate.js`, `sync.js` and the screen files (`drive.js`, `dashboard.js`, `log.js`, `coach.js`, `training.js`, `health.js`, `weight.js`, `metrics.js`, `main.js`), plus README, SETUP, ALTERNATIVES and CHANGELOG. **The Google script has its own number** (since v3.8), which changes only when the script's code does. The release checklist is at the top of [CHANGELOG.md](CHANGELOG.md).

**Paste the script only when there's a new one.** Each CHANGELOG entry says whether the script changed. Data health's **Google script** row turns amber only when your script is older than the newest one, and says which version to paste.

**Pasting the script:**
1. At **script.google.com**, open **Health Sync email saver**, replace all the code with the new `email-to-drive.gs`, and click **Save**.
2. Go to **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**, so the receiver uses the new code. If it says **"This project has not been deployed yet"**, skip this step: you haven't set up the receiver (it's only needed for the Coach email, SETUP.md Step 12c).
3. If the release notes say so, run **`setup`** once.

---

## Backups

Your data is already safe in Google Drive, but an extra copy doesn't hurt. Once a month is a good habit.

- **Settings → Download backup (JSON):** a complete copy of everything. Keep it somewhere safe.
- **Settings → Download daily summary (CSV):** one row per day, which you can open in Excel or Google Sheets.
- **Settings → Restore backup…:** brings back a backup file. Days in the backup replace the same days in your current data, and all other days stay as they are.

---

## Troubleshooting

| What you see | What it means / what to do |
|---|---|
| **Google Cloud asks you to pay or start a free trial** | You don't need it. Close or ignore the banner and use the direct link in SETUP.md Step 5a. If you're signed in with a **school or work account**, switch to your **personal Gmail**, ideally in a private/incognito window. |
| **"No Google Client ID is set yet"** | SETUP.md Step 6 isn't done, or GitHub hasn't finished updating. Wait 2–5 minutes and press **Cmd+Shift+R** / **Ctrl+Shift+R**. Check that `config.js` on GitHub has your Client ID between the quotes. |
| **"Error 400: origin_mismatch"** or **"redirect_uri_mismatch"** | The address in SETUP.md Step 5e is wrong. It must be exactly `https://YOUR-USERNAME.github.io`, with nothing after `.io`. Fix it under **Clients → Health Sync web** → **Save**, wait 5 minutes, and try again. |
| **"Access blocked: Health Sync has not completed the Google verification process"** | You aren't on the test-user list, or you signed in with a different account. Redo SETUP.md Step 5d with the exact Gmail you're signing in with. |
| **Clicking Connect does nothing** | Your browser blocked the pop-up. Allow pop-ups for the site. Brave users: see [SETUP.md › Brave users](SETUP.md#brave-users-allow-the-sign-in-pop-up). |
| **"Google Drive access was not allowed"** | On the Google permission screen, you have to **tick the Drive box** before clicking Continue. Click Connect again. |
| **"The sign-in window was closed"** | You closed the Google window before finishing. Click Connect again. |
| **A file stays in the Inbox** | The app couldn't use it. Open the **Import** tab to see why. It's often a file type the app doesn't use; see [ALTERNATIVES.md](ALTERNATIVES.md). |
| **"Skipped (this is Garmin's Progress Summary…)"** or **"…monthly Activities report…"** | Wrong Garmin file. Use the **Activities list → Export CSV** ([ALTERNATIVES.md](ALTERNATIVES.md#manual-files-from-lose-it-and-garmin)). |
| **Numbers look doubled** | Lose It sometimes copies Garmin, Strava or Apple Health workouts. The app skips those copies by name, and also any Lose It workout with the same minutes (±1) and similar calories as a Garmin or Strava workout that day, so this shouldn't happen. If it does, delete the extra entry in **Log today** (the **×** button). |
| **A genuine Lose It workout disappeared** | It had the same length and similar calories as a Garmin or Strava workout that day, so the app treated it as a copy. Add it in **Log today** instead. Workouts you add there are never removed. |
| **Sleep is blank** | Open **Import › Data health**. The **Sleep** row shows the last night that arrived and what to check. Sleep comes straight from Garmin (the **Garmin** row must be green, and the watch must have synced after you woke up) or through Apple Health (Sleep Analysis must be in the Health Auto Export automation). |
| **Import results say "sleep record had no hours this app can read"** | Health Auto Export sent sleep in a format the app doesn't know yet. The message lists the fields it found. Send that line to Claude so the format can be added. |
| **Readiness says "Not enough data" or Training load says "Needs 4 weeks"** | Readiness needs last night's sleep, HRV or resting heart rate, plus about a week of history to know your usual. The load comparison needs 4 weeks of workouts. Both fill in by themselves as Garmin history loads. |
| **The first sync after updating takes a few minutes** | Normal once. The app is reading your whole Garmin history (the status shows "Reading Garmin days: 120 of 400…"). After that, each sync reads only the few days that changed. |
| **Changes I uploaded to GitHub don't show** | Wait 2–5 minutes, then press **Cmd+Shift+R** / **Ctrl+Shift+R**. Check the dot on your GitHub page (see [Updating the app](#updating-the-app)). |
| **I double-clicked `index.html` on my computer and Connect doesn't work** | Google sign-in only works from the web address, so use `https://YOUR-USERNAME.github.io/health-sync/`. (Opening the file directly only allows "this computer only" mode, with no syncing.) |
| **"Strava sign-in failed (400)" when running stravaConnect** | The code expired or was already used. Run **stravaLink** again, authorize again, paste the new address into `STRAVA_CODE`, and run **stravaConnect** right away. |
| **"Strava sign-in failed (401)"** | The Client ID or Client Secret in Script Properties is wrong. Copy them again from strava.com/settings/api. Watch out for extra spaces. |
| **Strava workouts don't appear** | Check that the workout is on Strava (Garmin → Strava sync). Check the script's **Executions** for errors. New workouts arrive within about an hour. |
| **Coach says "the API key was rejected"** | Copy the key again from console.anthropic.com › API Keys (or create a new one), paste it in **Settings › Coach**, and save. |
| **Coach says "out of credit"** | Add credit at console.anthropic.com › Billing. |
| **No Monday email** | Run **emailTest** in the script (SETUP.md Step 12c), make sure you made a **New version** deployment, and check that **Script address** in Settings › Coach ends in `?key=…`. |
| **Lose It emails aren't showing up in the Inbox** | See [SETUP.md Step 9e](SETUP.md#9e-if-it-saves-nothing). Also check that the emails arrive in the **same personal Gmail** the script is set up in. |
| **The dashboard shows "—" for today** | Normal. Today's data usually arrives tomorrow. Use the **7-day avg** button (or another average), which always ends yesterday. |

---

## Privacy: who can see what

| | Can see your health data? |
|---|---|
| **You** | ✅ Yes |
| **GitHub** | ❌ No. It only stores the app's code. |
| **Google** | Your data is in your own Drive, like any of your other files. |
| **Anyone else** | ❌ No. The Google project is in Testing mode with only you on the allowed list, so nobody else can even sign in to it. |

- The app has **no server** of its own. It talks only to Google Drive, straight from your browser.
- On each computer, the browser remembers your Google sign-in for about an hour, plus which account you used. **Settings → Sign out** clears both on that computer.
- **Using a shared or public computer?** Click **Sign out** when you're done.
- **Garmin:** your Google script signs in to Garmin with your Personal API key and saves your data into your own Drive. The key stays in the script's private settings.
- **Claude (Coach):** to write a review, a summary of that period's data is sent to Anthropic's API. This includes sleep and sleep score, Garmin's HRV, Body Battery and stress, your workouts with heart-rate zones and training load, and your body log. Your API key is kept in your Drive data, never on GitHub, and is left out of backups.

---

## FAQ

**Does it cost anything?**
No. GitHub Pages, Google Drive (15 GB free) and Google's sign-in system are all free for this.

**How much space will my data use?**
The app's own data file is small: roughly 1 MB per year of daily use. The **Garmin** folder that the script fills is much bigger, because it keeps everything Garmin sends, including the original file from your watch for every workout. Even so, it's well within Google Drive's free 15 GB for years of use.

**Can I use it on my phone?**
Yes. Open the same web address in your phone's browser and sign in. To make it feel like an app, use your browser's **Share → Add to Home Screen**.

**My iPhone home-screen app is stuck on an old version.**
iPhones keep their own saved copy of home-screen apps. From v1.4 on, the app checks for updates and shows an **Update now** bar. If it's stuck on a version older than 1.4, refresh it once by hand:

1. Open **Safari** (not the home-screen icon) and go to `https://YOUR-USERNAME.github.io/health-sync/?v=new`.
2. Check the bottom of the page shows the newest version. If it doesn't, wait a few minutes and reload.
3. On your home screen, press and hold the Health Sync icon → **Remove Bookmark** (or **Delete**).
4. Back in Safari: **Share** (□↑) → **Add to Home Screen** → **Add**.
5. Open the new icon and click **Connect Google Drive** again. The home-screen app keeps its own sign-in, separate from Safari.

Still old? Go to **Settings → Apps → Safari → Advanced → Website Data** (on older iOS: **Settings → Safari → Advanced → Website Data**), search for **github.io**, swipe left and choose **Delete**. Then repeat steps 1–5.

**Can I use it on more than one computer?**
Yes, that's the point. Open the same address, connect the same Google account, and you'll see the same data.

**Is the readiness call medical advice?**
No. It compares last night with your own recent usual and suggests how hard to train. It can't tell why your numbers are off (illness, stress, alcohol, a late meal), and it doesn't diagnose pain. If something feels wrong, trust that over the number, and see a professional for pain that doesn't settle.

**What if I stop using Lose It or Garmin?**
Your history stays in your Drive. You can keep logging feelings, weight, food and workouts by hand in **Log today**.

**Can I move my data somewhere else later?**
Yes. **Settings → Download backup** gives you everything in one file, and the daily summary CSV opens in any spreadsheet.

**What happens if I use the phone and a computer on the same day?**
Both changes are kept. Before every save the app re-reads the copy in Drive and writes over it **only the fields this device changed**, field by field. Drinks logged on the phone and an Apple Health import on the Mac for the same day both survive, and so do mood from one and stress from the other. If both devices change the *same* thing (the weight for the same day, say), the device that saves last wins. A food or workout list is taken whole from whichever device changed it. Before v3.3.1 a save replaced the whole day, so a computer left open for hours could wipe what the phone had logged that day.

**Do I ever have to go back to the Google Cloud pages?**
No. That was one-time setup. The weekly re-approval happens inside the app's own sign-in window.

---

## Tests (for releases)

**`tests.html`** checks the importers and the rules against **made-up** sample files. Open it from any computer, at `https://YOUR-USERNAME.github.io/health-sync/tests.html` or from a copy of the repository. It shows every check in green or red, with the total at the top. **All green means nothing that used to work has broken.** GitHub also runs it automatically on every change, and **publishes only if it's all green** (see Updating the app).

- **It covers:** Apple Health sleep in every format, which source wins, Garmin day and workout files, keeping one copy of each workout (Garmin, CSV, Strava, Lose It), Lose It reports, training load, intensity, readiness, pain flags, the weight trend and pace alarm, alcohol, patterns, the Garmin file mark, the report-card grades, GPA and period dates, **saving from two devices** (with a pretend Drive), that nothing you save is silently dropped, and that every file carries the same version. That's 178 checks as of v3.8.1 (plus the type check and 6 screenshots), including Withings, body composition, waist, push-ups, your learned burn, maintenance phases, Today and assignment results. GitHub's run also starts the real app with a made-up day, saves an edit, and fails if the page shows any error.
- **It has no health data in it,** so it's safe on GitHub and public.
- **It doesn't cover** the Lose It PDF reader or the screens. Check those by using the app.
- **When something is fixed or added, a check for it goes in here,** so it can't break again unnoticed.
- **Screenshots (since v3.8):** GitHub also draws six screens with made-up data at a frozen date and time: the Dashboard, Weight, Log today and Training at computer size, and the Dashboard and Weight at phone size. It compares them pixel by pixel with the saved pictures in `.github/screens/`, so a screen that moves or breaks fails even when no check looks at it.
  - **A difference shows up** under the failed run's **Artifacts › screens**, with the changed pixels in red.
  - **If the change was meant**, go to **Actions › Update screenshots › Run workflow**, which saves the new pictures.
  - **Pictures from a Mac never match GitHub's,** because the fonts differ. That's why only GitHub's own run saves them.

**How the app is split** (since v3.8). `index.html` is the page itself: the markup, the styles and the version. The code is in plain script files, loaded in order and sharing one global scope:
  - **Logic:**
    - **`core.js`** holds shared helpers and the data model (a written description of a day is at the top of its data-model section).
    - **`importers.js`** reads Lose It, Apple Health, Garmin, Strava and Withings files.
    - **`rules.js`** holds everything worked out from the data.
    - **`migrate.js`** is the one place old saved data is upgraded: numbered steps, run in order once when the data loads.
    - **`sync.js`** saves to Drive and merges the changes from your devices.
  - **Screens:**
    - **`drive.js`**: storage and the Problems log
    - **`dashboard.js`**, **`log.js`**, **`coach.js`**, **`training.js`**, **`health.js`** (Data health), **`weight.js`** and **`metrics.js`** (detail pages)
    - **`main.js`**: startup and wiring, loaded last

  `tests.html` loads the logic files directly.

**Type check (since v3.8.1):** GitHub runs TypeScript's checker over every app file before the tests, with no build step: the app still ships as plain files. `jsconfig.json` lists the files and `globals.d.ts` names what comes from outside (the CDN libraries, `APP_VERSION`).
- **What it catches:** a misspelled or missing function or variable name anywhere in the app (for example `weightRatez`), wrong kinds of arguments, and fields used on a day that aren't in its written description in `core.js`.
- **What it doesn't:** a misspelled property on a plain object (`S.unti` for `S.unit`). Catching those needs TypeScript's strict mode, which buries the useful warnings under hundreds of noisy ones, so the tests and screenshots cover that instead.
- **A new `.js` file must go in `jsconfig.json`;** the test run fails if one is missing.

**The real-file suite** lives in a separate **private** repository, [abgentner/health-sync-real-tests](https://github.com/abgentner/health-sync-real-tests), because it holds your real exports. Never put those files in this repository, which is public. Every night, GitHub runs the current app code against your real files and checks known values, such as "Oct 15 = 11,442 steps, 1,818 cal, 145 g protein". It emails you when a check fails, and you can see every run under that repository's **Actions** tab. It holds the full suites from the work Mac (133 checks of the app against your real exports, and 59 of the Google script against a stand-in Google and a fake Garmin), and you can add more files and checks over time. Its README explains how.
