'use strict';
// Health Sync · shared helpers and the data model. Loaded before importers.js, rules.js, sync.js and the app.

/* ================= utilities ================= */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
const SS = {
  get(k) { try { return JSON.parse(sessionStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { sessionStorage.removeItem(k); } catch {} },
};
const pad = n => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const dateKey = d => ymd(d.getFullYear(), d.getMonth() + 1, d.getDate());
const todayKey = () => dateKey(new Date());
const keyToDate = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = keyToDate(k); d.setDate(d.getDate() + n); return dateKey(d); };
const fmtDay = (k, opts = { weekday: 'short', month: 'short', day: 'numeric' }) => keyToDate(k).toLocaleDateString(undefined, opts);
const fmtN = (n, dp = 0) => n == null || isNaN(n) ? '—' : Number(n).toLocaleString(undefined, { maximumFractionDigits: dp, minimumFractionDigits: 0 });
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const windowKeys = (end, n) => { const ks = []; for (let i = n - 1; i >= 0; i--) ks.push(addDays(end, -i)); return ks; };
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function validKey(y, m, d) {
  if (y < 1990 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return ymd(y, m, d);
}
function parseDate(s) {
  s = String(s ?? '').trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return validKey(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);           // US style M/D/Y
  if (m) { let y = +m[3]; if (y < 100) y += 2000; return validKey(y, +m[1], +m[2]); }
  if (/[a-z]{3}/i.test(s) && /\d/.test(s)) {                    // "Oct 12, 2026", "Mon, Oct 12, 2026"
    let d = new Date(s);
    if (isNaN(d) && !/\d{4}/.test(s)) d = new Date(s + ', ' + new Date().getFullYear());
    if (!isNaN(d)) return validKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }
  return null;
}
function num(s) {
  if (s == null) return null;
  const m = String(s).replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : null;
}
// minutes; "hms" treats a:b as min:sec (Garmin activity time), "hm" treats it as hours:min (sleep)
function parseDuration(s, mode = 'hms') {
  if (s == null) return null;
  s = String(s).trim();
  if (!s || s === '--') return null;
  let m = s.match(/^(\d+):(\d{2}):(\d{2})(\.\d+)?$/);
  if (m) return +m[1] * 60 + +m[2] + +m[3] / 60;
  m = s.match(/^(\d+):(\d{2})(\.\d+)?$/);
  if (m) return mode === 'hm' ? +m[1] * 60 + +m[2] : +m[1] + +m[2] / 60;
  const h = s.match(/(\d+(?:\.\d+)?)\s*h/i), mi = s.match(/(\d+)\s*m/i);
  if (h || mi) return (h ? +h[1] * 60 : 0) + (mi ? +mi[1] : 0);
  return num(s);
}
let toastT;
function toast(msg, ms = 3200) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms);
}
function setStatus(text, kind = '') {
  $('#st-lbl').textContent = text;
  $('#st-dot').className = 'dot' + (kind ? ' ' + kind : '');
}
function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}

/* ================= data model ================= */
// data.days["YYYY-MM-DD"] = { steps, stepsSource, weight, weightUnit, weightSource,
//   sleep:{hours, score, source}, food:[...], workouts:[...], feel:{mood,energy,stress,tags,notes} }
const emptyData = () => ({ version: 1, days: {}, imports: [], updated: null });
function normalize(d) {
  d = d && typeof d === 'object' ? d : {};
  return { version: 1, days: d.days || {}, imports: Array.isArray(d.imports) ? d.imports : [], plan: d.plan || null, anchorCfg: d.anchorCfg || null, weightCfg: d.weightCfg || null, dashCfg: d.dashCfg || null, gapsOk: d.gapsOk && typeof d.gapsOk === 'object' ? d.gapsOk : {}, watched: d.watched && typeof d.watched === 'object' ? d.watched : {}, watchedParser: d.watchedParser || 1, reviews: d.reviews && typeof d.reviews === 'object' ? d.reviews : {}, reflections: d.reflections && typeof d.reflections === 'object' ? d.reflections : {}, garminSeen: d.garminSeen && typeof d.garminSeen === 'object' ? d.garminSeen : {}, errors: Array.isArray(d.errors) ? d.errors : [], errorsClearedAt: d.errorsClearedAt || null, coachCfg: d.coachCfg || null, coachUsage: Array.isArray(d.coachUsage) ? d.coachUsage : [], updated: d.updated || null };
}
let data = emptyData();
const dirty = new Set();
let importsDirty = false;
let planDirty = false;
let gapsDirty = false;
let tileOps = {};   // tiles hidden/shown here since the last save: { kind: true (hide) | false (show) }
let settings = Object.assign({ units: 'imperial', theme: '', span: 7, cloudNotes: true, hiddenTiles: [] }, LS.get('hs-settings', {}));
const saveSettings = () => LS.set('hs-settings', settings);
// Hidden dashboard tiles are saved with your data, so every computer shows the same tiles.
// (Older copies kept them per computer; that list is used until the first change.)
const hiddenTiles = () => data.dashCfg?.hiddenTiles || settings.hiddenTiles || [];
function toggleTile(kind, hide) {
  const h = hiddenTiles().filter(x => x !== kind);
  if (hide) h.push(kind);
  data.dashCfg = { ...(data.dashCfg || {}), hiddenTiles: h };
  settings.hiddenTiles = h; saveSettings();
  tileOps[kind] = hide; persist().catch(e => toast(e.message, 6000));
  renderDash(); syncTileToggles();
}

function getDay(k) {
  const d = data.days[k];
  if (d && d._k !== k) Object.defineProperty(d, '_k', { value: k, configurable: true });   // lets rules know which day they're judging
  return d;
}
function day(k) {
  const d = data.days[k] || (data.days[k] = {});
  d.food ||= []; d.workouts ||= [];
  return d;
}
function touch(k) {
  const d = data.days[k];
  if (d && !d.food?.length && !d.workouts?.length && d.steps == null && d.weight == null && !d.sleep && !hasFeel(d.feel) && !d.anchors?.some(v => v != null) && !d.healthFood && !d.micros && !d.stepsHours && !(d.health && Object.keys(d.health).length) && !d.garmin && d.restingHR == null && !d.body?.length && d.drinks == null) delete data.days[k];
  dirty.add(k);
}
const hasFeel = f => f && (f.mood || f.energy || f.stress || f.notes || (f.tags && f.tags.length));

const NUTRIENTS = [
  { key: 'protein', name: 'Protein', u: 'g' }, { key: 'carbs', name: 'Carbs', u: 'g' }, { key: 'fat', name: 'Fat', u: 'g' },
  { key: 'satFat', name: 'Saturated fat', u: 'g' }, { key: 'fiber', name: 'Fiber', u: 'g' }, { key: 'sugar', name: 'Sugars', u: 'g' },
  { key: 'sodium', name: 'Sodium', u: 'mg' }, { key: 'cholesterol', name: 'Cholesterol', u: 'mg' },
];
function totals(d) {
  const t = { calIn: 0, protein: 0, carbs: 0, fat: 0, satFat: 0, fiber: 0, sugar: 0, sodium: 0, cholesterol: 0, burn: 0, exMin: 0, hasFood: false, hasEx: false, hasNutr: false };
  if (!d) return t;
  for (const f of d.food || []) {
    t.calIn += f.calories || 0; t.hasFood = true;
    for (const n of NUTRIENTS) if (f[n.key] != null) { t[n.key] += f[n.key]; t.hasNutr = true; }
  }
  // Lose It's PDF report only gives nutrients for the whole day.
  if (!t.hasNutr && d.nutrition) { for (const n of NUTRIENTS) t[n.key] = d.nutrition[n.key] || 0; t.hasNutr = true; }
  // No food list at all? Fall back to the day totals Lose It wrote into Apple Health.
  if (!t.hasFood && d.healthFood?.calories) { t.calIn = d.healthFood.calories; t.hasFood = true; t.fromHealth = true; for (const n of NUTRIENTS) t[n.key] = d.healthFood[n.key] || 0; t.hasNutr = true; }
  for (const w of d.workouts || []) { t.burn += w.calories || 0; t.exMin += w.durationMin || 0; t.hasEx = true; }
  return t;
}
function latestWeight(k, maxBack = 3650) {
  const keys = Object.keys(data.days).filter(x => x <= k && data.days[x].weight != null).sort();
  const last = keys[keys.length - 1];
  if (!last) return null;
  const d = data.days[last];
  return { key: last, value: d.weight, unit: d.weightUnit || 'lb' };
}
const sleepHours = d => d?.sleep?.hours ?? null;

// Which source wins when two fill the same field: later in the list wins, an equal source replaces itself, hand-entered always wins.
// Steps and weight: Apple Health's daily total already merges iPhone + Garmin steps, and carries the Withings weigh-ins.
// Sleep: Garmin's own export carries the sleep score, so it beats Apple's copy of the same night.
const SOURCE_RANK = { steps: ['loseit', 'garmin', 'health', 'manual'], weight: ['loseit', 'garmin', 'health', 'manual'], sleep: ['loseit', 'health', 'garmin', 'manual'] };
function canSet(d, field, next) {
  const cur = field === 'steps' ? d.stepsSource : field === 'weight' ? d.weightSource : d.sleep?.hours != null ? d.sleep.source : null;
  if (!cur) return true;
  const r = SOURCE_RANK[field];
  return r.indexOf(next) >= r.indexOf(cur);
}
const setVia = (d, key, v) => { if (v) d[key] = v; else delete d[key]; };

// "Oct 12 – 18, 2026", "Sep 28 – Oct 4, 2026", "Dec 29, 2026 – Jan 4, 2027"
const fmtRange = (a, b) => {
  const A = keyToDate(a), B = keyToDate(b), mon = d => d.toLocaleDateString(undefined, { month: 'short' });
  if (A.getFullYear() !== B.getFullYear()) return `${mon(A)} ${A.getDate()}, ${A.getFullYear()} – ${mon(B)} ${B.getDate()}, ${B.getFullYear()}`;
  if (A.getMonth() !== B.getMonth()) return `${mon(A)} ${A.getDate()} – ${mon(B)} ${B.getDate()}, ${B.getFullYear()}`;
  return a === b ? `${mon(A)} ${A.getDate()}, ${A.getFullYear()}` : `${mon(A)} ${A.getDate()} – ${B.getDate()}, ${B.getFullYear()}`;
};

const HEALTH_METRICS = {
  restingHR: { name: 'Resting heart rate', c: '--c-hr', unit: 'bpm', dp: 0, kind: 'line', lowerIsBetter: true },
  hrv:       { name: 'Heart rate variability', c: '--c-hrv', unit: 'ms', dp: 0, kind: 'line' },
  activeCal: { name: 'Active calories', c: '--c-cal', unit: 'cal', dp: 0, kind: 'bar', sum: true },
  flights:   { name: 'Flights climbed', c: '--c-anchor', unit: 'flights', dp: 0, kind: 'bar', sum: true },
  water:     { name: 'Water', c: '--c-steps', unit: 'fl oz', dp: 0, kind: 'bar', sum: true },
  vo2max:    { name: 'VO₂ max', c: '--c-hr', unit: '', dp: 1, kind: 'line' },
  bodyFat:   { name: 'Body fat', c: '--c-weight', unit: '%', dp: 1, kind: 'line', lowerIsBetter: true },
  mindful:   { name: 'Mindful minutes', c: '--c-mood', unit: 'min', dp: 0, kind: 'bar', sum: true },
  drinks:    { name: 'Alcoholic drinks', c: '--c-cal', unit: 'drinks', dp: 0, kind: 'bar', sum: true },
  // From Garmin directly (script v2.12+)
  hrvNight:    { name: 'Overnight HRV (Garmin)', c: '--c-hrv', unit: 'ms', dp: 0, kind: 'line' },
  bodyBattery: { name: 'Body Battery (high)', c: '--c-steps', unit: '', dp: 0, kind: 'line' },
  stress:      { name: 'Stress (Garmin)', c: '--c-mood', unit: '', dp: 0, kind: 'line', lowerIsBetter: true },
};

const healthValue = (d, key) => d?.health?.[key] ?? d?.garmin?.[key] ?? (key === 'restingHR' ? d?.restingHR ?? null : null);

function weightUnit() { const w = latestWeight(todayKey()); return w ? w.unit : 'lb'; }

