# Techno Function Synth

Browser techno synth. Every sound is a formula, generated in code with the Web Audio API. No samples, no build step, no dependencies. One file: `index.html`.

## Run

Open `index.html` in a browser, or serve the folder:

    npx serve .

## Use

- Pick a scene at the top. Each one is a techno style with its own tempo, swing, key, sound and colours: 150, detroit, berlin, minimal, dub, acid, hard, industrial, hypnotic, electro, ambient.
- Click the graph to add a note, click it again to remove. Drag a note to move it, drag across steps to paint. Shift-click accent, Alt-click slide.
- Keyboard: `a s d f g h j k` are the 8 scale notes. Hold several for a chord. ← → move the step (the caret under the acid row), Backspace clears it.
- Synth: the acid row can be a 303, pluck, dub chord, rave stab, supersaw, hoover, reese, organ or FM bell. Dub chord and rave stab play a whole chord from one note. On held synths (supersaw, hoover, reese, organ) a slide ties the note into the next step.
- Pick a voice to see its formula and sliders.
- Track: audio that plays behind the song. On the synth page it has a switch, listen, a one-knob filter (left lowpass, right highpass), level and match beat. Press `cut & arrange →` to open `editor.html`, where you load files, cut them into pieces on a zoomable waveform (drag the markers, or put the cursor somewhere and press `[`, `]` or `S` to split), drag pieces into order and listen. The editor has eight slots: every change is saved to the selected slot, slots can be named and copied, and the synth's track row has a dropdown to choose which slot plays. A file at `tracks/default.mp3` loads on start, and files named in `tracks/list.json` (`[{"file": "x.mp3", "name": "shown name"}]`) show up in the editor; that folder is not in the repo.
- Space plays and stops.

## Code map (all in index.html)

- `DEF`: parameters and ranges per voice
- `SCENES`: style, tempo, swing, root note, mode, colours, sound settings and pattern
- `initAudio`: master bus, sidechain duck, delay, reverb, rumble chain, acid voice
- `kick` `bass` `clap` `hat` `acid` `polyNote`: one function per voice
- `tick`: lookahead scheduler (25 ms timer, 100 ms window on the audio clock) with swing
- `draw`: canvas graph and playhead
- `FORM`: formula text per voice

## The maths

- Kick: `y = tanh(k·sin 2π∫f dt)·e^(−5t/d)`, with the pitch dropping fast from 6× to its base frequency.
- Hats: six square waves at the TR-808 frequencies 205.3, 304.4, 369.6, 522.7, 540 and 800 Hz, bandpassed at the tone and at 3.44 kHz. A closed hat cuts off a ringing open hat.
- Clap: four noise bursts 11 ms apart plus a tail, through a 1.1 kHz bandpass, as in the 909 circuit.
- Acid: a saw through a 24 dB resonant lowpass, with `c(t) = cutoff + env·e^(−3t/d)`. Accents force a 0.2 s filter decay and stack. Slide is a 60 ms glide, as on a TB-303.
- Synths (`SYN`, `polyNote`): supersaw uses the JP-8000 detune offsets from Szabo's analysis, the FM bell is Chowning's two-operator recipe, the hoover is the Alpha Juno "What the?" (three octaves of detuned saws gliding up an octave into the note, through chorus), the dub chord is a parallel minor 7th into the dotted-eighth echo, the reese is two saws 50 cents apart over a sine sub, and the organ is four sine drawbars with a key click.
- Notes: `f = 440·2^((n−69)/12)`. Swing delays every second 16th by `(swing − 50%)·2·step`.

`docs/RESEARCH.md` has the research behind the numbers: circuit analyses, genre tables and 50 sources.
