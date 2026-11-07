'use strict';
// Health Sync · saving and merging. Every device re-reads the saved copy before it saves, and only what changed here is written over it.
// Loaded after core.js and before the app; tests.html checks it with a pretend store.

let store = null;
let base = null;        // the data as this device last loaded or saved it: what "changed here" is measured against
let coachDirty = false;
let errorsDirty = false;
let usageDirty = false;
let sizeDirty = false;     // a data file size report was read (sizeLog, v3.9)

// What you use: each device counts which screens it opens, in data.usage[device]. Only this device's entry is saved
// from here, so two devices never overwrite each other's counts. Settings › What you use adds them up, so screens
// nobody opens can be cut (feature freeze, v3.8). Saved with the next save, never a save of its own.
function deviceId() {
  let id = LS.get('hs-device', null);
  if (!id) { id = uid(); LS.set('hs-device', id); }
  return id;
}
function noteUse(key) {
  const dev = deviceId(), u = ((data.usage ||= {})[dev] ||= { name: (navigator.userAgent.match(/iPhone|iPad|Android|Macintosh|Windows/) || ['Device'])[0].replace('Macintosh', 'Mac'), since: todayKey(), n: {} });
  const e = (u.n[key] ||= [0, null]);
  e[0]++; e[1] = todayKey();
  usageDirty = true;
}

async function loadData() {
  const d = await store.load();
  base = structuredClone(d);
  return d;
}

const isObj = v => v != null && typeof v === 'object' && !Array.isArray(v);
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// Three-way merge of one value: theirs (r), ours (l), and how it was when we last loaded it (b).
// Unchanged here → theirs. Changed here → ours, except objects, which merge field by field,
// so a drink logged on the phone survives a Health import on the Mac for the same day.
// Lists (food, workouts) are taken whole. Emptied here → only the fields this device had are removed.
function merge3(r, l, b) {
  if (sameJson(l, b)) return r;
  if (l === undefined && isObj(b) && isObj(r)) l = {};
  if (isObj(l) && isObj(r) && (b === undefined || isObj(b))) {
    const out = {}, bb = b || {};
    for (const k of new Set([...Object.keys(r), ...Object.keys(l), ...Object.keys(bb)])) {
      const v = merge3(r[k], l[k], bb[k]);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  return l;
}

// Copy this device's unsaved changes (flags in f) onto a freshly loaded copy of the data.
function mergeLocal(remote, f, local = data, was = base) {
  for (const k of f.days) {
    const v = merge3(remote.days[k], local.days[k], was?.days?.[k]);
    if (isObj(v) && Object.keys(v).length) remote.days[k] = v; else delete remote.days[k];
  }
  const seen = new Set(remote.imports.map(i => i.id));
  for (const i of local.imports) if (!seen.has(i.id)) remote.imports.push(i);
  remote.imports = remote.imports.slice(-500);
  if (f.plan) { remote.plan = local.plan; remote.anchorCfg = local.anchorCfg; remote.weightCfg = local.weightCfg; }
  // Tiles merge one change at a time, so hiding one here never un-hides another one hidden elsewhere.
  if (Object.keys(f.tiles).length) {
    let h = (remote.dashCfg?.hiddenTiles || local.dashCfg?.hiddenTiles || settings.hiddenTiles || []).slice();
    for (const [kind, hide] of Object.entries(f.tiles)) { h = h.filter(x => x !== kind); if (hide) h.push(kind); }
    remote.dashCfg = { ...(remote.dashCfg || {}), hiddenTiles: h };
  }
  remote.gapsOk = { ...(remote.gapsOk || {}), ...(local.gapsOk || {}) };
  if (f.coach) {
    // Reviews merge one by one; the most recently written or edited copy of each wins.
    const stamp = r => (r && (r.updatedAt || r.createdAt)) || '';
    remote.reviews = { ...(remote.reviews || {}) };
    for (const [k, r] of Object.entries(local.reviews || {})) if (!remote.reviews[k] || stamp(r) >= stamp(remote.reviews[k])) remote.reviews[k] = r;
    remote.coachCfg = local.coachCfg;
    const ids = new Set((remote.coachUsage ||= []).map(e => e.id));
    for (const e of local.coachUsage || []) if (!ids.has(e.id)) remote.coachUsage.push(e);
    remote.coachUsage = remote.coachUsage.sort((a, b) => a.at.localeCompare(b.at)).slice(-2000);
  }
  // Problems log: kept from every device, the newest 200. A clear on one device clears them all.
  const clearedAt = [remote.errorsClearedAt, local.errorsClearedAt].filter(Boolean).sort().pop() || '';
  if (clearedAt) remote.errorsClearedAt = clearedAt;
  const seenErr = new Map([...(remote.errors || []), ...(local.errors || [])].filter(x => x.at > clearedAt).map(x => [x.id, x]));
  remote.errors = [...seenErr.values()].sort((a, b) => a.at.localeCompare(b.at)).slice(-200);
  // Reflections merge one week at a time; the latest edit wins.
  remote.reflections = { ...(remote.reflections || {}) };
  for (const [k, r] of Object.entries(local.reflections || {})) if (!remote.reflections[k] || (r.updatedAt || '') >= (remote.reflections[k].updatedAt || '')) remote.reflections[k] = r;
  remote.watched = { ...(remote.watched || {}), ...(local.watched || {}) };
  // Garmin files are tracked by the newest file time per folder now; drop the old per-file entries everywhere.
  const gs = remote.garminSeen || {}, ls = local.garminSeen || {};
  remote.garminSeen = { parser: Math.max(gs.parser || 0, ls.parser || 0) || undefined };
  // Two devices: the earlier mark wins, because re-reading a file is harmless and skipping one isn't.
  for (const k of ['days', 'activities']) { const a = gs.parser === remote.garminSeen.parser ? gs[k] : null, b = ls.parser === remote.garminSeen.parser ? ls[k] : null; remote.garminSeen[k] = !a ? b || null : !b ? a : a < b ? a : b; }
  if (remote.garminSeen.parser) for (const [id, v] of Object.entries(remote.watched)) if (/^g\d+:/.test(v)) delete remote.watched[id];
  remote.watchedParser = Math.max(remote.watchedParser || 1, local.watchedParser || 1);
  // Size reports: kept from every device, one per date.
  remote.sizeLog = [...new Map([...(remote.sizeLog || []), ...(local.sizeLog || [])].map(x => [x.at, x])).values()].sort((a, b) => a.at.localeCompare(b.at)).slice(-40);
  remote.schemaVersion = Math.max(remote.schemaVersion || 0, local.schemaVersion || 0);
  const dev = deviceId(), mine = local.usage?.[dev];
  remote.usage = { ...(remote.usage || {}), ...(mine ? { [dev]: mine } : {}) };
}

// Saves run one at a time. A change made while a save is in progress stays in memory and is saved by the next one.
let persistChain = Promise.resolve();
function persist() {
  const run = persistChain.then(persistOnce, persistOnce);
  persistChain = run.catch(() => {});
  return run;
}
async function persistOnce() {
  if (!dirty.size && !importsDirty && !planDirty && !coachDirty && !gapsDirty && !errorsDirty && !sizeDirty && !Object.keys(tileOps).length) return;   // usage alone never starts a save
  const f = { days: new Set(dirty), imports: importsDirty, plan: planDirty, coach: coachDirty, tiles: tileOps };
  dirty.clear(); importsDirty = false; planDirty = false; coachDirty = false; gapsDirty = false; errorsDirty = false; usageDirty = false; sizeDirty = false; tileOps = {};
  setStatus('Saving…', 'busy');
  try {
    // Re-read the latest copy first so edits made on another device aren't overwritten.
    const remote = await store.load();
    mergeLocal(remote, f);
    remote.updated = new Date().toISOString();
    await store.save(remote);
    const saved = structuredClone(remote);
    // Keep anything changed during the save on top (its flags are still set, so the next save writes it).
    mergeLocal(remote, { days: dirty, imports: importsDirty, plan: planDirty, coach: coachDirty, tiles: tileOps });
    data = remote; base = saved;
    setStatus('Saved ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
  } catch (e) {
    for (const k of f.days) dirty.add(k);
    errorsDirty = true;
    if (!/Saving/.test(data.errors?.[data.errors.length - 1]?.where || '')) logError('Saving', e);
    importsDirty ||= f.imports; planDirty ||= f.plan; coachDirty ||= f.coach; tileOps = { ...f.tiles, ...tileOps };
    setStatus('Not saved', 'err');
    throw e;
  }
}

/* ---- restoring a backup (v3.9) ----
   A restore REPLACES everything with the backup; it doesn't merge, because a backup is for undoing a bad save, and a
   merge would carry the bad data along. First, anything unsaved here is saved, and the data as it is now (with every
   device's saves) is handed to keepCopy, which saves it as a "before restore" backup, so a restore can itself be undone.
   What's kept from now: the Coach's settings (your API key) and the screen-use counts. Other devices pick up the
   restored data on their next sync; a change they make after that merges onto it as usual. */
async function restoreFrom(backup, keepCopy) {
  await persist();
  const now = await store.load();
  await keepCopy(now);
  const r = normalize(structuredClone(backup));
  if (!Object.keys(r.days).length && Object.keys(now.days).length) throw new Error('That backup has no days in it, so it was not restored.');
  r.coachCfg = now.coachCfg ?? r.coachCfg; r.usage = now.usage; r.updated = new Date().toISOString();
  await store.save(r);
  dirty.clear(); importsDirty = planDirty = coachDirty = gapsDirty = errorsDirty = usageDirty = sizeDirty = false; tileOps = {};
  data = structuredClone(r); base = structuredClone(r);
  return { days: Object.keys(r.days).length, was: Object.keys(now.days).length };
}
// "health-data 2026-11-07.json" → "2026-11-07"; "health-data before restore 2026-11-07 1432.json" → "2026-11-07 1432".
const backupStamp = name => (String(name).match(/(\d{4}-\d{2}-\d{2})(?: (\d{4}))?/) || []).slice(1).filter(Boolean).join(' ');

