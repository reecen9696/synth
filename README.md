# Techno Function Synth

Browser techno synth. Every sound is generated in code with the Web Audio API. No samples, no build step, no dependencies.

## Run

Open `index.html` in a browser, or serve the folder:

    npx serve .

## Use

- Click the graph to add or remove hits. One bar, 16 steps.
- Acid: click a note again for accent, again for slide, again to remove.
- Pick a voice to see its formula and sliders.
- Space plays and stops.

## Code map (all in index.html)

- `DEF` - parameters and ranges per voice
- `SCENES` - patterns, tempo and colours
- `initAudio` - master bus, sidechain duck, delay, reverb, rumble chain, acid voice
- `kick` `bass` `clap` `hat` `acid` - one function per voice
- `tick` - lookahead scheduler (25 ms timer, 100 ms window on the audio clock)
- `draw` - canvas graph and playhead
- `FORM` - formula text per voice

## References

- Kick, snare, hat recipes: https://dev.to/sendotltd/sample-free-drum-synthesis-in-web-audio-building-kick-snare-and-hi-hat-from-oscillators-in-60-2c0k
- 303 signal chain, accent, slide: https://tnn1t1s.github.io/day-303/about.html
- Rumble kick technique: https://www.attackmagazine.com/technique/beat-dissected/dark-techno-rumble/
- Scheduling: https://web.dev/articles/audio-scheduling
