'use strict';
// Health Sync · the Training tab: load, intensity, readiness, strength, body log.
// One of the app's screen files: classic scripts that share one global scope, loaded in order by index.html.
/* ================= training & recovery ================= */

function readinessHtml(r, k) {
  if (!r) return `<p class="muted small" style="margin:0">Not enough data for ${k === todayKey() ? 'today' : fmtDay(k)} yet. Readiness needs last night’s sleep, HRV or resting heart rate, plus about a week of history to know your usual.</p>`;
  return `<div class="rd rd-${r.verdict}"><div class="rd-v">${esc(r.title)}</div><div class="rd-h">${esc(r.hint)}</div></div>
    <ul class="rd-list">${r.parts.map(p => `<li class="${p.score < 0 ? 'neg' : p.score > 0 ? 'pos' : ''}">${esc(p.text)}</li>`).join('')}${r.painNote ? `<li class="neg">${esc(r.painNote)}</li>` : ''}</ul>
    ${r.flags.length ? `<div class="partial-note" style="margin-top:10px">${r.flags.map(f => esc(f.text)).join('<br>')}<br>${esc(BODY_ADVICE)}</div>` : ''}`;
}
const zoneBar = z => { const t = z.reduce((a, b) => a + b, 0); return t ? `<span class="zbar" title="${z.map((m, i) => `Zone ${i + 1}: ${fmtN(m)} min`).join(' · ')}">${z.map((m, i) => `<i class="z${i + 1}" style="width:${m / t * 100}%"></i>`).join('')}</span>` : ''; };

function renderTraining() {
  if (!$('#tab-train')) return;
  const k = dashDate, r = readiness(k);
  $('#tr-date').textContent = k === todayKey() ? 'today' : fmtDay(k, { weekday: 'short', month: 'short', day: 'numeric' });
  $('#tr-ready').innerHTML = readinessHtml(r, k);
  const ls = loadStatus(k);
  $('#tr-load-tiles').innerHTML = [['Last 7 days', fmtN(ls.acute)], ['Usual week', ls.chronic == null ? '—' : fmtN(ls.chronic)], ['Ratio', ls.ratio == null ? '—' : ls.ratio + '×']].map(([a, b]) => `<div><span>${a}</span><b>${b}</b></div>`).join('');
  $('#tr-load-note').innerHTML = `<span class="ld ld-${ls.band}">${esc(ls.text)}.</span> ${(() => { const ks = windowKeys(k, 28), ws = ks.flatMap(x => getDay(x)?.workouts || []), est = ws.filter(w => workoutLoad(w).est).length; return ws.length ? `<span class="muted">Load is Garmin’s training load${est ? `; ${plural(est, 'workout')} in the last 4 weeks without it ${est === 1 ? 'is' : 'are'} estimated from heart-rate zones or minutes` : ''}.</span>` : ''; })()}`;
  // Weekly load, Monday–Sunday, for the last 12 weeks, with your usual week (the 4 before each) as a line.
  const w0 = weekStart(k), weeks = []; for (let i = 11; i >= 0; i--) weeks.push(addDays(w0, -7 * i));
  const wl = weeks.map(ws => sumLoad(windowKeys(addDays(ws, 6), 7)));
  const usualLine = weeks.map(ws => { const f = firstWorkoutDay(); return f && f <= addDays(ws, -28) ? Math.round(sumLoad(windowKeys(addDays(ws, -1), 28)) / 4) : null; });
  const cs = getComputedStyle(document.documentElement), col = cs.getPropertyValue('--c-ex').trim(), muted = cs.getPropertyValue('--muted').trim(), grid = cs.getPropertyValue('--grid').trim();
  charts['c-load']?.destroy();
  charts['c-load'] = new Chart($('#c-load'), {
    data: { labels: weeks.map(ws => fmtDay(ws, { month: 'short', day: 'numeric' })), datasets: [
      { type: 'bar', label: 'Week’s load', data: wl, backgroundColor: wl.map((_, i) => i === 11 ? col + '66' : col), borderRadius: 4, maxBarThickness: 26 },
      { type: 'line', label: 'Usual week', data: usualLine, borderColor: muted, borderDash: [5, 4], borderWidth: 2, pointRadius: 2, pointBackgroundColor: muted, spanGaps: true, tension: 0.3 }] },
    options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: { displayColors: false, callbacks: { label: c => c.parsed.y == null ? '' : `${c.dataset.label}: ${fmtN(c.parsed.y)}` } } },
      scales: { x: { grid: { display: false }, ticks: { color: muted, maxTicksLimit: 6, maxRotation: 0 } }, y: { beginAtZero: true, grid: { color: grid }, border: { display: false }, ticks: { color: muted, maxTicksLimit: 5 } } } } });
  const mixRow = (label, ks) => { const m = intensityMix(ks), t = m.easy + m.moderate + m.hard;
    return `<div class="sub-h">${label}</div>${t ? `<div class="hbars">${[['Easy (zones 1–2)', m.easy, 'z2'], ['Moderate (zone 3)', m.moderate, 'z3'], ['Hard (zones 4–5)', m.hard, 'z5']].map(([n, v, z]) => `<div class="hb"><span class="l">${n}</span><span class="t"><i class="${z}" style="width:${t ? +v / t * 100 : 0}%"></i></span><span class="x">${fmtN(v)} min</span></div>`).join('')}</div><p class="small muted" style="margin:6px 0 0">${m.hardPct}% hard.${m.noHr ? ` Plus ${fmtN(m.noHr)} min without heart-rate data.` : ''}</p>` : `<p class="small muted" style="margin:0">${m.noHr ? `${fmtN(m.noHr)} min of workouts, none with heart-rate zones.` : 'No workouts.'}</p>`}`; };
  $('#tr-mix').innerHTML = mixRow('Last 7 days', windowKeys(k, 7)) + mixRow('Last 4 weeks', windowKeys(k, 28)) + '<p class="small muted" style="margin:10px 0 0">Endurance training usually works best mostly easy, with a small share hard (often around 20%). A high hard share most weeks is hard to recover from.</p>';
  const st = strengthSummary(windowKeys(k, 28)), perWeek = Math.round(st.sessions.length / 4 * 10) / 10;
  $('#tr-strength').innerHTML = st.sessions.length ? `<p class="small" style="margin:0 0 8px"><b>${plural(st.sessions.length, 'session')}</b> in the last 4 weeks (about ${perWeek} a week)${perWeek < 2 ? '. Two a week is the usual minimum for keeping muscle and strength.' : '.'}</p>
    ${st.byEx.length ? `<div class="sub-h">Sets by exercise (Garmin)</div><div class="hbars" style="--c:var(--c-ex)">${st.byEx.slice(0, 10).map(([n, e]) => `<div class="hb"><span class="l">${esc(n)}</span><span class="t"><i style="width:${e.sets / st.byEx[0][1].sets * 100}%"></i></span><span class="x">${e.sets} sets · ${e.reps} reps</span></div>`).join('')}</div>` : '<p class="small muted" style="margin:0">No per-exercise sets yet. Garmin records them when you log strength workouts on the watch.</p>'}`
    : '<p class="small muted" style="margin:0">No strength sessions in the last 4 weeks. Two a week is the usual minimum for keeping muscle and strength, especially while losing weight.</p>';
  const bks = windowKeys(k, 14).reverse(), entries = bks.flatMap(x => (getDay(x)?.body || []).map(b => ({ k: x, ...b })));
  $('#tr-body').innerHTML = (r?.flags?.length ? `<div class="partial-note">${r.flags.map(f => esc(f.text)).join('<br>')}<br>${esc(BODY_ADVICE)}</div>` : '') +
    (entries.length ? `<div class="list">${entries.map(b => `<div class="li"><span class="n">${esc(b.area)}<span class="tag">${esc(BODY_KIND[b.kind] || b.kind)}</span>${b.note ? ` <span class="muted small">${esc(b.note)}</span>` : ''}</span><span class="x">${b.level}/10 · ${esc(fmtDay(b.k, { weekday: 'short', month: 'short', day: 'numeric' }))}</span></div>`).join('')}</div>`
      : '<p class="small muted" style="margin:0">Nothing logged in the last 2 weeks. Add soreness, stiffness or pain in <b>Log today › Body</b>.</p>');
  const wks = windowKeys(k, 14).reverse().flatMap(x => (getDay(x)?.workouts || []).map(w => ({ k: x, w })));
  $('#tr-workouts').innerHTML = wks.length ? wks.map(({ k: x, w }) => { const l = workoutLoad(w);
    return `<div class="li"><span class="n">${esc(w.title || w.type)}<span class="tag">${esc(srcName(w.source))}</span>${w.teLabel ? `<span class="tag">${esc(w.teLabel)}</span>` : ''}${w.zones ? zoneBar(w.zones) : ''}${w.sets?.length ? `<div class="muted small">${esc(w.sets.map(s => `${s.name} ${s.sets || '?'}×${s.reps ? Math.round(s.reps / (s.sets || 1)) : '?'}`).join(' · '))}</div>` : ''}</span>
      <span class="x">${[esc(fmtDay(x, { weekday: 'short', month: 'short', day: 'numeric' })), w.durationMin != null && fmtN(w.durationMin) + ' min', l.v && `load ${fmtN(l.v)}${l.est ? ' (est.)' : ''}`].filter(Boolean).join(' · ')}</span></div>`; }).join('')
    : '<p class="small muted" style="margin:0">No workouts in the last 2 weeks.</p>';
}
function renderPatterns() {
  const el = $('#pt-card'); if (!el) return;
  const P = findPatterns(dashDate);
  el.hidden = !P.length;
  $('#pt-body').innerHTML = P.slice(0, 6).map(p => `<div class="li"><span class="n"><span class="tag" style="margin:0 8px 0 0;${p.worse ? 'color:var(--bad)' : 'color:var(--good)'}">${p.worse ? 'worse' : 'better'}</span>${esc(p.text)}</span></div>`).join('');
}
