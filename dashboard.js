'use strict';
// Health Sync · the Dashboard: tiles, Today, readiness, Body & recovery, Patterns, trends.
// One of the app's screen files: classic scripts that share one global scope, loaded in order by index.html.
/* ================= rendering ================= */
const MOODS = ['😞', '🙁', '😐', '🙂', '😄'];
let dashDate = todayKey(), logDate = todayKey();
const charts = {};

function render() {
  if (metricKey) renderMetric();
  renderHealth();
  renderCoach(); renderCoachSettings();
  renderDash(); renderTraining(); renderLog(); renderHist(); renderImports(); renderErrors(); renderSettings(); if (!planEditing) renderPlan();
}

const ICONS = {
  steps: '<path fill="currentColor" stroke="none" d="M8.5 2.5c1.9 0 3.2 2.3 3.2 5s-1.3 4.6-3.2 4.6S5.3 10.2 5.3 7.5 6.6 2.5 8.5 2.5zM6.6 13.4h3.8v2.4a1.9 1.9 0 01-3.8 0zM15.5 6.5c1.9 0 3.2 2.3 3.2 5s-1.3 4.6-3.2 4.6-3.2-1.9-3.2-4.6 1.3-5 3.2-5zM13.6 17.4h3.8v2.2a1.9 1.9 0 01-3.8 0z"/>',
  cal: '<path d="M7 3v7a2 2 0 002 2v9M5 3v5M9 3v5M17 21V3c-2 1.5-3 4-3 7v4h3"/>',
  ex: '<path d="M12 3c.5 3 4.5 5.5 4.5 10a4.5 4.5 0 01-9 0c0-2.2 1-3.7 2.2-4.8.2 1.5.9 2.6 2 3.1C11 8.7 11.3 5.6 12 3z"/>',
  weight: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8.5 10a5 5 0 017 0M12 10l1.4-2"/>',
  mood: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5a4.2 4.2 0 007 0M9 9.5h.01M15 9.5h.01"/>',
  sleep: '<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z"/>',
};
function tile(kind, k, v, unit, sub) {
  const hidden = hiddenTiles().includes(kind);
  const hiddenAttr = hidden ? ' data-hidden' : '';
  const hideTitle = hidden ? 'Show tile' : 'Hide tile';
  const hideIcon = hidden ? '👁' : '🙈';
  return `<div class="tile" style="--c:var(--c-${kind})" data-metric="${kind}" role="button" tabindex="0"${hiddenAttr}><button class="hide-btn" data-hide-tile="${kind}" title="${hideTitle}" aria-label="${hideTitle}">${hideIcon}</button><div class="top"><span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[kind]}</svg></span><span class="k">${esc(k)}</span></div><div class="v">${v}${unit ? `<span class="u">${esc(unit)}</span>` : ''}</div><div class="s">${sub || '&nbsp;'}</div></div>`;
}


function dayTiles() {
  const d = getDay(dashDate), t = totals(d);
  const f = d?.feel;
  $('#d-span-lbl').textContent = fmtDay(dashDate, { weekday: 'long', month: 'long', day: 'numeric' });
  return [
    tile('steps', 'Steps', fmtN(d?.steps), '', d?.steps != null ? (d.stepsSource === 'manual' ? 'entered by hand' : 'from ' + srcLabel(d.stepsSource, d.stepsVia)) : 'none yet'),
    tile('cal', 'Calories eaten', t.hasFood ? fmtN(t.calIn) : '—', '', t.hasFood ? `${foodPartial(d, dashDate) ? '<b>so far</b> · ' : ''}P ${fmtN(t.protein)}g · C ${fmtN(t.carbs)}g · F ${fmtN(t.fat)}g` : 'no food logged'),
    tile('ex', 'Exercise', t.hasEx ? fmtN(t.exMin) : '—', t.hasEx ? 'min' : '', t.hasEx ? `${fmtN(t.burn)} cal burned` : 'no workouts'),
    // The latest weigh-in leads, with how old it is (amber from 3 days, red from a week); the trend is underneath.
    (() => { const S = weightSeries(), t = trendOn(S, dashDate), A = weighInAge(dashDate);
      if (t == null || !A) return tile('weight', 'Weight', '—', '', '');
      const age = A.level === 'fresh' ? esc(A.ago) : `<b class="age-${A.level}">${esc(A.ago)}${A.level === 'stale' ? ' · weigh in' : ''}</b>`;
      return tile('weight', 'Weight · latest', fmtN(A.w, 1), S.unit, `${age} · trend ${fmtN(t, 1)}`); })(),
    tile('mood', 'Mood', f?.mood ? MOODS[f.mood - 1] : '—', '', f?.mood ? [f.energy && `energy ${f.energy}/5`, f.stress && `stress ${f.stress}/5`].filter(Boolean).join(' · ') : 'not logged'),
    tile('sleep', 'Sleep', sleepHours(d) != null ? fmtN(sleepHours(d), 1) : '—', sleepHours(d) != null ? 'h' : '', d?.sleep?.score ? `score ${d.sleep.score}` : ''),
  ];
}

// Averages end the day before the selected date (today's data is usually still incomplete),
// and skip days with no data for that measure so days that haven't synced yet don't drag them down.
function avgTiles(n) {
  const end = addDays(dashDate, -1);
  const ks = windowKeys(end, n), D = ks.map(getDay).filter(Boolean);
  const T = D.map(totals);
  const steps = D.filter(d => d.steps != null).map(d => d.steps);
  const food = T.filter(t => t.hasFood);
  const exDays = D.length, exMin = T.reduce((s, t) => s + t.exMin, 0), burn = T.reduce((s, t) => s + t.burn, 0), nW = D.reduce((s, d) => s + d.workouts.length, 0);
  const wD = D.filter(d => d.weight != null);
  const unit = wD.length ? wD[wD.length - 1].weightUnit || 'lb' : 'lb';
  const inUnit = d => (d.weightUnit || 'lb') === unit ? d.weight : unit === 'lb' ? d.weight * 2.20462 : d.weight / 2.20462;
  const wts = wD.map(inUnit);
  const feel = D.map(d => d.feel).filter(Boolean);
  const moods = feel.map(f => f.mood).filter(Boolean), energy = feel.map(f => f.energy).filter(Boolean), stress = feel.map(f => f.stress).filter(Boolean);
  const sleep = D.map(sleepHours).filter(h => h != null);
  const days = c => c ? `avg of ${plural(c, 'day')}` : 'no data in this period';
  const am = avg(moods);
  $('#d-span-lbl').textContent = `${n}-day average · ${fmtDay(ks[0], { month: 'short', day: 'numeric' })} – ${fmtDay(end, { month: 'short', day: 'numeric' })} · ${plural(D.length, 'day')} with data`;
  return [
    tile('steps', 'Steps', fmtN(avg(steps)), steps.length ? '/day' : '', days(steps.length)),
    tile('cal', 'Calories eaten', food.length ? fmtN(avg(food.map(t => t.calIn))) : '—', food.length ? '/day' : '', food.length ? `P ${fmtN(avg(food.map(t => t.protein)))}g · C ${fmtN(avg(food.map(t => t.carbs)))}g · F ${fmtN(avg(food.map(t => t.fat)))}g · ${plural(food.length, 'day')}` : days(0)),
    tile('ex', 'Exercise', exDays ? fmtN(exMin / exDays) : '—', exDays ? 'min/day' : '', exDays ? `${plural(nW, 'workout')} · ${fmtN(burn)} cal total` : days(0)),
    (() => { const S = weightSeries(), t = trendOn(S, end), t0 = trendOn(S, addDays(end, -(n - 1)));
      const A = weighInAge(dashDate), lat = A ? ` · latest ${fmtN(A.w, 1)}, ${A.level === 'fresh' ? esc(A.ago) : `<b class="age-${A.level}">${esc(A.ago)}</b>`}` : '';
      return t == null ? tile('weight', 'Weight', '—', '', days(0)) : tile('weight', 'Weight · trend', fmtN(t, 1), S.unit, (t0 != null ? `${t - t0 > 0 ? '+' : t - t0 < 0 ? '−' : ''}${fmtN(Math.abs(t - t0), 1)} over ${n} days` : plural(wts.length, 'weigh-in')) + lat); })(),
    tile('mood', 'Mood', am ? `${MOODS[Math.round(am) - 1]} ${fmtN(am, 1)}` : '—', '', moods.length ? [energy.length && `energy ${fmtN(avg(energy), 1)}`, stress.length && `stress ${fmtN(avg(stress), 1)}`, plural(moods.length, 'day')].filter(Boolean).join(' · ') : 'not logged'),
    tile('sleep', 'Sleep', sleep.length ? fmtN(avg(sleep), 1) : '—', sleep.length ? 'h/night' : '', days(sleep.length)),
  ];
}

function renderHello() {
  const h = new Date().getHours();
  $('#hello').textContent = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const last = data.updated ? new Date(data.updated) : null;
  $('#hello-sub').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) + (last ? ` · last saved ${last.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : '');
}
function renderDash() {
  renderHello();
  $('#d-date').value = dashDate;
  $$('#d-span button').forEach(b => b.classList.toggle('on', +b.dataset.n === settings.span));
  const d = getDay(dashDate);
  $('#d-tiles').innerHTML = (settings.span > 1 ? avgTiles(settings.span) : dayTiles()).join('');

  $$('.day-lbl').forEach(el => el.textContent = fmtDay(dashDate, { weekday: 'short', month: 'short', day: 'numeric' }));
  const dist = settings.units === 'metric' ? 'km' : 'mi';
  const ws = (d?.workouts || []).slice().sort((a, b) => (a.start || '').localeCompare(b.start || ''));
  $('#d-workouts').innerHTML = ws.length ? ws.map(x => `<div class="li"><span class="n">${esc(x.title || x.type)}<span class="tag">${esc(srcName(x.source))}</span></span><span class="x">${[x.durationMin != null && fmtN(x.durationMin) + ' min', x.distance && fmtN(x.distance, 2) + ' ' + dist, x.calories && fmtN(x.calories) + ' cal', x.avgHR && '♥ ' + fmtN(x.avgHR)].filter(Boolean).join(' · ')}</span></div>`).join('') : '<p class="muted small" style="margin:0">No workouts on this day.</p>';

  const fd = d?.food || [];
  if (fd.length) {
    const meals = {};
    fd.forEach(x => (meals[x.meal || 'Other'] ||= []).push(x));
    const order = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    const names = Object.keys(meals).sort((a, b) => (order.indexOf(a) + 1 || 9) - (order.indexOf(b) + 1 || 9));
    const partialNote = foodPartial(d, dashDate) ? `<p class="partial-note">So far${dashDate >= todayKey() ? ' today' : ''} · Lose It's full report for this day arrives ${dashDate >= todayKey() ? 'tomorrow morning' : 'soon'}.</p>` : '';
    $('#d-food').innerHTML = partialNote + names.map(m => `<div class="li"><span class="n"><b>${esc(m)}</b></span><span class="x"><b>${fmtN(meals[m].reduce((s, x) => s + (x.calories || 0), 0))} cal</b></span></div>` +
      meals[m].map(x => `<div class="li"><span class="n">${esc(x.name)}${x.qty ? ` <span class="muted small">${fmtN(x.qty, 2)} ${esc(x.units)}</span>` : ''}<span class="tag">${esc(srcName(x.source))}</span></span><span class="x">${fmtN(x.calories)}</span></div>`).join('')).join('');
    const t = totals(d);
    if (t.hasNutr) $('#d-food').innerHTML += `<div class="sub-h" style="margin-top:16px">Nutrients · ${fmtN(t.calIn)} cal</div><div class="nutr">${NUTRIENTS.map(n => `<div><span>${n.name}</span><b>${fmtN(t[n.key])} ${n.u}</b></div>`).join('')}</div>`;
    $('#d-food').innerHTML += microsHtml(d, dashDate);
  } else {
    const t = totals(d);
    $('#d-food').innerHTML = t.fromHealth
      ? `<p class="muted small" style="margin:0 0 4px">No Lose It report for this day yet — these are the day's totals${foodPartial(d, dashDate) ? ' so far' : ''} from Apple Health.</p><div class="sub-h" style="margin-top:12px">Nutrients · ${fmtN(t.calIn)} cal</div><div class="nutr">${NUTRIENTS.map(n => `<div><span>${n.name}</span><b>${fmtN(t[n.key])} ${n.u}</b></div>`).join('')}</div>`
      : '<p class="muted small" style="margin:0">No food on this day.</p>';
    if (t.fromHealth) $('#d-food').innerHTML += microsHtml(d, dashDate);
  }

  const f = d?.feel;
  $('#d-feel').innerHTML = hasFeel(f) ? `
    <div class="feel-big">${f.mood ? MOODS[f.mood - 1] : ''}</div>
    <div class="small muted">${[f.energy && `Energy ${f.energy}/5`, f.stress && `Stress ${f.stress}/5`].filter(Boolean).join(' · ')}</div>
    ${f.tags?.length ? `<div style="margin-top:6px">${f.tags.map(t => `<span class="tag" style="margin:0 4px 4px 0">${esc(t)}</span>`).join('')}</div>` : ''}
    ${f.notes ? `<p style="margin:8px 0 0;white-space:pre-wrap">${esc(f.notes)}</p>` : ''}` : '<p class="muted small" style="margin:0">Nothing logged yet.</p>';

  renderCharts();
  renderCloud();
  renderAnchorSummary();
  renderHealthCard(); renderToday(); renderReadinessCard(); renderPatterns();
}
function renderHealthCard() {
  const n = settings.span, end = n > 1 ? addDays(dashDate, -1) : dashDate, ks = windowKeys(end, n);
  const recent = windowKeys(dashDate, 60);
  const items = Object.entries(HEALTH_METRICS).filter(([key]) => recent.some(k => healthValue(getDay(k), key) != null)).map(([key, M]) => {
    const vals = ks.map(k => healthValue(getDay(k), key)).filter(v => v != null);
    const v = avg(vals);
    return `<div class="hk-i" data-metric="${key}" role="button" tabindex="0" style="--c:var(${M.c})"><div class="k"><i></i>${esc(M.name)}</div><div class="v">${v == null ? '—' : fmtN(v, M.dp)}${v != null && M.unit ? `<small>${esc(M.unit)}${M.sum && n > 1 ? '/day' : ''}</small>` : ''}</div></div>`;
  });
  $('#hk-card').hidden = !items.length;
  $('#hk').innerHTML = items.join('');
  $('#hk-sub').textContent = n > 1 ? `${n}-day average · from Apple Health and Garmin` : `${fmtDay(dashDate, { month: 'short', day: 'numeric' })} · from Apple Health and Garmin`;
}
const srcName = s => ({ garmin: 'Garmin', strava: 'Strava', loseit: 'Lose It', health: 'Apple Health', withings: 'Withings', manual: 'Manual' }[s] || s || '');
const srcLabel = (s, via) => s === 'health' && via ? `Apple Health (${via})` : srcName(s);


// Words from notes only count if they describe a feeling (emotional or physical). Tags always count.
const FEELINGS = new Set(`
happy happier happiest joy joyful glad cheerful content contented satisfied pleased delighted elated ecstatic euphoric thrilled excited
grateful thankful blessed lucky hopeful optimistic positive proud confident accomplished productive successful inspired motivated
determined focused driven ambitious eager enthusiastic energized energetic refreshed rested recharged alive strong powerful capable
calm relaxed peaceful serene centered grounded balanced mellow chill comfortable cozy safe secure settled steady stable
loved loving affectionate connected supported appreciated valued understood included social playful silly amused curious interested
fulfilled free relieved light lighthearted carefree brave courageous resilient patient kind compassionate generous
good great fine okay ok alright better best amazing awesome wonderful fantastic
sad sadder unhappy down blue low depressed gloomy miserable heartbroken hurt grieving lonely isolated alone empty numb hopeless
helpless worthless disappointed discouraged defeated regretful guilty ashamed embarrassed insecure inadequate rejected
anxious anxiety nervous worried worry uneasy tense stressed stress stressful overwhelmed panicked panicky scared afraid fearful
frightened restless jittery on-edge pressured rushed busy hectic frazzled
angry mad furious irritated irritable annoyed frustrated grumpy cranky agitated resentful bitter impatient moody snappy
bored unmotivated lazy sluggish lethargic drained exhausted tired sleepy fatigued weary wiped burnt burned-out burnout
foggy unfocused distracted scattered confused lost stuck unsure doubtful indifferent apathetic meh blah
sick ill unwell nauseous queasy sore achy aching stiff tight pain painful hurting headache migraine crampy bloated
hungry starving full stuffed thirsty dehydrated hangry weak dizzy shaky feverish congested
fit healthy strong-willed disciplined consistent recovered recovering
`.trim().split(/\s+/));
const NEGATORS = new Set(['not', 'never', 'no', "isn't", "wasn't", "didn't", "don't", "doesn't", "wasnt", "didnt", "dont", 'hardly', 'barely', 'less']);

function moodColor(m) {
  if (m == null) return 'var(--muted)';
  const t = Math.max(-1, Math.min(1, (m - 3) / 2));
  return `color-mix(in oklab, var(${t >= 0 ? '--mood-hi' : '--mood-lo'}) ${Math.round(Math.abs(t) * 100)}%, var(--mood-mid))`;
}

function renderCloud() {
  const n = +$('#d-range').value, ks = windowKeys(dashDate, n);
  $('#cloud-notes').checked = settings.cloudNotes;
  $('#cloud-range').textContent = $('#d-range').selectedOptions[0].textContent;
  const words = {};
  for (const k of ks) {
    const f = getDay(k)?.feel;
    if (!f) continue;
    const seen = new Set((f.tags || []).map(t => t.toLowerCase().trim()).filter(Boolean));
    if (settings.cloudNotes && f.notes) {
      const toks = (f.notes.toLowerCase().replace(/’/g, "'").match(/[a-z][a-z'-]*/g) || []).map(w => w.replace(/^-+|-+$/g, ''));
      toks.forEach((w, idx) => {
        // Skip "not tired", "wasn't happy", "never felt anxious".
        if (FEELINGS.has(w) && !NEGATORS.has(toks[idx - 1]) && !(NEGATORS.has(toks[idx - 2]) && /^(feel|felt|feeling|very|too|so|that|really)$/.test(toks[idx - 1]))) seen.add(w);
      });
    }
    for (const w of seen) { const e = words[w] ||= { n: 0, moods: [] }; e.n++; if (f.mood) e.moods.push(f.mood); }
  }
  const list = Object.entries(words).sort((a, b) => b[1].n - a[1].n || a[0].localeCompare(b[0])).slice(0, 45);
  $('#cloud-key').hidden = !list.length;
  if (!list.length) { $('#cloud').innerHTML = '<p class="muted small" style="margin:0">Add tags (or notes) in <b>Log today</b> and your most common mood words will show up here.</p>'; return; }
  const max = list[0][1].n, min = list[list.length - 1][1].n;
  // Most frequent words in the middle, tapering out to both sides.
  const arranged = [];
  list.forEach((x, i) => i % 2 ? arranged.push(x) : arranged.unshift(x));
  $('#cloud').innerHTML = arranged.map(([w, e]) => {
    const r = max === min ? 0.5 : (e.n - min) / (max - min);
    const am = avg(e.moods);
    const tip = `${w}: ${plural(e.n, 'day')}${am ? ` · average mood ${fmtN(am, 1)} ${MOODS[Math.round(am) - 1]}` : ''}`;
    return `<span class="w" title="${esc(tip)}" style="font-size:${Math.round(14 + r * 26)}px;font-weight:${r > 0.55 ? 650 : 500};color:${moodColor(am)}">${esc(w)}</span>`;
  }).join('');
}

function renderCharts() {
  if (!window.Chart) return;
  drawAnchorChart();
  const n = +$('#d-range').value;
  const keys = []; for (let i = n - 1; i >= 0; i--) keys.push(addDays(dashDate, -i));
  const long = n > 60;
  const labels = keys.map(k => fmtDay(k, long ? { month: 'short', day: 'numeric' } : { month: 'short', day: 'numeric' }));
  const D = keys.map(k => getDay(k));
  const units = new Set(D.filter(d => d?.weight != null).map(d => d.weightUnit || 'lb'));
  const wUnit = units.size === 1 ? [...units][0] : 'lb';
  const toUnit = d => d.weightUnit === wUnit || !d.weightUnit ? d.weight : (wUnit === 'lb' ? d.weight * 2.20462 : d.weight / 2.20462);
  draw('c-steps', 'bar', labels, D.map(d => d?.steps ?? null), v => fmtN(v) + ' steps');
  draw('c-weight', 'line', labels, D.map(d => d?.weight != null ? +toUnit(d).toFixed(1) : null), v => fmtN(v, 1) + ' ' + wUnit, { beginAtZero: false });
  draw('c-cal', 'bar', labels, D.map(d => { const t = totals(d); return t.hasFood ? Math.round(t.calIn) : null; }), v => fmtN(v) + ' cal');
  draw('c-ex', 'bar', labels, D.map(d => { const t = totals(d); return t.hasEx ? Math.round(t.exMin) : null; }), v => fmtN(v) + ' min');
  draw('c-mood', 'line', labels, D.map(d => d?.feel?.mood ?? null), v => MOODS[v - 1] + ' ' + v + '/5', { min: 1, max: 5, ticks: { stepSize: 1 } });
  draw('c-sleep', 'bar', labels, D.map(d => sleepHours(d)), v => fmtN(v, 1) + ' h');
}

const CHART_VAR = { 'c-anchor': '--c-anchor', 'c-steps': '--c-steps', 'c-weight': '--c-weight', 'c-cal': '--c-cal', 'c-ex': '--c-ex', 'c-mood': '--c-mood', 'c-sleep': '--c-sleep' };
function draw(id, type, labels, values, fmt, yOpts = {}) {
  const cs = getComputedStyle(document.documentElement);
  const color = cs.getPropertyValue(CHART_VAR[id] || '--series').trim(), grid = cs.getPropertyValue('--grid').trim(), muted = cs.getPropertyValue('--muted').trim(), surface = cs.getPropertyValue('--surface').trim();
  const empty = values.every(v => v == null);
  const box = document.getElementById(id).parentElement;
  box.querySelector('.empty')?.remove();
  if (empty) box.insertAdjacentHTML('beforeend', '<div class="empty muted small" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">No data in this range</div>');
  charts[id]?.destroy();
  const { ticks: yTicks, ...yRest } = yOpts;
  charts[id] = new Chart(document.getElementById(id), {
    type,
    data: { labels, datasets: [{
      data: values, backgroundColor: color, borderColor: color, borderWidth: type === 'line' ? 2 : 0, borderRadius: 4, borderSkipped: 'start',
      pointRadius: values.length > 45 ? 0 : 3, pointHoverRadius: 5, pointBackgroundColor: color, pointBorderColor: surface, pointBorderWidth: 2,
      spanGaps: true, tension: 0.3, cubicInterpolationMode: 'monotone', maxBarThickness: 22, categoryPercentage: 0.85, barPercentage: 0.9,
    }] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: { displayColors: false, callbacks: { label: c => c.parsed.y == null ? 'no data' : fmt(c.parsed.y) } } },
      scales: {
        x: { grid: { display: false }, border: { color: grid }, ticks: { color: muted, maxTicksLimit: 6, maxRotation: 0, autoSkip: true } },
        y: { beginAtZero: true, grid: { color: grid }, border: { display: false }, ticks: { color: muted, maxTicksLimit: 5, ...(yTicks || {}) }, ...yRest },
      },
    },
  });
}
