'use strict';
// Health Sync · Log today, daily anchors, Plan, fixing mistakes, History, Import and Settings.
// One of the app's screen files: classic scripts that share one global scope, loaded in order by index.html.
/* ---- Log tab ---- */
let feelDraft = {}, pvDraft = {};
const pvVal = b => b.dataset.v === '1' ? true : b.dataset.v === '0' ? false : b.dataset.v;
function scaleUI(el, field, labels) {
  el.innerHTML = labels.map((l, i) => `<button type="button" data-v="${i + 1}" aria-label="${field} ${i + 1}">${l}</button>`).join('');
  el.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const v = +b.dataset.v; feelDraft[field] = feelDraft[field] === v ? null : v;
    paintScales(); markLogDirty();
  };
}
function paintScales() {
  for (const f of ['mood', 'energy', 'stress']) $$(`#f-${f} button`).forEach(b => b.classList.toggle('on', +b.dataset.v === feelDraft[f]));
  $$('#f-pv [data-pv]').forEach(g => g.querySelectorAll('button').forEach(b => b.classList.toggle('on', pvDraft[g.dataset.pv] != null && pvDraft[g.dataset.pv] === pvVal(b))));
}
let logDirty = false;
function markLogDirty() { logDirty = true; $('#l-msg').textContent = 'Unsaved changes'; }

function renderLog() {
  $('#l-date').value = logDate;
  $('#mv-date').value = addDays(logDate, -1);
  const d = getDay(logDate);
  const f = d?.feel || {};
  feelDraft = { mood: f.mood || null, energy: f.energy || null, stress: f.stress || null };
  pvDraft = { i: d?.pv?.i ?? null, c: d?.pv?.c ?? null };
  anchorDraft = anchorCfg().names.map((_, i) => typeof d?.anchors?.[i] === 'boolean' ? d.anchors[i] : null);
  renderAnchorBoxes();
  paintScales();
  $('#f-tags').value = (f.tags || []).join(', ');
  renderTagSugg();
  $('#f-notes').value = f.notes || '';
  $('#f-sleep').value = d?.sleep?.hours ?? '';
  $('#f-weight').value = d?.weight ?? '';
  $('#f-wunit').value = d?.weightUnit || latestWeight(logDate)?.unit || 'lb';
  $('#f-steps').value = d?.steps ?? '';
  $('#f-drinks').value = d?.drinks ?? '';
  $('#f-waist').value = d?.waist?.v ?? '';
  $('#f-waistu').value = d?.waist?.unit || waistStatus(logDate).w?.unit || 'in';
  $('#f-pushups').value = d?.pushups ?? '';
  { const w = waistStatus(logDate), sc = strengthCheck(logDate), due = [!d?.waist && w.due && 'waist', d?.pushups == null && sc.due && 'push-ups'].filter(Boolean);
    $('#f-meas-due').textContent = due.length ? `due: ${due.join(', ')}` : ''; }
  { const auto = d?.health?.drinks ?? (d?.food?.length ? loseItDrinks(d) : null); $('#f-drinks-auto').textContent = d?.drinks == null && auto != null ? `${fmtN(auto)} from ${d?.health?.drinks != null ? 'Apple Health' : 'your Lose It log'}. Type a number to override.` : 'Leave blank to use Lose It or Apple Health.'; }
  renderLogLists();
  logDirty = false; $('#l-msg').textContent = '';
}
function renderTagSugg() {
  const cur = new Set($('#f-tags').value.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
  const freq = {};
  for (const d of Object.values(data.days)) for (const t of d.feel?.tags || []) { const k = t.toLowerCase(); freq[k] = (freq[k] || 0) + 1; }
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).map(x => x[0]).filter(t => !cur.has(t)).slice(0, 14);
  $('#f-tagsugg').innerHTML = top.map(t => `<button type="button" data-tag="${esc(t)}">+ ${esc(t)}</button>`).join('');
}
function renderLogLists() {
  const d = getDay(logDate);
  const ws = d?.workouts || [], fd = d?.food || [];
  $('#l-workouts').innerHTML = ws.length ? ws.map((x, i) => `<div class="li"><span class="n">${esc(x.title || x.type)}<span class="tag">${esc(srcName(x.source))}</span></span><span class="x">${[x.durationMin != null && fmtN(x.durationMin) + ' min', x.calories && fmtN(x.calories) + ' cal'].filter(Boolean).join(' · ')}</span><button class="del" data-del="workouts" data-i="${i}" aria-label="Delete">×</button></div>`).join('') : '<p class="muted small" style="margin:0">None yet.</p>';
  const bd = d?.body || [];
  $('#l-body').innerHTML = bd.length ? bd.map((x, i) => `<div class="li"><span class="n">${esc(x.area)}<span class="tag">${esc(BODY_KIND[x.kind] || x.kind)}</span>${x.note ? ` <span class="muted small">${esc(x.note)}</span>` : ''}</span><span class="x">${x.level}/10</span><button class="del" data-del="body" data-i="${i}" aria-label="Delete">×</button></div>`).join('') : '<p class="muted small" style="margin:0">Nothing logged. Add anything sore, stiff or painful, so readiness and the Coach can take it into account.</p>';
  $('#l-food').innerHTML = fd.length ? fd.map((x, i) => `<div class="li"><span class="n">${esc(x.name)}${x.meal ? `<span class="tag">${esc(x.meal)}</span>` : ''}<span class="tag">${esc(srcName(x.source))}</span></span><span class="x">${fmtN(x.calories)} cal</span><button class="del" data-del="food" data-i="${i}" aria-label="Delete">×</button></div>`).join('') : '<p class="muted small" style="margin:0">None yet.</p>';
}

async function saveLogDay() {
  const k = logDate, d = day(k);
  const tags = $('#f-tags').value.split(',').map(s => s.trim()).filter(Boolean);
  const notes = $('#f-notes').value.trim();
  const feel = { mood: feelDraft.mood || null, energy: feelDraft.energy || null, stress: feelDraft.stress || null, tags, notes };
  if (hasFeel(feel)) d.feel = feel; else delete d.feel;
  if (hasPv(pvDraft)) d.pv = { i: pvDraft.i, c: pvDraft.c }; else delete d.pv;
  if (anchorDraft.some(v => v != null)) d.anchors = anchorDraft.slice(); else delete d.anchors;
  const sl = num($('#f-sleep').value);
  if (sl != null) d.sleep = { ...(d.sleep || {}), hours: sl, source: d.sleep?.hours === sl ? d.sleep.source : 'manual' };
  else if (d.sleep) { delete d.sleep.hours; if (!d.sleep.score) delete d.sleep; }
  const wt = num($('#f-weight').value), wu = $('#f-wunit').value;
  if (wt != null && wt > 0) { if (d.weight !== wt || d.weightUnit !== wu) { d.weight = wt; d.weightUnit = wu; d.weightSource = 'manual'; } }
  else { delete d.weight; delete d.weightUnit; delete d.weightSource; }
  const dr = num($('#f-drinks').value);
  if (dr != null && dr >= 0) d.drinks = Math.round(dr); else delete d.drinks;
  const wa = num($('#f-waist').value);
  if (wa != null && wa > 0) d.waist = { v: wa, unit: $('#f-waistu').value }; else delete d.waist;
  const pu = num($('#f-pushups').value);
  if (pu != null && pu >= 0) d.pushups = Math.round(pu); else delete d.pushups;
  const st = num($('#f-steps').value);
  if (st != null) { if (d.steps !== Math.round(st)) { d.steps = Math.round(st); d.stepsSource = 'manual'; } }
  else { delete d.steps; delete d.stepsSource; }
  touch(k);
  await runTask(persist);
  logDirty = false; $('#l-msg').textContent = 'Saved';
  renderDash(); renderHist();
}




/* ---- Daily anchors (habit boxes) ---- */
let anchorDraft = [];

function renderAnchorBoxes() {
  const c = anchorCfg(), d = getDay(logDate);
  $('#an-boxes').innerHTML = c.names.map((n, i) => {
    const st = anchorState(d, i, anchorDraft[i], c, logDate);
    const src = st.manual
      ? `<div class="an-src">Set by hand${st.auto ? ` · <a href="#" data-reset="${i}">use imported data</a>` : ''}</div>`
      : st.auto ? `<div class="an-src">Auto · ${esc(st.auto.why)}</div>` : '';
    return `<button type="button" class="anchor${st.on ? ' on' : ''}${st.half ? ' half' : ''}${st.pending ? ' pend' : ''}" data-i="${i}" aria-pressed="${st.on ? 'true' : st.half ? 'mixed' : 'false'}">
    <span class="ck">${st.on ? '✓' : st.half ? '½' : st.pending ? '…' : ''}</span><span><div class="an-n">${esc(n)}</div>${c.hints[i] ? `<div class="an-h">${esc(c.hints[i])}</div>` : ''}${src}</span></button>`;
  }).join('');
  const ws = weekStart(logDate);
  let got = 0; for (let i = 0; i < 7; i++) { const k = addDays(ws, i); got += k === logDate ? anchorCount(d, anchorDraft) : anchorCount(getDay(k)); }
  $('#an-log-week').textContent = `This week: ${boxN(got)} of ${c.names.length * 7} · goal ${c.target}`;
}

function weekTotal(ws) { let n = 0; for (let i = 0; i < 7; i++) n += anchorCount(getDay(addDays(ws, i))); return n; }

function renderAnchorSummary() {
  const c = anchorCfg(), per = c.names.length, max = per * 7, goal = Math.min(c.target, max);
  const ws = weekStart(dashDate), got = weekTotal(ws), today = todayKey();
  const end = addDays(ws, 6);
  const daysLeft = today < ws ? 7 : today > end ? 0 : Math.round((keyToDate(end) - keyToDate(today)) / 864e5) + 1;
  const need = Math.max(0, goal - got);
  const msg = got >= goal ? `🎉 Goal reached — ${Math.round(got / max * 100)}% this week.`
    : daysLeft === 0 ? `Finished at ${boxN(got)} of ${max} (${Math.round(got / max * 100)}%). New week, fresh boxes.`
    : need > daysLeft * per ? `${boxN(need)} more to reach ${goal}. Every box still counts — just pick up the next one.`
    : `${boxN(need)} more to reach ${goal} · ${plural(daysLeft, 'day')} left${daysLeft < 7 ? ' (including today)' : ''}.`;
  const fill = (j, n) => j < Math.floor(n) ? 'f' : j < n ? 'h' : '';
  const cells = Array.from({ length: max }, (_, i) => `<i class="${fill(i, got)}${i === goal - 1 ? ' goal' : ''}${i >= goal ? ' buf' : ''}"></i>`).join('');
  const dl = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const week = Array.from({ length: 7 }, (_, i) => {
    const k = addDays(ws, i), n = anchorCount(getDay(k));
    return `<div title="${esc(fmtDay(k))}: ${boxN(n)} of ${per}"><div class="dl${k === today ? ' today' : ''}">${dl[i]}</div><div class="dots">${Array.from({ length: per }, (_, j) => `<i class="${fill(j, n)}"></i>`).join('')}</div></div>`;
  }).join('');
  $('#an-sum').innerHTML = `<div>
      <div class="small" style="font-weight:600;color:var(--text-2)">Daily anchors · week of ${esc(fmtDay(ws, { month: 'short', day: 'numeric' }))}</div>
      <div class="an-big">${boxN(got)}<span class="u">of ${max} boxes · goal ${goal} (${Math.round(goal / max * 100)}%)</span></div>
      <div class="an-msg">${msg}</div>
      <div class="an-bar" aria-hidden="true">${cells}</div>
      ${max > goal ? `<div class="muted small" style="margin-top:6px">The ${max - goal} dashed boxes are your weekly buffer for real life.</div>` : ''}
    </div>
    <div class="an-week" aria-label="Boxes checked each day this week">${week}</div>`;
}

const hexA = (hex, a) => { const m = hex.replace('#', '').match(/.{2}/g); return m ? `rgba(${m.map(x => parseInt(x, 16)).join(',')},${a})` : hex; };
function drawAnchorChart() {
  if (!window.Chart) return;
  const c = anchorCfg(), max = c.names.length * 7, goal = Math.min(c.target, max);
  const n = Math.max(4, Math.ceil(+$('#d-range').value / 7));
  const cur = weekStart(dashDate), today = todayKey();
  const weeks = []; for (let i = n - 1; i >= 0; i--) weeks.push(addDays(cur, -7 * i));
  const vals = weeks.map(ws => { const t = weekTotal(ws); return t || (ws <= today ? 0 : null); });
  const partial = weeks.map(ws => addDays(ws, 6) >= today);
  $('#an-chart-t').textContent = `Daily anchors per week (goal ${goal} of ${max})`;
  const cs = getComputedStyle(document.documentElement);
  const color = cs.getPropertyValue('--c-anchor').trim(), grid = cs.getPropertyValue('--grid').trim(), muted = cs.getPropertyValue('--muted').trim(), text = cs.getPropertyValue('--text-2').trim();
  charts['c-anchor']?.destroy();
  charts['c-anchor'] = new Chart($('#c-anchor'), {
    data: {
      labels: weeks.map(ws => fmtDay(ws, { month: 'short', day: 'numeric' })),
      datasets: [
        { type: 'bar', label: 'Boxes', data: vals, backgroundColor: partial.map(p => p ? hexA(color, 0.45) : color), borderRadius: 4, borderSkipped: 'start', maxBarThickness: 34, categoryPercentage: 0.8, barPercentage: 0.9 },
        { type: 'line', label: 'Goal', data: weeks.map(() => goal), borderColor: text, borderDash: [5, 4], borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 0 },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: { displayColors: false, filter: i => i.datasetIndex === 0, callbacks: {
        title: items => 'Week of ' + items[0].label,
        label: i => i.parsed.y == null ? 'no data' : `${i.parsed.y} of ${max} boxes (${Math.round(i.parsed.y / max * 100)}%)${partial[i.dataIndex] ? ' · so far' : ''}${i.parsed.y >= goal ? ' · goal met' : ''}`,
      } } },
      scales: {
        x: { grid: { display: false }, border: { color: grid }, ticks: { color: muted, maxTicksLimit: 8, maxRotation: 0, autoSkip: true } },
        y: { beginAtZero: true, max, grid: { color: grid }, border: { display: false }, ticks: { color: muted, stepSize: 7 } },
      },
    },
  });
}

function renderAnchorSettings() {
  const c = anchorCfg();
  const sel = (i, t) => `<select data-an-type="${i}" style="margin-top:6px">${[['none', 'Check by hand only'], ['budget', 'Auto: calorie budget'], ['workout', 'Auto: workout minutes'], ['steps', 'Auto: steps'], ['food', 'Auto: matching foods'], ['meal', 'Auto: a meal\'s calories']].map(([v, l]) => `<option value="${v}"${v === t ? ' selected' : ''}>${l}</option>`).join('')}</select>`;
  $('#s-anchors').innerHTML = c.names.map((n, i) => {
    const r = c.rules[i];
    return `<div><label>Box ${i + 1}</label><input type="text" data-an-name="${i}" value="${esc(n)}" placeholder="Name"><input type="text" data-an-hint="${i}" value="${esc(c.hints[i] || '')}" placeholder="Short reminder (optional)" style="margin-top:6px">${sel(i, r.type)}
      <div class="small muted rule-f" data-rule="${i}" style="margin-top:6px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <span data-show="budget"><select data-an-bmeals="${i}" style="width:auto">${[['daytime', 'Daytime (all but dinner)'], ['all', 'Whole day']].map(([v, l]) => `<option value="${v}"${(r.type === 'budget' ? r.meals : 'daytime') === v ? ' selected' : ''}>${l}</option>`).join('')}</select> at most <input type="number" data-an-bmax="${i}" value="${r.type === 'budget' ? r.max : 1200}" min="0" style="width:90px"> calories</span>
        <span data-show="steps">At least <input type="number" data-an-smin="${i}" value="${r.type === 'steps' ? r.min : 7500}" min="0" step="500" style="width:90px"> steps that day · half a box at <input type="number" data-an-shalf="${i}" value="${r.type === 'steps' ? r.half ?? '' : 5000}" min="0" step="500" style="width:90px" placeholder="off"></span>
        <span data-show="workout">At least <input type="number" data-an-wmin="${i}" value="${r.type === 'workout' ? r.min : 20}" min="0" style="width:70px"> min of workouts that day</span>
        <span data-show="food">At least <input type="number" data-an-fmin="${i}" value="${r.type === 'food' ? r.min : 3}" min="1" style="width:60px"> foods containing <input type="text" data-an-words="${i}" value="${esc(r.type === 'food' ? r.words : '')}" placeholder="words, separated by commas"></span>
        <span data-show="meal"><input type="text" data-an-meal="${i}" value="${esc(r.type === 'meal' ? r.meal : 'Dinner')}" style="width:110px"> at most <input type="number" data-an-max="${i}" value="${r.type === 'meal' ? r.max : 750}" min="0" style="width:80px"> calories</span>
      </div></div>`;
  }).join('');
  const showRule = i => { const t = $(`[data-an-type="${i}"]`).value; $$(`[data-rule="${i}"] [data-show]`).forEach(el => el.hidden = el.dataset.show !== t); };
  c.names.forEach((_, i) => { showRule(i); $(`[data-an-type="${i}"]`).onchange = () => showRule(i); });
  $('#s-an-goal').value = c.target;
  $('#s-an-day').value = c.dayGoal || '';
  $('#s-an-goal-of').textContent = `out of ${c.names.length * 7} boxes a week`;
}
async function saveAnchorSettings() {
  const names = $$('[data-an-name]').map(el => el.value.trim() || 'Box');
  const hints = $$('[data-an-hint]').map(el => el.value.trim());
  const rules = names.map((_, i) => {
    const t = $(`[data-an-type="${i}"]`).value, v = sel => num($(sel).value);
    if (t === 'budget') return { type: t, meals: $(`[data-an-bmeals="${i}"]`).value, max: v(`[data-an-bmax="${i}"]`) ?? 1200 };
    if (t === 'workout') return { type: t, min: v(`[data-an-wmin="${i}"]`) ?? 20 };
    if (t === 'steps') return { type: t, min: v(`[data-an-smin="${i}"]`) ?? 7500, half: v(`[data-an-shalf="${i}"]`) ?? null };
    if (t === 'food') return { type: t, min: v(`[data-an-fmin="${i}"]`) ?? 1, words: $(`[data-an-words="${i}"]`).value };
    if (t === 'meal') return { type: t, meal: $(`[data-an-meal="${i}"]`).value.trim() || 'Dinner', max: v(`[data-an-max="${i}"]`) ?? 750 };
    return { type: 'none' };
  });
  const target = Math.max(1, Math.min(names.length * 7, Math.round(num($('#s-an-goal').value) || ANCHOR_DEFAULTS.target)));
  const dayGoal = num($('#s-an-day').value);
  data.anchorCfg = { names, hints, rules, target, dayGoal: dayGoal > 0 ? dayGoal : 0, v: 3 };
  planDirty = true;
  await runTask(persist);
  if (!planDirty) { toast('Anchors saved.'); render(); }
}

/* ---- Plan ---- */
const PLAN_TEMPLATE = `# My plan

## Weekly workouts
- **Mon:** 
- **Tue:** 
- **Wed:** 
- **Thu:** 
- **Fri:** 
- **Sat:** 
- **Sun:** rest

## Nutrition
- Calories: 
- Protein: 
- 

## Sleep & recovery
- 

## Habits
- [ ] 
- [ ] 

## Goals
- [ ] 
`;
let planEditing = false;

function md(src) {
  const inline = t => esc(t)
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*/g, '$1<i>$2</i>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  let html = '', list = null, para = [];
  const flushP = () => { if (para.length) { html += `<p>${para.map(inline).join('<br>')}</p>`; para = []; } };
  const closeL = () => { if (list) { html += `</${list === 'ol' ? 'ol' : 'ul'}>`; list = null; } };
  const openL = kind => { if (list !== kind) { closeL(); html += kind === 'ol' ? '<ol>' : kind === 'checks' ? '<ul class="checks">' : '<ul>'; list = kind; } };
  for (const raw of src.replace(/\r/g, '').split('\n')) {
    const l = raw.trimEnd(); let m;
    if (!l.trim()) { flushP(); closeL(); continue; }
    if ((m = l.match(/^(#{1,3})\s+(.*)/))) { flushP(); closeL(); const n = m[1].length + 1; html += `<h${n}>${inline(m[2])}</h${n}>`; continue; }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(l)) { flushP(); closeL(); html += '<hr>'; continue; }
    if ((m = l.match(/^\s*[-*]\s+\[( |x|X)\]\s*(.*)/))) { flushP(); openL('checks'); const done = m[1].trim(); html += `<li class="${done ? 'done' : ''}"><span class="cb">${done ? '✓' : ''}</span>${inline(m[2])}</li>`; continue; }
    if ((m = l.match(/^\s*[-*•]\s+(.*)/))) { flushP(); openL('ul'); html += `<li>${inline(m[1])}</li>`; continue; }
    if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { flushP(); openL('ol'); html += `<li>${inline(m[1])}</li>`; continue; }
    closeL(); para.push(l);
  }
  flushP(); closeL();
  return html;
}

function renderPlan() {
  const p = data.plan;
  $('#pl-upd').textContent = p?.updated ? 'updated ' + new Date(p.updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  $('#pl-view').innerHTML = p?.text?.trim() ? md(p.text) : '<p class="muted">No plan yet. Click <b>Edit</b> to write your workout and lifestyle plan, or put a PDF or Google Doc in the <b>Plan</b> folder in Google Drive.</p>';
  $('#pl-docs-card').hidden = store !== Drive;
  if (Drive.ids.plan) $('#pl-open').href = 'https://drive.google.com/drive/folders/' + Drive.ids.plan;
}
function editPlan(on) {
  planEditing = on;
  $('#pl-editor').hidden = !on; $('#pl-view').hidden = on; $('#pl-edit').hidden = on;
  if (on) { $('#pl-text').value = data.plan?.text || PLAN_TEMPLATE; $('#pl-text').focus(); }
  else renderPlan();
}
async function savePlan() {
  data.plan = { text: $('#pl-text').value, updated: new Date().toISOString() };
  planDirty = true;
  await runTask(persist);
  if (!planDirty) { editPlan(false); toast('Plan saved.'); }
}

let planDocs = null, planUrl = null;
const DOC_ICON = f => /pdf/.test(f.mimeType) || /\.pdf$/i.test(f.name) ? '📄' : /image/.test(f.mimeType) ? '🖼️' : /document/.test(f.mimeType) ? '📝' : /spreadsheet/.test(f.mimeType) ? '📊' : '📎';
async function loadPlanDocs(force) {
  if (store !== Drive || !Drive.ids.plan) return;
  if (planDocs && !force) return;
  planDocs = (await Drive.list(`'${Drive.ids.plan}' in parents and trashed=false and mimeType!='${FOLDER_MIME}'`)).sort((a, b) => a.name.localeCompare(b.name));
  $('#pl-docs').innerHTML = planDocs.map(f => `<button type="button" data-id="${esc(f.id)}">${DOC_ICON(f)} ${esc(f.name)}</button>`).join('');
  if (!planDocs.length) { $('#pl-doc').innerHTML = ''; return; }
  const last = LS.get('hs-plan-doc', '');
  showPlanDoc(planDocs.find(f => f.id === last) || planDocs[0]);
}
async function showPlanDoc(f) {
  LS.set('hs-plan-doc', f.id);
  $$('#pl-docs button').forEach(b => b.classList.toggle('on', b.dataset.id === f.id));
  const box = $('#pl-doc');
  const open = `<a class="small" href="https://drive.google.com/open?id=${encodeURIComponent(f.id)}" target="_blank" rel="noopener">Open in Google Drive ↗</a>`;
  box.innerHTML = `<p class="muted small" style="margin:12px 0 0">Loading ${esc(f.name)}…</p>`;
  try {
    let url, kind;
    const g = f.mimeType.startsWith('application/vnd.google-apps');
    if (g && /document|spreadsheet|presentation/.test(f.mimeType)) { url = `files/${f.id}/export?mimeType=application%2Fpdf`; kind = 'pdf'; }
    else if (f.mimeType === 'application/pdf' || /\.pdf$/i.test(f.name)) { url = `files/${f.id}?alt=media`; kind = 'pdf'; }
    else if (f.mimeType.startsWith('image/')) { url = `files/${f.id}?alt=media`; kind = 'img'; }
    else if (/^text\/|markdown/.test(f.mimeType) || /\.(md|txt)$/i.test(f.name)) { url = `files/${f.id}?alt=media`; kind = 'text'; }
    else { box.innerHTML = `<p class="small" style="margin:12px 0 0">This kind of file can't be shown here. ${open}<br><span class="muted">Tip: open it in Google Drive and choose <b>File › Save as Google Docs</b>, or save it as a PDF.</span></p>`; return; }
    const r = await Drive.api(url);
    if (kind === 'text') { box.innerHTML = `<div class="prose" style="margin-top:14px">${md(await r.text())}</div><p class="small">${open}</p>`; return; }
    if (kind === 'pdf') {
      const buf = await r.arrayBuffer();
      box.innerHTML = `<p class="small">${open}</p>`;
      await renderPdfPages(buf, box);
      return;
    }
    const blob = await r.blob();
    if (planUrl) URL.revokeObjectURL(planUrl);
    planUrl = URL.createObjectURL(blob);
    box.innerHTML = `<img class="doc-img" src="${planUrl}" alt="${esc(f.name)}"><p class="small">${open}</p>`;
  } catch (e) {
    box.innerHTML = `<p class="err" style="margin:12px 0 0">Couldn't load this file: ${esc(e.message)}</p><p class="small">${open}</p>`;
  }
}

/* ---- fix a mistake: move or delete ---- */
async function moveEntries(to) {
  const from = logDate;
  if (!to) { toast('Pick the day to move to first.'); return; }
  if (to === from) { toast('That’s the same day.'); return; }
  if (logDirty) await saveLogDay();
  const src = getDay(from);
  const manualFood = src?.food.filter(f => f.source === 'manual') || [];
  const manualWk = src?.workouts.filter(w => w.source === 'manual') || [];
  const mWeight = src?.weightSource === 'manual', mSteps = src?.stepsSource === 'manual', mSleep = src?.sleep?.source === 'manual';
  if (!src || (!hasFeel(src.feel) && !hasPv(src.pv) && !src.anchors?.some(v => v != null) && !manualFood.length && !manualWk.length && !mWeight && !mSteps && !mSleep && !src.body?.length)) { toast('Nothing you entered by hand on this day to move.'); return; }
  const dst = getDay(to);
  const toName = fmtDay(to, { weekday: 'short', month: 'short', day: 'numeric' });
  if (hasFeel(src.feel) && hasFeel(dst?.feel) && !confirm(`${toName} already has feelings logged. Replace them with this day's?`)) return;
  const d = day(to);
  if (hasFeel(src.feel)) { d.feel = src.feel; delete src.feel; }
  if (src.anchors?.some(v => v != null)) { d.anchors = src.anchors; delete src.anchors; }
  if (hasPv(src.pv)) { d.pv = src.pv; delete src.pv; }
  d.food.push(...manualFood); src.food = src.food.filter(f => f.source !== 'manual');
  d.workouts.push(...manualWk); src.workouts = src.workouts.filter(w => w.source !== 'manual');
  if (mWeight) { d.weight = src.weight; d.weightUnit = src.weightUnit; d.weightSource = 'manual'; delete src.weight; delete src.weightUnit; delete src.weightSource; }
  if (mSteps) { d.steps = src.steps; d.stepsSource = 'manual'; delete src.steps; delete src.stepsSource; }
  if (mSleep) { d.sleep = src.sleep; delete src.sleep; }
  if (src.body?.length) { (d.body ||= []).push(...src.body); delete src.body; }
  touch(from); touch(to);
  await runTask(persist);
  logDate = to; renderLog(); renderDash(); renderHist();
  toast(`Moved to ${toName}.`);
}
async function deleteFeelings() {
  const d = getDay(logDate);
  if (!hasFeel(d?.feel) && !hasPv(d?.pv)) { toast('No feelings logged on this day.'); return; }
  if (!confirm(`Delete the mood, energy, stress, tags and notes for ${fmtDay(logDate, { weekday: 'long', month: 'long', day: 'numeric' })}?`)) return;
  logDirty = false; delete d.feel; delete d.pv; touch(logDate);
  await runTask(persist);
  renderLog(); renderDash(); renderHist(); toast('Feelings deleted.');
}
async function deleteDay() {
  if (!getDay(logDate)) { toast('There is nothing saved on this day.'); return; }
  if (!confirm(`Delete EVERYTHING on ${fmtDay(logDate, { weekday: 'long', month: 'long', day: 'numeric' })}: feelings, food, workouts, steps, weight and sleep?\n\nImported data will come back if you import that day's Lose It or Garmin file again.`)) return;
  logDirty = false; delete data.days[logDate]; touch(logDate);
  await runTask(persist);
  renderLog(); renderDash(); renderHist(); toast('Day deleted.');
}

/* ---- sortable tables (Daily log on detail pages, History) ---- */
const TABLES = { m: { head: '#m-thead', body: '#m-tbody' }, h: { head: '#tab-hist thead', body: '#h-body' } };
const sortState = {};
function cellValue(tr, col) {
  if (col === 0) return tr.dataset.k;                       // dates sort by their real date
  const td = tr.children[col];
  if (!td) return null;
  const raw = (td.dataset.sort ?? td.textContent).trim();
  if (!raw || raw === '—' || raw === '·') return td.textContent.trim() === '·' ? 0 : null;
  if (raw === '✓') return 1;
  const n = parseFloat(raw.replace(/,/g, ''));
  return /^[-+]?\d[\d,]*(\.\d+)?/.test(raw) && !isNaN(n) ? n : raw.toLowerCase();
}
function sortTable(id) {
  const t = TABLES[id], st = sortState[id];
  $$(t.head + ' th').forEach((th, i) => { th.classList.add('sortable'); th.dataset.dir = st && st.col === i ? (st.dir > 0 ? 'asc' : 'desc') : ''; });
  if (!st) return;
  const body = $(t.body), rows = [...body.querySelectorAll('tr[data-k]')];
  rows.sort((a, b) => {
    const x = cellValue(a, st.col), y = cellValue(b, st.col);
    if (x == null && y == null) return 0;
    if (x == null) return 1;                                 // blanks always last
    if (y == null) return -1;
    const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
    return st.dir * c || (a.dataset.k < b.dataset.k ? 1 : -1);
  });
  rows.forEach(r => body.appendChild(r));
}
for (const [id, t] of Object.entries(TABLES)) {
  $(t.head).addEventListener('click', e => {
    const th = e.target.closest('th'); if (!th) return;
    const col = [...th.parentNode.children].indexOf(th), st = sortState[id];
    // First click: newest / highest first. Click again to reverse.
    sortState[id] = { col, dir: st && st.col === col ? -st.dir : (col === 0 || !isNaN(parseFloat(String(cellValue($(t.body).querySelector('tr[data-k]') || document.createElement('tr'), col) ?? 0))) ? -1 : 1) };
    sortTable(id);
  });
}

/* ---- History ---- */
function renderHist() {
  const n = +$('#h-range').value;
  let keys = Object.keys(data.days).sort().reverse();
  if (n) { const cut = addDays(todayKey(), -(n - 1)); keys = keys.filter(k => k >= cut); }
  $('#h-empty').hidden = !!keys.length;
  $('#h-body').innerHTML = keys.map(k => {
    const d = getDay(k), t = totals(d);
    return `<tr data-k="${k}"><td>${esc(fmtDay(k, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }))}</td><td>${fmtN(d.steps)}</td><td>${t.hasFood ? fmtN(t.calIn) : '—'}</td><td>${t.hasFood ? fmtN(t.protein) : '—'}</td><td>${t.hasEx ? fmtN(t.exMin) : '—'}</td><td>${t.hasEx ? fmtN(t.burn) : '—'}</td><td>${d.weight != null ? fmtN(d.weight, 1) + ' ' + esc(d.weightUnit || 'lb') : '—'}</td><td>${fmtN(sleepHours(d), 1)}</td><td>${anchorCount(d) + '/' + anchorCfg().names.length}</td><td data-sort="${d.feel?.mood ?? ''}">${d.feel?.mood ? MOODS[d.feel.mood - 1] : '—'}</td></tr>`;
  }).join('');
  sortTable('h');
}

/* ---- Import & Settings ---- */
function renderImports() {
  const list = data.imports.slice().reverse().slice(0, 40);
  $('#imp-hist').innerHTML = list.length ? list.map(i => `<div class="li"><span class="n">${esc(i.name)}<div class="muted small">${esc(i.count)} ${esc(i.what)}${i.range ? ' · ' + esc(i.range) : ''}</div></span><span class="x small">${esc(new Date(i.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))}</span></div>`).join('') : '<p class="muted small" style="margin:0">No imports yet.</p>';
  $('#imp-drive').hidden = store !== Drive;
  if (Drive.ids.inbox) $('#imp-open').href = 'https://drive.google.com/drive/folders/' + Drive.ids.inbox;
}
const TILE_LABELS = { steps: 'Steps', cal: 'Calories', ex: 'Exercise', weight: 'Weight', mood: 'Mood', sleep: 'Sleep' };
function syncTileToggles() {
  const hidden = hiddenTiles();
  const container = $('#s-tiles');
  if (!container.children.length) {
    container.innerHTML = Object.entries(TILE_LABELS).map(([kind, label]) =>
      `<label style="display:flex;gap:6px;align-items:center;font-weight:400;cursor:pointer"><input type="checkbox" data-tile-toggle="${kind}" ${hidden.includes(kind) ? '' : 'checked'}> ${label}</label>`
    ).join('');
    container.addEventListener('change', e => {
      const cb = e.target.closest('[data-tile-toggle]'); if (!cb) return;
      toggleTile(cb.dataset.tileToggle, !cb.checked);
    });
  } else {
    Object.keys(TILE_LABELS).forEach(kind => {
      const cb = container.querySelector(`[data-tile-toggle="${kind}"]`);
      if (cb) cb.checked = !hidden.includes(kind);
    });
  }
}

// Settings › What you use: every tab and detail page, most opened first, never-opened ones last.
function renderUsage() {
  const el = $('#s-use'); if (!el) return;
  const devs = Object.values(data.usage || {}), tot = {};
  for (const u of devs) for (const [k, [n, last]] of Object.entries(u.n || {})) { const t = (tot[k] ||= [0, null]); t[0] += n; if (!t[1] || last > t[1]) t[1] = last; }
  const tabName = Object.fromEntries($$('#tabs button').map(b => [b.dataset.tab, b.textContent.trim()]));
  const all = [...Object.keys(tabName).map(t => ['tab:' + t, tabName[t]]), ...Object.entries(METRICS).map(([k, m]) => ['page:' + k, `${m.name} page`])];
  const since = devs.map(u => u.since).filter(Boolean).sort()[0];
  $('#s-use-sub').textContent = since ? `since ${fmtDay(since, { month: 'short', day: 'numeric' })} · ${plural(devs.length, 'device')}` : 'counting from now';
  el.innerHTML = all.sort((a, b) => (tot[b[0]]?.[0] || 0) - (tot[a[0]]?.[0] || 0)).map(([k, name]) => { const t = tot[k];
    return `<div class="li"><span class="n">${esc(name)}</span><span class="x${t ? '' : ' muted'}">${t ? `${plural(t[0], 'time')} · last ${esc(daysAgo(Math.round((keyToDate(todayKey()) - keyToDate(t[1])) / 864e5)))}` : 'never opened'}</span></div>`; }).join('');
}
function renderSettings() {
  renderUsage();
  $('#s-where').innerHTML = store === Drive
    ? `Connected as <b>${esc(Drive.email || LS.get('hs-email', '') || 'your Google account')}</b>. Your data is saved in your Google Drive, in <b>Health Sync › ${DATA_NAME}</b>. Open this app on any computer and connect the same Google account to see the same data.`
    : `You're in <b>this computer only</b> mode: data is saved in this browser and won't sync. Sign out and choose <b>Connect Google Drive</b> to sync. Anything saved here will be copied into Drive.`;
  $('#s-units').value = settings.units;
  renderAnchorSettings();
  $('#s-theme').value = settings.theme;
  syncTileToggles();
}

function applyTheme() {
  if (settings.theme) document.documentElement.dataset.theme = settings.theme; else delete document.documentElement.dataset.theme;
}
