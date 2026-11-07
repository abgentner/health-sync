'use strict';
// Health Sync · upgrading saved data, in one place. Every copy of the data passes through here when it's loaded
// (normalize() calls migrate()), so old settings are upgraded in order, once, the same way on every device.
// To change the shape of saved data: add a step at the END and raise SCHEMA_VERSION. Never edit an old step:
// a device that hasn't opened the app for months still has to go through it. tests.html checks every step.
// Loaded after rules.js (the steps use its defaults) and before sync.js.

const SCHEMA_VERSION = 3;
const MIGRATIONS = [
  { to: 1, from: 'v1.3', why: 'Day Pack moved from "3 shakes" to a daytime calorie budget (only if never customised)',
    run: d => {
      const c = d.anchorCfg; if (!c) return;
      const r0 = c.rules?.[0];
      if (r0?.type === 'food' && r0.words === 'kate farms, naked whey, shake' && r0.min === 3) c.rules[0] = { ...ANCHOR_DEFAULTS.rules[0] };
      if (c.hints?.[0] === 'Shakes at 7 AM, 11 AM & 3 PM') c.hints = ['Shakes at 7, 11 & 3 · daytime calorie budget', ...c.hints.slice(1)];
    } },
  { to: 2, from: 'v2.13', why: 'a fourth anchor box for steps; the 17-of-21 goal becomes 23 of 28',
    run: d => {
      const c = d.anchorCfg; if (!c || c.v >= 2) return;
      c.names = [...(c.names || ANCHOR_DEFAULTS.names.slice(0, 3))]; c.hints = [...(c.hints || [])]; c.rules = [...(c.rules || [])];
      if (!c.rules.some(r => r?.type === 'steps')) { const i = c.names.length; c.names.push('Steps'); c.hints[i] = '7,500 steps or more'; c.rules[i] = { type: 'steps', min: 7500 }; }
      if (c.target === 17) c.target = 23;
      c.v = 2;
    } },
  { to: 3, from: 'v3.4', why: 'other ways to fill a box: 5,000 steps is half, any 20 minutes of workouts counts, reminders at an old default updated',
    run: d => {
      const c = d.anchorCfg; if (!c || c.v >= 3) return;
      const OLD = { 'Shakes at 7, 11 & 3 · daytime calorie budget': 0, '8 oz protein · 2 cups veggies · 1 cup starch · one plate': 1, '25–30 min workout, 30-min walk, or the 10-min minimum': 2, '7,500 steps or more': 3 };
      c.rules = (c.rules || []).map(r => r?.type === 'steps' && r.half == null ? { ...r, half: 5000 } : r?.type === 'workout' ? { ...r, min: 20 } : r);
      c.hints = (c.hints || []).map(h => h in OLD ? ANCHOR_DEFAULTS.hints[OLD[h]] : h);
      c.v = 3;
    } },
];
function migrate(d) {
  const from = d.schemaVersion || 0;
  for (const m of MIGRATIONS) if (m.to > from) m.run(d);
  d.schemaVersion = Math.max(from, SCHEMA_VERSION);
  return d;
}
