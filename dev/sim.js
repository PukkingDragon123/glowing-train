'use strict';
/* ============================================================
   SIX CHAMBERS — payout sanity check.
   Re-implements the odds from js/game.js and plays a lot of runs,
   so tuning GOAL / START / RISK_PAY is a measurement, not a guess.

     node dev/sim.js [runs]              # defaults match js/game.js
     START=250 GOAL=1000 K=2.6 node dev/sim.js   # try other tunings
   ============================================================ */

const CHAMBERS = 6;
const GOAL     = +process.env.GOAL || 1500;
const START    = +process.env.START || 300;
const MIN_STAKE= 25;
const RISK_PAY = +process.env.K || 2.2;   // pot *= 1 + RISK_PAY * (death odds)

const payMult = (liveLeft, left) => {
  const p = liveLeft / left;
  return p >= 1 ? 1 : 1 + RISK_PAY * (p / (1 - p));
};

function cylinder(live) {
  const a = Array.from({ length: CHAMBERS }, (_, i) => i < live);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// One run. `plan` picks the stake, the number of live rounds, and when to stop.
function run(plan) {
  let chips = START, pulls = 0, rounds = 0;
  for (let guard = 0; guard < 5000; guard++) {
    if (chips >= GOAL) return { won: true, pulls, rounds };
    if (chips < MIN_STAKE) return { won: false, broke: true, pulls, rounds };

    const stake = Math.max(MIN_STAKE, Math.min(chips, plan.stake(chips)));
    chips -= stake;
    let pot = stake;
    const order = cylinder(plan.live);

    for (let i = 0; i < CHAMBERS; i++) {
      const left = CHAMBERS - i;
      const liveLeft = order.slice(i).filter(Boolean).length;
      const risk = liveLeft / left;
      if (risk >= 1 || !plan.pull(risk, i, pot, chips)) break;      // cash out
      if (order[i]) return { won: false, dead: true, pulls, rounds };
      pot = Math.round(pot * payMult(liveLeft, left));
      pulls++;
    }
    chips += pot;
    rounds++;
  }
  return { won: chips >= GOAL, pulls, rounds };
}

const plans = {
  'timid    (1 live, quit at 25% risk)':
    { live: 1, stake: c => Math.max(MIN_STAKE, Math.round(c * 0.25 / 25) * 25), pull: r => r <= 0.25 },
  'steady   (2 live, quit at 40% risk)':
    { live: 2, stake: c => Math.max(MIN_STAKE, Math.round(c * 0.35 / 25) * 25), pull: r => r <= 0.4 },
  'greedy   (2 live, all-in, quit at 50%)':
    { live: 2, stake: c => c, pull: r => r <= 0.5 },
  'reckless (3 live, all-in, quit at 60%)':
    { live: 3, stake: c => c, pull: r => r <= 0.6 },
  'suicidal (5 live, all-in, never quits)':
    { live: 5, stake: c => c, pull: () => true }
};

const N = parseInt(process.argv[2], 10) || 200000;
console.log(`SIX CHAMBERS — ${N.toLocaleString()} runs, start ${START}, goal ${GOAL}, risk-pay ${RISK_PAY}\n`);
console.log('strategy                                walk out    died    broke   avg pulls');
for (const [name, plan] of Object.entries(plans)) {
  let won = 0, dead = 0, broke = 0, pulls = 0;
  for (let i = 0; i < N; i++) {
    const r = run(plan);
    if (r.won) won++; else if (r.dead) dead++; else broke++;
    pulls += r.pulls;
  }
  const p = n => (n / N * 100).toFixed(1).padStart(5) + '%';
  console.log(`${name.padEnd(40)}${p(won)}  ${p(dead)}  ${p(broke)}     ${(pulls / N).toFixed(1)}`);
}
