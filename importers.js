'use strict';
// Health Sync · reading files from Lose It, Apple Health (Health Auto Export), Garmin and Strava into the data.

/* ================= importers ================= */
function logImport(line) {
  const el = $('#imp-log');
  if (el.dataset.fresh !== '1') { el.textContent = ''; el.dataset.fresh = '1'; }
  el.textContent += line + '\n';
  el.scrollTop = el.scrollHeight;
}
function rangeText(keys) {
  const s = [...keys].sort();
  if (!s.length) return '';
  return s.length === 1 ? fmtDay(s[0], { month: 'short', day: 'numeric', year: 'numeric' }) : `${fmtDay(s[0], { month: 'short', day: 'numeric', year: 'numeric' })} – ${fmtDay(s[s.length - 1], { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

async function importBuffer(name, buf) {
  const bytes = new Uint8Array(buf.slice(0, 4));
  if (/\.pdf$/i.test(name) || (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46)) return importPdf(name, buf);
  const isZip = /\.zip$/i.test(name) || (bytes[0] === 0x50 && bytes[1] === 0x4b);
  if (isZip) {
    const zip = await JSZip.loadAsync(buf);
    // Garmin's full account export holds thousands of files; only the daily-summary and sleep JSON files are needed.
    const entries = Object.values(zip.files).filter(f => !f.dir && !/__MACOSX/.test(f.name) && !HAE_SIDE_FILE.test(f.name.split('/').pop()) && (/\.(csv|pdf)$/i.test(f.name) || (/\.json$/i.test(f.name) && GARMIN_JSON.test(f.name))));
    if (!entries.length) return [`${name}: skipped (no CSV, PDF or Garmin daily files inside this ZIP)`];
    const out = [];
    const gj = entries.filter(e => /\.json$/i.test(e.name));
    if (gj.length) {
      const tally = { steps: new Set(), sleep: new Set() };
      for (const e of gj) readGarminJson(await e.async('string'), tally);
      out.push(garminJsonSummary(name, tally));
    }
    for (const e of entries) {
      const base = e.name.split('/').pop();
      if (/\.json$/i.test(base)) continue;
      if (/\.pdf$/i.test(base)) out.push(...await importPdf(`${name} › ${base}`, await e.async('arraybuffer')));
      else out.push(...importCsv(base, await e.async('string'), name));
    }
    return out;
  }
  if (/\.json$/i.test(name)) {
    const text = new TextDecoder('utf-8').decode(buf);
    let j = null; try { j = JSON.parse(text); } catch {}
    if (j && j.source === 'strava') return [impStrava(name, j)];
    if (j && j.source === 'withings') return [impWithings(name, j)];
    if (j && (j.data?.metrics || j.metrics)) return [impHaeJson(name, j)];
    const tally = { steps: new Set(), sleep: new Set() };
    readGarminJson(text, tally);
    return [garminJsonSummary(name, tally)];
  }
  const text = new TextDecoder('utf-8').decode(buf);
  if (/^\s*health-sync;apple-health/i.test(text.replace(/^\uFEFF/, ''))) return [impAppleHealth(name, text)];
  return importCsv(name, text);
}


/* ---- Apple Health (text file saved by the iPhone "Health Sync" shortcut) ----
   One sample per line, separated by semicolons:
     steps;<date>;<value>          sleep;<start>;<end>;<stage>        weight;<date>;<value>;<unit>
     restinghr / hrv / activecal / flights / water / vo2max / bodyfat;<date>;<value>
     mindful;<start>;<end>
   The shortcut covers the last few days each time, so each day it contains is replaced. */
const HEALTH_EXTRA = {
  restinghr: { key: 'restingHR', agg: 'avg' }, hrv: { key: 'hrv', agg: 'avg' }, activecal: { key: 'activeCal', agg: 'sum' },
  flights: { key: 'flights', agg: 'sum' }, water: { key: 'water', agg: 'sum' }, vo2max: { key: 'vo2max', agg: 'avg' }, bodyfat: { key: 'bodyFat', agg: 'avg' },
};
function healthDate(s) {
  s = String(s || '').trim();
  if (!s) return null;
  let d = new Date(s);
  if (isNaN(+d)) d = new Date(s.replace(/\s+at\s+/i, ' '));
  return isNaN(+d) ? null : d;
}
function impAppleHealth(name, text) {
  const steps = {}, asleep = {}, inBed = {}, weight = {}, mindful = {}, extra = {};
  let lines = 0;
  for (const raw of text.split(/\r?\n/)) {
    const p = raw.split(';').map(x => x.trim());
    const kind = (p[0] || '').toLowerCase().replace(/[\s_-]/g, '');
    if (!kind || kind === 'healthsync') continue;
    if (kind === 'sleep' || kind === 'mindful') {
      const a = healthDate(p[1]), b = healthDate(p[2]);
      if (!a || !b || b <= a) continue;
      const mins = (+b - +a) / 60000;
      if (kind === 'mindful') { const k = dateKey(a); mindful[k] = (mindful[k] || 0) + mins; lines++; continue; }
      const k = dateKey(b), stage = (p[3] || '').toLowerCase();   // sleep counts for the day you wake up
      if (/awake/.test(stage)) continue;
      if (/in ?bed/.test(stage)) inBed[k] = (inBed[k] || 0) + mins; else asleep[k] = (asleep[k] || 0) + mins;
      lines++; continue;
    }
    const when = healthDate(p[1]), v = num(p[2]);
    if (!when || v == null) continue;
    const k = dateKey(when);
    if (kind === 'steps') { steps[k] = (steps[k] || 0) + v; lines++; }
    else if (kind === 'weight') { if (v > 0) weight[k] = { v, unit: /kg/i.test(p[3] || '') ? 'kg' : 'lb' }; lines++; }
    else if (HEALTH_EXTRA[kind]) { ((extra[kind] ||= {})[k] ||= []).push(kind === 'bodyfat' && v <= 1 ? v * 100 : v); lines++; }
  }
  const dates = new Set();
  for (const [k, v] of Object.entries(steps)) { const d = day(k); if (canSet(d, 'steps', 'health')) { d.steps = Math.round(v); d.stepsSource = 'health'; } touch(k); dates.add(k); }
  for (const k of new Set([...Object.keys(asleep), ...Object.keys(inBed)])) {
    const mins = asleep[k] || inBed[k];
    const d = day(k);
    if (canSet(d, 'sleep', 'health')) d.sleep = { hours: Math.round(mins / 6) / 10, score: d.sleep?.score ?? null, source: 'health' };
    touch(k); dates.add(k);
  }
  for (const [k, w] of Object.entries(weight)) { const d = day(k); if (canSet(d, 'weight', 'health')) { d.weight = w.v; d.weightUnit = w.unit; d.weightSource = 'health'; } touch(k); dates.add(k); }
  for (const [k, m] of Object.entries(mindful)) { const d = day(k); (d.health ||= {}).mindful = Math.round(m); touch(k); dates.add(k); }
  for (const [kind, byDay] of Object.entries(extra)) {
    const { key, agg } = HEALTH_EXTRA[kind];
    for (const [k, vals] of Object.entries(byDay)) {
      const v = agg === 'sum' ? vals.reduce((a, b) => a + b, 0) : avg(vals);
      const d = day(k); (d.health ||= {})[key] = Math.round(v * 10) / 10; touch(k); dates.add(k);
    }
  }
  if (!dates.size) return `${name}: skipped (the Apple Health file had no readable data${lines ? '' : ' — check the shortcut\'s Text step'})`;
  importsDirty = true;
  const got = [Object.keys(steps).length && 'steps', Object.keys(asleep).length + Object.keys(inBed).length && 'sleep', Object.keys(weight).length && 'weight', ...Object.keys(extra).map(x => HEALTH_METRICS[HEALTH_EXTRA[x].key].name.toLowerCase()), Object.keys(mindful).length && 'mindful minutes'].filter(Boolean);
  data.imports.push({ id: uid(), at: new Date().toISOString(), name, what: 'days from Apple Health', count: dates.size, range: rangeText(dates) });
  return `${name}: Apple Health — ${plural(dates.size, 'day')} (${got.join(', ')}) · ${rangeText(dates)}`;
}


/* ---- Health Auto Export (iPhone app) — JSON or CSV, ideally with "Aggregate: Day" ---- */
// Dates look like "2026-10-15 00:00:00 -0700"; the date part is already your local day.
const haeDay = s => { const m = String(s || '').match(/(\d{4})-(\d{2})-(\d{2})/); return m ? validKey(+m[1], +m[2], +m[3]) : parseDate(s); };
// "2026-10-15 01:10:00 -0700" → a real time (written out in a form every browser, including iPhone Safari, understands)
const haeTime = s => { const m = String(s || '').match(/(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)\s*(?:([+-]\d{2}):?(\d{2}))?/); return m ? healthDate(`${m[1]}T${m[2]}${m[3] ? m[3] + ':' + m[4] : ''}`) : healthDate(s); };
// Side files in a Health Auto Export ZIP: per-workout minute-by-minute data, the workout list (Strava/Garmin cover
// workouts), and Apple's symptom/ECG/medication logs.
const HAE_SIDE_FILE = /-\d{8}_\d{6}\.csv$|^(Workouts|Symptoms|ECG|HeartRateNotifications|StateOfMind|CycleTracking|Medications)-.*\.csv$/i;
const HAE_METRICS = {
  step_count: 'steps', sleep_analysis: 'sleep', weight_body_mass: 'weight', body_mass: 'weight',
  resting_heart_rate: 'restingHR', heart_rate_variability: 'hrv', heart_rate_variability_sdnn: 'hrv', active_energy: 'activeCal', active_energy_burned: 'activeCal',
  flights_climbed: 'flights', dietary_water: 'water', water: 'water', vo2_max: 'vo2max', body_fat_percentage: 'bodyFat', mindful_minutes: 'mindful',
  number_of_alcoholic_beverages: 'drinks', alcoholic_beverages: 'drinks', lean_body_mass: 'leanKg',
  // Nutrition that Lose It writes into Apple Health (one entry per meal, added up per day)
  dietary_energy: 'n:calories', protein: 'n:protein', carbohydrates: 'n:carbs', total_fat: 'n:fat', saturated_fat: 'n:satFat',
  fiber: 'n:fiber', dietary_sugar: 'n:sugar', sodium: 'n:sodium', cholesterol: 'n:cholesterol',
};
// Steps, active calories and flights come from both the iPhone and Garmin. Only Apple's daily totals reliably remove
// that overlap, so hourly/minute buckets never set the totals. Hourly/minute steps are kept only as the SHAPE of the
// day (d.stepsHours, 24 raw counts), and shown scaled to the day's real total.
const DEDUPE_KEYS = new Set(['steps', 'activeCal', 'flights']);
const SUM_KEYS = new Set(['steps', 'activeCal', 'flights', 'water', 'mindful', 'drinks']);
// Convert to the units the app shows: calories, fl oz, %, minutes.
function haeConvert(key, v, unit) {
  const u = String(unit || '').toLowerCase();
  if (key === 'activeCal' && /kj/.test(u)) return v / 4.184;
  if (key === 'water' && /(^|[^a-z])ml|millilit/.test(u)) return v / 29.5735;
  if (key === 'water' && /^l$|litre|liter/.test(u)) return v * 33.814;
  if (key === 'bodyFat' && v <= 1) return v * 100;
  if (key === 'leanKg' && /lb|pound/.test(u)) return v / 2.20462;   // lean mass is kept in kg, like Withings'
  if (key === 'mindful' && /hr|hour/.test(u)) return v * 60;
  return v;
}
function impHaeJson(name, j) {
  const days = {}, notDaily = new Set(), stepHours = new Set(), sleepUnread = [];
  const add = (k, key, v) => { if (!k || v == null || isNaN(v)) return; const e = (days[k] ||= {})[key] ||= []; e.push(v); };
  // The device or app that wrote the value into Apple Health (e.g. "Garmin Connect", "Withings").
  const via = (k, key, s) => { if (k && s) ((days[k] ||= {}).via ||= {})[key] = String(s); };
  for (const m of j.data?.metrics || j.metrics || []) {
    const mname = String(m.name || '').toLowerCase(), micro = MICRO_BY[mname.replace(/^dietary_/, '')];
    const key = HAE_METRICS[mname] || (micro ? 'x:' + micro.key : null);
    if (!key) continue;
    if (DEDUPE_KEYS.has(key) && (m.data || []).some(r => !/ 00:00(:00)?( |$)/.test(String(r.date || '')))) {
      if (key !== 'steps') { notDaily.add(HEALTH_METRICS[key]?.name.toLowerCase() || key); continue; }
      const hours = {};
      for (const r of m.data || []) {
        const t = String(r.date || r.startDate || '').match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):/), v = num(r.qty);
        if (t && v != null) (hours[t[1]] ||= Array(24).fill(0))[+t[2]] += v;
      }
      // A later export of the same day has at least as many steps; never replace a fuller day with a partial one.
      for (const [k, h] of Object.entries(hours)) {
        const sum = h.reduce((a, b) => a + b, 0), old = getDay(k)?.stepsHours;
        if (sum > 0 && (!old || sum >= old.reduce((a, b) => a + b, 0))) { day(k).stepsHours = h.map(Math.round); touch(k); stepHours.add(k); }
      }
      continue;
    }
    for (const r of m.data || []) {
      if (key === 'sleep') {
        // Aggregated records hold totalSleep, asleep and core/deep/rem in hours, and any of them can be 0 while another
        // holds the night (Garmin writes plain "asleep"; stage-tracking devices write core/deep/rem). Raw: one stage per sample.
        const stages = ['core', 'deep', 'rem'].reduce((s, x) => s + (num(r[x]) || 0), 0);
        let hrs = Math.max(num(r.totalSleep) || 0, num(r.asleep) || 0, stages) || null;
        const skip = /awake|in ?bed/i.test(r.value || '');
        if (hrs == null && r.startDate && r.endDate && !skip) {
          const a = haeTime(r.startDate), b = haeTime(r.endDate);
          if (a && b && b > a) { const k = haeDay(r.endDate); add(k, 'sleepRaw', (+b - +a) / 36e5); via(k, 'sleep', r.source); const bt = String(r.startDate).match(/[ T](\d{2}:\d{2})/), e = (days[k] ||= {}); if (bt && (!e.sleepStartAt || a < e.sleepStartAt)) { e.sleepStartAt = a; e.sleepStart = bt[1]; } continue; }
        }
        if (/min/i.test(m.units || '') && hrs) hrs /= 60;
        if (hrs) { const k = haeDay(r.sleepEnd || r.date); add(k, 'sleep', hrs); via(k, 'sleep', r.source || r.sleepSource); const bt = String(r.sleepStart || r.inBedStart || '').match(/[ T](\d{2}:\d{2})/); if (bt) (days[k] ||= {}).sleepStart = bt[1]; }
        else if (!skip) sleepUnread.push(r);
        continue;
      }
      const v = num(r.qty ?? r.Avg ?? r.avg ?? r.value);
      if (v == null) continue;
      add(haeDay(r.date || r.startDate), key, key.startsWith('x:') ? massTo(v, m.units, MICRO_BY[key.slice(2)].u) : key === 'weight' || key.startsWith('n:') ? v : haeConvert(key, v, m.units));
      if (key === 'weight') (days[haeDay(r.date || r.startDate)] ||= {}).weightUnit = /kg/i.test(m.units || '') ? 'kg' : 'lb';
      if (key === 'steps' || key === 'weight') via(haeDay(r.date || r.startDate), key, r.source);
    }
  }
  if (stepHours.size) importsDirty = true;
  const hrs = stepHours.size ? `steps by time of day for ${plural(stepHours.size, 'day')} (${rangeText(stepHours)})` : '';
  // Say exactly what came in, so a new Health Auto Export format can be added instead of being dropped silently.
  const unread = sleepUnread.length ? ` — ⚠ ${plural(sleepUnread.length, 'sleep record')} had no hours this app can read (fields: ${Object.keys(sleepUnread[0]).slice(0, 12).join(', ')})` : '';
  if (!Object.keys(days).length && hrs) return `${name}: Apple Health (Health Auto Export) — ${hrs}${unread}`;
  const res = applyHae(name, days, notDaily);
  return (hrs ? `${res} · ${hrs}` : res) + unread;
}
// Vitamins and minerals come from Apple Health (Lose It writes them there; its emailed report doesn't include them).
// dv = FDA daily value for adults; null = no daily value (shown as an amount only).
const MICROS = [
  ['potassium', 'Potassium', 'mg', 4700], ['calcium', 'Calcium', 'mg', 1300], ['magnesium', 'Magnesium', 'mg', 420], ['iron', 'Iron', 'mg', 18],
  ['zinc', 'Zinc', 'mg', 11], ['phosphorus', 'Phosphorus', 'mg', 1250], ['vitamin_a', 'Vitamin A', 'mcg', 900], ['vitamin_c', 'Vitamin C', 'mg', 90],
  ['vitamin_d', 'Vitamin D', 'mcg', 20], ['vitamin_e', 'Vitamin E', 'mg', 15], ['vitamin_k', 'Vitamin K', 'mcg', 120], ['thiamin', 'Thiamin (B1)', 'mg', 1.2],
  ['riboflavin', 'Riboflavin (B2)', 'mg', 1.3], ['niacin', 'Niacin (B3)', 'mg', 16], ['vitamin_b6', 'Vitamin B6', 'mg', 1.7], ['folate', 'Folate', 'mcg', 400],
  ['vitamin_b12', 'Vitamin B12', 'mcg', 2.4], ['biotin', 'Biotin', 'mcg', 30], ['pantothenic_acid', 'Pantothenic acid (B5)', 'mg', 5], ['copper', 'Copper', 'mg', 0.9],
  ['manganese', 'Manganese', 'mg', 2.3], ['selenium', 'Selenium', 'mcg', 55], ['iodine', 'Iodine', 'mcg', 150], ['chromium', 'Chromium', 'mcg', 35],
  ['molybdenum', 'Molybdenum', 'mcg', 45], ['chloride', 'Chloride', 'mg', 2300], ['monounsaturated_fat', 'Monounsaturated fat', 'g', null],
  ['polyunsaturated_fat', 'Polyunsaturated fat', 'g', null], ['caffeine', 'Caffeine', 'mg', null],
].map(([key, name, u, dv]) => ({ key, name, u, dv }));
const MICRO_BY = Object.fromEntries(MICROS.map(m => [m.key, m]));
// Convert between g, mg and mcg.
const massTo = (v, from, to) => { const f = { g: 1e6, mg: 1e3, mcg: 1, 'µg': 1, ug: 1 }; const a = f[String(from || to).toLowerCase()], b = f[to]; return a && b ? v * a / b : v; };
/** @type {[RegExp, string][]} */
const HAE_COLS = [
  [/^step count/, 'steps'], [/^sleep analysis.*(total|asleep)|^total sleep/, 'sleep'], [/^sleep analysis \[(core|deep|rem)\]/, 'sleepStage'], [/^(weight|body mass)/, 'weight'],
  [/^resting heart rate/, 'restingHR'], [/^heart rate variability/, 'hrv'], [/^active energy/, 'activeCal'], [/^flights climbed/, 'flights'],
  [/^(dietary )?water/, 'water'], [/^vo2 ?max|^cardio fitness/, 'vo2max'], [/^body fat/, 'bodyFat'], [/^mindful/, 'mindful'], [/^(number of )?alcoholic beverages/, 'drinks'], [/^lean body mass/, 'leanKg'],
  [/^dietary energy/, 'n:calories'], [/^protein/, 'n:protein'], [/^carbohydrates/, 'n:carbs'], [/^total fat/, 'n:fat'], [/^saturated fat/, 'n:satFat'],
  [/^fiber/, 'n:fiber'], [/^sugar/, 'n:sugar'], [/^sodium/, 'n:sodium'], [/^cholesterol/, 'n:cholesterol'],
  ...MICROS.map(m => /** @type {[RegExp, string]} */ ([new RegExp('^' + String(m.name).toLowerCase().replace(/ \(.*\)/, '').replace(/[()]/g, '') + ' \\('), 'x:' + m.key])),
];
function impHaeCsv(label, headers, body) {
  const dc = headers.find(h => /^date/.test(h)) || headers[0];
  const cols = headers.map(h => { const hit = HAE_COLS.find(([re]) => re.test(h)); return hit ? [h, hit[1], (h.match(/\(([^)]+)\)\s*$/) || [])[1] || ''] : null; }).filter(Boolean);
  if (!cols.length) return null;
  const days = {};
  for (const r of body) {
    const k = haeDay(r[dc]);
    if (!k) continue;
    for (const [h, key, unit] of cols) {
      const v = num(r[h]);
      if (v == null || r[h] === '') continue;
      const e = (days[k] ||= {});
      (e[key] ||= []).push(key.startsWith('x:') ? massTo(v, unit.replace(/^l?bs?$/, ''), MICRO_BY[key.slice(2)].u) : key === 'weight' || key.startsWith('n:') ? v : /^sleep/.test(key) && /min/i.test(unit) ? v / 60 : haeConvert(key, v, unit));
      if (key === 'weight') e.weightUnit = /kg/i.test(unit) ? 'kg' : 'lb';
    }
  }
  return applyHae(label, days);
}
function applyHae(name, days, notDaily = new Set()) {
  const dates = new Set(), got = new Set();
  for (const [k, e] of Object.entries(days)) {
    const d = day(k);
    const val = key => e[key] ? (SUM_KEYS.has(key) ? e[key].reduce((a, b) => a + b, 0) : avg(e[key])) : null;
    const sumOf = a => a.reduce((x, y) => x + y, 0);
    const v = e.via || {};
    if (e.steps && canSet(d, 'steps', 'health')) { d.steps = Math.round(val('steps')); d.stepsSource = 'health'; setVia(d, 'stepsVia', v.steps); got.add('steps'); }
    // Several sleep totals for one night (one per source) → the longest; stages or raw samples → added up.
    const sl = Math.max(e.sleep ? Math.max(...e.sleep) : 0, e.sleepStage ? sumOf(e.sleepStage) : 0, e.sleepRaw ? sumOf(e.sleepRaw) : 0) || null;
    if (sl && canSet(d, 'sleep', 'health')) { d.sleep = { hours: Math.round(sl * 10) / 10, score: d.sleep?.score ?? null, source: 'health', ...(v.sleep ? { via: v.sleep } : {}), ...(e.sleepStart ? { start: e.sleepStart } : {}) }; got.add('sleep'); }
    else if (e.sleepStart && d.sleep && !d.sleep.start) d.sleep.start = e.sleepStart;   // a better source has the hours, but no bedtime
    if (e.weight && canSet(d, 'weight', 'health')) { d.weight = Math.round(e.weight[e.weight.length - 1] * 10) / 10; d.weightUnit = e.weightUnit || 'lb'; d.weightSource = 'health'; setVia(d, 'weightVia', v.weight); got.add('weight'); }
    if (e.leanKg) { (d.health ||= {}).leanKg = Math.round(avg(e.leanKg) * 10) / 10; got.add('lean body mass'); }
    for (const key of Object.keys(HEALTH_METRICS)) if (e[key]) { (d.health ||= {})[key] = Math.round(val(key) * 10) / 10; got.add(HEALTH_METRICS[key].name.toLowerCase()); }
    // Nutrition that Lose It wrote into Apple Health: a backup for days with no Lose It report (never mixed with food entries).
    if (e['n:calories'] && sumOf(e['n:calories']) > 0) {
      const n = { source: 'health', calories: Math.round(sumOf(e['n:calories'])) };
      for (const x of NUTRIENTS) if (e['n:' + x.key]) n[x.key] = Math.round(sumOf(e['n:' + x.key]) * 10) / 10;
      d.healthFood = n; got.add('nutrition');
    }
    const mx = Object.keys(e).filter(x => x.startsWith('x:'));
    if (mx.length) { d.micros = Object.fromEntries(mx.map(x => [x.slice(2), Math.round(sumOf(e[x]) * 100) / 100])); got.add('vitamins and minerals'); }
    touch(k); dates.add(k);
  }
  const warn = notDaily.size ? ` — ⚠ ignored ${[...notDaily].join(', ')}: this file has hourly/minute data, which double-counts iPhone + Garmin. In Health Auto Export, set the automation's Aggregation to "Day".` : '';
  if (!dates.size) return `${name}: skipped (no usable Health Auto Export data${warn || ' recognised'})`;
  importsDirty = true;
  data.imports.push({ id: uid(), at: new Date().toISOString(), name, what: 'days from Apple Health', count: dates.size, range: rangeText(dates) });
  return `${name}: Apple Health (Health Auto Export) — ${plural(dates.size, 'day')} (${[...got].join(', ')}) · ${rangeText(dates)}${warn}`;
}

/* ---- Garmin "Export Your Data" (full account export) ---- */
const GARMIN_JSON = /UDSFile|sleepData/i;
const gDate = v => { if (v && typeof v === 'object') v = v.date || v.calendarDate; return v ? parseDate(String(v)) : null; };
function readGarminJson(text, tally) {
  let j;
  try { j = JSON.parse(text); } catch { return; }
  const visit = (o, depth) => {
    if (!o || typeof o !== 'object' || depth > 6) return;
    if (Array.isArray(o)) { for (const x of o) visit(x, depth + 1); return; }
    // Daily summary: steps and resting heart rate
    if ('totalSteps' in o && o.calendarDate) {
      const k = gDate(o.calendarDate);
      if (k && typeof o.totalSteps === 'number') {
        const d = day(k);
        if (canSet(d, 'steps', 'garmin')) { d.steps = Math.round(o.totalSteps); d.stepsSource = 'garmin'; delete d.stepsVia; }
        if (typeof o.restingHeartRate === 'number') d.restingHR = o.restingHeartRate;
        touch(k); tally.steps.add(k);
      }
      return;
    }
    // Sleep: total of deep + light + REM (awake time not counted)
    if (('deepSleepSeconds' in o || 'lightSleepSeconds' in o) && o.calendarDate) {
      const k = gDate(o.calendarDate);
      const secs = (o.deepSleepSeconds || 0) + (o.lightSleepSeconds || 0) + (o.remSleepSeconds || 0);
      if (k && secs > 0) {
        const d = day(k);
        if (canSet(d, 'sleep', 'garmin')) {
          const sc = o.sleepScores?.overallScore ?? o.sleepScores?.overall?.value;
          d.sleep = { hours: Math.round(secs / 360) / 10, score: typeof sc === 'number' ? sc : null, source: 'garmin' };
        }
        touch(k); tally.sleep.add(k);
      }
      return;
    }
    for (const v of Object.values(o)) if (v && typeof v === 'object') visit(v, depth + 1);
  };
  visit(j, 0);
}
/* ---- Garmin, straight from Garmin (script v2.12+): Health Sync › Garmin › days › <year> › garmin-<date>.json ----
   { source: 'garmin', date, data: { userSummary, dailySummary, steps, sleep, sleepDetail, hrv, hrvReadings, weightDay, weighIns, … } } */
const GARMIN_PARSER = 1;   // bump when this reader changes, so every Garmin day file is read once more
const garminStamp = f => `g${GARMIN_PARSER}:${f.modifiedTime}`;
// First value that's a real positive number (Garmin uses 0, -1 and -2 for "no data").
const gPos = (...a) => a.find(v => typeof v === 'number' && isFinite(v) && v > 0) ?? null;
function readGarminDay(j, tally) {
  const k = parseDate(String(j?.date || '')), x = j?.data;
  if (!k || !x) return;
  const u = x.userSummary || {}, s = x.dailySummary || {}, sl = x.sleep || {}, sd = x.sleepDetail?.dailySleepDTO || {};
  const d = day(k);
  const steps = gPos(x.steps?.totalSteps, u.totalSteps, s.totalSteps);
  if (steps && canSet(d, 'steps', 'garmin')) { d.steps = Math.round(steps); d.stepsSource = 'garmin'; delete d.stepsVia; tally.steps.add(k); }
  const secs = gPos(sl.sleepTimeSeconds, sd.sleepTimeSeconds, (sd.deepSleepSeconds || 0) + (sd.lightSleepSeconds || 0) + (sd.remSleepSeconds || 0));
  if (secs && canSet(d, 'sleep', 'garmin')) {
    const score = gPos(sl.sleepScores?.overall?.value, sl.sleepScores?.overallScore, sd.sleepScores?.overall?.value, sl.overallSleepScore?.value, sl.sleepScore);
    const st = gPos(sl.sleepStartTimestampLocal, sd.sleepStartTimestampLocal);
    d.sleep = { hours: Math.round(secs / 360) / 10, score, source: 'garmin', ...(st ? { start: new Date(st).toISOString().slice(11, 16) } : {}) }; tally.sleep.add(k);
  }
  const w = x.weightDay?.latestWeight || [].concat(x.weighIns || []).pop(), grams = gPos(w?.weight);
  if (grams && canSet(d, 'weight', 'garmin')) { d.weight = Math.round((grams > 1000 ? grams / 1000 : grams) * 22.0462) / 10; d.weightUnit = 'lb'; d.weightSource = 'garmin'; delete d.weightVia; tally.weight.add(k); }
  const rhr = gPos(u.restingHeartRate, s.restingHeartRate, x.heartRate?.restingHeartRate);
  if (rhr) d.restingHR = rhr;
  // Garmin-only measures. Garmin's HRV is overnight RMSSD, not Apple's SDNN, so it's kept as its own measure.
  const g = {}, hrv = gPos(x.hrv?.lastNightAvg, x.hrvReadings?.hrvSummary?.lastNightAvg), bb = gPos(u.bodyBatteryHighestValue, s.bodyBatteryHighestValue), st = gPos(u.averageStressLevel, s.averageStressLevel);
  if (hrv) g.hrvNight = hrv;
  if (bb) g.bodyBattery = bb;
  if (st) g.stress = st;
  if (Object.keys(g).length) { d.garmin = g; tally.recovery.add(k); } else delete d.garmin;
  touch(k);
}
/* ---- Garmin workouts: Health Sync › Garmin › activities › <year> › garmin-activity-<date>-<id>.json ----
   { activityId, date, summary: (Garmin's workout list entry), detail: { summaryDTO, … }, workouts } */
const titleCase = s => String(s || '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
function readGarminActivity(j, tally) {
  const s = j?.summary || {}, sd = j?.detail?.summaryDTO || {}, id = j?.activityId ?? s.activityId;
  const when = String(s.startTimeLocal || sd.startTimeLocal || j?.date || ''), k = parseDate(when);
  if (!k || id == null) return;
  const start = (when.match(/[ T](\d{2}:\d{2})/) || [])[1] || '';
  const type = titleCase(s.activityType?.typeKey || j?.detail?.activityTypeDTO?.typeKey) || 'Workout';
  const secs = gPos(s.duration, sd.duration, s.movingDuration, sd.movingDuration);
  const zones = [1, 2, 3, 4, 5].map(z => Math.round((gPos(s['hrTimeInZone_' + z], sd['hrTimeInZone_' + z]) || 0) / 6) / 10);
  const meters = gPos(s.distance, sd.distance);
  // Strength workouts: Garmin groups the sets by exercise, e.g. BENCH_PRESS × 3 sets, 30 reps.
  const sets = (s.summarizedExerciseSets || []).filter(x => x && (x.sets || x.reps)).map(x => ({ name: titleCase(x.subCategory && x.subCategory !== 'UNKNOWN' ? x.subCategory : x.category), sets: x.sets || null, reps: x.reps || null }));
  const w = {
    id: `garmin|a${id}`, source: 'garmin', garminId: id, type, title: s.activityName || type, start,
    durationMin: secs ? Math.round(secs / 6) / 10 : null,
    distance: meters ? +(settings.units === 'metric' ? meters / 1000 : meters / 1609.344).toFixed(2) : null,
    calories: gPos(s.calories, sd.calories) ? Math.round(gPos(s.calories, sd.calories)) : null,
    avgHR: gPos(s.averageHR, sd.averageHR) ? Math.round(gPos(s.averageHR, sd.averageHR)) : null, maxHR: gPos(s.maxHR, sd.maxHR),
    ...(zones.some(Boolean) ? { zones } : {}),
    ...(gPos(s.activityTrainingLoad, sd.activityTrainingLoad) ? { load: Math.round(gPos(s.activityTrainingLoad, sd.activityTrainingLoad)) } : {}),
    ...(gPos(s.aerobicTrainingEffect, sd.trainingEffect) ? { teAerobic: gPos(s.aerobicTrainingEffect, sd.trainingEffect) } : {}),
    ...(gPos(s.anaerobicTrainingEffect, sd.anaerobicTrainingEffect) ? { teAnaerobic: gPos(s.anaerobicTrainingEffect, sd.anaerobicTrainingEffect) } : {}),
    ...(s.trainingEffectLabel || sd.trainingEffectLabel ? { teLabel: titleCase(s.trainingEffectLabel || sd.trainingEffectLabel) } : {}),
    ...(sets.length ? { sets } : {}),
  };
  // addWorkout keeps this copy over a Garmin CSV or Strava copy of the same workout (same start ±3 min).
  addWorkout(k, w);
  tally.workouts.add(k); if (w.zones || w.load) tally.detail++;
}
function garminDaysSummary(t, files, failed) {
  const all = new Set([...t.steps, ...t.sleep, ...t.weight, ...t.recovery]);
  const parts = [t.sleep.size && plural(t.sleep.size, 'night') + ' of sleep', t.steps.size && plural(t.steps.size, 'day') + ' of steps (only where Apple Health had none)', t.weight.size && plural(t.weight.size, 'weigh-in'), t.recovery.size && plural(t.recovery.size, 'day') + ' of HRV, Body Battery and stress'].filter(Boolean);
  if (all.size) data.imports.push({ id: uid(), at: new Date().toISOString(), name: 'Garmin folder', what: 'Garmin days', count: all.size, range: rangeText(all) });
  return `Garmin folder: read ${plural(files, 'day file')}${parts.length ? ` — ${parts.join(', ')} (${rangeText(all)})` : ' — nothing new (Apple Health or your own entries already cover those days)'}${failed ? ` · ⚠ ${plural(failed, 'file')} couldn't be read and will be tried again` : ''}`;
}
function garminJsonSummary(name, t) {
  const all = new Set([...t.steps, ...t.sleep]);
  if (!all.size) return `${name}: skipped (no Garmin daily steps or sleep found)`;
  importsDirty = true;
  data.imports.push({ id: uid(), at: new Date().toISOString(), name, what: 'Garmin days (steps & sleep)', count: all.size, range: rangeText(all) });
  return `${name}: Garmin export: ${plural(t.steps.size, 'day')} of steps, ${plural(t.sleep.size, 'night')} of sleep (${rangeText(all)})`;
}

function importCsv(name, text, parent) {
  const label = parent ? `${parent} › ${name}` : name;
  text = text.replace(/^﻿/, '');
  const rows = Papa.parse(text, { skipEmptyLines: true }).data;
  if (rows.some(r => /^total activity time$/i.test(String(r[0]).trim())) && rows.some(r => /^average step count$/i.test(String(r[0]).trim())))
    return [`${label}: skipped (this is Garmin's Progress Summary — totals only, with no dates. Export Activities › All Activities › Export CSV instead)`];
  // A Lose It daily report for a day with nothing logged is just the header row (or nothing at all). Say so plainly;
  // the file stays in the Inbox and is checked again each time, like any other skipped file.
  const loseItDay = name.match(/daily report.*?(\d{4})(\d{2})(\d{2})\.csv$/i);
  const loseItHeader = r => { const h = r.map(x => String(x).trim().toLowerCase()); return h.includes('name') && h.some(x => /^calories/.test(x)) && (h.includes('type') || h.includes('meal')); };
  if (loseItDay && (rows.length === 0 || (rows.length === 1 && loseItHeader(rows[0]))))
    return [`${label}: skipped (${LOSEIT_EMPTY(`${loseItDay[1]}-${loseItDay[2]}-${loseItDay[3]}`)})`];
  const KEY = /date|time|activity type|steps|weight|name|calories|score|duration|day/i;
  const hi = rows.findIndex(r => r.length >= 2 && r.some(c => KEY.test(c)) && rows.indexOf(r) < rows.length - 1);
  if (hi < 0) return [`${label}: skipped (didn't recognize the columns)`];
  const headers = rows[hi].map((h, i) => String(h).trim().toLowerCase() || `col${i}`);
  const body = rows.slice(hi + 1).map(r => {
    const o = { _first: String(r[0] ?? '').trim() };
    headers.forEach((h, i) => { o[h] = String(r[i] ?? '').trim(); });
    return o;
  });
  const has = h => headers.includes(h);
  const find = re => headers.find(h => re.test(h));
  const fn = name.toLowerCase();

  let res;
  // Health Auto Export (iPhone app) CSV: "Date/Time, Step Count (count), Resting Heart Rate (count/min), …"
  if (HAE_SIDE_FILE.test(name)) return [`${label}: skipped (Health Auto Export detail file — not needed; the daily summary file has everything)`];
  // (Food logs like Lose It's have a "name" column and nutrition columns too, so only body measures count here.)
  if (!has('name') && (headers.some(h => /^date\/time$/.test(h)) || headers.filter(h => HAE_COLS.some(([re, k]) => !k.startsWith('n:') && re.test(h))).length >= 2)) {
    const r = impHaeCsv(label, headers, body);
    if (r) return [r];
  }
  if (has('activity type') && !has('date')) return [`${label}: skipped (this is Garmin's monthly Activities report — counts only. Use the activity list at connect.garmin.com/modern/activities › Export CSV instead)`];
  if (has('activity type')) res = impGarminActivities(body);
  else if ((has('meal') || (has('type') && find(/^protein|^fat/))) && find(/^calories/) && find(/^name/)) res = impLoseItFood(body, find, name);
  else if (/exercise/.test(fn) && find(/^name/) && find(/calories/)) res = impLoseItExercise(body, find);
  else if (/sleep/.test(fn) || find(/sleep/)) res = impSleep(body, headers, find);
  else if (find(/weight/) && !find(/^steps|steps$/)) res = impWeight(body, headers, find, fn);
  else if (find(/steps/) || /step/.test(fn)) res = impSteps(body, headers, find);
  else return [`${label}: skipped (not a file type Health Sync knows yet — columns: ${headers.slice(0, 6).join(', ')}…)`];

  if (res.empty) return [`${label}: skipped (${res.empty})`];
  if (!res.count) return [`${label}: skipped (found no dated rows to import)`];
  importsDirty = true;
  data.imports.push({ id: uid(), at: new Date().toISOString(), name: label, what: res.what, count: res.count, range: rangeText(res.dates) });
  return [`${label}: ${res.count} ${res.what}${res.dates.size ? ' (' + rangeText(res.dates) + ')' : ''}${res.note ? ' — ' + res.note : ''}`];
}

function impGarminActivities(rows) {
  const dates = new Set(); let count = 0;
  for (const r of rows) {
    const k = parseDate(r['date']);
    if (!k) continue;
    const start = (r['date'].match(/(\d{1,2}:\d{2})/) || [])[1] || '';
    const type = r['activity type'] || 'Activity';
    const w = {
      id: `garmin|${k}|${start}|${type}`, source: 'garmin', type, title: r['title'] || type, start,
      durationMin: parseDuration(r['time'] || r['elapsed time'] || r['moving time']),
      distance: num(r['distance']), calories: num(r['calories']),
      avgHR: num(r['avg hr']), maxHR: num(r['max hr']), steps: num(r['steps']),
    };
    addWorkout(k, w); dates.add(k); count++;
  }
  return { what: 'Garmin activities', count, dates };
}

// Garmin workouts also reach Strava, so the same workout can arrive twice. Workouts from the
// two that start within 3 minutes of each other on the same day are kept once (Garmin's copy wins).
const minsOf = t => { const m = String(t || '').match(/^(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null; };
// Lose It copies in workouts from Garmin, Strava and Apple Health under their names. Those arrive directly, so its copy is skipped.
const LOSEIT_MIRROR = /garmin|strava|healthkit|apple (health|watch)|adjustment/i;
// Lose It's copies don't always say where they came from. An entry with the same minutes (±1) and similar calories as a
// Garmin/Strava workout that day is the same workout under another name.
const sameAsTracked = (w, list) => w.durationMin != null && list.some(x => ['garmin', 'strava'].includes(x.source) && x.durationMin != null && Math.abs(x.durationMin - w.durationMin) <= 1 && (w.calories == null || x.calories == null || Math.abs(w.calories - x.calories) <= Math.max(25, x.calories * 0.25)));
function setLoseItWorkouts(d, items) {
  const rest = d.workouts.filter(w => w.source !== 'loseit');
  d.workouts = rest.concat(items.filter(w => !sameAsTracked(w, rest)));
}
function addWorkout(k, w) {
  const d = day(k);
  const done = () => { d.workouts = d.workouts.filter(x => x.source !== 'loseit' || !sameAsTracked(x, [w])); touch(k); return true; };
  const i = d.workouts.findIndex(x => x.id === w.id);
  if (i >= 0) {
    // Same workout again: update it, but keep details the new copy doesn't have (e.g. calories).
    const old = d.workouts[i];
    d.workouts[i] = Object.fromEntries(Object.keys({ ...old, ...w }).map(key => [key, w[key] ?? old[key]]));
    return done();
  }
  // Copies of one workout, best first: Garmin's own workout file (full detail), Garmin's CSV, Strava.
  const rank = x => !['garmin', 'strava'].includes(x.source) ? 0 : String(x.id).startsWith('garmin|a') ? 3 : x.source === 'garmin' ? 2 : 1;
  const ws = minsOf(w.start);
  const twin = ws == null || !rank(w) ? -1 : d.workouts.findIndex(x => rank(x) && rank(x) !== rank(w) && minsOf(x.start) != null && Math.abs(minsOf(x.start) - ws) <= 3);
  if (twin >= 0) {
    if (rank(w) < rank(d.workouts[twin])) return false;
    d.workouts[twin] = w; return done();
  }
  d.workouts.push(w); return done();
}

/* ---- Withings, read directly by the script (v3.7+): { source: 'withings', measuregrps: [{ date, measures: [{ type, value, unit }] }] } ----
   Apple Health only gets weight, body fat %, BMI and lean mass from Withings; this carries everything the scale measures.
   A day keeps its FIRST weigh-in (the morning one, before food and drink), with the body composition measured with it. */
const WITHINGS_FIELDS = { 1: 'weightKg', 5: 'leanKg', 6: 'fatPct', 8: 'fatKg', 76: 'muscleKg', 77: 'waterKg', 88: 'boneKg', 170: 'visceral', 226: 'bmr', 227: 'metabolicAge' };
function impWithings(name, j) {
  const byDay = {};
  for (const g of j.measuregrps || []) {
    const o = {};
    for (const m of g.measures || []) { const f = WITHINGS_FIELDS[m.type]; if (f && typeof m.value === 'number') o[f] = m.value * 10 ** (m.unit || 0); }
    if (!Object.keys(o).length || !g.date) continue;
    (byDay[dateKey(new Date(g.date * 1000))] ||= []).push({ at: g.date, ...o });
  }
  let nW = 0, nC = 0;
  for (const [k, gs] of Object.entries(byDay)) {
    gs.sort((a, b) => a.at - b.at);
    const first = gs.find(g => g.weightKg != null) || gs[0];
    // Withings sometimes splits one weigh-in into several groups a few seconds apart; join those to it.
    const near = gs.filter(g => Math.abs(g.at - first.at) <= 600), c = Object.assign({}, ...near.reverse(), first);
    const d = day(k), r1 = v => v == null ? undefined : Math.round(v * 10) / 10;
    const comp = { at: new Date(first.at * 1000).toISOString(), weightKg: r1(c.weightKg), fatPct: r1(c.fatPct), fatKg: r1(c.fatKg), leanKg: r1(c.leanKg), muscleKg: r1(c.muscleKg),
      boneKg: r1(c.boneKg), waterKg: r1(c.waterKg), visceral: r1(c.visceral), bmr: c.bmr == null ? undefined : Math.round(c.bmr), metabolicAge: c.metabolicAge == null ? undefined : Math.round(c.metabolicAge), source: 'withings' };
    for (const x of Object.keys(comp)) if (comp[x] === undefined) delete comp[x];
    if (Object.keys(comp).length > 3) { d.comp = comp; nC++; }
    if (c.weightKg != null && canSet(d, 'weight', 'withings')) {
      const unit = d.weightUnit || weightUnit();
      d.weight = Math.round((unit === 'lb' ? c.weightKg * 2.20462 : c.weightKg) * 10) / 10; d.weightUnit = unit; d.weightSource = 'withings'; delete d.weightVia; nW++;
    }
    touch(k);
  }
  const ks = Object.keys(byDay).sort();
  return ks.length ? `${name}: Withings, ${plural(ks.length, 'day')} (${fmtRange(ks[0], ks[ks.length - 1])}): ${plural(nW, 'weigh-in')}, body composition on ${plural(nC, 'day')}` : `${name}: Withings, nothing new`;
}

function impStrava(name, j) {
  const dates = new Set(); let added = 0, dup = 0;
  const dist = m => m == null ? null : +(settings.units === 'metric' ? m / 1000 : m / 1609.344).toFixed(2);
  for (const a of j.activities || []) {
    const s = String(a.start_date_local || ''), k = parseDate(s);
    if (!k) continue;
    const type = String(a.sport_type || 'Workout').replace(/([a-z])([A-Z])/g, '$1 $2');
    const w = {
      id: `strava|${a.id}`, source: 'strava', type, title: a.name || type, start: (s.match(/T(\d{2}:\d{2})/) || [])[1] || '',
      durationMin: a.moving_time != null ? a.moving_time / 60 : null, distance: a.distance ? dist(a.distance) : null,
      calories: a.calories ? Math.round(a.calories) : null, avgHR: a.average_heartrate ? Math.round(a.average_heartrate) : null, maxHR: a.max_heartrate ?? null,
    };
    if (addWorkout(k, w)) added++; else dup++;
    dates.add(k);
  }
  if (!dates.size) return `${name}: skipped (no Strava activities in this file)`;
  importsDirty = true;
  data.imports.push({ id: uid(), at: new Date().toISOString(), name, what: 'Strava activities', count: added, range: rangeText(dates) });
  return `${name}: ${added} Strava activit${added === 1 ? 'y' : 'ies'}${dup ? `, ${dup} already in from Garmin` : ''} (${rangeText(dates)})`;
}

// When a Lose It report was SENT: the script names files "2026-10-19 1029 …" from the email's time.
// Files without that stamp (dragged in by hand) count as sent now.
function reportSentAt(name) {
  const m = String(name || '').match(/(\d{4})-(\d{2})-(\d{2}) (\d{2})(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime() : Date.now();
}
const dayEndsAt = k => { const d = keyToDate(k); d.setDate(d.getDate() + 1); return d.getTime(); };
// Should a report sent at `sent` replace this day's Lose It food? Never with an older report than the one we have.
function takeLoseItDay(d, k, sent) {
  if (d.loseItGen && sent < Date.parse(d.loseItGen)) return false;
  d.loseItGen = new Date(sent).toISOString();
  // The day is final only if the report was sent after the day ended (a Monday weekly report includes a partial "today").
  if (sent >= dayEndsAt(k)) d.loseItAt = d.loseItGen; else delete d.loseItAt;
  return true;
}
// Has the final Lose It report for this day arrived?
function loseItFinal(d, k) {
  const g = d?.loseItAt || d?.loseItGen;
  if (g) return Date.parse(g) >= dayEndsAt(k);
  return !!d?.food?.some(f => f.source === 'loseit');   // days imported before v2.7
}
// Food for a day is partial until its final Lose It report arrives (today always is).
function microsHtml(d, k) {
  const mi = d?.micros; if (!mi) return '';
  const rows = MICROS.filter(m => mi[m.key] != null);
  if (!rows.length) return '';
  return `<details class="micros"><summary class="sub-h" style="margin:14px 0 6px;cursor:pointer">Vitamins and minerals${foodPartial(d, k) ? ' · so far' : ''} <span class="muted" style="text-transform:none;letter-spacing:0;font-weight:500">(from Apple Health · % of daily value)</span></summary>
    <div class="hbars" style="--c:var(--c-cal)">${rows.map(m => { const v = mi[m.key], pct = m.dv ? v / +m.dv * 100 : null; return `<div class="hb"><span class="l">${esc(m.name)}</span><span class="t">${pct != null ? `<i style="width:${Math.min(100, Math.max(2, pct))}%"></i>` : ''}</span><span class="x">${fmtN(v, v < 10 ? 1 : 0)} ${m.u}${pct != null ? ` · ${Math.round(pct)}%` : ''}</span></div>`; }).join('')}</div>
    <p class="muted small" style="margin:6px 0 0">Counts only foods that have vitamin and mineral data in Lose It, so real intake may be higher.</p></details>`;
}
function foodPartial(d, k) {
  if (!d || !k) return false;
  const t = totals(d);
  if (!t.hasFood) return false;
  if (k >= todayKey()) return true;
  if (t.fromHealth) return k >= addDays(todayKey(), -1);
  return (d.food || []).some(f => f.source === 'loseit') && !loseItFinal(d, k);
}
function impLoseItFood(rows, find, name) {
  const c = { date: find(/^date/), name: find(/^name/), meal: find(/^meal/) || find(/^type$/), qty: find(/^quantity/), units: find(/^units?$/), cal: find(/^calories/),
    del: find(/^deleted/), fat: find(/^fat/), satFat: find(/^saturated fat/), protein: find(/^protein/), carbs: find(/^carbohydrates|^carbs/),
    fiber: find(/^fiber/), sugar: find(/^sugar/), chol: find(/^cholesterol/), sodium: find(/^sodium/) };
  const byDay = {}, exByDay = {}, dates = new Set();
  let count = 0, exSkipped = 0;
  // "Deleted" is 0 for normal rows; anything else means Lose It hid or removed it.
  const deleted = r => c.del && r[c.del] !== undefined && !/^(0|false|no)?$/i.test(String(r[c.del]).trim());
  rows.forEach((r, idx) => {
    const k = parseDate(r[c.date] ?? r._first);
    if (!k) return;
    dates.add(k);
    const name = r[c.name] || 'Food', meal = r[c.meal] || '';
    if (/^exercise$/i.test(meal)) {
      // Garmin / Apple Health workouts and calorie adjustments already come in from Garmin and Strava.
      if (deleted(r) || LOSEIT_MIRROR.test(name)) { exSkipped++; return; }
      const q = num(r[c.qty]), u = String(r[c.units] || '').toLowerCase();
      (exByDay[k] ||= []).push({ id: `loseit|${k}|x${idx}`, source: 'loseit', type: name, title: name, durationMin: /hour/.test(u) ? q * 60 : /min/.test(u) ? q : null, calories: Math.abs(num(r[c.cal]) || 0) || null });
      return;
    }
    if (deleted(r)) return;
    (byDay[k] ||= []).push({
      id: `loseit|${k}|${idx}`, source: 'loseit', name, meal,
      qty: num(r[c.qty]), units: r[c.units] || '', calories: num(r[c.cal]) || 0,
      fat: num(r[c.fat]), satFat: num(r[c.satFat]), protein: num(r[c.protein]), carbs: num(r[c.carbs]),
      fiber: num(r[c.fiber]), sugar: num(r[c.sugar]), cholesterol: num(r[c.chol]), sodium: num(r[c.sodium]),
    });
    count++;
  });
  // Nothing but skipped rows (such as Garmin's automatic exercise entries): no food was logged. Change nothing and say so.
  const nEx0 = Object.values(exByDay).reduce((n, a) => n + a.length, 0);
  if (!count && !nEx0 && dates.size) {
    const ks = [...dates].sort();
    return { count: 0, dates, empty: ks.length === 1 ? LOSEIT_EMPTY(ks[0], exSkipped) : `this Lose It report has no food logged for ${rangeText(dates)}${exSkipped ? ` (only ${plural(exSkipped, 'Garmin/Strava exercise row')}, which come in from Garmin and Strava already)` : ''}. It stays in the Inbox and is checked again each time. If you log those days later, export them from loseit.com and drop the file in the Inbox` };
  }
  // A Lose It export is the full log for each day it covers, so it replaces that day's Lose It entries.
  const sent = reportSentAt(name);
  let older = 0;
  for (const k of [...dates]) {
    const d = day(k);
    if (!takeLoseItDay(d, k, sent)) { older++; dates.delete(k); continue; }
    d.food = d.food.filter(f => f.source !== 'loseit').concat(byDay[k] || []);
    setLoseItWorkouts(d, exByDay[k] || []);
    if (byDay[k]?.length) delete d.nutrition;   // per-food nutrients replace the PDF's day totals
    touch(k);
  }
  const nEx = Object.values(exByDay).reduce((n, a) => n + a.length, 0);
  const partial = [...dates].filter(k => sent < dayEndsAt(k));
  return { what: 'Lose It food entries', count, dates, note: [nEx && plural(nEx, 'Lose It workout'), exSkipped && `skipped ${exSkipped} exercise rows already covered by Garmin/Strava`, older && `kept newer reports for ${plural(older, 'day')}`, partial.length && `${fmtDay(partial[0], { month: 'short', day: 'numeric' })} is partial (sent before the day ended)`].filter(Boolean).join(', ') };
}

// Why a Lose It report with no food in it is skipped.
const LOSEIT_EMPTY = (k, exSkipped = 0) => `no food logged on ${fmtDay(k, { weekday: 'short', month: 'short', day: 'numeric' })} in this Lose It report${exSkipped ? ` (only ${plural(exSkipped, 'Garmin/Strava exercise row')}, which come in from Garmin and Strava already)` : ''}. It stays in the Inbox and is checked again each time. If you log that day later, export it from loseit.com and drop the file in the Inbox`;
function impLoseItExercise(rows, find) {
  const c = { date: find(/^date/), name: find(/^name/), qty: find(/^quantity/), units: find(/^units?$/), cal: find(/calories/), del: find(/^deleted/), min: find(/minutes|duration/) };
  const byDay = {}; let count = 0, skipped = 0;
  rows.forEach((r, idx) => {
    const k = parseDate(r[c.date] ?? r._first);
    if (!k) return;
    if (c.del && /^(1|true|yes)$/i.test(r[c.del])) return;
    const name = r[c.name] || 'Exercise';
    if (LOSEIT_MIRROR.test(name)) { skipped++; return; }
    let mins = c.min ? parseDuration(r[c.min], 'hm') : null;
    if (mins == null && c.qty) { const q = num(r[c.qty]), u = (r[c.units] || '').toLowerCase(); mins = /hour/.test(u) ? q * 60 : /min/.test(u) ? q : null; }
    (byDay[k] ||= []).push({ id: `loseit|${k}|${idx}`, source: 'loseit', type: name, title: name, durationMin: mins, calories: num(r[c.cal]) });
    count++;
  });
  for (const [k, items] of Object.entries(byDay)) {
    const d = day(k);
    setLoseItWorkouts(d, items);
    touch(k);
  }
  return { what: 'Lose It exercises', count, dates: new Set(Object.keys(byDay)), note: skipped ? `skipped ${skipped} copied from Garmin, Strava or Apple Health` : '' };
}

function dateCol(headers, find) { return find(/^(date|day|time|timestamp)/) || headers[0]; }

function impWeight(rows, headers, find, fn) {
  const dc = dateCol(headers, find), wc = find(/weight/);
  const source = headers.includes('bmi') || /garmin/.test(fn) ? 'garmin' : 'loseit';
  const dates = new Set(); let count = 0, cur = null;
  for (const r of rows) {
    const k = parseDate(r[dc]) || parseDate(r._first);
    if (k) cur = k;                 // Garmin puts the date on its own row above the time-stamped readings
    const v = num(r[wc]);
    if (v == null || v <= 0 || !cur) continue;
    const unit = /kg/i.test(r[wc] + ' ' + wc) ? 'kg' : 'lb';
    const d = day(cur);
    if (!canSet(d, 'weight', source)) continue;
    d.weight = v; d.weightUnit = unit; d.weightSource = source; delete d.weightVia;
    touch(cur); dates.add(cur); count++;
  }
  return { what: 'weight readings', count, dates };
}

function impSteps(rows, headers, find) {
  const dc = dateCol(headers, find), sc = find(/^steps$|^total steps|steps|^actual/);
  const dates = new Set(); let count = 0;
  for (const r of rows) {
    const k = parseDate(r[dc]) || parseDate(r._first);
    const v = num(r[sc]);
    if (!k || v == null) continue;
    const d = day(k);
    if (!canSet(d, 'steps', 'garmin')) continue;
    d.steps = Math.round(v); d.stepsSource = 'garmin'; delete d.stepsVia;
    touch(k); dates.add(k); count++;
  }
  return { what: 'days of steps', count, dates };
}

function impSleep(rows, headers, find) {
  const dc = dateCol(headers, find), durc = find(/duration|total sleep|sleep time|^sleep$/), sc = find(/score/);
  const dates = new Set(); let count = 0;
  for (const r of rows) {
    const k = parseDate(r[dc]) || parseDate(r._first);
    if (!k) continue;
    const mins = durc ? parseDuration(r[durc], 'hm') : null;
    const score = sc ? num(r[sc]) : null;
    if (mins == null && score == null) continue;
    const d = day(k);
    if (!canSet(d, 'sleep', 'garmin')) continue;
    d.sleep = { hours: mins != null ? Math.round(mins / 6) / 10 : d.sleep?.hours ?? null, score, source: 'garmin' };
    touch(k); dates.add(k); count++;
  }
  return { what: 'nights of sleep', count, dates };
}


/* ---- Lose It "Daily Report" PDF ---- */
// Rebuild the PDF's table rows: text pieces on the same line, grouped into cells by horizontal gaps.
function openPdf(buf) {
  if (!window.pdfjsLib) throw new Error('the PDF reader did not load — check your internet connection');
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  return withTimeout(pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise, 45000, 'the PDF reader did not start — try reloading the app');
}
// Draw each page onto a canvas, so PDFs show even where the browser won't display them inline.
async function renderPdfPages(buf, box) {
  const pdf = await openPdf(buf);
  const wrap = document.createElement('div');
  wrap.className = 'pdf-pages';
  box.prepend(wrap);
  const width = Math.max(320, wrap.clientWidth || box.clientWidth || 800);
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const scale = width / page.getViewport({ scale: 1 }).width;
    const vp = page.getViewport({ scale: scale * Math.min(2, window.devicePixelRatio || 1) });
    const c = document.createElement('canvas');
    c.className = 'pdf-page'; c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
    c.setAttribute('aria-label', `Page ${i} of ${pdf.numPages}`);
    wrap.appendChild(c);
    await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
  }
}
async function pdfLines(buf) {
  const pdf = await openPdf(buf);
  const lines = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const content = await (await pdf.getPage(p)).getTextContent();
    const rows = [];
    for (const it of content.items) {
      if (!it.str || !it.str.trim()) continue;
      const x = it.transform[4], y = it.transform[5];
      let r = rows.find(r => Math.abs(r.y - y) < 3);
      if (!r) rows.push(r = { y, items: [] });
      r.items.push({ x, w: it.width, s: it.str });
    }
    rows.sort((a, b) => b.y - a.y);
    for (const r of rows) {
      r.items.sort((a, b) => a.x - b.x);
      const cells = []; let cur = null;
      for (const it of r.items) {
        const gap = cur ? it.x - (cur.x + cur.w) : Infinity;
        if (gap < 8) { cur.s += (gap > 0.5 && !/\s$/.test(cur.s) ? ' ' : '') + it.s; cur.w = it.x + it.w - cur.x; }
        else cells.push(cur = { ...it });
      }
      lines.push(cells.map(c => c.s.replace(/\s+/g, ' ').trim()).filter(Boolean));
    }
  }
  return lines;
}

async function importPdf(name, buf) {
  const lines = await pdfLines(buf);
  const days = {};
  let k = null, section = '', meal = '';
  const NUT = { 'fat': 'fat', 'saturated fat': 'satFat', 'cholesterol': 'cholesterol', 'sodium': 'sodium', 'carbohydrates': 'carbs', 'fiber': 'fiber', 'sugar': 'sugar', 'sugars': 'sugar', 'protein': 'protein' };
  for (const l of lines) {
    const t = l.join(' ');
    if (t.length > 300) continue;   // long paragraphs (tips, notes) never hold data
    let m = t.match(/Daily Report for (.+)$/i);
    if (m) { k = parseDate(m[1]); section = 'summary'; meal = ''; if (k) days[k] ||= { food: [], ex: [], nut: {}, extra: {} }; continue; }
    if (!k) continue;
    const D = days[k];
    if (/^(Summary|Daily Log|Nutrients|Goals)$/i.test(t)) { section = t.toLowerCase(); continue; }
    if (section === 'summary') {
      m = t.match(/^Weight\s+([\d.,]+)\s*(lbs?|kg)?/i);
      if (m) { D.weight = num(m[1]); D.unit = /kg/i.test(m[2] || '') ? 'kg' : 'lb'; }
      continue;
    }
    if (section === 'daily log') {
      m = t.match(/^(Breakfast|Lunch|Dinner|Snacks?|Exercise)\s*-?[\d,]*$/i);
      if (m) { meal = m[1][0].toUpperCase() + m[1].slice(1).toLowerCase(); continue; }
      if (!meal) continue;
      let nm, qty = '', cal;
      if (l.length >= 3) { nm = l.slice(0, -2).join(' '); qty = l[l.length - 2]; cal = num(l[l.length - 1]); }
      else {
        // Cells ran together: "<name> <amount> <unit> <calories>". Split on spaces (no slow patterns).
        const w = t.split(' ');
        if (w.length < 2 || !/^-?[\d,]+$/.test(w[w.length - 1])) continue;
        cal = num(w.pop());
        const qi = w.length >= 3 && /^(\d+(\.\d+)?|\d+\/\d+)$/.test(w[w.length - 2]) ? w.length - 2 : -1;
        if (qi > 0) { qty = w.slice(qi).join(' '); nm = w.slice(0, qi).join(' '); } else nm = w.join(' ');
      }
      if (cal == null) continue;
      if (meal === 'Exercise') {
        if (LOSEIT_MIRROR.test(nm)) continue;
        D.ex.push({ name: nm, mins: parseDuration(qty, 'hm'), cal });
      } else {
        const q = qty.match(/^([\d.]+|\d+\/\d+)\s+(.*)$/);
        const qn = q ? (q[1].includes('/') ? +q[1].split('/')[0] / +q[1].split('/')[1] : +q[1]) : null;
        D.food.push({ name: nm, meal, qty: qn, units: q ? q[2] : qty, cal });
      }
      continue;
    }
    // Nutrients block and the extra table after it: "Protein 32 g", "Steps 2,203 steps", "Sleep 6 hours 53 minutes hrs"
    const at = t.search(/-?\d/);
    if (at <= 0 || !/^[A-Za-z]/.test(t)) continue;
    const label = t.slice(0, at).replace(/\([^)]*\)/g, '').trim().toLowerCase(), val = t.slice(at);
    if (NUT[label]) { if (D.nut[NUT[label]] == null) D.nut[NUT[label]] = num(val); }
    else if (label === 'steps') D.extra.steps = num(val);
    else if (label === 'sleep') D.extra.sleep = parseDuration(val, 'hm');
    else if (label === 'weight') { D.weight = num(val); D.unit = /kg/i.test(val) ? 'kg' : 'lb'; }
  }
  const keys = Object.keys(days);
  if (!keys.length) return [`${name}: skipped (this PDF isn't a Lose It Daily Report)`];
  let foods = 0;
  const sent = reportSentAt(name);
  for (const key of keys) {
    const D = days[key], d = day(key);
    if (!takeLoseItDay(d, key, sent)) continue;
    d.food = d.food.filter(f => f.source !== 'loseit').concat(D.food.map((f, i) => ({ id: `loseit|${key}|${i}`, source: 'loseit', name: f.name, meal: f.meal, qty: f.qty, units: f.units, calories: f.cal })));
    setLoseItWorkouts(d, D.ex.map((e, i) => ({ id: `loseit|${key}|x${i}`, source: 'loseit', type: e.name, title: e.name, durationMin: e.mins, calories: e.cal })));
    if (Object.keys(D.nut).length) d.nutrition = { ...D.nut, source: 'loseit' }; else delete d.nutrition;
    // Garmin files and hand-entered values win over the copies Lose It shows.
    if (D.weight && canSet(d, 'weight', 'loseit')) { d.weight = D.weight; d.weightUnit = D.unit; d.weightSource = 'loseit'; delete d.weightVia; }
    if (D.extra.steps != null && canSet(d, 'steps', 'loseit')) { d.steps = Math.round(D.extra.steps); d.stepsSource = 'loseit'; delete d.stepsVia; }
    if (D.extra.sleep != null && canSet(d, 'sleep', 'loseit')) d.sleep = { hours: Math.round(D.extra.sleep / 6) / 10, score: null, source: 'loseit' };
    touch(key); foods += D.food.length;
  }
  const dates = new Set(keys);
  importsDirty = true;
  data.imports.push({ id: uid(), at: new Date().toISOString(), name, what: 'Lose It food entries', count: foods, range: rangeText(dates) });
  return [`${name}: ${keys.length} day${keys.length > 1 ? 's' : ''}, ${foods} food entries (${rangeText(dates)})`];
}

const WATCH_PARSER = 4;   // v3.0: sleep formats, source order · bump when Health Auto Export parsing changes, so existing files are re-read once
const withTimeout = (p, ms, why) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(why)), ms))]);

// New or updated Garmin day files (the script rewrites the last 3 days every hour, and adds history in the background).
// The first time, this reads your whole Garmin history, a few files at a time.
// Instead of remembering every Garmin file it has read, the app remembers the newest file time per folder and asks Drive
// only for files changed after it. A file that fails holds the mark back, so it's tried again next time.
function nextGarminMark(listed, failed, prev) {
  if (failed.length) { const t = failed.map(f => Date.parse(f.modifiedTime)).sort((a, b) => a - b)[0]; return new Date(t - 1).toISOString(); }
  return listed.reduce((m, f) => (!m || f.modifiedTime > m ? f.modifiedTime : m), prev || null);
}
async function readGarminFolder() {
  const seen = (data.garminSeen ||= {});
  if (seen.parser !== GARMIN_PARSER) { seen.days = seen.activities = null; seen.parser = GARMIN_PARSER; importsDirty = true; }
  let files = [];
  const listed = {};
  try {
    for (const kind of ['days', 'activities']) {
      listed[kind] = await Drive.garminFiles(kind, seen[kind]);
      // The first time (or after the reader changes), skip files the old per-file list says were already read.
      files.push(...(seen[kind] ? listed[kind] : listed[kind].filter(f => data.watched?.[f.id] !== garminStamp(f))));
    }
  } catch (e) { logImport(`Garmin folder: could not check it — ${e.message}`); if (typeof logError === 'function') logError('Garmin folder', e); return 0; }
  const failedFiles = [];
  const done = () => {
    for (const kind of ['days', 'activities']) { const m = nextGarminMark(listed[kind], failedFiles.filter(f => f.kind === kind), seen[kind]); if (m !== seen[kind]) { seen[kind] = m; importsDirty = true; } }
    // The per-file list is no longer needed for Garmin files.
    for (const [id, v] of Object.entries(data.watched || {})) if (/^g\d+:/.test(v)) { delete data.watched[id]; importsDirty = true; }
  };
  if (!files.length) { done(); return 0; }
  const tally = { steps: new Set(), sleep: new Set(), weight: new Set(), recovery: new Set(), workouts: new Set(), detail: 0 }, queue = files.slice();
  const nDays = files.filter(f => f.kind === 'days').length;
  let n = 0, failed = 0, failedDays = 0;
  const work = async () => {
    for (let f; (f = queue.shift());) {
      try {
        const r = await withTimeout(Drive.api(`files/${f.id}?alt=media`), 60000, 'downloading it took too long');
        (f.kind === 'activities' ? readGarminActivity : readGarminDay)(await r.json(), tally);
      } catch (e) { failed++; failedFiles.push(f); if (f.kind === 'days') failedDays++; if (typeof logError === 'function') logError('Garmin folder', `${f.name}: ${e.message}`); }
      setStatus(`Reading Garmin files: ${++n} of ${files.length}…`, 'busy');
    }
  };
  await Promise.all(Array.from({ length: 6 }, work));
  importsDirty = true;
  done();
  if (nDays) logImport(garminDaysSummary(tally, nDays - failedDays, failedDays));
  const nAct = files.length - nDays, failedAct = failed - failedDays;
  if (nAct) {
    if (tally.workouts.size) data.imports.push({ id: uid(), at: new Date().toISOString(), name: 'Garmin folder', what: 'Garmin workouts', count: nAct - failedAct, range: rangeText(tally.workouts) });
    logImport(`Garmin folder: read ${plural(nAct - failedAct, 'workout file')}${tally.detail ? ` — ${plural(tally.detail, 'workout')} with heart-rate zones or training load` : ''}${tally.workouts.size ? ` (${rangeText(tally.workouts)})` : ''}${failedAct ? ` · ⚠ ${plural(failedAct, 'file')} couldn't be read and will be tried again` : ''}`);
  }
  return files.length - failed;
}
async function checkInbox(quiet = false) {
  if (store !== Drive) return;
  const inboxFiles = await Drive.inbox();
  let watched = [];
  // When the importer for these files improves, look at every file once more (WATCH_PARSER goes up).
  const recheck = (data.watchedParser || 1) < WATCH_PARSER;
  try {
    // Oldest first, so the newest copy of each day wins.
    watched = (await Drive.watchedFiles()).filter(f => recheck || data.watched?.[f.id] !== f.modifiedTime).sort((a, b) => String(a.modifiedTime).localeCompare(String(b.modifiedTime)));
    if (recheck) { data.watchedParser = WATCH_PARSER; importsDirty = true; }
  } catch (e) { logImport(`Health Auto Export folder: could not check it — ${e.message}`); }
  const gDone = await readGarminFolder();
  const files = [...inboxFiles, ...watched];
  if (!files.length) {
    if (gDone) { await persist(); setStatus('Up to date'); }
    else if (!quiet) logImport('Inbox, Health Auto Export and Garmin folders — nothing new to import.');
    return gDone;
  }
  let done = 0, skipped = 0;
  const imported = [];
  for (const [i, f] of files.entries()) {
    const isWatched = watched.includes(f);
    setStatus(`Importing ${files.length > 1 ? `${i + 1} of ${files.length}: ` : ''}${f.name}…`, 'busy');
    try {
      const { name, buf } = await withTimeout(Drive.fetchFile(f), 60000, 'downloading it from Drive took too long');
      const lines = await withTimeout(importBuffer(name, buf), 90000, 'reading it took too long');
      lines.forEach(l => logImport(isWatched ? `${f.folder} › ${l}` : l));
      // Files in Health Auto Export's folder stay where they are (it keeps updating them); remember this version.
      if (isWatched) { data.watched[f.id] = f.modifiedTime; importsDirty = true; if (!lines.every(l => / skipped \(/.test(l))) done++; continue; }
      // Leave unreadable files in the Inbox so they can be checked.
      if (lines.every(l => / skipped \(/.test(l))) { skipped++; continue; }
      imported.push(f); done++;
    } catch (e) {
      skipped++;
      logImport(`${f.name}: could not import — ${e.message}`);
      if (typeof logError === 'function') logError('Import', `${f.name}: ${e.message}`);
    }
  }
  await persist();
  setStatus(skipped ? `${plural(skipped, 'file')} not imported — see Import tab` : 'Up to date', skipped ? 'err' : '');
  if (skipped) toast(`${plural(skipped, 'file')} in your Inbox couldn't be imported. Open the Import tab to see why.`, 7000);
  // Only move files after the data is safely saved.
  for (const f of imported) { try { await Drive.moveToProcessed(f); } catch (e) { logImport(`${f.name}: imported, but could not move it to Processed — ${e.message}`); } }
  return done + gDone;
}

