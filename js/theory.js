/* Music theory and pattern generators. */
'use strict';
var TS = window.TS = window.TS || {};

TS.NOTES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];

/* Scales as semitone offsets from the root. Techno lives mostly in the dark
   minor modes: aeolian, phrygian (flat 2nd = menace), dorian (raised 6th =
   Detroit soul), and the minor pentatonic (no wrong notes). */
TS.SCALES = {
  'minor': [0, 2, 3, 5, 7, 8, 10],
  'phrygian': [0, 1, 3, 5, 7, 8, 10],
  'dorian': [0, 2, 3, 5, 7, 9, 10],
  'minor pentatonic': [0, 3, 5, 7, 10],
  'harmonic minor': [0, 2, 3, 5, 7, 8, 11],
  'phrygian dominant': [0, 1, 4, 5, 7, 8, 10],
  'locrian': [0, 1, 3, 5, 6, 8, 10],
  'blues': [0, 3, 5, 6, 7, 10],
  'hirajoshi': [0, 2, 3, 7, 8],
  'major': [0, 2, 4, 5, 7, 9, 11],
  'mixolydian': [0, 2, 4, 5, 7, 9, 10]
};

TS.scale = s => TS.SCALES[s.scale] || TS.SCALES.minor;

/* Scale degree -> MIDI note.  midi = 24 + key + 12·oct + scale[d mod L] + 12·floor(d / L) */
TS.degMidi = (s, id, d) => {
  const sc = TS.scale(s), L = sc.length, oct = s.tracks[id].p.oct | 0;
  return 24 + s.key + 12 * oct + sc[((d % L) + L) % L] + 12 * Math.floor(d / L);
};
TS.noteName = m => TS.NOTES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);

/* Euclidean rhythm (Bresenham form of Bjorklund): k hits spread as evenly as
   possible over n steps.  step i is a hit when (i·k) mod n < k.
   E(3,8) = x..x..x.  the tresillo;  E(5,16) = bossa;  E(7,16) = samba-ish.
   rot shifts the pattern right by that many steps. */
TS.euclid = (k, n, rot = 0) => {
  const a = [];
  for (let i = 0; i < n; i++) a.push(k > 0 && (i * k) % n < k ? 1 : 0);
  return a.map((_, i) => a[(((i - rot) % n) + n) % n]);
};

/* Seeded random so a genre + seed always makes the same song. (mulberry32) */
TS.rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

/* Drum pattern strings, one character per 16th step:
     X accent   x hit   . rest   1..9  hit with 10%..90% chance (rolled once)
   Patterns shorter than 16 repeat. */
TS.drum = (str, R = Math.random) => {
  const out = [];
  for (let i = 0; i < 16; i++) {
    const c = str[i % str.length];
    out.push(c === 'X' ? 2 : c === 'x' ? 1 : c >= '1' && c <= '9' ? (R() < +c / 10 ? 1 : 0) : 0);
  }
  return out;
};

const pick = (R, arr) => arr[Math.floor(R() * arr.length)];
const wpick = (R, pairs) => { let s = 0; for (const p of pairs) s += p[1]; let r = R() * s; for (const p of pairs) { if ((r -= p[1]) < 0) return p[0]; } return pairs[0][0]; };
const N = (d, a = false, s = false) => ({ d, a, s });

/* Melodic line styles. L = notes per octave of the current scale.
   Each returns 16 steps of {d, a, s} or null. */
TS.LINES = {
  // bass between the kicks: the most common techno bassline
  offbeat: (R, L) => Array.from({ length: 16 }, (_, i) => i % 4 === 2 ? N(R() < 0.15 ? L : 0, R() < 0.2) : null),
  // three 16ths after each kick: the rolling Berlin/peak-time bass
  rolling: (R, L) => Array.from({ length: 16 }, (_, i) => i % 4 ? N(i % 4 === 3 && R() < 0.2 ? pick(R, [L, 4, 2]) : 0, i % 4 === 2) : null),
  // gallop: one, skip, two
  gallop: (R, L) => Array.from({ length: 16 }, (_, i) => i % 4 === 2 || i % 4 === 3 ? N(0, i % 4 === 2) : null),
  // long sub on the one and a pickup
  sub: (R, L) => Array.from({ length: 16 }, (_, i) => i === 0 ? N(0) : i === 10 && R() < 0.6 ? N(pick(R, [0, 4, -L + 4])) : null),
  // syncopated minimal bass: sparse, off the grid
  minimal: (R, L) => { const h = TS.euclid(pick(R, [3, 5]), 16, pick(R, [1, 3, 2])); return h.map(x => x ? N(R() < 0.2 ? 4 : 0, R() < 0.3) : null); },
  // funky hardgroove bass with octave jumps
  funky: (R, L) => Array.from({ length: 16 }, (_, i) => i % 4 === 0 ? null : R() < 0.65 ? N(R() < 0.35 ? L : pick(R, [0, 0, 2, 4]), R() < 0.35, R() < 0.15) : null),
  // 808 electro bass: long notes, glide between
  electro: (R, L) => { const pos = [0, 3, 6, 10, 11]; return Array.from({ length: 16 }, (_, i) => pos.includes(i) && R() < 0.85 ? N(pick(R, [0, 0, 2, 4, -L + 4]), false, R() < 0.4) : null); },
  /* acid: a weighted random walk around the root (first-order Markov). Root
     and octave dominate; accents ~30%, slides ~22%, rests ~30%. */
  acid: (R, L) => {
    const out = []; let prev = 0;
    for (let i = 0; i < 16; i++) {
      if (R() < (i % 4 === 0 ? 0.12 : 0.32)) { out.push(null); continue; }
      const d = wpick(R, [[0, 6], [L, 3], [prev, 2], [2, 1.5], [3, 1], [4, 1.5], [1, L === 7 ? 1 : 0.3], [L + 2, 0.7], [6 % L, 0.6]]);
      prev = d; out.push(N(d, R() < 0.3, R() < 0.22));
    }
    return out;
  },
  // dub techno chord stabs: two or three off-beat hits, same chord
  dub: (R) => { const v = pick(R, ['..x...x.....x...', '...x..x...x.....', '..x.....x.x.....', '......x.......x.', '..x..x....x..x..']); return [...v].map(c => c === 'x' ? N(0, R() < 0.3) : null); },
  // Detroit: 3-3-2 syncopation with chord changes
  detroit: (R, L) => { const p = 'x..x..x...x..x..', ch = [0, pick(R, [3, 5, 4]), pick(R, [5, 4, 2])]; let k = 0; return [...p].map((c, i) => c === 'x' ? N(ch[(k++ >> 1) % 3], i === 0) : null); },
  // one stab per bar on a different spot
  sparse: (R) => { const at = pick(R, [2, 6, 10, 3, 14]); return Array.from({ length: 16 }, (_, i) => i === at ? N(0, true) : null); },
  // held chord on the one
  hold: (R, L) => Array.from({ length: 16 }, (_, i) => i === 0 ? N(pick(R, [0, 0, 5 % L, 3])) : null),
  // arpeggio up and down the chord tones: root, 3rd, 5th, octave
  arp: (R, L) => { const tones = L === 5 ? [0, 1, 3, 5, 3, 1] : [0, 2, 4, 7, 4, 2]; const rate = pick(R, [1, 2]); let k = 0; return Array.from({ length: 16 }, (_, i) => i % rate ? null : N(tones[k++ % tones.length], i % 4 === 0)); },
  // hypnotic ostinato: a short cell, track length set separately for polymeter
  ostinato: (R, L) => { const cell = [N(0, true), null, N(pick(R, [2, 4, L])), N(0), null, N(pick(R, [1, 3, 4])), null]; return Array.from({ length: 16 }, (_, i) => cell[i % cell.length] && { ...cell[i % cell.length] }); },
  // minimal bleeps: rare, random, high
  bleep: (R, L) => Array.from({ length: 16 }, (_, i) => R() < 0.18 ? N(pick(R, [0, 2, 4, L, L + 2]), R() < 0.3) : null),
  // rave stab riff
  rave: (R, L) => { const p = pick(R, ['x..x..x.x..x..x.', 'x.x..x.x..x.x...', 'x..x...x..x..x..']); const ch = [0, pick(R, [5, 3]), pick(R, [4, 6])]; let k = 0; return [...p].map(c => c === 'x' ? N(ch[Math.floor(k++ / 3) % 3], k % 3 === 1) : null); }
};

/* Snare/clap rolls for builds: density rises across the bar. */
TS.ROLL = 'x...x...x.x.xxxx';
