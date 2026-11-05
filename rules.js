'use strict';
// Health Sync · rules worked out from the data: daily anchors, training load and readiness, weight trend, report-card grades.

const STEPS_BOX = { name: 'Steps', hint: '7,500 steps · 5,000 = half', rule: { type: 'steps', min: 7500, half: 5000 } };
const ANCHOR_DEFAULTS = {
  names: ['Day Pack', 'Dinner Boundary', 'Movement', STEPS_BOX.name],
  hints: ['Shakes at 7, 11 & 3 · daytime calorie budget · or the day’s calorie goal', '8 oz protein · 2 cups veggies · 1 cup starch · one plate · or the day’s calorie goal', '20 min or more of any workout or walk', STEPS_BOX.hint],
  // How each box can be checked automatically from imported data.
  rules: [
    { type: 'budget', meals: 'daytime', max: 1200 },
    { type: 'meal', meal: 'Dinner', max: 750 },
    { type: 'workout', min: 20 },
    STEPS_BOX.rule,
  ],
  target: 23,   // of 28 (about 80%, as 17 of 21 was with three boxes)
  dayGoal: null,   // whole-day calories that tick every meal box; null = the meal boxes' limits added up
  v: 3,
};
const OLD_HINTS = { 'Shakes at 7, 11 & 3 · daytime calorie budget': 0, '8 oz protein · 2 cups veggies · 1 cup starch · one plate': 1, '25–30 min workout, 30-min walk, or the 10-min minimum': 2, '7,500 steps or more': 3 };
const anchorCfg = () => {
  const c = { ...ANCHOR_DEFAULTS, ...(data.anchorCfg || {}) };
  // v2.13: a fourth box for steps. Saved three-box settings get it added once, and the old 17-of-21 goal becomes 23 of 28.
  if (data.anchorCfg && !(data.anchorCfg.v >= 2)) {
    c.names = [...c.names]; c.hints = [...(c.hints || [])]; c.rules = [...(c.rules || [])];
    if (!c.rules.some(r => r?.type === 'steps')) { c.names.push(STEPS_BOX.name); c.hints[c.names.length - 1] = STEPS_BOX.hint; c.rules[c.names.length - 1] = { ...STEPS_BOX.rule }; }
    if (c.target === 17) c.target = 23;
    c.v = 2;
  }
  c.rules = c.names.map((_, i) => c.rules?.[i] || ANCHOR_DEFAULTS.rules[i] || { type: 'none' });
  // v1.3: Day Pack moved from "3 shakes" to a daytime calorie budget — upgrade the old default if it was never customised.
  const r0 = c.rules[0];
  if (r0?.type === 'food' && r0.words === 'kate farms, naked whey, shake' && r0.min === 3) c.rules[0] = { ...ANCHOR_DEFAULTS.rules[0] };
  if (c.hints?.[0] === 'Shakes at 7 AM, 11 AM & 3 PM') c.hints = [ANCHOR_DEFAULTS.hints[0], ...c.hints.slice(1)];
  // v3.4: other ways to fill a box. Saved settings get them once: the day's calorie goal ticks the meal boxes,
  // 5,000 steps is half a box, and any 20 minutes of workouts counts. Reminders still at an old default are updated.
  if (!(c.v >= 3)) {
    c.rules = c.rules.map(r => r.type === 'steps' && r.half == null ? { ...r, half: 5000 } : r.type === 'workout' ? { ...r, min: 20 } : r);
    c.hints = (c.hints || []).map(h => h in OLD_HINTS ? ANCHOR_DEFAULTS.hints[OLD_HINTS[h]] : h);
    c.v = 3;
  }
  if (c.dayGoal == null) c.dayGoal = c.rules.filter(r => r.type === 'budget' && r.meals !== 'all' || r.type === 'meal').reduce((s, r) => s + (r.max || 0), 0) || null;
  return c;
};

// What the imported data says about box i: { ok, why } — or null when the box is check-by-hand only.
function autoAnchor(d, i, c = anchorCfg(), k = d?._k) {
  const r = c.rules[i];
  if (!r || r.type === 'none') return null;
  // Food boxes are only judged once the day is over and its Lose It report has arrived (it lands the next morning).
  if (['food', 'budget', 'meal'].includes(r.type) && k) {
    const t = todayKey();
    if (k >= t) return { ok: false, pending: true, why: 'Waiting for Lose It — today isn’t over yet' };
    if (k === addDays(t, -1) && !loseItFinal(d, k)) return { ok: false, pending: true, why: 'Waiting for yesterday’s Lose It report' };
  }
  if (r.type === 'steps') {
    const s = d?.steps, goal = r.min || 0, today = k && k >= todayKey();
    if (s != null && s >= goal) return { ok: true, why: `${fmtN(s)} steps` };
    const half = r.half && s != null && s >= r.half;
    // Today can still get there: show progress instead of a miss.
    if (today) return { ok: false, half, pending: true, why: s != null ? `${fmtN(s)} of ${fmtN(goal)} steps so far${half ? ' · half a box already' : ''}` : 'no steps yet today' };
    if (half) return { ok: false, half: true, why: `${fmtN(s)} steps · half a box (${fmtN(r.half)}+)` };
    return { ok: false, why: s != null ? `${fmtN(s)} of ${fmtN(goal)} steps` : 'no steps recorded' };
  }
  if (r.type === 'workout') {
    const mins = (d?.workouts || []).reduce((s, w) => s + (w.durationMin || 0), 0);
    if (!d?.workouts?.length) return { ok: false, why: 'no workouts yet' };
    return { ok: mins >= (r.min || 0), why: `${fmtN(mins)} min of exercise` };
  }
  if (r.type === 'food') {
    if (!d?.food?.length) return { ok: false, why: 'no food logged yet' };
    const words = String(r.words || '').toLowerCase().split(',').map(w => w.trim()).filter(Boolean);
    const n = d.food.filter(f => words.some(w => String(f.name).toLowerCase().includes(w))).length;
    return { ok: n >= (r.min || 1), why: `${n} matching food entr${n === 1 ? 'y' : 'ies'}` };
  }
  // Meal boxes: staying within the day's calorie goal ticks them all, whatever the split between meals.
  // Only for a day at or above the calorie floor, so logging half a day (or barely eating) can't tick both.
  if ((r.type === 'budget' || r.type === 'meal') && c.dayGoal && d?.food?.length) {
    const day = d.food.reduce((s, f) => s + (f.calories || 0), 0), floor = rubric().calorieFloor;
    if (day <= c.dayGoal && day >= floor) return { ok: true, why: `Day ${fmtN(day)} of ${fmtN(c.dayGoal)} cal · within the day’s goal` };
  }
  if (r.type === 'budget') {
    if (!d?.food?.length) return { ok: false, why: 'no food logged yet' };
    const daytime = r.meals !== 'all';
    const cal = d.food.filter(f => !daytime || !/^dinner$/i.test(String(f.meal).trim())).reduce((s, f) => s + (f.calories || 0), 0);
    return { ok: cal <= (r.max || 0), why: `${daytime ? 'Daytime' : 'Day'} ${fmtN(cal)} of ${fmtN(r.max)} cal` };
  }
  if (r.type === 'meal') {
    const meal = String(r.meal || 'Dinner').toLowerCase();
    const items = (d?.food || []).filter(f => String(f.meal).toLowerCase().replace(/s$/, '') === meal.replace(/s$/, ''));
    if (!items.length) return { ok: false, why: `no ${r.meal || 'Dinner'} logged yet` };
    const cal = items.reduce((s, f) => s + (f.calories || 0), 0);
    return { ok: cal <= (r.max || 0), why: `${r.meal || 'Dinner'} ${fmtN(cal)} cal` };
  }
  return null;
}
// A box set by hand (true/false) wins; otherwise the imported data decides.
// value: 1 for a ticked box, 0.5 for half credit (5,000 steps), 0 otherwise.
function anchorState(d, i, manual = d?.anchors?.[i], c, k) {
  const auto = autoAnchor(d, i, c, k ?? d?._k);
  if (manual === true || manual === false) return { on: manual, value: manual ? 1 : 0, manual: true, auto };
  const half = !auto?.ok && !!auto?.half;
  return { on: !!auto?.ok, half, value: auto?.ok ? 1 : half ? 0.5 : 0, manual: false, auto, pending: !!auto?.pending };
}
const anchorCount = (d, manual) => { const c = anchorCfg(); return c.names.reduce((n, _, i) => n + anchorState(d, i, manual ? manual[i] : d?.anchors?.[i], c).value, 0); };
const boxN = n => n % 1 ? `${Math.floor(n) || ''}½` : String(n);   // 22.5 boxes → "22½"
const weekStart = k => addDays(k, -((keyToDate(k).getDay() + 6) % 7));   // weeks run Monday–Sunday

const COACH_BACKFILL_FROM = '2026-09-01';

const PLAN_FOODS_DEFAULT = [
  'Kate Farms shake | bottle | 325 | 16 | 12 | | 38 | 6 | 18 | 260',
  'Chicken breast (skinless, cooked) | oz | 47 | 8.8 | 1.0 | 0.3 | 0 | 0 | 0 | 21',
  'Chicken thigh (skinless, cooked) | oz | 59 | 7.4 | 3.1 | 0.9 | 0 | 0 | 0 | 27',
  'Salmon, farmed Atlantic (cooked) | oz | 58 | 6.2 | 3.4 | 0.7 | 0 | 0 | 0 | 17',
  'Shrimp 16/20 (cooked) | oz | 28 | 6.8 | 0.1 | 0 | 0 | 0 | 0 | 31',
  'Halibut (cooked) | oz | 31 | 6.4 | 0.6 | 0.1 | 0 | 0 | 0 | 20',
  'Ground bison 90/10 (cooked) | oz | 60 | 7 | 3 | 1.2 | 0 | 0 | 0 | 25',
  'Southwest salad kit | bag | 140 | 4 | 4 | 0 | 21 | 4 | 7 | 90',
  'Broccoli Crunch salad kit | bag | 195 | 10 | 4 | 0 | 16 | 7 | 7 | 230',
  'Everything salad kit | bag | 200 | 10 | 3 | 0 | 36 | 3 | 7 | 380',
  'Mexican Street Corn salad kit | bag | 175 | 10 | 7 | 2 | 35 | 7 | 7 | 350',
  'Steakhouse Wedge salad kit | bag | 180 | 8 | 9 | 2 | 21 | 4 | 7 | 470',
].join('\n');
const PLAN_DAY_DEFAULT = '2–3 Kate Farms shakes (daytime) + 1 full bag of salad + 8–12 oz cooked protein from the list';
const TARGETS_DEFAULT = { fiberMin: 25, sodiumMax: 2300, satFatPctMax: 10, sugarMax: 50 };

const coachCfg = () => {
  const c = data.coachCfg || {};
  return { apiKey: c.apiKey || '', scriptUrl: c.scriptUrl || '', email: c.email !== false,
    autoReload: { on: c.autoReload?.on !== false, below: c.autoReload?.below ?? 5, amount: c.autoReload?.amount ?? 20 }, planDay: c.planDay || PLAN_DAY_DEFAULT,
    planFoods: c.planFoods || PLAN_FOODS_DEFAULT, targets: { ...TARGETS_DEFAULT, ...(c.targets || {}) }, why: c.why || '' };
};

const reviews = () => (data.reviews ||= {});

const BODY_AREAS = ['Neck', 'Shoulder (left)', 'Shoulder (right)', 'Upper back', 'Lower back', 'Elbow / wrist / hand', 'Hip', 'Glutes', 'Hamstrings', 'Quads', 'Knee (left)', 'Knee (right)', 'Calves / shins', 'Ankle / foot', 'Other'];
const BODY_KIND = { sore: 'Soreness', pain: 'Pain', stiff: 'Stiffness' };

// Training load of one workout: Garmin's own figure when there is one. Otherwise an estimate: heart-rate-zone minutes
// × zone number (Edwards' TRIMP, roughly on Garmin's scale), or minutes × 2 (an easy-to-moderate effort) with no heart rate.
function workoutLoad(w) {
  if (w.load) return { v: w.load, est: false };
  if (w.zones) return { v: Math.round(w.zones.reduce((s, m, i) => s + m * (i + 1), 0)), est: true };
  return { v: Math.round((w.durationMin || 0) * 2), est: true };
}
const dayLoad = k => (getDay(k)?.workouts || []).reduce((s, w) => s + workoutLoad(w).v, 0);
const sumLoad = ks => Math.round(ks.reduce((s, k) => s + dayLoad(k), 0));
const firstWorkoutDay = () => Object.keys(data.days).filter(k => data.days[k].workouts?.length).sort()[0] || null;

// The last 7 days against your usual week (the 4 weeks before them): a common rule of thumb for spotting
// load that rises faster than the body adapts. Needs 4 weeks of history.
function loadStatus(k) {
  const acute = sumLoad(windowKeys(k, 7)), first = firstWorkoutDay();
  if (!first || first > addDays(k, -27)) return { acute, chronic: null, ratio: null, band: 'new', text: 'Needs 4 weeks of workouts to compare against' };
  const chronic = Math.round(sumLoad(windowKeys(addDays(k, -7), 28)) / 4);
  const ratio = chronic > 0 ? Math.round(acute / chronic * 100) / 100 : null;
  const band = ratio == null ? 'new' : ratio > 1.5 ? 'spike' : ratio > 1.3 ? 'building' : ratio < 0.8 ? 'lighter' : 'steady';
  const text = { new: 'No workouts in the 4 weeks before', spike: `A spike: ${ratio}× your usual week. Big jumps like this are when overuse injuries tend to start`, building: `Building fast: ${ratio}× your usual week. Fine for a week, not for several in a row`, lighter: `Lighter than usual: ${ratio}× your usual week`, steady: `In your usual range: ${ratio}× your usual week` }[band];
  return { acute, chronic, ratio, band, text };
}

// Minutes by heart-rate zone: easy (zones 1–2), moderate (3), hard (4–5). Workouts without zones are counted separately.
function intensityMix(ks) {
  const m = { easy: 0, moderate: 0, hard: 0, noHr: 0 };
  for (const k of ks) for (const w of getDay(k)?.workouts || []) {
    if (w.zones) { m.easy += w.zones[0] + w.zones[1]; m.moderate += w.zones[2]; m.hard += w.zones[3] + w.zones[4]; }
    else m.noHr += w.durationMin || 0;
  }
  for (const x in m) m[x] = Math.round(m[x]);
  const zoned = m.easy + m.moderate + m.hard;
  m.hardPct = zoned ? Math.round(m.hard / zoned * 100) : null;
  return m;
}

const isStrength = w => !!w.sets?.length || /strength|weight|lift|resistance|gym/i.test(`${w.type} ${w.title}`);
function strengthSummary(ks) {
  const sessions = [], byEx = {};
  for (const k of ks) for (const w of getDay(k)?.workouts || []) if (isStrength(w)) {
    sessions.push({ k, w });
    for (const s of w.sets || []) { const e = (byEx[s.name] ||= { sets: 0, reps: 0 }); e.sets += s.sets || 0; e.reps += s.reps || 0; }
  }
  return { sessions, byEx: Object.entries(byEx).sort((a, b) => b[1].sets - a[1].sets) };
}

// Pain that keeps coming back, climbs, or is severe. Soreness after training is expected and isn't flagged.
function bodyFlags(k) {
  const ks = windowKeys(k, 14), byArea = {};
  for (const x of ks) for (const b of getDay(x)?.body || []) if (b.kind === 'pain') (byArea[b.area] ||= {})[x] = Math.max(byArea[b.area]?.[x] ?? 0, b.level);
  const out = [];
  for (const [area, days] of Object.entries(byArea)) {
    const dk = Object.keys(days).sort(), levels = dk.map(x => days[x]), last = dk[dk.length - 1];
    if (last < addDays(k, -2)) continue;   // nothing in the last 3 days: settled
    let run = 1; for (let i = dk.length - 1; i > 0 && dk[i - 1] === addDays(dk[i], -1); i--) run++;
    const recent = levels.slice(-3), rising = recent.length === 3 && recent[0] < recent[1] && recent[1] < recent[2];
    const severe = levels[levels.length - 1] >= 7;
    if (severe || run >= 3 || rising) out.push({ area, level: levels[levels.length - 1], severe,
      text: `${area}: pain ${recent.join(' → ')}/10${run >= 3 ? `, ${run} days running` : ''}${rising ? ', getting worse' : ''}.` });
  }
  return out;
}
const BODY_ADVICE = 'Ease off whatever aggravates it. If it isn’t settling within a week or two, or it’s sharp, swollen, numb, or stops you bearing weight, see a physical therapist or doctor.';

// Your usual (the 28 days before) for one measure, or null with fewer than 7 days of it.
function usual(k, f) {
  const v = windowKeys(addDays(k, -1), 28).map(x => f(getDay(x))).filter(x => x != null);
  if (v.length < 7) return null;
  const m = avg(v);
  return { m, sd: Math.sqrt(avg(v.map(x => (x - m) ** 2))), n: v.length };
}
// Ready / normal / take it easy for day k, from last night's recovery against your own usual, recent load and the body log.
// Not medical: a nudge for how hard to train.
function readiness(k) {
  const d = getDay(k), parts = [];
  const add = (score, text) => parts.push({ score, text });
  const garminHrv = d?.garmin?.hrvNight != null;
  const hrvOf = x => garminHrv ? x?.garmin?.hrvNight ?? null : x?.health?.hrv ?? null, hv = hrvOf(d);
  if (hv != null) {
    const u = usual(k, hrvOf);
    if (u) { const z = (hv - u.m) / Math.max(u.sd, u.m * 0.05), t = `HRV ${fmtN(hv)} ms (usual ${fmtN(u.m)})`;
      add(z <= -1 ? -2 : z <= -0.5 ? -1 : z >= 0.5 ? 1 : 0, z <= -0.5 ? `${t}: lower than usual, a sign you haven’t fully recovered` : z >= 0.5 ? `${t}: higher than usual` : `${t}: normal`); }
  }
  const rhr = healthValue(d, 'restingHR');
  if (rhr != null) {
    const u = usual(k, x => healthValue(x, 'restingHR'));
    if (u) { const z = (rhr - u.m) / Math.max(u.sd, 1.5), t = `Resting heart rate ${fmtN(rhr)} (usual ${fmtN(u.m)})`;
      add(z >= 1 || rhr >= u.m + 5 ? -2 : z >= 0.5 ? -1 : z <= -0.5 ? 1 : 0, z >= 0.5 ? `${t}: up, which can mean stress, poor sleep, illness or hard training` : z <= -0.5 ? `${t}: lower than usual` : `${t}: normal`); }
  }
  const sl = sleepHours(d), sc = d?.sleep?.score;
  if (sl != null) {
    let s = sl < 6 ? -2 : sl < 7 ? -1 : sl >= 7.5 ? 1 : 0;
    if (sc != null) s = Math.max(-2, Math.min(1, s + (sc < 50 ? -1 : sc >= 85 ? 1 : 0)));
    add(s, `Sleep ${fmtN(sl, 1)} h${sc != null ? `, score ${sc}` : ''}${s < 0 ? ': short or poor' : s > 0 ? ': good' : ''}`);
  }
  // Body Battery is Garmin's own mix of HRV, stress and sleep, so it's only used when HRV is missing.
  const bb = d?.garmin?.bodyBattery;
  if (bb != null && hv == null) add(bb < 40 ? -1 : bb >= 80 ? 1 : 0, `Body Battery peaked at ${bb}${bb < 40 ? ': low' : ''}`);
  const ls = loadStatus(k);
  if (ls.band === 'spike') add(-1, `Training load: ${ls.text[0].toLowerCase()}${ls.text.slice(1)}`);
  const y = addDays(k, -1), yl = dayLoad(y), usualDay = sumLoad(windowKeys(addDays(k, -2), 28)) / 28;
  const yHard = (getDay(y)?.workouts || []).some(w => (w.teAnaerobic || 0) >= 3 || (w.teAerobic || 0) >= 4);
  if ((usualDay > 0 && yl >= usualDay * 3 && yl >= 100) || yHard) add(-1, `Yesterday was a hard training day (load ${fmtN(yl)})`);
  const body = [...(getDay(y)?.body || []), ...(d?.body || [])];
  const pain = Math.max(0, ...body.filter(b => b.kind === 'pain').map(b => b.level)), sore = Math.max(0, ...body.filter(b => b.kind !== 'pain').map(b => b.level));
  if (sore >= 7) add(-1, `Very sore (${sore}/10)`);
  const flags = bodyFlags(k);
  if (!parts.length && !pain) return null;
  const score = parts.reduce((s, p) => s + p.score, 0);
  const verdict = pain >= 7 || score <= -3 ? 'easy' : score >= 2 && !parts.some(p => p.score <= -2) && pain < 4 ? 'push' : 'normal';
  const painNote = pain >= 4 ? `Pain logged (${pain}/10): keep training away from that area until it settles` : '';
  return { verdict, score, parts, painNote, flags,
    title: { push: 'Ready for a hard session', normal: 'Normal training', easy: 'Take it easy today' }[verdict],
    hint: { push: 'Recovery looks good. A good day for intervals, a long effort or heavy lifting.', normal: 'Train as planned. Keep hard efforts to what the plan calls for.', easy: 'Choose an easy session, mobility work, a walk or rest.' }[verdict] };
}

// Trend weight = exponentially smoothed weight: each weigh-in moves the trend 10% of the way toward it,
// so a salty dinner or a water-heavy morning barely moves it. Days without a weigh-in keep the trend.
const TREND_ALPHA = 0.1;
// After 3 weeks with no weigh-ins the old trend says nothing about now, so it restarts at the next weigh-in, and the
// days inside the gap have no trend (instead of a line joining an old reading to new ones, which hid a fast loss).
const TREND_GAP_DAYS = 21;
const weightCfg = () => {
  const c = data.weightCfg || {};
  return { heightIn: c.heightIn ?? null, goal: c.goal ?? null, start: c.start ?? null, startDate: c.startDate || null,
    step: c.step ?? 5, rate: c.rate ?? 1, events: Array.isArray(c.events) ? c.events : [] };
};
function weightSeries() {
  const unit = weightUnit();
  const toU = d => (d.weightUnit || 'lb') === unit ? d.weight : unit === 'lb' ? d.weight * 2.20462 : d.weight / 2.20462;
  const ks = Object.keys(data.days).filter(k => data.days[k].weight != null).sort();
  if (!ks.length) return { unit, rows: [], byKey: {} };
  const rows = [];
  let t = null, lastK = null;
  for (let k = ks[0]; k <= todayKey(); k = addDays(k, 1)) {
    const d = data.days[k], w = d?.weight != null ? toU(d) : null;
    if (w != null) {
      const gap = lastK ? Math.round((keyToDate(k) - keyToDate(lastK)) / 864e5) : 0;
      if (gap > TREND_GAP_DAYS) for (let i = rows.length - gap + TREND_GAP_DAYS + 1; i < rows.length; i++) rows[i].t = null;
      t = t == null || gap > TREND_GAP_DAYS ? w : t + TREND_ALPHA * (w - t);
      lastK = k;
    }
    rows.push({ k, w, t });
  }
  return { unit, rows, byKey: Object.fromEntries(rows.map(r => [r.k, r])) };
}
const trendOn = (S, k) => { if (!S.rows.length || k < S.rows[0].k) return null; const r = S.byKey[k] || S.rows[S.rows.length - 1]; return r.t; };
// Rate in units per week from the trend over the last n days (negative = losing).
function trendRate(S, days, end = todayKey()) {
  const a = trendOn(S, addDays(end, -days)), b = trendOn(S, end);
  return a == null || b == null ? null : (b - a) / days * 7;
}
// Units a week for forecasts: the trend over 30 days, or (when the trend doesn't go back that far, e.g. just after a
// long gap) a straight line through the last 4 weeks of weigh-ins.
function weightRate(S, k = todayKey()) {
  const r = trendRate(S, 30, k);
  if (r != null) return r;
  const f = weighInSlope(k, 28);
  return f.n >= 4 ? f.rate : null;
}
function weightGoals(S) {
  const c = weightCfg(), first = S.rows.find(r => r.w != null);
  const start = c.start ?? first?.w ?? null, startDate = c.startDate || first?.k || null;
  return { ...c, start, startDate };
}
const daysAgo = n => n === 0 ? 'today' : n === 1 ? 'yesterday' : n < 14 ? `${n} days ago` : n < 60 ? `${Math.round(n / 7)} weeks ago` : `${Math.round(n / 30.4)} months ago`;

// The latest weigh-in and how old it is. Weight moves by your weekly rate and water swings day to day, so after a few
// days the number is a memory rather than a reading: 'fresh' up to 2 days, 'aging' 3–6 days, 'stale' from a week.
// For an old reading, `estimate` is where the trend has probably got to since, at the 30-day rate before it.
function weighInAge(k = todayKey()) {
  const S = weightSeries(), last = [...S.rows].reverse().find(r => r.k <= k && r.w != null);
  if (!last) return null;
  const days = Math.round((keyToDate(k) - keyToDate(last.k)) / 864e5), u = S.unit;
  const level = days <= 2 ? 'fresh' : days < 7 ? 'aging' : 'stale';
  const rate = weightRate(S, last.k), estimate = level !== 'fresh' && rate != null && last.t != null ? last.t + rate * days / 7 : null;
  const age = days < 14 ? plural(days, 'day') : days < 60 ? plural(Math.round(days / 7), 'week') : plural(Math.round(days / 30.4), 'month');
  const note = level === 'fresh' ? ''
    : level === 'aging' ? `${age} old. Step on the scale for a current reading.`
    : `${age} old: you’ve probably changed since then. Step on the scale for a current reading.`;
  return { k: last.k, w: last.w, t: last.t, unit: u, days, ago: daysAgo(days), level, note,
    estimate, estimateText: estimate != null && Math.abs(estimate - last.t) >= 0.1 ? `At your pace before it, your trend is probably about ${fmtN(estimate, 1)} ${u} now.` : '' };
}

// Milestones the way Happy Scale shows them: round numbers every `step` from the start toward the goal (e.g. 270, 265 …
// goal). A milestone is reached the first day a weigh-in gets to it (or the trend does, if that came first), and stays
// reached. Progress and pounds to go are measured from the latest weigh-in, like the scale. Milestones still ahead get
// a forecast day at weightRate. `within` is how far through the current milestone you are.
function weightMilestones(k = todayKey()) {
  const S = weightSeries(), G = weightGoals(S), A = weighInAge(k);
  if (G.goal == null || G.start == null || G.start === G.goal || !A) return null;
  const losing = G.goal < G.start, step = G.step || 5, before = (a, b) => a != null && (losing ? a <= b + 1e-9 : a >= b - 1e-9);
  const ws = [];
  let m = losing ? Math.floor(G.start / step) * step : Math.ceil(G.start / step) * step;
  if (Math.abs(m - G.start) < 0.05) m += losing ? -step : step;
  for (; losing ? m > G.goal + 1e-9 : m < G.goal - 1e-9; m += losing ? -step : step) ws.push(Math.round(m * 10) / 10);
  ws.push(G.goal);
  const cur = A.w, rows = S.rows.filter(r => r.k <= k && (!G.startDate || r.k >= G.startDate));
  const rate = weightRate(S, k), toward = rate != null && Math.abs(rate) > 0.01 && (losing ? rate < 0 : rate > 0);
  const items = ws.map((w, i) => {
    const hit = rows.find(r => before(r.w, w) || before(r.t, w));
    return { w, n: i + 1, goal: i === ws.length - 1, reached: hit ? hit.k : null, eta: !hit && toward ? addDays(k, Math.max(1, Math.round((w - cur) / rate * 7))) : null };
  });
  const ni = items.findIndex(x => !x.reached), next = ni < 0 ? null : items[ni], prevW = ni <= 0 ? G.start : items[ni - 1].w;
  const total = Math.abs(G.start - G.goal), done = Math.max(0, Math.min(total, losing ? G.start - cur : cur - G.start));
  if (next) next.next = true;
  return { unit: S.unit, start: G.start, startDate: G.startDate, goal: G.goal, step, losing, current: cur, trend: trendOn(S, k), rate, items, next,
    reached: items.filter(x => x.reached).length, prevW, toNext: next ? Math.max(0, losing ? cur - next.w : next.w - cur) : 0,
    within: next ? Math.max(0, Math.min(1, (losing ? prevW - cur : cur - prevW) / Math.abs(prevW - next.w))) : 1,
    total, done, frac: done / total, toGo: Math.max(0, total - done) };
}
// Losing faster than about 1% of body weight a week, for weeks, costs muscle as well as fat. The pace is a straight line
// fitted through the actual weigh-ins (the smoothed trend lags by about 10 days, so it would warn far too late).
// 'fast' = over 1% a week across 4 weeks (steady enough despite daily water swings); 'watch' = over 1.25% across the
// last 2 weeks only (noisier, so a higher bar), or over twice your committed rate. Needs 3 weeks of weigh-ins,
// 8 in the last 4 weeks and 6 in the last 2.
function weighInSlope(k, days) {
  const S = weightSeries(), pts = S.rows.filter(r => r.w != null && r.k > addDays(k, -days) && r.k <= k).map(r => [(keyToDate(r.k) - keyToDate(k)) / 864e5, r.w]);
  if (pts.length < 2) return { rate: null, n: pts.length };
  const mx = avg(pts.map(p => p[0])), my = avg(pts.map(p => p[1])), sxx = pts.reduce((s, p) => s + (p[0] - mx) ** 2, 0);
  return { rate: sxx ? pts.reduce((s, p) => s + (p[0] - mx) * (p[1] - my), 0) / sxx * 7 : null, n: pts.length };   // units per week
}
function weightPace(k = todayKey()) {
  const S = weightSeries();
  if (!S.rows.length || S.rows[0].k > addDays(k, -21)) return null;
  const a28 = weighInSlope(k, 28), a14 = weighInSlope(k, 14), t = trendOn(S, k), commit = weightCfg().rate;
  if (t == null || a14.n < 6 || a14.rate == null) return null;
  const r28 = a28.n >= 8 ? a28.rate : null, r14 = a14.rate;
  const pct = r => r == null ? null : Math.round(-r / t * 1000) / 10;   // % of body weight lost per week (positive = losing)
  const p28 = pct(r28), p14 = pct(r14), u = S.unit, f = r => fmtN(Math.abs(r), 1);
  let status = 'ok', text;
  if (p28 != null && p28 > 1) { status = 'fast'; text = `Losing ${f(r28)} ${u} a week over 4 weeks (${p28}% of body weight a week). Past about 1% a week, you lose muscle as well as fat.`; }
  else if (p14 > 1.25) { status = 'watch'; text = `Losing ${f(r14)} ${u} a week over the last 2 weeks (${p14}% of body weight). Fine for a short stretch; if it lasts 4 weeks it’s too fast.`; }
  else if (commit && r14 < 0 && -r14 > commit * 2 && p14 > 0.5) { status = 'watch'; text = `Losing ${f(r14)} ${u} a week over 2 weeks, over twice your committed ${fmtN(commit, 1)} ${u} a week.`; }
  else text = r14 < 0 ? `Losing ${f(r14)} ${u} a week over 2 weeks (${p14}% of body weight): a safe pace.` : `${r14 > 0 ? 'Up' : 'Flat'}: ${r14 > 0 ? '+' : ''}${fmtN(r14, 1)} ${u} a week over 2 weeks.`;
  const fix = status === 'ok' ? '' : 'Eat a little more on the days you’re well under budget, keep protein at or above target, and keep strength training. Those protect muscle while you lose. If it keeps up, check with a doctor or dietitian.';
  return { status, text, fix, rate14: r14, rate28: r28, pct14: p14, pct28: p28 };
}

// The pace alarm is about your health, not your data, so it gets its own chip at the top of the app (♥ Losing too fast)
// instead of counting as a data issue. Tapping it opens the Weight page.
function paceAlert(k = todayKey()) {
  const p = weightPace(k);
  return p && p.status !== 'ok' ? { level: p.status === 'fast' ? 'bad' : 'warn', label: p.status === 'fast' ? 'Losing too fast' : 'Watch your pace', text: p.text } : null;
}

/* ---- alcohol ---- */
// Drinks for a day: typed in by hand first, then Apple Health ("Number of Alcoholic Beverages"), then Lose It foods that are drinks.
const DRINK_RX = /\b(beer|ipa|lager|pilsner|stout|porter|ale|wine|merlot|cabernet|pinot|chardonnay|sauvignon|riesling|ros[eé]|prosecco|champagne|cava|vodka|whiske?y|bourbon|scotch|rum|tequila|mezcal|gin|cocktail|margarita|martini|mojito|negroni|old fashioned|spritz|sangria|hard seltzer|white claw|truly|hard cider|sake|soju)\b/i;
// Not drinks, although the words match.
const NOT_DRINK_RX = /\b(root beer|ginger beer|ginger ale|non[- ]?alcoholic|alcohol[- ]free|\bna\b|0\.0|beer[- ]battered|beer cheese|wine vinegar|vinegar|cooking wine|wine sauce|rum raisin|bourbon chicken|gin(ger)?bread|vodka sauce|marsala|sauce|cake|ice cream|chicken|steak|salmon|fish|shrimp|pork|glaze)\b/i;
function loseItDrinks(d) {
  let n = 0;
  for (const f of d?.food || []) {
    if (!DRINK_RX.test(f.name || '') || NOT_DRINK_RX.test(f.name || '')) continue;
    const q = f.qty, u = String(f.units || '').toLowerCase();
    n += q && q > 0 && q <= 12 && /bottle|can|glass|drink|serving|shot|pint|cup|each|^$/.test(u) ? q : 1;
  }
  return n;
}
const drinksOf = d => d?.drinks ?? d?.health?.drinks ?? (d?.food?.length ? loseItDrinks(d) : null);

/* ---- patterns: what an evening does to the next day ---- */
// For each habit on day d (drinks, a big dinner, a salty day…), compare the next night and morning (sleep, HRV,
// resting heart rate, how you felt, the scale) with days without it. A pattern, not proof: it shows only with at least
// 5 days each way and a difference that is bigger than the day-to-day noise.
const PATTERN_FACTORS = [
  { key: 'drinks', name: 'drinks', test: d => { const n = drinksOf(d); return n == null ? null : n >= 1; }, label: 'evenings with a drink' },
  { key: 'bigDinner', name: 'a big dinner', test: d => { if (!d?.food?.some(f => f.meal === 'Dinner')) return null; const m = (anchorCfg().rules.find(r => r?.type === 'meal' && /dinner/i.test(r.meal)) || {}).max || 750;
    return d.food.filter(f => f.meal === 'Dinner').reduce((s, f) => s + (f.calories || 0), 0) > m; }, label: 'days with a big dinner' },
  { key: 'salty', name: 'a salty day', test: d => { const t = totals(d); return t.hasNutr && t.hasFood ? t.sodium > coachCfg().targets.sodiumMax : null; }, label: 'days over your sodium limit' },
  { key: 'sugary', name: 'a sugary day', test: d => { const t = totals(d); return t.hasNutr && t.hasFood ? t.sugar > coachCfg().targets.sugarMax : null; }, label: 'days over your sugar limit' },
  { key: 'underEat', name: 'under-eating', test: d => { const t = totals(d); return t.hasFood ? t.calIn < rubric().calorieFloor : null; }, label: `days under your calorie floor` },
  { key: 'lateWorkout', name: 'a late workout', test: d => (d?.workouts?.length ? d.workouts.some(w => (minsOf(w.start) ?? 0) >= 19 * 60) : null), label: 'days with a workout after 7 pm' },
];
const PATTERN_OUTCOMES = [
  { key: 'sleep', name: 'sleep', unit: 'h', dp: 1, min: 0.25, of: n => sleepHours(n), better: 1 },
  { key: 'score', name: 'sleep score', unit: '', dp: 0, min: 3, of: n => n?.sleep?.score ?? null, better: 1 },
  { key: 'hrv', name: 'HRV', unit: 'ms', dp: 0, min: 2, of: n => n?.garmin?.hrvNight ?? n?.health?.hrv ?? null, better: 1 },
  { key: 'rhr', name: 'resting heart rate', unit: 'bpm', dp: 0, min: 1, of: n => healthValue(n, 'restingHR'), better: -1 },
  { key: 'energy', name: 'next-day energy', unit: '/5', dp: 1, min: 0.3, of: n => n?.feel?.energy ?? null, better: 1 },
  { key: 'mood', name: 'next-day mood', unit: '/5', dp: 1, min: 0.3, of: n => n?.feel?.mood ?? null, better: 1 },
  { key: 'scale', name: 'the next morning’s weigh-in', unit: 'lb', dp: 1, min: 0.3, of: null, better: -1 },
];
function findPatterns(end, days = 90) {
  const ks = windowKeys(addDays(end, -1), days), out = [];
  for (const F of PATTERN_FACTORS) {
    const hits = [];
    for (const O of PATTERN_OUTCOMES) {
      const yes = [], no = [];
      for (const k of ks) {
        const d = getDay(k), n = getDay(addDays(k, 1)), f = F.test(d);
        if (f == null) continue;
        let v;
        if (O.key === 'scale') v = d?.weight != null && n?.weight != null && (d.weightUnit || 'lb') === (n.weightUnit || 'lb') ? n.weight - d.weight : null;
        else v = O.of(n);
        if (v == null) continue;
        (f ? yes : no).push(v);
      }
      if (yes.length < 5 || no.length < 5) continue;
      const a = avg(yes), b = avg(no), all = [...yes, ...no], m = avg(all), sd = Math.sqrt(avg(all.map(x => (x - m) ** 2)));
      const diff = a - b;
      if (Math.abs(diff) < Math.max(O.min, sd * 0.4)) continue;
      hits.push({ outcome: O.name, key: O.key, unit: O.unit, dp: O.dp, with: a, without: b, diff, worse: diff * O.better < 0, nWith: yes.length, nWithout: no.length, strength: Math.abs(diff) / (sd || 1) });
    }
    if (!hits.length) continue;
    hits.sort((x, y) => y.strength - x.strength);
    const nWith = Math.max(...hits.map(h => h.nWith));
    const parts = hits.slice(0, 3).map(h => {
      const amt = h.key === 'scale' ? `${h.diff > 0 ? '+' : '−'}${fmtN(Math.abs(h.diff), 1)} lb on the scale` : `${h.key === 'sleep' ? (h.diff > 0 ? 'more' : 'less') : h.diff > 0 ? 'higher' : 'lower'} ${h.outcome} (${fmtN(h.with, h.dp)} vs ${fmtN(h.without, h.dp)}${h.unit === '/5' ? '/5' : h.unit ? ' ' + h.unit : ''})`;
      const sg = v => `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmtN(Math.abs(v), 1)}`;
      return h.key === 'scale' ? `${amt} the next morning (${sg(h.with)} vs ${sg(h.without)} lb on average)` : amt;
    });
    out.push({ factor: F.key, label: F.label, nWith, worse: hits[0].worse, strength: hits[0].strength, hits,
      text: `After ${F.label} (${nWith} of them): ${parts.join(', ')}.` });
  }
  return out.sort((a, b) => b.strength - a.strength);
}

/* ================= report cards: grades worked out from the data by fixed rules ================= */
// The app grades; Claude only writes the words. So the same data always gets the same grade, and a GPA means the same
// thing in a week as in a year. Every number below is editable in Settings › Coach › Report card.
const RUBRIC_DEFAULT = { proteinG: 100, calorieFloor: 1500, sessionsPerWeek: 4, sessionMinMinutes: 10, strengthPerWeek: 2, sleepHours: 7, bedtime: '22:00',
  credits: { anchors: 3, nutrition: 3, logging: 1, training: 2, sleep: 2, assignments: 1 } };
const rubric = () => { const r = data.coachCfg?.rubric || {}; return { ...RUBRIC_DEFAULT, ...r, credits: { ...RUBRIC_DEFAULT.credits, ...(r.credits || {}) } }; };
const SUBJECTS = [['anchors', 'Daily anchors'], ['nutrition', 'Nutrition'], ['logging', 'Logging'], ['training', 'Training'], ['sleep', 'Sleep habits'], ['assignments', 'Assignments']];
const GRADE_STEPS = [[97, 'A+', 4], [93, 'A', 4], [90, 'A-', 3.7], [87, 'B+', 3.3], [83, 'B', 3], [80, 'B-', 2.7], [77, 'C+', 2.3], [73, 'C', 2], [70, 'C-', 1.7], [67, 'D+', 1.3], [63, 'D', 1], [60, 'D-', 0.7], [0, 'F', 0]];
const toGrade = score => { const g = GRADE_STEPS.find(([min]) => score >= min - 1e-9); return { grade: g[1], points: g[2] }; };
const GPA_STEPS = [[3.85, 'A'], [3.5, 'A-'], [3.15, 'B+'], [2.85, 'B'], [2.5, 'B-'], [2.15, 'C+'], [1.85, 'C'], [1.5, 'C-'], [1.15, 'D+'], [0.85, 'D'], [0.5, 'D-'], [0, 'F']];
const gpaLetter = gpa => GPA_STEPS.find(([min]) => gpa >= min - 1e-9)[1];
const clamp01 = x => Math.max(0, Math.min(1, x));
const pct = x => Math.round(x * 100);
// Full credit at or past the target; half credit within 10% of it; nothing beyond that.
const atLeast = (v, t) => v >= t ? 1 : v >= t * 0.9 ? 0.5 : 0;
const atMost = (v, t) => v <= t ? 1 : v <= t * 1.1 ? 0.5 : 0;
const hhmm = s => { const m = String(s || '').match(/^(\d{1,2}):(\d{2})/); return m ? +m[1] * 60 + +m[2] : null; };
// Minutes from the target bedtime, either way, across midnight.
const bedOff = (start, target) => { const a = hhmm(start), b = hhmm(target); return a == null || b == null ? null : Math.abs(((a - b + 720) % 1440 + 1440) % 1440 - 720); };

// A subject's score from weighted parts; parts without data (score null) drop out and the rest are re-weighted.
function scoreParts(parts) {
  const live = parts.filter(p => p.score != null), w = live.reduce((s, p) => s + p.weight, 0);
  return w ? Math.round(live.reduce((s, p) => s + p.score * p.weight, 0) / w * 1000) / 10 : null;
}
function gradeSubjects(start, end) {
  const R = rubric(), ks = windowKeys(end, Math.round((keyToDate(end) - keyToDate(start)) / 864e5) + 1).filter(k => k < todayKey());
  const n = ks.length, weeks = n / 7, D = ks.map(k => [k, getDay(k)]), out = {};
  if (!n) return out;
  // Daily anchors: boxes ticked against the weekly goal, scaled to the period.
  { const c = anchorCfg(), got = D.reduce((s, [, d]) => s + anchorCount(d), 0), goal = c.target * weeks;
    out.anchors = { parts: [{ name: 'Boxes ticked vs goal', weight: 1, score: clamp01(got / goal), detail: `${boxN(got)} of a goal of ${Math.round(goal)} (${c.target} a week)` }] }; }
  // Nutrition: food quality on fully logged days. Calories are graded under the anchors (Day Pack, Dinner Boundary).
  { const t = coachCfg().targets, full = D.filter(([k, d]) => totals(d).hasFood && !foodPartial(d, k)).map(([k, d]) => totals(d));
    const share = f => full.length ? full.reduce((s, x) => s + f(x), 0) / full.length : null;
    const hit = f => `${full.filter(x => f(x) === 1).length} of ${full.length} days`;
    const pr = x => atLeast(x.protein, R.proteinG), fi = x => atLeast(x.fiber, t.fiberMin), so = x => atMost(x.sodium, t.sodiumMax);
    const sf = x => x.calIn ? atMost(x.satFat * 9 / x.calIn * 100, t.satFatPctMax) : 0, su = x => atMost(x.sugar, t.sugarMax), fl = x => atLeast(x.calIn, R.calorieFloor);
    const enough = full.length >= Math.max(3, Math.ceil(n * 4 / 7));
    out.nutrition = enough ? { parts: [
      { name: `Protein ≥ ${R.proteinG} g`, weight: 25, score: share(pr), detail: hit(pr) },
      { name: `Fiber ≥ ${t.fiberMin} g`, weight: 20, score: share(fi), detail: hit(fi) },
      { name: `Sodium ≤ ${fmtN(t.sodiumMax)} mg`, weight: 20, score: share(so), detail: hit(so) },
      { name: `Saturated fat ≤ ${t.satFatPctMax}% of calories`, weight: 15, score: share(sf), detail: hit(sf) },
      { name: `Sugars ≤ ${t.sugarMax} g`, weight: 10, score: share(su), detail: hit(su) },
      { name: `Calories ≥ ${fmtN(R.calorieFloor)} (safety floor)`, weight: 10, score: share(fl), detail: hit(fl) }] }
      : { incomplete: `only ${full.length} fully logged day${full.length === 1 ? '' : 's'} (needs ${Math.max(3, Math.ceil(n * 4 / 7))})` }; }
  // Logging: without it, skipping the log on bad days would raise the Nutrition grade.
  { const full = D.filter(([k, d]) => totals(d).hasFood && !foodPartial(d, k)).length;
    out.logging = { parts: [{ name: 'Days fully logged in Lose It', weight: 1, score: full / n, detail: `${full} of ${n} days` }] }; }
  // Training: anything from Garmin or Strava of at least the minimum length is a session.
  { const ws = D.flatMap(([k, d]) => (d?.workouts || []).filter(w => ['garmin', 'strava'].includes(w.source) && (w.durationMin || 0) >= R.sessionMinMinutes).map(w => ({ k, w })));
    const goal = R.sessionsPerWeek * weeks, sGoal = R.strengthPerWeek * weeks, strength = ws.filter(x => isStrength(x.w)).length;
    // Load: share of the period's 7-day blocks that sat in the steady range (half credit for building fast or a bit light).
    const blocks = []; for (let e = end; e >= addDays(start, 6); e = addDays(e, -7)) { const ls = loadStatus(e); if (ls.ratio != null) blocks.push(ls); }
    const loadScore = blocks.length ? blocks.reduce((s, b) => s + (b.ratio >= 0.8 && b.ratio <= 1.3 ? 1 : (b.ratio >= 0.6 && b.ratio < 0.8) || (b.ratio > 1.3 && b.ratio <= 1.5) ? 0.5 : 0), 0) / blocks.length : null;
    const mix = intensityMix(ks), hard = mix.hardPct;
    out.training = { parts: [
      { name: `Sessions (${R.sessionsPerWeek} a week, ${R.sessionMinMinutes}+ min)`, weight: 35, score: clamp01(ws.length / goal), detail: `${ws.length} of ${Math.round(goal)}` },
      { name: `Strength (${R.strengthPerWeek} a week)`, weight: 30, score: clamp01(strength / sGoal), detail: `${strength} of ${Math.round(sGoal)}` },
      { name: 'Load vs usual week (0.8–1.3×)', weight: 20, score: loadScore, detail: blocks.length ? blocks.map(b => b.ratio + '×').reverse().join(', ') : 'needs 4 weeks of history' },
      { name: 'Hard share of zone minutes (≤ 25%)', weight: 15, score: hard == null ? null : hard <= 25 ? 1 : hard <= 35 ? 0.5 : 0, detail: hard == null ? 'no heart-rate zones' : `${hard}% hard` }] }; }
  // Sleep habits: hours asleep and going to bed on time. Needs data for half the nights.
  { const nights = D.filter(([, d]) => sleepHours(d) != null).map(([, d]) => d.sleep), T = R.sleepHours;
    if (nights.length < Math.ceil(n / 2)) out.sleep = { incomplete: `sleep recorded on ${nights.length} of ${n} nights` };
    else {
      const avgH = avg(nights.map(s => s.hours)), offs = nights.map(s => bedOff(s.start, R.bedtime)).filter(x => x != null);
      out.sleep = { parts: [
        { name: `Average sleep (target ${T} h)`, weight: 50, score: clamp01((avgH - (T - 1)) / 1), detail: `${fmtN(avgH, 1)} h` },
        { name: `Nights of ${T} h or more`, weight: 25, score: nights.filter(s => s.hours >= T).length / nights.length, detail: `${nights.filter(s => s.hours >= T).length} of ${nights.length}` },
        { name: `In bed near ${R.bedtime} (±30 min)`, weight: 25, score: offs.length >= Math.ceil(nights.length / 2) ? avg(offs.map(o => clamp01((90 - o) / 60))) : null, detail: offs.length ? `typically ${Math.round(avg(offs))} min off; ${offs.filter(o => o <= 30).length} of ${offs.length} nights within 30 min` : 'no bedtimes recorded' }] };
    }
  }
  for (const [key, name] of SUBJECTS) if (out[key]) out[key].name = name;
  return out;
}
// Finish a card: grade each subject, add the assignments Claude marked, and work out the GPA.
function finishCard(subjects, marks) {
  const R = rubric(), card = { subjects: [], credits: 0, creditsAll: 0 };
  if (marks) subjects.assignments = marks.length ? { name: 'Assignments', parts: [{ name: 'Last period’s assignments', weight: 1, score: marks.reduce((s, m) => s + (m.status === 'done' ? 1 : m.status === 'partly' ? 0.5 : 0), 0) / marks.length, detail: `${marks.filter(m => m.status === 'done').length} done, ${marks.filter(m => m.status === 'partly').length} partly, ${marks.filter(m => m.status === 'missed').length} missed` }] }
    : { name: 'Assignments', incomplete: 'no assignments were set for this period' };
  let pts = 0;
  for (const [key, name] of SUBJECTS) {
    const s = subjects[key]; if (!s) continue;
    const credits = R.credits[key] || 0, score = s.incomplete ? null : scoreParts(s.parts);
    card.creditsAll += credits;
    const g = score == null ? null : toGrade(score);
    card.subjects.push({ key, name, credits, score, grade: g ? g.grade : 'I', points: g?.points ?? null, incomplete: s.incomplete || (score == null ? 'no data' : ''), parts: (s.parts || []).map(p => ({ ...p, score: p.score == null ? null : pct(p.score) })) });
    if (g && credits) { pts += g.points * credits; card.credits += credits; }
  }
  card.gpa = card.credits ? Math.round(pts / card.credits * 100) / 100 : null;
  card.grade = card.gpa == null ? 'I' : gpaLetter(card.gpa);
  return card;
}
// Results, not choices: tracked next to the grades, never graded.
function periodOutcomes(start, end) {
  const ks = windowKeys(end, Math.round((keyToDate(end) - keyToDate(start)) / 864e5) + 1).filter(k => k < todayKey()), D = ks.map(getDay);
  const S = weightSeries(), a = trendOn(S, addDays(start, -1)) ?? trendOn(S, start), b = trendOn(S, ks[ks.length - 1] || end), w = weightCfg();
  const av = f => { const v = D.map(f).filter(x => x != null); return v.length ? Math.round(avg(v) * 10) / 10 : null; };
  const perWeek = a != null && b != null && ks.length ? Math.round((b - a) / ks.length * 7 * 100) / 100 : null;
  return { weight_change: a != null && b != null ? Math.round((b - a) * 10) / 10 : null, weight_unit: S.unit, weight_rate_per_week: perWeek, committed_rate_per_week: w.rate ?? null,
    hrv_overnight_garmin: av(d => d?.garmin?.hrvNight), hrv_apple: av(d => d?.health?.hrv), resting_hr: av(d => healthValue(d, 'restingHR')),
    mood: av(d => d?.feel?.mood), energy: av(d => d?.feel?.energy), stress: av(d => d?.feel?.stress), pain_flags: ks.length ? bodyFlags(ks[ks.length - 1]).map(f => f.text) : [],
    drinks_total: (() => { const v = D.map(drinksOf).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) : null; })(), days_with_drinks: D.filter(d => (drinksOf(d) || 0) >= 1).length,
    weight_loss_pace: (() => { const p = ks.length ? weightPace(ks[ks.length - 1]) : null; return p ? { status: p.status, text: p.text } : null; })() };
}

const LEVELS = { week: 'Weekly', month: 'Monthly', quarter: 'Quarterly', year: 'Yearly', adhoc: 'On demand' };
const lastOfMonth = (y, m) => dateKey(new Date(y, m, 0));   // m is 1-12
// The period of a kind that contains day k: [start, end, key].
function periodOf(kind, k) {
  const [y, m] = k.split('-').map(Number);
  if (kind === 'week') { const s = weekStart(k); return [s, addDays(s, 6), 'week:' + s]; }
  if (kind === 'month') return [`${k.slice(0, 7)}-01`, lastOfMonth(y, m), 'month:' + k.slice(0, 7)];
  if (kind === 'quarter') { const q = Math.ceil(m / 3), sm = (q - 1) * 3 + 1; return [`${y}-${String(sm).padStart(2, '0')}-01`, lastOfMonth(y, sm + 2), `quarter:${y}-Q${q}`]; }
  return [`${y}-01-01`, `${y}-12-31`, 'year:' + y];
}
const prevPeriod = (kind, start) => periodOf(kind, addDays(start, -1));
const periodLabel = (kind, start, end) => kind === 'month' ? keyToDate(start).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  : kind === 'quarter' ? `Q${Math.ceil(+start.slice(5, 7) / 3)} ${start.slice(0, 4)}` : kind === 'year' ? start.slice(0, 4) : fmtRange(start, end);
// Data starts when the logs do, so a quarter or year that began before then is graded from that day.
const dataStart = () => { const ks = Object.keys(data.days).filter(k => data.days[k].food?.length || data.days[k].healthFood).sort(); return ks[0] && ks[0] > COACH_BACKFILL_FROM ? ks[0] : COACH_BACKFILL_FROM; };
const gradedFrom = start => start < dataStart() ? dataStart() : start;
const reportOf = (kind, start) => { const r = reviews()[periodOf(kind, start)[2]]; return r && !r.deleted && r.status === 'done' ? r : null; };
// The cards are rules-based, so any period's card can be worked out on the spot (without assignments).
const quickCard = (start, end) => finishCard(gradeSubjects(gradedFrom(start), end), null);
// Foods behind each nutrition problem over a period, for months and longer (days are too many to send).
function foodDrivers(ks) {
  const by = {};
  for (const k of ks) for (const f of getDay(k)?.food || []) { const e = (by[f.name] ||= { n: 0, cal: 0, sodium: 0, satFat: 0, sugar: 0, protein: 0, fiber: 0 }); e.n++; for (const x of ['sodium', 'satFat', 'sugar', 'protein', 'fiber']) e[x] += f[x] || 0; e.cal += f.calories || 0; }
  // Ranked by total (what drove the period), with the per-serving figure so a rare but heavy food stands out too.
  const top = (x, n = 6) => Object.entries(by).filter(([, e]) => e[x] > 0).sort((a, b) => b[1][x] - a[1][x]).slice(0, n).map(([name, e]) => `${name}: ${fmtN(e[x] / e.n)} per serving × ${e.n} = ${fmtN(e[x])}`);
  return { most_sodium_mg: top('sodium'), most_sat_fat_g: top('satFat'), most_sugar_g: top('sugar'), most_protein_g: top('protein'), most_fiber_g: top('fiber'), most_logged: Object.entries(by).sort((a, b) => b[1].n - a[1].n).slice(0, 10).map(([n, e]) => `${n} (${e.n}×)`) };
}

