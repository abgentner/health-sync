# Health Sync

> **Version 2.2** · October 19, 2026 · [Version history](#version-history)

**Health Sync is a free, private health app that runs in your web browser.** It brings your **workouts, steps, food, weight, sleep and feelings** together in one place.

- It reads the files you export from **Lose It!** and **Garmin Connect**.
- It lets you write down how you feel each day.
- It saves everything to **your own Google Drive**, so every computer you use shows the same data.

There's nothing to install and nothing to pay for. You open a web link, and that's the app.

---

## Contents

1. [How it works (the simple version)](#1-how-it-works-the-simple-version)
2. [What you need before you start](#2-what-you-need-before-you-start)
3. [Step 1 — Get a personal Google (Gmail) account](#step-1--get-a-personal-google-gmail-account)
4. [Step 2 — Make a GitHub account](#step-2--make-a-github-account)
5. [Step 3 — Put the app on GitHub](#step-3--put-the-app-on-github)
6. [Step 4 — Turn the app into a website](#step-4--turn-the-app-into-a-website)
7. [Step 5 — Register the app with Google](#step-5--register-the-app-with-google)
8. [Step 6 — Give the app its Google key](#step-6--give-the-app-its-google-key)
9. [Step 7 — Open the app for the first time](#step-7--open-the-app-for-the-first-time)
10. [Step 8 — Make it easy to open (desktop shortcut or app icon)](#step-8--make-it-easy-to-open)
11. [Step 9 — Get your data out of Lose It and Garmin](#step-9--get-your-data-out-of-lose-it-and-garmin)
12. [Step 10 (optional) — Send Lose It emails straight to Google Drive](#step-10-optional--send-lose-it-emails-straight-to-google-drive)
13. [Step 11 (optional) — Bring in your whole Garmin history](#step-11-optional--bring-in-your-whole-garmin-history)
14. [Step 12 (optional) — Get workouts within the hour from Strava](#step-12-optional--get-workouts-within-the-hour-from-strava)
15. [Step 13 (optional) — Steps, sleep, heart rate and more from Apple Health (iPhone)](#step-13-optional--steps-sleep-heart-rate-and-more-from-apple-health-iphone)
16. [Step 14 (optional) — Weekly Coach reviews by Claude](#step-14-optional--weekly-coach-reviews-by-claude)
17. [Using the app every day](#using-the-app-every-day)
18. [What each screen does](#what-each-screen-does)
19. [Signing in: what to expect](#signing-in-what-to-expect)
20. [Updating the app](#updating-the-app)
21. [Backups](#backups)
22. [Troubleshooting](#troubleshooting)
23. [Privacy: who can see what](#privacy-who-can-see-what)
24. [FAQ](#faq)
25. [Version history](#version-history)

---

## 1. How it works (the simple version)

There are three pieces:

| Piece | Think of it as… | What it holds |
|---|---|---|
| **GitHub** | The building the app lives in | The app itself: two files, `index.html` and `config.js`. **No health data, ever.** |
| **Google Drive** | Your filing cabinet | All your health data, in a folder called **Health Sync** |
| **Your browser** (Brave, Chrome, Safari…) | The window you look through | Shows the app and moves data between the app and your Drive |

You put your Lose It and Garmin files in a Drive folder called **Inbox**. When you open the app, it reads those files, adds them to your history, and moves them to a folder called **Processed**.

**Setup takes about 45 minutes, one time only.** After that, you just open a link.

---

## 2. What you need before you start

- [ ] A computer with internet
- [ ] The app files, **`index.html`** and **`config.js`**, saved somewhere easy to find, such as your Desktop. There's also **`email-to-drive.gs`**, which is only needed for the optional Step 10.
- [ ] A **personal** Google account (Gmail). Step 1 covers this.
- [ ] About 45 minutes

> 💡 **Tip:** Keep this README open in one browser tab and do the steps in another tab.

> ✏️ **Throughout this guide, `YOUR-USERNAME` means your GitHub username**, which you'll create in Step 2. Wherever you see it, type your own username instead.

---

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
2. Drag in **`index.html`**, **`config.js`**, **`email-to-drive.gs`** and **`README.md`** (this guide). Or click **choose your files** and pick them.
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

## Step 9 — Get your data out of Lose It and Garmin

**Every file goes in the same place: Google Drive → Health Sync → Inbox.** The app works out what kind of file each one is.

### Lose It → the daily report (CSV spreadsheet or PDF)

Lose It's emailed **daily report** comes as a spreadsheet (`.csv`), and the app reads it automatically once Step 10 is set up. It picks up:

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
- **For your whole past history** of steps, sleep and resting heart rate, do Garmin's one-time full export (see [Step 11](#step-11-optional--bring-in-your-whole-garmin-history)).

Garmin's single-measure reports also work, if you want them: in Garmin Connect, go to **Reports** (or **Health Stats**) → **Steps**, **Weight** or **Sleep**, pick a date range, and click **Export**.

### The easiest everyday routine

| How often | What to drop in the Inbox | What it brings in |
|---|---|---|
| Every day (automatic with Step 10) | Lose It **daily report** (CSV) | Food, calories, all nutrients |
| Whenever you close Lose It or Garmin Connect (automatic with Step 13) | Apple Health file from the iPhone shortcut | Steps, sleep, weight, resting heart rate, HRV, active calories and more |
| Every hour (automatic with Step 12) | Strava workouts | Workouts: type, time, distance, calories, heart rate |
| Every week or two (optional with Step 12) | Garmin **Activities CSV** | Workouts, with Garmin's full details |
| Once, at the start | Garmin **full export ZIP** (Step 11) | Your entire history of steps, sleep and resting heart rate |

---

## Step 10 (optional) — Send Lose It emails straight to Google Drive

**What this does:** a small script runs in your own Google account. **Every hour**, it looks in your Gmail for new emails from **Lose It** (`donotreply@loseit.com`) or **Garmin** that have a **PDF, CSV or ZIP** attached, and saves those files into **Health Sync → Inbox**. You never have to move a file by hand again.

- It's free, and it runs on Google's computers even when yours is off.
- Your emails are **not** changed or deleted. Each email gets a Gmail label called **health-sync-saved**, so it's never copied twice.

### 10a. Make sure Lose It emails your personal Gmail

The script can only see the Gmail account it's set up in, so **Lose It's emails must arrive in the same personal Gmail you use for Health Sync**.

- If Lose It emails a **different address** (for example a school or work address), do one of these:
  - change your email address in Lose It's settings to your personal Gmail, **or**
  - in that other email account, set up **automatic forwarding** of Lose It emails to your personal Gmail.

### 10b. Create the script

1. Go to **https://script.google.com** and sign in with your **personal Gmail**.
2. Click **New project** (top left).
3. Click **Untitled project** at the top and rename it `Health Sync email saver`. Click **Rename**.
4. You'll see some code that starts with `function myFunction()`. Click in the code, press **Cmd+A** (Mac) or **Ctrl+A** (Windows) to select all of it, and press **Delete**.
5. Open the file **`email-to-drive.gs`** in any text editor (TextEdit on a Mac, Notepad on Windows), or open it on your GitHub page.
   - Select all of its text and copy it (**Cmd+C** / **Ctrl+C**).
6. Go back to the script page and paste (**Cmd+V** / **Ctrl+V**).
7. Click the **💾 Save** icon, or press **Cmd+S** / **Ctrl+S**.

### 10c. Turn it on

1. At the top of the code, there's a toolbar with a dropdown that shows a function name. Choose **`setup`**.
2. Click **▶ Run**.
3. A box says **"Authorization required"**. Click **Review permissions**.
4. Choose your **personal Gmail**.
5. Google says **"Google hasn't verified this app."** That's expected, because this is your own script.
   - Click **Advanced** → **Go to Health Sync email saver (unsafe)**.
6. Tick **Select all**, or tick each box, so the script can read your Gmail and add files to your Drive. Then click **Continue** (or **Allow**).
7. At the bottom, the **Execution log** shows something like `Saved 1 attachment(s) from 1 email(s).`

🎉 Done. From now on, every hour, new Lose It report emails land in your Inbox folder automatically.

### 10d. Check it's working

- In **Gmail**, Lose It report emails now show the label **health-sync-saved**.
- In **Google Drive → Health Sync → Inbox**, you'll see files with the date at the front, like `2026-10-14 0702 Lose It!.pdf`.
- Open Health Sync, and it imports them.

### 10e. If it saves nothing

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

## Step 11 (optional) — Bring in your whole Garmin history

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

## Step 12 (optional) — Get workouts within the hour from Strava

**What this does:** Garmin already sends your workouts to Strava automatically. With this step, the script from Step 10 also asks **Strava** for new workouts **every hour** and saves them to your Inbox. Your workouts then show up in Health Sync, and tick the **Movement** box, within about an hour instead of a day.

- The same workout arriving from both Garmin and Strava is **only counted once**. If you later import Garmin's Activities CSV, Garmin's copy replaces Strava's.
- You need **Step 10 done first**, and Garmin → Strava syncing turned on.

### 12a. Register Health Sync with Strava (5 min)

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

### 12b. Paste the new script

1. Open your project at **https://script.google.com** (**Health Sync email saver**).
2. Click in the code, press **Cmd+A** / **Ctrl+A**, and press **Delete**.
3. Paste in the new **`email-to-drive.gs`** (the version with "Strava" in it). Click **💾 Save**.

### 12c. Add your Strava keys (privately)

1. In the script's left sidebar, click **⚙️ Project Settings**.
2. Scroll down to **Script Properties** and click **Add script property**. Add two properties:

   | Property | Value |
   |---|---|
   | `STRAVA_CLIENT_ID` | the **Client ID** number from Strava |
   | `STRAVA_CLIENT_SECRET` | the **Client Secret** from Strava |

3. Click **Save script properties**.

> Script Properties are private to you, unlike the code itself.

### 12d. Connect your Strava account

1. Click **< > Editor** in the left sidebar to get back to the code.
2. In the function dropdown at the top, choose **`stravaLink`** and click **▶ Run**.
   - If Google asks for permission again, allow it the same way as in Step 10c. It now also needs permission to "connect to an external service", which is Strava.
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

### 12e. Check it's working

- In **Google Drive → Health Sync → Inbox**, you'll see a file like `2026-10-15 1300 strava.json`. A new one appears only when there are new workouts.
- Open Health Sync. Your workouts appear with a **Strava** tag, and the **Movement** box ticks itself.
- In the script, **☰ Executions** shows a run every hour. The log says `Strava: saved 1 new activity.` or `Strava: nothing new.`

### 12f. Bring in your whole Strava history (one time)

The hourly check only goes back 30 days the first time. To bring in **everything** you've ever logged on Strava:

1. In the script, choose **`stravaBackfill`** in the function dropdown and click **▶ Run**.
2. The log says something like `Strava history: saved 842 activities (2019-03-02 to 2026-10-15) in 2 file(s).`
3. Open Health Sync. It imports the history files from your Inbox. Big histories can take a few seconds.

**Good to know:**

- Run it **once**. Running it again is harmless, because nothing gets doubled, but it isn't needed. The hourly check keeps everything current from then on.
- Strava only gives **calories** one workout at a time, so past workouts only get calories for rides. For calories on every past workout, also import Garmin's **Activities CSV** (Step 9). Garmin's copy fills in the details, and nothing is doubled.

**To disconnect Strava:** in **Script Properties**, delete `STRAVA_REFRESH`. You can also remove Health Sync under **strava.com → Settings → My Apps**.

---

## Step 13 (optional) — Steps, sleep, heart rate and more from Apple Health (iPhone)

**What this does:** Garmin Connect copies your steps, sleep, heart rate and more into **Apple Health** on your iPhone. Something on the iPhone then copies that data into your Drive **Inbox**, and Health Sync imports it. There are two ways to do the copying:

- **Option 1 — Health Auto Export app** *(recommended)*. A paid app that does it all in the background and uses Apple Health's own daily totals, so nothing is double-counted. It connects to Google Drive by itself. Set up in **13-1** below, then do **13a**.
- **Option 2 — a free iPhone Shortcut** you build yourself (**13a–13f**). It needs the Google Drive location working in the iPhone **Files** app, which doesn't work on every phone.

### 13-1. Option 1: Health Auto Export (fully automatic)

Once set up, this runs on its own in the background. You never export anything by hand.

1. Install **Health Auto Export – JSON+CSV** from the App Store and open it. When asked for Health access, tap **Turn On All** → **Allow**.
2. Buy the **Premium** upgrade. Automations need it.
3. Do **13a** below, so Garmin's data reaches Apple Health.
4. Choose where Health Auto Export sends the data:
   - **Try Google Drive first (13-1a).** It's the simplest, but it may hit the same Files-app glitch.
   - **If that doesn't connect, use your Google script (13-1b).** It doesn't involve the Files app at all.

**The automation settings are the same for both.** Go to **Automations** → **+** (New Automation). Names may differ slightly between versions.

| Setting | Choose |
|---|---|
| Data type | **Health Metrics** |
| Metrics | **Step Count, Sleep Analysis, Resting Heart Rate, Active Energy, Flights Climbed, Dietary Energy, Protein, Carbohydrates, Total Fat**, plus **Weight & Body Mass, Heart Rate Variability, Water, VO2 Max, Body Fat Percentage, Mindful Minutes** if you like |
| Export format | **JSON** |
| Aggregation / Time grouping | **Day**. This one really matters. With **Minutes** or **Hours**, Health Auto Export lumps your iPhone's and Garmin's steps into the same buckets and adds them together (e.g. 14,922 instead of 11,442). Health Sync ignores steps, active calories and flights from those files and says so in the Import tab. |
| Date range | **Last 7 Days** (or "since last sync"). Days are replaced, never doubled. |
| Sync cadence | **Every hour** (or every few hours) |

#### 13-1a. Destination: Google Drive

- **Automation type:** **Google Drive**. Sign in with your **personal Gmail**, apply the settings above, and turn it **on**.
- Health Auto Export saves into **its own folder** in your Drive, usually called **Health Auto Export**. Google only lets it write to folders it created, so you can't pick the Inbox. **That's fine:** Health Sync automatically checks that folder too, imports new or updated files, and leaves them in place.
- Run it once (**Manual Sync** / **Sync Now**) with the app open for about 30 seconds, then check that folder in Drive for a new file.
- **Nothing appearing?**
  - Set the date range to **Last 7 Days**, not "since last sync", for the first run.
  - Make sure at least one metric is ticked.
  - Turn on **iPhone Settings → General → Background App Refresh → Health Auto Export**.
  - Low Power Mode pauses background syncs.

#### 13-1b. Destination: your Google script (REST API)

**First, let the script receive data (one time, about 5 minutes, on your computer):**

1. At **script.google.com**, open **Health Sync email saver**. Replace all the code with the new **`email-to-drive.gs`** (v1.9 or later) and click **💾 Save**.
2. Click **Deploy** (blue, top right) → **New deployment**.
3. Click the **⚙ gear** next to "Select type" → **Web app**.
4. Fill in:
   - **Description:** `Health Sync receiver`
   - **Execute as:** **Me**
   - **Who has access:** **Anyone**. This lets your phone send data without signing in. The private key in the next step keeps everyone else out.
5. Click **Deploy**. If Google asks for permission, allow it the same way as in Step 10c.
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

### Option 2: a free Shortcut

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

---

## Step 14 (optional) — Weekly Coach reviews by Claude

**What this does:** every Monday, the first time you open Health Sync, Claude writes a review of the week just finished (Mon–Sun). It also emails you a copy. The review includes:

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

### 14a. Get an Anthropic API key (5 minutes)

1. Go to **https://console.anthropic.com** and sign up. Your personal Gmail is fine.
2. Open **Billing** (or **Plans & billing**) and add credit. **$10** covers more than a year of weekly reviews.
3. Open **API Keys** → **Create Key**, name it `Health Sync`, and **copy the key** (it starts with `sk-ant-`).
   - It's only shown once. If you lose it, create a new one.

### 14b. Turn on the Coach

1. In Health Sync, open **Settings › Coach**.
2. Paste the key into **Anthropic API key**.
3. Click **Save coach settings**.

4. **Track your balance:** in **Settings › Coach › Usage and balance**:
   - Type the credit you bought (e.g. `20`) under **Bought credit** and click **Add credit**.
   - If you turned on **auto-reload** in the console, tick **Auto-reload is on in my console**, enter its numbers (e.g. when below **$5**, add **$20**), and click **Save coach settings**. The estimate then adds each automatic top-up itself, so you never need to enter them.

That's it. Health Sync writes the reviews for every week since **September 7** in the background, oldest first. That takes a few minutes. After that it writes one each Monday. Only the newest week's review is emailed.

### 14c. Turn on the Monday email (5 minutes)

The email comes from your own Google script, so it needs the script's v2.0 code:

1. At **script.google.com**, open **Health Sync email saver**. Replace all the code with **`email-to-drive.gs`** (v2.0) and click **💾 Save**.
2. Choose **`emailTest`** in the function dropdown and click **▶ Run**.
   - Google asks for permission again, this time to **send email as you**. Allow it.
   - Check that you received a test email.
3. Click **Deploy** → **Manage deployments** → **✏️ (edit)** → **Version: New version** → **Deploy**. This puts the new code live at the same address.
4. Choose **`healthAddress`** and click **▶ Run**, then copy the full address from the log (it ends in `?key=…`).
5. In Health Sync, open **Settings › Coach**, paste it into **Script address**, make sure **Email me each weekly review** is ticked, and click **Save coach settings**.

### Usage and balance

Anthropic doesn't let an API key read the account balance, so Health Sync tracks it itself. Every call to Claude returns its exact token counts, and the app prices them and keeps a log.

- **Coach tab (top):** *Est. balance $19.62 · 48¢ this month · auto-reload +$20 below $5*. With auto-reload off, it turns red with a reminder when the balance drops under **$2**.
- **Each review:** shows what it cost, including any regenerations and More swap ideas.
- **Settings › Coach › Usage and balance:** estimated balance, this month, all time, number of calls, and a **Recent calls** list with tokens and cost for each.
- **If the estimate ever differs** from the balance on console.anthropic.com (e.g. after using the key elsewhere), type the console's number under **Console shows** and click **Set balance**.

### 14d. Your plan and targets

**Settings › Coach** also holds what the Coach judges your food against. It's pre-filled from your plan, and you can edit it any time:

- **Your daily food plan:** 2–3 Kate Farms shakes, plus 1 bag of salad, plus 8–12 oz of cooked protein.
- **Plan foods:** your shakes, salad kits and proteins, with their nutrition. One per line: name | per | cal | protein | fat | sat fat | carbs | fiber | sugar | sodium. Swaps come from this list first.
- **Nutrition targets:** fiber at least 25 g, sodium under 2,300 mg, saturated fat under 10% of calories, sugars under 50 g.

---

## Using the app every day

1. **Drop new files in the Inbox** whenever you like, from your phone or any computer.
2. **Open the app.** It automatically checks the Inbox and imports anything new.
   - If the app was already open when you added files, click **Sync** at the top right.
3. **Log how you feel** in the **Log today** tab:
   1. Tap a face for your **mood**, and numbers for **energy** and **stress**.
   2. Type your **sleep** hours, if you know them.
   3. Add **tags**: short feeling words separated by commas, like `tired, motivated, sore`. Your most-used tags appear as buttons; tap one to add it.
   4. Write **notes** about your day, if you want.
   5. Click **Save day**.
4. **Look at the Dashboard** to see your averages, charts and mood words.

**Adding the same file twice is safe.** Nothing gets counted twice:

- A newer Lose It report for a day **replaces** that day's Lose It food.
- Garmin workouts are matched by date and start time.

**If two sources have different numbers:**

- Steps, weight and sleep from **Garmin files** win over the copies in Lose It.
- Anything you **type in by hand** is never overwritten by Lose It.

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

Reviews written by Claude (set up in [Step 14](#step-14-optional--weekly-coach-reviews-by-claude)).

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
| **First time on a new computer** | Click **Connect Google Drive** and sign in (Step 7). |
| **You reopen the app within about an hour** | It opens straight to your dashboard. No click needed. |
| **You reopen it later than that** | Click **Connect Google Drive**. The Google window usually opens and closes by itself, because the app remembers your account. |
| **The app stays open longer than an hour** | Nothing visible happens. The next time you click **Sync**, **Save day** or **Check Inbox now**, a Google window flashes for a second and the action goes through. Nothing is lost. |
| **About once a week** | Google asks you to **approve the app again**: pick your account, tick the Drive box, click **Continue**. This happens because the app is in "Testing" mode. It takes about 10 seconds, all inside the app's sign-in window. **You never need to go back to the Google Cloud pages.** |

---

## Updating the app

If you get a new version of `index.html` (or any other file):

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
| **Google Cloud asks you to pay or start a free trial** | You don't need it. Close or ignore the banner and use the direct link in Step 5a. If you're signed in with a **school or work account**, switch to your **personal Gmail**, ideally in a private/incognito window. |
| **"No Google Client ID is set yet"** | Step 6 isn't done, or GitHub hasn't finished updating. Wait 2–5 minutes and press **Cmd+Shift+R** / **Ctrl+Shift+R**. Check that `config.js` on GitHub has your Client ID between the quotes. |
| **"Error 400: origin_mismatch"** or **"redirect_uri_mismatch"** | The address in Step 5e is wrong. It must be exactly `https://YOUR-USERNAME.github.io`, with nothing after `.io`. Fix it under **Clients → Health Sync web** → **Save**, wait 5 minutes, and try again. |
| **"Access blocked: Health Sync has not completed the Google verification process"** | You aren't on the test-user list, or you signed in with a different account. Redo Step 5d with the exact Gmail you're signing in with. |
| **Clicking Connect does nothing** | Your browser blocked the pop-up. Allow pop-ups for the site. Brave users: see [Brave users: allow the sign-in pop-up](#brave-users-allow-the-sign-in-pop-up). |
| **"Google Drive access was not allowed"** | On the Google permission screen, you have to **tick the Drive box** before clicking Continue. Click Connect again. |
| **"The sign-in window was closed"** | You closed the Google window before finishing. Click Connect again. |
| **A file stays in the Inbox** | The app couldn't use it. Open the **Import** tab to see why. It's often the wrong Garmin file; see Step 9. |
| **"Skipped (this is Garmin's Progress Summary…)"** or **"…monthly Activities report…"** | Wrong Garmin file. Use the **Activities list → Export CSV** (Step 9). |
| **Numbers look doubled** | Lose It sometimes copies Garmin workouts. The app skips Lose It entries with "Garmin" in the name, so this shouldn't happen. If it does, delete the extra entry in **Log today** (the **×** button). |
| **Changes I uploaded to GitHub don't show** | Wait 2–5 minutes, then press **Cmd+Shift+R** / **Ctrl+Shift+R**. Check the dot on your GitHub page (see [Updating the app](#updating-the-app)). |
| **I double-clicked `index.html` on my computer and Connect doesn't work** | Google sign-in only works from the web address, so use `https://YOUR-USERNAME.github.io/health-sync/`. (Opening the file directly only allows "this computer only" mode, with no syncing.) |
| **"Strava sign-in failed (400)" when running stravaConnect** | The code expired or was already used. Run **stravaLink** again, authorize again, paste the new address into `STRAVA_CODE`, and run **stravaConnect** right away. |
| **"Strava sign-in failed (401)"** | The Client ID or Client Secret in Script Properties is wrong. Copy them again from strava.com/settings/api. Watch out for extra spaces. |
| **Strava workouts don't appear** | Check that the workout is on Strava (Garmin → Strava sync). Check the script's **Executions** for errors. New workouts arrive within about an hour. |
| **Coach says "the API key was rejected"** | Copy the key again from console.anthropic.com › API Keys (or create a new one), paste it in **Settings › Coach**, and save. |
| **Coach says "out of credit"** | Add credit at console.anthropic.com › Billing. |
| **No Monday email** | Run **emailTest** in the script (Step 14c), make sure you made a **New version** deployment, and check that **Script address** in Settings › Coach ends in `?key=…`. |
| **Lose It emails aren't showing up in the Inbox** | See [Step 10e](#10e-if-it-saves-nothing). Also check that the emails arrive in the **same personal Gmail** the script is set up in. |
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

## Version history

Every release has one version number, shared by all its files. To check you're using the same files:

| File | Where to see its version |
|---|---|
| **App** (`index.html`) | At the bottom of every page, and **Settings → About** |
| **Script** (`email-to-drive.gs`) | Line 3 of the code, and the first line of the Execution log each time it runs |
| **README** (`README.md`) | At the very top |
| **Your copies** | The Desktop folder name, like **Health Sync v2.2** |

`config.js` has no version. It only holds your Client ID and never changes, so don't re-upload it.

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

