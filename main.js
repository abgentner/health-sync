'use strict';
// Health Sync · sync, startup, wiring up every control, the update check. Loaded last: it runs the app.
// One of the app's screen files: classic scripts that share one global scope, loaded in order by index.html.
/* ================= actions ================= */
async function runTask(fn) {
  if (busy) { toast('Hang on — still working on the last step.'); return; }
  busy = true; $('#btn-sync').disabled = true;
  try { return await fn(); }
  catch (e) { console.error(e); setStatus('Problem', 'err'); toast(e.message || String(e), 6000); }
  finally { busy = false; $('#btn-sync').disabled = false; }
}

async function syncNow() {
  await runTask(async () => {
    setStatus('Syncing…', 'busy');
    await persist();
    data = await loadData();
    if (store === Drive) await checkInbox(true);
    lastSyncAt = Date.now();
    setStatus('Up to date');
    render();
    autoReviews().catch(e => toast(e.message, 8000));
    loadHealth();
  });
}

function exportCsv() {
  const head = ['date', 'steps', 'calories_in', 'protein_g', 'carbs_g', 'fat_g', 'sat_fat_g', 'fiber_g', 'sugars_g', 'sodium_mg', 'cholesterol_mg', 'exercise_min', 'calories_burned', 'weight', 'weight_unit', 'sleep_hours', 'anchors', 'mood', 'energy', 'stress', 'tags', 'notes'];
  const q = v => v == null ? '' : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v);
  const lines = [head.join(',')];
  for (const k of Object.keys(data.days).sort()) {
    const d = data.days[k], t = totals(d), f = d.feel || {};
    lines.push([k, d.steps, t.hasFood ? Math.round(t.calIn) : '', t.hasFood ? Math.round(t.protein) : '', t.hasFood ? Math.round(t.carbs) : '', t.hasFood ? Math.round(t.fat) : '', ...['satFat', 'fiber', 'sugar', 'sodium', 'cholesterol'].map(n => t.hasNutr ? Math.round(t[n]) : ''), t.hasEx ? Math.round(t.exMin) : '', t.hasEx ? Math.round(t.burn) : '', d.weight, d.weight != null ? d.weightUnit : '', sleepHours(d), anchorCount(d), f.mood, f.energy, f.stress, (f.tags || []).join('; '), f.notes].map(q).join(','));
  }
  download(`health-sync-daily-${todayKey()}.csv`, lines.join('\n'), 'text/csv');
}

async function restoreBackup(file) {
  let incoming;
  try { incoming = normalize(JSON.parse(await file.text())); } catch { toast('That file is not a Health Sync backup.'); return; }
  const n = Object.keys(incoming.days).length;
  if (!confirm(`Restore ${n} days from this backup? Days in the backup will replace the same days in your current data.`)) return;
  for (const [k, v] of Object.entries(incoming.days)) { data.days[k] = v; dirty.add(k); }
  await runTask(persist);
  render(); toast(`Restored ${n} days.`);
}

async function importLocalFiles(files) {
  await runTask(async () => {
    for (const f of files) {
      try { (await importBuffer(f.name, await f.arrayBuffer())).forEach(logImport); }
      catch (e) { logImport(`${f.name}: could not import — ${e.message}`); }
    }
    await persist();
    render();
  });
}

/* ================= startup ================= */
async function startApp(kind) {
  store = kind === 'drive' ? Drive : LocalStore;
  LS.set('hs-mode', kind);
  setStatus('Loading…', 'busy');
  await store.init();
  data = await loadData();

  // First time connecting Drive after using local mode: carry local-only days over.
  const local = normalize(LS.get('hs-local-data', null));
  if (store === Drive && Object.keys(local.days).length) {
    let added = 0;
    for (const [k, v] of Object.entries(local.days)) if (!data.days[k]) { data.days[k] = v; dirty.add(k); added++; }
    if (added) { await persist(); toast(`Copied ${added} days from this computer into Google Drive.`); }
    LS.del('hs-local-data');
  }

  $('#welcome').hidden = true; $('#app').hidden = false;
  setStatus('Up to date');
  render();
  if (store === Drive) {
    const n = await checkInbox(true);
    if (n) { render(); toast(`Imported ${n} new file${n > 1 ? 's' : ''} from your Drive Inbox.`); }
  }
  autoReviews().catch(e => toast(e.message, 8000));
  loadHealth();
  if (location.hash === '#coach') goTab('coach');
}

function showWelcomeError(e) {
  console.error(e);
  const el = $('#w-err'); el.textContent = e.message || String(e); el.hidden = false;
  $('#w-connect').disabled = false; $('#w-connect').textContent = 'Connect Google Drive';
}

async function boot() {
  $$('.app-ver').forEach(el => el.textContent = 'v' + APP_VERSION);
  applyTheme();
  scaleUI($('#f-mood'), 'mood', MOODS);
  // The two private marks: ↗ Me or Her, ♡ yes or no; tap the lit one again to clear it.
  $('#f-pv').onclick = e => {
    const b = e.target.closest('button'), g = b?.closest('[data-pv]'); if (!g) return;
    const v = pvVal(b), k = g.dataset.pv; pvDraft[k] = pvDraft[k] === v ? null : v;
    paintScales(); markLogDirty();
  };
  scaleUI($('#f-energy'), 'energy', ['1', '2', '3', '4', '5']);
  scaleUI($('#f-stress'), 'stress', ['1', '2', '3', '4', '5']);

  const onFile = location.protocol === 'file:';
  $('#w-file').hidden = !onFile;
  $('#w-noid').hidden = !!CLIENT_ID || onFile;
  $('#w-connect').hidden = !CLIENT_ID || onFile;

  $('#w-saveid').onclick = () => {
    const v = $('#w-id').value.trim();
    if (!/\.apps\.googleusercontent\.com$/.test(v)) { showWelcomeError(new Error('That doesn\'t look like a Client ID. It should end in .apps.googleusercontent.com')); return; }
    LS.set('hs-client-id', v); location.reload();
  };
  $('#w-local').onclick = () => startApp('local').catch(showWelcomeError);
  $('#w-connect').onclick = () => {
    $('#w-err').hidden = true;
    if (!Drive.client) { showWelcomeError(new Error('Google sign-in is still loading — try again in a moment.')); return; }
    $('#w-connect').disabled = true; $('#w-connect').textContent = 'Connecting…';
    const go = Drive.valid() ? Promise.resolve() : Drive.signIn();
    go.then(() => startApp('drive')).catch(showWelcomeError);
  };

  const mode = LS.get('hs-mode', null);
  if (mode === 'local') { startApp('local').catch(showWelcomeError); return; }
  if (CLIENT_ID && !onFile) {
    try {
      await Drive.ready();
      Drive.initClient();
      if (mode === 'drive' && Drive.valid()) startApp('drive').catch(e => { $('#welcome').hidden = false; $('#app').hidden = true; showWelcomeError(e); });
    } catch (e) { showWelcomeError(e); }
  }
}

/* ---- wire up controls ---- */
$('#tabs').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  if (logDirty && b.dataset.tab !== 'log' && !confirm('You have unsaved changes in Log. Leave without saving?')) return;
  if (b.dataset.tab !== 'log' && logDirty) renderLog();
  if (metricKey) { metricKey = null; history.replaceState(null, '', location.pathname + location.search); }
  noteUse('tab:' + b.dataset.tab);
  $$('#tabs button').forEach(x => x.classList.toggle('on', x === b));
  $$('section.tab').forEach(s => s.hidden = s.id !== 'tab-' + b.dataset.tab);
  if (b.dataset.tab === 'dash') renderCharts();
  if (b.dataset.tab === 'plan') loadPlanDocs(false).catch(e => toast(e.message, 6000));
  if (b.dataset.tab === 'coach') renderCoach();
  if (b.dataset.tab === 'train') renderTraining();
};
$('#rd-more').onclick = () => goTab('train');
$('#tr-logbody').onclick = () => { logDate = dashDate; goTab('log'); renderLog(); $('#b-area').focus(); };
$('#tab-train').addEventListener('click', e => { const b = e.target.closest('[data-open]'); if (b) openMetric(b.dataset.open); });
function goTab(t) { $(`#tabs button[data-tab="${t}"]`).click(); }

// Metric details: click a chart, tile, anchors box or the mood words card
$('#tab-dash').addEventListener('click', e => {
  if (e.target.closest('button, a, input, select, label')) return;
  const el = e.target.closest('[data-metric]');
  if (el && el.hasAttribute('data-hidden') && el.classList.contains('tile')) return;
  if (el) openMetric(el.dataset.metric);
  else if (e.target.closest('#cloud')) openMetric('mood');
});
$('#tab-dash').addEventListener('keydown', e => { const el = e.target.closest('[data-metric]'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openMetric(el.dataset.metric); } });
$('#tab-dash').addEventListener('click', e => {
  const btn = e.target.closest('[data-hide-tile]');
  if (!btn) return;
  e.stopPropagation();
  const kind = btn.dataset.hideTile;
  toggleTile(kind, !hiddenTiles().includes(kind));
});
$('#gap-list').addEventListener('click', e => {
  const b = e.target.closest('[data-gap-ok]'); if (!b) return;
  (data.gapsOk ||= {})[b.dataset.gapOk] = true; gapsDirty = true;
  persist().catch(err => toast(err.message, 6000)); renderGaps();
});
$('#m-back').onclick = backToDash;
$('#m-range').onchange = () => {
  $('#m-range').dataset.set = '1';
  // Starting a custom range: begin with whatever period was just on screen.
  if ($('#m-range').value === 'custom' && !$('#m-from').value) { const kk = $('#m-sub').dataset.from; if (kk) { $('#m-from').value = kk; $('#m-to').value = $('#m-sub').dataset.to; } }
  renderMetric();
};
['#m-from', '#m-to'].forEach(sel => $(sel).addEventListener('change', () => { if ($(sel).value) renderMetric(); }));
$('#m-quick').onclick = e => {
  const b = e.target.closest('[data-q]'); if (!b) return;
  const t = keyToDate(todayKey()), y = t.getFullYear(), m = t.getMonth();
  const r = { tm: [new Date(y, m, 1), t], lm: [new Date(y, m - 1, 1), new Date(y, m, 0)], ty: [new Date(y, 0, 1), t], ly: [new Date(y - 1, 0, 1), new Date(y - 1, 11, 31)] }[b.dataset.q];
  $('#m-from').value = dateKey(r[0]); $('#m-to').value = dateKey(r[1]);
  renderMetric();
};
$('#m-tbody').onclick = e => { const tr = e.target.closest('tr[data-k]'); if (!tr) return; dashDate = tr.dataset.k; backToDash(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape' && metricKey && !/** @type {HTMLElement} */ (e.target).closest?.('input, textarea, select')) backToDash(); });
window.addEventListener('popstate', () => {
  const m = location.hash.match(/^#m\/(\w+)/);
  if (m && METRICS[m[1]]) showMetric(m[1]); else if (metricKey) closeMetric();
});

$('#btn-sync').onclick = () => {
  // Start Google sign-in straight from the click if the session expired, so the popup isn't blocked.
  if (store === Drive && !Drive.valid()) Drive.signIn().then(syncNow).catch(e => toast(e.message, 6000));
  else syncNow();
};

$('#d-date').onchange = e => { if (e.target.value) { dashDate = e.target.value; renderDash(); } };
$('#d-prev').onclick = () => { dashDate = addDays(dashDate, -1); renderDash(); };
$('#d-next').onclick = () => { dashDate = addDays(dashDate, 1); renderDash(); };
$('#d-today').onclick = () => { dashDate = todayKey(); renderDash(); };
$('#d-range').onchange = () => { renderCharts(); renderCloud(); };
$('#d-span').onclick = e => { const b = e.target.closest('button'); if (!b) return; settings.span = +b.dataset.n; saveSettings(); renderDash(); };
$('#cloud-notes').onchange = e => { settings.cloudNotes = e.target.checked; saveSettings(); renderCloud(); };
$('#f-tagsugg').onclick = e => {
  const b = e.target.closest('button'); if (!b) return;
  const v = $('#f-tags').value.trim();
  $('#f-tags').value = (v && !v.endsWith(',') ? v + ', ' : v ? v + ' ' : '') + b.dataset.tag;
  renderTagSugg(); markLogDirty();
};
$('#d-editfeel').onclick = () => { logDate = dashDate; renderLog(); goTab('log'); };

function moveLog(k) {
  if (logDirty && !confirm('You have unsaved changes for this day. Discard them?')) { $('#l-date').value = logDate; return; }
  logDate = k; renderLog();
}
$('#l-date').onchange = e => { if (e.target.value) moveLog(e.target.value); };
$('#l-prev').onclick = () => moveLog(addDays(logDate, -1));
$('#l-next').onclick = () => moveLog(addDays(logDate, 1));
$('#l-today').onclick = () => moveLog(todayKey());
$('#f-tags').addEventListener('input', renderTagSugg);
['#f-tags', '#f-notes', '#f-sleep', '#f-drinks', '#f-weight', '#f-wunit', '#f-steps', '#f-waist', '#f-waistu', '#f-pushups'].forEach(s => $(s).addEventListener('input', markLogDirty));
$('#l-save').onclick = saveLogDay;
$('#an-boxes').onclick = e => {
  const reset = e.target.closest('[data-reset]');
  if (reset) { e.preventDefault(); e.stopPropagation(); anchorDraft[+reset.dataset.reset] = null; renderAnchorBoxes(); markLogDirty(); return; }
  const b = e.target.closest('.anchor'); if (!b) return;
  const i = +b.dataset.i, d = getDay(logDate);
  const st = anchorState(d, i, anchorDraft[i]);
  const want = !st.on;
  // Clicking back to what the data says returns the box to automatic.
  anchorDraft[i] = want === !!st.auto?.ok ? null : want;
  renderAnchorBoxes(); markLogDirty();
};
$('#s-an-save').onclick = saveAnchorSettings;
$('#pl-edit').onclick = () => editPlan(true);
$('#pl-cancel').onclick = () => { if ($('#pl-text').value !== (data.plan?.text || PLAN_TEMPLATE) && !confirm('Discard your changes to the plan?')) return; editPlan(false); };
$('#pl-save').onclick = savePlan;
$('#pl-refresh').onclick = () => loadPlanDocs(true).catch(e => toast(e.message, 6000));
$('#pl-docs').onclick = e => { const b = e.target.closest('button'); if (!b) return; const f = planDocs?.find(x => x.id === b.dataset.id); if (f) showPlanDoc(f); };
$('#mv-go').onclick = () => moveEntries($('#mv-date').value);
$('#del-feel').onclick = deleteFeelings;
$('#del-day').onclick = deleteDay;

$('#w-add').onclick = () => {
  const type = $('#w-type').value.trim(); if (!type) { $('#w-type').focus(); return; }
  day(logDate).workouts.push({ id: 'manual|' + uid(), source: 'manual', type, title: type, durationMin: num($('#w-min').value), calories: num($('#w-cal').value) });
  touch(logDate); $('#w-type').value = $('#w-min').value = $('#w-cal').value = '';
  renderLogLists(); markLogDirty();
};
$('#fd-add').onclick = () => {
  const name = $('#fd-name').value.trim(); if (!name) { $('#fd-name').focus(); return; }
  day(logDate).food.push({ id: 'manual|' + uid(), source: 'manual', name, meal: $('#fd-meal').value, calories: num($('#fd-cal').value) || 0 });
  touch(logDate); $('#fd-name').value = $('#fd-cal').value = '';
  renderLogLists(); markLogDirty();
};
$('#b-area').innerHTML = BODY_AREAS.map(a => `<option>${a}</option>`).join('');
$('#b-add').onclick = () => {
  const level = num($('#b-level').value);
  if (level == null || level < 0 || level > 10) { $('#b-level').focus(); toast('Give it a level from 0 to 10.'); return; }
  (day(logDate).body ||= []).push({ area: $('#b-area').value, kind: $('#b-kind').value, level: Math.round(level), note: $('#b-note').value.trim() });
  touch(logDate); $('#b-level').value = $('#b-note').value = '';
  renderLogLists(); markLogDirty();
};
$('#tab-log').addEventListener('click', e => {
  const b = e.target.closest('[data-del]'); if (!b) return;
  const d = getDay(logDate); if (!d) return;
  d[b.dataset.del].splice(+b.dataset.i, 1);
  touch(logDate); renderLogLists(); markLogDirty();
});

$('#h-range').onchange = renderHist;
$('#h-body').onclick = e => { const tr = e.target.closest('tr'); if (!tr) return; dashDate = tr.dataset.k; goTab('dash'); renderDash(); };

$('#imp-check').onclick = () => {
  const run = () => runTask(async () => { const n = await checkInbox(false); setStatus('Up to date'); render(); if (n) toast(`Imported ${n} file${n > 1 ? 's' : ''}.`); });
  if (!Drive.valid()) Drive.signIn().then(run).catch(e => toast(e.message, 6000)); else run();
};
$('#imp-file').onchange = e => { const f = [...e.target.files]; e.target.value = ''; if (f.length) importLocalFiles(f); };
const drop = $('#imp-drop');
drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('over'); });
drop.addEventListener('dragleave', () => drop.classList.remove('over'));
drop.addEventListener('drop', e => { e.preventDefault(); drop.classList.remove('over'); const f = [...e.dataTransfer.files]; if (f.length) importLocalFiles(f); });

$('#s-units').onchange = e => { settings.units = e.target.value; saveSettings(); renderDash(); };
$('#s-theme').onchange = e => { settings.theme = e.target.value; saveSettings(); applyTheme(); renderCharts(); };
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (!$('#app').hidden) { renderCharts(); if (metricKey) renderMetric(); } });
$('#s-export').onclick = () => download(`health-sync-backup-${todayKey()}.json`, JSON.stringify({ ...data, coachCfg: data.coachCfg ? { ...data.coachCfg, apiKey: '' } : null }, null, 1), 'application/json');
$('#s-csv').onclick = exportCsv;
$('#s-restore').onchange = e => { const f = e.target.files[0]; e.target.value = ''; if (f) restoreBackup(f); };
$('#s-disconnect').onclick = () => {
  if ((dirty.size || importsDirty) && !confirm('Some changes are not saved yet. Sign out anyway?')) return;
  if (Drive.token && window.google?.accounts?.oauth2) google.accounts.oauth2.revoke(Drive.token, () => {});
  LS.del('hs-token'); LS.del('hs-email'); LS.del('hs-mode');
  location.reload();
};
window.addEventListener('beforeunload', e => { if (dirty.size || importsDirty || logDirty || planEditing) { e.preventDefault(); e.returnValue = ''; } });

/* ---- update check: home-screen apps (especially on iPhone) keep an old copy, so look for a newer one ---- */
const verNum = v => String(v).split('.').map(Number);
const newer = (a, b) => { const x = verNum(a), y = verNum(b); for (let i = 0; i < Math.max(x.length, y.length); i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
let lastUpdateCheck = 0;
async function checkForUpdate() {
  if (location.protocol === 'file:' || Date.now() - lastUpdateCheck < 10 * 60 * 1000) return;
  lastUpdateCheck = Date.now();
  try {
    const r = await fetch(location.pathname + '?check=' + Date.now(), { cache: 'no-store' });
    const m = (await r.text()).match(/const APP_VERSION = '([\d.]+)'/);
    if (m && newer(m[1], APP_VERSION) && sessionStorage.getItem('hs-skip-update') !== m[1]) {
      $('#update-msg').textContent = `Version ${m[1]} is available`;
      $('#update-bar').hidden = false;
      $('#update-go').onclick = () => {
        if ((dirty.size || importsDirty || logDirty || planEditing) && !confirm('You have unsaved changes. Update anyway?')) return;
        window.onbeforeunload = null;
        // A new address makes the phone fetch a fresh copy instead of its saved one.
        location.replace(location.pathname + '?v=' + m[1] + location.hash);
      };
      $('#update-x').onclick = () => { $('#update-bar').hidden = true; try { sessionStorage.setItem('hs-skip-update', m[1]); } catch {} };
    }
  } catch {}
}
// A window left open keeps itself current: when you come back to it, and every 10 minutes while it's on screen,
// it saves, reloads what your other devices saved, and imports anything new in the Drive Inbox (this morning's Lose It report).
// Skipped while you're mid-edit. Google's sign-in lasts about an hour and can only be renewed by a click,
// so after that it says how old the data is instead of signing in by itself.
let lastSyncAt = Date.now();
const BG_SYNC_GAP = 5 * 60e3;
async function backgroundSync() {
  if (store !== Drive || busy || logDirty || planEditing || document.visibilityState !== 'visible') return;
  if (Date.now() - lastSyncAt < BG_SYNC_GAP) return;
  if (!Drive.valid()) { setStatus(`Synced ${new Date(lastSyncAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · click Sync`, 'err'); return; }
  busy = true; $('#btn-sync').disabled = true;
  try {
    setStatus('Syncing…', 'busy');
    await persist();
    data = await loadData();
    const n = await checkInbox(true);
    lastSyncAt = Date.now();
    setStatus('Up to date');
    render();
    loadHealth();
    if (n) toast(`Imported ${n} new file${n > 1 ? 's' : ''} from your Drive Inbox.`);
  } catch (e) { logError('Background sync', e); setStatus('Not up to date · click Sync', 'err'); }
  finally { busy = false; $('#btn-sync').disabled = false; }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { checkForUpdate(); backgroundSync().finally(() => autoReviews().catch(e => toast(e.message, 8000))); } });
// If the app is left open over Monday noon, the review still gets written.
setInterval(() => { if (document.visibilityState === 'visible') backgroundSync().finally(() => autoReviews().catch(e => toast(e.message, 8000))); }, 10 * 60e3);

/* ---- Coach wiring ---- */
$('#coach-seg').onclick = e => { const b = e.target.closest('button'); if (!b) return; coachView = b.dataset.v; renderCoach(); };
$('#rf-save').onclick = saveReflection;
$('#rf-week').onchange = () => { delete $('#rf-in-way').dataset.dirty; renderReflection(); };
['#rf-in-way', '#rf-helped'].forEach(s => $(s).addEventListener('input', () => { $('#rf-in-way').dataset.dirty = '1'; }));
$('#why-text').addEventListener('input', () => { $('#why-text').dataset.dirty = '1'; });
$('#why-save').onclick = saveWhy;
$('#coach-history').addEventListener('toggle', e => { const el = e.target; if (el.matches?.('details.rt') && el.open) fillTreeRow(el); }, true);
$('#coach-now-btn').onclick = openReviewNow;
$('#coach-now').querySelector('.chips').onclick = e => { const b = e.target.closest('[data-q]'); if (b) quickRange(b.dataset.q); };
$('#cn-go').onclick = runReviewNow;
$('#coach-gosettings').onclick = () => goTab('set');
$('#cs-save').onclick = saveCoachSettings;
$('#cu-add-go').onclick = () => addCredit('credit');
$('#cu-set-go').onclick = () => addCredit('set');
$('#tab-coach').addEventListener('click', async e => {
  const hp = e.target.closest('[data-helped]');
  if (hp) { e.preventDefault(); e.stopPropagation(); const [key, i, v] = hp.dataset.helped.split('|'), r = reviews()[key], m = r?.marks?.[+i]; if (!m) return;
    m.helped = m.helped === v ? null : v; r.updatedAt = new Date().toISOString(); coachDirty = true; await savePersist(); renderCoach(); return; }
  const t = e.target.closest('[data-regen],[data-swaps],[data-savenote],[data-force],[data-delrev],[data-write]');
  if (!t) return;
  e.preventDefault(); e.stopPropagation();
  if (coachBusy && !t.dataset.savenote && !t.dataset.delrev) { toast('A review is being written — one moment.'); return; }
  try {
    if (t.dataset.regen) { const r = reviews()[t.dataset.regen]; await writeReview(r.key, { kind: r.kind, start: r.start, end: r.end, question: r.question, email: false, force: true }); }
    else if (t.dataset.write) { const [kind, a, b, key] = t.dataset.write.split('|'); await writeReview(key, { kind, start: a, end: b, email: false, force: true }); }
    else if (t.dataset.swaps) await moreSwaps(t.dataset.swaps);
    else if (t.dataset.force) { const r = reviews()[t.dataset.force]; await writeReview(r.key, { kind: r.kind, start: r.start, end: r.end, email: false, force: true }); }
    else if (t.dataset.savenote) { const r = reviews()[t.dataset.savenote]; r.note = $(`[data-note="${CSS.escape(r.key)}"]`).value.trim(); r.updatedAt = new Date().toISOString(); coachDirty = true; await savePersist(); toast('Note saved.'); renderCoach(); }
    else if (t.dataset.delrev) { if (!confirm('Delete this review?')) return; const k = t.dataset.delrev; reviews()[k] = { key: k, deleted: true, updatedAt: new Date().toISOString() }; coachDirty = true; await savePersist(); renderCoach(); }
  } catch (err) { toast(err.message, 8000); }
});

$('#hc').onclick = () => goTab('imp');
$('#pc').onclick = () => openMetric('weight');
$('#er-clear').onclick = async () => { data.errors = []; data.errorsClearedAt = new Date().toISOString(); errorsDirty = true; renderErrors(); await savePersist(); };

$('#m-weight').addEventListener('click', async e => {
  const p = e.target.closest('[data-p]');
  if (p) { predMode = p.dataset.p; renderMetric(); return; }
  if (e.target.closest('#wg-save')) { await saveWeightCfg(); toast('Weight goals saved.'); return; }
  const ph = e.target.closest('[data-ph]');
  if (ph) { await setPhase(ph); return; }
  const use = e.target.closest('#wb-use');
  if (use) {
    const cal = num(use.dataset.cal), p = phaseOf(todayKey());
    if (p.kind !== 'lose') data.weightCfg = { ...(data.weightCfg || {}), phase: { ...data.weightCfg.phase, cal } };
    else data.anchorCfg = { ...anchorCfg(), dayGoal: cal, v: 3 };
    planDirty = true; await savePersist(); renderMetric(); renderDash(); toast(`Day’s calorie goal is now ${fmtN(cal)}.`); return;
  }
  if (e.target.closest('#wg-eadd')) {
    const name = $('#wg-ename').value.trim(), date = $('#wg-edate').value;
    if (!name || !date) { toast('Give the event a name and a date.'); return; }
    await saveWeightCfg({ events: [...weightCfg().events, { name, date }].sort((a, b) => a.date.localeCompare(b.date)) }); return;
  }
  const rm = e.target.closest('[data-wev]');
  if (rm) { const ev2 = weightCfg().events.slice(); ev2.splice(+rm.dataset.wev, 1); await saveWeightCfg({ events: ev2 }); }
});

boot();
checkForUpdate();
