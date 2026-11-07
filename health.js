'use strict';
// Health Sync · Data health: is each source still delivering?
// One of the app's screen files: classic scripts that share one global scope, loaded in order by index.html.
/* ================= data health ================= */
let scriptStat = null;
async function loadHealth() {
  if (store === Drive) { try { scriptStat = await Drive.scriptStatus(); } catch { scriptStat = null; } }
  renderHealth();
}
function healthRows() {
  const H = h => h == null ? 'never' : h < 1 ? 'under an hour ago' : h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`;
  const st = scriptStat, rows = [];
  const since = iso => iso ? Math.round((Date.now() - Date.parse(iso)) / 36e5) : null;
  const lastImport = re => { const x = (data.imports || []).filter(i => re.test(i.what || '')).map(i => i.at).sort().pop(); return x || null; };
  if (store !== Drive) return [['gray', 'This computer only', 'Data health checks need Google Drive mode.', '']];
  if (!st) rows.push(['warn', 'Google script', 'No status yet from your script.', 'Paste script v2.3 or later into script.google.com and run setup once (README › Updating the app).']);
  else {
    const h = since(st.checkedAt);
    // The script only needs pasting when its own code changed: when it's older than the newest script (SCRIPT_LATEST).
    const stale = st.scriptVersion && versionLess(st.scriptVersion, SCRIPT_LATEST);
    rows.push([h > 3 ? 'bad' : stale ? 'warn' : 'ok', 'Google script', `Last ran ${H(h)} · v${st.scriptVersion}`, h > 3 ? 'It should run every hour. In script.google.com › Triggers, check the hourly trigger exists; run setup to recreate it.' : stale ? `A newer script is out: v${SCRIPT_LATEST}. Paste email-to-drive.gs into script.google.com (README › Updating the app).` : '']);
    const l = st.loseIt;
    rows.push([l.error ? 'bad' : !l.lastAt ? 'gray' : l.hoursAgo > 72 ? 'bad' : l.hoursAgo > 36 ? 'warn' : 'ok', 'Lose It report',
      l.lastAt ? `Last email ${H(l.hoursAgo)}` : 'No report email seen yet (tracking starts with script v2.3)', l.error ? `Saving emails failed: ${l.error}` : l.hoursAgo > 36 ? 'Check that Lose It is still emailing daily reports to your Gmail (donotreply@loseit.com).' : '']);
    const a = st.appleHealth;
    rows.push([a.minuteData ? 'warn' : !a.lastAt ? 'gray' : a.hoursAgo > 72 ? 'bad' : a.hoursAgo > 36 ? 'warn' : 'ok', 'Apple Health (Health Auto Export)',
      a.lastAt ? `Updated ${H(a.hoursAgo)} · ${a.sizeKB} KB` : 'No Health Auto Export folder found',
      a.minuteData ? 'The file is minute-by-minute (too big). Set the automation’s Time Grouping to Day — steps, active calories and flights are ignored until then.' : a.hoursAgo > 36 ? 'Open Health Auto Export on your iPhone: check the automation is on, and Settings › General › Background App Refresh is on for it.' : '']);
    const s = st.strava;
    rows.push([s.error ? 'bad' : s.connected ? 'ok' : 'gray', 'Strava', s.connected ? `Connected${s.lastNewAt ? ` · last new workout saved ${H(since(s.lastNewAt))}` : ''}` : 'Not connected', s.error ? `Sync failed: ${s.error} — run stravaCheck in the script.` : '']);
    const bk = st.backup;
    rows.push(!bk ? ['warn', 'Nightly backups', 'Not running yet', `Your script is v${st.scriptVersion || '?'}; backups start with v${SCRIPT_LATEST}. Paste email-to-drive.gs into script.google.com (README › Updating the app).`]
      : bk.error ? ['bad', 'Nightly backups', `Last night's backup failed`, `${bk.error}. Open the script's Executions page for details. Settings › Nightly backups lists the copies you have.`]
      : !bk.lastAt ? ['gray', 'Nightly backups', 'No backup yet', 'The first is saved within the hour.']
      : [bk.hoursAgo > 48 ? 'bad' : 'ok', 'Nightly backups', `Last saved ${H(bk.hoursAgo)} · ${bk.count} kept${bk.sizeKB ? ` · ${bk.sizeKB >= 1024 ? (bk.sizeKB / 1024).toFixed(1) + ' MB' : bk.sizeKB + ' KB'}` : ''}`, bk.hoursAgo > 48 ? 'There should be one a day. Check the script\u2019s hourly trigger (run setup to recreate it).' : '']);
    rows.push(garminRow(st.garmin, H, since));
  }
  // Each measurement on its own, against its own rhythm (quietRows in rules.js): a source can keep delivering files
  // while one measurement inside them stops.
  rows.push(...quietRows(st));
  const cc = coachCfg();
  if (cc.apiKey) {
    const lastMon = addDays(weekStart(todayKey()), -7), r = reviews()['week:' + lastMon];
    const late = !r && todayKey() >= addDays(lastMon, 9);
    rows.push([late ? 'warn' : 'ok', 'Coach', r ? `Last weekly review: week of ${fmtRange(r.start, r.end)}` : `Week of ${fmtRange(lastMon, addDays(lastMon, 6))}: ${late ? 'not written yet' : 'due Monday at noon'}`, late ? 'Open the Coach tab to see why (missing data, or an API key/credit problem).' : '']);
  }
  const li = lastImport(/Lose It|Apple Health|Strava|Garmin|Withings/);
  rows.push(['gray', 'Last import into the app', li ? new Date(li).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'none yet', '']);
  return rows;
}
// Recent days that look under-logged, grouped by week. Yesterday and today are left out (their Lose It report may not be in yet).
const GAP_LOW_CAL = 800;
function foodGaps() {
  const t = todayKey(), first = Object.keys(data.days).filter(k => totals(getDay(k)).hasFood).sort()[0];
  if (!first) return [];
  const weeks = {};
  for (let k = addDays(t, -28); k <= addDays(t, -2); k = addDays(k, 1)) {
    if (k < first) continue;
    const d = getDay(k), tt = totals(d);
    const why = !tt.hasFood ? 'no food logged' : !tt.fromHealth && tt.calIn < GAP_LOW_CAL ? `only ${fmtN(tt.calIn)} cal logged` : foodPartial(d, k) ? 'no final Lose It report' : '';
    if (why) (weeks[weekStart(k)] ||= []).push([k, why]);
  }
  return Object.entries(weeks).map(([ws, days]) => ({ ws, days, key: ws + '|' + days.map(x => x.join(':')).join(',') }))
    .filter(g => !data.gapsOk?.[g.key]);
}
function renderGaps() {
  const gaps = foodGaps();
  $('#gap-card').hidden = !gaps.length;
  $('#gap-list').innerHTML = gaps.map(g => `<div class="dh"><i class="gap"></i><div style="flex:1"><b>Week of ${esc(fmtRange(g.ws, addDays(g.ws, 6)))}</b>
    <div class="fix">${g.days.map(([k, why]) => `${esc(fmtDay(k))}: ${esc(why)}`).join(' · ')}</div></div>
    <button class="btn small ghost" data-gap-ok="${esc(g.key)}" title="Hide this week; it will come back if anything else changes">Looks right</button></div>`).join('');
}
// Garmin, read straight from Garmin by the script (script v2.12+): connection, history loading, key expiry.
function garminRow(g, H, since) {
  if (!g || !g.connected) return ['gray', 'Garmin', 'Not connected', g ? 'Optional: connect it to get Body Battery, HRV, stress, sleep score, Pulse Ox and full workout detail straight from Garmin (SETUP.md Step 13).' : ''];
  const day = iso => fmtDay(iso, { month: 'short', day: 'numeric', year: 'numeric' }), h = g.history || {}, late = since(g.lastOkAt);
  const done = h.daysDone && h.workoutsDone;
  const parts = [h.backTo ? `back to ${day(h.backTo)}${done ? '' : ' so far'}` : '', h.workouts != null ? plural(h.workouts, 'workout') : ''].filter(Boolean).join(', ');
  const watch = g.watchSyncedAt ? ` · watch synced ${H(g.watchHoursAgo)}` : '';
  const line = `${g.lastOkAt ? 'Updated ' + H(late) : 'Not synced yet'}${watch} · ${done ? 'history complete' : 'loading history'}${parts ? ` (${parts})` : ''}${g.keyExpires ? ` · key expires ${day(g.keyExpires)}` : ''}`;
  const at = iso => new Date(iso).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' });
  if (g.keyDaysLeft != null && g.keyDaysLeft < 0) return ['bad', 'Garmin', `Key expired on ${day(g.keyExpires)}`, 'Create a new key on Garmin Connect and paste it into the script’s GARMIN_KEY and GARMIN_KEY_EXPIRES (SETUP.md Step 13). Takes 2 minutes.'];
  if (g.pausedUntil) return ['warn', 'Garmin', line, `Garmin asked the script to slow down, so it's pausing until ${at(g.pausedUntil)} and then carries on. Nothing is lost, and there's nothing to do.`];
  if (g.error) return [/slow down/.test(g.error) ? 'warn' : 'bad', 'Garmin', line, `${g.error}${/slow down/.test(g.error) ? '' : ' — run garminCheck in the script.'}`];
  if (g.watchHoursAgo != null && g.watchHoursAgo > 12) return ['warn', 'Garmin', line, `Your watch last synced to Garmin Connect ${H(g.watchHoursAgo)}. Open the Garmin Connect app on your phone (with Bluetooth on) so it syncs.`];
  if (g.keyDaysLeft != null && g.keyDaysLeft <= 30) return ['warn', 'Garmin', line, `Your Garmin key expires in ${plural(g.keyDaysLeft, 'day')}. Create a new one and paste it into the script (SETUP.md Step 13).`];
  if (late == null || late > 3) return ['warn', 'Garmin', line, 'Garmin should update every hour. Run garminCheck in the script to see why it hasn’t.'];
  if (g.keyDaysLeft == null) return ['warn', 'Garmin', line, 'Add GARMIN_KEY_EXPIRES (the date your key expires, like 2027-10-26) to the script’s properties so you get a reminder before it stops working.'];
  return ['ok', 'Garmin', line, ''];
}
function renderHealth() {
  if (!$('#dh-list')) return;
  renderGaps();
  const rows = healthRows();
  $('#dh-list').innerHTML = rows.map(([c, name, line, fix]) => `<div class="dh"><i class="${c}"></i><div><b>${esc(name)}</b> <span class="muted small">${esc(line)}</span>${fix ? `<div class="fix">${esc(fix)}</div>` : ''}</div></div>`).join('');
  $('#dh-sub').textContent = scriptStat ? `checked ${new Date(scriptStat.checkedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : '';
  const bad = rows.filter(r => r[0] === 'bad').length, warn = rows.filter(r => r[0] === 'warn').length;
  const hc = $('#hc');
  hc.hidden = !(bad || warn);
  hc.className = 'health-chip' + (bad ? ' bad' : '');
  hc.textContent = `⚠ ${plural(bad + warn, 'data issue')}`;
  // Weight-loss pace is a health alert, not a data issue (paceAlert in rules.js).
  const pa = paceAlert(), pc = $('#pc');
  pc.hidden = !pa;
  if (pa) { pc.className = 'health-chip' + (pa.level === 'bad' ? ' bad' : ''); pc.textContent = `♥ ${pa.label}`; pc.title = `${pa.text} Tap for the Weight page.`; }
}
