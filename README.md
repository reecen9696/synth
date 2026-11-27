# Techno Function Synth

Browser techno synth. Every sound is a formula, generated in code with the Web Audio API. No samples, no build step, no dependencies. One file: `index.html`.

## Run

Open `index.html` in a browser, or serve the folder:

    npx serve .

## Use

- Pick a scene at the top. Each one is a techno style with its own tempo, swing, key, sound and colours: 150, detroit, berlin, minimal, dub, acid, hard, industrial, hypnotic, electro, ambient.
- Click the graph to add a note, click it again to remove. Drag a note to move it, drag across steps to paint. Shift-click accent, Alt-click slide.
- Keyboard: `a s d f g h j k` are the 8 scale notes. Hold several for a chord. ← → move the step (the caret under the acid row), Backspace clears it.
- Acid synth: pick 303, FM bell, pluck, stab, supersaw or square. Everything except the 303 plays chords.
- Vox: a talking synth on top. A saw through three vowel formant filters (a e i o u); talk sweeps the vowel during each note. It follows the acid line's pitch.
- Sequence (top): 1/2/4/8/16 bars. Click a cell to mute or play a voice in that bar, click a bar number to jump there.
- Pick a voice to see its formula and sliders.
- Space plays and stops.

## Code map (all in index.html)

- `DEF`: parameters and ranges per voice
- `SCENES`: style, tempo, swing, root note, mode, colours, sound settings and pattern
- `initAudio`: master bus, sidechain duck, delay, reverb, rumble chain, acid voice
- `kick` `bass` `clap` `hat` `acid` `polyNote` `vox`: one function per voice
- `tick`: lookahead scheduler (25 ms timer, 100 ms window on the audio clock) with swing
- `draw`: canvas graph and playhead
- `FORM`: formula text per voice

## The maths

- Kick: `y = tanh(k·sin 2π∫f dt)·e^(−5t/d)`, with the pitch dropping fast from 6× to its base frequency.
- Hats: six square waves at the TR-808 frequencies 205.3, 304.4, 369.6, 522.7, 540 and 800 Hz, bandpassed at the tone and at 3.44 kHz. A closed hat cuts off a ringing open hat.
- Clap: four noise bursts 11 ms apart plus a tail, through a 1.1 kHz bandpass, as in the 909 circuit.
- Acid: a saw through a 24 dB resonant lowpass, with `c(t) = cutoff + env·e^(−3t/d)`. Accents force a 0.2 s filter decay and stack. Slide is a 60 ms glide, as on a TB-303.
- Notes: `f = 440·2^((n−69)/12)`. Swing delays every second 16th by `(swing − 50%)·2·step`.

`docs/RESEARCH.md` has the research behind the numbers: circuit analyses, genre tables and 50 sources.
