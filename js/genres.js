/* Genre presets and the song builder.
   A genre sets tempo, swing, key, scale, sounds, mix, effects, drum patterns
   (strings, see TS.drum) and melodic line styles (see TS.LINES).
   "Make song" turns a genre into 8 sections (patterns A to H) and a chain. */
'use strict';
var TS = window.TS = window.TS || {};

TS.GENRES = {
  detroit: {
    name: 'Detroit', blurb: 'Soulful, futurist, machine funk. Chord stabs and strings over a punchy 909. Dorian minor gives the hopeful edge.',
    bpm: 128, swing: 54, key: 5, scale: 'dorian',
    fx: { drive: 0.15, duck: 0.45, rsize: 2.2, dfb: 0.35, dtime: 3 },
    sound: { kick: { tune: 52, decay: 0.32, drive: 2, punch: 5 }, stab: { chord: 2, cut: 2400, decay: 0.3, env: 2500 }, pad: { chord: 2, cut: 3000, attack: 0.4 }, bass: { wave: 1, cut: 500, decay: 0.16 }, pluck: { ratio: 1, index: 2.5 } },
    mix: { stab: { dly: 0.25, rev: 0.25, level: 0.7 }, pad: { rev: 0.4, level: 0.55 }, pluck: { dly: 0.3, level: 0.5 } },
    drums: { kick: 'x...', clap: '....x.......x...', chat: '..x...x...x...x.', ohat: '..x.', ride: '', shaker: '2x3x2x3x2x3x2x3x', rim: '...2..3....2..4.', tom: '', cow: '' },
    lines: { bass: 'rolling', stab: 'detroit', pad: 'hold', pluck: 'arp' }
  },
  berlin: {
    name: 'Berlin warehouse', blurb: 'Dark, driving, relentless. Rumbling kick, off-beat bass, hats in the dark. Phrygian for menace.',
    bpm: 134, swing: 50, key: 6, scale: 'phrygian',
    fx: { drive: 0.35, duck: 0.7, rsize: 3, dfb: 0.45, dtime: 3 },
    sound: { kick: { tune: 46, decay: 0.45, drive: 4, punch: 6, rumble: 0.55, click: 0.25 }, bass: { wave: 1, cut: 200, decay: 0.14, env: 500, sub: 0.4 }, stab: { chord: 4, cut: 700, decay: 0.18 }, pad: { chord: 0, cut: 900, attack: 1.5 }, chat: { tone: 9000, decay: 0.035 } },
    mix: { stab: { dly: 0.45, rev: 0.35, level: 0.55 }, pad: { rev: 0.5, level: 0.5 }, rim: { dly: 0.3 } },
    drums: { kick: 'x...', clap: '....3.......x...', chat: 'x4x7x4x7x4x7x4x7', ohat: '..x.', rim: '..3..x....4..5..', ride: '', shaker: '', tom: '', cow: '' },
    lines: { bass: 'offbeat', stab: 'sparse', pad: 'hold' }
  },
  minimal: {
    name: 'Minimal', blurb: 'Less is more. Tight short kick, clicks and rims, swung shakers, a few FM bleeps. Space is the instrument.',
    bpm: 126, swing: 58, key: 9, scale: 'minor',
    fx: { drive: 0.05, duck: 0.35, rsize: 1.6, dfb: 0.4, dtime: 3 },
    sound: { kick: { tune: 55, decay: 0.22, drive: 1.5, punch: 4, click: 0.5 }, bass: { wave: 0, decay: 0.2, sub: 0 }, clap: { tone: 1500, decay: 0.12 }, pluck: { ratio: 3.5, index: 3, decay: 0.12 }, shaker: { decay: 0.05 } },
    mix: { pluck: { dly: 0.4, rev: 0.2, level: 0.55 }, rim: { dly: 0.2, level: 0.7 } },
    drums: { kick: 'x...', clap: '....x.......x..2', chat: '..x...x...x...x.', ohat: '', rim: 'x..x..x...x..x..', shaker: 'x4x4x4x4x4x4x4x4', tom: '.......3......2.', ride: '', cow: '' },
    lines: { bass: 'minimal', pluck: 'bleep' }
  },
  dub: {
    name: 'Dub techno', blurb: 'Basic Channel style: one minor chord echoing into a deep delay, soft kick, hiss. Patience.',
    bpm: 120, swing: 52, key: 2, scale: 'minor',
    fx: { drive: 0.1, duck: 0.5, rsize: 4.5, dfb: 0.62, dtime: 3, dtone: 0.4 },
    sound: { kick: { tune: 48, decay: 0.4, drive: 1.5, punch: 4, click: 0.1 }, stab: { chord: 4, cut: 700, res: 3, env: 900, decay: 0.3, detune: 6 }, bass: { wave: 0, decay: 0.35, sub: 0.2 }, pad: { chord: 1, cut: 800 }, chat: { tone: 7000, noise: 0.7 } },
    mix: { stab: { dly: 0.7, rev: 0.45, level: 0.7, duck: 0.6 }, pad: { rev: 0.6, level: 0.45 }, chat: { level: 0.55 } },
    drums: { kick: 'x...', clap: '', chat: '..x...x...x...x.', ohat: '', shaker: '3x3x3x3x3x3x3x3x', rim: '.....3.......2..', ride: '', tom: '', cow: '' },
    lines: { bass: 'sub', stab: 'dub', pad: 'hold' }
  },
  acid: {
    name: 'Acid techno', blurb: 'A 303 line screaming over a hard 909. Ride the cutoff and resonance knobs while it plays.',
    bpm: 138, swing: 52, key: 7, scale: 'phrygian',
    fx: { drive: 0.4, duck: 0.6, rsize: 2, dfb: 0.4, dtime: 3 },
    sound: { kick: { tune: 50, decay: 0.32, drive: 5, punch: 7 }, acid: { oct: 1, cut: 320, res: 16, env: 2800, decay: 0.2, dist: 3.5 }, clap: { decay: 0.2 } },
    mix: { acid: { dly: 0.2, rev: 0.1, level: 0.75 } },
    drums: { kick: 'x...', clap: '....x.......x...', chat: 'xx5xxx5xxx5xxx5x', ohat: '..x.', ride: '', shaker: '', rim: '', tom: '', cow: '' },
    lines: { acid: 'acid', pad: 'hold' }
  },
  hard: {
    name: 'Hard techno', blurb: 'Fast, distorted, pounding. Overdriven kick, off-beat rides, rolling distorted bass. Peak hour at 150.',
    bpm: 150, swing: 50, key: 4, scale: 'phrygian',
    fx: { drive: 0.6, duck: 0.75, rsize: 2.2, dfb: 0.35, dtime: 3 },
    sound: { kick: { tune: 52, decay: 0.3, drive: 9, punch: 8, sweep: 0.02, click: 0.5, rumble: 0.35 }, bass: { wave: 3, cut: 300, decay: 0.1, env: 700, detune: 20 }, ride: { decay: 0.5 }, clap: { tone: 1400 }, stab: { chord: 7, cut: 2000 } },
    mix: { ride: { level: 0.6 }, stab: { dly: 0.3, level: 0.55 } },
    drums: { kick: 'x...', clap: '....x.......x...', chat: 'xxxx', ohat: '..x.', ride: '..x...x...x...x.', tom: '', shaker: '', rim: '', cow: '' },
    lines: { bass: 'rolling', stab: 'sparse' }
  },
  industrial: {
    name: 'Industrial', blurb: 'Machines and metal. Distorted kick, clanging percussion, noise. Heavy master drive.',
    bpm: 136, swing: 50, key: 1, scale: 'locrian',
    fx: { drive: 0.75, duck: 0.6, rsize: 3.5, dfb: 0.5, dtime: 2 },
    sound: { kick: { tune: 44, decay: 0.5, drive: 11, punch: 9, rumble: 0.7 }, snare: { tone: 160, snappy: 0.9, decay: 0.3 }, cow: { tune: 0.7, tone: 1600, decay: 0.4 }, ride: { pitch: 2.2, tone: 3500, decay: 0.6 }, tom: { tune: 90, decay: 0.4, noise: 0.4 }, bass: { wave: 4, cut: 600, decay: 0.12 }, stab: { chord: 10, cut: 1500 } },
    mix: { cow: { dly: 0.4, rev: 0.4, level: 0.5 }, snare: { rev: 0.35 }, ride: { level: 0.5, rev: 0.3 } },
    drums: { kick: 'x...', snare: '....x.......x..3', chat: 'x6x6', ohat: '', cow: '...3......3...2.', ride: '..x...x...x...x.', tom: '3..4..3...3..5..', clap: '', shaker: '', rim: '' },
    lines: { bass: 'offbeat', stab: 'sparse' }
  },
  peak: {
    name: 'Peak time', blurb: 'Big room techno: huge kick, rolling bass, claps, rides, a stab hook and a long build to the drop.',
    bpm: 132, swing: 50, key: 9, scale: 'minor',
    fx: { drive: 0.3, duck: 0.65, rsize: 2.8, dfb: 0.4, dtime: 3 },
    sound: { kick: { tune: 50, decay: 0.36, drive: 4, punch: 6, rumble: 0.25 }, bass: { wave: 1, cut: 260, decay: 0.12, env: 700 }, stab: { chord: 1, cut: 1600, decay: 0.22 }, pad: { chord: 2 }, acid: { oct: 2 } },
    mix: { stab: { dly: 0.35, rev: 0.3, level: 0.6 }, pad: { rev: 0.5, level: 0.5 }, ride: { level: 0.55 } },
    drums: { kick: 'x...', clap: '....x.......x...', chat: 'x.xxx.xxx.xxx.xx', ohat: '..x.', ride: '..x.', shaker: '', rim: '', tom: '', cow: '' },
    lines: { bass: 'rolling', stab: 'rave', pad: 'hold', acid: 'acid' }
  },
  hypnotic: {
    name: 'Hypnotic', blurb: 'Looping, trance inducing. Short melodic cells of odd length phase against the 4/4 (polymeter), so the groove keeps shifting.',
    bpm: 130, swing: 52, key: 0, scale: 'phrygian',
    fx: { drive: 0.25, duck: 0.6, rsize: 3.5, dfb: 0.5, dtime: 3 },
    sound: { kick: { tune: 47, decay: 0.42, drive: 3, rumble: 0.5 }, pluck: { oct: 3, ratio: 2, index: 5, decay: 0.15 }, tom: { tune: 120, decay: 0.2 }, bass: { wave: 1, cut: 220, decay: 0.12 }, pad: { chord: 0, cut: 1000 } },
    mix: { pluck: { dly: 0.45, rev: 0.3, level: 0.55 }, tom: { dly: 0.25, level: 0.6 } },
    drums: { kick: 'x...', clap: '............x...', chat: 'x5x5', ohat: '..x.', tom: 'x..x..x..x..', rim: '..3.', ride: '', shaker: '', cow: '' },
    lines: { bass: 'offbeat', pluck: 'ostinato', pad: 'hold' },
    len: { pluck: 7, tom: 12, rim: 10 }
  },
  melodic: {
    name: 'Melodic techno', blurb: 'Emotional, cinematic. Big pads, arpeggios, reese bass, clean kick. Minor key with room to breathe.',
    bpm: 124, swing: 50, key: 11, scale: 'minor',
    fx: { drive: 0.15, duck: 0.6, rsize: 4, dfb: 0.45, dtime: 3 },
    sound: { kick: { tune: 52, decay: 0.34, drive: 2.5, punch: 5 }, bass: { wave: 3, cut: 380, decay: 0.16, detune: 12 }, pad: { chord: 2, cut: 2500, attack: 1, release: 2 }, pluck: { ratio: 2, index: 2, decay: 0.3, oct: 4 }, stab: { chord: 2 } },
    mix: { pad: { rev: 0.5, level: 0.6 }, pluck: { dly: 0.45, rev: 0.35, level: 0.55 } },
    drums: { kick: 'x...', clap: '....x.......x...', chat: '..x...x...x...x.', ohat: '..x.', shaker: 'x3x3x3x3x3x3x3x3', ride: '', rim: '', tom: '', cow: '' },
    lines: { bass: 'rolling', pad: 'hold', pluck: 'arp' }
  },
  hardgroove: {
    name: 'Hardgroove', blurb: 'Loopy, funky, percussive. Congas, cowbell, swing, a bouncing bass. Fast and jacking.',
    bpm: 140, swing: 57, key: 7, scale: 'minor pentatonic',
    fx: { drive: 0.35, duck: 0.55, rsize: 1.8, dfb: 0.35, dtime: 3 },
    sound: { kick: { tune: 54, decay: 0.28, drive: 4, punch: 6 }, tom: { tune: 280, decay: 0.15, bend: 1.3 }, cow: { decay: 0.15 }, bass: { wave: 2, cut: 700, decay: 0.12, env: 1500 }, ride: { decay: 0.6 } },
    mix: { tom: { level: 0.65, pan: 0.3 }, cow: { level: 0.4, pan: -0.3 }, ride: { level: 0.5 } },
    drums: { kick: 'x...', clap: '....x.......x...', chat: 'x.xxx.xxx.xxx.xx', ohat: '..x.', ride: '..x.', tom: 'x.4x..x.4.x.x..4', cow: '..3....3..3.....', rim: '.3..x.3..x..3..x', shaker: '', snare: '' },
    lines: { bass: 'funky' }
  },
  rave: {
    name: 'Rave', blurb: 'Hard 90s rave energy at 145: distorted kick, power chord stabs, reese bass, snare rolls into the drop.',
    bpm: 145, swing: 50, key: 2, scale: 'minor',
    fx: { drive: 0.5, duck: 0.65, rsize: 2.5, dfb: 0.35, dtime: 3 },
    sound: { kick: { tune: 55, decay: 0.3, drive: 8, punch: 9 }, stab: { chord: 0, cut: 3500, decay: 0.2, env: 3000, detune: 18 }, bass: { wave: 3, cut: 500, decay: 0.15, detune: 25 }, pad: { chord: 0 }, snare: { tone: 220 } },
    mix: { stab: { dly: 0.2, rev: 0.25, level: 0.65 } },
    drums: { kick: 'x...', clap: '....x.......x...', snare: '..............3x', chat: 'xxxx', ohat: '..x.', ride: '', tom: '', cow: '', shaker: '', rim: '' },
    lines: { bass: 'offbeat', stab: 'rave', pad: 'hold' }
  },
  ambient: {
    name: 'Deep / ambient', blurb: 'Deep, hazy, slow burning. Long pads, soft kick, sub bass, distant bleeps, lots of reverb.',
    bpm: 118, swing: 54, key: 3, scale: 'dorian',
    fx: { drive: 0.05, duck: 0.4, rsize: 6, dfb: 0.55, dtime: 3, dtone: 0.35 },
    sound: { kick: { tune: 46, decay: 0.45, drive: 1.2, punch: 3.5, click: 0.05 }, pad: { chord: 3, cut: 1400, attack: 2, release: 3, gate: 16 }, bass: { wave: 0, decay: 0.5 }, pluck: { ratio: 1, index: 1.5, decay: 0.5 }, chat: { noise: 0.8, tone: 7000 } },
    mix: { pad: { rev: 0.7, level: 0.65 }, pluck: { dly: 0.55, rev: 0.6, level: 0.4 }, chat: { level: 0.45 } },
    drums: { kick: 'x...', clap: '', chat: '..x...x...x...x.', shaker: '3x2x3x2x3x2x3x2x', rim: '.......3.......2', ohat: '', ride: '', tom: '', cow: '' },
    lines: { bass: 'sub', pad: 'hold', pluck: 'bleep' }
  },
  electro: {
    name: 'Electro', blurb: 'Drexciya and Kraftwerk descendants: broken 808 beats, long gliding bass, robotic bleeps. Not four on the floor.',
    bpm: 128, swing: 50, key: 4, scale: 'minor',
    fx: { drive: 0.2, duck: 0.2, rsize: 2, dfb: 0.4, dtime: 3 },
    sound: { kick: { tune: 45, decay: 0.7, drive: 1.5, punch: 3, sweep: 0.06, click: 0.15 }, snare: { tone: 200, snappy: 0.75 }, bass: { wave: 0, decay: 0.5, sub: 0, cut: 800 }, acid: { oct: 2, res: 10, cut: 500 }, pluck: { ratio: 3, index: 5, decay: 0.12 } },
    mix: { pluck: { dly: 0.35, level: 0.5 }, bass: { duck: 0.1 } },
    drums: { kick: 'x......x..x.....', snare: '....x.......x...', chat: 'x.xxx.xxx.xxx.xx', clap: '............3...', cow: '', ohat: '', ride: '', tom: '..........3...4.', shaker: '', rim: '' },
    lines: { bass: 'electro', pluck: 'bleep', acid: 'acid' }
  },
  schranz: {
    name: 'Schranz', blurb: 'German hard techno at 155+: saturated loops, filtered percussion, everything distorted, almost no melody.',
    bpm: 156, swing: 50, key: 5, scale: 'phrygian',
    fx: { drive: 0.8, duck: 0.6, rsize: 1.5, dfb: 0.3, dtime: 3 },
    sound: { kick: { tune: 50, decay: 0.26, drive: 12, punch: 10, sweep: 0.015, click: 0.6 }, ride: { pitch: 1.8, decay: 0.35 }, tom: { tune: 200, decay: 0.1, noise: 0.5 }, clap: { tone: 1800, decay: 0.15 } },
    mix: { ride: { level: 0.55 }, tom: { level: 0.55, dly: 0.2 } },
    drums: { kick: 'x...', clap: '....x.......x...', chat: 'xxxx', ohat: '..x.', ride: 'x.x.', tom: '.x5x.x5x.x5x.x5x', rim: '', cow: '', shaker: '', snare: '' },
    lines: { bass: 'gallop' }
  }
};

/* Song sections. `use` lists the tracks that play. `fx` is applied to the
   chain entry: build = highpass sweep up + noise riser, break = low-pass dip. */
TS.SECTIONS = [
  { name: 'Intro', bars: 8, use: ['kick', 'chat', 'rim', 'shaker'], fx: '' },
  { name: 'Groove', bars: 8, use: ['kick', 'chat', 'ohat', 'rim', 'shaker', 'tom', 'bass', 'cow'], fx: '' },
  { name: 'Main', bars: 16, use: 'all-but-pad', fx: '' },
  { name: 'Break', bars: 8, use: ['pad', 'stab', 'pluck', 'chat', 'ride'], fx: 'break' },
  { name: 'Build', bars: 4, use: ['snare', 'clap', 'chat', 'ohat', 'pad', 'stab', 'pluck', 'acid', 'bass'], fx: 'build', roll: true },
  { name: 'Drop', bars: 16, use: 'all', fx: '' },
  { name: 'Peak', bars: 16, use: 'all', fx: '', dense: true },
  { name: 'Outro', bars: 8, use: ['kick', 'chat', 'ohat', 'rim', 'bass', 'shaker'], fx: '' }
];

TS.defaultTrack = id => {
  const p = {}; for (const d of TS.VOICES[id].params) p[d[0]] = d[4];
  const melodic = TS.MELODIC.has(id);
  return { p, mix: { level: 0.8, pan: 0, dly: 0, rev: 0, duck: melodic ? 0.85 : (id === 'kick' ? 0 : 0.25), chance: 1 }, mute: false, solo: false, len: 16 };
};
TS.emptyPattern = () => { const p = { name: '' }; for (const id of TS.ORDER) p[id] = TS.MELODIC.has(id) ? Array(16).fill(null) : Array(16).fill(0); return p; };

TS.defaultState = () => {
  const s = {
    v: 2, bpm: 132, swing: 50, key: 9, scale: 'phrygian', genre: 'berlin', seed: 1,
    cur: 0, mode: 'pattern', chain: [{ p: 0, r: 4, fx: '' }],
    tracks: {}, pats: Array.from({ length: 8 }, TS.emptyPattern),
    fx: { filter: 0, dtime: 3, dfb: 0.4, dtone: 0.6, rsize: 2.2, drive: 0.2, duck: 0.6, duckRel: 0.18, vol: 0.8 }
  };
  for (const id of TS.ORDER) s.tracks[id] = TS.defaultTrack(id);
  return s;
};

/* Apply a genre's sound (tempo, key, voices, mix, fx) without touching patterns. */
TS.applyGenreSound = (s, gid) => {
  const g = TS.GENRES[gid], base = TS.defaultState();
  s.genre = gid; s.bpm = g.bpm; s.swing = g.swing; s.key = g.key; s.scale = g.scale;
  s.fx = Object.assign({}, base.fx, g.fx || {}, { filter: 0, vol: s.fx ? s.fx.vol : 0.8 });
  for (const id of TS.ORDER) {
    const t = TS.defaultTrack(id);
    Object.assign(t.p, (g.sound || {})[id] || {});
    Object.assign(t.mix, (g.mix || {})[id] || {});
    t.len = (g.len || {})[id] || 16;
    s.tracks[id] = t;
  }
};

/* Build one pattern for a section from a genre. */
TS.makePattern = (gid, sec, R) => {
  const g = TS.GENRES[gid], pat = TS.emptyPattern(), L = (TS.SCALES[g.scale] || TS.SCALES.minor).length;
  pat.name = sec.name;
  const uses = id => sec.use === 'all' || (sec.use === 'all-but-pad' && id !== 'pad') || (Array.isArray(sec.use) && sec.use.includes(id));
  for (const id of TS.ORDER) {
    if (!uses(id)) continue;
    if (TS.MELODIC.has(id)) {
      const style = g.lines[id]; if (!style) continue;
      if (id === 'acid' && !(gid === 'acid' || sec.dense || sec.name === 'Drop')) continue; // acid enters at the drop unless it is the lead
      pat[id] = TS.LINES[style](R, L);
    } else {
      let str = g.drums[id] || '';
      if (sec.roll && (id === 'snare' || id === 'clap')) str = id === 'snare' ? TS.ROLL : '....x.......x...';
      if (sec.dense && !str && (id === 'ride' || id === 'shaker')) str = id === 'ride' ? '..x.' : 'x5x5';
      if (!str) continue;
      pat[id] = TS.drum(str, R);
    }
  }
  if (sec.fx === 'break') pat.kick = Array(16).fill(0);
  return pat;
};

/* Whole song: 8 sections into patterns A..H plus a chain. */
TS.makeSong = (s, gid, seed) => {
  const R = TS.rng(seed);
  TS.applyGenreSound(s, gid);
  s.seed = seed;
  s.pats = TS.SECTIONS.map(sec => TS.makePattern(gid, sec, R));
  // keep the drop and peak bassline the same as main so the song hangs together
  s.pats[5].bass = s.pats[2].bass.map(x => x && { ...x });
  s.pats[6].bass = s.pats[2].bass.map(x => x && { ...x });
  s.chain = TS.SECTIONS.map((sec, i) => ({ p: i, r: sec.bars, fx: sec.fx }));
  s.cur = 2;
};
