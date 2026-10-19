# Health Sync: continuing on another computer

## For you

- **The app:** https://abgentner.github.io/health-sync/ Sign in with the same Google account. All your data is in Google Drive, so everything shows up there.
- **Setup instructions (readable anywhere):** https://github.com/abgentner/health-sync/blob/main/SETUP.md
  - Step 12 covers the Coach: getting the API key, adding credit and the email deployment.
- **Everyday use:** https://github.com/abgentner/health-sync/blob/main/README.md
- **Installing it as an app on the home computer:** SETUP Step 8.

### Still to do
1. Get an Anthropic API key and paste it into the app under **Settings › Coach** (SETUP Step 12).
2. Add $20 of credit with auto-reload: +$20 when the balance drops below $5.
3. In the Google script, go to **Deploy → New deployment → Web app**. Then run `healthAddress` and paste the address it gives you into **Settings › Coach** to get emailed copies of reviews.

## For Claude (paste this into a new session)

You're picking up work on **Health Sync**, my personal health app. The current version is **v2.9**.

- **Hosting:** a single-file vanilla-JS app (`index.html`) on GitHub Pages, repo `abgentner/health-sync` (public).
  - The GitHub repo has the latest `index.html`, `email-to-drive.gs`, README, SETUP, ALTERNATIVES and CHANGELOG. Start from those.
  - The GitHub copy of `config.js` holds my Google Client ID. **Never ask me to upload `config.js`.**
- **Data:** stored in my Google Drive folder **Health Sync**, which contains `Inbox`, `Processed`, `Plan`, `health-data.json` and `health-sync-status.json`.
- **Google Apps Script** (`email-to-drive.gs`, run hourly):
  - saves the Lose It report emails (from donotreply@loseit.com) to the Inbox
  - syncs Strava (Garmin → Strava)
  - writes the data-health status file and sends alert emails
  - its `doPost` receives data and sends the Coach emails
- **Apple Health:** arrives through Health Auto Export Premium writing to Drive, with Aggregation = **Day**. Withings weight comes in through Apple Health.
- **Coach:** weekly Mon–Sun reviews by `claude-opus-5-5`, called from the browser. The API key lives in my Drive data, never on GitHub.
  - Tone: matter-of-fact, a letter grade with reasons, no flattery.
  - Nutrition swaps must stay within my plan: 2–3 Kate Farms shakes, 1 bag of salad, 8–12 oz cooked protein.
- **Daily anchors:** 3 boxes, weekly goal 17 of 21. The Day Pack box is a daytime calorie budget (≤1,200).
- **Versioning:** MAJOR.MINOR.PATCH.
  - Fixes are 2.9.1 and up, bundled together.
  - Features are 2.10 and up.
  - 3.0 is reserved for a big architecture change (the plan is moving the importers into the Apps Script).
  - The script has its own version and only goes up when its code changes.
  - Every release bumps `APP_VERSION` and the README/CHANGELOG, and gets its own folder named "Health Sync vX.Y".
- **Next up:**
  - 2.10: monthly, quarterly and yearly Coach reviews, on strict calendar periods, built from the weekly reviews.
  - 3.0: server-side imports.
- **Tests:** the regression tests (71 checks) and their fixtures contain my real health data. They live only on my work Mac, never on GitHub.
- **How I like to work:** I'm non-technical. Give me ELI5, click-by-click steps, and make everything fully automatic; never propose manual routines.
