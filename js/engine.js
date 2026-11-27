/* Engine: the audio graph and helpers. Works on a live AudioContext or an
   OfflineAudioContext (for WAV export), so every voice receives the engine E
   and never touches a global context.

   Signal flow
     voice -> channel(level, pan) -> [duck bus | dry bus] -> master HPF -> master LPF
           -> drive (tanh) -> glue compressor -> limiter -> out
     channel -> delay send  (ping-pong, tempo synced, filtered feedback) -> duck bus
     channel -> reverb send (noise impulse, exponential decay)            -> duck bus
   The kick pulls the duck bus down (sidechain pump). */
'use strict';
var TS = window.TS = window.TS || {};

/* tanh soft clip, normalised so +-1 in gives +-1 out:  y = tanh(kx) / tanh(k) */
TS.curve = (() => {
  const cache = {};
  return k => {
    k = Math.max(0.25, Math.round(k * 4) / 4);
    if (!cache[k]) {
      const c = new Float32Array(2048);
      for (let i = 0; i < 2048; i++) { const x = i / 1023.5 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
      cache[k] = c;
    }
    return cache[k];
  };
})();

/* Reverb impulse: stereo white noise with an exponential decay.
   h(t) = n(t) * 10^(-3 t / RT60)  (falls 60 dB over RT60 seconds) */
TS.impulse = (ac, rt60, pre = 0.01, damp = 0.5) => {
  const sr = ac.sampleRate, len = Math.max(1, Math.floor(sr * (rt60 + pre))), buf = ac.createBuffer(2, len, sr);
  const p0 = Math.floor(pre * sr);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = p0; i < len; i++) {
      const t = (i - p0) / sr;
      const n = Math.random() * 2 - 1;
      lp += (n - lp) * (1 - damp * Math.min(1, t / rt60)); // tail gets darker over time
      d[i] = lp * Math.pow(10, -3 * t / rt60);
    }
  }
  return buf;
};

TS.mtof = m => 440 * Math.pow(2, (m - 69) / 12);

TS.createEngine = function (ac, state) {
  const E = { ac, ch: {}, state, sr: ac.sampleRate };
  const G = E.G = v => { const g = ac.createGain(); g.gain.value = v; return g; };
  const F = E.F = (type, f, q) => { const n = ac.createBiquadFilter(); n.type = type; n.frequency.value = f; if (q != null) n.Q.value = q; return n; };
  E.chain = (...n) => { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[0]; };
  E.shaper = k => { const s = ac.createWaveShaper(); s.curve = TS.curve(k); s.oversample = '2x'; return s; };
  E.osc = (type, f) => { const o = ac.createOscillator(); o.type = type; o.frequency.value = f; return o; };

  // two seconds of white noise, shared by every noise voice
  E.noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
  { const d = E.noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  E.noise = (t, dur) => { const s = ac.createBufferSource(); s.buffer = E.noiseBuf; s.loop = true; s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05); return s; };

  /* Percussive amplitude envelope: 0 -> peak in `a` s, then exponential fall.
     setTargetAtTime approaches 0 with time constant tau; after 5 tau the level
     is under -43 dB, so decay d maps to tau = d / 5. */
  E.perc = (param, t, peak, a, d) => {
    param.cancelScheduledValues(t);
    param.setValueAtTime(0, t);
    param.linearRampToValueAtTime(peak, t + a);
    param.setTargetAtTime(0, t + a, Math.max(0.001, d / 5));
  };

  /* ---------- master ---------- */
  E.sum = G(1);                      // un-ducked
  E.duck = G(1); E.duck.connect(E.sum); // ducked by kick
  E.hp = F('highpass', 10, 0.9);
  E.lp = F('lowpass', 22000, 0.9);
  E.driveIn = G(1); E.drv = E.shaper(1); E.driveOut = G(1);
  E.comp = ac.createDynamicsCompressor();
  E.comp.threshold.value = -14; E.comp.ratio.value = 3; E.comp.attack.value = 0.01; E.comp.release.value = 0.15; E.comp.knee.value = 6;
  E.lim = ac.createDynamicsCompressor();
  E.lim.threshold.value = -1.5; E.lim.ratio.value = 20; E.lim.attack.value = 0.001; E.lim.release.value = 0.08; E.lim.knee.value = 0;
  E.out = G(0.8);
  E.analyser = ac.createAnalyser(); E.analyser.fftSize = 2048;
  E.chain(E.sum, E.hp, E.lp, E.driveIn, E.drv, E.driveOut, E.comp, E.lim, E.out, ac.destination);
  E.out.connect(E.analyser);

  /* ---------- delay: ping-pong with filtered feedback ---------- */
  E.dIn = G(1);
  E.dL = ac.createDelay(2); E.dR = ac.createDelay(2);
  E.dFb = G(0.4); E.dHP = F('highpass', 250, 0.5); E.dLP = F('lowpass', 4000, 0.5);
  const merge = ac.createChannelMerger(2), dRet = G(0.8);
  E.chain(E.dIn, E.dHP, E.dLP, E.dL);
  E.dL.connect(E.dR); E.dR.connect(E.dFb); E.dFb.connect(E.dHP);
  E.dL.connect(merge, 0, 0); E.dR.connect(merge, 0, 1);
  merge.connect(dRet); dRet.connect(E.duck);

  /* ---------- reverb ---------- */
  E.rIn = G(1); E.rv = ac.createConvolver(); E.rRet = G(0.7);
  E.rv.buffer = TS.impulse(ac, 2.2);
  E.chain(E.rIn, F('highpass', 300, 0.7), E.rv, E.rRet, E.duck);
  E.rvSize = 2.2;

  /* ---------- rumble: kick -> short reverb -> lowpass -> drive -> lowpass ---------- */
  E.rumIn = G(1); E.rumOut = G(0);
  const rc = ac.createConvolver(); rc.buffer = TS.impulse(ac, 0.9, 0.02, 0.2);
  E.chain(E.rumIn, rc, F('lowpass', 120, 0.7), E.shaper(5), F('lowpass', 150, 0.7), E.rumOut, E.duck);

  /* ---------- channels ---------- */
  for (const id of TS.ORDER) {
    const c = { in: G(1), lvl: G(1), pan: ac.createStereoPanner ? ac.createStereoPanner() : G(1), toDuck: G(0), toDry: G(1), dly: G(0), rev: G(0) };
    E.chain(c.in, c.lvl, c.pan);
    c.pan.connect(c.toDuck); c.toDuck.connect(E.duck);
    c.pan.connect(c.toDry); c.toDry.connect(E.sum);
    c.pan.connect(c.dly); c.dly.connect(E.dIn);
    c.pan.connect(c.rev); c.rev.connect(E.rIn);
    E.ch[id] = c;
  }

  /* Sidechain: dip the duck bus to (1 - depth) in 4 ms, recover with
     time constant release/3 (about 95% back after `release` seconds). */
  E.pump = t => {
    const fx = E.state.fx, g = E.duck.gain, depth = fx.duck;
    if (depth <= 0) return;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(1 - depth, t, 0.002);
    g.setTargetAtTime(1, t + 0.02, Math.max(0.01, fx.duckRel / 3));
  };

  E.apply = () => TS.applyState(E);
  E.apply();
  return E;
};

/* Push the state into the graph (mix, fx). Cheap, call on any edit. */
TS.applyState = function (E) {
  const s = E.state, ac = E.ac, now = ac.currentTime, fx = s.fx;
  const anySolo = TS.ORDER.some(id => s.tracks[id].solo);
  for (const id of TS.ORDER) {
    const tr = s.tracks[id], c = E.ch[id], m = tr.mix;
    const audible = !tr.mute && (!anySolo || tr.solo);
    c.lvl.gain.setTargetAtTime(audible ? m.level * m.level : 0, now, 0.01);
    if (c.pan.pan) c.pan.pan.setTargetAtTime(m.pan, now, 0.01);
    c.toDuck.gain.setTargetAtTime(m.duck, now, 0.01);
    c.toDry.gain.setTargetAtTime(1 - m.duck, now, 0.01);
    c.dly.gain.setTargetAtTime(m.dly, now, 0.01);
    c.rev.gain.setTargetAtTime(m.rev, now, 0.01);
  }
  // delay time in 16th notes: 3 = dotted eighth, the classic techno echo
  const sd = 60 / s.bpm / 4, dt = Math.min(1.99, sd * fx.dtime);
  E.dL.delayTime.setTargetAtTime(dt, now, 0.05);
  E.dR.delayTime.setTargetAtTime(dt, now, 0.05);
  E.dFb.gain.setTargetAtTime(fx.dfb, now, 0.01);
  E.dLP.frequency.setTargetAtTime(500 + fx.dtone * fx.dtone * 9000, now, 0.01);
  if (Math.abs(E.rvSize - fx.rsize) > 0.05) { E.rvSize = fx.rsize; E.rv.buffer = TS.impulse(ac, fx.rsize); }
  E.rRet.gain.setTargetAtTime(0.9, now, 0.01);
  // drive: amount 0..1 -> k 1..8, with level compensation
  const k = 1 + fx.drive * 7;
  E.drv.curve = TS.curve(k);
  E.driveIn.gain.setTargetAtTime(1, now, 0.01);
  E.driveOut.gain.setTargetAtTime(1 / (1 + fx.drive * 0.6), now, 0.01);
  E.out.gain.setTargetAtTime(fx.vol, now, 0.01);
  if (!(E.autoUntil > now)) TS.setFilter(E, fx.filter, now); // song builds/breaks own the filter while they run
};

/* One knob DJ filter: -1..0 sweeps a lowpass down, 0..1 sweeps a highpass up.
   Exponential mapping so equal knob moves sound like equal pitch moves:
   lowpass f = 20000 * 2^(-7.5 |x|),  highpass f = 10 * 2^(9.5 x). */
TS.filterFreqs = x => ({
  lp: x < 0 ? 20000 * Math.pow(2, -7.5 * -x) : 22000,
  hp: x > 0 ? 10 * Math.pow(2, 9.5 * x) : 10
});
TS.setFilter = (E, x, t, tau = 0.02) => {
  const f = TS.filterFreqs(x);
  E.lp.frequency.setTargetAtTime(f.lp, t, tau);
  E.hp.frequency.setTargetAtTime(f.hp, t, tau);
  E.lp.Q.setTargetAtTime(x < 0 ? 0.9 + -x * 4 : 0.9, t, tau);
  E.hp.Q.setTargetAtTime(x > 0 ? 0.9 + x * 4 : 0.9, t, tau);
};
