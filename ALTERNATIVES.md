# Health Sync — Alternatives and extras

Ways to get data in that **aren't part of the standard setup**, kept here in case you need them: manual Garmin files, Garmin's full account export, the free iPhone Shortcut, and Health Auto Export's REST option. The standard setup is in [SETUP.md](SETUP.md).

## Manual files from Lose It and Garmin

**Every file goes in the same place: Google Drive → Health Sync → Inbox.** The app works out what kind of file each one is.

### Lose It → the daily report (CSV spreadsheet or PDF)

Lose It's emailed **daily report** comes as a spreadsheet (`.csv`), and the app reads it automatically once SETUP.md Step 9 is set up. It picks up:

- every food, which meal it was in, and the amount
- calories and **all nutrients**: protein, carbs, fat, saturated fat, fiber, sugars, sodium and cholesterol
- exercise you logged directly in Lose It (Garmin and Apple Health copies are skipped, because they come from Garmin/Strava)

A newer report for the same day replaces that day's Lose It food, so re-sending a report is safe.

The app also reads Lose It's **Daily Report PDF**, the kind you can print or share from Lose It. It picks up:

- every food you logged, and which meal it was in
- the day's calories, protein, carbs and fat
- the steps and sleep that Lose It shows

**How to get the PDF into the Inbox:**

- **On your phone:** open the PDF (for example, from the email Lose It sends). Tap **Share** → **Drive** (or **Save to Files → Google Drive**). Choose **Health Sync → Inbox** and save.
- **On a computer:** save the PDF to your computer. Then open **https://drive.google.com**, go into **Health Sync → Inbox**, and drag the PDF into the window.

If you have **Lose It Premium**, its spreadsheet (CSV) export works too. You can drop the ZIP file straight in; there's no need to unzip it.

### Garmin → the Activities list (CSV)

You have to do this on the Garmin **website**. The phone app can't export.

1. Go to **https://connect.garmin.com/modern/activities** and sign in.
2. You'll see a long **list of your workouts**, one per row.
3. **Scroll down** until the oldest workout you want has loaded. The list loads more as you scroll.
4. Click **Export CSV**. It's a small link at the top right of the list.
5. A file called **`Activities.csv`** downloads. Put it in **Health Sync → Inbox**.

**How to tell you have the right file:** its first row starts with `Activity Type, Date, Favorite, Title, Distance, Calories, Time…`.

> ❌ **These Garmin files look similar but won't work:**
> - **Progress Summary**: totals only, with no dates
> - The monthly **Activities report** from the Reports section: counts per month, not individual workouts
>
> If you drop one in, the app tells you and leaves it in the Inbox. You can delete it.

**Steps, sleep and weight from Garmin:** Garmin doesn't offer a single everyday report with all of these. You don't need one:

- **Every day**, your **Lose It Daily Report** already includes the steps and sleep that Garmin sends to Lose It, plus your weight if you log it there.
- **For workouts**, drop in the **Activities CSV** above every week or two. One file covers as far back as you scroll.
- **For your whole past history** of steps, sleep and resting heart rate, do Garmin's one-time full export (see [Your whole Garmin history](#your-whole-garmin-history-one-time)).

Garmin's single-measure reports also work, if you want them: in Garmin Connect, go to **Reports** (or **Health Stats**) → **Steps**, **Weight** or **Sleep**, pick a date range, and click **Export**.

### The easiest everyday routine

| How often | What to drop in the Inbox | What it brings in |
|---|---|---|
| Every day (automatic with SETUP.md Step 9) | Lose It **daily report** (CSV) | Food, calories, all nutrients |
| Whenever you close Lose It or Garmin Connect (automatic with SETUP.md Step 11) | Apple Health file from the iPhone shortcut | Steps, sleep, weight, resting heart rate, HRV, active calories and more |
| Every hour (automatic with SETUP.md Step 10) | Strava workouts | Workouts: type, time, distance, calories, heart rate |
| Every week or two (optional with SETUP.md Step 10) | Garmin **Activities CSV** | Workouts, with Garmin's full details |
| Once, at the start | Garmin **full export ZIP** (Step 11) | Your entire history of steps, sleep and resting heart rate |

---

## Your whole Garmin history (one-time)

Garmin has one export that contains **everything**: years of daily steps, sleep and resting heart rate. It's a one-time download, and it's great for filling in your history.

1. Go to **https://www.garmin.com/account/datamanagement/** and sign in with your Garmin account.
2. Click **Export Your Data**, then **Request Data Export**.
3. Garmin emails you a **download link**. This can take anywhere from a few hours to a few days.
4. Click the link in the email and download the **ZIP file**. It can be large (hundreds of MB). **Don't unzip it.**
5. Open Health Sync → **Import** tab → drag the ZIP onto **Import from this computer**.
   - For a file this big, this is faster than putting it in the Drive Inbox.
6. Give it a minute. The results will say something like *"Garmin export: 1,204 days of steps, 1,150 nights of sleep."*

**Good to know:**

- The app only reads the daily-summary and sleep files inside the ZIP. It ignores everything else, such as GPS tracks and device files.
- For **workouts**, use the **Activities CSV** (Step 9). It's more reliable for workout details.
- Importing it again later is safe. Days are updated, not doubled.

---

## Apple Health with a free iPhone Shortcut (instead of Health Auto Export)

A free iPhone **Shortcut** (Apple's built-in automation app) copies the last 3 days of Apple Health data into your Drive **Inbox**, and Health Sync imports it.

**When it runs:** iPhones don't let shortcuts read Health data while the phone is **locked**, so the shortcut runs **when you close Lose It or Garmin Connect**. Your phone is unlocked then, and you use those apps every day. Each run covers the last 3 days, so a missed run fills in next time.

**What it can bring in:**
- **Recommended:** steps, sleep, weight, resting heart rate, heart rate variability (HRV), active calories
- **Also supported:** flights climbed, water, VO₂ max, body fat %, mindful minutes

Each one is the same small block in the shortcut (13d). Add the ones you want.

### 13a. Let Garmin Connect write to Apple Health

1. Open the **Garmin Connect** app → tap **More** (☰, bottom right) → **Settings** → **Connected Apps** → **Apple Health**.
2. Turn on sharing, and allow everything you want: steps, sleep, weight, heart rate and so on.
3. Check on the iPhone side: **Settings → Apps → Health → Data Access & Devices → Garmin Connect** → **Turn On All**. (On older iOS: **Settings → Health → Data Access & Devices**.)

### 13b. Make Google Drive available to your iPhone's Files

1. Install the **Google Drive** app from the App Store and sign in with your **personal Gmail**.
2. Open Apple's **Files** app → tap **Browse** → tap **⋯** (top right) → **Edit** → turn on **Drive** → **Done**.

### 13c. Create the shortcut

1. Open the **Shortcuts** app → **Shortcuts** tab → tap **+** (top right).
2. Tap the name at the top → **Rename** → type `Health Sync`.

**How to add variables:** in a Text action, tap where you want a value to go. A bar of suggestions (like **Repeat Item**) appears above the keyboard. Tap one to insert it as a coloured bubble. **Tap the bubble** to pick which part to use (Start Date, Value…) and how dates are formatted.

### 13d. Add one block for each type of data

Every block is the same 3 actions. **Steps** is spelled out in full first; the others just change a few things.

**Block 1 — Steps**

1. Tap **Search for apps and actions**, type `Find Health Samples`, and tap it.
2. In the action:
   - Tap **Type** → choose **Steps**.
   - Tap **Add Filter**. Set it to **Start Date** · **is in the last** · `3` · **days**.
   - Tap **Add Filter** again. Set it to **Source** · **is** · **Garmin Connect**. This stops your iPhone's own step count being added on top of Garmin's.
   - If there's a **Group By** option, set it to **Day**. If you don't see it, that's fine.
3. Search `Repeat with Each` and add it. It automatically repeats over the **Health Samples**.
4. Inside the repeat (between **Repeat with each** and **End Repeat**), add a **Text** action and type exactly:
   - `steps;`
   - then insert **Repeat Item**. Tap the bubble → **Start Date**. Tap it again → **Date Format: ISO 8601**, with **Include Time** turned **on**.
   - then type `;`
   - then insert **Repeat Item** again. Tap the bubble → **Value**.

   It should read: `steps;` **[Start Date]** `;` **[Value]**

**Block 2 — Sleep** (add it under the first **End Repeat**)

- **Find Health Samples**: Type **Sleep** (may be called *Sleep Analysis*), Start Date **is in the last 3 days**, Source **is Garmin Connect**.
- **Repeat with Each**, then a **Text** inside it:
  `sleep;` **[Start Date, ISO 8601]** `;` **[End Date, ISO 8601]** `;` **[Value]**

  For **End Date**: insert Repeat Item, tap the bubble, choose **End Date**, and set ISO 8601 the same way.

**Block 3 — Weight**

- **Find Health Samples**: Type **Weight**, Start Date **is in the last 3 days**. No source filter, so it picks up any scale or app.
- **Repeat with Each** → **Text**: `weight;` **[Start Date, ISO 8601]** `;` **[Value]** `;` **[Unit]**

**Blocks 4+ — the others you want.** Each one is a Find Health Samples (that Type, Start Date in the last 3 days, Source Garmin Connect), then Repeat with Each, then Text, starting with the word shown:

| Type in Find Health Samples | Text starts with | Text after it |
|---|---|---|
| **Resting Heart Rate** | `restinghr;` | **[Start Date, ISO 8601]** `;` **[Value]** |
| **Heart Rate Variability** | `hrv;` | same |
| **Active Energy** | `activecal;` | same |
| **Flights Climbed** | `flights;` | same |
| **Water** | `water;` | same |
| **VO2 Max** (Cardio Fitness) | `vo2max;` | same |
| **Body Fat Percentage** | `bodyfat;` | same |
| **Mindful Minutes** | `mindful;` | **[Start Date, ISO]** `;` **[End Date, ISO]** |

### 13e. Put it all in one file and save it to Drive

At the very bottom of the shortcut, **after all the End Repeats**:

1. Add a **Text** action. Type `health-sync;apple-health;1` and press **return**. Then, for each block, insert that block's **Repeat Results**, each on its own line:
   - Tap **Select Variable**, or the variable button above the keyboard, and pick each **Repeat Results** in turn.
   - Steps' results come first, then sleep, and so on. The order doesn't actually matter.
   ```
   health-sync;apple-health;1
   [Repeat Results]
   [Repeat Results]
   [Repeat Results]
   ```
2. Add **Set Name**. Set the name of **Text** to `apple-health.txt`.
3. Add **Save File**:
   - Tap the folder name → **Drive** → **My Drive** → **Health Sync** → **Inbox** → **Open** (or **Done**).
   - Turn **Ask Where to Save** **off**.
   - Leave **Overwrite If File Exists** **off**. Each run gets its own file, and Health Sync tidies them up.
4. Tap **▶** (bottom right) to run it once.
   - When the iPhone asks for Health access, tap **Allow** or **Turn On All**.
   - Allow access to Drive if asked.
5. Check **Google Drive → Health Sync → Inbox**. An `apple-health.txt` file should be there.
6. Open Health Sync. The results should say something like *"Apple Health — 3 days (steps, sleep, weight, resting heart rate…)"*.

### 13f. Make it run automatically

1. In **Shortcuts**, tap the **Automation** tab → **+** (or **New Automation**).
2. Choose **App** → tap **Choose** → select **Lose It!** and **Garmin Connect** → **Done**.
3. Tick **Is Closed**. Untick **Is Opened**.
4. Choose **Run Immediately**, and turn **Notify When Run** off.
5. Tap **Next** → choose **Health Sync** → **Done**.

Now every time you leave Lose It or Garmin Connect, your latest Apple Health data heads to your Drive.

**You can also run it by hand:** tap **Health Sync** in the Shortcuts app, or add it to your home screen (press and hold the shortcut → **Share** → **Add to Home Screen**).

### If something's off

| Problem | Fix |
|---|---|
| **Steps look doubled** | Add the **Source is Garmin Connect** filter to the Steps block (13d). |
| **"skipped (… no readable data)"** in the Import tab | One of the Text actions isn't quite right. Open `apple-health.txt` in Drive and check lines look like `steps;2026-10-16T00:00:00-07:00;8123`. Dates must be **ISO 8601**. |
| **The shortcut fails when run automatically** | Usually it ran while the phone was locked. Using **Is Closed** for an app you just used avoids this. |
| **Save File can't see Drive** | Do 13b again (Google Drive app installed and turned on in Files). |
| **Sleep looks too long** | Make sure the Sleep block has **Source is Garmin Connect**, so the iPhone's own sleep tracking isn't added on top. |
