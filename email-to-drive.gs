/**
 * Health Sync — automatic imports into Google Drive.
 *
 * Every hour this:
 *  1. looks in your Gmail for new emails from Lose It or Garmin that have a
 *     PDF, CSV or ZIP attached, and saves the attachments, and
 *  2. if you've connected Strava, saves any new Strava activities,
 * into Google Drive › Health Sync › Inbox. The Health Sync app imports them the
 * next time you open it.
 *
 * Each email is labelled "health-sync-saved" in Gmail once its attachments
 * are saved, so nothing is copied twice. Your emails are not changed or deleted.
 *
 * Your Strava keys are kept in this project's Script Properties (only you can
 * see them), never in this code.
 *
 * Setup: see README.md, Step 10 (emails) and Step 12 (Strava).
 */

// Which emails to look for. Lose It sends its reports from donotreply@loseit.com.
// To add another sender, put it inside the brackets with OR, e.g. 'from:(donotreply@loseit.com OR garmin.com OR reports@example.com)'.
const SEARCH = 'from:(donotreply@loseit.com OR garmin.com) has:attachment newer_than:30d -label:health-sync-saved';

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
  try {
    saveHealthReports();
  } finally {
    syncStrava();
  }
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
  if (!id) throw new Error('Add STRAVA_CLIENT_ID in Project Settings › Script Properties first (README Step 12).');
  const url = 'https://www.strava.com/oauth/authorize?client_id=' + encodeURIComponent(id) +
    '&response_type=code&redirect_uri=http://localhost&approval_prompt=force&scope=activity:read_all';
  console.log('Copy this link into your browser, click Authorize, then copy the whole address of the page you land on:\n\n' + url);
}

/** Step 2: after adding STRAVA_CODE, run this to finish connecting. */
function stravaConnect() {
  const p = props_();
  let code = (p.getProperty('STRAVA_CODE') || '').trim();
  const m = code.match(/[?&]code=([^&]+)/);   // the whole address can be pasted
  if (m) code = m[1];
  if (!code) throw new Error('Add STRAVA_CODE in Script Properties first (README Step 12).');
  const t = stravaToken_({ grant_type: 'authorization_code', code });
  p.deleteProperty('STRAVA_CODE');
  p.deleteProperty('STRAVA_SEEN');
  console.log('Connected to Strava' + (t.athlete && t.athlete.firstname ? ' as ' + t.athlete.firstname : '') + '. Now run setup.');
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
  if (!token) throw new Error('Connect Strava first: run stravaLink, then stravaConnect (README Step 12d).');
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

/* ============================ Helpers ============================ */

function inboxFolder_() {
  let folder = DriveApp.getRootFolder();
  FOLDER_PATH.forEach(name => {
    const it = folder.getFoldersByName(name);
    folder = it.hasNext() ? it.next() : folder.createFolder(name);
  });
  return folder;
}
