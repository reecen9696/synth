/* UI: grid, panels, song order, files. Plain DOM, no framework. */
'use strict';
var TS = window.TS = window.TS || {};
(() => {
  const $ = id => document.getElementById(id);
  const h = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const k in attrs) {
      const v = attrs[k];
      if (k === 'class') el.className = v; else if (k === 'style') el.style.cssText = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, ''); else if (v !== false && v != null) el.setAttribute(k, v);
    }
    for (const c of kids.flat()) if (c != null) el.append(c.nodeType ? c : document.createTextNode(c));
    return el;
  };
  const LETTERS = 'ABCDEFGH';
  const col = id => `var(--c-${id})`;

  /* ---------------- state, undo, persistence ---------------- */
  let S = TS.state = load() || (() => { const s = TS.defaultState(); TS.makeSong(s, 'berlin', 7); return s; })();
  let sel = 'kick', songSel = 0, clip = null;
  const undo = [], redo = [];
  function snap() { undo.push(JSON.stringify(S)); if (undo.length > 80) undo.shift(); redo.length = 0; }
  function restore(json) { const keepMode = S.mode; S = TS.state = JSON.parse(json); S.mode = keepMode; if (TS.E) TS.E.state = S, TS.Seq.s = S; renderAll(); }
  let saveT;
  function changed(engineToo = true) {
    if (engineToo && TS.E) TS.E.apply();
    clearTimeout(saveT); saveT = setTimeout(() => { try { localStorage.setItem('technosynth', JSON.stringify(S)); } catch (e) { } }, 300);
  }
  function load() {
    try {
      if (location.hash.length > 3) { const s = decodeState(location.hash.slice(1)); history.replaceState(null, '', location.pathname); if (s) return fix(s); }
      const j = localStorage.getItem('technosynth'); if (j) return fix(JSON.parse(j));
    } catch (e) { console.warn('could not load saved state', e); }
    return null;
  }
  /* Fill anything missing (older saves, new tracks added by collaborators). */
  function fix(s) {
    const d = TS.defaultState();
    if (!s || !s.pats || !s.tracks) return null;
    for (const k in d) if (s[k] == null) s[k] = d[k];
    s.fx = Object.assign({}, d.fx, s.fx);
    for (const id of TS.ORDER) {
      const t = s.tracks[id] || d.tracks[id];
      t.p = Object.assign({}, d.tracks[id].p, t.p); t.mix = Object.assign({}, d.tracks[id].mix, t.mix); t.len = t.len || 16;
      s.tracks[id] = t;
    }
    for (let i = 0; i < 8; i++) { const p = s.pats[i] = s.pats[i] || TS.emptyPattern(); for (const id of TS.ORDER) if (!Array.isArray(p[id])) p[id] = TS.emptyPattern()[id]; }
    if (!TS.GENRES[s.genre]) s.genre = 'berlin';
    return s;
  }
  const encodeState = s => btoa(unescape(encodeURIComponent(JSON.stringify(s))));
  const decodeState = str => JSON.parse(decodeURIComponent(escape(atob(str))));

  /* ---------------- audio on demand (browsers need a click first) ---------------- */
  function audio() {
    if (!TS.E) {
      const ac = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
      TS.E = TS.createEngine(ac, S);
    }
    if (TS.E.ac.state !== 'running') TS.E.ac.resume();
    return TS.E;
  }
  function audition(id, val) {
    if (TS.Seq.playing) return;
    const E = audio(), t = E.ac.currentTime + 0.02, tr = S.tracks[id], sd = 60 / S.bpm / 4;
    if (TS.MELODIC.has(id)) {
      const v = val || { d: 0 };
      TS.VOICES[id].play(E, t, { d: v.d, a: v.a, s: false, midi: TS.degMidi(S, id, v.d) }, tr.p, E.ch[id].in, sd);
    } else TS.VOICES[id].play(E, t, { v: val || 1 }, tr.p, E.ch[id].in, sd);
  }

  function toggle() {
    const E = audio();
    if (TS.Seq.playing) TS.Seq.stop();
    else { TS.Seq.startEntry = S.mode === 'song' ? songSel : 0; TS.Seq.start(E, S); }
    $('play').classList.toggle('on', TS.Seq.playing);
    $('play').setAttribute('aria-label', TS.Seq.playing ? 'Stop' : 'Play');
  }

  /* ---------------- header ---------------- */
  function renderHeader() {
    $('bpm').value = S.bpm;
    $('swing').value = S.swing; $('swingv').textContent = S.swing + '%';
    $('key').value = S.key; $('scale').value = S.scale; $('genre').value = S.genre;
    $('blurb').textContent = TS.GENRES[S.genre].blurb;
    for (const b of $('mode').children) b.setAttribute('aria-pressed', b.dataset.m === S.mode);
    $('song').hidden = S.mode !== 'song';
  }
  $('key').append(...TS.NOTES.map((n, i) => h('option', { value: i }, n)));
  $('scale').append(...Object.keys(TS.SCALES).map(n => h('option', { value: n }, n)));
  $('genre').append(...Object.entries(TS.GENRES).map(([k, g]) => h('option', { value: k }, `${g.name}  ·  ${g.bpm}`)));
  $('bpm').onchange = e => { snap(); S.bpm = Math.max(60, Math.min(200, +e.target.value || 130)); renderHeader(); changed(); };
  $('swing').oninput = e => { S.swing = +e.target.value; $('swingv').textContent = S.swing + '%'; changed(false); };
  $('swing').onpointerdown = snap;
  $('key').onchange = e => { snap(); S.key = +e.target.value; changed(false); renderGrid(); renderTrack(); };
  $('scale').onchange = e => { snap(); S.scale = e.target.value; changed(false); renderGrid(); renderTrack(); };
  $('genre').onchange = e => { S.genre = e.target.value; $('blurb').textContent = TS.GENRES[S.genre].blurb; changed(false); };
  $('make').onclick = () => {
    snap(); TS.makeSong(S, $('genre').value, (Math.random() * 1e9) | 0);
    songSel = 0; if (TS.E) { TS.E.apply(); if (TS.E.acid) TS.E.acid.vca.gain.value = 0; }
    renderAll(); changed(); toast(`New ${TS.GENRES[S.genre].name} track`);
  };
  $('sound').onclick = () => { snap(); TS.applyGenreSound(S, $('genre').value); renderAll(); changed(); toast('Sounds loaded'); };
  for (const b of $('mode').children) b.onclick = () => { S.mode = b.dataset.m; renderHeader(); renderSong(); changed(false); };
  $('play').onclick = toggle;

  /* ---------------- pattern bar ---------------- */
  function patEmpty(p) { return TS.ORDER.every(id => p[id].every(x => !x)); }
  function renderPats() {
    $('pats').replaceChildren(...S.pats.map((p, i) => h('button', {
      'aria-pressed': i === S.cur, class: patEmpty(p) ? 'empty' : '', 'data-i': i,
      onclick: () => selectPat(i)
    }, h('b', {}, LETTERS[i]), h('small', {}, p.name || (patEmpty(p) ? 'empty' : '—')))));
  }
  function selectPat(i) { S.cur = i; renderPats(); renderGrid(); renderTrack(); changed(false); }
  $('copy').onclick = () => { clip = JSON.stringify(S.pats[S.cur]); toast(`Copied ${LETTERS[S.cur]}`); };
  $('paste').onclick = () => { if (!clip) return toast('Copy a pattern first'); snap(); S.pats[S.cur] = JSON.parse(clip); renderPats(); renderGrid(); renderTrack(); changed(false); };
  $('clear').onclick = () => { snap(); const n = S.pats[S.cur].name; S.pats[S.cur] = TS.emptyPattern(); S.pats[S.cur].name = n; renderPats(); renderGrid(); renderTrack(); changed(false); };
  $('vary').onclick = () => {
    snap(); const name = S.pats[S.cur].name, sec = TS.SECTIONS.find(x => x.name === name) || TS.SECTIONS[5];
    S.pats[S.cur] = TS.makePattern(S.genre, sec, Math.random); renderPats(); renderGrid(); renderTrack(); changed(false);
  };

  /* ---------------- song order ---------------- */
  function renderSong() {
    if (S.mode !== 'song') return;
    const chips = S.chain.map((en, i) => {
      const reps = h('output', {}, en.r);
      return h('div', { class: 'chip' + (i === songSel ? ' sel' : ''), 'data-i': i },
        h('div', { class: 't', onclick: () => { songSel = i; selectPat(en.p); renderSong(); } },
          h('b', {}, LETTERS[en.p]), h('span', {}, S.pats[en.p].name || '')),
        h('div', { class: 'c' },
          h('button', { title: 'fewer bars', onclick: () => { snap(); en.r = Math.max(1, en.r - (en.r > 4 ? 4 : 1)); renderSong(); changed(false); } }, '−'),
          reps, h('span', { style: 'font-size:11px;color:var(--dim)' }, 'bars'),
          h('button', { title: 'more bars', onclick: () => { snap(); en.r = Math.min(64, en.r + (en.r >= 4 ? 4 : 1)); renderSong(); changed(false); } }, '+')),
        h('div', { class: 'c' },
          (() => { const s = h('select', { title: 'pattern', onchange: e => { snap(); en.p = +e.target.value; renderSong(); changed(false); } }, ...LETTERS.split('').map((L, k) => h('option', { value: k, selected: k === en.p }, L))); return s; })(),
          (() => { const s = h('select', { title: 'section effect: build = filter sweep + riser, break = low-pass dip', onchange: e => { snap(); en.fx = e.target.value; changed(false); } }, ...[['', 'no fx'], ['build', 'build'], ['break', 'break']].map(([v, l]) => h('option', { value: v, selected: v === (en.fx || '') }, l))); return s; })(),
          h('button', { title: 'move left', onclick: () => { if (!i) return; snap(); [S.chain[i - 1], S.chain[i]] = [S.chain[i], S.chain[i - 1]]; songSel = i - 1; renderSong(); changed(false); } }, '‹'),
          h('button', { title: 'remove', onclick: () => { if (S.chain.length < 2) return; snap(); S.chain.splice(i, 1); songSel = Math.min(songSel, S.chain.length - 1); renderSong(); changed(false); } }, '×')));
    });
    const total = S.chain.reduce((a, e) => a + e.r, 0), secs = total * 4 * 60 / S.bpm;
    $('song').replaceChildren(...chips,
      h('button', { class: 'addchip', onclick: () => { snap(); S.chain.splice(songSel + 1, 0, { p: S.cur, r: 4, fx: '' }); songSel++; renderSong(); changed(false); } }, '+ add ' + LETTERS[S.cur]),
      h('span', { style: 'align-self:center;color:var(--dim);font-size:12px;padding-left:6px' }, `${total} bars · ${Math.floor(secs / 60)}:${String(Math.round(secs % 60)).padStart(2, '0')}`));
  }

  /* ---------------- grid ---------------- */
  let cellEls = {}; // id -> [16 cells]
  let paint = null;
  function cellClass(id, i) {
    const v = S.pats[S.cur][id][i], tr = S.tracks[id], q = Math.floor(i / 4) % 2 ? ' q1' : '';
    let c = 'cell' + q;
    if (i >= tr.len) c += ' off';
    if (TS.MELODIC.has(id)) { if (v) c += v.a ? ' acc' : ' on'; if (v && v.s) c += ' slide'; }
    else if (v) c += v === 2 ? ' acc' : ' on';
    return c;
  }
  function cellText(id, i) {
    const v = S.pats[S.cur][id][i];
    if (!v || !TS.MELODIC.has(id)) return '';
    return TS.noteName(TS.degMidi(S, id, v.d)).replace(/-?\d+$/, '');
  }
  function updCell(id, i) { const el = cellEls[id][i]; el.className = cellClass(id, i); el.textContent = cellText(id, i); }
  function updRow(id) { for (let i = 0; i < 16; i++) updCell(id, i); }

  function renderGrid() {
    const g = $('grid'); cellEls = {};
    const head = h('div', { class: 'row head' }, h('span', {}, 'instrument'), h('span', { title: 'mute' }, 'M'), h('span', { title: 'solo' }, 'S'), h('span', { title: 'loop length in steps' }, 'steps'),
      h('div', { class: 'cells' }, ...Array.from({ length: 16 }, (_, i) => h('span', { class: i % 4 ? '' : 'beat' }, i % 4 ? i + 1 : `${i / 4 + 1}`))));
    const rows = [head];
    let lastGroup = 'drums';
    for (const id of TS.ORDER) {
      const v = TS.VOICES[id], tr = S.tracks[id];
      const cells = Array.from({ length: 16 }, (_, i) => h('button', { class: 'cell', 'data-i': i, 'aria-label': `${v.name} step ${i + 1}` }));
      cellEls[id] = cells;
      const anySolo = TS.ORDER.some(x => S.tracks[x].solo);
      const row = h('div', {
        class: 'row' + (id === sel ? ' sel' : '') + (v.group !== lastGroup ? ' groupgap' : '') + (tr.mute || (anySolo && !tr.solo) ? ' muted' : ''),
        style: `--col:${col(id)}`, 'data-id': id
      },
        h('button', { class: 'tname', 'data-help': v.desc, onclick: () => { select(id); audition(id); } }, h('i'), v.name),
        h('button', { class: 'ms m' + (tr.mute ? ' on' : ''), 'data-help': 'Mute this instrument (M).', onclick: () => { tr.mute = !tr.mute; if (tr.mute && TS.VOICES[id].stop && TS.E) TS.VOICES[id].stop(TS.E); renderGrid(); changed(); } }, 'M'),
        h('button', { class: 'ms s' + (tr.solo ? ' on' : ''), 'data-help': 'Solo: hear only soloed instruments (S).', onclick: () => { tr.solo = !tr.solo; renderGrid(); changed(); } }, 'S'),
        (() => {
          const s = h('select', { class: 'len', 'data-help': 'Loop length for this instrument. Anything other than 16 drifts against the bar: a polymeter (try 12, 10 or 7).', onchange: e => { snap(); tr.len = +e.target.value; updRow(id); changed(false); } },
            ...Array.from({ length: 16 }, (_, k) => h('option', { value: k + 1, selected: k + 1 === tr.len }, k + 1)));
          return s;
        })(),
        h('div', { class: 'cells' }, ...cells));
      lastGroup = v.group;
      rows.push(row);
      for (let i = 0; i < 16; i++) updCell(id, i);
    }
    g.replaceChildren(...rows);
  }

  // pointer painting across cells
  $('grid').addEventListener('contextmenu', e => { if (e.target.classList.contains('cell')) e.preventDefault(); });
  $('grid').addEventListener('pointerdown', e => {
    const c = e.target.closest('.cell'); if (!c) return;
    const id = c.closest('.row').dataset.id, i = +c.dataset.i, pat = S.pats[S.cur], cur = pat[id][i];
    const accent = e.shiftKey || e.altKey || e.button === 2;
    snap();
    let val;
    if (TS.MELODIC.has(id)) {
      if (accent) { if (!cur) val = { d: lastDeg[id] || 0, a: true, s: false }; else val = { ...cur, a: !cur.a }; }
      else val = cur ? null : { d: lastDeg[id] || 0, a: false, s: false };
    } else {
      if (accent) val = cur === 2 ? 1 : 2; else val = cur ? 0 : 1;
    }
    paint = { id, val, accent };
    pat[id][i] = val && typeof val === 'object' ? { ...val } : val; updCell(id, i);
    if (val) audition(id, val);
    if (sel !== id) select(id); else renderRoll();
    c.releasePointerCapture && c.releasePointerCapture(e.pointerId);
    e.preventDefault();
  });
  $('grid').addEventListener('pointerover', e => {
    if (!paint) return; const c = e.target.closest('.cell'); if (!c) return;
    const row = c.closest('.row'); if (!row || row.dataset.id !== paint.id) return;
    const i = +c.dataset.i, id = paint.id;
    S.pats[S.cur][id][i] = paint.val && typeof paint.val === 'object' ? { ...paint.val } : paint.val; updCell(id, i);
    if (sel === id) renderRoll();
  });
  addEventListener('pointerup', () => { if (paint) { paint = null; renderPats(); changed(false); } });

  /* ---------------- track panel ---------------- */
  const lastDeg = {};
  function select(id) {
    sel = id;
    for (const r of $('grid').querySelectorAll('.row[data-id]')) r.classList.toggle('sel', r.dataset.id === id);
    renderTrack();
  }

  function slider(def, obj, onChange, extra = {}) {
    const [key, label, min, max, , unit, help, opts] = def;
    const out = h('output');
    const show = () => { out.textContent = opts ? '' : `${TS.fmt(obj[key])}${unit ? ' ' + unit : ''}`; };
    let input;
    if (opts) {
      input = h('select', { onchange: e => { snap(); obj[key] = +e.target.value; onChange(); } }, ...opts.map((o, k) => h('option', { value: k + (+min), selected: k + (+min) === Math.round(obj[key]) }, o)));
    } else {
      const step = extra.step || (unit === 'steps' ? 1 : (max - min) / 400);
      input = h('input', { type: 'range', min, max, step, value: obj[key] });
      input.addEventListener('pointerdown', snap);
      input.addEventListener('input', e => { obj[key] = +e.target.value; show(); onChange(); });
      input.addEventListener('dblclick', () => { if (extra.def != null) { snap(); obj[key] = extra.def; input.value = extra.def; show(); onChange(); } });
    }
    show();
    return h('div', { class: 'k', 'data-help': `${label}: ${help}${extra.def != null ? ' Double-click to reset.' : ''}` }, h('label', {}, label, out), input);
  }

  const MIXDEF = [
    ['level', 'level', 0, 1, 0.8, '', 'Volume.'],
    ['pan', 'pan', -1, 1, 0, '', 'Left (−1) to right (+1).'],
    ['dly', 'delay send', 0, 1, 0, '', 'How much goes to the echo.'],
    ['rev', 'reverb send', 0, 1, 0, '', 'How much goes to the room.'],
    ['duck', 'sidechain', 0, 1, 0, '', 'How much this ducks when the kick hits. The pumping sound.'],
    ['chance', 'chance', 0, 1, 1, '', 'Probability that each step plays. Below 1 gives a living, changing groove.']
  ];

  function renderTrack() {
    const id = sel, v = TS.VOICES[id], tr = S.tracks[id], melodic = TS.MELODIC.has(id), panel = $('trackPanel');
    panel.style.setProperty('--col', col(id));
    const formula = h('div', { class: 'formula', 'data-help': 'The formula for this sound with the current values. t is time in seconds since the hit.' });
    const updF = () => { formula.innerHTML = v.formula(tr.p); };
    const defaults = TS.defaultTrack(id);
    const sound = v.params.map(d => slider(d, tr.p, () => { updF(); changed(false); if (melodic && d[0] === 'oct') { updRow(id); renderRoll(); } }, { def: defaults.p[d[0]] }));
    const mix = MIXDEF.map(d => slider(d, tr.mix, () => changed(), { def: defaults.mix[d[0]] }));

    const tools = [
      h('button', { 'data-help': 'Make a new part for this instrument in the current style (R).', onclick: () => reroll(id) }, 'Re-roll'),
      h('button', { 'data-help': 'Remove every step for this instrument in this pattern.', onclick: () => { snap(); S.pats[S.cur][id] = TS.emptyPattern()[id]; updRow(id); renderRoll(); renderPats(); changed(false); } }, 'Clear'),
      h('button', { 'data-help': 'Shift every step one to the left.', onclick: () => shift(id, 1) }, '◀ shift'),
      h('button', { 'data-help': 'Shift every step one to the right.', onclick: () => shift(id, -1) }, 'shift ▶')
    ];
    if (!melodic) {
      const k = h('input', { type: 'range', min: 0, max: 16, step: 1, value: 4 }), r = h('input', { type: 'range', min: 0, max: 15, step: 1, value: 0 });
      const lab = h('span', {}, 'E(4,16)');
      const apply = () => { const n = tr.len, hits = Math.min(+k.value, n), e = TS.euclid(hits, n, +r.value); lab.textContent = `E(${hits},${n}) rot ${r.value}`; S.pats[S.cur][id] = Array.from({ length: 16 }, (_, i) => i < n ? e[i] : 0); updRow(id); renderPats(); changed(false); };
      k.addEventListener('pointerdown', snap); r.addEventListener('pointerdown', snap);
      k.oninput = apply; r.oninput = apply;
      tools.push(h('label', { 'data-help': 'Euclidean rhythm: spread this many hits as evenly as possible over the loop, then rotate. E(3,8) is the tresillo, E(5,16) a bossa feel.' }, 'euclid hits', k, 'rotate', r, lab));
    }
    panel.replaceChildren(
      h('h2', {}, h('i'), v.name),
      h('p', { class: 'desc' }, v.desc),
      h('div', { class: 'ttools' }, ...tools),
      melodic ? h('div', { id: 'roll', class: 'roll' }) : '',
      melodic ? h('p', { class: 'desc', style: 'margin:2px 0 0;font-size:12px' }, 'Click a row to place a note on that step, click it again to remove. Accent = louder and brighter. Slide = glide into the next note.') : '',
      h('h3', {}, 'Sound'), h('div', { class: 'knobs' }, ...sound),
      h('h3', {}, 'Mix'), h('div', { class: 'knobs' }, ...mix),
      formula);
    updF();
    if (melodic) renderRoll();
  }

  function rollRows(id) {
    const L = TS.scale(S).length, rows = [];
    for (let d = L * 2; d >= -Math.min(L, 3); d--) rows.push(d);
    return rows;
  }
  function renderRoll() {
    const id = sel, el = $('roll'); if (!el || !TS.MELODIC.has(id)) return;
    const steps = S.pats[S.cur][id], L = TS.scale(S).length, kids = [], tr = S.tracks[id];
    for (const d of rollRows(id)) {
      const root = ((d % L) + L) % L === 0;
      kids.push(h('div', { class: 'lab' + (root ? ' root' : '') }, TS.noteName(TS.degMidi(S, id, d))));
      for (let i = 0; i < 16; i++) {
        const v = steps[i], on = v && v.d === d;
        kids.push(h('div', {
          class: 'rc' + (root ? ' root' : '') + (i % 4 === 0 ? ' q1' : '') + (on ? (v.a ? ' acc' : ' on') : '') , 'data-i': i,
          style: i >= tr.len ? 'opacity:.25' : '',
          onpointerdown: () => {
            snap(); const cur = steps[i];
            if (cur && cur.d === d) steps[i] = null; else { steps[i] = { d, a: cur ? cur.a : false, s: cur ? cur.s : false }; lastDeg[id] = d; audition(id, steps[i]); }
            updCell(id, i); renderRoll(); renderPats(); changed(false);
          }
        }));
      }
    }
    kids.push(h('div', { class: 'sep' }));
    for (const [flag, name] of [['a', 'accent'], ['s', 'slide']]) {
      kids.push(h('div', { class: 'lab' }, name));
      for (let i = 0; i < 16; i++) {
        const v = steps[i];
        kids.push(h('div', {
          class: 'flag' + (v && v[flag] ? ' on' : ''), 'data-i': i,
          onpointerdown: () => { if (!steps[i]) return; snap(); steps[i][flag] = !steps[i][flag]; updCell(id, i); renderRoll(); changed(false); }
        }, v ? (v[flag] ? name[0].toUpperCase() : '·') : ''));
      }
    }
    el.replaceChildren(...kids);
  }

  function reroll(id) {
    snap();
    const g = TS.GENRES[S.genre], L = TS.scale(S).length;
    if (TS.MELODIC.has(id)) {
      const style = g.lines[id] || { bass: 'rolling', acid: 'acid', stab: 'dub', pad: 'hold', pluck: 'bleep' }[id];
      S.pats[S.cur][id] = TS.LINES[style](Math.random, L);
    } else {
      const fallback = { kick: 'x...', snare: '....x.......x...', clap: '....x.......x...', rim: '..3..4....3..5..', chat: 'x5x5', ohat: '..x.', ride: '..x.', tom: '3..3..3...3..3..', cow: '...3......3.....', shaker: 'x4x4' }[id];
      S.pats[S.cur][id] = TS.drum(g.drums[id] || fallback);
    }
    updRow(id); renderRoll(); renderPats(); changed(false);
  }
  function shift(id, dir) {
    snap(); const a = S.pats[S.cur][id], n = S.tracks[id].len, part = a.slice(0, n);
    const out = part.map((_, i) => part[(i + dir + n) % n]);
    for (let i = 0; i < n; i++) a[i] = out[i];
    updRow(id); renderRoll(); changed(false);
  }

  /* ---------------- master ---------------- */
  const MDEF = [
    ['drive', 'drive', 0, 1, 0.2, '', 'Soft clipping on the whole mix. Warmth at low settings, crunch at high.'],
    ['duck', 'sidechain depth', 0, 1, 0.6, '', 'How hard the kick pushes everything else down.'],
    ['duckRel', 'sidechain release', 0.03, 0.5, 0.18, 's', 'How fast things come back after the kick. Match it to the tempo for a smooth pump.'],
    ['dtime', 'delay time', 1, 8, 3, '', 'Echo time in 16th notes.', ['1/16', '1/8', 'dotted 1/8', '1/4', '5/16', 'dotted 1/4', '7/16', '1/2']],
    ['dfb', 'delay feedback', 0, 0.9, 0.4, '', 'How many echoes. Above 0.7 they build up, dub style.'],
    ['dtone', 'delay tone', 0, 1, 0.6, '', 'Darker or brighter echoes.'],
    ['rsize', 'reverb size', 0.3, 8, 2.2, 's', 'Reverb decay time (RT60): seconds for the tail to fall 60 dB.'],
    ['vol', 'volume', 0, 1, 0.8, '', 'Master volume.']
  ];
  function renderMaster() {
    $('mfilter').value = S.fx.filter;
    $('mknobs').replaceChildren(...MDEF.map(d => slider(d, S.fx, () => changed(), { def: d[4], step: d[0] === 'rsize' ? 0.1 : undefined })));
  }
  $('mfilter').addEventListener('pointerdown', snap);
  $('mfilter').oninput = e => { S.fx.filter = +e.target.value; if (Math.abs(S.fx.filter) < 0.03) S.fx.filter = 0; changed(); };
  $('mfilter').ondblclick = () => { S.fx.filter = 0; $('mfilter').value = 0; changed(); };

  /* scope */
  const sc = $('scope'), sx = sc.getContext('2d');
  let sbuf;
  function drawScope() {
    const w = sc.clientWidth, hh = sc.clientHeight, d = devicePixelRatio || 1;
    if (sc.width !== w * d) { sc.width = w * d; sc.height = hh * d; }
    sx.setTransform(d, 0, 0, d, 0, 0); sx.clearRect(0, 0, w, hh);
    sx.strokeStyle = '#3a3f46'; sx.beginPath(); sx.moveTo(0, hh / 2); sx.lineTo(w, hh / 2); sx.stroke();
    if (!TS.E) return;
    const an = TS.E.analyser; sbuf = sbuf || new Float32Array(an.fftSize); an.getFloatTimeDomainData(sbuf);
    let z = 0; for (let i = 1; i < sbuf.length / 2; i++) if (sbuf[i - 1] < 0 && sbuf[i] >= 0) { z = i; break; }
    sx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--c-' + sel) || '#fff'; sx.lineWidth = 1.5; sx.beginPath();
    const n = 1024;
    for (let i = 0; i < n; i++) { const x = i / n * w, y = hh / 2 - sbuf[z + i] * hh * 0.45; i ? sx.lineTo(x, y) : sx.moveTo(x, y); }
    sx.stroke();
  }

  /* ---------------- playhead loop ---------------- */
  let lastPh = -1, lastPat = -1, lastEntry = -1;
  function frame() {
    requestAnimationFrame(frame);
    const q = TS.Seq.now();
    if (q) {
      // follow the song in song mode
      if (S.mode === 'song' && q.pat !== S.cur) { S.cur = q.pat; renderPats(); renderGrid(); renderTrack(); }
      if (q.entry !== lastEntry && S.mode === 'song') { lastEntry = q.entry; songSel = q.entry; renderSong(); for (const c of $('song').querySelectorAll('.chip')) c.classList.toggle('now', +c.dataset.i === q.entry); }
      if (q.pat !== lastPat) { lastPat = q.pat; for (const b of $('pats').children) b.classList.toggle('playing', +b.dataset.i === q.pat); }
      if (q.abs !== lastPh) {
        lastPh = q.abs;
        for (const id of TS.ORDER) {
          const len = S.tracks[id].len, i = q.abs % len, cells = cellEls[id];
          if (!cells) continue;
          for (let k = 0; k < 16; k++) cells[k].classList.toggle('ph', k === i && q.pat === S.cur);
        }
        const roll = $('roll');
        if (roll) { const i = q.abs % S.tracks[sel].len; for (const c of roll.querySelectorAll('.rc')) c.classList.toggle('ph', +c.dataset.i === i); }
      }
    } else if (lastPh !== -1) {
      lastPh = -1; lastPat = -1; lastEntry = -1;
      for (const el of $('grid').querySelectorAll('.ph')) el.classList.remove('ph');
      for (const b of $('pats').children) b.classList.remove('playing');
      for (const c of $('song').querySelectorAll('.chip')) c.classList.remove('now');
    }
    drawScope();
  }

  /* ---------------- files ---------------- */
  const download = (blob, name) => { const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); };
  const fname = ext => `techno-${S.genre}-${S.bpm}bpm-${new Date().toISOString().slice(0, 10)}.${ext}`;
  $('save').onclick = () => download(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }), fname('json'));
  $('open').onclick = () => $('file').click();
  $('file').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const s = fix(JSON.parse(await f.text())); if (!s) throw new Error('not a project'); snap(); restore(JSON.stringify(s)); changed(); toast('Opened ' + f.name); }
    catch (err) { toast('Could not open: ' + err.message); }
    e.target.value = '';
  };
  $('share').onclick = async () => {
    const url = location.href.split('#')[0] + '#' + encodeState(S);
    try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch (e) { prompt('Copy this link', url); }
  };
  $('export').onclick = async () => {
    const what = S.mode === 'song' ? 'song' : 'pattern';
    toast(what === 'song' ? 'Rendering song…' : 'Rendering 4 bars…');
    $('export').disabled = true;
    try { download(await TS.render(JSON.parse(JSON.stringify(S)), what, 4), fname('wav')); toast('WAV ready'); }
    catch (err) { console.error(err); toast('Export failed: ' + err.message); }
    $('export').disabled = false;
  };
  $('undo').onclick = () => { if (!undo.length) return; redo.push(JSON.stringify(S)); restore(undo.pop()); changed(); };
  $('redo').onclick = () => { if (!redo.length) return; undo.push(JSON.stringify(S)); restore(redo.pop()); changed(); };

  /* ---------------- help, hints, toast, keys ---------------- */
  $('helpBtn').onclick = () => { $('help').hidden = false; };
  $('helpClose').onclick = () => { $('help').hidden = true; };
  $('help').onclick = e => { if (e.target === $('help')) $('help').hidden = true; };
  const defaultHint = $('hint').textContent;
  document.addEventListener('pointerover', e => { const el = e.target.closest('[data-help]'); $('hint').textContent = el ? el.dataset.help : defaultHint; });
  let toastT;
  function toast(msg) { let t = document.querySelector('.toast'); if (!t) { t = h('div', { class: 'toast' }); document.body.append(t); } t.textContent = msg; clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 1800); }

  addEventListener('keydown', e => {
    const tag = e.target.tagName;
    if (tag === 'INPUT' && e.target.type !== 'range' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    const mod = e.metaKey || e.ctrlKey;
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) toggle(); }
    else if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); (e.shiftKey ? $('redo') : $('undo')).click(); }
    else if (mod) return;
    else if (e.key >= '1' && e.key <= '8') selectPat(+e.key - 1);
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const i = TS.ORDER.indexOf(sel) + (e.key === 'ArrowDown' ? 1 : -1); select(TS.ORDER[(i + TS.ORDER.length) % TS.ORDER.length]); }
    else if (e.key === 'm') { S.tracks[sel].mute = !S.tracks[sel].mute; renderGrid(); changed(); }
    else if (e.key === 's') { S.tracks[sel].solo = !S.tracks[sel].solo; renderGrid(); changed(); }
    else if (e.key === 'r') reroll(sel);
    else if (e.key === 'Escape') $('help').hidden = true;
  });

  function renderAll() { renderHeader(); renderPats(); renderSong(); renderGrid(); renderTrack(); renderMaster(); }
  TS.ui = { renderAll, toast, get state() { return S; } };
  renderAll();
  requestAnimationFrame(frame);
  if (!localStorage.getItem('technosynth-seen')) { $('help').hidden = false; localStorage.setItem('technosynth-seen', '1'); }
})();
