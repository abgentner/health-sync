# Health Sync

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
15. [Using the app every day](#using-the-app-every-day)
16. [What each screen does](#what-each-screen-does)
17. [Signing in: what to expect](#signing-in-what-to-expect)
18. [Updating the app](#updating-the-app)
19. [Backups](#backups)
20. [Troubleshooting](#troubleshooting)
21. [Privacy: who can see what](#privacy-who-can-see-what)
22. [FAQ](#faq)

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

### Lose It → the Daily Report PDF

The app reads Lose It's **Daily Report** PDF. It picks up:

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
| Every day (automatic with Step 10) | Lose It **Daily Report PDF** | Food, calories, macros, steps, sleep |
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

**To disconnect Strava:** in **Script Properties**, delete `STRAVA_REFRESH`. You can also remove Health Sync under **strava.com → Settings → My Apps**.

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
- **Tabs along the top:** Dashboard · **Plan** · Log today · History · Import · Settings.
- **Daily anchors** (top of the Trends card): this week's habit boxes, for example **12 of 21 · goal 17**.
  - A bar of 21 boxes fills in as you go. The dashed boxes after the goal are your **weekly buffer** for real life.
  - Next to it, a little grid shows how many boxes you got each day (Mon–Sun).
  - Under it, a message tells you how many more you need and how many days are left.
  - The **Daily anchors per week** chart shows each week's total against a dashed **goal line**. The current week is shown lighter, because it isn't finished yet.
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
| **Day Pack** | Your Lose It log has **at least 3 foods** containing "kate farms", "naked whey" or "shake" |
| **Dinner Boundary** | Your Lose It **Dinner** adds up to **750 calories or less** |
| **Movement** | You have **at least 10 minutes** of workouts that day (from Garmin, Lose It or typed in) |

**Overriding a box:**

- Each box in **Log today** says why it's checked or not, for example *"Auto · 32 min of exercise"*.
- **Click a box to override it.** For example, tick Dinner Boundary if you stuck to the one-plate rule but Lose It didn't log dinner. It then says **"Set by hand"**. Click **Save day**.
- To go back to automatic, click **use imported data** on that box, or click the box back to whatever the data says.
- Boxes fill in as your files arrive, so yesterday's boxes may tick themselves the next morning, when the Lose It report comes in.

**Changing the boxes:** in **Settings → Daily anchors**, you can rename each box, change its reminder, change how it's checked, and change the weekly goal. How it's checked can be:

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

A table with one row per day. Click a row to open that day on the Dashboard.

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
5. Wait **2–5 minutes**. Then open the app and press **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows) to load the new version.

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

**Can I use it on more than one computer?**
Yes, that's the point. Open the same address, connect the same Google account, and you'll see the same data.

**What if I stop using Lose It or Garmin?**
Your history stays in your Drive. You can keep logging feelings, weight, food and workouts by hand in **Log today**.

**Can I move my data somewhere else later?**
Yes. **Settings → Download backup** gives you everything in one file, and the daily summary CSV opens in any spreadsheet.

**Do I ever have to go back to the Google Cloud pages?**
No. That was one-time setup. The weekly re-approval happens inside the app's own sign-in window.
