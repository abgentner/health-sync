# Health Sync

> **Version 2.3** · October 19, 2026 · [Setup](SETUP.md) · [Alternatives](ALTERNATIVES.md) · [Version history](CHANGELOG.md)

**Health Sync is your private health dashboard.** It brings **food, workouts, steps, sleep, weight, heart rate and how you feel** together in one place, and it updates itself. A Claude-powered **Coach** reviews each week.

It's a web page you open like an app (on your Mac via Brave, on your iPhone from the home screen). Your data lives only in **your own Google Drive**.

---

## Your setup at a glance

| Source | What it brings | How it gets in | How often |
|---|---|---|---|
| **Lose It** | Every food, meals, all nutrients | Daily report email → your Google script → Drive Inbox | Daily |
| **Strava** (fed by Garmin) | Workouts | Your Google script asks Strava → Drive Inbox | About hourly |
| **Apple Health** (fed by Garmin, Withings, Lose It) | Steps, sleep, resting heart rate, active calories, flights, weight, body fat, nutrition backup | Health Auto Export → its Drive folder | Daily (yesterday's totals) |
| **You** | Mood, energy, stress, notes, anchor overrides, your plan | The app | Whenever |
| **Claude** | Weekly review + email | The app (with your API key) → your script sends the email | Mondays, or on demand |

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

1. It **syncs** on open: new files from the Drive Inbox and the Health Auto Export folder are imported.
2. **Yesterday is complete**; today usually isn't, because most sources send a day's totals the next morning. That's why averages always end yesterday.
3. **Log how you feel** in **Log today** (mood, energy, stress, tags, notes), and override an anchor box if the data got it wrong.
4. **Mondays:** the Coach writes last week's review and emails it to you.

**Re-importing never doubles anything.** A newer report for the same day replaces the old one, the same workout from Garmin and Strava is kept once, and anything you type in by hand is never overwritten.

---

## Data health and alerts

**Import tab › Data health** shows when each source last delivered, and what to do if one is late:

| Row | Green when | Amber / red when |
|---|---|---|
| **Google script** | It ran in the last few hours | It hasn't run for 3+ hours (check its hourly trigger) |
| **Lose It report** | An email arrived in the last 36 h | No email for 36 h (amber) or 72 h (red), or saving failed |
| **Apple Health** | Health Auto Export updated in the last 36 h | Late, or it's sending **minute-by-minute** data (set Time Grouping to **Day**) |
| **Strava** | Connected, no errors | The sync failed (run `stravaCheck`) |
| **Coach** | Last week's review is written | It's 2+ days late (see the Coach tab) |

- When anything is amber or red, a **⚠ data issue** chip appears at the top of every screen. Tap it to open this panel.
- **Alert emails:** your Google script checks every hour, even when the app is closed. It emails you **once a day per problem** if Lose It or Health Auto Export goes quiet for 36 hours, if Health Auto Export switches to minute data, or if Strava fails.

---

## What each screen does

### Dashboard

- **Date bar:** use **‹ ›** to move between days, or **Today** to jump back.
- **Day / 5 / 7 / 15 / 30-day average buttons:** choose what the six summary tiles show.
  - **Day** shows just the selected day.
  - The **average** buttons always **end the day before** the selected date. Lose It and Garmin data usually arrives a day late, so today's numbers would be incomplete.
  - Days with no data for a measure are **skipped**, so they don't pull the average down. Each tile says how many days it's based on.
  - **Exercise** is minutes per day across all days that have any data, so a day without a workout counts as 0.
  - The app remembers which button you picked.
- **Tabs along the top:** Dashboard · **Coach** · **Plan** · Log today · History · Import · Settings.
- **Daily anchors** (top of the Trends card): this week's habit boxes, for example **12 of 21 · goal 17**.
  - A bar of 21 boxes fills in as you go. The dashed boxes after the goal are your **weekly buffer** for real life.
  - Next to it, a little grid shows how many boxes you got each day (Mon–Sun).
  - Under it, a message tells you how many more you need and how many days are left.
  - The **Daily anchors per week** chart shows each week's total against a dashed **goal line**. The current week is shown lighter, because it isn't finished yet.
- **Click any chart, tile, the anchors box or the mood words** to open that metric's [detail page](#metric-detail-pages).
- **Tiles:** steps, calories eaten (with protein, carbs and fat), exercise, weight, mood and sleep.
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

**Getting back to the Dashboard:** click **← Dashboard** (top left), press **Esc**, or use your browser's or mouse's **Back** button.

### Coach

Reviews written by Claude (set up in [SETUP.md Step 12](SETUP.md#step-12--weekly-coach-reviews-by-claude)).

- **Weekly:** written automatically the first time you open the app on or after Monday, once Sunday's data has arrived. If it hasn't yet, the Coach tab says "Waiting for …'s data". A review takes about **20–40 seconds** to write, and you can keep using the app meanwhile.
- **What's in a review:**
  - grade and why
  - narrative
  - went well, fell short, what's working, what isn't
  - nutrition mix, with the problem foods named
  - swaps that fit your plan
  - focus for next week
  - the week's key numbers

  Reviews follow up on the previous week's focus.
- **More swap ideas:** asks Claude for more swaps within your plan's rules.
- **Regenerate:** rewrites a review, for example after late data arrives.
- **Incomplete weeks:** if food was logged on fewer than half the days, the week isn't graded. You can **add a note** (e.g. "On vacation") that later reviews take into account, or tap **Write a review anyway**.
- **Previous weeks:** listed below the latest review, newest first. Tap one to expand it.
- **On demand:** tap **Review now**, then pick dates (or a quick range), optionally ask a question, and optionally tick **Email it to me**. These are kept in the **On demand** list, and you can delete them.
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

Your plan's **3 daily anchor boxes**, with a weekly goal of **17 out of 21** (about 80%):

| Box | Checks itself automatically when… |
|---|---|
| **Day Pack** | Your **daytime calories** (breakfast + lunch + snacks, everything except dinner) are **1,200 or less** |
| **Dinner Boundary** | Your Lose It **Dinner** adds up to **750 calories or less** |
| **Movement** | You have **at least 10 minutes** of workouts that day (from Garmin, Lose It or typed in) |

**Overriding a box:**

- Each box in **Log today** says why it's checked or not, for example *"Auto · 32 min of exercise"*.
- **Click a box to override it.** For example, tick Dinner Boundary if you stuck to the one-plate rule but Lose It didn't log dinner. It then says **"Set by hand"**. Click **Save day**.
- To go back to automatic, click **use imported data** on that box, or click the box back to whatever the data says.
- Boxes fill in as your files arrive, so yesterday's boxes may tick themselves the next morning, when the Lose It report comes in.

**Changing the boxes:** in **Settings → Daily anchors**, you can rename each box, change its reminder, change how it's checked, and change the weekly goal. How it's checked can be:

- a **calorie budget**, either daytime (everything but dinner) or the whole day
- workout minutes
- matching food words
- a meal's calories
- **Check by hand only**

Click **Save anchors**. The changes sync to all your computers.

### Log today

The **Daily anchors** boxes are at the top (see above). Below them, record your feelings, weight, steps, workouts and food by hand for any day. Use the date bar to fill in past days. **Always click Save day.**

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

### Settings

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
| **The app stays open longer than an hour** | Nothing visible happens. The next time you click **Sync**, **Save day** or **Check Inbox now**, a Google window flashes for a second and the action goes through. Nothing is lost. |
| **About once a week** | Google asks you to **approve the app again**: pick your account, tick the Drive box, click **Continue**. This happens because the app is in "Testing" mode. It takes about 10 seconds, all inside the app's sign-in window. **You never need to go back to the Google Cloud pages.** |

---

## Updating the app

Each release comes as a Desktop folder named **Health Sync vX.Y**. Upload its `index.html` and the `.md` files to GitHub. **Never upload `config.js`**, because your GitHub copy holds your Client ID.

1. Go to `https://github.com/YOUR-USERNAME/health-sync`
2. Click **Add file → Upload files**.
3. Drag in the new file. It **replaces** the old one with the same name.
4. Click **Commit changes**.
5. Wait **2–5 minutes**, then open the app.
   - From v1.4 on, a bar at the top says **"Version 1.x is available"**. Tap **Update now**.
   - On a computer, **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows) also works.

**Updating never touches your data.** Your data lives in Google Drive, not on GitHub.

> **Is the update live yet?** On your repository page, look next to the latest change for a small **dot**:
> - 🟡 = still publishing
> - ✅ = live
> - ❌ = something went wrong; try uploading again

**When the script changes too** (the version history says so):
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
| **Numbers look doubled** | Lose It sometimes copies Garmin workouts. The app skips Lose It entries with "Garmin" in the name, so this shouldn't happen. If it does, delete the extra entry in **Log today** (the **×** button). |
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
- **Claude (Coach):** to write a review, a summary of that period's data is sent to Anthropic's API. Your API key is kept in your Drive data, never on GitHub, and is left out of backups.

---

## FAQ

**Does it cost anything?**
No. GitHub Pages, Google Drive (15 GB free) and Google's sign-in system are all free for this.

**How much space will my data use?**
Very little: roughly 1 MB per year of daily use.

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

**What if I stop using Lose It or Garmin?**
Your history stays in your Drive. You can keep logging feelings, weight, food and workouts by hand in **Log today**.

**Can I move my data somewhere else later?**
Yes. **Settings → Download backup** gives you everything in one file, and the daily summary CSV opens in any spreadsheet.

**Do I ever have to go back to the Google Cloud pages?**
No. That was one-time setup. The weekly re-approval happens inside the app's own sign-in window.

---

## Regression tests (for releases)

Before each release, the importers are checked against **your real sample files** (Lose It PDF and CSV, Health Auto Export ZIP, daily, minute and weekly files, and Garmin summary files): 45 checks such as "Oct 15 = 11,442 steps, 1,818 cal, 145 g protein". The test page and your files live **only on your Mac** (Desktop › **Health Sync tests**). They're never uploaded to GitHub, because they contain your health data.
