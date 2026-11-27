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
- Hold a letter key to move the song (acid and bass) into another key; let go and it comes home to G phrygian. The letters are laid out like a piano: A S D F G H J K L are the white notes (C D E F G A B C D), W E T Y U O P the sharps. The keycaps under the sliders show the map and can be clicked or touched too.
- Hold several keys and they become a melody: each new acid or bass note takes the next held key, in the order you pressed them.
- Tap space while holding keys to lock them in, so the key (or melody) stays after you let go. Holding other keys plays over the lock; letting go drops back into it. Hold G (or the same locked keys) and tap space to unlock and come home. Space with nothing held plays and stops as before. The space bar's label says which it will do.

## Visuals screen

Start `node ../visuals/server.js` and click **screen**. The synth links to it on its own (the button goes solid when linked) and streams its pattern, formula, playhead, spectrum and every hit ahead of time, so the screen lands on the beat. See `../visuals/README.md`. To point at another machine: `index.html?visuals=192.168.1.20:5180`.

## Key map

    W  E     T  Y  U     O  P        C♯ D♯    F♯ G♯ A♯    C♯ D♯
   A  S  D  F  G  H  J  K  L        C  D  E  F  G  A  B  C  D
                                   -7 -5 -3 -2  0 +2 +4 +5 +7  semitones from G

## Code map (all in index.html)

- `KEYMAP` - letter to semitones from G
- `seq` `arp` `retune` `space` `showKey` - held/locked keys, the per-note step through them, instant moves, the lock, and the keycap display (which follows the note being heard)
- `N.tr` - one constant signal in cents feeding the detune of the acid and every bass note, so a key change is instant
- `DEF` - parameters and ranges per voice
- `SCENES` - patterns, tempo and colours
- `initAudio` - master bus, sidechain duck, delay, reverb, rumble chain, acid voice
- `kick` `bass` `clap` `hat` `acid` - one function per voice
- `tick` - lookahead scheduler (25 ms timer, 100 ms window on the audio clock)
- `draw` - canvas graph and playhead
- `FORM` - formula text per voice
- `link` `cue` and the 16 ms timer at the end - the visuals link: state when it changes, `cue` sends each step's hits with how far ahead they sound, the timer sends playhead and four spectrum bands from `N.an`

## References

- Kick, snare, hat recipes: https://dev.to/sendotltd/sample-free-drum-synthesis-in-web-audio-building-kick-snare-and-hi-hat-from-oscillators-in-60-2c0k
- 303 signal chain, accent, slide: https://tnn1t1s.github.io/day-303/about.html
- Rumble kick technique: https://www.attackmagazine.com/technique/beat-dissected/dark-techno-rumble/
- Scheduling: https://web.dev/articles/audio-scheduling
