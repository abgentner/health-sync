# Health Sync — Setup from scratch

This is the one-time setup, in the order that matches **your** setup: GitHub hosting, your Google Drive, Lose It report emails, Strava, Health Auto Export (Garmin + Withings via Apple Health) and the Claude Coach. Everyday use is in [README.md](README.md). Other ways to get data in are in [ALTERNATIVES.md](ALTERNATIVES.md).

> ✏️ `YOUR-USERNAME` means your GitHub username (yours is `abgentner`).

**You'll need:** a computer, a personal Gmail, about an hour in total, and the release files (`index.html`, `config.js`, `email-to-drive.gs` and the `.md` files).

## Step 1 — Get a personal Google (Gmail) account

**Why:** your health data will live in this account's Google Drive.

**Use a personal Gmail account, not a school or work account.** School and work accounts often:

- block the developer pages you need in Step 5, or
- ask you to pay for them.

They also aren't a good place for private health data.

**Already have a personal Gmail?** Skip to Step 2.

**Need one?**

1. Go to **https://accounts.google.com/signup**
2. Type your first and last name, then click **Next**.
3. Enter your birthday and gender, then click **Next**.
4. Choose a Gmail address, then click **Next**.
5. Make a password, then click **Next**.
6. Follow the rest of the screens. Adding a phone number for recovery is a good idea.
7. **Write down your new Gmail address.** You'll use it several times.

---

## Step 2 — Make a GitHub account

**Why:** GitHub is a free website that will host your app at its own web address.

1. Go to **https://github.com/signup**
2. Type your **email**, then click **Continue**.
3. Make a **password**, then click **Continue**.
4. Choose a **username**, then click **Continue**.
   - ⚠️ Choose carefully: it becomes part of your app's address, like `https://YOUR-USERNAME.github.io/health-sync/`.
   - Lowercase and short is best.
5. Solve the little puzzle GitHub shows you.
6. Check your email for a code from GitHub and type it in.
7. If GitHub asks questions about how you'll use it, click **Skip personalization** at the bottom.
8. If GitHub asks you to pick a plan, choose **Free**.
9. **Write down your username.**

---

## Step 3 — Put the app on GitHub

### 3a. Make a "repository" (a project folder on GitHub)

1. Make sure you're signed in to GitHub.
2. Go to **https://github.com/new**
3. In **Repository name**, type exactly: `health-sync`
4. Make sure **Public** is selected.
   - This is required for free hosting.
   - Only the app's code is public. Your health data never goes to GitHub.
5. Tick **Add a README file**.
6. Click the green **Create repository** button at the bottom.

You're now on your repository's page. Its address is `https://github.com/YOUR-USERNAME/health-sync`.

### 3b. Upload the app files

1. Near the top right of the page, click the **Add file** button, then **Upload files**.
2. Drag in **`index.html`**, **`config.js`**, **`email-to-drive.gs`**, **`README.md`**, **`SETUP.md`**, **`ALTERNATIVES.md`** and **`CHANGELOG.md`**. Or click **choose your files** and pick them.
   - It's fine to replace the README that GitHub made for you.
3. Wait until all the files show in the list.
4. Scroll down and click the green **Commit changes** button.
   - "Commit" just means **save** on GitHub.
5. You should now see `README.md`, `config.js` and `index.html` on the page.

---

## Step 4 — Turn the app into a website

1. On your repository page, click the **⚙️ Settings** tab. It's in the row of tabs near the top.
2. In the list on the left, click **Pages**.
3. Under **Build and deployment** → **Source**, choose **Deploy from a branch**.
4. Under **Branch**, set the first box to **main** and the second box to **/ (root)**.
5. Click **Save**.
6. Wait **2–5 minutes**, then refresh the page.
7. A box appears at the top saying **"Your site is live at https://YOUR-USERNAME.github.io/health-sync/"**.
8. **Copy that address and save it.** That's your app.

> If you open the address now, it will say **"No Google Client ID is set yet."** That's normal. Steps 5 and 6 fix it.

---

## Step 5 — Register the app with Google

**Why:** Google only lets an app use your Drive if the app is registered. You'll register it just for yourself.

**It's free.** These are developer pages, but you only need the clicks below.

> ⚠️ **Before you start, check which Google account you're using.** Look at the round picture at the top right of each Google page. It must be the **personal Gmail from Step 1**. If you're signed in to several Google accounts, it's easiest to do this step in a **private/incognito window**:
> - Brave or Chrome: **Cmd+Shift+N** on a Mac, **Ctrl+Shift+N** on Windows.
> - Then sign in with only your personal Gmail.

> ⚠️ **Never click "Start free trial", "Activate" or anything that asks for a credit card.** That's an ad for Google's paid services, and you don't need it. If a banner like that appears, close it with the **X** or ignore it.

### 5a. Make a project

1. Go to **https://console.cloud.google.com/projectcreate**
   - This link opens the "New project" form directly and skips Google's sales page.
2. If you're asked to agree to the Terms of Service, pick your country, tick the box, and click **Agree and continue**. This is free.
3. **Project name:** type `Health Sync`
4. Leave **Location** as it is. Click **Create**.
5. Wait about 10 seconds. A bell notification will say the project was created.
6. At the top left of the page, click the **project picker** box and choose **Health Sync**.
   - Make sure **Health Sync** is shown at the top of the page before you continue.

### 5b. Turn on Google Drive for the project

1. Go to **https://console.cloud.google.com/apis/library/drive.googleapis.com**
2. Check that **Health Sync** is shown at the top.
3. Click the blue **Enable** button.

### 5c. Set up the sign-in screen

1. Go to **https://console.cloud.google.com/auth/overview**
   - If the page is titled **OAuth consent screen** instead, that's the same thing.
2. Click **Get started**.
3. **App Information:**
   - **App name:** `Health Sync`
   - **User support email:** pick your Gmail
   - Click **Next**
4. **Audience:** pick **External**, then click **Next**.
5. **Contact Information:** type your Gmail, then click **Next**.
6. **Finish:** tick the box agreeing to Google's user data policy. Click **Continue**, then **Create**.

### 5d. Make yourself the only person allowed to use it

1. In the left-hand menu, click **Audience**.
2. Make sure **Publishing status** says **Testing**.
   - **Leave it on Testing.** Do **not** click "Publish app".
3. Scroll down to **Test users** and click **+ Add users**.
4. Type your Gmail address and click **Save**.

### 5e. Get the app's Google key (the "Client ID")

1. In the left-hand menu, click **Clients**.
2. Click **+ Create client**.
3. **Application type:** pick **Web application**.
4. **Name:** type `Health Sync web`
5. Find **Authorized JavaScript origins** and click **+ Add URI**.
6. Type **only the first part** of your app's address:
   - ✅ Right: `https://YOUR-USERNAME.github.io`
   - ❌ Wrong: `https://YOUR-USERNAME.github.io/health-sync/` (no `/health-sync`, no slash at the end)
7. **Leave "Authorized redirect URIs" empty.**
8. Click **Create**.
9. A box pops up with your **Client ID**. It's a long code ending in `.apps.googleusercontent.com`.
   - Click the **copy** icon next to it.
   - Paste it somewhere safe for a minute, such as a note.
   - You do **not** need the "Client secret".

> Closed the box by accident? Go to **Clients**, click **Health Sync web**, and the Client ID is shown on the right.

---

## Step 6 — Give the app its Google key

1. Go to your repository: `https://github.com/YOUR-USERNAME/health-sync`
2. Click **`config.js`** in the file list.
3. Click the **✏️ pencil icon** at the top right of the file to edit it.
4. Find this line:
   ```js
   clientId: ""
   ```
5. Click **between the two quote marks** and paste your Client ID. It should look like this:
   ```js
   clientId: "1234567890-abc123def456.apps.googleusercontent.com"
   ```
   - Keep both quote marks.
   - Don't add any spaces.
6. Click the green **Commit changes…** button, then **Commit changes** again in the box that appears.
7. Wait **2–5 minutes** for GitHub to update your website.

> A Client ID is **not** a password, so it's fine for it to be visible on GitHub. On its own it can't open your Drive. Only you can, by signing in.

---

## Step 7 — Open the app for the first time

1. Go to `https://YOUR-USERNAME.github.io/health-sync/`
   - Still says "No Google Client ID"? Wait a couple more minutes, then press **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows) to force a refresh.
2. Click **Connect Google Drive**.
3. A Google window opens. **Pick your personal Gmail.**
4. Google says **"Google hasn't verified this app."** That's expected, because it's your own app and nobody else uses it.
   - Click **Continue**.
   - If you only see **Advanced**, click it, then click **Go to Health Sync (unsafe)**.
5. On the next screen, **tick the box** that lets Health Sync see, edit, create and delete your Google Drive files. Then click **Continue**.
   - ⚠️ If you don't tick the box, the app can't work.
6. 🎉 Your dashboard appears.

**Now look in Google Drive.** Go to **https://drive.google.com** → **My Drive**. You'll see a new folder:

```
Health Sync/
  Inbox/             ← you put new Lose It and Garmin files here
  Processed/         ← the app moves files here after reading them
  Plan/              ← optional: PDFs, pictures or Google Docs of your plan
  health-data.json   ← all your data (appears after the first save; don't edit it)
```

> Don't see `health-data.json` yet? That's normal. It's created the first time something is saved, such as an import or **Save day**.

---

## Step 8 — Make it easy to open

Pick any of these.

### Option A — Install it as an app in Brave (recommended)

It gets its own window and a Dock icon, like a real app.

1. Open your app's address in **Brave**.
2. Click the **☰** menu (three lines) at the top right.
3. Click **Save and share** → **Install page as app…** → **Install**.
   - On older Brave versions it's **More tools → Create shortcut…** instead. Tick **Open as window**, then click **Create**.
   - You might also see a small **install icon** (a screen with a down arrow) at the right end of the address bar. That does the same thing.
4. To keep it in the Dock, right-click the app's Dock icon → **Options** → **Keep in Dock**.

It also shows up in **Launchpad**, and in your Applications folder under **Brave Browser Apps**.

### Option B — Install it as an app in Chrome

Click **⋮** (top right) → **Cast, save and share** → **Install page as app…** → **Install**.

### Option C — A desktop shortcut (Mac)

1. Open your app's address in any browser.
2. Make the browser window smaller so you can see your Desktop behind it.
3. Click and hold the **little icon to the left of the web address** (a padlock or similar).
4. Drag it onto your Desktop and let go.
5. Rename the new file **Health Sync** if you like. Double-click it to open the app.

### Brave users: allow the sign-in pop-up

Brave's **Shields** can block the Google sign-in window. If clicking **Connect Google Drive** does nothing:

1. Click the **lion icon 🦁** in the address bar.
2. Allow pop-ups for the site, or turn Shields **down** for it.
3. If sign-in still fails, go to **Settings → Privacy and security → Site and Shields settings → Additional content settings → Third-party sign-in** and allow `YOUR-USERNAME.github.io`.

---

## Step 9 — Send Lose It report emails to Google Drive automatically

**What this does:** a small script runs in your own Google account. **Every hour**, it looks in your Gmail for new emails from **Lose It** (`donotreply@loseit.com`) or **Garmin** that have a **PDF, CSV or ZIP** attached, and saves those files into **Health Sync → Inbox**. You never have to move a file by hand again.

- It's free, and it runs on Google's computers even when yours is off.
- Your emails are **not** changed or deleted. Each email gets a Gmail label called **health-sync-saved**, so it's never copied twice.

### 9a. Make sure Lose It emails your personal Gmail

The script can only see the Gmail account it's set up in, so **Lose It's emails must arrive in the same personal Gmail you use for Health Sync**.

- If Lose It emails a **different address** (for example a school or work address), do one of these:
  - change your email address in Lose It's settings to your personal Gmail, **or**
  - in that other email account, set up **automatic forwarding** of Lose It emails to your personal Gmail.

### 9b. Create the script

1. Go to **https://script.google.com** and sign in with your **personal Gmail**.
2. Click **New project** (top left).
3. Click **Untitled project** at the top and rename it `Health Sync email saver`. Click **Rename**.
4. You'll see some code that starts with `function myFunction()`. Click in the code, press **Cmd+A** (Mac) or **Ctrl+A** (Windows) to select all of it, and press **Delete**.
5. Open the file **`email-to-drive.gs`** in any text editor (TextEdit on a Mac, Notepad on Windows), or open it on your GitHub page.
   - Select all of its text and copy it (**Cmd+C** / **Ctrl+C**).
6. Go back to the script page and paste (**Cmd+V** / **Ctrl+V**).
7. Click the **💾 Save** icon, or press **Cmd+S** / **Ctrl+S**.

### 9c. Turn it on

1. At the top of the code, there's a toolbar with a dropdown that shows a function name. Choose **`setup`**.
2. Click **▶ Run**.
3. A box says **"Authorization required"**. Click **Review permissions**.
4. Choose your **personal Gmail**.
5. Google says **"Google hasn't verified this app."** That's expected, because this is your own script.
   - Click **Advanced** → **Go to Health Sync email saver (unsafe)**.
6. Tick **Select all**, or tick each box, so the script can read your Gmail and add files to your Drive. Then click **Continue** (or **Allow**).
7. At the bottom, the **Execution log** shows something like `Saved 1 attachment(s) from 1 email(s).`

🎉 Done. From now on, every hour, new Lose It report emails land in your Inbox folder automatically.

### 9d. Check it's working

- In **Gmail**, Lose It report emails now show the label **health-sync-saved**.
- In **Google Drive → Health Sync → Inbox**, you'll see files with the date at the front, like `2026-10-14 0702 Lose It!.pdf`.
- Open Health Sync, and it imports them.

### 9e. If it saves nothing

1. Open a Lose It report email in Gmail and check **who it's from**. It should be `donotreply@loseit.com`.
2. Check that the email **has the PDF attached**. The script only saves attachments, not links.
3. If the sender is different, open your script and find the line near the top that starts with `const SEARCH =`. Add the new sender inside the brackets with `OR`, like this:
   ```js
   const SEARCH = 'from:(donotreply@loseit.com OR garmin.com OR reports@example.com) has:attachment newer_than:30d -label:health-sync-saved';
   ```
4. Save, choose **`saveHealthReports`** in the function dropdown, and click **▶ Run** to try again right away.

**To turn it off:** choose **`stop`** in the function dropdown and click **▶ Run**.

> The script only looks at emails from the **last 30 days**, so the first run won't dig up years of old mail.

---

## Step 10 — Get workouts within the hour from Strava

**What this does:** Garmin already sends your workouts to Strava automatically. With this step, the script from Step 9 also asks **Strava** for new workouts **every hour** and saves them to your Inbox. Your workouts then show up in Health Sync, and tick the **Movement** box, within about an hour instead of a day.

- The same workout arriving from both Garmin and Strava is **only counted once**. If you later import Garmin's Activities CSV, Garmin's copy replaces Strava's.
- You need **Step 9 done first**, and Garmin → Strava syncing turned on.

### 10a. Register Health Sync with Strava (5 min)

1. Go to **https://www.strava.com/settings/api** and sign in to Strava.
2. Fill in the form:
   - **Application Name:** `Health Sync`
   - **Category:** `Data Importer`
   - **Club:** leave empty
   - **Website:** your app address, `https://YOUR-USERNAME.github.io/health-sync/`
   - **Application Description:** `Personal health dashboard` (anything is fine)
   - **Authorization Callback Domain:** type exactly `localhost`
3. Tick the box to agree to Strava's API agreement, then click **Create**.
4. If Strava asks for an **app icon**, upload any small picture. It's only shown to you.
5. You'll now see **Client ID** (a number) and **Client Secret** (click **Show**). Keep this page open.

> 🔒 The **Client Secret** is like a password. Only paste it into your script's private settings (next step). Never put it in GitHub or anywhere else.

### 10b. Paste the new script

1. Open your project at **https://script.google.com** (**Health Sync email saver**).
2. Click in the code, press **Cmd+A** / **Ctrl+A**, and press **Delete**.
3. Paste in the new **`email-to-drive.gs`** (the version with "Strava" in it). Click **💾 Save**.

### 10c. Add your Strava keys (privately)

1. In the script's left sidebar, click **⚙️ Project Settings**.
2. Scroll down to **Script Properties** and click **Add script property**. Add two properties:

   | Property | Value |
   |---|---|
   | `STRAVA_CLIENT_ID` | the **Client ID** number from Strava |
   | `STRAVA_CLIENT_SECRET` | the **Client Secret** from Strava |

3. Click **Save script properties**.

> Script Properties are private to you, unlike the code itself.

### 10d. Connect your Strava account

1. Click **< > Editor** in the left sidebar to get back to the code.
2. In the function dropdown at the top, choose **`stravaLink`** and click **▶ Run**.
   - If Google asks for permission again, allow it the same way as in Step 9c. It now also needs permission to "connect to an external service", which is Strava.
3. The **Execution log** at the bottom prints a long link starting with `https://www.strava.com/oauth/authorize…`. Select the whole link, copy it, paste it into a new browser tab, and press Enter.
4. Strava asks you to authorize **Health Sync**. Make sure **"View data about your private activities"** is ticked, then click **Authorize**.
5. Your browser goes to a page that **doesn't load** ("This site can't be reached" / "localhost refused to connect"). **That's expected.**
   - **Copy the whole web address** from the address bar. It looks like `http://localhost/?state=&code=abc123…&scope=read,activity:read_all`.
6. Back in the script, open **⚙️ Project Settings → Script Properties → Edit script properties → Add script property**:
   - **Property:** `STRAVA_CODE`
   - **Value:** paste the address you copied
   - Click **Save script properties**.
7. Go back to **< > Editor**, choose **`stravaConnect`** and click **▶ Run** **within about 5 minutes**. The code from Strava doesn't last long.
   - The log says **"Connected to Strava as *your name*. Now run setup."**
   - Error instead? Repeat from step 2 of this section to get a fresh code.
8. Choose **`setup`** and click **▶ Run**. This switches the hourly timer to the new version.
   - The first run brings in your last **30 days** of Strava workouts.

### 10e. Check it's working

- In **Google Drive → Health Sync → Inbox**, you'll see a file like `2026-10-15 1300 strava.json`. A new one appears only when there are new workouts.
- Open Health Sync. Your workouts appear with a **Strava** tag, and the **Movement** box ticks itself.
- In the script, **☰ Executions** shows a run every hour. The log says `Strava: saved 1 new activity.` or `Strava: nothing new.`

### 10f. Bring in your whole Strava history (one time)

The hourly check only goes back 30 days the first time. To bring in **everything** you've ever logged on Strava:

1. In the script, choose **`stravaBackfill`** in the function dropdown and click **▶ Run**.
2. The log says something like `Strava history: saved 842 activities (2019-03-02 to 2026-10-15) in 2 file(s).`
3. Open Health Sync. It imports the history files from your Inbox. Big histories can take a few seconds.

**Good to know:**

- Run it **once**. Running it again is harmless, because nothing gets doubled, but it isn't needed. The hourly check keeps everything current from then on.
- Strava only gives **calories** one workout at a time, so past workouts only get calories for rides. For calories on every past workout, also import Garmin's **Activities CSV** (Step 9). Garmin's copy fills in the details, and nothing is doubled.

**To disconnect Strava:** in **Script Properties**, delete `STRAVA_REFRESH`. You can also remove Health Sync under **strava.com → Settings → My Apps**.

---

## Step 11 — Steps, sleep, heart rate, weight and nutrition from Apple Health

**What this does:** Garmin Connect (steps, sleep, heart rate), your **Withings** scale (weight, body fat) and Lose It (nutrition) all write into **Apple Health** on your iPhone. **Health Auto Export** copies that into your Google Drive every hour, and Health Sync reads it.

### 11a. Health Auto Export (fully automatic)

Once set up, this runs on its own in the background. You never export anything by hand.

1. Install **Health Auto Export – JSON+CSV** from the App Store and open it. When asked for Health access, tap **Turn On All** → **Allow**.
2. Buy the **Premium** upgrade. Automations need it.
3. Do **11b** below, so Garmin's data reaches Apple Health.
4. Choose where Health Auto Export sends the data:
   - **Try Google Drive first (11a-1).** It's the simplest, but it may hit the same Files-app glitch.
   - **If that doesn't connect, use your Google script (11a-2).** It doesn't involve the Files app at all.

**The automation settings are the same for both.** Go to **Automations** → **+** (New Automation). Names may differ slightly between versions.

| Setting | Choose |
|---|---|
| Data type | **Health Metrics** |
| Metrics | **Step Count, Sleep Analysis, Resting Heart Rate, Active Energy, Flights Climbed, Dietary Energy, Protein, Carbohydrates, Total Fat**, plus **Weight & Body Mass** and **Body Fat Percentage** (from your Withings scale), and **Heart Rate Variability, Water, VO2 Max, Mindful Minutes** if you like |
| Export format | **JSON** |
| Aggregation / Time grouping | **Day**. This one really matters. With **Minutes** or **Hours**, Health Auto Export lumps your iPhone's and Garmin's steps into the same buckets and adds them together (e.g. 14,922 instead of 11,442). Health Sync ignores steps, active calories and flights from those files and says so in the Import tab. |
| Date range | **Last 7 Days** (or "since last sync"). Days are replaced, never doubled. |
| Sync cadence | **Every hour** (or every few hours) |

#### 11a-1. Destination: Google Drive

- **Automation type:** **Google Drive**. Sign in with your **personal Gmail**, apply the settings above, and turn it **on**.
- Health Auto Export saves into **its own folder** in your Drive, usually called **Health Auto Export**. Google only lets it write to folders it created, so you can't pick the Inbox. **That's fine:** Health Sync automatically checks that folder too, imports new or updated files, and leaves them in place.
- Run it once (**Manual Sync** / **Sync Now**) with the app open for about 30 seconds, then check that folder in Drive for a new file.
- **Nothing appearing?**
  - Set the date range to **Last 7 Days**, not "since last sync", for the first run.
  - Make sure at least one metric is ticked.
  - Turn on **iPhone Settings → General → Background App Refresh → Health Auto Export**.
  - Low Power Mode pauses background syncs.

#### 11a-2. Destination: your Google script (REST API)

**First, let the script receive data (one time, about 5 minutes, on your computer):**

1. At **script.google.com**, open **Health Sync email saver**. Replace all the code with the new **`email-to-drive.gs`** (v1.9 or later) and click **💾 Save**.
2. Click **Deploy** (blue, top right) → **New deployment**.
3. Click the **⚙ gear** next to "Select type" → **Web app**.
4. Fill in:
   - **Description:** `Health Sync receiver`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**. This lets your phone send data without signing in. The private key in the next step keeps everyone else out.
5. Click **Deploy**. If Google asks for permission, allow it the same way as in Step 9c.
6. Back in the editor, choose **`healthAddress`** in the function dropdown and click **▶ Run**.
   - The log prints your address. It looks like `https://script.google.com/macros/s/…/exec?key=…`.
   - **Copy the whole line.** If your Mac and iPhone use the same Apple ID, you can copy it on the Mac and paste it on the iPhone. Otherwise, email it to yourself.
7. **Optional check:** paste the address into a browser. It should say **"Health Sync is listening"**.

**Then, in Health Auto Export:**

1. **Automations → +** → Automation type **REST API**.
2. **URL:** paste the whole address from step 6, including `?key=…`.
3. **Method:** **POST**, if asked. Leave headers empty.
4. Apply the settings in the table above, and turn it **on**.
5. Tap **Sync now** / **Manual sync** once. Within a few seconds, a file like `2026-10-16 101500 apple-health.json` appears in your Drive **Inbox**. Open Health Sync and it imports it.

> **Keep the key private.** Anyone with the full address could send data into your Inbox, though they still couldn't read anything. To change the key: in **Project Settings → Script Properties**, delete `HEALTH_KEY`, run **healthAddress** again, and paste the new address into Health Auto Export.

> **When you paste a newer version of the script later:** go to **Deploy → Manage deployments** → **✏️ edit** → **Version: New version** → **Deploy**. This keeps the same address and switches it to the new code.

> **Free, manual alternative:** without Premium, you can export by hand (**Export → CSV**, then put the ZIP in your Drive **Inbox**). The app reads the daily summary file inside it.

---

### 11b. Let Garmin Connect and Withings write to Apple Health

**Withings:** in the **Withings** app → **Profile** (bottom right) → **Settings** (gear) → **Health** (or **Apps & services**) → **Apple Health** → turn on sharing for **Weight**, **Body Fat** and anything else you'd like. Weigh-ins then flow into Apple Health and, from there, into Health Sync's weight chart and the Coach.

**Garmin Connect:**

1. Open the **Garmin Connect** app → tap **More** (☰, bottom right) → **Settings** → **Connected Apps** → **Apple Health**.
2. Turn on sharing, and allow everything you want: steps, sleep, weight, heart rate and so on.
3. Check on the iPhone side: **Settings → Apps → Health → Data Access & Devices → Garmin Connect** → **Turn On All**. (On older iOS: **Settings → Health → Data Access & Devices**.)

---

## Step 12 — Weekly Coach reviews by Claude

**What this does:** every Monday from noon (once Sunday's Lose It report is in), when Health Sync is open, Claude writes a review of the week just finished (Mon–Sun). It also emails you a copy. The review includes:

- a **letter grade** and why you got it
- a short **narrative** of the week
- **went well / fell short / what's working / what isn't**
- a **nutrition mix** check, with **swaps that fit your plan**
- up to 3 things to **focus** on next week

You can also ask for a review of **any dates** at any time (**Coach › Review now**), with an optional question such as "How am I doing on sodium?".

**Cost:** Claude is paid for through Anthropic's API, separately from any Claude.ai subscription.
- A weekly review costs about **10–15¢**, so roughly **$6–8 a year**.
- On-demand reviews cost about the same for a week, and up to about $1 for a whole year.
- **More swap ideas** costs about 2¢.

**Privacy:** to write a review, a summary of that period's data (your food log, nutrients, steps, sleep, workouts, anchors, mood notes and your plan) is sent to Anthropic's API. Your API key is stored in your Google Drive data file, never on GitHub, and is left out of backups.

### 12a. Get an Anthropic API key (5 minutes)

1. Go to **https://console.anthropic.com** and sign up. Your personal Gmail is fine.
2. Open **Billing** (or **Plans & billing**) and add credit. **$10** covers more than a year of weekly reviews.
3. Open **API Keys** → **Create Key**, name it `Health Sync`, and **copy the key** (it starts with `sk-ant-`).
   - It's only shown once. If you lose it, create a new one.

### 12b. Turn on the Coach

1. In Health Sync, open **Settings › Coach**.
2. Paste the key into **Anthropic API key**.
3. Click **Save coach settings**.

4. **Track your balance:** in **Settings › Coach › Usage and balance**:
   - Type the credit you bought (e.g. `20`) under **Bought credit** and click **Add credit**.
   - If you turned on **auto-reload** in the console, tick **Auto-reload is on in my console**, enter its numbers (e.g. when below **$5**, add **$20**), and click **Save coach settings**. The estimate then adds each automatic top-up itself, so you never need to enter them.

That's it. Health Sync writes the reviews for every week since **September 7** in the background, oldest first. That takes a few minutes. After that it writes one each Monday at noon. Only the newest week's review is emailed.

### 12c. Turn on the Monday email (5 minutes)

The email comes from your own Google script, so it needs the script's v2.0 code:

1. At **script.google.com**, open **Health Sync email saver**. Replace all the code with **`email-to-drive.gs`** (v2.0) and click **💾 Save**.
2. Choose **`emailTest`** in the function dropdown and click **▶ Run**.
   - Google asks for permission again, this time to **send email as you**. Allow it.
   - Check that you received a test email.
3. Turn the script into a receiver (a "web app"):
   - **First time** (Manage deployments says *"This project has not been deployed yet"*): click **Deploy → New deployment**, click the **⚙ gear** next to "Select type" → **Web app**, set **Execute as: Me** and **Who has access: Anyone**, then click **Deploy**. Allow permissions if asked.
   - **Already deployed before:** click **Deploy → Manage deployments → ✏️ (edit) → Version: New version → Deploy**. This puts the new code live at the same address.
4. Choose **`healthAddress`** and click **▶ Run**, then copy the full address from the log (it ends in `?key=…`).
5. In Health Sync, open **Settings › Coach**, paste it into **Script address**, make sure **Email me each weekly review** is ticked, and click **Save coach settings**.

### Usage and balance

Anthropic doesn't let an API key read the account balance, so Health Sync tracks it itself. Every call to Claude returns its exact token counts, and the app prices them and keeps a log.

- **Coach tab (top):** *Est. balance $19.62 · 48¢ this month · auto-reload +$20 below $5*. With auto-reload off, it turns red with a reminder when the balance drops under **$2**.
- **Each review:** shows what it cost, including any regenerations and More swap ideas.
- **Settings › Coach › Usage and balance:** estimated balance, this month, all time, number of calls, and a **Recent calls** list with tokens and cost for each.
- **If the estimate ever differs** from the balance on console.anthropic.com (e.g. after using the key elsewhere), type the console's number under **Console shows** and click **Set balance**.

### 12d. Your plan and targets

**Settings › Coach** also holds what the Coach judges your food against. It's pre-filled from your plan, and you can edit it any time:

- **Your daily food plan:** 2–3 Kate Farms shakes, plus 1 bag of salad, plus 8–12 oz of cooked protein.
- **Plan foods:** your shakes, salad kits and proteins, with their nutrition. One per line: name | per | cal | protein | fat | sat fat | carbs | fiber | sugar | sodium. Swaps come from this list first.
- **Nutrition targets:** fiber at least 25 g, sodium under 2,300 mg, saturated fat under 10% of calories, sugars under 50 g.

---

## Step 13 — Everything from Garmin, straight from Garmin

**What this does:** your Google script reads **all** of your Garmin Connect data directly from Garmin every hour, and loads your **whole Garmin history** in the background. It saves everything, complete, in **Google Drive › Health Sync › Garmin**:

- **Every day:** steps, calories, Body Battery (with the full curve), stress (with the full curve), HRV and HRV status, sleep (stages, score, sleep need, naps), resting and all-day heart rate, Pulse Ox, respiration, intensity minutes, floors, hydration, weigh-ins and body composition, fitness age, and any food logged in Garmin.
- **Every workout:** the summary, full detail (training effect, training load, heart rate zones, laps and splits, power, cadence…), the workout's steps, and the **original file from your watch**.
- **Your profile:** settings, heart rate zones and weight goals.

What it doesn't include: Garmin doesn't offer **training readiness, training status or VO2 max** through this API.

> In this version (2.12) the app shows Garmin's **status** under Import › Data health. Showing the data itself on the dashboard, day pages and in the Coach comes in the next version, built on your real Garmin files.

You need **Step 9 done first** (the script).

### 13a. Create your Garmin key (2 min)

1. Sign in at **https://connect.garmin.com** on a computer.
2. Open the **Personal API Key** page. It's linked from **https://developer.garmin.com/gc-developer-program/personal/personal-api/** ("Go to the Personal API Key page").
3. Click **Create Key**, read and accept the terms, and choose an expiration: **one year** is the longest.
4. Click **Create**. The key is shown **only once**: copy it right away, and write down the **expiry date** it shows.
5. Click **Done**.

> 🔒 The key is like a password. Only paste it into your script's private settings (next step). Never put it in GitHub, in the app, or in a chat.

### 13b. Paste the new script

1. Open your project at **https://script.google.com** (**Health Sync email saver**).
2. Click in the code, press **Cmd+A** / **Ctrl+A**, and press **Delete**.
3. Paste in the new **`email-to-drive.gs`** (v2.12). Click **💾 Save**.

### 13c. Add your key (privately)

1. In the script's left sidebar, click **⚙️ Project Settings**.
2. Scroll down to **Script Properties**, click **Edit script properties → Add script property**, and add two:

   | Property | Value |
   |---|---|
   | `GARMIN_KEY` | the key you copied |
   | `GARMIN_KEY_EXPIRES` | the expiry date, written like `2027-10-26` (year-month-day) |

3. Click **Save script properties**.

### 13d. Check it works

1. Click **< > Editor**. In the function dropdown, choose **`garminCheck`** and click **▶ Run**.
   - If Google asks for permission again, allow it the same way as before.
2. The **Execution log** should show:
   - **Sign-in: OK**
   - one line per kind of Garmin data, mostly **200**. A **404** only means Garmin doesn't offer that for your account; the script then stops asking.
   - **Saved *yesterday's date*** to Health Sync › Garmin › days.
3. Choose **`setup`** and click **▶ Run**. This restarts the hourly timer with the new version.

**That's it.** Every hour, the script re-reads the last 3 days (sleep and late watch syncs land after the fact) and any new workouts. It then spends 2 minutes loading your history, newest first, until it reaches your first day on Garmin. Import › Data health shows how far back it has got.

- **Faster history:** run **`garminHistoryNow`** as often as you like; each run loads about 5 minutes' worth.
- **Don't need all of it?** Add a script property `GARMIN_HISTORY_FROM` with the earliest date you want, like `2024-01-01`.
- **Garmin busy?** If Garmin asks the script to slow down, it pauses for an hour and carries on. Nothing is lost, and that doesn't send you an alert.

### 13e. When the key expires

- **30 days before** the date in `GARMIN_KEY_EXPIRES`, Data health turns **amber** and the script emails you a reminder once a week. Garmin also emails you about a week before.
- **To renew (2 minutes):** create a new key (13a), then in **Script Properties** replace `GARMIN_KEY` and `GARMIN_KEY_EXPIRES` with the new ones. Nothing else changes, and nothing is lost.
- **If it does expire,** Data health turns **red** and says so. Everything resumes when you add the new key.
