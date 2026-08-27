'use strict';
/* ============================================================
   SHELL & DEBT — meta.js
   The stuff that survives a case: account stats, learned
   unlocks, collection. localStorage with an in-memory
   fallback so the headless sim can run it.
   ============================================================ */

const META = {
  KEY: 'snd2.meta',
  d: null,

  blank() {
    return {
      stats: {
        runs: 0, wins: 0, deaths: 0, duelsWon: 0, shots: 0,
        selfBlanks: 0, liveTaken: 0, activesUsed: 0, flawless: 0,
        clutchWins: 0, oppSelfKills: 0, maxDmgOneDuel: 0,
        bestAnte: 0, bossKills: 0, looted: 0, bribesPaid: 0, heatPaid: 0, itemsUsed: 0, skips: 0,
        loreSeen: 0,
      },
      bossSeen: {},   // boss id -> kills
      gunsOwned: { snub: true },

      tells: {},      // trait id -> true, once you've looted a frog that had it
      tutor: {},      // which of the captain's lines you have already heard
      trust: 0,       // Officer Maybelle. It adds up slowly, like anything real.
      /* how close the camera stands. Default is close; Z opens it out. */
      wideShot: false,
    };
  },

  load() {
    if (META.d) return META.d;
    META.d = META.blank();
    try {
      const raw = localStorage.getItem(META.KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        Object.assign(META.d.stats, saved.stats || {});
        Object.assign(META.d.bossSeen, saved.bossSeen || {});
        Object.assign(META.d.gunsOwned, saved.gunsOwned || {});
        if (saved.wideShot !== undefined) META.d.wideShot = !!saved.wideShot;
        Object.assign(META.d.tells, saved.tells || {});
        Object.assign(META.d.tutor, saved.tutor || {});
        if (typeof saved.trust === 'number') META.d.trust = saved.trust;
      }
    } catch (e) { /* node / private mode: memory only */ }
    return META.d;
  },

  save() {
    try { localStorage.setItem(META.KEY, JSON.stringify(META.d)); } catch (e) {}
  },

  reset() { META.d = META.blank(); META.save(); },

  stats() { return META.load().stats; },

  bump(k, n = 1) { META.load().stats[k] = (META.load().stats[k] || 0) + n; },

  maxStat(k, v) {
    const s = META.load().stats;
    if (v > (s[k] || 0)) s[k] = v;
  },

  addBossKill(id) {
    const d = META.load();
    d.bossSeen[id] = (d.bossSeen[id] || 0) + 1;
    d.stats.bossKills++;
  },

  ownGun(id) { META.load().gunsOwned[id] = true; },

  /* the notebook: a tell is learned by looting a frog that had it */
  knowsTell(id) { return !!META.load().tells[id]; },
  learnTrait(id) {
    const d = META.load();
    if (d.tells[id]) return false;
    d.tells[id] = true;
    return true;
  },

  /* ---------- unlocks ---------- */

  /* Nothing is gated behind an account stat any more: the only thing that
     carries between cases is what the department remembers about you, and
     how much Maybelle trusts you. */
  check() { return []; },
  unlockAll() { /* nothing left to unlock */ },
};
