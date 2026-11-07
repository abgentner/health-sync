'use strict';
// Health Sync · metric detail pages (charts, breakdowns, daily log) and charts.
// One of the app's screen files: classic scripts that share one global scope, loaded in order by index.html.
/* ================= metric details ================= */
const METRICS = {
  steps:  { name: 'Steps', c: '--c-steps', unit: 'steps', dp: 0, kind: 'bar', sum: true },
  cal:    { name: 'Calories eaten', c: '--c-cal', unit: 'cal', dp: 0, kind: 'bar', sum: true },
  ex:     { name: 'Exercise', c: '--c-ex', unit: 'min', dp: 0, kind: 'bar', sum: true },
  weight: { name: 'Weight', c: '--c-weight', unit: 'lb', dp: 1, kind: 'line', lowerIsBetter: true },
  mood:   { name: 'Mood', c: '--c-mood', unit: '/ 5', dp: 1, kind: 'line', min: 1, max: 5 },
  sleep:  { name: 'Sleep', c: '--c-sleep', unit: 'h', dp: 1, kind: 'bar' },
  anchor: { name: 'Daily anchors', c: '--c-anchor', unit: 'boxes', dp: 1, kind: 'bar' },
};
Object.assign(METRICS, HEALTH_METRICS);
let metricKey = null;

function metricValue(key, k, wUnit) {
  const d = getDay(k);
  if (!d) return null;
  switch (key) {
    case 'steps': return d.steps ?? null;
    case 'cal': { const t = totals(d); return t.hasFood ? t.calIn : null; }
    case 'ex': return totals(d).exMin;   // a day with data but no workout counts as 0
    case 'weight': return d.weight == null ? null : (d.weightUnit || 'lb') === wUnit ? d.weight : wUnit === 'lb' ? d.weight * 2.20462 : d.weight / 2.20462;
    case 'mood': return d.feel?.mood ?? null;
    case 'sleep': return sleepHours(d);
    case 'anchor': return anchorCount(d);
    default: return HEALTH_METRICS[key] ? healthValue(d, key) : null;
  }
  return null;
}
const rolling = (vals, n = 7) => vals.map((_, i) => avg(vals.slice(Math.max(0, i - n + 1), i + 1).filter(v => v != null)));
function slopePerWeek(vals) {
  const pts = vals.map((v, i) => v == null ? null : [i, v]).filter(Boolean);
  if (pts.length < 3) return null;
  const mx = avg(pts.map(p => p[0])), my = avg(pts.map(p => p[1]));
  const den = pts.reduce((s, [x]) => s + (x - mx) ** 2, 0);
  return den ? pts.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / den * 7 : null;
}
const median = a => { if (!a.length) return null; const b = [...a].sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };

function openMetric(key) {
  if (!METRICS[key]) return;
  noteUse('page:' + key);
  // Going from one metric to another replaces the page in history, so Back always returns to the dashboard.
  if (location.hash !== '#m/' + key) history[metricKey ? 'replaceState' : 'pushState']({ m: key }, '', '#m/' + key);
  showMetric(key);
}
function showMetric(key) {
  metricKey = key;
  $$('section.tab').forEach(s => s.hidden = s.id !== 'tab-metric');
  $$('#tabs button').forEach(x => x.classList.toggle('on', x.dataset.tab === 'dash'));
  if (!$('#m-range').dataset.set) { $('#m-range').value = ['30', '90', '365'].includes($('#d-range').value) ? $('#d-range').value : '90'; }
  window.scrollTo(0, 0);
  renderMetric();
}
function closeMetric() {
  metricKey = null;
  $$('section.tab').forEach(s => s.hidden = s.id !== 'tab-dash');
  $$('#tabs button').forEach(x => x.classList.toggle('on', x.dataset.tab === 'dash'));
  renderDash();
}
function backToDash() {
  if (history.state && history.state.m) history.back();
  else { history.replaceState(null, '', location.pathname + location.search); closeMetric(); }
}

function renderMetric() {
  const key = metricKey, M = METRICS[key];
  if (!key) return;
  const wUnit = weightUnit();
  const unit = key === 'weight' ? wUnit : M.unit;
  let end = dashDate, n;
  const allKeys = Object.keys(data.days).sort();
  const custom = $('#m-range').value === 'custom';
  $('#m-custom').hidden = !custom;
  if (custom) {
    let a = $('#m-from').value, b = $('#m-to').value;
    if (!a || !b) { b = dashDate; a = addDays(b, -29); }
    if (a > b) [a, b] = [b, a];
    $('#m-from').value = a; $('#m-to').value = b;
    end = b;
    n = Math.round((keyToDate(b) - keyToDate(a)) / 864e5) + 1;
  } else {
    n = +$('#m-range').value;
    if (!n) n = allKeys.length ? Math.max(7, Math.round((keyToDate(end) - keyToDate(allKeys[0])) / 864e5) + 1) : 30;
  }
  const keys = windowKeys(end, n);
  const vals = keys.map(k => metricValue(key, k, wUnit));
  const have = vals.filter(v => v != null);
  const prevVals = windowKeys(addDays(keys[0], -1), n).map(k => metricValue(key, k, wUnit)).filter(v => v != null);

  $('#m-title').innerHTML = `<span class="sw" style="--c:var(${M.c})"></span>${esc(M.name)}`;
  $('#m-sub').dataset.from = keys[0]; $('#m-sub').dataset.to = end;
  $('#m-sub').textContent = `${fmtDay(keys[0], { month: 'short', day: 'numeric', year: 'numeric' })} – ${fmtDay(end, { month: 'short', day: 'numeric', year: 'numeric' })} · ${plural(have.length, 'day')} with data`;

  // ---- stat tiles
  const f = v => v == null ? '—' : fmtN(v, M.dp);
  const a = avg(have), pa = avg(prevVals);
  let bestI = -1, lowI = -1;
  vals.forEach((v, i) => { if (v == null) return; if (bestI < 0 || v > vals[bestI]) bestI = i; if (lowI < 0 || v < vals[lowI]) lowI = i; });
  const day = i => i < 0 ? '' : fmtDay(keys[i], { month: 'short', day: 'numeric' });
  const slope = slopePerWeek(vals);
  const change = a != null && pa != null && pa !== 0 ? (a - pa) / Math.abs(pa) * 100 : null;
  const st = (label, v, u, sub) => `<div class="tile" style="--c:var(${M.c})"><div class="top"><span class="k">${esc(label)}</span></div><div class="v">${v}${u ? `<span class="u">${esc(u)}</span>` : ''}</div><div class="s">${sub || '&nbsp;'}</div></div>`;
  const tiles = [
    st('Average', f(a), a != null ? unit + (M.sum || key === 'sleep' || key === 'anchor' ? ' / day' : '') : '', key === 'mood' && a ? MOODS[Math.round(a) - 1] + ' on average' : `median ${f(median(have))}`),
    st(M.lowerIsBetter ? 'Highest' : 'Best day', bestI < 0 ? '—' : f(vals[bestI]), bestI < 0 ? '' : unit, day(bestI)),
    st('Lowest', lowI < 0 ? '—' : f(vals[lowI]), lowI < 0 ? '' : unit, day(lowI)),
    M.sum ? st('Total', fmtN(have.reduce((x, y) => x + y, 0)), unit, `over ${plural(have.length, 'day')}`)
      : key === 'weight' ? st('Change', have.length > 1 ? `${have[have.length - 1] - have[0] > 0 ? '+' : ''}${fmtN(have[have.length - 1] - have[0], 1)}` : '—', have.length > 1 ? unit : '', 'first to last reading')
      : st('Days logged', String(have.length), `of ${n}`, `${Math.round(have.length / n * 100)}% of days`),
    st('vs previous period', change == null ? '—' : `${change > 0 ? '+' : ''}${fmtN(change, 0)}%`, '', pa == null ? 'no earlier data' : `was ${f(pa)} ${unit} the ${plural(n, 'day')} before`),
    st('Trend', slope == null ? '—' : `${slope > 0 ? '+' : ''}${fmtN(slope, M.dp || (Math.abs(slope) < 10 ? 1 : 0))}`, slope == null ? '' : unit + ' / week', slope == null ? 'needs more data' : Math.abs(slope) < 1e-9 ? 'flat' : slope > 0 ? 'going up' : 'going down'),
  ];
  $('#m-stats').innerHTML = tiles.join('');

  // ---- main chart: daily values + 7-day average
  const cs = getComputedStyle(document.documentElement);
  const color = cs.getPropertyValue(M.c).trim(), grid = cs.getPropertyValue('--grid').trim(), muted = cs.getPropertyValue('--muted').trim(), surface = cs.getPropertyValue('--surface').trim();
  const roll = rolling(vals);
  $('#m-legend').innerHTML = `<span style="--c:${color}"><i class="${M.kind === 'bar' ? 'bx' : 'bx'}" style="--c:${color}"></i>Daily</span><span><i class="ln" style="--c:${color}"></i>7-day average</span>`;
  $('#m-legend').querySelectorAll('i').forEach(i => { i.style.display = 'inline-block'; });
  const labels = keys.map(k => fmtDay(k, n > 200 ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' }));
  $('#m-chart-t').textContent = 'Day by day';
  charts['m-chart']?.destroy();
  if (key === 'weight') {
    const W = weightChartData(keys);
    $('#m-chart-t').textContent = 'Weigh-ins and trend';
    $('#m-legend').innerHTML = `<span><i class="bx" style="--c:${color};display:inline-block;border-radius:50%"></i>Weigh-in</span><span><i class="ln" style="--c:${color};display:inline-block"></i>Trend</span>${W.proj.some(v => v != null) ? `<span><i class="ln" style="--c:${color};display:inline-block;opacity:.5"></i>Projection</span>` : ''}`;
    charts['m-chart'] = new Chart($('#m-chart'), {
      data: { labels: W.labels.map(k => fmtDay(k, W.labels.length > 200 ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' })), datasets: [
        { type: 'line', label: 'Weigh-in', data: W.raw, showLine: false, pointRadius: 3.5, pointHoverRadius: 6, pointBackgroundColor: hexA(color, 0.35), pointBorderColor: hexA(color, 0.6), order: 2 },
        { type: 'line', label: 'Trend', data: W.trend, borderColor: color, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 4, tension: 0.25, spanGaps: true, order: 1 },
        { type: 'line', label: 'Projection', data: W.proj, borderColor: hexA(color, 0.55), borderDash: [6, 5], borderWidth: 2, pointRadius: 0, spanGaps: true, order: 3 },
      ] },
      options: {
        responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { display: false }, tooltip: { filter: i => i.parsed.y != null, callbacks: { label: c => `${c.dataset.label}: ${fmtN(c.parsed.y, 1)} ${W.unit}` } } },
        scales: { x: { grid: { display: false }, border: { color: grid }, ticks: { color: muted, maxTicksLimit: 8, maxRotation: 0, autoSkip: true } }, y: { grid: { color: grid }, border: { display: false }, ticks: { color: muted, maxTicksLimit: 6 } } },
      },
    });
  } else
  charts['m-chart'] = new Chart($('#m-chart'), {
    data: { labels, datasets: [
      M.kind === 'bar'
        ? { type: 'bar', label: 'Daily', data: vals, backgroundColor: hexA(color, 0.4), borderRadius: 3, borderSkipped: 'start', maxBarThickness: 18, categoryPercentage: 0.9, barPercentage: 0.9, order: 2 }
        : { type: 'line', label: 'Daily', data: vals, borderColor: hexA(color, 0.45), backgroundColor: hexA(color, 0.45), borderWidth: 1.5, pointRadius: n > 60 ? 1.5 : 3, pointHoverRadius: 5, spanGaps: true, order: 2 },
      { type: 'line', label: '7-day average', data: roll, borderColor: color, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 4, pointBackgroundColor: color, pointBorderColor: surface, tension: 0.3, cubicInterpolationMode: 'monotone', spanGaps: true, order: 1 },
    ] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: 'index', intersect: false },
      onClick: (_, els) => { if (els.length) { dashDate = keys[els[0].index]; backToDash(); } },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => `${c.dataset.label}: ${c.parsed.y == null ? 'no data' : f(c.parsed.y) + ' ' + unit}` } } },
      scales: {
        x: { grid: { display: false }, border: { color: grid }, ticks: { color: muted, maxTicksLimit: 8, maxRotation: 0, autoSkip: true } },
        y: { beginAtZero: key !== 'weight', ...(M.min ? { min: M.min, max: M.max } : {}), grid: { color: grid }, border: { display: false }, ticks: { color: muted, maxTicksLimit: 6 } },
      },
    },
  });

  renderWeightExtras();
  renderStepHours(key, keys, color, grid, muted);

  // ---- by day of week (Mon–Sun)
  const dow = [[], [], [], [], [], [], []];
  keys.forEach((k, i) => { if (vals[i] != null) dow[(keyToDate(k).getDay() + 6) % 7].push(vals[i]); });
  const dowAvg = dow.map(avg);
  charts['m-dow']?.destroy();
  charts['m-dow'] = new Chart($('#m-dow'), {
    type: 'bar',
    data: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], datasets: [{ data: dowAvg, backgroundColor: color, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 28 }] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      plugins: { legend: { display: false }, tooltip: { displayColors: false, callbacks: { label: c => c.parsed.y == null ? 'no data' : `${f(c.parsed.y)} ${unit} (${plural(dow[c.dataIndex].length, 'day')})` } } },
      scales: { x: { grid: { display: false }, border: { color: grid }, ticks: { color: muted } }, y: { beginAtZero: key !== 'weight', ...(M.min ? { min: M.min, max: M.max } : {}), grid: { color: grid }, border: { display: false }, ticks: { color: muted, maxTicksLimit: 5 } } },
    },
  });

  // ---- breakdown card
  const [title, html] = metricExtra(key, keys, vals, color, unit);
  $('#m-extra-t').textContent = title;
  $('#m-extra').innerHTML = html;

  // ---- daily table, newest first
  const cols = metricColumns(key);
  $('#m-thead').innerHTML = `<tr><th>Date</th><th>${esc(M.name)}</th><th>7-day avg</th>${cols.map(c => `<th>${esc(c[0])}</th>`).join('')}</tr>`;
  $('#m-tbody').innerHTML = keys.map((k, i) => ({ k, i })).filter(r => vals[r.i] != null).reverse().map(({ k, i }) =>
    `<tr data-k="${k}"><td>${esc(fmtDay(k, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }))}</td><td>${f(vals[i])}</td><td>${f(roll[i])}</td>${cols.map(c => `<td>${c[1](getDay(k)) ?? '—'}</td>`).join('')}</tr>`).join('')
    || `<tr><td colspan="${3 + cols.length}" class="muted">No data in this period.</td></tr>`;
  sortTable('m');
}

function metricColumns(key) {
  switch (key) {
    case 'cal': return [['Source', d => { const t = totals(d), p = foodPartial(d, d._k) ? ' (partial)' : ''; return (t.fromHealth ? 'Apple Health totals' : esc([...new Set((d.food || []).map(f => srcName(f.source)))].join(', ')) || '—') + p; }], ['Protein g', d => fmtN(totals(d).protein)], ['Carbs g', d => fmtN(totals(d).carbs)], ['Fat g', d => fmtN(totals(d).fat)], ['Fiber g', d => fmtN(totals(d).fiber)], ['Sugars g', d => fmtN(totals(d).sugar)], ['Sodium mg', d => fmtN(totals(d).sodium)]];
    case 'ex': return [['Workouts', d => esc((d.workouts || []).map(w => w.title || w.type).join(', ')) || '—'], ['Cal burned', d => totals(d).hasEx ? fmtN(totals(d).burn) : '—']];
    case 'mood': return [['Energy', d => d.feel?.energy ?? '—'], ['Stress', d => d.feel?.stress ?? '—'], ['Tags', d => esc((d.feel?.tags || []).join(', ')) || '—']];
    case 'sleep': return [['Score', d => d.sleep?.score ?? '—'], ['Source', d => esc(srcLabel(d.sleep?.source, d.sleep?.via))]];
    case 'steps': return [['Source', d => esc(srcLabel(d.stepsSource, d.stepsVia))]];
    case 'weight': return [['Source', d => esc(srcLabel(d.weightSource, d.weightVia))]];
    case 'anchor': return anchorCfg().names.map((nm, i) => [nm, d => { const s = anchorState(d, i); return s.on ? '✓' : s.half ? '½' : '·'; }]);
  }
  return [];
}

function hbars(rows, color, fmt) {
  const max = Math.max(...rows.map(r => r[1]), 0) || 1;
  return `<div class="hbars" style="--c:${color}">${rows.map(([l, v, extra]) => `<div class="hb"><span class="l" title="${esc(l)}">${esc(l)}</span><span class="t"><i style="width:${Math.max(2, v / max * 100)}%"></i></span><span class="x">${fmt(v)}${extra ? ' · ' + extra : ''}</span></div>`).join('')}</div>`;
}

// Steps across the day, scaled so each day's hours add up to its real total (Apple's de-duplicated count).
function stepsByHour(k) {
  const d = getDay(k), h = d?.stepsHours, sum = h ? h.reduce((a, b) => a + b, 0) : 0;
  if (!sum) return null;
  const total = d.steps ?? sum;
  return h.map(v => v / sum * total);
}
const HOUR_LABELS = Array.from({ length: 24 }, (_, h) => h === 0 ? '12a' : h < 12 ? h + 'a' : h === 12 ? '12p' : (h - 12) + 'p');
function renderStepHours(key, keys, color, grid, muted) {
  const card = $('#m-hours-card');
  charts['m-hours']?.destroy();
  card.hidden = key !== 'steps';
  if (key !== 'steps') return;
  const per = keys.map(stepsByHour).filter(Boolean);
  const focusKey = [...keys].reverse().find(k => stepsByHour(k)), focus = focusKey ? stepsByHour(focusKey) : null;
  if (!per.length) {
    $('#m-hours-legend').innerHTML = '';
    $('#m-hours-note').innerHTML = 'No steps-by-hour data in this range yet. To get it, add a second automation in Health Auto Export that sends <b>Step Count</b> by the <b>hour</b> (README › Steps by time of day).';
    return;
  }
  const avgH = Array.from({ length: 24 }, (_, h) => Math.round(per.reduce((s, a) => s + a[h], 0) / per.length));
  const share = (a, from, to) => Math.round(a.slice(from, to).reduce((x, y) => x + y, 0) / a.reduce((x, y) => x + y, 0) * 100);
  $('#m-hours-legend').innerHTML = `<span><i class="bx" style="--c:${color};display:inline-block"></i>Average (${plural(per.length, 'day')})</span><span><i class="ln" style="--c:${color};display:inline-block"></i>${esc(fmtDay(focusKey))}</span>`;
  $('#m-hours-note').textContent = `On average: ${share(avgH, 5, 12)}% before noon · ${share(avgH, 12, 17)}% noon–5 pm · ${share(avgH, 17, 24)}% after 5 pm. Each day is scaled to its real step total.`;
  charts['m-hours'] = new Chart($('#m-hours'), {
    data: { labels: HOUR_LABELS, datasets: [
      { type: 'bar', label: 'Average', data: avgH, backgroundColor: hexA(color, 0.4), borderRadius: 3, borderSkipped: 'start', categoryPercentage: 0.9, barPercentage: 0.9, order: 2 },
      { type: 'line', label: fmtDay(focusKey), data: focus.map(Math.round), borderColor: color, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, tension: 0.3, order: 1 },
    ] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: { callbacks: { title: i => { const h = i[0].dataIndex; return `${HOUR_LABELS[h]}–${HOUR_LABELS[(h + 1) % 24]}`; }, label: c => `${c.dataset.label}: ${fmtN(c.parsed.y)} steps` } } },
      scales: { x: { grid: { display: false }, border: { color: grid }, ticks: { color: muted, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } }, y: { beginAtZero: true, grid: { color: grid }, border: { display: false }, ticks: { color: muted, maxTicksLimit: 5 } } },
    },
  });
}
function metricExtra(key, keys, vals, color, unit) {
  const D = keys.map(getDay).filter(Boolean);
  const none = '<p class="muted small" style="margin:0">Not enough data in this period yet.</p>';
  const have = vals.filter(v => v != null);
  if (key === 'steps') {
    const b = [['Under 5,000', v => v < 5000], ['5,000 – 7,499', v => v >= 5000 && v < 7500], ['7,500 – 9,999', v => v >= 7500 && v < 10000], ['10,000+', v => v >= 10000]];
    return ['How many steps', have.length ? hbars(b.map(([l, t]) => [l, have.filter(t).length]), color, v => plural(v, 'day')) : none];
  }
  if (key === 'cal') {
    const T = D.map(totals).filter(t => t.hasFood);
    if (!T.length) return ['Breakdown', none];
    const P = avg(T.map(t => t.protein)), C = avg(T.map(t => t.carbs)), F = avg(T.map(t => t.fat));
    const kc = P * 4 + C * 4 + F * 9 || 1;
    const meals = {};
    D.forEach(d => { const per = {}; (d.food || []).forEach(x => { const m = x.meal || 'Other'; per[m] = (per[m] || 0) + (x.calories || 0); }); Object.entries(per).forEach(([m, c]) => (meals[m] ||= []).push(c)); });
    const order = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    const mealRows = Object.entries(meals).sort((a, b) => (order.indexOf(a[0]) + 1 || 9) - (order.indexOf(b[0]) + 1 || 9)).map(([m, a]) => [m, avg(a), `${plural(a.length, 'day')}`]);
    const foods = {};
    D.forEach(d => (d.food || []).forEach(x => { const e = foods[x.name] ||= { n: 0, cal: 0 }; e.n++; e.cal += x.calories || 0; }));
    const top = Object.entries(foods).sort((a, b) => b[1].n - a[1].n).slice(0, 8).map(([nm, e]) => [nm, e.n, `${fmtN(e.cal / e.n)} cal each`]);
    return ['Nutrition breakdown',
      `<div class="sub-h">Average macros per day</div>${hbars([['Protein', P, `${Math.round(P * 4 / kc * 100)}%`], ['Carbs', C, `${Math.round(C * 4 / kc * 100)}%`], ['Fat', F, `${Math.round(F * 9 / kc * 100)}%`]], color, v => fmtN(v) + ' g')}
       ${(() => { const Dm = D.filter(d => d.micros && !foodPartial(d, d._k)); if (!Dm.length) return ''; const rows = MICROS.map(m => [m, Dm.map(d => d.micros[m.key]).filter(v => v != null)]).filter(([, a]) => a.length);
         return `<div class="sub-h">Vitamins and minerals (average per day · ${plural(Dm.length, 'day')} · % of daily value)</div>${hbars(rows.map(([m, a]) => { const v = avg(a); return [m.name, m.dv ? Math.min(150, v / m.dv * 100) : 0, `${fmtN(v, v < 10 ? 1 : 0)} ${m.u}`]; }), color, v => v ? Math.round(v) + '%' : '—')}<p class="muted small" style="margin:6px 0 0">From Apple Health; only foods with vitamin and mineral data in Lose It are counted.</p>`; })()}
       <div class="sub-h">Other nutrients (average per day)</div><div class="nutr">${NUTRIENTS.slice(3).map(n => `<div><span>${n.name}</span><b>${fmtN(avg(T.map(t => t[n.key])))} ${n.u}</b></div>`).join('')}</div>
       <div class="sub-h">Average calories by meal</div>${hbars(mealRows, color, v => fmtN(v) + ' cal')}
       <div class="sub-h">Most-logged foods</div>${hbars(top, color, v => v + '×')}`];
  }
  if (key === 'ex') {
    const types = {};
    let dist = 0, longest = null;
    D.forEach((d, i) => (d.workouts || []).forEach(w => { const e = types[w.type || 'Workout'] ||= { min: 0, n: 0 }; e.min += w.durationMin || 0; e.n++; dist += w.distance || 0; if (!longest || (w.durationMin || 0) > (longest.durationMin || 0)) longest = w; }));
    const rows = Object.entries(types).sort((a, b) => b[1].min - a[1].min).map(([t, e]) => [t, e.min, plural(e.n, 'workout')]);
    if (!rows.length) return ['By activity', none];
    const du = settings.units === 'metric' ? 'km' : 'mi';
    return ['By activity', `${hbars(rows, color, v => fmtN(v) + ' min')}<p class="small muted" style="margin:14px 0 0">Total distance ${fmtN(dist, 1)} ${du}${longest ? ` · longest: ${esc(longest.title || longest.type)}, ${fmtN(longest.durationMin)} min` : ''}</p>`];
  }
  if (key === 'weight') {
    const weeks = {};
    keys.forEach((k, i) => { if (vals[i] != null) (weeks[weekStart(k)] ||= []).push(vals[i]); });
    const rows = Object.entries(weeks).sort().map(([w, a]) => [w, avg(a)]);
    if (!rows.length) return ['Weekly averages', none];
    return ['Weekly averages', `<div class="list">${rows.reverse().slice(0, 16).map(([w, v], i, arr) => { const prev = arr[i + 1]?.[1]; const dlt = prev != null ? v - prev : null; return `<div class="li"><span class="n">Week of ${esc(fmtDay(w, { month: 'short', day: 'numeric' }))}</span><span class="x">${fmtN(v, 1)} ${esc(unit)}${dlt != null ? ` <span class="muted">(${dlt > 0 ? '+' : ''}${fmtN(dlt, 1)})</span>` : ''}</span></div>`; }).join('')}</div>`];
  }
  if (key === 'mood') {
    const F = D.map(d => d.feel).filter(Boolean);
    if (!F.length) return ['Mood breakdown', none];
    const dist = [5, 4, 3, 2, 1].map(m => [`${MOODS[m - 1]}  ${m}`, F.filter(f => f.mood === m).length]);
    const tags = {};
    F.forEach(f => (f.tags || []).forEach(t => { const e = tags[t.toLowerCase()] ||= []; if (f.mood) e.push(f.mood); }));
    const trows = Object.entries(tags).sort((a, b) => b[1].length - a[1].length).slice(0, 8).map(([t, m]) => [t, m.length, m.length ? `avg mood ${fmtN(avg(m), 1)}` : '']);
    const en = avg(F.map(f => f.energy).filter(Boolean)), sx = avg(F.map(f => f.stress).filter(Boolean));
    return ['Mood breakdown', `<div class="sub-h">How often</div>${hbars(dist, color, v => plural(v, 'day'))}
      <p class="small muted" style="margin:12px 0 0">Average energy ${en ? fmtN(en, 1) : '—'} / 5 · average stress ${sx ? fmtN(sx, 1) : '—'} / 5</p>
      ${trows.length ? `<div class="sub-h">Top tags</div>${hbars(trows, color, v => plural(v, 'day'))}` : ''}`];
  }
  if (key === 'sleep') {
    const b = [['Under 6 h', v => v < 6], ['6 – 7 h', v => v >= 6 && v < 7], ['7 – 8 h', v => v >= 7 && v < 8], ['8 h +', v => v >= 8]];
    const sc = avg(D.map(d => d.sleep?.score).filter(v => typeof v === 'number'));
    return ['How long you slept', have.length ? `${hbars(b.map(([l, t]) => [l, have.filter(t).length]), color, v => plural(v, 'night'))}${sc ? `<p class="small muted" style="margin:12px 0 0">Average sleep score ${fmtN(sc)}</p>` : ''}` : none];
  }
  if (key === 'anchor') {
    const c = anchorCfg();
    const per = c.names.map((nm, i) => [nm, D.reduce((n, d) => n + anchorState(d, i, undefined, c).value, 0)]);
    const weeks = [...new Set(keys.map(weekStart))].filter(ws => addDays(ws, 6) < todayKey() && ws >= keys[0]);
    const met = weeks.filter(ws => weekTotal(ws) >= c.target).length;
    let streak = 0; for (const ws of [...weeks].reverse()) { if (weekTotal(ws) >= c.target) streak++; else break; }
    return ['Box by box', `${hbars(per.map(([nm, v]) => [nm, v, `${Math.round(v / keys.length * 100)}%`]), color, v => plural(v, 'day'))}
      <p class="small muted" style="margin:14px 0 0">Goal of ${c.target} met in <b>${met} of ${plural(weeks.length, 'full week')}</b>${streak ? ` · current streak: ${plural(streak, 'week')} 🔥` : ''}</p>`];
  }
  if (HEALTH_METRICS[key]) {
    const srcs = new Set(D.map(d => d.health?.[key] != null ? 'Apple Health' : d.garmin?.[key] != null || (key === 'restingHR' && d.restingHR != null) ? 'Garmin' : null).filter(Boolean));
    return ['Where this comes from', `<p class="small" style="margin:0">${srcs.size ? [...srcs].join(' and ') : 'No data yet'}. Apple Health gets it from Garmin Connect (or another app that writes to Health); the <b>Health Sync</b> shortcut on your iPhone copies it to your Drive Inbox each time it runs.</p>${have.length ? `<p class="small muted" style="margin:10px 0 0">Range in this period: ${fmtN(Math.min(...have), HEALTH_METRICS[key].dp)} – ${fmtN(Math.max(...have), HEALTH_METRICS[key].dp)} ${esc(unit)}</p>` : ''}`];
  }
  return ['Breakdown', none];
}
