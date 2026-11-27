# Techno Synth

A browser techno groovebox. Every sound is generated in code with the Web Audio API. There are no samples, no build step and no dependencies.

## Run

Open `index.html` in a browser, or serve the folder:

    npx serve .

## Use

1. Pick a **Style** (Detroit, Berlin, minimal, dub, acid, hard, industrial, peak time, hypnotic, melodic, hardgroove, rave, deep/ambient, electro, schranz) and press **Make track**. You get 8 patterns (Intro, Groove, Main, Break, Build, Drop, Peak, Outro) and a song order.
2. Press **Play** (or Space). **Loop pattern** repeats one bar. **Play song** runs the song order with build risers, breakdown filter dips and auto fills.
3. The grid is one bar of 16 steps with one row per instrument. **Click does** sets what a click means:
   - **Draw** turns steps on and off. Drag to paint a row.
   - **Accent** makes a step louder and brighter.
   - **Ratchet** splits a step into 2–4 fast hits.
   - **Chance** makes a step play only some of the time.
4. Click an instrument name to open its sound controls, mix controls and live formula. Melodic parts also get a note grid with accent and slide rows.
5. The **steps** column sets a loop length per instrument. Lengths other than 16 make polymeters.
6. **Export WAV** renders the current pattern, or the whole song when you are in song mode. **Save**, **Open** and **Share** keep projects. Work is also autosaved in the browser.

## Instruments

| Drums | Synths |
|---|---|
| Kick (909/808 with rumble), Snare, Clap, Rim, Closed hat, Open hat (choked), Ride, Tom/conga, Cowbell, Shaker | Bass (sub, saw, square, reese, FM), Acid 303, Chord stab, Pad (JP-8000 supersaw), FM pluck, Hoover |

## Code map

| File | What lives there |
|---|---|
| `js/voices.js` | One object per instrument: parameters, help text, formula and `play()`. Add a voice here and add its colour in `css/style.css`. |
| `js/engine.js` | The audio graph: channels, sidechain duck bus, ping-pong delay, generated reverb, rumble chain, master filter, drive, bit crush, limiter. |
| `js/theory.js` | Scales, scale degree to MIDI, Euclidean rhythms, seeded random, drum-string parser, melodic line generators. |
| `js/genres.js` | Style presets (tempo, swing, key, sounds, mix, drum strings, line styles), song sections, default state, `makeSong`. |
| `js/seq.js` | Step playback shared by live and offline. Covers swing, ratchets, chance, fills, section fx, the look-ahead clock in a Worker, and the WAV renderer. |
| `js/ui.js` | Everything on screen: grid, piano roll, panels, song order, files, undo, keys. |
| `docs/RESEARCH.md` | The research behind the numbers: circuit analyses, genre tables, arrangement, Web Audio practice, 50 sources. |

### Drum pattern strings

Genres write drums as 16-character strings:

- `X` = accent
- `x` = hit
- `.` = rest
- `1` to `9` = a hit with 10% to 90% chance

A shorter string repeats to fill 16 steps.

### Working together

Pull before you start and push small commits often. The code is split by concern so two people rarely touch the same file:

- New sounds go in `voices.js`.
- New styles go in `genres.js`.
- Screen changes go in `ui.js`.

## Maths references

- TR-808 cymbal and hat oscillators (205.3, 304.4, 369.6, 522.7, 540, 800 Hz) and the dual bandpass at 3.44 and 7.1 kHz come from Werner, Abel and Smith, ICMC 2014.
- 303 accent and slide behaviour comes from Robin Whittle's Devil Fish manual. Accented notes force a 200 ms filter decay, consecutive accents stack, and slide is 60 ms.
- The supersaw detune curve and mix levels come from Adam Szabo's JP-8000 analysis.
- FM ratios and index come from Chowning (1973).
- The scheduler follows Chris Wilson's "A tale of two clocks".

Full list in `docs/RESEARCH.md`.
