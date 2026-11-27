/* Voices. Every sound is built from oscillators, noise and filters.
   Each voice: { name, group, desc, params, formula(p), play(E, t, ev, p, out, sd) }
     ev  drums:   { v: 1 normal | 2 accent }
         melodic: { d: scale degree, a: accent, s: slide, prev, next, midi, chord }
     sd  length of one 16th step in seconds
   Param rows: [key, label, min, max, default, unit, plain-English help, options?] */
'use strict';
var TS = window.TS = window.TS || {};

TS.ORDER = ['kick', 'snare', 'clap', 'rim', 'chat', 'ohat', 'ride', 'tom', 'cow', 'shaker', 'bass', 'acid', 'stab', 'pad', 'pluck', 'hoover'];
TS.MELODIC = new Set(['bass', 'acid', 'stab', 'pad', 'pluck', 'hoover']);

/* JP-8000 supersaw, from Adam Szabo's 2010 analysis of the hardware:
   six side saws at these relative offsets, detune amount through an 11th
   order polynomial fitted to the knob, and level curves for centre/sides. */
TS.SS_OFF = [-0.11002313, -0.06288439, -0.01952356, 0.01991221, 0.06216538, 0.10745242];
TS.ssDetune = x => 10028.7312891634 * x ** 11 - 50818.8652045924 * x ** 10 + 111363.4808729368 * x ** 9 - 138150.6761080548 * x ** 8 + 106649.6679158292 * x ** 7 - 53046.9642751875 * x ** 6 + 17019.951858008 * x ** 5 - 3425.0836591318 * x ** 4 + 404.2703938388 * x ** 3 - 24.1878824391 * x ** 2 + 0.6717417634 * x + 0.0030115596;
TS.ssCenter = m => -0.55366 * m + 0.99785;
TS.ssSide = m => -0.73764 * m * m + 1.2841 * m + 0.044372;

/* TR-808 metal: six square oscillators at these (non-harmonic) frequencies,
   summed and band-passed, give the hat and cymbal sound. */
TS.METAL = [205.3, 304.4, 369.6, 522.7, 540, 800];

TS.CHORDS = [
  ['minor', [0, 3, 7]],
  ['minor 7', [0, 3, 7, 10]],
  ['minor 9', [0, 3, 7, 10, 14]],
  ['minor 11', [0, 3, 7, 10, 14, 17]],
  ['dub (m7 no 5)', [0, 3, 10, 15]],
  ['sus 2', [0, 2, 7]],
  ['sus 4', [0, 5, 7]],
  ['power 5th', [0, 7, 12]],
  ['octave', [0, 12]],
  ['major 7', [0, 4, 7, 11]],
  ['dim', [0, 3, 6]]
];

const fmt = TS.fmt = v => { const a = Math.abs(v); return a >= 100 ? Math.round(v) + '' : a >= 10 ? v.toFixed(1) : v.toFixed(2); };
const fr = (a, b) => `<span class="fr"><span>${a}</span><span>${b}</span></span>`;
const e = (x) => `<i>e</i><sup>${x}</sup>`;

function vel(ev) { return ev.v === 2 || ev.a ? 1 : 0.72; }

TS.VOICES = {
  /* ------------------------------------------------------------ drums */
  kick: {
    name: 'Kick', group: 'drums', desc: 'The bass drum. A sine wave that starts high and drops fast to its pitch: the drop is the punch, the tail is the body. Drive adds grit, rumble adds the dark reverb tail of Berlin techno.',
    params: [
      ['tune', 'pitch', 30, 90, 50, 'Hz', 'Where the tail settles. 45 to 55 Hz is typical.'],
      ['punch', 'punch', 1.5, 12, 6, '×', 'How far above the pitch the hit starts.'],
      ['sweep', 'sweep', 0.005, 0.12, 0.028, 's', 'How long the pitch drop takes. Short is clicky, long is boomy (808).'],
      ['decay', 'decay', 0.08, 1.5, 0.38, 's', 'Length of the body.'],
      ['drive', 'drive', 1, 12, 2.5, '', 'Soft clipping. Adds harmonics so the kick cuts through on small speakers.'],
      ['click', 'click', 0, 1, 0.35, '', 'Noise transient at the start.'],
      ['rumble', 'rumble', 0, 1, 0, '', 'Sends the kick through reverb, a lowpass and distortion for a rolling sub tail.']
    ],
    formula: p => `<i>y</i> = tanh(${fmt(p.drive)} sin 2π∫<i>f</i>d<i>t</i>) · ${e(`−5<i>t</i>/${fmt(p.decay)}`)} ,&ensp;<i>f</i>(<i>t</i>) = ${fmt(p.tune)} · ${fmt(p.punch)}<sup>max(0, 1 − <i>t</i>/${fmt(p.sweep)})</sup>`,
    play(E, t, ev, p, out) {
      const ac = E.ac, v = vel(ev), o = E.osc('sine', p.tune * p.punch), g = E.G(0), sh = E.shaper(p.drive), lv = E.G(v);
      o.frequency.setValueAtTime(p.tune * p.punch, t);
      o.frequency.exponentialRampToValueAtTime(p.tune, t + p.sweep);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.0015);
      g.gain.setTargetAtTime(0, t + 0.012, p.decay / 5);
      E.chain(o, g, sh, lv, out);
      o.start(t); o.stop(t + p.decay * 1.4 + 0.1);
      if (p.click > 0) {
        const n = E.noise(t, 0.02), cg = E.G(0);
        cg.gain.setValueAtTime(p.click * 0.5, t); cg.gain.exponentialRampToValueAtTime(0.001, t + 0.01);
        E.chain(n, E.F('bandpass', 3500, 0.8), cg, lv);
      }
      if (p.rumble > 0) { lv.connect(E.rumIn); E.rumOut.gain.setValueAtTime(p.rumble * 2.2, t); }
      else E.rumOut.gain.setValueAtTime(0, t + 0.6);
      E.pump(t);
    }
  },
  snare: {
    name: 'Snare', group: 'drums', desc: '909 style snare: two triangle oscillators (about 185 and 330 Hz) for the drum shell, plus noise for the wires. Snappy sets how much bright wire noise you get.',
    params: [
      ['tone', 'tone', 120, 340, 185, 'Hz', 'Pitch of the shell. The second partial sits at 1.78× this.'],
      ['snappy', 'snappy', 0, 1, 0.65, '', 'Bright high-passed noise (the wires).'],
      ['decay', 'decay', 0.05, 0.6, 0.2, 's', 'Length of the noise.'],
      ['body', 'body', 0.02, 0.3, 0.1, 's', 'Length of the shell tone.']
    ],
    formula: p => `<i>y</i> = tri(${fmt(p.tone)}(1 + 0.6${e('−<i>t</i>/0.012')})<i>t</i>)${e(`−5<i>t</i>/${fmt(p.body)}`)} + 0.6 tri(${fmt(p.tone * 1.78)}<i>t</i>)${e(`−5<i>t</i>/${fmt(p.body * 0.75)}`)} + lp<sub>7k</sub>(noise)${e('−<i>t</i>/0.05')} + ${fmt(p.snappy)} hp<sub>2k</sub>(noise)${e(`−5<i>t</i>/${fmt(p.decay)}`)}`,
    play(E, t, ev, p, out) {
      const v = vel(ev), lv = E.G(v); lv.connect(out);
      const o1 = E.osc('triangle', p.tone * 1.6), g1 = E.G(0);
      o1.frequency.setValueAtTime(p.tone * 1.6, t); o1.frequency.setTargetAtTime(p.tone, t, 0.012);
      E.perc(g1.gain, t, 0.5, 0.001, p.body); E.chain(o1, g1, lv); o1.start(t); o1.stop(t + p.body + 0.1);
      const o2 = E.osc('triangle', p.tone * 1.78), g2 = E.G(0);
      E.perc(g2.gain, t, 0.3, 0.001, p.body * 0.75); E.chain(o2, g2, lv); o2.start(t); o2.stop(t + p.body + 0.1);
      const n = E.noise(t, Math.max(p.decay, 0.25) + 0.1), na = E.G(0), nb = E.G(0);
      E.perc(na.gain, t, 0.35, 0.001, 0.25);
      E.perc(nb.gain, t, p.snappy * 0.8, 0.001, p.decay);
      E.chain(n, E.F('lowpass', 7000, 0.7), na, lv);
      E.chain(n, E.F('highpass', 2000, 0.7), nb, lv);
    }
  },
  clap: {
    name: 'Clap', group: 'drums', desc: 'Several hands that do not quite hit together: four quick noise bursts about 11 ms apart, then a longer tail, through a bandpass around 1.1 kHz (the 909 circuit).',
    params: [
      ['tone', 'tone', 600, 3000, 1100, 'Hz', 'Centre of the bandpass.'],
      ['spread', 'spread', 0.004, 0.025, 0.011, 's', 'Gap between the bursts.'],
      ['decay', 'decay', 0.05, 0.8, 0.22, 's', 'Length of the tail.'],
      ['snap', 'snap', 0, 1, 0.3, '', 'Extra bright band at 2.4 kHz.']
    ],
    formula: p => `<i>y</i> = bp<sub>${fmt(p.tone)}, <i>Q</i>=2</sub>(noise) · [ Σ<sub><i>k</i>=0..3</sub> (1 − (<i>t</i>−${fmt(p.spread)}<i>k</i>)/0.009)<sub>+</sub> + 0.75${e(`−5(<i>t</i>−${fmt(p.spread * 3)})/${fmt(p.decay)}`)} ]`,
    play(E, t, ev, p, out) {
      const v = vel(ev), n = E.noise(t, p.spread * 3 + p.decay + 0.1), g = E.G(0), lv = E.G(v * 1.2);
      g.gain.setValueAtTime(0, t);
      for (let k = 0; k < 4; k++) { const tk = t + k * p.spread; g.gain.setValueAtTime(k < 3 ? 1 : 0.8, tk); g.gain.linearRampToValueAtTime(0.05, tk + Math.min(0.009, p.spread * 0.9)); }
      const tt = t + p.spread * 3 + 0.001; g.gain.setValueAtTime(0.75, tt); g.gain.setTargetAtTime(0, tt, p.decay / 5);
      const mix = E.G(1);
      E.chain(n, E.F('highpass', 500, 0.7), mix);
      E.chain(mix, E.F('bandpass', p.tone, 2), g);
      if (p.snap > 0) { const sg = E.G(p.snap * 0.5); E.chain(mix, E.F('bandpass', 2400, 2), sg, g); }
      E.chain(g, lv, out);
    }
  },
  rim: {
    name: 'Rim', group: 'drums', desc: '808 rimshot: two short resonant pings (480 Hz and 1.75 kHz) overdriven together. Very short, good for syncopated grooves.',
    params: [
      ['tone', 'tone', 0.6, 1.6, 1, '×', 'Shifts both pings.'],
      ['decay', 'decay', 0.01, 0.12, 0.03, 's', 'Length.']
    ],
    formula: p => `<i>y</i> = tanh(3[sin(2π·${Math.round(480 * p.tone)}<i>t</i>) + sin(2π·${Math.round(1750 * p.tone)}<i>t</i>)]) · ${e(`−5<i>t</i>/${fmt(p.decay)}`)}`,
    play(E, t, ev, p, out) {
      const v = vel(ev), g = E.G(0), sh = E.shaper(3), lv = E.G(v * 0.6);
      for (const f of [480, 1750]) { const o = E.osc('sine', f * p.tone); o.connect(g); o.start(t); o.stop(t + p.decay + 0.05); }
      E.perc(g.gain, t, 0.8, 0.0005, p.decay);
      E.chain(g, sh, E.F('highpass', 300, 0.7), lv, out);
    }
  },
  chat: {
    name: 'Closed hat', group: 'drums', desc: 'Six square waves at clashing frequencies (the 808 metal recipe) plus noise, band-passed high. Short. It also cuts off the open hat, like on a real kit.',
    params: [
      ['tone', 'tone', 5000, 13000, 8500, 'Hz', 'Brightness.'],
      ['decay', 'decay', 0.015, 0.2, 0.045, 's', 'Length.'],
      ['pitch', 'metal', 0.5, 2, 1, '×', 'Shifts the six squares. Changes the metallic colour.'],
      ['noise', 'noise', 0, 1, 0.35, '', 'More noise is softer and hissier, less is more metallic.']
    ],
    formula: p => `<i>y</i> = hp( bp<sub>${fmt(p.tone * 0.835)}</sub>(<i>m</i>) + 0.25 bp<sub>3440</sub>(<i>m</i>) ) · ${e(`−5<i>t</i>/${fmt(p.decay)}`)} ,&ensp;<i>m</i> = Σ<sub><i>k</i>=1..6</sub> sq(${fmt(p.pitch)}<i>f<sub>k</sub> t</i>) + ${fmt(p.noise)} noise ,&ensp;<i>f</i> = 205.3, 304.4, 369.6, 522.7, 540, 800 Hz`,
    play(E, t, ev, p, out) { TS.metal(E, t, ev, p, out, 'closed'); }
  },
  ohat: {
    name: 'Open hat', group: 'drums', desc: 'The same metal as the closed hat with a long ring. On the off-beat (between kicks) it is the classic techno pulse.',
    params: [
      ['tone', 'tone', 5000, 13000, 8000, 'Hz', 'Brightness.'],
      ['decay', 'decay', 0.08, 1.2, 0.3, 's', 'Length of the ring.'],
      ['pitch', 'metal', 0.5, 2, 1, '×', 'Shifts the six squares.'],
      ['noise', 'noise', 0, 1, 0.3, '', 'Noise against metal.']
    ],
    formula: p => TS.VOICES.chat.formula(p),
    play(E, t, ev, p, out) { TS.metal(E, t, ev, p, out, 'open'); }
  },
  ride: {
    name: 'Ride', group: 'drums', desc: 'A long shimmering cymbal: the metal oscillators pitched up with a bell partial. Used on the off-beat 8ths or every 16th in driving techno.',
    params: [
      ['tone', 'tone', 2500, 10000, 5500, 'Hz', 'Bandpass centre.'],
      ['decay', 'decay', 0.2, 2.5, 0.9, 's', 'Length.'],
      ['pitch', 'metal', 0.8, 2.5, 1.5, '×', 'Shifts the squares.'],
      ['bell', 'bell', 0, 1, 0.35, '', 'Adds a pure ping on top.']
    ],
    formula: p => `<i>y</i> = bp<sub>${fmt(p.tone)}</sub>(Σ sq(${fmt(p.pitch)}<i>f<sub>k</sub>t</i>)) ${e(`−5<i>t</i>/${fmt(p.decay)}`)} + ${fmt(p.bell)} sin(2π·${fmt(p.tone * 0.62)}<i>t</i>)${e(`−5<i>t</i>/${fmt(p.decay * 0.4)}`)}`,
    play(E, t, ev, p, out) {
      const v = vel(ev), bus = E.G(1), g = E.G(0), lv = E.G(v * 0.5), dur = p.decay + 0.1;
      TS.metalSrc(E, t, dur, p.pitch, 0.16, bus);
      E.perc(g.gain, t, 1, 0.001, p.decay);
      E.chain(bus, E.F('bandpass', p.tone, 1.2), E.F('highpass', 2500, 0.7), g, lv, out);
      if (p.bell > 0) { const b = E.osc('sine', p.tone * 0.62), bg = E.G(0); E.perc(bg.gain, t, p.bell * 0.25, 0.001, p.decay * 0.4); E.chain(b, bg, lv); b.start(t); b.stop(t + dur); }
    }
  },
  tom: {
    name: 'Tom / conga', group: 'drums', desc: 'A sine with a pitch bend down. Low is a tom, high and short is a conga. Good for tribal and hypnotic grooves.',
    params: [
      ['tune', 'pitch', 60, 520, 150, 'Hz', 'Pitch.'],
      ['bend', 'bend', 1, 3, 1.5, '×', 'How far above pitch it starts.'],
      ['decay', 'decay', 0.05, 0.9, 0.28, 's', 'Length.'],
      ['noise', 'noise', 0, 0.6, 0.08, '', 'Skin noise.']
    ],
    formula: p => `<i>y</i> = sin 2π∫${fmt(p.tune)}(1 + ${fmt(p.bend - 1)}${e('−<i>t</i>/0.03')})d<i>t</i> · ${e(`−5<i>t</i>/${fmt(p.decay)}`)}`,
    play(E, t, ev, p, out) {
      const v = vel(ev), o = E.osc('sine', p.tune * p.bend), g = E.G(0), lv = E.G(v * 0.9);
      o.frequency.setValueAtTime(p.tune * p.bend, t); o.frequency.setTargetAtTime(p.tune, t, 0.03);
      E.perc(g.gain, t, 1, 0.001, p.decay);
      E.chain(o, g, E.shaper(1.5), lv, out); o.start(t); o.stop(t + p.decay + 0.1);
      if (p.noise > 0) { const n = E.noise(t, 0.05), ng = E.G(0); E.perc(ng.gain, t, p.noise, 0.001, 0.03); E.chain(n, E.F('bandpass', p.tune * 4, 1), ng, lv); }
    }
  },
  cow: {
    name: 'Cowbell', group: 'drums', desc: '808 cowbell: two square waves at 540 and 800 Hz (the same oscillators as the hats), band-passed at 2.64 kHz. A fast 15 ms drop then a quieter tail. Use sparingly.',
    params: [
      ['tune', 'pitch', 0.6, 1.6, 1, '×', 'Shifts both squares.'],
      ['decay', 'decay', 0.05, 0.8, 0.4, 's', 'Tail length.'],
      ['tone', 'tone', 800, 4000, 2640, 'Hz', 'Bandpass centre.']
    ],
    formula: p => `<i>y</i> = bp<sub>${fmt(p.tone)}</sub>(sq(${Math.round(540 * p.tune)}<i>t</i>) + sq(${Math.round(800 * p.tune)}<i>t</i>)) · (0.75${e('−5<i>t</i>/0.015')} + 0.25${e(`−5<i>t</i>/${fmt(p.decay)}`)})`,
    play(E, t, ev, p, out) {
      const v = vel(ev), bus = E.G(1), g1 = E.G(0), g2 = E.G(0), lv = E.G(v * 0.4);
      for (const f of [540, 800]) { const o = E.osc('square', f * p.tune); o.connect(bus); o.start(t); o.stop(t + p.decay + 0.1); }
      E.perc(g1.gain, t, 0.75, 0.0005, 0.015); E.perc(g2.gain, t, 0.25, 0.0005, p.decay);
      const bp = E.F('bandpass', p.tone, 1); bus.connect(bp); bp.connect(g1); bp.connect(g2);
      g1.connect(lv); g2.connect(lv); lv.connect(out);
    }
  },
  shaker: {
    name: 'Shaker', group: 'drums', desc: 'Band-passed noise with a soft attack. Fills the 16ths between hats and adds swing.',
    params: [
      ['tone', 'tone', 3000, 12000, 7000, 'Hz', 'Bandpass centre.'],
      ['attack', 'attack', 0.002, 0.04, 0.012, 's', 'Softness of the start.'],
      ['decay', 'decay', 0.02, 0.25, 0.07, 's', 'Length.']
    ],
    formula: p => `<i>y</i> = bp<sub>${fmt(p.tone)}</sub>(noise) · min(<i>t</i>/${fmt(p.attack)}, 1) · ${e(`−5<i>t</i>/${fmt(p.decay)}`)}`,
    play(E, t, ev, p, out) {
      const v = vel(ev), n = E.noise(t, p.attack + p.decay + 0.05), g = E.G(0);
      E.perc(g.gain, t, v * 0.5, p.attack, p.decay);
      E.chain(n, E.F('bandpass', p.tone, 1.4), E.F('highpass', 2500, 0.7), g, out);
    }
  },

  /* ------------------------------------------------------------ melodic */
  bass: {
    name: 'Bass', group: 'synth', desc: 'The low line under the kick. Pick a waveform: sub (pure sine), saw, square, reese (two detuned saws, slowly phasing) or FM (metallic growl).',
    params: [
      ['wave', 'type', 0, 4, 1, '', 'Waveform.', ['sub', 'saw', 'square', 'reese', 'FM']],
      ['oct', 'octave', 0, 3, 1, '', 'Register. 1 is the usual techno bass range.', ['0', '1', '2', '3']],
      ['cut', 'cutoff', 60, 3000, 320, 'Hz', 'Lowpass filter. Lower is darker.'],
      ['res', 'resonance', 0.5, 15, 3, '', 'Filter peak.'],
      ['env', 'env mod', 0, 4000, 900, 'Hz', 'How far the filter opens on each note.'],
      ['decay', 'decay', 0.04, 1.2, 0.18, 's', 'Note length.'],
      ['detune', 'detune', 0, 40, 14, 'ct', 'Reese only: cents between the two saws.'],
      ['sub', 'sub', 0, 1, 0.3, '', 'Pure sine an octave down, under everything.']
    ],
    formula: p => `<i>y</i> = lp<sub><i>c</i>(<i>t</i>)</sub>(${['sin', 'saw', 'sq', 'saw<sub>−' + fmt(p.detune) + 'ct</sub> + saw<sub>+' + fmt(p.detune) + 'ct</sub>', 'sin(2π<i>ft</i> + 2 sin 2π·2<i>ft</i>)'][p.wave | 0]}(<i>f</i>)) ${e(`−5<i>t</i>/${fmt(p.decay)}`)} + ${fmt(p.sub)} sin(π<i>ft</i>) ,&ensp;<i>c</i> = ${fmt(p.cut)} + ${fmt(p.env)}${e(`−<i>t</i>/${fmt(p.decay * 0.4)}`)} ,&ensp;<i>f</i> = 440 · 2${'<sup>(<i>n</i>−69)/12</sup>'}`,
    play(E, t, ev, p, out, sd) {
      const ac = E.ac, f = TS.mtof(ev.midi), v = vel(ev), w = p.wave | 0, dur = p.decay * 1.6 + 0.05;
      const fl = E.F('lowpass', p.cut, p.res), g = E.G(0), lv = E.G(v * 0.7);
      const pf = ev.prev && ev.prev.s && ev.prevMidi != null ? TS.mtof(ev.prevMidi) : null;
      const osc = (type, mult, det) => {
        const o = E.osc(type, f * mult); if (det) o.detune.value = det;
        if (pf) { o.frequency.setValueAtTime(pf * mult, t); o.frequency.exponentialRampToValueAtTime(f * mult, t + 0.06); }
        o.start(t); o.stop(t + dur); return o;
      };
      if (w === 3) { const m = E.G(0.5); osc('sawtooth', 1, -p.detune).connect(m); osc('sawtooth', 1, p.detune).connect(m); m.connect(fl); }
      else if (w === 4) {
        const c = osc('sine', 1), m = osc('sine', 2), mg = E.G(0);
        mg.gain.setValueAtTime(f * 3 * v, t); mg.gain.setTargetAtTime(f * 0.5, t, p.decay / 3);
        m.connect(mg); mg.connect(c.frequency); c.connect(fl);
      } else osc(['sine', 'sawtooth', 'square'][w], 1).connect(fl);
      const peak = Math.min(16000, p.cut + p.env * (ev.a ? 1.5 : 1));
      fl.frequency.setValueAtTime(peak, t); fl.frequency.setTargetAtTime(p.cut, t, p.decay * 0.4 / 3 + 0.005);
      E.perc(g.gain, t, 1, 0.003, p.decay);
      E.chain(fl, g, lv, out);
      if (p.sub > 0) { const s = osc('sine', 0.5), sg = E.G(0); E.perc(sg.gain, t, p.sub, 0.003, p.decay); E.chain(s, sg, lv); }
    }
  },
  acid: {
    name: 'Acid 303', group: 'synth', desc: 'A TB-303 style line: one saw or square wave into a squelchy resonant filter. Accent makes a note louder and sharper; slide glides into the next note without restarting it.',
    params: [
      ['wave', 'wave', 0, 1, 0, '', 'Saw is buzzier, square is hollower.', ['saw', 'square']],
      ['oct', 'octave', 0, 3, 2, '', 'Register.', ['0', '1', '2', '3']],
      ['cut', 'cutoff', 80, 3000, 360, 'Hz', 'Base filter cutoff. Turn this slowly while it plays.'],
      ['res', 'resonance', 0.5, 25, 13, '', 'The squelch.'],
      ['env', 'env mod', 0, 6000, 2400, 'Hz', 'How far the filter opens on each note.'],
      ['decay', 'decay', 0.05, 1, 0.22, 's', 'How fast the filter closes.'],
      ['accent', 'accent', 0, 1, 0.6, '', 'Strength of accented notes.'],
      ['dist', 'distortion', 1, 10, 2.5, '', 'Overdrive after the filter.']
    ],
    formula: p => `<i>y</i> = tanh(${fmt(p.dist)} · lp<sup>4</sup><sub><i>c</i>(<i>t</i>), <i>Q</i>=${fmt(p.res)}</sub>(${p.wave ? 'sq' : 'saw'}(<i>f</i>))) ,&ensp;<i>c</i>(<i>t</i>) = ${fmt(p.cut)} + ${fmt(p.env)}(1 + ${fmt(p.accent)}<i>a</i>)${e('−3<i>t</i>/<i>d</i>')} ,&ensp;<i>d</i> = ${fmt(p.decay)} (0.2 on accents) ,&ensp;slide: 60 ms glide (τ = 20 ms)`,
    play(E, t, ev, p, out, sd) {
      const ac = E.ac;
      if (!E.acid) {
        const A = E.acid = { o: E.osc('sawtooth', 110), f1: E.F('lowpass', 400, 10), f2: E.F('lowpass', 400, 0.7), vca: E.G(0), sh: E.shaper(2.5), lv: E.G(0.45), acc: 0 };
        E.chain(A.o, E.G(0.7), A.f1, A.f2, E.F('highpass', 40, 0.7), A.sh, A.vca, A.lv, out); A.o.start();
      }
      const A = E.acid, f = TS.mtof(ev.midi), tied = ev.prev && ev.prev.s;
      A.o.type = p.wave ? 'square' : 'sawtooth';
      A.sh.curve = TS.curve(p.dist); A.f1.Q.setValueAtTime(p.res, t);
      A.o.frequency.cancelScheduledValues(t);
      if (tied) A.o.frequency.setTargetAtTime(f, t, 0.02);
      else {
        A.o.frequency.setValueAtTime(f, t);
        /* Accent: on a real 303 the filter envelope decay is forced to 200 ms and
           a 1 µF capacitor (τ ≈ 0.15 s) smooths the accent voltage, so
           back-to-back accents stack and the filter climbs higher each time. */
        A.acc = ev.a ? Math.min(2.2, (ev.prev && ev.prev.a ? A.acc * 0.6 : 0) + 1) : 0;
        const peak = Math.min(16000, p.cut + p.env * (1 + p.accent * A.acc));
        const dec = ev.a ? 0.2 : p.decay;
        for (const n of [A.f1, A.f2]) { n.frequency.cancelScheduledValues(t); n.frequency.setValueAtTime(peak, t); n.frequency.setTargetAtTime(p.cut, t, dec / 3); }
        A.vca.gain.cancelScheduledValues(t); A.vca.gain.setTargetAtTime(ev.a ? 0.6 + 0.4 * p.accent : 0.6, t, 0.002);
      }
      if (!(ev.s && ev.next)) A.vca.gain.setTargetAtTime(0, t + sd * 0.55, 0.01);
    },
    stop(E) { if (E.acid) { const t = E.ac.currentTime; E.acid.vca.gain.cancelScheduledValues(t); E.acid.vca.gain.setTargetAtTime(0, t, 0.01); } }
  },
  stab: {
    name: 'Chord stab', group: 'synth', desc: 'A short chord. Filtered and soaked in delay it is dub techno; bright and short it is Detroit. The same chord shape moves with each note (parallel chords).',
    params: [
      ['chord', 'chord', 0, TS.CHORDS.length - 1, 4, '', 'Chord shape.', TS.CHORDS.map(c => c[0])],
      ['oct', 'octave', 1, 4, 3, '', 'Register.', ['1', '2', '3', '4']],
      ['cut', 'cutoff', 150, 8000, 900, 'Hz', 'Lowpass. Dub techno lives around 500 to 1200 Hz.'],
      ['res', 'resonance', 0.5, 12, 2, '', 'Filter peak.'],
      ['env', 'env mod', 0, 6000, 1200, 'Hz', 'Filter opening per hit.'],
      ['decay', 'decay', 0.05, 1.5, 0.25, 's', 'Length.'],
      ['detune', 'detune', 0, 30, 9, 'ct', 'Two saws per note, this many cents apart.']
    ],
    formula: p => `<i>y</i> = lp<sub><i>c</i>(<i>t</i>)</sub>( Σ<sub><i>i</i>∈{${TS.CHORDS[p.chord | 0][1].join(', ')}}</sub> saw(<i>f</i>·2<sup><i>i</i>/12</sup> ± ${fmt(p.detune)}ct) ) · ${e(`−5<i>t</i>/${fmt(p.decay)}`)} ,&ensp;<i>c</i> = ${fmt(p.cut)} + ${fmt(p.env)}${e(`−5<i>t</i>/${fmt(p.decay * 0.6)}`)}`,
    play(E, t, ev, p, out) {
      const ch = TS.CHORDS[p.chord | 0][1], v = vel(ev), fl = E.F('lowpass', p.cut, p.res), g = E.G(0), lv = E.G(v * 0.5 / Math.sqrt(ch.length)), dur = p.decay * 1.4 + 0.05;
      for (const i of ch) for (const d of [-p.detune, p.detune]) { const o = E.osc('sawtooth', TS.mtof(ev.midi + i)); o.detune.value = d; o.connect(fl); o.start(t); o.stop(t + dur); }
      fl.frequency.setValueAtTime(Math.min(16000, p.cut + p.env * (ev.a ? 1.5 : 1)), t); fl.frequency.setTargetAtTime(p.cut, t, p.decay * 0.6 / 5);
      E.perc(g.gain, t, 1, 0.002, p.decay);
      E.chain(fl, g, lv, out);
    }
  },
  pad: {
    name: 'Pad', group: 'synth', desc: 'A wide held chord built from the Roland JP-8000 supersaw: seven saws per note, detuned by the curve Adam Szabo measured from the hardware. Slow attack. For breakdowns, Detroit strings, ambient and melodic techno.',
    params: [
      ['chord', 'chord', 0, TS.CHORDS.length - 1, 2, '', 'Chord shape.', TS.CHORDS.map(c => c[0])],
      ['oct', 'octave', 1, 4, 3, '', 'Register.', ['1', '2', '3', '4']],
      ['cut', 'cutoff', 200, 10000, 2400, 'Hz', 'Lowpass.'],
      ['attack', 'attack', 0.005, 3, 0.6, 's', 'Fade in.'],
      ['gate', 'hold', 1, 64, 16, 'steps', 'How many steps each note holds before it fades.'],
      ['release', 'release', 0.05, 4, 1.2, 's', 'Fade out.'],
      ['spread', 'detune', 0, 1, 0.35, '', 'Supersaw detune (Szabo curve). Small values shimmer, large values are huge.'],
      ['mix', 'side saws', 0, 1, 0.6, '', 'Level of the six detuned saws against the centre one.']
    ],
    formula: p => `<i>y</i> = lp<sub>${fmt(p.cut)}</sub> hp<sub><i>f</i></sub>( ${fmt(TS.ssCenter(p.mix))} saw(<i>f</i>) + ${fmt(TS.ssSide(p.mix))} Σ<sub><i>k</i>=1..6</sub> saw(<i>f</i>(1 + ${fmt(TS.ssDetune(p.spread))} <i>o<sub>k</sub></i>)) ) ,&ensp;<i>o</i> = ±0.110, ±0.063, ±0.020 ,&ensp;hold ${p.gate | 0} steps`,
    play(E, t, ev, p, out, sd) {
      const ch = TS.CHORDS[p.chord | 0][1], v = vel(ev), fl = E.F('lowpass', p.cut, 0.8), g = E.G(0), lv = E.G(v * 0.3 / Math.sqrt(ch.length));
      const hold = Math.max(p.attack, (p.gate | 0) * sd), end = t + hold + p.release * 1.2 + 0.05, det = TS.ssDetune(p.spread);
      for (const i of ch) {
        const f = TS.mtof(ev.midi + i), hp = E.F('highpass', f, 0.5), cg = E.G(TS.ssCenter(p.mix)), sg = E.G(TS.ssSide(p.mix) / 2.2);
        const c = E.osc('sawtooth', f); E.chain(c, cg, hp); c.start(t); c.stop(end);
        for (const o of TS.SS_OFF) { const s = E.osc('sawtooth', f * (1 + det * o)); s.connect(sg); s.start(t + Math.random() * 0.004); s.stop(end); }
        sg.connect(hp); hp.connect(fl);
      }
      const lfo = E.osc('sine', 0.15), lg = E.G(p.cut * 0.2); E.chain(lfo, lg, fl.frequency); lfo.start(t); lfo.stop(end);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + p.attack);
      g.gain.setValueAtTime(1, t + hold); g.gain.setTargetAtTime(0, t + hold, p.release / 5);
      E.chain(fl, g, lv, out);
    }
  },
  hoover: {
    name: 'Hoover', group: 'synth', desc: 'The 90s rave hoover (Roland Alpha Juno "What The"): detuned saws an octave apart through a wobbling chorus, sliding up from an octave below on every note. Loud, use it for drops.',
    params: [
      ['oct', 'octave', 1, 4, 2, '', 'Register.', ['1', '2', '3', '4']],
      ['bend', 'swoop', 0, 24, 12, 'st', 'How far below the note it starts (semitones).'],
      ['glide', 'swoop time', 0.02, 0.5, 0.18, 's', 'How long the swoop takes.'],
      ['decay', 'length', 0.1, 2, 0.5, 's', 'Note length.'],
      ['detune', 'detune', 0, 50, 22, 'ct', 'Saw detune.'],
      ['cut', 'cutoff', 500, 12000, 4000, 'Hz', 'Lowpass.']
    ],
    formula: p => `<i>y</i> = chorus( Σ<sub><i>m</i>∈{½, 1, 2}</sub> saw(<i>m f</i>(<i>t</i>) ± ${fmt(p.detune)}ct) ) ${e(`−5<i>t</i>/${fmt(p.decay)}`)} ,&ensp;<i>f</i>(<i>t</i>) = <i>f</i><sub>0</sub> · 2<sup>−${fmt(p.bend)}${e(`−3<i>t</i>/${fmt(p.glide)}`)}/12</sup>`,
    play(E, t, ev, p, out) {
      const f = TS.mtof(ev.midi), v = vel(ev), dur = p.decay * 1.3 + 0.1, bus = E.G(0.22), g = E.G(0), lv = E.G(v * 0.6);
      for (const [m, lvl] of [[0.5, 0.8], [1, 1], [2, 0.45]]) for (const d of [-p.detune, p.detune]) {
        const o = E.osc('sawtooth', f * m); o.detune.setValueAtTime(d - p.bend * 100, t); o.detune.setTargetAtTime(d, t, p.glide / 3);
        const og = E.G(lvl); E.chain(o, og, bus); o.start(t); o.stop(t + dur);
      }
      // chorus: two short delays, each wobbled by its own slow LFO
      const fl = E.F('lowpass', p.cut, 1); bus.connect(fl);
      for (const [base, rate] of [[0.007, 0.6], [0.012, 0.83]]) {
        const d = E.ac.createDelay(0.05), lfo = E.osc('sine', rate), lg = E.G(0.003); d.delayTime.value = base;
        E.chain(lfo, lg, d.delayTime); lfo.start(t); lfo.stop(t + dur); E.chain(fl, d, g);
      }
      fl.connect(g);
      E.perc(g.gain, t, 1, 0.01, p.decay);
      E.chain(g, E.shaper(1.8), lv, out);
    }
  },
  pluck: {
    name: 'FM pluck', group: 'synth', desc: 'Two-operator FM: one sine bends the pitch of another. Integer ratios sound musical, odd ratios like 3.5 sound like bells and metal. For minimal and melodic techno bleeps.',
    params: [
      ['oct', 'octave', 2, 5, 4, '', 'Register.', ['2', '3', '4', '5']],
      ['ratio', 'ratio', 0.5, 8, 2, '', 'Modulator frequency ÷ carrier frequency.'],
      ['index', 'index', 0, 12, 4, '', 'Modulation depth. More is brighter.'],
      ['decay', 'decay', 0.03, 1.2, 0.2, 's', 'Length.'],
      ['bright', 'bright decay', 0.1, 1, 0.4, '', 'How fast the brightness falls compared to the note.']
    ],
    formula: p => `<i>y</i> = sin(2π<i>ft</i> + <i>I</i>(<i>t</i>) sin(2π·${fmt(p.ratio)}<i>ft</i>)) · ${e(`−5<i>t</i>/${fmt(p.decay)}`)} ,&ensp;<i>I</i>(<i>t</i>) = ${fmt(p.index)}${e(`−5<i>t</i>/${fmt(p.decay * p.bright)}`)}`,
    play(E, t, ev, p, out) {
      const f = TS.mtof(ev.midi), v = vel(ev), c = E.osc('sine', f), m = E.osc('sine', f * p.ratio), mg = E.G(0), g = E.G(0), dur = p.decay + 0.1;
      mg.gain.setValueAtTime(0, t); mg.gain.linearRampToValueAtTime(p.index * f * p.ratio, t + 0.001); mg.gain.setTargetAtTime(0, t + 0.001, p.decay * p.bright / 5);
      E.chain(m, mg, c.frequency);
      E.perc(g.gain, t, v * 0.4, 0.001, p.decay);
      E.chain(c, g, out); c.start(t); m.start(t); c.stop(t + dur); m.stop(t + dur);
    }
  }
};

/* Shared hat engine: six squares + noise -> bandpass -> highpass -> envelope.
   A closed hat chokes a ringing open hat. */
/* The six squares are rendered once (band-limited, by the browser's own
   oscillators) into a 1 second loop. Frequencies are rounded to whole Hz so
   the loop is seamless. Each hit then plays one buffer instead of six
   oscillators, at playbackRate = metal pitch. */
TS.metalReady = (async () => {
  try {
    const o = new OfflineAudioContext(1, 44100, 44100);
    for (const f of TS.METAL) { const s = o.createOscillator(), g = o.createGain(); s.type = 'square'; s.frequency.value = Math.round(f); g.gain.value = 0.14; s.connect(g); g.connect(o.destination); s.start(0); }
    TS.metalBuf = await o.startRendering();
  } catch (e) { console.warn('metal buffer unavailable, using oscillators', e); }
})();
TS.metalSrc = (E, t, dur, pitch, gain, dest) => {
  if (TS.metalBuf) {
    const b = E.ac.createBufferSource(), g = E.G(gain / 0.14); b.buffer = TS.metalBuf; b.loop = true; b.playbackRate.value = pitch;
    b.connect(g); g.connect(dest); b.start(t, Math.random()); b.stop(t + dur); return;
  }
  for (const f of TS.METAL) { const o = E.osc('square', f * pitch), og = E.G(gain); E.chain(o, og, dest); o.start(t); o.stop(t + dur); }
};

TS.metal = function (E, t, ev, p, out, kind) {
  /* Werner, Abel & Smith (2014): the six squares feed two bandpass filters at
     about 3.44 kHz and 7.1 kHz, then a high-pass output stage. `tone` moves
     the upper band; the lower band adds body. */
  const v = vel(ev), bus = E.G(1), g = E.G(0), lv = E.G(v * (kind === 'open' ? 0.5 : 0.55)), dur = p.decay + 0.05;
  TS.metalSrc(E, t, dur + 0.3, p.pitch, 0.14 * (1 - p.noise * 0.6), bus);
  if (p.noise > 0) { const n = E.noise(t, dur + 0.3), ng = E.G(p.noise * 0.6); E.chain(n, ng, bus); }
  if (kind === 'closed' && E.openG) { E.openG.gain.cancelScheduledValues(t); E.openG.gain.setTargetAtTime(0, t, 0.004 / 3); E.openG = null; }
  E.perc(g.gain, t, 1, 0.0008, p.decay);
  if (kind === 'open') E.openG = g;
  const hi = E.F('bandpass', p.tone * 0.835, 1.2), lo = E.F('bandpass', 3440, 1.5), loG = E.G(0.25), sum = E.G(1);
  bus.connect(hi); hi.connect(sum); bus.connect(lo); lo.connect(loG); loG.connect(sum);
  E.chain(sum, E.F('highpass', Math.min(p.tone * 0.75, 7500), 0.9), g, lv, out);
};

/* Noise riser for builds: band-passed noise sweeping up, getting louder. */
TS.riser = function (E, t, dur) {
  const n = E.noise(t, dur), bp = E.F('bandpass', 300, 3), g = E.G(0);
  bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(9000, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + dur * 0.97); g.gain.linearRampToValueAtTime(0, t + dur);
  E.chain(n, bp, g, E.sum); const s = E.G(0.5); g.connect(s); s.connect(E.rIn);
};
