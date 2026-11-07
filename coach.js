'use strict';
// Health Sync · the Coach: what Claude is sent, report cards, reviews, your why and reflections.
// One of the app's screen files: classic scripts that share one global scope, loaded in order by index.html.
/* ================= Coach: weekly and on-demand reviews written by Claude ================= */
const COACH_MODEL = 'claude-opus-5-5';
let coachBusy = null;          // key of the review being written right now
let coachProgress = '';

const gradeTone = g => /^[AB]/.test(g || '') ? 'good' : /^C/.test(g || '') ? 'mid' : /^[DF]/.test(g || '') ? 'bad' : 'none';

/* ---- what goes to Claude ---- */
function dayDigest(k) {
  const d = getDay(k), t = totals(d), c = anchorCfg();
  const foods = (d?.food || []).map(f => ({ meal: f.meal || '', name: f.name, amount: f.qty ? `${f.qty} ${f.units || ''}`.trim() : (f.units || ''), cal: Math.round(f.calories || 0),
    protein_g: f.protein ?? null, fiber_g: f.fiber ?? null, sodium_mg: f.sodium ?? null, sat_fat_g: f.satFat ?? null, sugar_g: f.sugar ?? null }));
  const meals = {};
  for (const f of d?.food || []) meals[f.meal || 'Other'] = Math.round((meals[f.meal || 'Other'] || 0) + (f.calories || 0));
  const r = n => n == null ? null : Math.round(n * 10) / 10;
  return {
    date: k, weekday: keyToDate(k).toLocaleDateString('en-US', { weekday: 'short' }),
    food_logged: t.hasFood ? (foodPartial(d, k) ? 'partial so far (the final report has not arrived)' : t.fromHealth ? 'totals only (from Apple Health)' : 'full Lose It log') : 'no',
    calories: t.hasFood ? Math.round(t.calIn) : null,
    nutrients: t.hasNutr ? Object.fromEntries(NUTRIENTS.map(n => [`${n.key}_${n.u}`, r(t[n.key])])) : null,
    calories_by_meal: Object.keys(meals).length ? meals : null,
    vitamins_minerals: d?.micros ? Object.fromEntries(MICROS.filter(m => d.micros[m.key] != null).map(m => [m.name, `${Math.round(d.micros[m.key] * 10) / 10} ${m.u}${m.dv ? ` (${Math.round(d.micros[m.key] / +m.dv * 100)}% DV)` : ''}`])) : null,
    foods: foods.length ? foods : null,
    steps: d?.steps ?? null,
    steps_by_time: (() => { const h = stepsByHour(k); if (!h) return null; const s = (a, b) => Math.round(h.slice(a, b).reduce((x, y) => x + y, 0)); return { before_noon: s(0, 12), noon_to_5pm: s(12, 17), after_5pm: s(17, 24) }; })(),
    sleep_h: sleepHours(d), sleep_score: d?.sleep?.score ?? null, resting_hr: healthValue(d, 'restingHR'), active_cal: healthValue(d, 'activeCal'),
    garmin_overnight_hrv_ms: d?.garmin?.hrvNight ?? null, garmin_body_battery_high: d?.garmin?.bodyBattery ?? null, garmin_avg_stress: d?.garmin?.stress ?? null,
    weight: d?.weight != null ? `${d.weight} ${d.weightUnit || 'lb'}` : null,
    workouts: (d?.workouts || []).map(w => { const l = workoutLoad(w); return { type: w.type || w.title, minutes: Math.round(w.durationMin || 0), calories: w.calories ?? null, distance: w.distance ?? null,
      training_load: l.v || null, load_estimated: l.est, ...(w.zones ? { hr_zone_minutes_1_to_5: w.zones } : {}), ...(w.teLabel ? { garmin_training_effect: `${w.teLabel} (aerobic ${w.teAerobic ?? '?'}, anaerobic ${w.teAnaerobic ?? '?'})` } : {}),
      ...(w.sets?.length ? { strength_sets: w.sets.map(x => `${x.name}: ${x.sets ?? '?'} sets, ${x.reps ?? '?'} reps`) } : {}) }; }),
    body_log: d?.body?.length ? d.body.map(b => `${b.area}: ${BODY_KIND[b.kind] || b.kind} ${b.level}/10${b.note ? ` (${b.note})` : ''}`) : null,
    readiness: (() => { const r = readiness(k); return r ? `${r.title}: ${r.parts.map(p => p.text).concat(r.painNote || []).join('; ')}` : null; })(),
    anchors: Object.fromEntries(c.names.map((nm, i) => { const s = anchorState(d, i, undefined, c, k); return [nm, { checked: s.pending ? 'pending' : s.half ? 'half (counts 0.5)' : s.on, by: s.manual ? 'hand' : 'data', detail: s.auto?.why || '' }]; })),
    mood: d?.feel?.mood ?? null, energy: d?.feel?.energy ?? null, stress: d?.feel?.stress ?? null, tags: d?.feel?.tags?.length ? d.feel.tags : null, notes: d?.feel?.notes || null,
    intimacy: pvOf(d),
    body_composition: compOf(d) ? (() => { const c = compOf(d), u = d.weightUnit || weightUnit(), m = v => v == null ? null : `${fmtN(kgIn(v, u), 1)} ${u}`;
      return { body_fat_pct: c.fatPct ?? null, fat_mass: m(c.fatKg), lean_mass: m(c.leanKg), muscle_mass: m(c.muscleKg), water: m(c.waterKg), bone: m(c.boneKg), visceral_fat_index: c.visceral ?? null, scale_bmr_cal: c.bmr ?? null }; })() : null,
    waist: d?.waist ? `${d.waist.v} ${d.waist.unit}` : null,
    pushups_max_set: d?.pushups ?? null,
  };
}
function periodStats(ks) {
  const D = ks.map(getDay), T = D.map(totals), food = T.filter(t => t.hasFood);
  const v = f => D.map(f).filter(x => x != null);
  const a = arr => arr.length ? Math.round(avg(arr) * 10) / 10 : null;
  const c = anchorCfg();
  return {
    days: ks.length, days_food_logged: food.length,
    anchors: `${boxN(ks.reduce((n, k) => n + anchorCount(getDay(k)), 0))} of ${c.names.length * ks.length}`,
    avg_steps: a(v(d => d?.steps)), avg_sleep_h: a(v(sleepHours)), avg_resting_hr: a(v(d => healthValue(d, 'restingHR'))),
    avg_calories_logged_days: a(food.map(t => t.calIn)), avg_protein_g: a(food.map(t => t.protein)), avg_fiber_g: a(food.map(t => t.fiber)), avg_sodium_mg: a(food.map(t => t.sodium)),
    vitamins_minerals_avg_pct_dv: (() => { const Dm = D.filter(d => d?.micros); if (!Dm.length) return null; return Object.fromEntries(MICROS.filter(m => m.dv).map(m => [m.name, Dm.map(d => d.micros[m.key]).filter(v => v != null)]).filter(([, a]) => a.length).map(([n, a]) => { const m = MICROS.find(x => x.name === n); return [n, Math.round(avg(a) / +m.dv * 100) + '%']; })); })(),
    workouts: D.reduce((n, d) => n + (d?.workouts?.length || 0), 0), exercise_min: Math.round(T.reduce((n, t) => n + t.exMin, 0)),
    weight_trend: (() => { const S = weightSeries(), a = ks.map(k => trendOn(S, k)).find(v => v != null), b = trendOn(S, ks[ks.length - 1]), r = weightRate(S, ks[ks.length - 1]); return a == null || b == null ? null : `${a.toFixed(1)} → ${b.toFixed(1)} ${S.unit} (trend; recent rate ${r == null ? 'n/a' : r.toFixed(2)} ${S.unit}/week)`; })(),
    weight_first_last: (() => { const w = D.filter(d => d?.weight != null); return w.length ? `${w[0].weight} → ${w[w.length - 1].weight} ${w[0].weightUnit || 'lb'}` : null; })(),
    intimacy: intimacySummary(ks),
    loss_mix: (() => { const m = lossMix(ks[0], ks[ks.length - 1]); return m ? m.text : null; })(),
    waist: (() => { const a = ks.map(k => getDay(k)?.waist).filter(Boolean); return a.length ? `${a[0].v} → ${a[a.length - 1].v} ${a[0].unit}` : null; })(),
    pushups: (() => { const a = ks.map(k => getDay(k)?.pushups).filter(v => v != null); return a.length ? a.join(' → ') : null; })(),
    strength_sessions: strengthSummary(ks).sessions.length,
    learned_burn: (() => { const B = learnedBurn(ks[ks.length - 1]); return B.ok ? { burn_cal_per_day: B.burn, average_eaten: B.intake, weight_change_per_week: Math.round(B.lbWk * 10) / 10 } : null; })(),
    phase: (() => { const p = phaseOf(ks[ks.length - 1]); return p.kind === 'lose' ? 'losing' : p.kind === 'practice' ? `maintenance practice (2 weeks at about ${p.cal} cal)` : `maintaining (range ${weightPlan().goal - weightPlan().range}–${weightPlan().goal + weightPlan().range}, about ${p.cal} cal)`; })(),
  };
}
function buildDigest(start, end, opts = {}) {
  const n = Math.round((+keyToDate(end) - +keyToDate(start)) / 864e5) + 1, ks = windowKeys(end, n), c = anchorCfg(), cc = coachCfg();
  const prior = []; for (let i = 1; i <= 4; i++) { const e = addDays(start, -1 - (i - 1) * n); prior.push({ period: fmtRange(addDays(e, -(n - 1)), e), ...periodStats(windowKeys(e, n)) }); }
  const prev = Object.values(reviews()).filter(r => r.kind === 'week' && r.end < start && r.status === 'done').sort((a, b) => b.end.localeCompare(a.end))[0];
  return {
    period: { kind: opts.kind || 'week', start, end, label: fmtRange(start, end) },
    plan: {
      written_plan: data.plan?.text || null,
      daily_food_plan: cc.planDay,
      plan_foods: cc.planFoods.split('\n').map(l => l.trim()).filter(Boolean).map(l => { const [name, unit, cal, protein, fat, sat, carbs, fiber, sugar, sodium] = l.split('|').map(x => x.trim()); return { name, per: unit, cal, protein_g: protein, fat_g: fat, sat_fat_g: sat, carbs_g: carbs, fiber_g: fiber, sugar_g: sugar, sodium_mg: sodium }; }),
      daily_anchors: c.names.map((nm, i) => ({ name: nm, reminder: c.hints[i] || '', auto_check_rule: c.rules[i] })),
      weekly_anchor_goal: `${c.target} of ${c.names.length * 7}`,
      weight_goal: (() => { const w = weightCfg(); return w.goal == null ? null : { goal: w.goal, committed_rate_per_week: w.rate, events: w.events }; })(),
      nutrition_targets: { fiber_g_min: cc.targets.fiberMin, sodium_mg_max: cc.targets.sodiumMax, sat_fat_pct_of_calories_max: cc.targets.satFatPctMax, sugars_g_max: cc.targets.sugarMax },
    },
    this_period: periodStats(ks),
    training: (() => { const ls = loadStatus(end), mix = intensityMix(ks), st = strengthSummary(ks);
      return { load_last_7_days_vs_usual_week: ls.ratio == null ? ls.text : `${ls.acute} vs usual ${ls.chronic} (${ls.ratio}×): ${ls.text}`,
        weekly_load_last_6_weeks: Array.from({ length: 6 }, (_, i) => { const e = addDays(end, -7 * (5 - i)); return { week_ending: e, load: sumLoad(windowKeys(e, 7)) }; }),
        intensity_minutes_this_period: mix, strength_sessions_this_period: st.sessions.length, strength_sets_by_exercise: st.byEx.slice(0, 12).map(([n, e]) => `${n}: ${e.sets} sets, ${e.reps} reps`),
        pain_flags: bodyFlags(end).map(f => f.text) }; })(),
    previous_periods_same_length: prior,
    last_weekly_review: prev ? { period: fmtRange(prev.start, prev.end), grade: prev.grade, headline: prev.headline, focus_given: prev.focus } : null,
    days: ks.map(dayDigest),
    user_question: opts.question || null,
  };
}

const COACH_SYSTEM = `You are the coach inside Health Sync, a personal health app. Each review covers one period of the user's own data: food logged in Lose It, steps/sleep/heart rate/HRV from Garmin (directly and via Apple Health), workouts from Garmin and Strava with heart-rate zones and training load, a body log of soreness and pain, mood notes, and the daily "anchor" habit boxes from their plan. You write a review they read in the app and by email.

intimacy (on days and in this_period.intimacy) comes from two private marks the user logs: who started it (user or partner) and whether it happened. A declined day is one the user started and it didn't happen. Treat declines as weighing on the user's mood and attitude: compare the mood, energy and stress on and after declined days with other days (mood_after_declined vs mood_other_days), and say so plainly when it shows. Note who starts it how often, without judging either person. Refer to it discreetly as intimacy, never in explicit terms, in a sentence or two, and only when there is something to say.

Voice: matter-of-fact and specific. No flattery, no cheerleading, no filler. State what happened with the numbers that show it. Be blunt only when something was genuinely bad (for example, most days missed or a target missed by a wide margin), and even then stay constructive. Write to the user as "you".

Judge against THEIR plan (anchors, daily food plan, budgets, targets in the data), not generic advice. A day with no food logged is missing data, not a failure: say how much is missing, and grade only what can be judged. Never invent numbers; use only what is in the data, and say "about" for estimates.

Grade: a letter A to F with + or - allowed. Base it mainly on anchor completion against the weekly goal, then nutrition against targets, movement and sleep consistency, and how complete the logging was. grade_reason says why in 2-4 sentences with the key numbers.

Narrative: a short story of the period in plain prose, as long as it needs to be and no longer. Separate paragraphs with a blank line.

Nutrition: check the mix, not just calories: protein (as a share of calories), fiber, sodium, saturated fat (% of calories), sugars, against the targets. Name the specific logged foods driving any problem. For each real problem, suggest swaps that stay inside the plan's guardrails (the daily food plan, the anchor rules such as the daytime calorie budget and the one-plate dinner, the plan foods list first, then foods the user already logs). Give approximate numbers for the swap. If nothing is off this period, leave swaps empty rather than padding. This is coaching, not medical advice; if something looks risky (for example very low calories several days running), say so plainly and suggest checking with a doctor or dietitian.

Weight: judge it by weight_trend (a smoothed trend weight) and its weekly rate, never by a single weigh-in; day-to-day swings of 1-4 lb are mostly water, sodium and food in transit, so mention a jump only to explain it (for example after high-sodium days). Compare the rate with the plan's weight goal and committed rate when present.

Vitamins and minerals come from Apple Health and only count foods that have that data in Lose It, so treat them as a minimum. Mention only clear, consistent shortfalls (for example potassium or magnesium well under 50% of daily value most days) and suggest plan-friendly foods that supply them; don't recommend supplements beyond suggesting the user ask their doctor.\n\nTraining and recovery (fill training.summary, training.recovery and training.next_week; leave them empty strings if there are no workouts or recovery data): judge training against the period's load (training.load_last_7_days_vs_usual_week: around 0.8-1.3x is steady, above 1.5x is a spike, a common rule of thumb for overuse risk), the intensity mix (most endurance time easy, roughly 20% hard; a high hard share week after week is hard to recover from), and strength work (two sessions a week is a common minimum for keeping muscle, especially while losing weight). Recovery: use each day's readiness, sleep, resting heart rate and HRV against the person's own usual, and connect them to the training (for example a hard day followed by low HRV). Body log: soreness after training is normal; pain that repeats, rises or is 7+/10 is not. For pain_flags, say plainly to ease off what aggravates it and to see a physical therapist or doctor if it doesn't settle; never diagnose. next_week: one or two concrete training suggestions that fit the plan (for example 'keep this week's load, move the hard session after a good night'), not a full programme.\n\nIf last_weekly_review is present, check whether its focus items were followed. focus: at most 3 concrete actions for the next period. If user_question is present, answer it directly in question_answer using the data; otherwise return an empty string.`;

const REVIEW_SCHEMA = {
  type: 'object', additionalProperties: false,
  required: ['grade', 'grade_reason', 'headline', 'narrative', 'went_well', 'fell_short', 'working', 'not_working', 'nutrition', 'training', 'focus', 'question_answer'],
  properties: {
    grade: { type: 'string', enum: ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'] },
    grade_reason: { type: 'string' }, headline: { type: 'string' }, narrative: { type: 'string' },
    went_well: { type: 'array', items: { type: 'string' } }, fell_short: { type: 'array', items: { type: 'string' } },
    working: { type: 'array', items: { type: 'string' } }, not_working: { type: 'array', items: { type: 'string' } },
    nutrition: { type: 'object', additionalProperties: false, required: ['summary', 'flags', 'swaps'], properties: {
      summary: { type: 'string' },
      flags: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['nutrient', 'status', 'detail'], properties: { nutrient: { type: 'string' }, status: { type: 'string', enum: ['low', 'high', 'ok'] }, detail: { type: 'string' } } } },
      swaps: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['instead_of', 'try', 'why'], properties: { instead_of: { type: 'string' }, try: { type: 'string' }, why: { type: 'string' } } } },
    } },
    training: { type: 'object', additionalProperties: false, required: ['summary', 'recovery', 'next_week'], properties: { summary: { type: 'string' }, recovery: { type: 'string' }, next_week: { type: 'string' } } },
    focus: { type: 'array', items: { type: 'string' } }, question_answer: { type: 'string' },
  },
};

/* ---- Report cards: weekly, monthly, quarterly, yearly (and on demand) ---- */
const REPORT_SYSTEM = `You are the coach inside Health Sync, a personal health app. You write a report card the user reads in the app and by email. The data is their own: food logged in Lose It, steps, sleep, heart rate and HRV from Garmin and Apple Health, workouts from Garmin and Strava (heart-rate zones, training load, strength sets), a body log of soreness and pain, mood notes, and the daily "anchor" habit boxes from their plan.

THE GRADES ARE ALREADY DECIDED. The app worked out every subject's grade and the GPA from the data with fixed rules (card.subjects, each with its parts, scores and details). Never change, question, soften or restate a different grade. Explain each grade with the numbers in its parts. The one thing you judge is assignments (see below).

Voice: matter-of-fact, specific, unvarnished. No flattery, no cheerleading, no filler, no "great job". The user has asked not to be glazed. Write to them as "you". Every sentence should carry a number, a named food, a day or a concrete action.

For each subject in card.subjects, write:
- praise: what genuinely went well, with the number. If nothing did, return an empty string. Never invent praise to balance criticism.
- criticism: the biggest specific shortfall and its cost, with the number (for example the day, food or habit that did it). Empty only if the subject was close to perfect.
- suggestion: one concrete, doable change for next period that fits their plan.
For a subject graded I (incomplete), say in criticism what data is missing, and leave praise empty.

summary: the period in plain prose. A week: 3-4 sentences. A month: one paragraph. A quarter: two or three paragraphs, including the best and worst month. A year: four to six paragraphs, including most improved subject, biggest slide, and how it compares with last year if that's given. Lead with what matters most, not with the GPA.

outcomes_comment: weight, HRV, resting heart rate and mood are results, not graded. Connect them to the graded habits (for example "the weeks you slept under 6.5 h were the weeks HRV dropped"). Judge weight by the trend and its weekly rate against committed_rate_per_week, never by one weigh-in. Mention pain_flags plainly: ease off what aggravates it, see a physical therapist or doctor if it doesn't settle; never diagnose.

Nutrition detail (nutrition.summary, flags, swaps): name the logged foods driving any problem, and suggest swaps within the plan (daily food plan, anchor rules, plan foods first, then foods they already log), with approximate numbers. Empty swaps if nothing is off. Vitamins and minerals from Apple Health are a minimum; mention only clear, consistent shortfalls. Not medical advice: if something looks risky (very low calories several days running, a weight-loss rate well over 1% of body weight a week, rising pain), say so and suggest a doctor or dietitian.

Assignments: each next assignment names one measure, the number that should move if it works: ${Object.entries(ASSIGN_MEASURES).map(([k, m]) => `${k} (${m.name.toLowerCase()})`).join(', ')}, or none. The app compares it before and after, and the user taps whether it helped. assignment_results are recent finished assignments with that change and their answer: build on what worked, and don't set again what didn't. previous_assignments are what the last report at this level set. Mark each one done, partly or missed in assignments_review, with the evidence from the data (numbers, days). Be strict: "partly" means real but incomplete progress. Then set next_assignments: 1-3 concrete, checkable actions for the next period (a year: 3 goals for next year). You may carry an unfinished one forward: set carries to its index in previous_assignments (0-based), otherwise -1. An assignment whose carried count is already 2 may only be carried again with a reason (why it's still the most important thing); otherwise retire it in retired with a reason. Never silently drop one: every previous assignment that isn't done must be either carried or retired.

your_why is what the user is doing this for, in their own words. Where it fits, connect the period to it (for example how a habit serves or works against it), once or twice per report. Don't quote it back every paragraph, and don't moralise.

your_reflections are the user's own notes on the week: what got in the way and what helped. Use them. If something outside their control explains a shortfall (illness, travel, family), say so in that subject's criticism and make the suggestion fit it. The grades stay as they are. Build on what they say helped.

patterns_last_90_days are rules-based comparisons of evenings against the next day (for example drinks against sleep and HRV). Mention one only when it explains something in this period, and call it a pattern, not proof. intimacy (on days and in this_period.intimacy) comes from two private marks the user logs: who started it (user or partner) and whether it happened. A declined day is one the user started and it didn't happen. Treat declines as weighing on the user's mood and attitude: compare the mood, energy and stress on and after declined days with other days (mood_after_declined vs mood_other_days), and say so plainly when it shows. Note who starts it how often, without judging either person. Refer to it discreetly as intimacy, never in explicit terms, in a sentence or two, and only when there is something to say. outcomes.weight_loss_pace: if its status is fast or watch, say so plainly in outcomes_comment, with the fix (eat a little more on very low days, keep protein and strength work).

Body: body_composition (per day, from the Withings scale) and this_period.loss_mix say what the weight lost was made of. Losing lean mass fast (over about 30% of the loss) is the main risk of fast weight loss: say so plainly, and tie it to protein and strength_sessions. Scale body composition swings with water, so judge it over weeks. waist (weekly) and pushups (monthly) back that up: a shrinking waist and steady push-ups mean fat is coming off and muscle is holding. learned_burn is what the user actually burns, from their own food log and weigh-ins; use it when calories come up. phase says whether they're losing, practising maintenance (2 weeks at their burn on purpose, so holding steady is the goal and a small rise from water is expected) or maintaining (staying inside their range is the goal).

If question is present, answer it directly in question_answer with the data; otherwise return an empty string. headline: one line, under 12 words, the most important thing about the period.`;
const SUBJECT_TEXT = { type: 'object', additionalProperties: false, required: ['praise', 'criticism', 'suggestion'], properties: { praise: { type: 'string' }, criticism: { type: 'string' }, suggestion: { type: 'string' } } };
// Built when used: SUBJECTS is defined further down the file.
const reportSchema = () => ({
  type: 'object', additionalProperties: false,
  required: ['headline', 'summary', 'subjects', 'outcomes_comment', 'nutrition', 'assignments_review', 'next_assignments', 'retired', 'question_answer'],
  properties: {
    headline: { type: 'string' }, summary: { type: 'string' },
    subjects: { type: 'object', additionalProperties: false, required: SUBJECTS.map(s => s[0]), properties: Object.fromEntries(SUBJECTS.map(s => [s[0], SUBJECT_TEXT])) },
    outcomes_comment: { type: 'string' },
    nutrition: REVIEW_SCHEMA.properties.nutrition,
    assignments_review: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['assignment', 'status', 'evidence'], properties: { assignment: { type: 'string' }, status: { type: 'string', enum: ['done', 'partly', 'missed'] }, evidence: { type: 'string' } } } },
    next_assignments: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['text', 'carries', 'reason', 'measure'], properties: { text: { type: 'string' }, carries: { type: 'integer' }, reason: { type: 'string' }, measure: { type: 'string', enum: [...Object.keys(ASSIGN_MEASURES), 'none'] } } } },
    retired: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['assignment', 'reason'], properties: { assignment: { type: 'string' }, reason: { type: 'string' } } } },
    question_answer: { type: 'string' },
  },
});
function reportDigest(kind, start, end, subjects, opts) {
  const from = gradedFrom(start), ks = windowKeys(end, Math.round((+keyToDate(end) - +keyToDate(from)) / 864e5) + 1).filter(k => k < todayKey());
  const prevAll = reportOf(kind, prevPeriod(kind, start)[0]);
  const prevCard = prevAll?.card || (kind !== 'adhoc' ? (() => { const [a, b] = prevPeriod(kind, start); return b >= dataStart() ? quickCard(a, b) : null; })() : null);
  const base = buildDigest(from, end, { kind: kind === 'adhoc' ? 'adhoc' : kind, question: opts.question });
  const card = finishCard(JSON.parse(JSON.stringify(subjects)), null);
  const d = { level: LEVELS[kind], period: { start, end, label: periodLabel(kind, start, end), graded_from: from !== start ? from : undefined, days: ks.length },
    card: { gpa_before_assignments: card.gpa, subjects: card.subjects.filter(s => s.key !== 'assignments').map(s => ({ subject: s.name, grade: s.grade, score: s.score, credits: s.credits, incomplete: s.incomplete || undefined, parts: s.parts })) },
    previous_period: prevCard ? { gpa: prevCard.gpa, grades: Object.fromEntries(prevCard.subjects.map(s => [s.name, s.grade])) } : null,
    outcomes: periodOutcomes(from, end), plan: base.plan, training: base.training, totals: base.this_period,
    previous_assignments: opts.prevAssignments.map((a, i) => ({ index: i, text: a.text, times_carried_already: a.carried || 0, measure: a.measure || null })),
    assignment_results: assignmentResults(kind, start).slice(0, 6),
    your_why: coachCfg().why || null,
    your_reflections: (() => { const out = []; for (let w = weekStart(from); w <= end; w = addDays(w, 7)) { const r = reflections()[w]; if (r && (r.inWay || r.helped)) out.push({ week: fmtRange(w, addDays(w, 6)), what_got_in_the_way: r.inWay || null, what_helped: r.helped || null }); } return out.length ? out : null; })(),
    patterns_last_90_days: findPatterns(end).slice(0, 6).map(p => p.text),
    question: opts.question || null };
  if (kind === 'week' || kind === 'adhoc') d.days = base.days;
  else {
    d.food_drivers = foodDrivers(ks);
    const sub = { month: 'week', quarter: 'month', year: 'quarter' }[kind];
    const parts = []; for (let s = periodOf(sub, start)[0]; s <= end; s = addDays(periodOf(sub, s)[1], 1)) { const [a, b] = periodOf(sub, s), r = reportOf(sub, a), c = r?.card || quickCard(a, b > end ? end : b);
      parts.push({ period: periodLabel(sub, a, b), gpa: c.gpa, grades: Object.fromEntries(c.subjects.map(x => [x.name, x.grade])), headline: r?.headline || null, summary: r?.summary || r?.grade_reason || null }); }
    d[`${sub}s`] = parts;
    if (kind === 'year') d.months_gpa = Array.from({ length: 12 }, (_, i) => { const [a, b] = periodOf('month', `${start.slice(0, 4)}-${String(i + 1).padStart(2, '0')}-01`); return b < from ? null : { month: periodLabel('month', a, b), gpa: (reportOf('month', a)?.card || quickCard(a, b)).gpa }; }).filter(Boolean);
    if (kind !== 'month') { const ly = `${+start.slice(0, 4) - 1}${start.slice(4)}`, [a, b] = periodOf(kind, ly); if (b >= dataStart()) { const c = quickCard(a, b); d.same_period_last_year = { gpa: c.gpa, grades: Object.fromEntries(c.subjects.map(x => [x.name, x.grade])) }; } }
  }
  return d;
}
// Finished assignments at this level, newest first: what moved, and whether the user said it helped.
function assignmentResults(kind, before) {
  return Object.values(reviews()).filter(r => r.kind === kind && r.status === 'done' && !r.deleted && r.start < before && r.marks?.length).sort((a, b) => b.start.localeCompare(a.start))
    .flatMap(r => r.marks.filter(m => m.status !== 'missed').map(m => ({ period: periodLabel(r.kind, r.start, r.end), assignment: m.assignment, status: m.status,
      change: m.change ? `${m.change.name} ${fmtN(m.change.before, m.change.dp)} → ${fmtN(m.change.after, m.change.dp)} ${m.change.unit}` : null, user_said_it_helped: m.helped || null })));
}
// Assignments set by the last report at the same level (weeks follow weeks, months follow months…).
const prevAssignmentsFor = (kind, start) => kind === 'adhoc' ? [] : (reportOf(kind, prevPeriod(kind, start)[0])?.assignments || []);

// Streams the answer so long reviews never time out; onText receives the length written so far.
/** @param {{ system: string, user: string, schema: any, effort?: string, maxTokens?: number, onText?: (n: number) => void, what?: string }} o */
async function callClaude({ system, user, schema, effort = 'medium', maxTokens = 16000, onText, what = 'Coach' }) {
  const key = coachCfg().apiKey;
  if (!key) throw new Error('Add your Anthropic API key in Settings › Coach first.');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01',
      'anthropic-beta': 'server-side-fallback-2026-07-01', 'anthropic-dangerous-direct-browser-access': 'true' },
    body: JSON.stringify({ model: COACH_MODEL, max_tokens: maxTokens, stream: true, fallbacks: 'default', system,
      output_config: { effort, format: { type: 'json_schema', schema } }, messages: [{ role: 'user', content: user }] }),
  });
  if (!res.ok) {
    let msg = `error ${res.status}`;
    try { const j = await res.json(); msg = j.error?.message || msg; } catch {}
    if (res.status === 401) msg = 'the API key was rejected. Check it in Settings › Coach.';
    if (res.status === 402 || /credit|billing/i.test(msg)) msg = 'your Anthropic account is out of credit. Add credit at console.anthropic.com.';
    throw new Error('Claude: ' + msg);
  }
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = '', text = '', stop = null, textIdx = new Set(), usage = {}, model = COACH_MODEL;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
      const line = chunk.split('\n').find(l => l.startsWith('data:'));
      if (!line) continue;
      let ev; try { ev = JSON.parse(line.slice(5)); } catch { continue; }
      if (ev.type === 'message_start') { usage = { ...(ev.message?.usage || {}) }; model = ev.message?.model || model; }
      else if (ev.type === 'message_delta' && ev.usage) Object.assign(usage, Object.fromEntries(Object.entries(ev.usage).filter(([, v]) => v != null)));
      if (ev.type === 'content_block_start' && ev.content_block?.type === 'text') textIdx.add(ev.index);
      else if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta' && textIdx.has(ev.index)) { text += ev.delta.text; onText?.(text.length); }
      else if (ev.type === 'message_delta' && ev.delta?.stop_reason) stop = ev.delta.stop_reason;
      else if (ev.type === 'error') throw new Error('Claude: ' + (ev.error?.message || 'stream error'));
    }
  }
  const cost = logUsage(what, model, usage);   // logged even if the answer is unusable, since the tokens were still used
  if (stop === 'refusal') throw new Error('Claude declined to write this review. Try Regenerate.');
  if (stop === 'max_tokens') throw new Error('The review was cut off. Try Regenerate.');
  let out;
  try { out = JSON.parse(text); } catch { throw new Error('Claude returned something unreadable. Try Regenerate.'); }
  Object.defineProperty(out, '_cost', { value: cost, enumerable: false });
  return out;
}

/* ---- usage and estimated balance ---- */
// $ per million tokens: input, output, cache read, cache write. Fallback models are priced as themselves.
const PRICES = { 'claude-opus-5-5': [4, 20, 0.2, 5], 'claude-opus-5': [5, 25, 0.5, 6.25], 'claude-opus-4-8': [5, 25, 0.5, 6.25], 'claude-sonnet-5-5': [2, 10, 0.2, 2.5] };
function logUsage(what, model, u) {
  const p = PRICES[model] || PRICES[COACH_MODEL];
  const inT = u.input_tokens || 0, outT = u.output_tokens || 0, cr = u.cache_read_input_tokens || 0, cw = u.cache_creation_input_tokens || 0;
  const cost = (inT * p[0] + outT * p[1] + cr * p[2] + cw * p[3]) / 1e6;
  (data.coachUsage ||= []).push({ id: uid(), at: new Date().toISOString(), type: 'call', what, model, in: inT + cr + cw, out: outT, cost: Math.round(cost * 10000) / 10000 });
  coachDirty = true;
  return cost;
}
function usageSummary() {
  const ev = (data.coachUsage || []).slice().sort((a, b) => a.at.localeCompare(b.at));
  const month = todayKey().slice(0, 7);
  const spentMonth = ev.filter(e => e.type === 'call' && e.at.slice(0, 7) === month).reduce((n, e) => n + e.cost, 0);
  const spentAll = ev.filter(e => e.type === 'call').reduce((n, e) => n + e.cost, 0);
  // Anthropic's auto-reload tops the account up when it drops below a threshold; mirror that so the estimate stays right.
  const ar = coachCfg().autoReload;
  let bal = null, reloads = 0;
  for (const e of ev) {
    if (e.type === 'set') bal = e.amount;
    else if (e.type === 'credit') bal = (bal || 0) + e.amount;
    else if (e.type === 'call' && bal != null) { bal -= e.cost; if (ar.on && bal < ar.below) { bal += ar.amount; reloads++; } }
  }
  return { spentMonth, spentAll, balance: bal, calls: ev.filter(e => e.type === 'call'), reloads, autoReload: ar };
}
const money = v => v == null ? '—' : v < 1 && v > -1 ? `${Math.round(v * 100)}¢` : `$${v.toFixed(2)}`;
async function addCredit(type) {
  const el = type === 'credit' ? $('#cu-add') : $('#cu-set'), v = num(el.value);
  if (v == null || v < 0) { toast('Enter an amount in dollars first.'); return; }
  (data.coachUsage ||= []).push({ id: uid(), at: new Date().toISOString(), type, amount: v });
  coachDirty = true; el.value = '';
  await savePersist(); renderCoachSettings(); renderCoach();
  toast(type === 'credit' ? `Added $${v.toFixed(2)} of credit.` : `Balance set to $${v.toFixed(2)}.`);
}

/* ---- writing a review ---- */
const loggedDays = ks => ks.filter(k => totals(getDay(k)).hasFood).length;
async function writeReview(key, { kind, start, end, question = '', email = true, force = false, rewrite = '' }) {
  const from = gradedFrom(start);
  const ks = windowKeys(end, Math.round((+keyToDate(end) - +keyToDate(from)) / 864e5) + 1);
  const old = reviews()[key];
  const now = new Date().toISOString();
  const base = { key, kind, start, end, question, createdAt: now, note: old?.note || '', basis: reviewBasis(from, end),
    ...(force ? { forced: true } : {}), ...(rewrite ? { rewroteWhy: rewrite, rewroteAt: now } : {}) };
  const logged = loggedDays(ks);
  // A week (or a range) with food logged on under half its days isn't graded unless asked; longer periods always are.
  if (!force && (kind === 'week' || kind === 'adhoc') && logged < Math.ceil(ks.length / 2)) {
    reviews()[key] = { ...base, status: 'incomplete', logged, days: ks.length };
    coachDirty = true; await savePersist(); renderCoach(); return;
  }
  coachBusy = key; coachProgress = `Grading ${LEVELS[kind].toLowerCase()} · ${periodLabel(kind, start, end)}…`; renderCoach();
  // Tell other computers this one is writing it (only for a first write; a regenerate keeps the old review visible).
  if (!old || old.status !== 'done') { reviews()[key] = { ...base, status: 'writing' }; coachDirty = true; savePersist(); }
  try {
    const subjects = gradeSubjects(from, end), prevAssignments = prevAssignmentsFor(kind, start);
    const digest = reportDigest(kind, start, end, subjects, { question, prevAssignments });
    const out = await callClaude({ system: REPORT_SYSTEM, schema: reportSchema(), what: `${LEVELS[kind]} report · ${periodLabel(kind, start, end)}`,
      user: `Write the ${LEVELS[kind].toLowerCase()} report card for ${periodLabel(kind, start, end)}.${old?.note ? `\nThe user's note about this period: ${old.note}` : ''}\n\nData (JSON):\n${JSON.stringify(digest)}`,
      onText: n => { coachProgress = `Writing your ${LEVELS[kind].toLowerCase()} report… ${Math.round(n / 5)} words`; const el = $('#coach-progress'); if (el) el.textContent = coachProgress; } });
    // Assignments: Claude's marks become the graded subject; carried ones count how many times they've moved.
    // Each assignment's measure over the period it was set in, against the period it was for.
    const [pa, pb] = kind === 'adhoc' ? [] : prevPeriod(kind, start), beforeKs = pa ? windowKeys(pb, Math.round((+keyToDate(pb) - +keyToDate(pa)) / 864e5) + 1) : [];
    const marks = prevAssignments.length ? prevAssignments.map((a, i) => { const m = out.assignments_review?.[i] ? { ...out.assignments_review[i], assignment: a.text } : { assignment: a.text, status: 'missed', evidence: 'not marked' };
      const ch = a.measure && a.measure !== 'none' ? measureChange(a.measure, beforeKs, ks) : null; return ch ? { ...m, change: ch } : m; }) : [];
    const card = finishCard(subjects, marks);
    const assignments = (out.next_assignments || []).slice(0, 3).map(a => { const p = prevAssignments[a.carries]; const carried = p ? (p.carried || 0) + 1 : 0;
      return { text: a.text, carried, measure: a.measure && a.measure !== 'none' ? a.measure : null, reason: a.reason || (carried > 2 ? '(carried again without a stated reason)' : '') }; });
    const { next_assignments, assignments_review, ...words } = out;
    const r = { ...base, ...words, status: 'done', logged, days: ks.length, gradedFrom: from !== start ? from : undefined, card, grade: card.grade, gpa: card.gpa,
      marks, assignments, focus: assignments.map(a => a.text), stats: periodStats(ks),
      cost: Math.round((old?.status === 'done' ? (old.cost || 0) : 0) * 10000 + out._cost * 10000) / 10000 };
    reviews()[key] = r;
    coachDirty = true;
    await savePersist();
    if (email && coachCfg().email && coachCfg().scriptUrl) sendReviewEmail(r).catch(e => { logError('Email', e); toast('Report saved, but the email failed: ' + e.message, 7000); });
    toast(`${LEVELS[kind]} report ready: ${card.grade}${card.gpa != null ? ` (GPA ${card.gpa.toFixed(2)})` : ''}`);
  } catch (e) {
    if (reviews()[key]?.status === 'writing') { delete reviews()[key]; coachDirty = true; savePersist(); }
    logError('Coach', `${LEVELS[kind]} report ${periodLabel(kind, start, end)}: ${e.message}`);
    throw e;
  } finally { coachBusy = null; coachProgress = ''; renderCoach(); }
}
const savePersist = () => persist().catch(e => toast(e.message, 6000));

async function sendReviewEmail(r) {
  const cc = coachCfg();
  const li = a => a?.length ? `<ul>${a.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '';
  if (r.card) {
    const w = r.subjects || {}, label = r.kind === 'week' || r.kind === 'adhoc' ? fmtRange(r.start, r.end) : periodLabel(r.kind, r.start, r.end);
    const html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:640px;line-height:1.55;color:#14161c">
      <div style="color:#666;font-size:13px">${esc(LEVELS[r.kind])} report card · ${esc(label)}</div>
      <h2 style="margin:2px 0 4px">${esc(r.grade)}${r.gpa != null ? ` · GPA ${r.gpa.toFixed(2)}` : ''} · ${esc(r.headline)}</h2>
      ${r.question_answer ? `<p><b>Your question:</b> ${esc(r.question)}<br>${esc(r.question_answer)}</p>` : ''}
      ${(r.summary || '').split(/\n\s*\n/).map(p => `<p style="font-family:Georgia,serif">${esc(p)}</p>`).join('')}
      <table style="border-collapse:collapse;width:100%;font-size:14px">${r.card.subjects.map(sub => { const t = w[sub.key] || {};
        return `<tr><td style="padding:8px 6px;border-top:1px solid #e6e7ec;vertical-align:top;width:120px"><b>${esc(sub.name)}</b><br><span style="font-size:20px;font-weight:700">${esc(sub.grade)}</span></td><td style="padding:8px 6px;border-top:1px solid #e6e7ec">${sub.incomplete ? `<i>Incomplete: ${esc(sub.incomplete)}</i><br>` : ''}${t.praise ? `<b style="color:#0f7a3a">Praise:</b> ${esc(t.praise)}<br>` : ''}${t.criticism ? `<b style="color:#c23a39">Criticism:</b> ${esc(t.criticism)}<br>` : ''}${t.suggestion ? `<b>Next:</b> ${esc(t.suggestion)}` : ''}</td></tr>`; }).join('')}</table>
      ${r.outcomes_comment ? `<p><b>Results (not graded):</b> ${esc(r.outcomes_comment)}</p>` : ''}
      ${r.nutrition?.swaps?.length ? `<p><b>Swaps that fit your plan</b></p>${li(r.nutrition.swaps.map(x => `${x.instead_of} → ${x.try} (${x.why})`))}` : ''}
      <p><b>Assignments</b></p>${li(r.assignments.map(a => a.text + (a.carried ? ` (carried ${a.carried}×)` : '')))}
      <p style="font-size:13px"><a href="${esc(location.origin + location.pathname)}#coach">Open the full report card in Health Sync</a></p></div>`;
    await fetch(cc.scriptUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'email', subject: `Health Sync: ${LEVELS[r.kind].toLowerCase()} report · ${label} — ${r.grade}${r.gpa != null ? ` (${r.gpa.toFixed(2)})` : ''}`, html }) });
    r.emailedAt = new Date().toISOString(); r.updatedAt = r.emailedAt; coachDirty = true; await savePersist();
    return;
  }
  const html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:640px;line-height:1.55;color:#14161c">
    <h2 style="margin:0 0 4px">${esc(r.grade)} · ${esc(r.headline)}</h2><div style="color:#666;font-size:13px">${esc(fmtRange(r.start, r.end))}</div>
    ${r.question_answer ? `<p><b>Your question:</b> ${esc(r.question)}<br>${esc(r.question_answer)}</p>` : ''}
    <p><b>Why ${esc(r.grade)}:</b> ${esc(r.grade_reason)}</p>
    ${r.narrative.split(/\n\s*\n/).map(p => `<p style="font-family:Georgia,serif">${esc(p)}</p>`).join('')}
    ${r.nutrition?.summary ? `<p><b>Nutrition:</b> ${esc(r.nutrition.summary)}</p>` : ''}
    ${r.nutrition?.swaps?.length ? `<p><b>Swaps that fit your plan</b></p>${li(r.nutrition.swaps.map(s => `${s.instead_of} → ${s.try} (${s.why})`))}` : ''}
    ${r.training?.summary || r.training?.recovery ? `<p><b>Training and recovery:</b> ${esc([r.training.summary, r.training.recovery].filter(Boolean).join(' '))}${r.training.next_week ? `<br><b>Next week:</b> ${esc(r.training.next_week)}` : ''}</p>` : ''}
    <p><b>Focus</b></p>${li(r.focus)}
    <p style="font-size:13px"><a href="${esc(location.origin + location.pathname)}#coach">Open the full review in Health Sync</a></p></div>`;
  await fetch(cc.scriptUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify({ action: 'email', subject: `Health Sync: ${r.kind === 'week' ? 'week of' : 'review'} ${fmtRange(r.start, r.end)} — ${r.grade}`, html }) });
  r.emailedAt = new Date().toISOString(); r.updatedAt = r.emailedAt; coachDirty = true; await savePersist();
}

// Weekly reviews are written from Monday at noon, so Sunday's final Lose It report has time to arrive.
const COACH_HOUR = 12;
const reviewDueAt = sun => { const d = keyToDate(addDays(sun, 1)); d.setHours(COACH_HOUR, 0, 0, 0); return d.getTime(); };
// What a review was based on, day by day: [day, calories logged (null = none), workouts]. Used to notice later changes.
const reviewBasis = (start, end) => windowKeys(end, Math.round((+keyToDate(end) - +keyToDate(start)) / 864e5) + 1)
  .map(k => { const d = getDay(k), t = totals(d); return [k, t.hasFood ? Math.round(t.calIn) : null, (d?.workouts || []).length]; });
// Has the data under a review changed enough to rewrite it? Returns the reason, or '' for no (small changes don't count).
function basisChange(was, now) {
  if (!was?.length || !now?.length) return '';
  const old = Object.fromEntries(was.map(b => [b[0], b])), why = [];
  for (const [k, cal, wo] of now) {
    const o = old[k]; if (!o) continue;
    const day = fmtDay(k, { weekday: 'short', month: 'short', day: 'numeric' });
    if (o[1] == null && cal != null) why.push(`${day}: food added (${fmtN(cal)} cal)`);
    else if (o[1] != null && cal == null) why.push(`${day}: food removed`);
    else if (o[1] != null && Math.abs(cal - o[1]) >= REWRITE_MIN_CAL) why.push(`${day}: ${cal > o[1] ? '+' : '−'}${fmtN(Math.abs(cal - o[1]))} cal`);
    if (wo > (o[2] || 0)) why.push(`${day}: ${plural(wo - o[2], 'workout')} added`);
  }
  return why.join(' · ');
}
const REWRITE_MIN_CAL = 150;   // a day's logged calories must change by at least this much
const REWRITES_PER_RUN = 3;    // at most this many rewrites each time it checks (every 10 minutes while open)
// On opening the app (and every few minutes while it's open): write any missing weekly reviews, oldest first,
// and rewrite any whose data has changed since (for example food logged late in Lose It, or a re-exported week).
async function autoReviews() {
  if (!coachCfg().apiKey || coachBusy) return;
  const lastMon = addDays(weekStart(todayKey()), -7);
  let ws = weekStart(COACH_BACKFILL_FROM);
  if (ws < COACH_BACKFILL_FROM) ws = addDays(ws, 7);
  let rewrites = 0;
  for (; ws <= lastMon; ws = addDays(ws, 7)) {
    const key = 'week:' + ws, r = reviews()[key];
    if (r && !r.deleted && (r.status === 'done' || r.status === 'incomplete')) {
      const now = reviewBasis(ws, addDays(ws, 6));
      // Reviews written before v2.11 don't know their data yet: remember it now, and compare from here on.
      if (!r.basis) { r.basis = now; coachDirty = true; savePersist(); continue; }
      const why = basisChange(r.basis, now);
      if (!why || rewrites >= REWRITES_PER_RUN) continue;
      rewrites++;
      try { await writeReview(key, { kind: 'week', start: ws, end: addDays(ws, 6), email: false, force: !!r.forced, rewrite: why }); }
      catch (e) { toast(e.message, 8000); return; }
      continue;
    }
    if (r?.status === 'writing' && Date.now() - Date.parse(r.createdAt) < 10 * 60e3) continue;   // another device is on it
    const sun = addDays(ws, 6), sd = getDay(sun);
    if (Date.now() < reviewDueAt(sun)) { coachProgress = `Last week's review will be written today at noon, once Sunday's Lose It report is in`; renderCoach(); break; }
    // From noon, wait for Sunday's final Lose It report, but no later than Tuesday.
    const ready = (sd && loseItFinal(sd, sun) && totals(sd).hasFood) || todayKey() >= addDays(sun, 2);
    if (!ready) { coachProgress = `Waiting for ${fmtDay(sun, { month: 'short', day: 'numeric' })}'s final Lose It report before writing that week's review`; renderCoach(); break; }
    if (coachProgress.startsWith('Last week') || coachProgress.startsWith('Waiting')) coachProgress = '';
    try { await writeReview(key, { kind: 'week', start: ws, end: sun, email: ws === lastMon }); }
    catch (e) { toast(e.message, 8000); return; }
  }
  // Then months, quarters and years, once each period is over and its last day's Lose It report is final.
  for (const kind of ['month', 'quarter', 'year']) {
    for (let [a, b, key] = periodOf(kind, dataStart()); b < todayKey(); [a, b, key] = periodOf(kind, addDays(b, 1))) {
      const r = reviews()[key];
      if (r?.deleted) continue;
      if (r?.status === 'writing' && Date.now() - Date.parse(r.createdAt) < 10 * 60e3) continue;
      if (r?.status === 'done') {
        // Rewrite when a grade has changed since (late food logs, Garmin history arriving…).
        if (!r.card || rewrites >= REWRITES_PER_RUN) continue;
        const now = quickCard(a, b), was = Object.fromEntries(r.card.subjects.map(x => [x.key, x.grade]));
        const why = now.subjects.filter(x => x.key !== 'assignments' && was[x.key] && was[x.key] !== x.grade).map(x => `${x.name} ${was[x.key]} → ${x.grade}`).join(' · ');
        if (!why) continue;
        rewrites++;
        try { await writeReview(key, { kind, start: a, end: b, email: false, rewrite: why }); } catch (e) { toast(e.message, 8000); return; }
        continue;
      }
      const dueAt = keyToDate(addDays(b, 1)).setHours(COACH_HOUR, 0, 0, 0), lastDay = getDay(b);
      if (Date.now() < dueAt) break;
      if (!((lastDay && loseItFinal(lastDay, b) && totals(lastDay).hasFood) || todayKey() >= addDays(b, 2))) break;
      try { await writeReview(key, { kind, start: a, end: b, email: b >= addDays(todayKey(), -7) }); }
      catch (e) { toast(e.message, 8000); return; }
    }
  }
}

/* ---- Coach tab ---- */
let coachView = 'cards';
function reportHtml(r, compact) {
  const c = r.card, w = r.subjects || {}, prev = r.kind !== 'adhoc' ? reportOf(r.kind, prevPeriod(r.kind, r.start)[0]) : null;
  const was = prev?.card ? Object.fromEntries(prev.card.subjects.map(x => [x.key, x])) : {};
  const ytd = r.kind !== 'adhoc' && r.kind !== 'year' ? quickCard(`${r.end.slice(0, 4)}-01-01`, r.end) : null;
  const trend = s => { const p = was[s.key]; if (!p || p.points == null || s.points == null) return ''; const d = s.points - p.points;
    return `<span class="${d > 0 ? 'up' : d < 0 ? 'down' : ''}" title="Last time: ${esc(p.grade)}">${d > 0 ? '↑' : d < 0 ? '↓' : '→'} ${esc(p.grade)}</span>`; };
  const o = r.outcomes_comment, n = r.nutrition || {};
  return `${r.rewroteWhy ? `<div class="muted small" style="margin-bottom:8px">↻ Rewritten ${esc(new Date(r.rewroteAt).toLocaleDateString([], { month: 'short', day: 'numeric' }))} because the data changed: ${esc(r.rewroteWhy)}</div>` : ''}
    ${r.question ? `<div class="rv-q"><b>You asked:</b> ${esc(r.question)}<p>${esc(r.question_answer || '')}</p></div>` : ''}
    <div class="rc-top"><div><div class="rc-k">GPA</div><div class="rc-v">${c.gpa == null ? '—' : c.gpa.toFixed(2)}</div><div class="rc-s">${prev?.card?.gpa != null && c.gpa != null ? `${c.gpa >= prev.card.gpa ? '+' : '−'}${Math.abs(c.gpa - prev.card.gpa).toFixed(2)} vs last` : `${c.credits} of ${c.creditsAll} credits graded`}</div></div>
      ${ytd?.gpa != null ? `<div><div class="rc-k">Year to date</div><div class="rc-v">${ytd.gpa.toFixed(2)}</div><div class="rc-s">before assignments</div></div>` : ''}</div>
    <div class="rv-story">${(r.summary || '').split(/\n\s*\n/).map(p => `<p>${esc(p)}</p>`).join('')}</div>
    <div class="rc-list">${c.subjects.map(s => { const t = w[s.key] || {};
      return `<details class="rc-row"${compact ? '' : ' open'}><summary><span class="rc-n">${esc(s.name)}<span class="muted small"> · ${s.credits} credit${s.credits === 1 ? '' : 's'}</span></span><span class="rc-g ${s.grade === 'I' ? 'none' : gradeTone(s.grade)}">${esc(s.grade)}</span><span class="rc-t">${trend(s)}</span></summary>
        <div class="rc-body">${s.incomplete ? `<p class="muted small" style="margin:0 0 4px">Incomplete: ${esc(s.incomplete)}. Not counted in the GPA.</p>` : ''}
          ${t.praise ? `<p><b class="good">Praise:</b> ${esc(t.praise)}</p>` : ''}${t.criticism ? `<p><b class="bad">Criticism:</b> ${esc(t.criticism)}</p>` : ''}${t.suggestion ? `<p><b>Next:</b> ${esc(t.suggestion)}</p>` : ''}
          ${s.parts.length ? `<table class="rc-parts">${s.parts.map(p => `<tr><td>${esc(p.name)}</td><td>${esc(p.detail)}</td><td>${p.score == null ? 'no data' : p.score + '%'}</td><td class="muted">${s.parts.length > 1 ? (p.weight + (p.weight > 1 ? '%' : '')) : ''}</td></tr>`).join('')}</table>` : ''}
          ${s.key === 'assignments' && r.marks?.length ? `<ul class="rc-marks">${r.marks.map((m, mi) => `<li><b class="${m.status === 'done' ? 'good' : m.status === 'missed' ? 'bad' : ''}">${esc(m.status)}</b> · ${esc(m.assignment)}<div class="muted small">${esc(m.evidence)}</div>${m.change ? `<div class="small">${esc(m.change.name)}: ${fmtN(m.change.before, m.change.dp)} → <b class="${m.change.better ? 'good' : m.change.better === false ? 'bad' : ''}">${fmtN(m.change.after, m.change.dp)}</b> ${esc(m.change.unit)} <span class="muted">vs the period before</span></div>` : ''}${m.status !== 'missed' ? `<div class="small rc-helped">Did it help? ${['yes', 'somewhat', 'no'].map(h => `<button class="btn small${m.helped === h ? ' primary' : ''}" data-helped="${esc(r.key)}|${mi}|${h}">${h[0].toUpperCase() + h.slice(1)}</button>`).join(' ')}</div>` : ''}</li>`).join('')}</ul>` : ''}</div></details>`; }).join('')}</div>
    ${o ? `<div class="rv-box" style="margin-top:12px"><div class="rv-h">Results (tracked, not graded)</div><p style="margin:0">${esc(o)}</p></div>` : ''}
    ${n.swaps?.length ? `<div class="rv-box" style="margin-top:12px"><div class="rv-h">Swaps that fit your plan</div><ul>${n.swaps.map(x => `<li><b>${esc(x.instead_of)}</b> → ${esc(x.try)}. <span class="muted">${esc(x.why)}</span></li>`).join('')}</ul>${!compact ? `<button class="btn small" data-swaps="${esc(r.key)}">More swap ideas</button>` : ''}</div>` : ''}
    ${r.assignments?.length ? `<div class="rv-focus"><div class="rv-h">Assignments for next ${r.kind === 'adhoc' ? 'time' : r.kind}</div><ol>${r.assignments.map(a => `<li>${esc(a.text)}${a.carried ? ` <span class="tag">carried ${a.carried}×</span>` : ''}${a.reason ? `<div class="muted small">${esc(a.reason)}</div>` : ''}</li>`).join('')}</ol></div>` : ''}
    ${r.retired?.length ? `<div class="muted small" style="margin-top:8px"><b>Retired:</b> ${r.retired.map(x => `${esc(x.assignment)} (${esc(x.reason)})`).join(' · ')}</div>` : ''}
    <div class="muted small" style="margin-top:10px">Attendance: food fully logged ${r.card.subjects.find(x => x.key === 'logging')?.parts[0]?.detail || '—'}${r.gradedFrom ? ` · graded from ${esc(fmtDay(r.gradedFrom, { month: 'short', day: 'numeric' }))}, when your data starts` : ''}</div>`;
}
function reviewHtml(r, compact) {
  if (r.card && r.status === 'done') return reportHtml(r, compact);
  if (r.status === 'incomplete') return `<div class="rv-inc"><p class="small" style="margin:0 0 8px">Incomplete · food logged on ${r.logged} of ${r.days} days, so this period isn't graded.</p>
    <label for="note-${esc(r.key)}">Your note about this period</label><textarea id="note-${esc(r.key)}" data-note="${esc(r.key)}" style="min-height:60px" placeholder="On vacation, not tracking">${esc(r.note || '')}</textarea>
    <div class="row" style="margin-top:8px"><button class="btn small" data-savenote="${esc(r.key)}">Save note</button><button class="btn small ghost" data-force="${esc(r.key)}">Write a review anyway</button></div></div>`;
  const sec = (icon, title, items, cls = '') => items?.length ? `<div class="rv-box"><div class="rv-h ${cls}">${icon} ${esc(title)}</div><ul>${items.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
  const n = r.nutrition || {};
  const flags = (n.flags || []).filter(f => f.status !== 'ok');
  return `${r.rewroteWhy ? `<div class="muted small" style="margin-bottom:8px">↻ Rewritten ${esc(new Date(r.rewroteAt).toLocaleDateString([], { month: 'short', day: 'numeric' }))} because the data changed: ${esc(r.rewroteWhy)}</div>` : ''}${r.question ? `<div class="rv-q"><b>You asked:</b> ${esc(r.question)}<p>${esc(r.question_answer || '')}</p></div>` : ''}
    <div class="rv-why"><b>Why ${esc(r.grade)}:</b> ${esc(r.grade_reason)}</div>
    <div class="rv-story">${(r.narrative || '').split(/\n\s*\n/).map(p => `<p>${esc(p)}</p>`).join('')}</div>
    <div class="rv-grid">${sec('✓', 'Went well', r.went_well, 'good')}${sec('!', 'Fell short', r.fell_short, 'bad')}${sec('↗', 'What seems to be working', r.working)}${sec('↘', "What isn't", r.not_working)}</div>
    ${n.summary ? `<div class="rv-box" style="margin-top:12px"><div class="rv-h">🥗 Nutrition mix</div><p style="margin:0 0 6px">${esc(n.summary)}</p>
      ${flags.length ? `<ul>${flags.map(f => `<li><b>${esc(f.nutrient)} ${f.status === 'high' ? 'high' : 'low'}:</b> ${esc(f.detail)}</li>`).join('')}</ul>` : ''}
      ${n.swaps?.length ? `<div class="rv-h" style="margin-top:8px">Swaps that fit your plan</div><ul>${n.swaps.map(s => `<li><b>${esc(s.instead_of)}</b> → ${esc(s.try)}. <span class="muted">${esc(s.why)}</span></li>`).join('')}</ul>` : ''}
      ${!compact ? `<button class="btn small" data-swaps="${esc(r.key)}">More swap ideas</button> <span class="muted small">uses your plan's rules and foods you already log</span>` : ''}</div>` : ''}
    ${r.training?.summary || r.training?.recovery ? `<div class="rv-box" style="margin-top:12px"><div class="rv-h">🏃 Training and recovery</div>${[r.training.summary, r.training.recovery].filter(Boolean).map(x => `<p style="margin:0 0 6px">${esc(x)}</p>`).join('')}${r.training.next_week ? `<p style="margin:0"><b>Next week:</b> ${esc(r.training.next_week)}</p>` : ''}</div>` : ''}
    ${r.focus?.length ? `<div class="rv-focus"><div class="rv-h">🎯 Focus next</div><ol>${r.focus.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>` : ''}
    ${r.stats ? `<div class="rv-nums">${[['Anchors', r.stats.anchors], ['Steps / day', fmtN(r.stats.avg_steps)], ['Calories / day', fmtN(r.stats.avg_calories_logged_days)], ['Sleep / night', r.stats.avg_sleep_h != null ? r.stats.avg_sleep_h + ' h' : '—'], ['Resting HR', fmtN(r.stats.avg_resting_hr)]].map(([k, v]) => `<div><span>${k}</span><b>${esc(v ?? '—')}</b></div>`).join('')}</div>` : ''}`;
}
function badge(r) {
  if (r.status === 'incomplete') return '<span class="rv-badge none">…</span>';
  return `<span class="rv-badge ${gradeTone(r.grade)}">${esc(r.grade || '?')}</span>`;
}
// The history tree: years › quarters › months › weeks (a week belongs to the month its Thursday is in).
// Children are drawn when a row is opened, so a long history stays quick.
const TREE_CHILD = { root: 'year', year: 'quarter', quarter: 'month', month: 'week' };
function treeKids(kind, a, b) {
  const sub = TREE_CHILD[kind]; if (!sub) return '';
  const from = dataStart(), today = todayKey(), rows = [];
  if (sub === 'year') for (let y = +today.slice(0, 4); y >= +from.slice(0, 4); y--) rows.push(periodOf('year', `${y}-01-01`));
  else if (sub === 'week') { for (let ws = weekStart(b); ws >= addDays(weekStart(a), -7); ws = addDays(ws, -7)) { const th = addDays(ws, 3); if (th >= a && th <= b && ws <= today && addDays(ws, 6) >= from) rows.push(periodOf('week', ws)); } }
  else for (let k = b; k >= a; ) { const p = periodOf(sub, k); if (p[0] <= today && p[1] >= from) rows.push(p); k = addDays(p[0], -1); }
  return rows.map(([s, e, key]) => treeRow(sub, s, e, key)).join('');
}
function treeRow(kind, a, b, key) {
  const r = reviews()[key], done = r && !r.deleted && r.status === 'done', live = !done ? quickCard(a, b > todayKey() ? addDays(todayKey(), -1) : b) : null;
  const open = b >= todayKey() && a <= todayKey();
  const g = done ? r.grade : live.grade, gpa = done ? r.gpa : live.gpa;
  const label = kind === 'week' ? `Week of ${fmtRange(a, b)}` : periodLabel(kind, a, b);
  const note = done ? (r.headline || r.grade_reason || '') : r?.status === 'incomplete' ? `Incomplete · food logged ${r.logged} of ${r.days} days` : open ? 'In progress · grades so far' : 'Not written yet · grades from your data';
  return `<details class="rt rt-${kind}" data-tk="${kind}" data-ta="${a}" data-tb="${b}" data-key="${esc(key)}"><summary><span class="rv-badge ${done ? gradeTone(g) : 'none'}${done ? '' : ' live'}">${esc(g)}</span><span class="rt-l">${esc(label)}</span><span class="rt-h">${esc(note)}</span><span class="rt-g">${gpa != null ? gpa.toFixed(2) : '—'}</span></summary><div class="rt-body"></div></details>`;
}
function fillTreeRow(el) {
  const { tk, ta, tb, key } = el.dataset, body = el.querySelector(':scope > .rt-body');
  if (body.dataset.filled) return;
  body.dataset.filled = '1';
  const r = reviews()[key], done = r && !r.deleted && r.status === 'done', open = tb >= todayKey();
  const own = done ? `<div class="rt-card">${reviewHtml(r, true)}<div style="margin-top:10px"><button class="btn small" data-regen="${esc(key)}">Regenerate</button></div></div>`
    : `<div class="rt-card">${liveCardHtml(quickCard(ta, open ? addDays(todayKey(), -1) : tb))}${!open && coachCfg().apiKey ? `<div style="margin-top:10px"><button class="btn small" data-write="${tk}|${ta}|${tb}|${esc(key)}">Write report</button> <span class="muted small">Claude writes the words for these grades (one Coach call)</span></div>` : ''}</div>`;
  body.innerHTML = own + treeKids(tk, ta, tb);
}
function liveCardHtml(c) {
  return `<div class="rc-list">${c.subjects.filter(s => s.key !== 'assignments').map(s => `<details class="rc-row"><summary><span class="rc-n">${esc(s.name)}<span class="muted small"> · ${s.credits} credit${s.credits === 1 ? '' : 's'}</span></span><span class="rc-g ${s.grade === 'I' ? 'none' : gradeTone(s.grade)}">${esc(s.grade)}</span><span class="rc-t"></span></summary><div class="rc-body">${s.incomplete ? `<p class="muted small" style="margin:0 0 4px">Incomplete: ${esc(s.incomplete)}.</p>` : ''}${s.parts.length ? `<table class="rc-parts">${s.parts.map(p => `<tr><td>${esc(p.name)}</td><td>${esc(p.detail)}</td><td>${p.score == null ? 'no data' : p.score + '%'}</td></tr>`).join('')}</table>` : ''}</div></details>`).join('')}</div>`;
}
function renderCoach() {
  if (!$('#coach-latest')) return;
  renderReflection();
  const cc = coachCfg();
  $$('#coach-seg button').forEach(b => b.classList.toggle('on', b.dataset.v === coachView));
  $('#coach-setup').hidden = !!cc.apiKey;
  const LV = { year: 4, quarter: 3, month: 2, week: 1 };
  const list = Object.values(reviews()).filter(r => !r.deleted && r.status !== 'writing' && (coachView === 'adhoc' ? r.kind === 'adhoc' : LV[r.kind])).sort((a, b) => (b.end + (LV[b.kind] || 0) + b.createdAt).localeCompare(a.end + (LV[a.kind] || 0) + a.createdAt));
  const latest = list[0];
  const us = usageSummary();
  const low = us.balance != null && !us.autoReload.on && us.balance < 2;
  $('#coach-bal').innerHTML = us.balance != null
    ? `Est. balance <b style="color:${low ? 'var(--bad)' : 'inherit'}">${money(us.balance)}</b> · ${money(us.spentMonth)} this month${us.autoReload.on ? ` · auto-reload +$${us.autoReload.amount} below $${us.autoReload.below}${us.reloads ? ` (${plural(us.reloads, 'reload')} so far)` : ''}` : ''}${low ? ' · <b style="color:var(--bad)">running low — add credit at console.anthropic.com, then add it in Settings › Coach</b>' : ''}`
    : us.calls.length ? `${money(us.spentMonth)} spent this month · add your credit in Settings › Coach to track the balance` : '';
  $('#coach-progress').textContent = coachProgress;
  $('#coach-progress').hidden = !coachProgress;
  $('#coach-latest').innerHTML = latest ? `<div class="card rv">
      <div class="rv-top">${badge(latest).replace('rv-badge', 'rv-badge big')}<div style="min-width:0;flex:1"><div class="muted small">Latest · ${esc(latest.kind === 'week' ? 'Week of ' + fmtRange(latest.start, latest.end) : latest.kind === 'adhoc' ? 'On demand · ' + fmtRange(latest.start, latest.end) : LEVELS[latest.kind] + ' · ' + periodLabel(latest.kind, latest.start, latest.end))}</div>
        <h2 style="margin:2px 0 4px">${esc(latest.status === 'incomplete' ? 'Not enough data to grade' : latest.headline)}</h2>
        <div class="muted small">${latest.stats ? `${esc(latest.stats.anchors)} anchors · ` : ''}food logged ${latest.logged} of ${latest.days} days${latest.cost ? ` · cost ${money(latest.cost)}` : ''} · written ${esc(new Date(latest.createdAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}${latest.emailedAt ? ' · emailed' : ''}</div></div>
        <button class="btn small" data-regen="${esc(latest.key)}" title="Write this review again">Regenerate</button></div>
      ${reviewHtml(latest)}</div>`
    : `<div class="card"><p class="muted" style="margin:0">${coachView === 'adhoc' ? 'Tap Review now to get a report card for any dates you choose.' : cc.apiKey ? 'Your first report cards will appear here shortly. Until then, the grades below are worked out live from your data.' : 'Add your Anthropic API key in Settings › Coach to get written report cards. The grades below are worked out from your data either way.'}</p></div>`;
  $('#coach-history').innerHTML = coachView === 'adhoc'
    ? (list.length > 1 ? `<div class="sub-h" style="margin:6px 2px 8px">Previous reports</div><div class="rv-list">${list.slice(1).map(r => `<details class="rv-row"><summary>${badge(r)}<span class="muted small" style="width:110px;flex:none">${esc(fmtRange(r.start, r.end))}</span><span class="grow">${esc(r.status === 'incomplete' ? `Incomplete · ${r.logged} of ${r.days} days logged` : r.headline)}</span><span class="muted small">${r.gpa != null ? 'GPA ' + r.gpa.toFixed(2) : ''}</span><button class="del" data-delrev="${esc(r.key)}" aria-label="Delete review">×</button></summary><div class="rv-body">${reviewHtml(r, true)}<div style="margin-top:10px"><button class="btn small" data-regen="${esc(r.key)}">Regenerate</button></div></div></details>`).join('')}</div>` : '')
    : `<div class="sub-h" style="margin:6px 2px 8px">All report cards</div><div class="rt-tree">${treeKids('root', null, null)}</div>`;
}

async function moreSwaps(key) {
  const r = reviews()[key]; if (!r) return;
  const btn = $(`[data-swaps="${CSS.escape(key)}"]`); if (btn) { btn.disabled = true; btn.textContent = 'Thinking…'; }
  try {
    const cc = coachCfg();
    const out = await callClaude({ effort: 'low', maxTokens: 4000, what: `More swap ideas · ${fmtRange(r.start, r.end)}`,
      system: COACH_SYSTEM + '\n\nThis request is only for more food swap ideas. Return a short summary and 3-5 new swaps not already listed; flags and other fields may be empty.',
      schema: REVIEW_SCHEMA.properties.nutrition,
      user: JSON.stringify({ period: fmtRange(r.start, r.end), problems: r.nutrition?.flags, already_suggested: r.nutrition?.swaps, daily_food_plan: cc.planDay, plan_foods: cc.planFoods, anchors: anchorCfg().names.map((nm, i) => ({ name: nm, rule: anchorCfg().rules[i] })), foods_logged: windowKeys(r.end, r.days).flatMap(k => (getDay(k)?.food || []).map(f => f.name)).filter((x, i, a) => a.indexOf(x) === i).slice(0, 80) }) });
    r.nutrition.swaps = [...(r.nutrition.swaps || []), ...(out.swaps || [])];
    r.cost = Math.round(((r.cost || 0) + out._cost) * 10000) / 10000;
    r.updatedAt = new Date().toISOString(); coachDirty = true; await savePersist(); renderCoach();
  } catch (e) { toast(e.message, 7000); if (btn) { btn.disabled = false; btn.textContent = 'More swap ideas'; } }
}

function openReviewNow() {
  const p = $('#coach-now'); p.hidden = !p.hidden;
  if (!p.hidden) { $('#cn-to').value = addDays(todayKey(), -1); $('#cn-from').value = addDays(todayKey(), -7); }
}
function quickRange(q) {
  const t = todayKey(), y = addDays(t, -1);
  const r = { l7: [addDays(t, -7), y], wk: [weekStart(t), t], mo: [t.slice(0, 8) + '01', t], l30: [addDays(t, -30), y], yr: [t.slice(0, 5) + '01-01', t] }[q];
  if (r) { $('#cn-from').value = r[0]; $('#cn-to').value = r[1]; }
}
async function runReviewNow() {
  let a = $('#cn-from').value, b = $('#cn-to').value;
  if (!a || !b) { toast('Pick both dates first.'); return; }
  if (a > b) [a, b] = [b, a];
  const key = 'adhoc:' + uid();
  $('#coach-now').hidden = true; coachView = 'adhoc';
  try { await writeReview(key, { kind: 'adhoc', start: a, end: b, question: $('#cn-q').value.trim(), email: $('#cn-email').checked, force: true }); }
  catch (e) { toast(e.message, 8000); renderCoach(); }
}

function renderCoachSettings() {
  const cc = coachCfg(), us = usageSummary();
  $('#cs-ar').checked = cc.autoReload.on; $('#cs-ar-below').value = cc.autoReload.below; $('#cs-ar-amt').value = cc.autoReload.amount;
  $('#cu-nums').innerHTML = [['Est. balance', us.balance != null ? money(us.balance) : 'not set'], ['This month', money(us.spentMonth)], ['All time', money(us.spentAll)], ['Auto-reloads', cc.autoReload.on ? String(us.reloads) : 'off']].map(([k, v]) => `<div><span>${k}</span><b>${esc(v)}</b></div>`).join('');
  $('#cu-list').innerHTML = us.calls.slice(-25).reverse().map(e => `<div class="li"><span class="n">${esc(e.what)}<div class="muted">${esc(new Date(e.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))} · ${fmtN(e.in)} in / ${fmtN(e.out)} out tokens</div></span><span class="x">${money(e.cost)}</span></div>`).join('') || '<p class="muted" style="margin:0">No calls yet.</p>';
  $('#cs-key').value = cc.apiKey ? '••••••••' + cc.apiKey.slice(-4) : '';
  $('#cs-script').value = cc.scriptUrl; $('#cs-email').checked = cc.email;
  $('#cs-planday').value = cc.planDay; $('#cs-foods').value = cc.planFoods;
  const R = rubric();
  $('#rb-protein').value = R.proteinG; $('#rb-floor').value = R.calorieFloor; $('#rb-sessions').value = R.sessionsPerWeek; $('#rb-minmin').value = R.sessionMinMinutes; $('#rb-strength').value = R.strengthPerWeek; $('#rb-sleep').value = R.sleepHours; $('#rb-bed').value = R.bedtime;
  $('#rb-credits').innerHTML = SUBJECTS.map(([k, n]) => `<label style="margin:0">${esc(n)} <input type="number" min="0" step="1" data-credit="${k}" value="${R.credits[k]}" style="width:56px"></label>`).join('');
  $('#cs-fiber').value = cc.targets.fiberMin; $('#cs-sodium').value = cc.targets.sodiumMax; $('#cs-satfat').value = cc.targets.satFatPctMax; $('#cs-sugar').value = cc.targets.sugarMax;
}
async function saveCoachSettings() {
  const prev = data.coachCfg || {};
  const k = $('#cs-key').value.trim();
  data.coachCfg = { ...prev,
    apiKey: k && !k.startsWith('••••') ? k : prev.apiKey || '',
    scriptUrl: $('#cs-script').value.trim(), email: $('#cs-email').checked,
    autoReload: { on: $('#cs-ar').checked, below: num($('#cs-ar-below').value) ?? 5, amount: num($('#cs-ar-amt').value) ?? 20 },
    planDay: $('#cs-planday').value.trim(), planFoods: $('#cs-foods').value.trim(),
    targets: { fiberMin: num($('#cs-fiber').value) ?? 25, sodiumMax: num($('#cs-sodium').value) ?? 2300, satFatPctMax: num($('#cs-satfat').value) ?? 10, sugarMax: num($('#cs-sugar').value) ?? 50 },
    rubric: { proteinG: num($('#rb-protein').value) ?? RUBRIC_DEFAULT.proteinG, calorieFloor: num($('#rb-floor').value) ?? RUBRIC_DEFAULT.calorieFloor, sessionsPerWeek: num($('#rb-sessions').value) ?? RUBRIC_DEFAULT.sessionsPerWeek,
      sessionMinMinutes: num($('#rb-minmin').value) ?? RUBRIC_DEFAULT.sessionMinMinutes, strengthPerWeek: num($('#rb-strength').value) ?? RUBRIC_DEFAULT.strengthPerWeek, sleepHours: num($('#rb-sleep').value) ?? RUBRIC_DEFAULT.sleepHours,
      bedtime: $('#rb-bed').value || RUBRIC_DEFAULT.bedtime, credits: Object.fromEntries($$('[data-credit]').map(i => [i.dataset.credit, Math.max(0, num(i.value) ?? RUBRIC_DEFAULT.credits[i.dataset.credit])])) } };
  coachDirty = true;
  await savePersist();
  if (!coachDirty) { toast('Coach settings saved.'); renderCoachSettings(); renderCoach(); autoReviews(); }
}


/* ---- your why, and the weekly reflection ---- */
const reflections = () => (data.reflections ||= {});
function renderReflection() {
  if (!$('#rf-week')) return;
  const cur = weekStart(todayKey()), last = addDays(cur, -7), sel = $('#rf-week').value || cur;
  $('#rf-week').innerHTML = [[cur, 'This week'], [last, 'Last week']].map(([k, n]) => `<option value="${k}"${k === sel ? ' selected' : ''}>${n} · ${esc(fmtRange(k, addDays(k, 6)))}</option>`).join('');
  const r = reflections()[$('#rf-week').value] || {};
  // Never overwrite something being typed (the Coach tab redraws every few minutes).
  if (!$('#rf-in-way').dataset.dirty) { $('#rf-in-way').value = r.inWay || ''; $('#rf-helped').value = r.helped || ''; }
  const rev = reviews()['week:' + $('#rf-week').value];
  $('#rf-msg').textContent = rev?.status === 'done' && r.updatedAt && r.updatedAt > rev.createdAt ? 'Saved after this week’s report card was written. Regenerate it to include this.' : 'The week’s report card reads this. It can explain a grade, but it doesn’t change it.';
  if (!$('#why-text').dataset.dirty) $('#why-text').value = coachCfg().why;
}
async function saveReflection() {
  const k = $('#rf-week').value, inWay = $('#rf-in-way').value.trim(), helped = $('#rf-helped').value.trim();
  reflections()[k] = { inWay, helped, updatedAt: new Date().toISOString() };
  delete $('#rf-in-way').dataset.dirty;
  coachDirty = true; await savePersist(); toast('Reflection saved.'); renderReflection();
}
async function saveWhy() {
  data.coachCfg = { ...(data.coachCfg || {}), why: $('#why-text').value.trim() };
  delete $('#why-text').dataset.dirty;
  coachDirty = true; await savePersist(); $('#why-msg').textContent = 'Saved'; setTimeout(() => $('#why-msg').textContent = '', 2500);
}
// The one thing to do today: a nudge only when there's something to act on, plus strength this week and measurements due.
function renderToday() {
  const el = $('#ts-card'); if (!el) return;
  const k = dashDate, s = todaySuggestion(k), w = waistStatus(k), sc = strengthCheck(k), lines = [];
  if (s.kind) lines.push(`<div class="rd rd-${s.kind === 'easy' ? 'easy' : 'push'}" style="margin:0"><div class="rd-v">${esc(s.text)}</div><div class="rd-h">${esc(s.why.join(' '))}</div></div>`);
  if (k === todayKey()) {
    const due = [w.due && `waist${w.k ? ` (last ${daysAgo(w.days)})` : ''}`, sc.due && `push-ups${sc.k ? ` (last ${daysAgo(sc.days)})` : ''}`].filter(Boolean);
    if (due.length) lines.push(`<p class="small" style="margin:${s.kind ? '10px' : '0'} 0 0">Measure today: ${esc(due.join(' and '))}. <a href="#" id="ts-log">Log today ›</a></p>`);
  }
  el.hidden = !lines.length && !s.strength.target;
  $('#ts-str').textContent = s.strength.target ? `strength ${s.strength.n} of ${s.strength.target} this week` : '';
  $('#ts-body').innerHTML = lines.join('') || '<p class="muted small" style="margin:0">Nothing to change today.</p>';
  const a = $('#ts-log'); if (a) a.onclick = e => { e.preventDefault(); goTab('log'); };
}
function renderReadinessCard() {
  const r = readiness(dashDate), el = $('#rd-card');
  if (!el) return;
  el.hidden = !r;
  if (r) $('#rd-body').innerHTML = `<div class="rd rd-${r.verdict}" style="margin:0"><div class="rd-v">${esc(r.title)}</div><div class="rd-h">${esc([...r.parts.filter(p => p.score < 0).map(p => p.text), r.painNote, ...r.flags.map(f => f.text)].filter(Boolean).slice(0, 2).join(' · ') || r.hint)}</div></div>`;
  $('#rd-date').textContent = dashDate === todayKey() ? 'today' : fmtDay(dashDate, { month: 'short', day: 'numeric' });
}
