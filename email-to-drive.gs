/**
 * Health Sync — automatic imports into Google Drive.
 * Version 2.12.1
 *
 * Every hour this:
 *  1. looks in your Gmail for new emails from Lose It or Garmin that have a
 *     PDF, CSV or ZIP attached, and saves the attachments, and
 *  2. if you've connected Strava, saves any new Strava activities,
 * into Google Drive › Health Sync › Inbox, and
 *  3. if you've added a Garmin key, reads all your Garmin Connect data straight from Garmin
 *     into Google Drive › Health Sync › Garmin (and loads your Garmin history in the background).
 *
 * It can also RECEIVE Apple Health data sent from your iPhone (Health Auto Export's
 * REST API automation, or a Shortcut) once deployed as a web app — see doPost below —
 * and EMAIL you the Coach's weekly review when the Health Sync app asks it to. The Health Sync app imports them the
 * next time you open it.
 *
 * Each email is labelled "health-sync-saved" in Gmail once its attachments
 * are saved, so nothing is copied twice. Your emails are not changed or deleted.
 *
 * Your Strava and Garmin keys are kept in this project's Script Properties (only you can
 * see them), never in this code.
 *
 * Setup: see SETUP.md, Step 9 (emails), Step 10 (Strava), Step 12c (Coach email) and Step 13 (Garmin).
 */

// Which emails to look for. Lose It sends its reports from donotreply@loseit.com.
// To add another sender, put it inside the brackets with OR, e.g. 'from:(donotreply@loseit.com OR garmin.com OR reports@example.com)'.
const SEARCH = 'from:(donotreply@loseit.com OR garmin.com) has:attachment newer_than:30d -label:health-sync-saved';

const SCRIPT_VERSION = '2.12.1';   // printed at the start of every run
const LABEL = 'health-sync-saved';
const FOLDER_PATH = ['Health Sync', 'Inbox'];
const FILE_TYPES = /\.(pdf|csv|zip)$/i;

// Strava: how far back the first sync goes, and how far back each hourly check looks
// (a few days, so activities that reach Strava late are still picked up).
const STRAVA_FIRST_DAYS = 30;
const STRAVA_LOOKBACK_DAYS = 3;

/** Run this once (and again after pasting a new version). Turns on the hourly check. */
function setup() {
  ScriptApp.getProjectTriggers()
    .filter(t => ['saveHealthReports', 'hourly'].includes(t.getHandlerFunction()))
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('hourly').timeBased().everyHours(1).create();
  hourly();
}

/** What the hourly timer runs. */
function hourly() {
  console.log('Health Sync script v' + SCRIPT_VERSION);
  const errors = {};
  try { saveHealthReports(); } catch (e) { errors.email = String(e.message || e); console.error(e); }
  try { syncStrava(); } catch (e) { errors.strava = String(e.message || e); console.error(e); }
  try { syncGarmin(); } catch (e) { errors.garmin = String(e.message || e); console.error(e); }
  try { checkSources_(errors); } catch (e) { console.error(e); }
  if (errors.email || errors.strava || errors.garmin) throw new Error(Object.values(errors).join(' | '));   // still shows as Failed in Executions
}

/** Turns the hourly check off. */
function stop() {
  ScriptApp.getProjectTriggers()
    .filter(t => ['saveHealthReports', 'hourly'].includes(t.getHandlerFunction()))
    .forEach(t => ScriptApp.deleteTrigger(t));
}

/* ======================= Email attachments ======================= */

/** Saves attachments from matching emails into Health Sync › Inbox. */
function saveHealthReports() {
  const folder = inboxFolder_();
  const label = GmailApp.getUserLabelByName(LABEL) || GmailApp.createLabel(LABEL);
  const threads = GmailApp.search(SEARCH, 0, 50);
  let saved = 0;
  threads.forEach(thread => {
    thread.getMessages().forEach(msg => {
      const stamp = Utilities.formatDate(msg.getDate(), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmm');
      msg.getAttachments({ includeInlineImages: false }).forEach(att => {
        if (!FILE_TYPES.test(att.getName())) return;
        folder.createFile(att.copyBlob()).setName(`${stamp} ${att.getName()}`);
        saved++;
        if (/loseit/i.test(msg.getFrom())) props_().setProperty('LAST_LOSEIT', String(msg.getDate().getTime()));
      });
    });
    thread.addLabel(label);
  });
  console.log(`Email: saved ${saved} attachment(s) from ${threads.length} email(s).`);
}

/* ============================ Strava ============================= */

const props_ = () => PropertiesService.getScriptProperties();

/** Step 1: prints the link you open to let this script read your Strava activities. */
function stravaLink() {
  const id = (props_().getProperty('STRAVA_CLIENT_ID') || '').trim();
  if (!id) throw new Error('Add STRAVA_CLIENT_ID in Project Settings › Script Properties first (SETUP.md Step 10).');
  const url = 'https://www.strava.com/oauth/authorize?client_id=' + encodeURIComponent(id) +
    '&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all';
  console.log('Copy this link into your browser, click Authorize, then copy the whole address of the page you land on:\n\n' + url);
}

/** Step 2: after adding STRAVA_CODE, run this to finish connecting. */
function stravaConnect() {
  const p = props_();
  let code = (p.getProperty('STRAVA_CODE') || '').trim();
  if (/strava\.com\/oauth\/authorize/.test(code)) throw new Error('STRAVA_CODE has the stravaLink address in it. Open that link, click Authorize, and paste the address of the page you land on next (it starts with http://localhost/?state=&code=).');
  const m = code.match(/[?&]code=([^&]+)/);   // the whole address can be pasted
  if (m) code = m[1];
  if (!code) {
    if (p.getProperty('STRAVA_REFRESH')) { console.log('Already connected to Strava. Nothing to do: run setup or stravaBackfill.'); return; }
    throw new Error('Add STRAVA_CODE in Script Properties first (SETUP.md Step 10).');
  }
  let t;
  try {
    t = stravaToken_({ grant_type: 'authorization_code', code });
  } catch (e) {
    if (!/AuthorizationCode/.test(e.message)) throw e;
    const already = p.getProperty('STRAVA_REFRESH');
    p.deleteProperty('STRAVA_CODE');
    throw new Error(already
      ? 'That code was old or already used, but you ARE already connected to Strava. STRAVA_CODE has been removed; just run stravaBackfill (or nothing).'
      : 'Strava says that code is expired or already used. Run stravaLink again, click Authorize, paste the new address into STRAVA_CODE, and run stravaConnect straight away (codes last only a few minutes).');
  }
  p.deleteProperty('STRAVA_CODE');
  p.deleteProperty('STRAVA_SEEN');
  console.log('Connected to Strava' + (t.athlete && t.athlete.firstname ? ' as ' + t.athlete.firstname : '') + '. Now run setup.');
}

/** Troubleshooting: checks your Strava settings and says what looks wrong (never shows your secret). */
function stravaCheck() {
  console.log('Health Sync script v' + SCRIPT_VERSION);
  const p = props_();
  const id = (p.getProperty('STRAVA_CLIENT_ID') || '').trim();
  const sec = (p.getProperty('STRAVA_CLIENT_SECRET') || '').trim();
  const raw = (p.getProperty('STRAVA_CODE') || '').trim();
  const m = raw.match(/[?&]code=([^&]+)/);
  console.log([
    'STRAVA_CLIENT_ID: ' + (!id ? 'MISSING' : /^\d+$/.test(id) ? id + ' (looks right; should match the Client ID on strava.com/settings/api)' : 'should be just a number — check it'),
    'STRAVA_CLIENT_SECRET: ' + (!sec ? 'MISSING' : sec.length + ' characters' + (/^[0-9a-f]{40}$/.test(sec) ? ' (looks right)' : ' (usually 40 letters/numbers — copy it again)')),
    'STRAVA_CODE: ' + (!raw ? 'not set'
      : /strava\.com\/oauth\/authorize/.test(raw) ? 'WRONG — this is the stravaLink address. Paste the address of the page you land on AFTER clicking Authorize.'
      : m ? 'an address with a code in it (' + m[1].length + ' characters) — looks right' + (/activity:read_all/.test(raw) ? '' : ', BUT "View data about your private activities" may not have been ticked')
      : raw.length === 40 ? 'a 40-character value — fine if it is the code from the address you landed on after Authorize, WRONG if it is the Access Token from Strava\'s settings page (safest: paste the whole address)'
      : 'a ' + raw.length + '-character value'),
    'Already connected: ' + (p.getProperty('STRAVA_REFRESH') ? 'YES — you do not need stravaConnect' : 'no'),
  ].join('\n'));
}

/** Saves new Strava activities into Health Sync › Inbox. Does nothing if Strava isn't connected. */
function syncStrava() {
  const token = stravaAccess_();
  if (!token) return;
  const p = props_();
  const seen = JSON.parse(p.getProperty('STRAVA_SEEN') || '[]');
  const days = seen.length ? STRAVA_LOOKBACK_DAYS : STRAVA_FIRST_DAYS;
  const after = Math.floor(Date.now() / 1000) - days * 86400;
  let list = [], page = 1, batch;
  do {
    batch = stravaGet_(`athlete/activities?per_page=100&page=${page}&after=${after}`, token);
    list = list.concat(batch);
    page++;
  } while (batch.length === 100 && page <= 5);
  const fresh = list.filter(a => !seen.includes(a.id));
  if (!fresh.length) { console.log('Strava: nothing new.'); return; }
  const activities = fresh.map(a => {
    let calories = null;
    try { calories = stravaGet_('activities/' + a.id, token).calories; } catch (e) {}   // calories are only in the detailed view
    return slim_(a, calories);
  });
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmm');
  inboxFolder_().createFile(`${stamp} strava.json`, JSON.stringify({ source: 'strava', activities }), 'application/json');
  p.setProperty('STRAVA_SEEN', JSON.stringify(seen.concat(fresh.map(a => a.id)).slice(-300)));
  p.setProperty('STRAVA_LAST_NEW', new Date().toISOString());
  console.log(`Strava: saved ${activities.length} new activit${activities.length === 1 ? 'y' : 'ies'}.`);
}

/**
 * One-time: saves your WHOLE Strava history into Health Sync › Inbox (in files of 500 activities).
 * Run it once after stravaConnect. The hourly check keeps things up to date after that.
 * Calories: Strava only lists them per activity, so history uses the ride energy figure where there is one;
 * import Garmin's Activities CSV as well if you want calories for every past workout.
 */
function stravaBackfill() {
  const token = stravaAccess_();
  if (!token) throw new Error('Connect Strava first: run stravaLink, then stravaConnect (SETUP.md Step 10d).');
  const p = props_();
  let all = [], page = 1, batch;
  do {
    batch = stravaGet_(`athlete/activities?per_page=200&page=${page}`, token);
    all = all.concat(batch);
    page++;
  } while (batch.length === 200 && page <= 50);
  if (!all.length) { console.log('Strava history: no activities found.'); return; }
  all.sort((a, b) => Date.parse(a.start_date) - Date.parse(b.start_date));
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmm');
  const folder = inboxFolder_();
  const files = Math.ceil(all.length / 500);
  for (let i = 0; i < files; i++) {
    const chunk = all.slice(i * 500, (i + 1) * 500).map(a => slim_(a, a.kilojoules ? Math.round(a.kilojoules) : null));
    folder.createFile(`${stamp} strava-history-${i + 1}-of-${files}.json`, JSON.stringify({ source: 'strava', activities: chunk }), 'application/json');
  }
  const seen = JSON.parse(p.getProperty('STRAVA_SEEN') || '[]');
  p.setProperty('STRAVA_SEEN', JSON.stringify([...new Set(seen.concat(all.map(a => a.id)))].slice(-300)));
  const first = all[0].start_date_local.slice(0, 10), last = all[all.length - 1].start_date_local.slice(0, 10);
  console.log(`Strava history: saved ${all.length} activities (${first} to ${last}) in ${files} file(s).`);
}

function slim_(a, calories) {
  return {
    id: a.id, name: a.name, sport_type: a.sport_type || a.type,
    start_date_local: a.start_date_local, moving_time: a.moving_time, elapsed_time: a.elapsed_time,
    distance: a.distance, average_heartrate: a.average_heartrate, max_heartrate: a.max_heartrate, calories,
  };
}

function stravaToken_(params) {
  const p = props_();
  const res = UrlFetchApp.fetch('https://www.strava.com/oauth/token', {
    method: 'post', muteHttpExceptions: true,
    payload: Object.assign({
      client_id: (p.getProperty('STRAVA_CLIENT_ID') || '').trim(),
      client_secret: (p.getProperty('STRAVA_CLIENT_SECRET') || '').trim(),
    }, params),
  });
  if (res.getResponseCode() !== 200) throw new Error('Strava sign-in failed (' + res.getResponseCode() + '): ' + res.getContentText());
  const j = JSON.parse(res.getContentText());
  p.setProperties({ STRAVA_ACCESS: j.access_token, STRAVA_REFRESH: j.refresh_token, STRAVA_EXPIRES: String(j.expires_at) });
  return j;
}

function stravaAccess_() {
  const p = props_();
  if (!p.getProperty('STRAVA_REFRESH')) return null;
  if (Number(p.getProperty('STRAVA_EXPIRES')) - 300 > Date.now() / 1000) return p.getProperty('STRAVA_ACCESS');
  return stravaToken_({ grant_type: 'refresh_token', refresh_token: p.getProperty('STRAVA_REFRESH') }).access_token;
}

function stravaGet_(path, token) {
  const res = UrlFetchApp.fetch('https://www.strava.com/api/v3/' + path, { headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) throw new Error('Strava ' + path + ' failed (' + res.getResponseCode() + '): ' + res.getContentText().slice(0, 200));
  return JSON.parse(res.getContentText());
}

/* ============================ Garmin ============================= */
// Reads everything the Garmin Connect Personal API offers, straight from Garmin, and keeps it in
// Google Drive › Health Sync › Garmin:
//   days/<year>/garmin-<date>.json             everything Garmin has for that day (complete, as Garmin sends it)
//   activities/<year>/garmin-activity-<date>-<id>.json   each workout: summary, full detail, laps/splits, workout steps
//   fit/<year>/garmin-<date>-<id>.zip          each workout's original file from your watch
//   profile.json                               your settings, heart rate zones and weight goals
// Every hour it re-reads the last few days (sleep and late watch syncs land after the fact) and new workouts,
// then spends a couple of minutes loading your history, newest first, until it reaches your first Garmin data.
//
// Your key lives only in this project's Script Properties: GARMIN_KEY, plus GARMIN_KEY_EXPIRES (the date it
// expires, like 2027-10-26) so you get a reminder before it stops working. Setup: SETUP.md Step 13.

const GARMIN_API = 'https://personal.connectapi.garmin.com';
// Garmin doesn't publish its limits, so the script stays gentle: a few requests at a time, with pauses,
// a fixed allowance per hour for history, and longer pauses each time Garmin says "slow down".
const GARMIN_RECENT_DAYS = 3;          // today and the 2 days before it are re-read every hour
const GARMIN_CHUNK_DAYS = 7;           // history goes back a week at a time (about 75 requests)
const GARMIN_PARALLEL = 4;             // requests in flight at once
const GARMIN_GAP_MS = 750;             // pause between groups of requests
const GARMIN_HISTORY_REQUESTS = 160;   // requests each hourly run may spend on history (a year of days takes about a day)
const GARMIN_HISTORY_SECONDS = 120;    // and at most this long (Google allows 90 minutes of runs a day in all)
const GARMIN_EMPTY_DAYS_TO_STOP = 120; // history is complete after this many empty days in a row, once past your oldest workout
const GARMIN_PAGE = 20;                // workouts per page of Garmin's list
const GARMIN_KEY_WARN_DAYS = 30;       // start reminding you this many days before the key expires
const GARMIN_WATCH_LATE_HOURS = 24;    // email you if your watch hasn't synced to Garmin Connect for this long

// Endpoints that take a date range. split() turns Garmin's reply into [date, value] pairs.
const byField_ = f => j => (Array.isArray(j) ? j : []).map(x => [garminDate_(x[f]), x]);
const GARMIN_RANGE = [
  { key: 'dailySummary', path: (a, b) => `/usersummary-service/v2/dailysummaries?startDate=${a}&endDate=${b}`, split: j => byField_('calendarDate')(j && j.data) },
  { key: 'steps', path: (a, b) => `/usersummary-service/stats/steps/daily/${a}/${b}`, split: byField_('calendarDate') },
  { key: 'stress', path: (a, b) => `/usersummary-service/stats/stress/daily/${a}/${b}`, split: byField_('calendarDate') },
  { key: 'hydration', path: (a, b) => `/usersummary-service/stats/hydration/daily/${a}/${b}`, split: byField_('calendarDate') },
  { key: 'sleep', path: (a, b) => `/sleep-service/sleep/dailySleepSummariesByDate?startDate=${a}&endDate=${b}`, split: byField_('calendarDate') },
  { key: 'hrv', path: (a, b) => `/hrv-service/hrv/daily/${a}/${b}`, split: j => byField_('calendarDate')(j && j.hrvSummaries) },
  { key: 'bodyBattery', path: (a, b) => `/wellness-service/wellness/bodyBattery/reports/daily?startDate=${a}&endDate=${b}`, split: byField_('date') },
  { key: 'weighIns', list: true, path: (a, b) => `/weight-service/weight/all/${a}/${b}`, split: j => (Array.isArray(j) ? j : []).map(x => [garminDate_(x.calendarDate || x.date), x]) },
  { key: 'weightDay', path: (a, b) => `/weight-service/weight/range/${a}/${b}?includeAll=true`, split: j => byField_('summaryDate')(j && j.dailyWeightSummaries) },
  { key: 'wellnessActivities', list: true, path: (a, b) => `/wellnessactivity-service/activity/summary/range/${a}/${b}`, split: j => (Array.isArray(j) ? j : []).map(x => [garminDate_(x.calendarDate || x.startTimestampLocal), x]) },
];
// Endpoints that take one day.
const GARMIN_DAY = [
  { key: 'userSummary', path: d => `/usersummary-service/usersummary/daily?calendarDate=${d}` },
  { key: 'heartRate', path: d => `/wellness-service/wellness/dailyHeartRate?date=${d}` },
  { key: 'pulseOx', path: d => `/wellness-service/wellness/daily/spo2acclimation/${d}` },
  { key: 'hrvReadings', path: d => `/hrv-service/hrv/${d}` },
  { key: 'sleepDetail', path: d => `/sleep-service/sleep/dailySleep?date=${d}` },
  { key: 'nutrition', path: d => `/nutrition-service/food/logs/${d}?includeGoals=true&includeNutrition=true&includeMedia=false` },
  { key: 'fitnessAge', path: d => `/fitnessage-service/fitnessage/v2/${d}` },
  { key: 'menstrualSummary', path: d => `/periodichealth-service/menstrualcycle/summary/${d}` },
  { key: 'menstrualDay', path: d => `/periodichealth-service/menstrualcycle/dayview/${d}?includeAnalysis=true` },
];

/** Run once after adding GARMIN_KEY: checks the key and every kind of Garmin data, and updates Data health in the app. */
function garminCheck() {
  console.log('Health Sync script v' + SCRIPT_VERSION);
  const p = props_(), key = (p.getProperty('GARMIN_KEY') || '').trim(), exp = garminKeyDaysLeft_();
  console.log('GARMIN_KEY: ' + (key ? key.length + ' characters' : 'MISSING: add it in Project Settings › Script Properties (SETUP.md Step 13)'));
  console.log('GARMIN_KEY_EXPIRES: ' + (exp == null ? 'not set (add it, like 2027-10-26, to get a reminder before the key stops working)' : `${p.getProperty('GARMIN_KEY_EXPIRES')} (${exp} days left)`));
  if (!key) return;
  const pause = Number(p.getProperty('GARMIN_PAUSE_UNTIL'));
  if (pause > Date.now()) { console.log(`Garmin asked to slow down earlier, so the script is pausing until ${garminTime_(pause)}. Run garminCheck again after that. Nothing is lost.`); return; }
  p.deleteProperty('GARMIN_TOKEN_EXP');
  garminToken_();
  console.log('Sign-in: OK (reply had ' + p.getProperty('GARMIN_TOKEN_SHAPE') + ')');
  const t = garminToday_(), from = garminAddDays_(t, -13), y = garminAddDays_(t, -1), old = garminAddDays_(t, -120);
  const shape = v => v == null ? 'empty' : Array.isArray(v) ? `list of ${v.length}` : typeof v === 'object' ? `${Object.keys(v).length} fields` : typeof v;
  // Ranges: the last 14 days up to today, to see which days come back (and whether the end date is included).
  const rr = garminGetAll_(GARMIN_RANGE.map(e => e.path(from, t)));
  let endIncluded = null;
  GARMIN_RANGE.forEach((e, i) => {
    const r = rr[i];
    if (r.code >= 300 || r.json == null) { console.log(`${e.key} (${from} to ${t}): ${r.code}${r.text ? ' · ' + r.text.slice(0, 100) : ' · empty'}`); return; }
    const ds = [...new Set(e.split(r.json).map(x => x[0]).filter(Boolean))].sort();
    if (ds.length && ds[ds.length - 1] === t) endIncluded = true;
    console.log(`${e.key} (${from} to ${t}): ${r.code} · ${ds.length} day${ds.length === 1 ? '' : 's'}${ds.length ? ` (${ds[0]} to ${ds[ds.length - 1]})` : ''}`);
  });
  const rs = garminGetAll_(GARMIN_DAY.map(e => e.path(y)));
  GARMIN_DAY.forEach((e, i) => console.log(`${e.key} (${y}): ${rs[i].code} · ${rs[i].code < 300 ? shape(rs[i].json) : rs[i].text.slice(0, 100)}`));
  const u = rs[GARMIN_DAY.findIndex(e => e.key === 'userSummary')].json || {};
  console.log(`Yesterday: ${u.includesWellnessData ? 'Garmin has your data' : 'NO data yet. Open the Garmin Connect app on your phone so the watch syncs, then run garminCheck again'}${u.totalSteps ? ` (${u.totalSteps} steps)` : ''}.`);
  console.log(`Watch last synced: ${u.lastSyncTimestampGMT ? garminTime_(garminParseGmt_(u.lastSyncTimestampGMT)) : 'unknown'}.`);
  const h = garminGetAll_([GARMIN_DAY[0].path(old)])[0];
  console.log(`History: ${h.json && h.json.includesWellnessData ? `Garmin has data for ${old}, so your history can be loaded` : `no data for ${old} (either you weren't wearing it then, or Garmin doesn't offer history on this key)`}.`);
  if (endIncluded) console.log('Date ranges include their end date: OK.');
  const acts = garminGetAll_([`/activitylist-service/activities/search/activities?start=0&limit=5`])[0];
  console.log(`Workouts: ${acts.code} · ${shape(acts.json)}`);
  p.setProperty('GARMIN_LAST_OK', new Date().toISOString());
  if (u.lastSyncTimestampGMT) p.setProperty('GARMIN_WATCH_SYNC', new Date(garminParseGmt_(u.lastSyncTimestampGMT)).toISOString());
  checkSources_({});
  console.log('Done. Data health in the app is updated (click Sync there). The hourly check keeps Garmin up to date and loads your history in the background.');
}

/** Optional: loads Garmin history for about 5 minutes right now, instead of a little each hour. Run it as often as you like. */
function garminHistoryNow() {
  console.log('Health Sync script v' + SCRIPT_VERSION);
  if (Number(props_().getProperty('GARMIN_PAUSE_UNTIL')) > Date.now()) { console.log(`Garmin asked to slow down, so the script is pausing until ${garminTime_(Number(props_().getProperty('GARMIN_PAUSE_UNTIL')))}.`); return; }
  garminHistory_(Date.now(), 300, 3 * GARMIN_HISTORY_REQUESTS);
  console.log(garminHistoryLine_());
}

/** Starts the history load again from the top (for example after Garmin adds new kinds of data). */
function garminRestartHistory() {
  ['GARMIN_HISTORY_TO', 'GARMIN_HISTORY_EMPTY', 'GARMIN_HISTORY_DONE', 'GARMIN_ACT_OFFSET', 'GARMIN_ACT_DONE', 'GARMIN_EARLIEST'].forEach(k => props_().deleteProperty(k));
  console.log('Garmin history will be loaded again, starting with the most recent days.');
}

/** What the hourly check runs. Does nothing until GARMIN_KEY is added. */
function syncGarmin() {
  const p = props_();
  if (!(p.getProperty('GARMIN_KEY') || '').trim()) return;
  const left = garminKeyDaysLeft_();
  if (left != null && left < 0) throw new Error(`Garmin key expired on ${p.getProperty('GARMIN_KEY_EXPIRES')}. Create a new one (SETUP.md Step 13) and paste it into GARMIN_KEY and GARMIN_KEY_EXPIRES.`);
  const pause = Number(p.getProperty('GARMIN_PAUSE_UNTIL'));
  if (pause > Date.now()) { console.log(`Garmin: pausing until ${garminTime_(pause)} (Garmin asked to slow down). Nothing is lost.`); return; }
  const t0 = Date.now(), today = garminToday_();
  const recent = garminSaveDays_(garminAddDays_(today, 1 - GARMIN_RECENT_DAYS), today, true);
  if (recent.watchSync) p.setProperty('GARMIN_WATCH_SYNC', recent.watchSync);
  if (p.getProperty('GARMIN_PROFILE_DAY') !== today) { garminProfile_(); p.setProperty('GARMIN_PROFILE_DAY', today); }
  const fresh = garminRecentActivities_();
  p.setProperty('GARMIN_LAST_OK', new Date().toISOString());
  p.deleteProperty('GARMIN_STRIKES');   // Garmin is happy again: the next pause starts back at an hour
  if (fresh) p.setProperty('GARMIN_LAST_NEW', new Date().toISOString());
  garminHistory_(t0, GARMIN_HISTORY_SECONDS, GARMIN_HISTORY_REQUESTS);
  console.log(`Garmin: up to date${fresh ? ` · ${fresh} new workout${fresh === 1 ? '' : 's'}` : ''} · ${garminHistoryLine_()}`);
}

// History, newest first: workouts page back through Garmin's list, and days go back a week at a time.
// Each run shares a fixed allowance of requests between them, so history never floods Garmin.
function garminHistory_(t0, seconds, allowance) {
  const p = props_(), start = garminRequests_;
  const left = () => seconds * 1000 - (Date.now() - t0) > 30e3 && garminRequests_ - start < allowance;
  const stopAt = (p.getProperty('GARMIN_HISTORY_FROM') || '').trim();   // optional: don't go further back than this date
  while (left() && (p.getProperty('GARMIN_ACT_DONE') !== 'yes' || p.getProperty('GARMIN_HISTORY_DONE') !== 'yes')) {
    if (p.getProperty('GARMIN_ACT_DONE') !== 'yes') {
      const offset = Number(p.getProperty('GARMIN_ACT_OFFSET') || 0);
      const page = garminGetAll_([`/activitylist-service/activities/search/activities?start=${offset}&limit=${GARMIN_PAGE}`])[0];
      if (page.code >= 300) throw new Error(`Garmin workouts list failed (${page.code}): ${page.text.slice(0, 160)}`);
      const list = Array.isArray(page.json) ? page.json : [], index = garminIndex_();
      let done = 0;
      for (const a of list) { if (!index.saved[a.activityId]) { if (!left()) break; garminSaveActivity_(a, true, index); } done++; }
      garminSaveIndex_(index);
      p.setProperty('GARMIN_ACT_OFFSET', String(offset + done));
      if (done === list.length && list.length < GARMIN_PAGE) p.setProperty('GARMIN_ACT_DONE', 'yes');
    }
    if (left() && p.getProperty('GARMIN_HISTORY_DONE') !== 'yes') {
      const to = p.getProperty('GARMIN_HISTORY_TO') || garminAddDays_(garminToday_(), -GARMIN_RECENT_DAYS);
      let from = garminAddDays_(to, 1 - GARMIN_CHUNK_DAYS);
      if (stopAt && from < stopAt) from = stopAt;
      const { found, earliest } = garminSaveDays_(from, to, false);
      const empty = found ? 0 : Number(p.getProperty('GARMIN_HISTORY_EMPTY') || 0) + GARMIN_CHUNK_DAYS;
      const was = p.getProperty('GARMIN_EARLIEST');
      if (earliest && (!was || earliest < was)) p.setProperty('GARMIN_EARLIEST', earliest);
      p.setProperties({ GARMIN_HISTORY_TO: garminAddDays_(from, -1), GARMIN_HISTORY_EMPTY: String(empty) });
      // Done once: a long empty stretch AND past your oldest workout (so a few months off the watch don't end it early),
      // or the GARMIN_HISTORY_FROM date, or before Garmin Connect existed.
      const oldestWorkout = p.getProperty('GARMIN_ACT_DONE') === 'yes' ? garminOldestWorkout_() : null;
      const pastWorkouts = p.getProperty('GARMIN_ACT_DONE') === 'yes' && (!oldestWorkout || from < oldestWorkout);
      if ((empty >= GARMIN_EMPTY_DAYS_TO_STOP && pastWorkouts) || (stopAt && from <= stopAt) || from < '2006-01-01') p.setProperty('GARMIN_HISTORY_DONE', 'yes');
    }
  }
}
function garminOldestWorkout_() {
  const ds = Object.values(garminIndex_().saved).map(x => x.date).filter(Boolean).sort();
  return ds[0] || null;
}
function garminHistoryLine_() {
  const p = props_(), days = p.getProperty('GARMIN_HISTORY_DONE') === 'yes', acts = p.getProperty('GARMIN_ACT_DONE') === 'yes';
  const n = Object.keys(garminIndex_().saved).length;
  return `history: days ${days ? 'complete' : 'loading'}${p.getProperty('GARMIN_EARLIEST') ? ' (back to ' + p.getProperty('GARMIN_EARLIEST') + ')' : ''}, workouts ${acts ? 'complete' : 'loading'} (${n} saved)`;
}

// Reads every kind of daily data for from..to and saves one file per day.
// Returns how many days had data, the earliest of them, and when the watch last synced.
function garminSaveDays_(from, to, keepEmpty) {
  const days = [];
  for (let d = from; d <= to; d = garminAddDays_(d, 1)) days.push(d);
  const now = new Date().toISOString(), off = garminOff_();
  const out = {};
  days.forEach(d => out[d] = { source: 'garmin', version: 1, date: d, fetchedAt: now, scriptVersion: SCRIPT_VERSION, data: {}, status: {} });
  const ranges = GARMIN_RANGE.filter(e => !off[e.key]);
  const rr = garminGetAll_(ranges.map(e => e.path(from, to)));
  ranges.forEach((e, i) => {
    const r = rr[i];
    days.forEach(d => out[d].status[e.key] = r.code);
    if (r.code >= 300 || r.json == null) return;
    for (const [d, v] of e.split(r.json)) if (out[d]) { if (e.list) (out[d].data[e.key] = out[d].data[e.key] || []).push(v); else out[d].data[e.key] = v; }
  });
  const singles = GARMIN_DAY.filter(e => !off[e.key]), pairs = [];
  days.forEach(d => singles.forEach(e => pairs.push([d, e])));
  const codes = {};
  const res = garminGetAll_(pairs.map(([d, e]) => e.path(d)));
  pairs.forEach(([d, e], j) => {
    const r = res[j];
    out[d].status[e.key] = r.code;
    if (r.code < 300 && r.json != null) out[d].data[e.key] = r.json;
  });
  const has = {};
  days.forEach(d => { has[d] = garminHasData_(out[d].data); });
  // A kind of data that's empty or refused on 7+ days that DO have other data isn't offered for your account or
  // watch, so it's skipped for 30 days. (Days you weren't wearing the watch don't count.)
  pairs.forEach(([d, e]) => { if (has[d]) (codes[e.key] = codes[e.key] || []).push(out[d].status[e.key]); });
  for (const [k, cs] of Object.entries(codes)) if (cs.length >= 7 && cs.every(c => c === 204 || (c >= 400 && c < 500 && c !== 401 && c !== 429))) { off[k] = Date.now() + 30 * 864e5; garminSetOff_(off); }
  let found = 0, earliest = null, watchSync = null;
  for (const d of days) {
    if (has[d]) { found++; if (!earliest || d < earliest) earliest = d; }
    const ls = out[d].data.userSummary && out[d].data.userSummary.lastSyncTimestampGMT;
    if (ls) { const iso = new Date(garminParseGmt_(ls)).toISOString(); if (!watchSync || iso > watchSync) watchSync = iso; }
    if (has[d] || keepEmpty) saveJson_(garminFolder_('days', d.slice(0, 4)), `garmin-${d}.json`, out[d]);
  }
  return { found, earliest, watchSync };
}
function garminHasData_(x) {
  const s = x.dailySummary || {}, u = x.userSummary || {};
  return !!(s.includesWellnessData || s.includesActivityData || u.includesWellnessData || u.totalSteps || (x.steps && x.steps.totalSteps) ||
    (x.sleep && x.sleep.sleepTimeSeconds) || (x.weighIns && x.weighIns.length) || (x.hrv && x.hrv.lastNightAvg) || (x.wellnessActivities && x.wellnessActivities.length));
}

function garminProfile_() {
  const t = garminToday_();
  const keys = ['settings', 'heartRateZones', 'weightGoals'];
  const r = garminGetAll_(['/userprofile-service/userprofile/settings', '/biometric-service/heartRateZones/v2', `/goal-service/goal/user/effective/weightgoal/${garminAddDays_(t, -365)}/${garminAddDays_(t, 365)}`]);
  const doc = { source: 'garmin', version: 1, fetchedAt: new Date().toISOString(), data: {}, status: {} };
  keys.forEach((k, i) => { doc.status[k] = r[i].code; if (r[i].code < 300) doc.data[k] = r[i].json; });
  saveJson_(garminFolder_(), 'profile.json', doc);
}

// New and recently changed workouts. Returns how many were new.
function garminRecentActivities_() {
  const t = garminToday_(), index = garminIndex_();
  const r = garminGetAll_([`/activitylist-service/activities/search/activities?startDate=${garminAddDays_(t, 1 - GARMIN_RECENT_DAYS)}&endDate=${t}&start=0&limit=100`])[0];
  if (r.code >= 300) throw new Error(`Garmin workouts list failed (${r.code}): ${r.text.slice(0, 160)}`);
  let fresh = 0;
  for (const a of Array.isArray(r.json) ? r.json : []) { const isNew = !index.saved[a.activityId]; if (isNew) fresh++; garminSaveActivity_(a, isNew, index); }
  garminSaveIndex_(index);
  return fresh;
}
function garminSaveActivity_(a, withFile, index) {
  const id = a.activityId, d = garminDate_(a.startTimeLocal) || garminToday_();
  const [det, wo] = garminGetAll_([`/activity-service/activity/${id}`, `/activity-service/activity/${id}/workouts`]);
  const doc = { source: 'garmin', version: 1, fetchedAt: new Date().toISOString(), activityId: id, date: d, summary: a,
    detail: det.code < 300 ? det.json : null, workouts: wo.code < 300 ? wo.json : null, status: { detail: det.code, workouts: wo.code } };
  if (withFile) {
    garminRequests_++; Utilities.sleep(GARMIN_GAP_MS);
    const f = UrlFetchApp.fetch(GARMIN_API + `/download-service/files/activity/${id}`, { headers: { Authorization: 'Bearer ' + garminToken_() }, muteHttpExceptions: true });
    if (f.getResponseCode() === 429) garminSlowDown_();
    doc.status.file = f.getResponseCode();
    if (f.getResponseCode() < 300) { const name = `garmin-${d}-${id}.zip`; replaceFile_(garminFolder_('fit', d.slice(0, 4)), name, f.getBlob().setName(name)); doc.file = name; }
  } else if (index.saved[id] && index.saved[id].file) doc.file = index.saved[id].file;
  saveJson_(garminFolder_('activities', d.slice(0, 4)), `garmin-activity-${d}-${id}.json`, doc);
  index.saved[id] = { date: d, file: doc.file || null };
}
function garminIndex_() {
  const it = garminFolder_().getFilesByName('activities-index.json');
  try { return it.hasNext() ? JSON.parse(it.next().getBlob().getDataAsString()) : { saved: {} }; } catch (e) { return { saved: {} }; }
}
function garminSaveIndex_(index) { saveJson_(garminFolder_(), 'activities-index.json', index); }

// Sign-in: the key is swapped for an access token that lasts 24 hours.
function garminToken_() {
  const p = props_(), key = (p.getProperty('GARMIN_KEY') || '').trim();
  if (!key) throw new Error('Add GARMIN_KEY in Project Settings › Script Properties first (SETUP.md Step 13).');
  if (Number(p.getProperty('GARMIN_TOKEN_EXP')) - 10 * 60e3 > Date.now() && p.getProperty('GARMIN_TOKEN')) return p.getProperty('GARMIN_TOKEN');
  const res = UrlFetchApp.fetch(GARMIN_API + '/personalapitoken-service/personal-api/personal-api-key/token', { method: 'post', headers: { Authorization: 'ApiKey ' + key }, muteHttpExceptions: true });
  const code = res.getResponseCode(), text = res.getContentText();
  if (code === 401 || code === 403) throw new Error(`Garmin refused the key (${code}). It may have expired or been deleted: create a new one (SETUP.md Step 13) and paste it into GARMIN_KEY.`);
  if (code >= 300) throw new Error(`Garmin sign-in failed (${code}): ${text.slice(0, 160)}`);
  let token = null, ttl = null, shape = 'plain text';
  try {
    const j = JSON.parse(text);
    if (typeof j === 'string') token = j;
    else {
      shape = 'fields: ' + Object.keys(j).join(', ');
      token = j.access_token || j.accessToken || j.token || j.value || null;
      ttl = Number(j.expires_in || j.expiresIn) || null;
      if (!token) token = Object.values(j).find(v => typeof v === 'string' && v.length > 40) || null;
    }
  } catch (e) { token = text.trim(); }
  if (!token) throw new Error('Garmin sign-in worked, but the reply had no token in it (' + shape + '). Send this message to Claude.');
  p.setProperties({ GARMIN_TOKEN: token, GARMIN_TOKEN_EXP: String(Date.now() + (ttl ? ttl * 1000 : 24 * 36e5)), GARMIN_TOKEN_SHAPE: shape });
  return token;
}
// Sends requests GARMIN_PARALLEL at a time with a short pause between groups. Returns [{ code, json, text }] in order.
let garminRequests_ = 0;   // requests sent this run
function garminGetAll_(paths) {
  const out = [];
  for (let i = 0; i < paths.length; i += GARMIN_PARALLEL) {
    const part = paths.slice(i, i + GARMIN_PARALLEL);
    if (garminRequests_) Utilities.sleep(GARMIN_GAP_MS);
    const send = () => { garminRequests_ += part.length; return UrlFetchApp.fetchAll(part.map(path => ({ url: GARMIN_API + path, headers: { Authorization: 'Bearer ' + garminToken_(), Accept: 'application/json' }, muteHttpExceptions: true }))); };
    let res = send();
    if (res.some(r => r.getResponseCode() === 401)) { props_().deleteProperty('GARMIN_TOKEN_EXP'); res = send(); }
    if (res.some(r => r.getResponseCode() === 429)) garminSlowDown_();
    res.forEach(r => {
      const code = r.getResponseCode(), text = code === 204 ? '' : r.getContentText();
      let json = null; try { json = text ? JSON.parse(text) : null; } catch (e) {}
      out.push({ code, json, text });
    });
  }
  return out;
}
// Garmin said "slow down": pause 1 hour, then 2, 4, up to 8 if it keeps happening. A good run resets it.
function garminSlowDown_() {
  const p = props_(), strikes = Number(p.getProperty('GARMIN_STRIKES') || 0), hours = Math.min(8, Math.pow(2, strikes));
  const until = Date.now() + hours * 36e5;
  p.setProperties({ GARMIN_PAUSE_UNTIL: String(until), GARMIN_STRIKES: String(strikes + 1) });
  throw new Error(`Garmin asked to slow down (429). Pausing until ${garminTime_(until)}; nothing is lost.`);
}
const garminTime_ = ms => Utilities.formatDate(new Date(ms), Session.getScriptTimeZone(), "EEE h:mm a");
const garminParseGmt_ = s => Date.parse(/Z|[+-]\d\d:?\d\d$/.test(s) ? s : String(s).replace(' ', 'T') + 'Z');
const garminOff_ = () => { const o = JSON.parse(props_().getProperty('GARMIN_OFF') || '{}'); for (const k of Object.keys(o)) if (o[k] < Date.now()) delete o[k]; return o; };
const garminSetOff_ = o => props_().setProperty('GARMIN_OFF', JSON.stringify(o));
function garminKeyDaysLeft_() {
  const e = (props_().getProperty('GARMIN_KEY_EXPIRES') || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(e)) return null;
  return Math.round((Date.parse(e + 'T00:00:00Z') - Date.parse(garminToday_() + 'T00:00:00Z')) / 864e5);
}
const garminToday_ = () => Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
const garminAddDays_ = (d, n) => { const [y, m, dd] = d.split('-').map(Number); return new Date(Date.UTC(y, m - 1, dd + n)).toISOString().slice(0, 10); };
const garminDate_ = v => { const s = v && typeof v === 'object' ? (v.localDate || v.date || '') : String(v || ''); return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null; };
const garminFolders_ = {};   // found once per run
function garminFolder_(...sub) {
  const k = sub.join('/');
  if (garminFolders_[k]) return garminFolders_[k];
  let f = sub.length ? garminFolder_(...sub.slice(0, -1)) : inboxFolder_().getParents().next();
  const name = sub.length ? sub[sub.length - 1] : 'Garmin', it = f.getFoldersByName(name);
  return garminFolders_[k] = it.hasNext() ? it.next() : f.createFolder(name);
}

/* ================== Receiving Apple Health data ================== */
// Deploy this project as a Web app (SETUP.md Step 11a-2). Your iPhone then sends data to
//   <web app address>?key=<your key>
// and each delivery is saved into Health Sync › Inbox for the app to import.

/** Run once: creates your private key and prints the exact address to give Health Auto Export. */
function healthAddress() {
  const p = props_();
  let key = p.getProperty('HEALTH_KEY');
  if (!key) { key = Utilities.getUuid().replace(/-/g, ''); p.setProperty('HEALTH_KEY', key); }
  let url = '';
  try { url = ScriptApp.getService().getUrl() || ''; } catch (e) {}
  console.log(url
    ? 'Health Sync script v' + SCRIPT_VERSION + '\nGive Health Auto Export this address (copy all of it):\n\n' + url + '?key=' + key
    : 'Your key is: ' + key + '\nDeploy the script as a Web app first (SETUP.md Step 11a-2), then run healthAddress again to get the full address.');
}

function doPost(e) {
  const reply = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
  const key = props_().getProperty('HEALTH_KEY');
  if (!key || !e || !e.parameter || e.parameter.key !== key) return reply({ ok: false, error: 'wrong or missing key' });
  const body = e.postData && e.postData.contents;
  if (!body) return reply({ ok: false, error: 'no data received' });
  // The Health Sync app asking for a review email (sent only to you, the owner of this script).
  let msg = null;
  try { msg = JSON.parse(body); } catch (err) {}
  if (msg && msg.action === 'email') {
    MailApp.sendEmail({ to: Session.getEffectiveUser().getEmail(), subject: String(msg.subject || 'Health Sync review').slice(0, 200), htmlBody: String(msg.html || ''), name: 'Health Sync' });
    return reply({ ok: true, emailed: true });
  }
  const isJson = /^\s*[{[]/.test(body);
  const stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HHmmss');
  inboxFolder_().createFile(`${stamp} apple-health.${isJson ? 'json' : 'txt'}`, body, isJson ? 'application/json' : 'text/plain');
  return reply({ ok: true, saved: body.length });
}

/** Run once after pasting v2.0: lets the script send email, and sends you a test message. */
function emailTest() {
  MailApp.sendEmail({ to: Session.getEffectiveUser().getEmail(), subject: 'Health Sync: test email', htmlBody: '<p>Email from your Health Sync script works. Weekly Coach reviews will arrive like this.</p>', name: 'Health Sync' });
  console.log('Test email sent to ' + Session.getEffectiveUser().getEmail());
}

/** Lets you check the address in a browser: it should say Health Sync is listening. */
function doGet() {
  return ContentService.createTextOutput('Health Sync is listening (script v' + SCRIPT_VERSION + '). Send data with POST.');
}

/* ======================== Data health check ======================== */
// Every hour: note when each source last delivered, save it as Health Sync › health-sync-status.json
// (the app shows it), and email you once a day if something has stopped.
const LATE_HOURS = 36;
function checkSources_(errors) {
  const p = props_(), now = Date.now(), hours = t => t ? Math.round((now - t) / 36e5) : null;
  const loseIt = Number(p.getProperty('LAST_LOSEIT')) || null;
  let hae = null, haeSize = null, haeName = '';
  const it = DriveApp.searchFolders("title contains 'Auto Export' and trashed = false");
  while (it.hasNext()) {
    const walk = (f, depth) => {
      const files = f.getFiles();
      while (files.hasNext()) { const x = files.next(), t = x.getLastUpdated().getTime(); if (!hae || t > hae) { hae = t; haeSize = x.getSize(); haeName = x.getName(); } }
      if (depth < 3) { const subs = f.getFolders(); while (subs.hasNext()) walk(subs.next(), depth + 1); }
    };
    walk(it.next(), 1);
  }
  const status = {
    checkedAt: new Date(now).toISOString(), scriptVersion: SCRIPT_VERSION,
    loseIt: { lastAt: loseIt ? new Date(loseIt).toISOString() : null, hoursAgo: hours(loseIt), error: errors.email || null },
    appleHealth: { lastAt: hae ? new Date(hae).toISOString() : null, hoursAgo: hours(hae), file: haeName, sizeKB: haeSize != null ? Math.round(haeSize / 1024) : null, minuteData: haeSize != null && haeSize > 400 * 1024 },
    strava: { connected: !!p.getProperty('STRAVA_REFRESH'), lastNewAt: p.getProperty('STRAVA_LAST_NEW') || null, error: errors.strava || null },
    garmin: (() => {
      const on = !!(p.getProperty('GARMIN_KEY') || '').trim();
      if (!on) return { connected: false };
      let saved = null; try { saved = Object.keys(garminIndex_().saved).length; } catch (e) {}
      const ws = p.getProperty('GARMIN_WATCH_SYNC') || null, pause = Number(p.getProperty('GARMIN_PAUSE_UNTIL')) || 0;
      return { connected: true, lastOkAt: p.getProperty('GARMIN_LAST_OK') || null, lastNewAt: p.getProperty('GARMIN_LAST_NEW') || null, error: errors.garmin || null,
        watchSyncedAt: ws, watchHoursAgo: ws ? hours(Date.parse(ws)) : null, pausedUntil: pause > now ? new Date(pause).toISOString() : null,
        keyExpires: p.getProperty('GARMIN_KEY_EXPIRES') || null, keyDaysLeft: garminKeyDaysLeft_(),
        history: { daysDone: p.getProperty('GARMIN_HISTORY_DONE') === 'yes', workoutsDone: p.getProperty('GARMIN_ACT_DONE') === 'yes',
          backTo: p.getProperty('GARMIN_EARLIEST') || null, workouts: saved } };
    })(),
  };
  const root = inboxFolder_().getParents().next();
  const old = root.getFilesByName('health-sync-status.json');
  if (old.hasNext()) old.next().setContent(JSON.stringify(status)); else root.createFile('health-sync-status.json', JSON.stringify(status), 'application/json');

  const problems = [];
  if (status.loseIt.lastAt && status.loseIt.hoursAgo > LATE_HOURS) problems.push(['loseit', `No Lose It report email in ${status.loseIt.hoursAgo} hours. Check that Lose It is still emailing daily reports to this Gmail.`]);
  if (status.loseIt.error) problems.push(['email', `Saving Lose It emails failed: ${status.loseIt.error}`]);
  if (status.appleHealth.lastAt && status.appleHealth.hoursAgo > LATE_HOURS) problems.push(['hae', `Health Auto Export hasn't updated in ${status.appleHealth.hoursAgo} hours. Open it on your iPhone and check the automation is on (and Background App Refresh is allowed).`]);
  if (status.appleHealth.minuteData) problems.push(['haemin', `Health Auto Export is sending minute-by-minute data (${status.appleHealth.sizeKB} KB). Steps, active calories and flights are being ignored. Set the automation's Time Grouping back to Day.`]);
  if (status.strava.error) problems.push(['strava', `Strava sync failed: ${status.strava.error}. Run stravaCheck in the script for details.`]);
  const gm = status.garmin;
  if (gm.connected && gm.error && !/slow down/.test(gm.error)) problems.push(['garmin', `Garmin sync failed: ${gm.error} Run garminCheck in the script for details.`]);
  if (gm.connected && gm.watchHoursAgo != null && gm.watchHoursAgo > GARMIN_WATCH_LATE_HOURS) problems.push(['garminwatch', `Your watch hasn't synced to Garmin Connect for ${gm.watchHoursAgo} hours. Open the Garmin Connect app on your phone (with Bluetooth on) so it syncs.`]);
  if (gm.connected && gm.keyDaysLeft != null && gm.keyDaysLeft >= 0 && gm.keyDaysLeft <= GARMIN_KEY_WARN_DAYS)
    problems.push(['garminkey', `Your Garmin key expires on ${gm.keyExpires} (${gm.keyDaysLeft} days). Create a new one on Garmin Connect and paste it into the script's GARMIN_KEY and GARMIN_KEY_EXPIRES (SETUP.md Step 13). It takes 2 minutes.`, 7]);
  for (const [k, msg, everyDays = 1] of problems) {
    const last = Number(p.getProperty('ALERT_' + k)) || 0;
    if (now - last < everyDays * 24 * 36e5) continue;   // at most one email per problem per day (key reminders: weekly)
    MailApp.sendEmail({ to: Session.getEffectiveUser().getEmail(), subject: 'Health Sync: data problem', htmlBody: `<p>${msg}</p><p style="color:#666;font-size:13px">Health Sync checks this every hour and emails at most once a day per problem.</p>`, name: 'Health Sync' });
    p.setProperty('ALERT_' + k, String(now));
  }
}

/* ============================ Helpers ============================ */

// Saves obj as a JSON file in folder, replacing the file of that name if there is one.
function saveJson_(folder, name, obj) {
  const it = folder.getFilesByName(name), text = JSON.stringify(obj);
  if (it.hasNext()) it.next().setContent(text); else folder.createFile(name, text, 'application/json');
}
function replaceFile_(folder, name, blob) {
  const it = folder.getFilesByName(name);
  while (it.hasNext()) it.next().setTrashed(true);
  folder.createFile(blob);
}

function inboxFolder_() {
  let folder = DriveApp.getRootFolder();
  FOLDER_PATH.forEach(name => {
    const it = folder.getFoldersByName(name);
    folder = it.hasNext() ? it.next() : folder.createFolder(name);
  });
  return folder;
}
