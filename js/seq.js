/* Sequencer: turns patterns into scheduled sounds.
   Shared by live playback and the offline WAV renderer. */
'use strict';
var TS = window.TS = window.TS || {};

/* Swing delays every second 16th:  offset = (swing% / 100 − 0.5) · 2 · step.
   50% is straight, 66% is a triplet feel, 75% is a dotted feel. */
TS.swingOffset = (s, abs, sd) => abs % 2 ? (s.swing / 100 - 0.5) * 2 * sd : 0;

TS.playStep = (E, s, pat, abs, t, sd, R = Math.random) => {
  const anySolo = TS.ORDER.some(id => s.tracks[id].solo);
  const tt = t + TS.swingOffset(s, abs, sd);
  for (const id of TS.ORDER) {
    const tr = s.tracks[id];
    if (tr.mute || (anySolo && !tr.solo)) continue;
    const len = tr.len || 16, steps = pat[id], i = abs % len, val = steps[i];
    if (!val) continue;
    if (tr.mix.chance < 1 && R() > tr.mix.chance) continue;
    let ev;
    if (TS.MELODIC.has(id)) {
      const prev = steps[(i - 1 + len) % len], next = steps[(i + 1) % len];
      ev = { d: val.d, a: val.a, s: val.s, prev, next, midi: TS.degMidi(s, id, val.d), prevMidi: prev ? TS.degMidi(s, id, prev.d) : null };
    } else ev = { v: val };
    try { TS.VOICES[id].play(E, tt, ev, tr.p, E.ch[id].in, sd); } catch (err) { console.error(id, err); }
  }
};

/* Section effects over a whole chain entry (dur seconds starting at t).
   build: highpass sweeps up exponentially and a noise riser plays.
   break: lowpass dips to ~1.2 kHz for the bars, then opens again. */
TS.entryFx = (E, s, fx, t, dur, bar) => {
  if (!fx) return;
  const base = TS.filterFreqs(s.fx.filter);
  E.autoUntil = t + dur;
  if (fx === 'build') {
    E.hp.frequency.cancelScheduledValues(t);
    E.hp.frequency.setValueAtTime(Math.max(20, base.hp), t);
    E.hp.frequency.exponentialRampToValueAtTime(900, t + dur);
    E.hp.frequency.setValueAtTime(base.hp, t + dur);
    TS.riser(E, t, dur);
  } else if (fx === 'break') {
    E.lp.frequency.cancelScheduledValues(t);
    E.lp.frequency.setValueAtTime(base.lp, t);
    E.lp.frequency.exponentialRampToValueAtTime(1200, t + Math.min(bar, dur / 2));
    E.lp.frequency.setValueAtTime(1200, t + dur - Math.min(bar, dur / 2));
    E.lp.frequency.exponentialRampToValueAtTime(base.lp, t + dur);
  }
};

/* ---------------- live playback ---------------- */
TS.Seq = {
  playing: false, abs: 0, nextT: 0, queue: [], timer: null,
  pat: 0, entry: 0, rep: -1, startEntry: 0,

  start(E, s) {
    this.E = E; this.s = s;
    this.abs = 0; this.queue = []; this.rep = -1;
    this.pat = s.cur; this.entry = this.startEntry = Math.min(this.startEntry, s.chain.length - 1);
    this.nextT = E.ac.currentTime + 0.08;
    this.playing = true;
    this.tick();
  },
  stop() {
    clearTimeout(this.timer); this.playing = false; this.queue = [];
    const E = this.E; if (!E) return;
    for (const id of TS.ORDER) if (TS.VOICES[id].stop) TS.VOICES[id].stop(E);
    E.autoUntil = 0; TS.setFilter(E, this.s.fx.filter, E.ac.currentTime);
    E.hp.frequency.cancelScheduledValues(E.ac.currentTime); E.lp.frequency.cancelScheduledValues(E.ac.currentTime);
    TS.setFilter(E, this.s.fx.filter, E.ac.currentTime);
  },
  bar(t, sd) {
    const s = this.s;
    if (s.mode === 'song' && s.chain.length) {
      if (this.rep < 0) { this.entry = this.startEntry; this.rep = 0; }
      else if (++this.rep >= s.chain[this.entry].r) { this.entry = (this.entry + 1) % s.chain.length; this.rep = 0; }
      const en = s.chain[this.entry];
      this.pat = en.p;
      if (this.rep === 0) TS.entryFx(this.E, s, en.fx, t, en.r * 16 * sd, 16 * sd);
    } else {
      this.pat = s.cur; this.rep = 0;
    }
  },
  tick() {
    const E = this.E, s = this.s, sd = 60 / s.bpm / 4;
    while (this.nextT < E.ac.currentTime + 0.12) {
      if (this.abs % 16 === 0) this.bar(this.nextT, sd);
      TS.playStep(E, s, s.pats[this.pat], this.abs, this.nextT, sd);
      this.queue.push({ abs: this.abs, t: this.nextT, pat: this.pat, entry: this.entry, rep: this.rep });
      this.nextT += sd; this.abs++;
    }
    this.timer = setTimeout(() => this.tick(), 25);
  },
  /* What is sounding right now (for the playhead). */
  now() {
    if (!this.playing) return null;
    const t = this.E.ac.currentTime, q = this.queue;
    while (q.length > 1 && q[1].t <= t) q.shift();
    return q.length && q[0].t <= t ? q[0] : null;
  }
};

/* ---------------- offline render to WAV ---------------- */
TS.render = async (s, what, bars = 4) => {
  const sd = 60 / s.bpm / 4, sr = 44100;
  const entries = what === 'song' ? s.chain.map(e => ({ ...e })) : [{ p: s.cur, r: bars, fx: '' }];
  const total = entries.reduce((a, e) => a + e.r, 0) * 16 * sd + 3;
  const oac = new OfflineAudioContext(2, Math.ceil(sr * total), sr);
  const E = TS.createEngine(oac, s);
  let abs = 0, t = 0.02;
  const R = TS.rng(s.seed || 1);
  for (const en of entries) {
    TS.entryFx(E, s, en.fx, t, en.r * 16 * sd, 16 * sd);
    for (let r = 0; r < en.r; r++) for (let k = 0; k < 16; k++) { TS.playStep(E, s, s.pats[en.p], abs, t, sd, R); abs++; t += sd; }
  }
  if (E.acid) E.acid.vca.gain.setTargetAtTime(0, t, 0.01);
  return TS.wav(await oac.startRendering());
};

/* 16-bit PCM WAV: 44-byte RIFF header then interleaved little-endian samples. */
TS.wav = buf => {
  const ch = buf.numberOfChannels, n = buf.length, bytes = n * ch * 2, v = new DataView(new ArrayBuffer(44 + bytes));
  const w = (o, str) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + bytes, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true); v.setUint32(24, buf.sampleRate, true);
  v.setUint32(28, buf.sampleRate * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, bytes, true);
  const data = []; for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const x = Math.max(-1, Math.min(1, data[c][i])); v.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true); o += 2; }
  return new Blob([v], { type: 'audio/wav' });
};
