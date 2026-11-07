'use strict';
// Health Sync · the Weight page: latest weigh-in, progress, body composition, burn, maintenance.
// One of the app's screen files: classic scripts that share one global scope, loaded in order by index.html.
/* ================= weight: trend, goals, BMI, predictions ================= */
const BMI_CATS = [['Underweight', 0, 18.5, 'var(--c-steps)'], ['Normal', 18.5, 25, 'var(--good)'], ['Overweight', 25, 30, '#d79a00'], ['Obese class I', 30, 35, 'var(--c-cal)'], ['Obese class II', 35, 40, 'var(--bad)'], ['Obese class III', 40, 99, 'var(--c-mood)']];
const bmiOf = (w, unit, hIn) => w == null || !hIn ? null : (unit === 'kg' ? w * 2.20462 : w) * 703 / (hIn * hIn);
const weightForBmi = (b, unit, hIn) => { const lb = b * hIn * hIn / 703; return unit === 'kg' ? lb / 2.20462 : lb; };
let predMode = 'current';   // predictions start on your recent weigh-ins (Last 4 weeks)

// Arc helper: 180° gauge from left to right; frac 0..1
function arcPath(cx, cy, r, f0, f1) {
  const p = f => [cx - r * Math.cos(Math.PI * f), cy - r * Math.sin(Math.PI * f)];
  const [x0, y0] = p(f0), [x1, y1] = p(f1);
  // A gauge is half a circle, so an arc on it never spans more than 180°: the large-arc flag stays 0.
  return `M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

function renderWeightExtras() {
  const box = $('#m-weight'), top = $('#m-latest');
  top.innerHTML = '';
  if (metricKey !== 'weight') { box.innerHTML = ''; return; }
  const S = weightSeries(), G = weightGoals(S), u = S.unit;
  if (!S.rows.length) { box.innerHTML = '<div class="card"><p class="muted" style="margin:0">No weigh-ins yet. They arrive from your Withings scale, directly (script v3.7+, SETUP Step 14) or through Apple Health and Health Auto Export.</p></div>'; return; }
  const today = todayKey(), last = [...S.rows].reverse().find(r => r.w != null), trendNow = trendOn(S, today);
  const wp = weightPace(today), paceNote = wp && wp.status !== 'ok' ? `<div class="card" style="border-color:${wp.status === 'fast' ? 'var(--bad)' : 'var(--warn-ink)'}"><div class="card-h" style="margin-bottom:4px"><h2>${wp.status === 'fast' ? 'Losing too fast' : 'Watch your pace'}</h2></div><p style="margin:0 0 4px">${esc(wp.text)}</p><p class="small muted" style="margin:0">${esc(wp.fix)}</p></div>` : '';
  const f1 = v => v == null ? '—' : fmtN(v, 1);
  const sgn = v => v == null ? '—' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${fmtN(Math.abs(v), 1)}`;
  const cards = [];

  // --- latest weigh-in, front and center, with its age
  const A = weighInAge(today);
  const latestCard = !A ? '' : `<div class="card wt-latest ${A.level}"><div class="card-h"><h2>Latest weigh-in</h2><span class="wt-age ${A.level}">${A.level === 'fresh' ? esc(A.ago) : `${esc(A.ago)} · ${A.level === 'stale' ? 'out of date' : 'getting old'}`}</span></div>
    <div class="wt-latest-row"><div><div class="wt-big">${f1(A.w)}<span class="u"> ${u}</span></div><div class="muted small">${esc(fmtDay(A.k, { weekday: 'long', month: 'short', day: 'numeric' }))}</div></div>
      <div class="wt-latest-tr"><b>${f1(trendNow)}</b><span>trend weight</span></div></div>
    ${A.note ? `<p class="wt-age-note">${esc(A.note)}${A.estimateText ? ` ${esc(A.estimateText)}` : ''}</p>` : '<p class="muted small" style="margin:8px 0 0">Day-to-day readings swing with water and salt. The trend is the steadier number.</p>'}</div>`;

  // --- progress, the way Happy Scale shows it: the current milestone, the whole way, and every milestone with its date
  const P = weightMilestones(today);
  let progCard = '';
  if (P) {
    const dt = k => esc(fmtDay(k, { month: 'short', day: 'numeric', year: k.slice(0, 4) === today.slice(0, 4) ? undefined : 'numeric' }));
    const ticks = P.items.slice(0, -1).map(x => `<i style="left:${(Math.abs(P.start - x.w) / P.total * 100).toFixed(1)}%" class="${x.reached ? 'on' : ''}"></i>`).join('');
    progCard = (`<div class="card wt-card"><div class="card-h"><h2>Progress</h2><span class="muted small">${f1(P.start)} → ${f1(P.goal)} ${u}${P.startDate ? ` · since ${fmtDay(P.startDate, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}</span></div>
      <div class="wt-gauge"><svg viewBox="0 0 220 124" aria-hidden="true"><path d="${arcPath(110, 112, 92, 0, 1)}" class="g-track"/>${P.within > 0.002 ? `<path d="${arcPath(110, 112, 92, 0, Math.min(P.within, 0.999))}" class="g-fill"/>` : ''}</svg>
        <div class="wt-gauge-in">${P.next ? `<div class="muted small">${P.next.goal ? 'Goal' : `Milestone ${P.next.n} of ${P.items.length}`}</div><div class="wt-big">${f1(P.toNext)}<span class="u"> ${u}</span></div><div class="muted small">to ${f1(P.next.w)}${P.next.eta ? ` · about ${dt(P.next.eta)}` : ''}</div>` : `<div class="wt-big">🎉</div><div class="muted small">Goal reached</div>`}</div></div>
      <div class="wt-bar"><div class="fill" style="width:${(P.frac * 100).toFixed(1)}%"></div>${ticks}</div>
      <div class="wt-bar-l small"><span>Start ${f1(P.start)}</span><b>${Math.round(P.frac * 100)}% of the way</b><span>Goal ${f1(P.goal)}</span></div>
      <div class="wt-3"><div><b>${f1(P.done)}</b><span>${P.losing ? 'lost' : 'gained'}</span></div><div><b>${P.reached} of ${P.items.length}</b><span>milestones</span></div><div><b>${f1(P.toGo)}</b><span>to go</span></div></div>
      <div class="sub-h" style="margin-top:14px">Milestones</div>
      <div class="list wt-mlist">${P.items.map(x => `<div class="li${x.next ? ' next' : ''}${x.reached ? ' done' : ''}"><span class="n"><span class="wt-mk">${x.reached ? '✓' : x.next ? '●' : '○'}</span><b>${f1(x.w)} ${u}</b> <span class="muted small">${x.goal ? 'Goal' : `Milestone ${x.n}`}</span></span><span class="x small">${x.reached ? `reached ${dt(x.reached)}` : x.next ? `<b>${f1(P.toNext)} ${u} to go</b>${x.eta ? ` · about ${dt(x.eta)}` : ''}` : x.eta ? `about ${dt(x.eta)}` : '<span class="muted">—</span>'}</span></div>`).join('')}</div>
      <div class="muted small" style="margin-top:6px">A milestone counts the first day you weigh in at or under it. Progress is measured from your latest weigh-in (${f1(P.current)} ${u}). Forecast dates use your recent rate (${P.rate == null ? '—' : `${sgn(P.rate)} ${u}/week`}).</div></div>`);
  } else if (A) progCard = (`<div class="card wt-card"><div class="card-h"><h2>Progress</h2></div><p class="muted" style="margin:0">Add your goal weight in <b>Goals and settings</b> below to see milestones and progress.</p></div>`);

  // --- change in trend over standard windows
  const ch = d => { const a = trendOn(S, addDays(today, -d)); return a == null ? null : trendNow - a; };
  const allCh = G.start != null ? trendNow - G.start : null;
  cards.push(`<div class="card wt-card"><div class="card-h"><h2>Trend change</h2><span class="muted small">${u}, by trend weight</span></div>
    <div class="wt-4">${[['7 days', ch(7)], ['30 days', ch(30)], ['90 days', ch(90)], ['All time', allCh]].map(([l, v]) => `<div class="${v == null ? '' : v < 0 ? 'down' : v > 0 ? 'up' : ''}"><b>${sgn(v)}</b><span>${l}</span></div>`).join('')}</div>
    <div class="muted small" style="margin-top:8px">Rate: ${sgn(weightRate(S))} ${u}/week recently · ${sgn(trendRate(S, 7))} over 7 days</div></div>`);

  // --- recent stats (last 10 days of weigh-ins)
  const recent = S.rows.filter(r => r.w != null && r.k >= addDays(today, -9));
  if (recent.length) {
    const hi = recent.reduce((a, b) => b.w > a.w ? b : a), lo = recent.reduce((a, b) => b.w < a.w ? b : a);
    const ago = k => { const n = Math.round((keyToDate(today) - keyToDate(k)) / 864e5); return n === 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`; };
    cards.push(`<div class="card wt-card"><div class="card-h"><h2>Last 10 days</h2></div><div class="wt-4">
      <div class="hi"><b>${f1(hi.w)}</b><span>high · ${ago(hi.k)}</span></div><div><b>${f1(last.w)}</b><span>latest · ${ago(last.k)}</span></div>
      <div class="tr"><b>${f1(trendNow)}</b><span>trend</span></div><div class="lo"><b>${f1(lo.w)}</b><span>low · ${ago(lo.k)}</span></div></div>
      <div class="muted small" style="margin-top:8px">The ${f1(hi.w - lo.w)} ${u} spread is mostly water, sodium and food in transit. The trend is what's real.</div></div>`);
  }

  // --- BMI
  if (G.heightIn) {
    const b = bmiOf(trendNow, u, G.heightIn), lo = 15, hi = 42, pos = Math.max(0, Math.min(1, (b - lo) / (hi - lo)));
    const cat = BMI_CATS.find(c => b >= c[1] && b < c[2]);
    const seg = BMI_CATS.map(c => `<path d="${arcPath(110, 112, 88, Math.max(0, (c[1] - lo) / (hi - lo)) + 0.004, Math.min(1, (c[2] - lo) / (hi - lo)) - 0.004)}" stroke="${c[3]}" class="g-seg"/>`).join('');
    const mx = 110 - 88 * Math.cos(Math.PI * pos), my = 112 - 88 * Math.sin(Math.PI * pos);
    const minW = S.rows.filter(r => r.w != null && r.k >= addDays(today, -9)).reduce((m, r) => Math.min(m, r.w), Infinity);
    cards.push(`<div class="card wt-card"><div class="card-h"><h2>Body mass index</h2><span class="muted small">height ${Math.floor(G.heightIn / 12)}′ ${fmtN(G.heightIn % 12, 1)}″</span></div>
      <div class="wt-gauge"><svg viewBox="0 0 220 124" aria-hidden="true">${seg}<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="8" class="g-dot"/></svg>
        <div class="wt-gauge-in"><div class="wt-big">${fmtN(b, 1)}</div><div class="muted small">${esc(cat?.[0] || '')}</div></div></div>
      <div class="list small" style="margin-top:6px">${BMI_CATS.map(c => `<div class="li"><span class="n"><i class="sw2" style="background:${c[3]}"></i>${c[0]}</span><span class="x">${c[1] === 0 ? `${f1(weightForBmi(c[2], u, G.heightIn) - 0.1)} ${u} or below` : c[2] === 99 ? `${f1(weightForBmi(c[1], u, G.heightIn))} ${u} or above` : `${f1(weightForBmi(c[1], u, G.heightIn))} – ${f1(weightForBmi(c[2], u, G.heightIn) - 0.1)} ${u}`}</span></div>`).join('')}</div>
      <div class="muted small" style="margin-top:6px">BMI is a rough screen: it doesn't tell muscle from fat. Body composition and your waist are better guides.</div></div>`);
  }

  // --- predictions: from your latest weigh-in, at a rate from your weigh-ins (or your commitment)
  const R = weightRates(today);
  if (G.goal != null && R) {
    const r = R[predMode], rows = [];
    const ahead = P ? P.items.filter(x => !x.reached) : [{ w: G.goal, goal: true }];
    for (const x of ahead) rows.push({ w: x.w, label: x.goal ? 'Goal' : `Milestone ${x.n}`, k: forecastDay(R, r, x.w, today), goal: x.goal });
    for (const e of G.events) if (e.date >= today) rows.push({ w: forecastWeight(R, r, e.date), label: e.name, k: e.date, event: true });
    rows.sort((a, b) => (a.k || '9999').localeCompare(b.k || '9999'));
    const toward = forecastDay(R, r, G.goal, today) != null;
    const inW = k => { const d = Math.round((keyToDate(k) - keyToDate(today)) / 864e5); return d < 14 ? plural(d, 'day') : d < 70 ? plural(Math.round(d / 7), 'week') : plural(Math.round(d / 30.4), 'month'); };
    cards.push(`<div class="card wt-card"><div class="card-h"><h2>Predictions</h2><span class="muted small">from ${f1(R.base)} ${u} on ${esc(fmtDay(R.baseK, { month: 'short', day: 'numeric' }))}</span></div>
      <div class="seg wt-seg" id="wt-pred">${[['current', 'Last 4 weeks', R.current], ['overall', 'Average', R.overall], ['commit', 'Commitment', R.commit]].map(([k, l, v]) => `<button data-p="${k}" class="${predMode === k ? 'on' : ''}">${l}<small>${v == null ? '—' : `${sgn(v)}/wk`}</small></button>`).join('')}</div>
      <p class="small" style="margin:10px 0 6px">${r == null ? 'Not enough weigh-ins yet for this rate.' : toward ? `At ${sgn(r)} ${u} a week from your latest weigh-in:` : `At ${sgn(r)} ${u} a week you're not moving toward your goal, so only event-date weights are shown.`}</p>
      <div class="list">${rows.filter(x => x.w != null).slice(0, 12).map(x => `<div class="li"><span class="n"><b>${f1(x.w)} ${u}</b> <span class="muted small">${esc(x.label)}</span></span><span class="x small">${x.k ? `${esc(fmtDay(x.k, { month: 'short', day: 'numeric', year: 'numeric' }))} <span class="muted">· in ${inW(x.k)}</span>` : '<span class="muted">—</span>'}</span></div>`).join('')}</div>
      <div class="muted small" style="margin-top:6px"><b>Last 4 weeks</b> is a straight line through your recent weigh-ins; <b>Average</b> is everything you've lost since the start, per week; <b>Commitment</b> is the rate you set. Both are straight lines, so dates further out are rougher.</div></div>`);
  }

  // --- body composition from the Withings scale (needs the script's Withings connection, v3.7+)
  const comps = compDays(today);
  if (comps.length) {
    const lastC = compOf(data.days[comps[comps.length - 1]]), fmtC = (f, v) => v == null ? '—' : f.mass ? `${fmtN(kgIn(v, u), 1)} ${u}` : `${fmtN(v, f.dp)}${f.unit ? (f.unit === '%' ? '%' : ' ' + f.unit) : ''}`;
    const rowsC = COMP_FIELDS.filter(f => lastC[f.key] != null).map(f => { const c = compChange(f.key, 30, today), dv = c?.diff == null ? null : f.mass ? kgIn(c.diff, u) : c.diff;
      const good = dv == null || Math.abs(dv) < (f.dp ? 0.05 : 0.5) ? '' : (dv < 0) === !!f.lower ? 'good' : 'bad';
      return `<div class="li"><span class="n">${esc(f.name)}${f.hint ? ` <span class="muted small">· ${esc(f.hint)}</span>` : ''}</span><span class="x"><b>${fmtC(f, lastC[f.key])}</b>${dv != null ? ` <span class="small ${good || 'muted'}">${!good ? '±0' : `${dv > 0 ? '+' : '−'}${fmtN(Math.abs(dv), f.dp)}`}</span>` : ''}</span></div>`; });
    const mix = lossMix(G.startDate || comps[0], today);
    cards.push(`<div class="card wt-card"><div class="card-h"><h2>Body composition</h2><span class="muted small">${lastC.source === 'withings' ? 'Withings' : 'Withings via Apple Health'} · ${esc(fmtDay(comps[comps.length - 1], { month: 'short', day: 'numeric' }))} · change over 30 days</span></div>
      <div class="list small">${rowsC.join('')}</div>
      ${mix ? `<p class="small" style="margin:10px 0 0${mix.flag ? ';color:var(--bad)' : ''}"><b>Since ${esc(fmtDay(mix.from, { month: 'short', day: 'numeric' }))}:</b> ${esc(mix.text)}${mix.flag ? ' That’s a lot of lean mass. Protein toward 130 g a day and two strength sessions a week protect it.' : ''}</p>` : ''}
      <div class="muted small" style="margin-top:6px">A smart scale estimates these from a small current through your feet, so single readings swing with water. Trust the direction over weeks, not one morning.</div></div>`);
  }

  // --- waist: weekly, and waist ÷ height (under 0.5 is the usual healthy line)
  { const W = waistStatus(today);
    if (W.k || G.heightIn) cards.push(`<div class="card wt-card"><div class="card-h"><h2>Waist</h2><span class="muted small">${W.k ? `measured ${esc(daysAgo(W.days))}${W.due ? ' · <b>due</b>' : ''}` : 'measure weekly, at the navel'}</span></div>
      ${W.k ? `<div class="wt-4"><div><b>${fmtN(W.w.v, 2)}</b><span>${esc(W.w.unit)} now</span></div><div class="${W.change < 0 ? 'down' : W.change > 0 ? 'up' : ''}"><b>${W.change == null ? '—' : `${W.change > 0 ? '+' : W.change < 0 ? '−' : ''}${fmtN(Math.abs(W.change), 2)}`}</b><span>in since ${W.since ? esc(fmtDay(W.since, { month: 'short', day: 'numeric' })) : 'the first'}</span></div>${W.ratio ? `<div class="${W.ratio < 0.5 ? 'down' : ''}"><b>${fmtN(W.ratio, 2)}</b><span>waist ÷ height</span></div>` : ''}</div>` : '<p class="muted small" style="margin:0">No measurements yet. Add one in <b>Log today › Measurements</b>.</p>'}
      ${G.heightIn ? `<div class="muted small" style="margin-top:8px">Under 0.5 of your height (${fmtN(G.heightIn / 2, 1)} in) is the usual healthy line. During fast loss the waist tells you it’s fat coming off better than the scale can.</div>` : ''}</div>`); }

  // --- your burn, learned from what you eat and what the scale does, and what that means as you get lighter
  { const B = learnedBurn(), sg = suggestedGoal(B, today), cur = dayGoalOn(today);
    let body;
    if (!B.ok) body = `<p class="small" style="margin:0">${esc(B.why)}</p><p class="muted small" style="margin:6px 0 0">Once it has 4 weeks of full Lose It days and weigh-ins, it works out what you actually burn a day, and what your calorie goal will do as you get lighter.</p>`;
    else {
      const ahead = [...new Set([B.wLb, ...(weightMilestones(today)?.items.filter(x => !x.reached).map(x => x.w) || []).filter((w, i, a) => i === 0 || i === a.length - 1 || w % 25 === 0)])].map(w => u === 'lb' ? w : w / 2.20462).slice(0, 5);
      const calNow = cur || B.intake, sd = slowdown(B, calNow, ahead);
      body = `<div class="wt-4"><div><b>${fmtN(B.burn)}</b><span>cal a day you burn</span></div><div><b>${fmtN(B.intake)}</b><span>average eaten</span></div><div class="${B.lbWk < 0 ? 'down' : 'up'}"><b>${B.lbWk > 0 ? '+' : '−'}${fmtN(Math.abs(u === 'lb' ? B.lbWk : B.lbWk / 2.20462), 1)}</b><span>${u} a week</span></div></div>
        <p class="muted small" style="margin:8px 0 0">From ${B.days} fully logged days and ${B.weighIns} weigh-ins in the last 4 weeks: what you ate, plus what the scale says it did (3,500 cal per lb).</p>
        <div class="sub-h" style="margin-top:12px">As you get lighter, eating ${fmtN(calNow)} a day</div>
        <div class="list small">${sd.map(x => `<div class="li"><span class="n"><b>${fmtN(x.w, 1)} ${u}</b> <span class="muted">burn about ${fmtN(x.burn)}</span></span><span class="x">${x.rate > 0.05 ? `about ${fmtN(x.rate, 1)} ${u}/week` : 'about level'}</span></div>`).join('')}</div>
        <p class="muted small" style="margin:6px 0 0">You burn about 10 cal a day less for every pound you lose, so the same calories lose less each month. That slowdown is expected, not a plateau.</p>
        ${sg && Math.abs(sg.cal - (cur || 0)) >= 50 ? `<div class="row" style="margin-top:10px"><span class="small grow">Suggested day’s calorie goal: <b>${fmtN(sg.cal)}</b> (${esc(sg.why)}). Now ${cur ? fmtN(cur) : 'not set'}.</span><button class="btn small" id="wb-use" data-cal="${sg.cal}">Use ${fmtN(sg.cal)}</button></div>` : ''}`;
    }
    cards.push(`<div class="card wt-card"><div class="card-h"><h2>Your burn</h2><span class="muted small">learned from your own numbers</span></div>${body}</div>`); }

  // --- goals and settings (editable here)
  const hFt = G.heightIn ? Math.floor(G.heightIn / 12) : '', hIn = G.heightIn ? Math.round((G.heightIn % 12) * 10) / 10 : '';
  const setCard = (`<details class="card wt-card wt-set"${G.goal == null || !G.heightIn ? ' open' : ''}><summary><h2 style="display:inline">Goals and settings</h2> <span class="muted small">${G.goal == null || !G.heightIn ? '— add your goal and height to see progress, BMI and predictions' : 'edit'}</span></summary>
    <div class="form-grid" style="margin-top:12px">
      <div><label>Goal weight (${u})</label><input type="number" step="0.1" id="wg-goal" value="${G.goal ?? ''}"></div>
      <div><label>Height</label><div class="row" style="flex-wrap:nowrap"><input type="number" id="wg-ft" value="${hFt}" placeholder="ft" style="width:70px"> ft <input type="number" step="0.5" id="wg-in" value="${hIn}" placeholder="in" style="width:80px"> in</div></div>
      <div><label>Starting weight (${u})</label><input type="number" step="0.1" id="wg-start" value="${weightCfg().start ?? ''}" placeholder="${f1(S.rows.find(x => x.w != null)?.w)} (first weigh-in)"></div>
      <div><label>Start date</label><input type="date" id="wg-sdate" value="${weightCfg().startDate || ''}"></div>
      <div><label>Milestone every (${u})</label><input type="number" step="0.5" min="0.5" id="wg-step" value="${G.step}"></div>
      <div><label>Committed rate (${u} per week)</label><input type="number" step="0.1" min="0" id="wg-rate" value="${G.rate}"></div>
      <div><label>Goal range, ± (${u})</label><input type="number" step="0.5" min="0" id="wg-range" value="${weightPlan().range}"></div>
      <div><label>Maintenance practice at (${u})</label><input type="text" id="wg-cps" value="${esc(weightPlan().checkpoints.join(', '))}" placeholder="e.g. 250, 225"></div>
    </div>
    <div class="sub-h" style="margin-top:14px">Events</div>
    <div class="list small" id="wg-events">${G.events.map((e, i) => `<div class="li"><span class="n">${esc(e.name)} <span class="muted">· ${esc(fmtDay(e.date, { month: 'short', day: 'numeric', year: 'numeric' }))}</span></span><button class="del" data-wev="${i}" aria-label="Remove event">×</button></div>`).join('') || '<p class="muted" style="margin:0">None yet, e.g. a reunion, trip or wedding.</p>'}</div>
    <div class="row" style="margin-top:8px"><input type="text" id="wg-ename" placeholder="Event name" class="grow"><input type="date" id="wg-edate" style="width:auto"><button class="btn small" id="wg-eadd">Add event</button></div>
    <div class="row" style="margin-top:12px"><button class="btn primary small" id="wg-save" style="margin-left:auto">Save</button></div></details>`);
  top.innerHTML = latestCard + paceNote;
  // Progress (long, with every milestone) gets its own column; the smaller cards pack beside it in their own grid,
  // so they don't stretch to its height. On a phone everything stacks.
  box.innerHTML = phaseCard() + `<div class="wt-grid${progCard ? '' : ' no-prog'}">${progCard ? `<div class="wt-col">${progCard}</div>` : ''}<div class="wt-side">${cards.join('')}</div></div>${setCard}`;
}

// Losing, practising maintenance (2 weeks at a checkpoint), or maintaining inside your goal range. See phaseOf in rules.js.
function phaseCard() {
  const o = phaseOffer(), u = weightUnit(), B = learnedBurn(), f1 = v => fmtN(v, 1);
  if (!o) return '';
  const cal = B.ok ? Math.round(B.burn / 50) * 50 : null, calTxt = cal ? `about <b>${fmtN(cal)}</b> a day (your learned burn)` : 'your learned burn (it needs 4 weeks of full logging and weigh-ins first)';
  const card = (h, body, btns, tone = '') => `<div class="card"${tone ? ` style="border-color:${tone}"` : ''}><div class="card-h"><h2>${h}</h2></div>${body}${btns ? `<div class="row" style="margin-top:10px">${btns}</div>` : ''}</div>`;
  if (o.kind === 'checkpoint') return card(`Maintenance practice at ${f1(o.checkpoint)} ${u}`,
    `<p style="margin:0">You’ve reached ${f1(o.checkpoint)}. Spend 2 weeks eating ${calTxt} to hold steady. It rehearses keeping weight off, which is what most plans never practise, and gives your body a break.</p><p class="muted small" style="margin:6px 0 0">The scale may rise 2–4 ${u} in the first days. That’s water and stored carbs refilling, not fat.</p>`,
    `${cal ? `<button class="btn primary small" data-ph="practice" data-cp="${o.checkpoint}" data-cal="${cal}">Start 2 weeks</button>` : ''}<button class="btn small" data-ph="skip" data-cp="${o.checkpoint}">Skip this one</button>`);
  if (o.kind === 'practicing') return card('Practising maintenance',
    `<p style="margin:0">Day ${15 - o.left} of 14 at ${o.ph.checkpoint ? f1(o.ph.checkpoint) + ' ' + u : 'this weight'}, eating about <b>${fmtN(o.ph.cal)}</b> a day. Your meal boxes tick when the day is within that.</p><p class="muted small" style="margin:6px 0 0">${o.rate == null ? 'Weigh in daily to see how steady you are.' : o.steady ? `Holding steady (${o.rate > 0 ? '+' : ''}${f1(o.rate)} ${u} a week over 2 weeks).` : `Not quite level yet (${o.rate > 0 ? '+' : ''}${f1(o.rate)} ${u} a week): that’s normal in the first week.`}</p>`,
    `<button class="btn small" data-ph="end">End early</button>`);
  if (o.kind === 'finished') return card('Maintenance practice done',
    `<p style="margin:0">Two weeks at about ${fmtN(o.ph.cal)} a day${o.change != null ? `: your trend moved ${o.change > 0 ? '+' : ''}${f1(o.change)} ${u}` : ''}. ${o.change != null && Math.abs(o.change) <= 2 ? 'That’s holding steady: you know what maintenance feels like now.' : 'Next time, adjust by about 100 cal a day toward level.'}</p>`,
    `<button class="btn primary small" data-ph="lose">Back to losing</button>`);
  if (o.kind === 'atGoal') return card('You’re in your goal range',
    `<p style="margin:0">Your trend is inside ${f1(o.bottom)}–${f1(o.top)} ${u}. Switch to maintenance: eat ${calTxt}, and the alarm watches for drifting up out of the range instead.</p>`,
    cal ? `<button class="btn primary small" data-ph="maintain" data-cal="${cal}">Switch to maintenance</button>` : '');
  if (o.kind === 'maintaining') return card('Maintaining',
    `<p style="margin:0">Range ${f1(o.bottom)}–${f1(o.top)} ${u} · trend ${o.trend == null ? '—' : f1(o.trend)} ${o.inRange ? '✓ inside' : '· outside'}. Eating about <b>${fmtN(o.ph.cal)}</b> a day ticks your meal boxes.</p>`,
    `<button class="btn small" data-ph="lose">Back to losing</button>`, o.inRange ? '' : 'var(--warn-ink)');
  return '';
}
async function setPhase(btn) {
  const P = weightPlan(), cp = num(btn.dataset.cp), cal = num(btn.dataset.cal), today = todayKey(), done = cp != null ? [...new Set([...P.practiceDone, cp])] : P.practiceDone;
  const kind = btn.dataset.ph;
  const phase = kind === 'practice' ? { kind: 'practice', since: today, until: addDays(today, 13), cal, checkpoint: cp } : kind === 'maintain' ? { kind: 'maintain', since: today, cal } : null;
  data.weightCfg = { ...(data.weightCfg || {}), phase: kind === 'skip' ? P.phase : phase, practiceDone: done };
  planDirty = true; await savePersist(); renderMetric(); renderDash();
  toast({ practice: 'Maintenance practice started: 2 weeks.', skip: 'Skipped. The next checkpoint will offer it again.', end: 'Back to losing.', lose: 'Back to losing.', maintain: 'Maintenance on.' }[kind]);
}
async function saveWeightCfg(extra = {}) {
  const v = id => num($(id).value);
  const ft = v('#wg-ft'), inch = v('#wg-in');
  const cps = $('#wg-cps') ? $('#wg-cps').value.split(/[,\s]+/).map(Number).filter(x => x > 0) : undefined;
  data.weightCfg = { ...weightCfg(), goal: v('#wg-goal'), heightIn: ft != null || inch != null ? (ft || 0) * 12 + (inch || 0) : null,
    start: v('#wg-start'), startDate: $('#wg-sdate').value || null, step: v('#wg-step') || 5, rate: v('#wg-rate') ?? 1,
    ...($('#wg-range') ? { range: v('#wg-range') ?? 5 } : {}), ...(cps ? { checkpoints: cps } : {}), ...extra };
  planDirty = true;
  await savePersist();
  renderMetric();
}

// Weight chart on the detail page: faint daily weigh-ins, the trend line, and a dashed projection to the goal.
function weightChartData(keys) {
  const S = weightSeries(), G = weightGoals(S), today = todayKey();
  const raw = keys.map(k => S.byKey[k]?.w ?? null), trend = keys.map(k => S.byKey[k]?.t ?? null);
  const labels = keys.slice(), proj = keys.map(() => null);
  const end = keys[keys.length - 1], R = weightRates(today);
  // The dashed projection starts at your latest weigh-in and follows the selected prediction rate (see weightRates).
  if (end >= today && G.goal != null && R) {
    const r = R[predMode], from = forecastWeight(R, r, today);
    if (r && forecastDay(R, r, G.goal, today)) {
      const daysToGoal = Math.round((G.goal - from) / r * 7), extend = Math.min(daysToGoal, Math.max(14, Math.round(keys.length * 0.6)));
      proj[proj.length - 1] = from;
      for (let i = 1; i <= extend; i++) { labels.push(addDays(end, i)); raw.push(null); trend.push(null); proj.push(from + r * i / 7); }
    }
  }
  return { labels, raw, trend, proj, unit: S.unit };
}
