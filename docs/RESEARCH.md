# Techno synth expansion: research report (raw Web Audio, no samples)

How to read the numbers: values with a bracketed source number such as [1] come from that source. Values without a citation are my suggested starting points, and you should tune them by ear. Where a value comes from a forum, I say so. The full source list with URLs is at the end.

---

## 1. Subgenre table

### 1a. Overview

All tempos and swing values below are in BPM and Linn/MPC percent. On that scale 50% is straight and 66% is a perfect triplet [25][26].

| Subgenre | BPM | Swing | Bass style | Signature sounds | FX amounts |
|---|---|---|---|---|---|
| Detroit | 125–135 | 54–58% (Attack's Motor City tutorial uses 55–60% at 120–125 BPM [24]) | Syncopated analog bass, 16th offbeats | Supersaw/string pads, 909 kit, rimshot used as counterpoint to the kick [24], congas | Chorus on hats, plate reverb 1.2–1.8 s, wet 0.15 |
| Berlin/Berghain warehouse | 128–136 (dark techno 125–135 [33]) | 50% (grid-based, "not focused on swing" [35]) | Rumble kick acts as the bass | Distorted 909 kick, rumble, offbeat ride, low snare | Kick reverb 1.5–3 s, then drive, then 48 dB LPF at 100–250 Hz [36] |
| Minimal/microhouse | 122–128 (120–128 [33]) | 56–62% | Short sine/FM blips | Clicks, rims, tiny percussion, shaker | Short room 0.4–0.8 s, 1/16 delay, feedback 0.25 |
| Dub techno | 110–125 [29] (Attack's Basic Channel tutorial uses 145 [22], which is unusual) | 50–56% | Deep sub, sparse | Minor 7th chord stab, hiss, 16th shaker | Stab delay: 1/8 dotted with feedback ~20%, plus a 264 ms tap with feedback ~85% on a 280 Hz HPF send with 0.25 Hz LFO [21]. Low-decay reverb on stabs [22] |
| Acid techno | 128–140 | 50–56% | TB-303 | 303 line, 909 kit, overdrive | 303 into tanh drive, 3/16 delay |
| Hard techno/schranz | 145–160 (hard techno now often has a 145–160 floor [32]; schranz 135–160 [34]) | 50% | None; kick and loop pressure only | Heavily compressed, filtered percussion loops, 909 kick/snare/hats [34] | Bus drive, HPF sweeps |
| Industrial | 130–145 [32] (130–150 per [33]) | 50% | Distorted noise bass | Metallic percussion, bit-crushed hits, noise bursts | Bitcrush 6–8 bit, big hall 3–5 s |
| Peak-time/big room | 128–134 | 50% | Rolling offbeat 1/16 bass | Big clap, riser, ride, white-noise sweeps | Clap reverb 1.5 s, sidechain release 200–350 ms [37] |
| Hypnotic | 128–136 | 50–54% | Rolling 16ths | Polymeter percussion, filtered loops | Long LFO filter sweeps (32–64 bars) |
| Melodic techno | 120–126 | 50–54% | Sustained or arpeggiated saw bass | Arps, supersaw pads, plucks | Ping-pong at dotted 1/8, hall reverb 2.5–4 s |
| Hardgroove | 135–145 | 54–60% | Short funky stabs | Tribal congas and bongos, ride, higher percussion-to-kick ratio [34] | Light room, drum-bus drive |
| Gabber-adjacent/rave | 150–180 (gabber 140–190 [30]) | 50% | The distorted kick is the bass | Clipped kick, hoover, rave stab | Kick into heavy tanh/clip, bitcrush |
| Ambient/deep techno | 100–122 (ambient techno 100–120 [33]) | 52–56% | Sub plus soft pad | Pads, field-noise beds, soft kick | Reverb 4–8 s, delay feedback 0.6 |
| Electro | 120–132 (classic electro was programmed at 120 [35]) | 50%: rigid quantise, little velocity variation beyond 808 accent [35] | 808 sub and synth bass | 808 kick/snare/clap/cowbell, vocoder [31] | Dry, short gated reverb |

Measured across 44,914 techno tracks, the median tempo is 133 BPM and half sit between 128 and 140 [32].

### 1b. 16-step patterns (all strings checked to be 16 characters)

`x` means hit. Step 1 is the downbeat, beats fall on steps 1/5/9/13, and offbeats fall on 3/7/11/15. The hypnotic `perc` and `rim` lanes are deliberately 3 and 5 steps long, as polymeter loops.

```js
const GENRES = {
  detroit:   { bpm:[125,135], swing:0.56, kick:"x...x...x...x...", clap:"....x.......x...", snare:"................", ch:"x.xxx.xxx.xxx.xx", oh:"..x...x...x...x.", ride:"................", perc:"...x..x.x.....x.", rim:"......x.....x..x" },
  berlin:    { bpm:[128,136], swing:0.50, kick:"x...x...x...x...", clap:"................", snare:"............x...", ch:"xx.xxx.xxx.xxx.x", oh:"................", ride:"..x...x...x...x.", perc:"......x.....x..x", rim:"...x.....x......" },
  minimal:   { bpm:[122,128], swing:0.60, kick:"x...x...x...x...", clap:"....x.......x...", snare:"................", ch:"..x...x...x...x.", oh:"................", ride:"................", perc:".x...x.x..x...x.", rim:"...x..x....x.x.." },
  dub:       { bpm:[116,125], swing:0.54, kick:"x...x...x...x...", clap:"................", snare:"....x.......x...", ch:"xxxxxxxxxxxxxxxx", oh:"..x...x...x...x.", ride:"................", perc:"..............x.", rim:"................", stab:"...x.....x....x." },
  acid:      { bpm:[128,140], swing:0.52, kick:"x...x...x...x...", clap:"....x.......x...", snare:"..............x.", ch:"xx.xxx.xxx.xxx.x", oh:"..x...x...x...x.", ride:"................", perc:"................", rim:"................" },
  hard:      { bpm:[145,160], swing:0.50, kick:"x...x...x...x...", clap:"....x.......x...", snare:"............x.x.", ch:"xxxxxxxxxxxxxxxx", oh:"..x...x...x...x.", ride:"x.x.x.x.x.x.x.x.", perc:"x.xxx.xx.xx.x.xx", rim:"................" },
  industrial:{ bpm:[130,145], swing:0.50, kick:"x...x...x..xx...", clap:"................", snare:"....x.......x...", ch:"x.x.x.x.x.x.x.x.", oh:"................", ride:"................", perc:"...x...x.x...x..", rim:"................" },
  peaktime:  { bpm:[128,134], swing:0.50, kick:"x...x...x...x...", clap:"....x.......x...", snare:"................", ch:"xx.xxx.xxx.xxx.x", oh:"..x...x...x...x.", ride:"x.x.x.x.x.x.x.x.", perc:"......x.......x.", rim:"................" },
  hypnotic:  { bpm:[128,136], swing:0.52, kick:"x...x...x...x...", clap:"................", snare:"................", ch:"x.xxx.xxx.xxx.xx", oh:"..x...x...x...x.", ride:"..x...x...x...x.", perc:"x..", rim:"x...." }, // 3- and 5-step polymeter lanes
  melodic:   { bpm:[120,126], swing:0.52, kick:"x...x...x...x...", clap:"....x.......x...", snare:"................", ch:"..x...x...x...x.", oh:"..............x.", ride:"................", perc:".....x.....x..x.", rim:"................" },
  hardgroove:{ bpm:[135,145], swing:0.57, kick:"x...x...x...x...", clap:"....x.......x...", snare:".......x.x....x.", ch:"xxxxxxxxxxxxxxxx", oh:"..x...x...x...x.", ride:"x.x.x.x.x.x.x.x.", perc:"x..x..x.x.x..x..", rim:"...x..x...x..x.." },
  rave:      { bpm:[150,180], swing:0.50, kick:"x...x...x...x...", clap:"....x.......x...", snare:"................", ch:"................", oh:"..x...x...x...x.", ride:"................", perc:"................", rim:"................" },
  ambient:   { bpm:[110,122], swing:0.54, kick:"x.......x.......", clap:"................", snare:"................", ch:"..x...x...x...x.", oh:"................", ride:"................", perc:".....x........x.", rim:"................" },
  electro:   { bpm:[120,132], swing:0.50, kick:"x.....x...x.....", clap:"............x...", snare:"....x.......x...", ch:"xxx.xxxxxx.xxxx.", oh:"...............x", ride:"................", perc:"x..x..x...x.x...", rim:"................" }, // perc = 808 cowbell
};
```

How the patterns were built: the published tutorials mostly describe patterns in words, so I translated those descriptions into steps. The ones I drew on:
- Electro: the 16th hat line has gaps and an open hat on the last 16th, the snare is on the backbeat only, and the clap doubles the last snare [35].
- Thumping techno: the snare goes on offbeats and 16ths rather than beats 2 and 4, and the tom sits on the last offbeat [23].
- Ride: either follows the kick [23] or plays a 909 8th-note ride with every second hit shorter and quieter.
- Jeff Mills style: offbeat open hats duplicated onto the ride at -6 dB, at 137 BPM [35]; clap sub-steps on the last two steps.

**Velocity tips.**
- 16th hats: accent the offbeats at 1.0, set the others to 0.55–0.7. Velocity "does most of the groove work" [23].
- Keep the kick straight even when other lanes are swung [25].
- 909 flam spacing is 20–48 ms in 4 ms units [27].

---

## 2. Drum synthesis recipes

### Kicks

**909 kick.** The circuit is a sawtooth oscillator whose pitch is driven by an envelope (EG3: instant attack, slow decay). A waveshaper turns the saw into a near-sine. Amplitude comes from an AR envelope (EG1) whose attack and decay are changed by accent. The click is noise through a lowpass, mixed with a short pulse and shaped by EG2 [4]. Code-ready version:
- Sine or triangle oscillator. Frequency: `setValueAtTime(230,t)` then `setTargetAtTime(52, t, 0.018)`. Use 180–300 Hz as the start and 45–60 Hz as the end.
- Amplitude: 0 → 1 over 1.5 ms (linear), then `setTargetAtTime(0, t+0.01, decay/4)`, with decay 0.3–0.8 s.
- Click: a 2–4 ms burst of white noise through a 3–6 kHz LPF at gain 0.3–0.5, plus optionally one sample of +1 DC.
- Drive: tanh WaveShaper with k = 2–6.

**808 kick** [2][3][8]:
- The bridged-T resonator sits at about 49.5 Hz. Roland's tuning chart says 56 Hz [2].
- During the first ~6 ms the centre frequency jumps up by more than an octave. That is shorter than one cycle, so it is heard as "punch", not as a pitch change [2].
- The "pitch sigh" is a separate, subtle downward drift. In sampled 808s the median initial sweep is about one semitone [3].
- Recipe:
  ```js
  f.setValueAtTime(f0*2.2,t);
  f.exponentialRampToValueAtTime(f0*1.06,t+0.006);
  f.exponentialRampToValueAtTime(f0,t+0.12);
  ```
  with f0 = 45–56 Hz. Amplitude decay runs from 50 ms to more than 2 s.
- The io-808 web implementation [8] uses a sine starting at 48+50 Hz, decaying exponentially to 48 Hz over `decay*5+50` ms. It has a 2 ms linear attack and the same decay for amplitude, an LPF at `200+tone*20` Hz with Q 1, a click pulse, and a soft clipper (0.6).

**Rumble kick (Berlin)** [36]:
- Chain: kick → send at 0 dB → reverb (generated impulse, 1.5–3 s) → tanh drive (k 3–8) → steep LPF.
- Cutoff: sources range from about 50 to 300 Hz. Bonedo starts at 250 Hz, and MusicRadar suggests a 48 dB slope.
- In Web Audio, get a 48 dB slope by cascading 4 lowpass biquads at Q 0.54 / 0.63 / 0.9 / 2.6 (Butterworth-ish), or use 4 × Q 0.707 for simplicity.
- Then put a GainNode on the rumble return that is ducked by every kick, with a release of about 1/8 note. Sidechain sits after the reverb [36]. Mix it 6–10 dB below the dry kick.

### Clap, snare, rim

**909/808 clap.**
- Shape: noise → bandpass → an envelope that fires 4 times about 11 ms apart, plus a longer "reverb" tail [7]. A forum calculation from the schematic puts the BPF at about 1140 Hz with Q ≈ 1.95 [7] (forum figure, unconfirmed).
- io-808 [8] uses: BPF at 1000 Hz, a sawtooth burst envelope with 10 ms intervals and peaks of 1, 0.5, … ramping linearly to 0, and a parallel tail with 0.2 ms attack, 115 ms linear decay and 0.75 level.
- Code:
  ```js
  for (let i=0;i<4;i++){ const s=t+i*0.011; g.gain.setValueAtTime(i<3?1:0.8, s); g.gain.linearRampToValueAtTime(0.05, s+0.009);} // bursts
  tail.gain.setValueAtTime(0.75, t+0.033); tail.gain.setTargetAtTime(0, t+0.035, 0.05); // ~150–250 ms tail
  ```
  Bandpass at 1000–1200 Hz, Q 1.5–2.5. Optionally add a second bandpass at 2.4 kHz, mixed at 0.3, for "snap".

**909 snare.**
- The circuit has two triangle-core oscillators, slightly detuned and started in phase, with a pitch envelope on one. Lowpassed noise runs through the whole hit, and a highpassed noise path is set by "Snappy" [5].
- The SOS model's partials are 180 Hz and 330 Hz [5]. io-808's 808 snare uses 238 Hz and 476 Hz, a noise filter at `800+tone*100` Hz, a 75 ms noise envelope and a 50 ms snappy envelope [8].
- Recipe:
  - Osc1: triangle, 185 Hz, `setValueAtTime(185*1.6,t)` then `setTargetAtTime(185,t,0.012)`, decay τ 0.04 s.
  - Osc2: triangle, 330 Hz, decay τ 0.03 s, mixed at 0.6.
  - Noise A: LPF 7 kHz, decay τ 0.05 s.
  - Noise B (snappy): HPF 1.8–2.5 kHz, decay τ 0.06–0.1 s, level 0–1.
- 909 noise is a shift register clocked near 300 kHz [11], effectively white across the audio band. `Math.random()*2-1` is fine.

**Rimshot** [8]: oscillators at 480 Hz and 1750 Hz through a "swing VCA" with a 10 ms linear decay at gain 1.7 (overdriven), then a HPF. **Clave**: 2450 Hz, exponential 40 ms decay.

### Hats, ride, cymbal (808 metallic bank)

**The six 808 square-wave oscillators** come from the circuit analysis by Werner, Abel and Smith [1]:
- **205.3, 369.6, 304.4, 522.7 Hz**, plus trimmed **800 and 540 Hz**. The last two are also the cowbell oscillators.
- Duty cycle 47.98%.
- Two bandpass filters centred at **≈3440 Hz** and **≈7100 Hz** emphasise the upper overtones.
- High-pass output stages have a resonant corner near **10.5 kHz**.
- The trigger is a 1 ms pulse. Three VCA bands have separate envelopes: the low band has a variable decay, the upper bands short and medium [1][6].

```js
const F808 = [205.3, 304.4, 369.6, 522.7, 540, 800];
// alternative set used by io-808 / SOS-style emulations: [263, 400, 421, 474, 587, 845] [8]
// TR-606-style set (Erica Synths): [245, 306, 365, 415, 437, 619] [50]
```

- **Closed hat**: sum of 6 squares at 0.3 each → BPF 10 kHz (or 7.1 kHz) → VCA → HPF 8 kHz. Linear decay **50 ms** (io-808) [8], or 10–130 ms (DP-303) [14].
- **Open hat**: same chain, decay **90–450 ms** (io-808 `decay*3.6+90`) [8], or 100–700 ms [14]. **Choke**: when a closed hat fires, ramp the open-hat bus to 0 over 4 ms [14].
- **Cymbal/ride** [8]: three bands with exponential envelopes:
  - Low band: BPF 5 kHz, decay 700–1550 ms.
  - Mid band: 10 kHz, 400 ms.
  - High band: HPF 8 kHz, 150 ms.
  - A tone control crossfades low against high.
  - For a 909-style ride (the original was a 6-bit sample [28]), use the same bank. Add an FM or ring layer: sine 3.1 kHz × sine 4.7 kHz, decay 1.2–2 s, HPF 5 kHz.

### Cowbell, toms, congas, shaker

**Cowbell** [1][8][9]:
- Squares at **540 Hz and 800 Hz**.
- io-808 values: BPF **2640 Hz, Q 1**. A two-stage envelope: short **15 ms** at 75% level plus long **400 ms** at 25%.
- Simpler version: a single exponential ramp 0.5 → 0.01 over 0.5 s [9].

**Toms and congas** (io-808 808 values [8]). Each is a sine, plus noise lowpassed at 10 kHz at 0.2 level, plus a click at 0.3. The tune knob interpolates between the two frequencies shown.

| Voice | Freq range (Hz) | Osc decay (ms) | Noise decay (ms) |
|---|---|---|---|
| Low tom | 80–100 | 200 | 200 |
| Mid tom | 120–160 | 130 | 155 |
| High tom | 165–220 | 200 | 125 |
| Low conga | 165–220 | 180 | 200 |
| Mid conga | 250–310 | 100 | 155 |
| High conga | 370–455 | 180 | 125 |

For a 909 tom, add a pitch drop: start at 1.3× frequency and glide with τ 30 ms.

**Shaker/maracas** [8]: noise → HPF 5 kHz, 0.2 ms attack, 30 ms linear decay, 0.5 level. For a 16th-note shaker, alternate velocity 1.0 / 0.6 and add ±3 ms of random timing.

---

## 3. Melodic voices

### TB-303

These figures come from the Devil Fish manual by Robin Whittle [12], which documents stock 303 behaviour.

| Parameter | Value |
|---|---|
| Slide time | **60 ms**, fixed regardless of tempo (Devil Fish range 60–360 ms) |
| Note onset | ~4 ms delay, then 3 ms attack |
| Unaccented note end | ~16 ms (8 ms hold + 8 ms linear fall) |
| VEG (amplitude) decay | Fixed at ~3–4 s, but the gate cuts it |
| MEG (filter envelope) decay | 200 ms–2 s via the Decay knob. **On accented notes it is forced to 200 ms** |
| Maximum resonant frequency | Stock ≈ 2.5 kHz (Devil Fish ≈ 5 kHz, "an octave above") |
| Bass loss | 32 Hz is down 5 dB on a stock unit |

**Accent sweep** [12][13]:
- The MEG feeds a diode, 47k resistor and 100k pot into a **1 µF** capacitor, so τ ≈ 147k × 1 µF ≈ **0.15 s**.
- Model it as an extra envelope that is lowpass-smoothed. Consecutive accents stack, which gives the "wow" climb.
- Lower resonance makes the sweep sharper [15].
- Accent also adds to VCA level. Multiply by 1.5–2.

**Web Audio approximation of the diode ladder:**
- Oscillator: saw, or square made from a saw through a WaveShaper.
- Pre-filter drive: tanh with k 1–3. DP-303 puts drive before the filter [14].
- Filter: two cascaded lowpass biquads. Biquad 1 Q = 0.7–18 (resonance), biquad 2 Q = 0.5–0.7. Then a highpass at 35–45 Hz to model the bass loss, and a gentle tanh after.
- Cutoff: `fc = base * 2^(envMod*4*env)`, with base 120–600 Hz and env = MEG value 0..1.
- Ranges used in DP-303: cutoff 200 Hz–4 kHz, Q 1–25, decay 10–400 ms, accent gain 1–3× [14].

```js
// per step: gate ≈ 50% of step; if slide, hold gate into next step and glide
osc.frequency.setTargetAtTime(nextHz, tNext, 0.06/3); // ~95% in 60 ms
const dec = accent ? 0.2 : userDecay;                // MEG
filt.frequency.setValueAtTime(fc0 * 2**(envMod*4 + (accent? accAmt*1.5:0)), t+0.004);
filt.frequency.setTargetAtTime(fc0, t+0.004, dec/3);
```

### Dub techno chord stab

**Voicings** (semitones from the root):

| Chord | Intervals |
|---|---|
| m7 | `[0,3,7,10]` |
| m9 | `[0,3,7,10,14]` |
| m11 | `[0,3,7,10,14,17]` |
| Open m7 | `[0,7,10,15]` |
| sus4 add7 | `[0,5,7,10]` |
| Minor triad | `[0,3,7]` (Ableton notes dub chords are often plain minor triads with varied voicing) |

Play them in octave 3–4: C3 = 130.8 Hz, so a root around 87–175 Hz.

**Synthesis** [21]:
- 2–3 saws per note, detuned ±7 cents, plus optional low-level noise.
- Filter envelope with a **slow attack (≈80/127, roughly 40–80 ms)**. Amplitude: attack 3 ms, decay 150–300 ms, sustain 0.1.
- Highpass at about 80/127 with resonance 20/127. A phaser helps.
- EQ: -7 dB at 600 Hz (wide Q), HPF 100 Hz, LPF 4.5 kHz.

**Delay send** [21]:
- Tap A: 1/8 dotted, feedback ~20%.
- Tap B: 264 ms (unsynced), feedback ~85%.
- Send filter: HPF 280 Hz, LFO 0.25 Hz.
- Send level 100%, fully wet.
- Put a lowpass at 2.5–3.5 kHz inside the feedback loop so repeats darken, plus `tanh` for tape character.
- Duck the chords and the delay return from the kick, with the fastest attack [22].

### Reese bass

- Two saws detuned **±25 cents** (range ±25 to ±61 cents). One tutorial tuned the beating to the tempo, which needed ±61 cents [19].
- Optionally add a third saw one octave down.
- LPF at 300–900 Hz, Q 1–3. Slow LFO on cutoff, 1/2–2 bars.
- Keep a mono sine sub below 120 Hz.

### Detroit strings/pads (supersaw)

These come from Szabo's JP-8000 analysis, as coded in a public gist [17][18]:

```js
const OFF = [-0.11002313,-0.06288439,-0.01952356,0.01991221,0.06216538,0.10745242];
const detuneCurve = x => 10028.7312891634*x**11 - 50818.8652045924*x**10 + 111363.4808729368*x**9
 - 138150.6761080548*x**8 + 106649.6679158292*x**7 - 53046.9642751875*x**6 + 17019.951858008*x**5
 - 3425.0836591318*x**4 + 404.2703938388*x**3 - 24.1878824391*x**2 + 0.6717417634*x + 0.0030115596;
// side saw i: f + f*detuneCurve(d)*OFF[i];  d in 0..1
const centerGain = m => -0.55366*m + 0.99785;
const sideGain   = m => -0.73764*m*m + 1.2841*m + 0.044372;
// then HPF at the note frequency (the original high-passes the summed saws)
```

- Pads: attack 300–800 ms, release 1–2 s.
- LPF at 2–4 kHz, chorus (two delays of 7–15 ms modulated at 0.3–0.8 Hz), reverb 2.5 s.
- Randomise oscillator start phases so notes don't flam.

### Hoover

Alpha Juno "What The?" style [20]:
- PWM saw plus a pulse, with PWM depth at full and a fast PWM LFO. A Web Audio substitute is two saws, one inverted and delayed, with the delay modulated.
- 3 voices spread over octaves.
- Pitch envelope: glide up from -12 semitones over 150–300 ms. On release, dive by -5 to -12 semitones.
- Heavy chorus.

### FM stab/bell

These are Chowning's 1973 settings [16]:

| Sound | Carrier | Modulator | Ratio | Max index | Duration | Index envelope |
|---|---|---|---|---|---|---|
| Bell | 200 Hz | 280 Hz | 1:1.4 | 10 | 15 s | Follows the exponential amplitude envelope |
| Drum | 200 Hz | 280 Hz | 1:1.4 | 2 | 0.2 s | Same |
| Brass | — | — | 1:1 | — | — | Index tied to amplitude |

In Web Audio the deviation is set on the modulator's gain: `modGain.gain = I * fm` (in Hz), so 10 × 280 = 2800 Hz for the bell.

For a techno FM stab, use a 1:2 or 1:3.5 ratio with the index going 6 → 0.5 over 120 ms.

### Sub and pluck

- **Sub bass**: sine at 40–80 Hz, attack 5 ms, release 30 ms. Optionally use tanh with k 1.5 for audibility on small speakers. Keep it mono.
- **Pluck**: saw or square → LPF from 4 kHz down to 300 Hz with τ 40 ms, Q 4 → amplitude decay τ 80 ms. Karplus-Strong is also possible: noise burst → DelayNode (1/f) → LPF → feedback 0.97.

---

## 4. Music theory for techno

**Scales** (semitones from the root):

```js
const SCALES = { aeolian:[0,2,3,5,7,8,10], phrygian:[0,1,3,5,7,8,10], dorian:[0,2,3,5,7,9,10],
  minPent:[0,3,5,7,10], harmMinor:[0,2,3,5,7,8,11], phrygDom:[0,1,4,5,7,8,10], locrian:[0,1,3,5,6,8,10] };
const hz = midi => 440 * 2**((midi-69)/12);
```

**Root keys.**
- Pick roots whose fundamental sits near kick pitch: E1 41.2 Hz, F1 43.7, F#1 46.2, G1 49.0, A1 55.0.
- The 808 kick's ~49.5–56 Hz resonance [2] constrains harmony and transposition [3].
- Practical defaults: F, F#, G or A minor. Use Phrygian for dark/Berlin/industrial, Dorian for Detroit and dub, minor pentatonic for acid.

**Euclidean rhythms** (Björklund's algorithm, per Toussaint). The code below is tested: E(3,8) gives `x..x..x.`, E(5,8) gives `x.xx.xx.`, and E(5,13) gives `x..x.x..x.x..`. That matches Toussaint's paper. E(5,13) is also the test case one developer used to find wrong implementations [43].

```js
function bjorklund(k, n) {
  if (k <= 0) return Array(n).fill(0); if (k >= n) return Array(n).fill(1);
  let a = Array.from({length:k}, () => [1]), b = Array.from({length:n-k}, () => [0]);
  while (b.length > 1) { const m = Math.min(a.length, b.length), na = [];
    for (let i=0;i<m;i++) na.push(a[i].concat(b[i]));
    const rest = a.length > m ? a.slice(m) : b.slice(m); a = na; b = rest; }
  return a.concat(b).flat();
}
const rotate = (p, r) => p.slice(r).concat(p.slice(0, r));
// Bresenham shortcut (same set up to rotation): i => ((i*k) % n) < k
```

Useful values: E(3,8) tresillo, E(5,16) and E(7,16) for percussion, E(9,16) for rolling hats.

**Probability and Markov acid lines.**
- Per-step probabilities: note 0.6–0.8, rest the remainder, accent 0.2–0.3, slide 0.15–0.25 (never slide into a rest), octave jump 0.15.
- Give the root note the highest weight [44's KVR context].
- Markov approach: a transition table over scale degrees, with separate chains for accent and slide. schollz's acid-test uses separate bass, lead and accent chains [44].

```js
const T = {0:{0:.35,2:.1,3:.2,7:.2,12:.15}, 3:{0:.4,5:.2,7:.4}, 7:{0:.3,10:.3,12:.2,3:.2}, /*...*/};
const pick = row => { let r=Math.random(); for (const [k,p] of Object.entries(row)) if ((r-=p)<=0) return +k; return 0; };
```

**Polymeter.**
- Each track has its own length: `step = globalStep % track.len`.
- 16 against 12 realigns after 48 steps (3 bars). 16 against 7 realigns after 112 steps. 16 against 5 realigns after 80.
- Example: a 5/4 conga loop over a 4/4 beat [35].
- Polyrhythm via "ratchet": divide a step into 2, 3 or 4 sub-hits.

---

## 5. Mix and FX maths

**Timing:**

```js
const beat = 60/bpm, step16 = beat/4;
const delayDotted8 = beat*0.75, delay8 = beat/2, delay3_16 = step16*3;
// Linn swing s (0.5..0.75): delay every 2nd 16th within each 8th
const swingOffset = (stepIdx, s) => (stepIdx % 2 === 1) ? (2*s - 1) * step16 : 0; // s=0.66 → +0.32 step
const lfoHz = (bpm, beats) => bpm / 60 / beats;
```

The swing formula follows from Linn's definition: swing is the ratio of time between the first and second 16th inside each 8th note [26].

**Sidechain ducking.**
- Starting points for techno: attack 1–10 ms, release 30–300 ms, ratio 4:1 to 10:1. At 128 BPM, a 200–350 ms release gives the tightest pump [37].
- Very fast attacks on bass cause clicks [37].
- Gain-envelope version, which is cheaper and more predictable than a compressor:
  ```js
  g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t);
  g.gain.linearRampToValueAtTime(depth /*0.1–0.4*/, t + 0.004);
  g.gain.setTargetAtTime(1, t + 0.02, release/3);   // release ≈ beat*0.5
  ```

**Saturation curves** (WaveShaper, 2048–8192 points, `oversample='4x'`):

```js
const curve = (fn, n=4096) => Float32Array.from({length:n}, (_,i) => fn(i*2/(n-1) - 1));
const tanhC = k => curve(x => Math.tanh(k*x)/Math.tanh(k));
const softClip = curve(x => { const y = 1.5*x; return Math.abs(y) < 1 ? y - y**3/3 : Math.sign(y)*2/3; }); // ×1.5 to normalise
const mdn = k => curve(x => ((3+k)*x*20*Math.PI/180)/(Math.PI + k*Math.abs(x))); // MDN example
const crush = bits => curve(x => Math.round(x*2**(bits-1))/2**(bits-1));        // bit-depth only
```

The MDN curve is the example from its WaveShaper docs, used with k = 400 [39]. Sample-rate reduction (hold every Nth sample) needs an AudioWorklet.

**Generated convolution reverb.** Exponentially decaying white noise works as a reverb impulse (Moorer, via reverbGen [41]). For RT60 = T, the envelope is 10^(-3t/T):

```js
function makeIR(ctx, T=2.5, pre=0.01, fadeIn=0.005) {
  const sr = ctx.sampleRate, len = Math.ceil(sr*(T+pre)), ir = ctx.createBuffer(2, len, sr);
  for (let c=0;c<2;c++){ const d = ir.getChannelData(c);
    for (let i=0;i<len;i++){ const t = i/sr - pre; if (t<0) continue;
      d[i] = (Math.random()*2-1) * Math.pow(10, -3*t/T) * Math.min(1, t/fadeIn); } }
  return ir; // ConvolverNode.normalize = true by default
}
```

For a darker tail, filter the impulse progressively: render it through a lowpass sweeping from 8 kHz to 1 kHz in an OfflineAudioContext.

**Master chain**: bus → tanh(k 1.2) → DynamicsCompressor (threshold -6 dB, knee 0, ratio 20, attack 0.002 s, release 0.12 s) → gain 0.9 → destination.
- Spec defaults are threshold -24, knee 30, ratio 12, attack 0.003, release 0.25. Override them all.
- The compressor adds about 6 ms of fixed lookahead latency [40].

---

## 6. Arrangement

**Phrase grid.**
- Use 8-bar blocks with 4-bar transitions and 16-bar breakdowns [49].
- Typical sequence: intro 16 → build 16 → drop 16 → break 16 → drop 16 [49].
- Give a DJ intro of at least 16 bars, drums only [49].

**Template at 130 BPM** (one bar = 1.846 s, 192 bars ≈ 5:54):

| Bars | Section | Active elements |
|---|---|---|
| 1–16 | Intro | Kick, closed hat, perc (DJ mix-in) |
| 17–32 | | + bass, clap, open hat |
| 33–64 | Groove A | + stab/303; filter opens 300 Hz → 6 kHz over 32 bars |
| 65–80 | Breakdown | Kick out; pads, reverb up, riser in the last 8 |
| 81–112 | Drop / Groove B | Everything in; variation every 8 bars |
| 113–128 | Mini-break | Kick and percussion only, 303 resonance sweep |
| 129–160 | Groove C | Full, extra percussion |
| 161–192 | Outro | Strip back in the reverse order of the intro |

**Rule**: change something every 8 bars (mute, fill, filter), and something bigger every 16–32.

**Filter sweep automation:**
```js
f.frequency.setValueAtTime(200,t0);
f.frequency.exponentialRampToValueAtTime(8000,t0+bars*barDur);
```
Use Q 1–6. On the master in the last 4 bars of a build, add a HPF going 20 → 250 Hz, then reset it at the drop.

**Riser recipe** (8–16 bars):
- White noise → BPF with Q 3, swept exponentially 400 Hz → 9 kHz.
- Gain from 0.03 to 0.5, using `setTargetAtTime` or a linear ramp.
- Optionally add a stereo delay at 1/8 with feedback 0.5.
- Snare roll alongside: 1/4 → 1/8 → 1/16 → 1/32, doubling every 2 bars, with velocity rising from 0.4 to 1.
- At the drop: one beat of silence, or cut the riser to 0 over 5 ms.

**Song mode / pattern chaining.**

```js
pattern = { len:16, tracks:{ kick:{ steps:[{on,vel,acc,prob:1,cond:null,ratchet:1,locks:{}}], len:16, mute:false } } };
song = [{ pat:'A', repeats:4 }, { pat:'B', repeats:4 }, { pat:'A', repeats:3 }, { pat:'FILL', repeats:1 }];
// scheduler: at bar boundary (globalStep % 16 === 0), advance repeat counter → next chain entry;
// "queue next pattern" UI = set pendingPattern, swapped only on the boundary.
```

- Elektron-style conditions: `A:B` plays on loop A of every B loops, `FILL`, `1ST`, `PRE`, `NEI` and percent probability [45].
- Parameter locks: per-step overrides that are applied at schedule time and reset on the next step.

---

## 7. Web Audio implementation best practices

**Scheduler** (Chris Wilson's "A tale of two clocks") [38]:
- A `setTimeout` every **25 ms** schedules every note that falls within the next **100 ms** of `ctx.currentTime`.
- Tempo changes take up to 100 ms to apply.
- Drive the timer from a Worker so background tabs don't throttle it.

```js
function tick(){ while (nextTime < ctx.currentTime + 0.1) { schedule(step, nextTime + swingOffset(step%16, swing)); nextTime += 60/bpm/4; step++; } }
setInterval(tick, 25);
```

**Avoiding clicks:**
- `exponentialRampToValueAtTime` throws on 0 [39]. Ramp to 0.0001, then `setValueAtTime(0, t+ε)`.
- `setTargetAtTime` reaches 63.2% / 86.5% / 95% / 99.3% after 1 / 2 / 3 / 5 time constants. For 95% in time T, use τ = T/3 [39].
- Always start envelopes with `setValueAtTime(0,t)` and then a 1–3 ms linear attack.
- Stop oscillators at `tEnd + 5τ`.
- On retrigger, use `cancelAndHoldAtTime` if the browser has it (check Firefox), otherwise `cancelScheduledValues` + `setValueAtTime(current)`.

**Voice handling:**
- Drums: create fresh oscillator, source and gain nodes per hit. They are one-shot and cheap.
- If you reuse long-lived gain nodes, their automation event lists grow; swap in fresh GainNodes periodically [40].
- Poly synths: cap at 6–8 voices and steal the oldest with `setTargetAtTime(0,t,0.003)` and `stop(t+0.03)`.
- Mono 303: one persistent oscillator plus filter, with only parameters automated. Slide depends on this.

**CPU** [40]:
- ConvolverNode is very expensive and scales with impulse length. Use one shared reverb send of 2–3 s, not one per voice.
- WaveShaper oversampling costs extra. Use '4x' only on the master/kick.
- Biquads are cheap, with 2 frames of latency.
- Set constant params via `.value`.
- k-rate parameters update once per 128-frame block.

**AudioWorklet vs nodes**: use native nodes for everything above. Reach for AudioWorklet only for:
- sample-rate reduction (bitcrush),
- a true ZDF/diode ladder 303 filter,
- a noise source with per-sample control.

**Gain staging:**
- Voice peaks: kick 0.8, clap 0.4, hats 0.15–0.25, bass 0.5, pads 0.2.
- Sum to a drum bus and a music bus at 0.7 each, which leaves about -6 dB of headroom before the master tanh and limiter.
- Use a 1/√N gain on chords.

**Export:**
- **Real time**: `const d = ctx.createMediaStreamDestination(); master.connect(d); new MediaRecorder(d.stream)`. This produces webm/opus. Decode it, then encode WAV.
- **Better**: rebuild the graph in `new OfflineAudioContext(2, sr*seconds, 44100)` with the same `schedule()` functions (pass a ctx parameter), then call `startRendering()`, which returns an AudioBuffer [39].
- WAV encoder (16-bit PCM, 44-byte header) [42]:

```js
function wav(buf){ const ch=buf.numberOfChannels, sr=buf.sampleRate, n=buf.length, dv=new DataView(new ArrayBuffer(44+n*ch*2));
 const w=(o,s)=>[...s].forEach((c,i)=>dv.setUint8(o+i,c.charCodeAt(0)));
 w(0,'RIFF'); dv.setUint32(4,36+n*ch*2,true); w(8,'WAVEfmt '); dv.setUint32(16,16,true); dv.setUint16(20,1,true);
 dv.setUint16(22,ch,true); dv.setUint32(24,sr,true); dv.setUint32(28,sr*ch*2,true); dv.setUint16(32,ch*2,true);
 dv.setUint16(34,16,true); w(36,'data'); dv.setUint32(40,n*ch*2,true);
 const d=[...Array(ch)].map((_,c)=>buf.getChannelData(c)); let o=44;
 for(let i=0;i<n;i++) for(let c=0;c<ch;c++){ const s=Math.max(-1,Math.min(1,d[c][i])); dv.setInt16(o,s<0?s*0x8000:s*0x7FFF,true); o+=2; }
 return new Blob([dv],{type:'audio/wav'}); }
```

---

## 8. UX references for beginners

- **Ableton Learning Synths / Learning Music** [47]:
  - Starts "absurdly simple" (one wave, one filter shape) and adds one concept per page.
  - Monochrome geometric shapes you drag directly.
  - Ends in a free Playground.
  - Learning Music presents the beat grid as "the inside of a pattern" and invites you to click cells. Lessons go in order: tempo, then genre, then backbeats, then bars.
  - Takeaway: progressive disclosure, with an advanced panel collapsed by default.
- **Roland TR-8S/TR-8** [46]:
  - 16 coloured step keys in groups of 4.
  - Per-instrument select, then the steps.
  - A dedicated ACCENT lane.
  - Sub-steps (hold step + knob) for rolls, with probability.
  - Step-loop for live play.
  - 8 variations (A–H) plus fills per pattern, chainable.
  - Takeaway: a group-of-4 colour banding on the grid is cheap and helps beginners read the bar instantly.
- **Elektron** [45]:
  - Parameter locks: hold a step and turn a knob. The locked step is shown inverted.
  - Trig conditions per step (`A:B`, `FILL`, `1ST`, `PRE`/`NEI`, `%`).
  - Takeaway: power hidden behind "hold step + edit", invisible until wanted.
- **io-808** [48]: a faithful skeuomorph of the 808 panel. People recognise it, and the familiarity helps. Synthesis is pure Web Audio, and the code is readable for porting [8].
- **Concrete suggestions for your UI:**
  - One colour per instrument row, with a playhead column highlight.
  - A genre preset dropdown that loads BPM, swing, patterns and sound parameters from the table in §1.
  - Constrained "randomise" buttons (Euclidean or probability) with undo.
  - Accent shown as a brighter cell; long-press or shift-click for probability and ratchet.
  - Tooltips with plain-language names ("Decay = how long it rings").
  - Mute/solo per row.
  - A pattern bank A–H with queue-on-bar-boundary.
  - A visible bar counter, e.g. "bar 9/16", to teach phrasing.

---

## Caveats

- The 909 clap figures (11 ms spacing, ~1140 Hz, Q ~1.95) come from a forum post that works from the schematic. No one in the thread confirmed them [7].
- I found no circuit-level analysis of the 909 kick's pitch sweep. The 909 kick values above are starting points built on the SOS block description [4].
- Most published tutorials hide exact step grids behind images or downloads. The pattern strings in §1b are my translation of what they describe in words.
- Tempo ranges move over time, and sources disagree, especially for hard techno [32][34].
- I could not fetch the original Opera dev drum article, so I have not used its hi-hat numbers.

---

## Sources

1. Werner, Abel, Smith, "A Physically-Informed, Circuit-Bendable, Digital Model of the Roland TR-808 Cymbal", ICMC-SMC 2014 — https://speech.di.uoa.gr/ICMC-SMC-2014/images/VOL_2/1453.pdf
2. Werner, Abel, Smith, TR-808 bass drum model, DAFx-14 — https://dafx14.fau.de/papers/dafx14_kurt_james_werner_a_physically_informed,_ci.pdf
3. "Harmonic and transposition constraints arising from the use of the Roland TR-808 bass drum" — https://arxiv.org/pdf/2502.07524
4. SOS Synth Secrets, Practical Bass Drum Synthesis — https://www.soundonsound.com/techniques/practical-bass-drum-synthesis
5. SOS, Practical Snare Drum Synthesis — https://www.soundonsound.com/techniques/practical-snare-drum-synthesis
6. SOS, Practical Cymbal Synthesis — https://www.soundonsound.com/techniques/practical-cymbal-synthesis
7. KVR, "Emulating the TR-909(808) clap in detail" — https://www.kvraudio.com/forum/viewtopic.php?p=8606994
8. io-808 source (src/synth/drumModules, basics) — https://github.com/vincentriemer/io-808
9. TR-808 Cowbell with Web Audio (outputchannel) — https://hn.jakechampion.name/reader/http://outputchannel.com/post/tr-808-cowbell-web-audio
10. Hackaday, How the 808 cowbell worked — https://hackaday.com/2022/05/12/how-the-roland-808-cowbell-worked
11. Electric Druid, TR-909 noise generator — https://electricdruid.net/tr-909-noise-generator/
12. Devil Fish manual (Robin Whittle) — https://www.firstpr.com.au/rwi/dfish/Devil-Fish-Manual.pdf
13. Whittle, What makes the TB-303 unique — https://www.firstpr.com.au/rwi/dfish/303-unique.html
14. DP-303 design notes (Web Audio 303) — https://tnn1t1s.github.io/day-303/about.html
15. KVR Open303 thread — https://www.kvraudio.com/forum/viewtopic.php?p=3760402
16. Chowning, "The Synthesis of Complex Audio Spectra by Means of FM" (1973) — https://web.eecs.umich.edu/~fessler/course/100/misc/chowning-73-tso.pdf
17. Supersaw (Szabo) implementation gist — https://gist.github.com/audionerd/fe50790b7601cba65ddd855caffb05ad
18. Roland JP-8000 / Supersaw (cites Szabo 2010) — https://en.wikipedia.org/wiki/Roland_JP-8000
19. Reese: https://www.musicradar.com/how-to/classic-reese-bass-renegade-terrorist ; https://blog.native-instruments.com/reese-bass/
20. Hoover: https://en.wikipedia.org/wiki/Roland_Alpha_Juno ; https://www.musicradar.com/how-to/how-to-design-a-dominator-style-hoover-sound-with-audiorealisms-redominator
21. Attack, Dub Techno Synth Chords — https://www.attackmagazine.com/technique/synth-secrets/dub-techno-synth-chords/
22. Attack, Basic Channel-style dub techno — https://www.attackmagazine.com/technique/beat-dissected/basic-channel-style-dub-techno/
23. Attack, Thumping techno — https://www.attackmagazine.com/technique/beat-dissected/thumping-techno/
24. Attack, Motor City Detroit techno — https://www.attackmagazine.com/technique/beat-dissected/motor-city-detroit-techno/
25. Attack, Swing in DAWs/drum machines — https://www.attackmagazine.com/technique/passing-notes/daw-drum-machine-swing/
26. Attack, Roger Linn on swing — https://attackmagazine.com/features/interview/roger-linn-swing-groove-magic-mpc-timing/2
27. Roland TR-909 (software) manual — https://www.rolandcloud.com/getmedia/a88fc05f-0b9f-4ba2-8266-b2272ba31572/TR-909-Manual-E.pdf
28. Wikipedia, Roland TR-909 — https://en.wikipedia.org/wiki/Roland_TR-909
29. Wikipedia, Dub techno — https://en.wikipedia.org/wiki/Dub_techno
30. Wikipedia, Gabber — https://en.wikipedia.org/wiki/Gabber
31. Wikipedia, Electro (music) — https://en.wikipedia.org/wiki/Electro_(music)
32. Mixgraph techno BPM data — https://www.mixgraph.io/bpm-for/techno ; https://www.mixgraph.io/bpm-for/industrial-techno
33. Orphiq, subgenres by BPM — https://orphiq.com/resources/types-of-electronic-music
34. Hard techno/schranz: https://futureproofmusicschool.com/blog/what-is-hard-techno ; https://www.soundbridge.io/schranz
35. MusicRadar: Jeff Mills 909 https://www.musicradar.com/how-to/how-to-program-jeff-mills-style-rolling-tr-909-drums ; electro https://musicradar.com/how-to/how-to-program-a-classic-electro-drum-track ; Berlin beat https://www.musicradar.com/news/beat-building-how-to-make-berlin-techno-beat
36. Rumble kick: https://musicradar.com/how-to/how-to-create-rumbling-techno-kick-drums-with-reverb ; https://www.bonedo.de/artikel/bass-drum-rumble-rattle-for-techno ; https://www.attackmagazine.com/technique/tutorials/adding-reverb-techno-kick/
37. Sidechain: https://www.gearnews.com/sidechain-compression-in-techno-workshop/ ; https://musicradar.com/tuition/tech/13-ways-to-use-sidechaining-more-effectively-625016
38. Chris Wilson, A tale of two clocks — https://web.dev/articles/audio-scheduling
39. MDN: https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime ; https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/exponentialRampToValueAtTime ; https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createWaveShaper ; https://developer.mozilla.org/en-US/docs/Web/API/OfflineAudioContext ; https://developer.mozilla.org/en-US/docs/Web/API/DynamicsCompressorNode
40. Paul Adenot, Web Audio performance notes — https://padenot.github.io/web-audio-perf/
41. reverbGen (Moorer-style noise IR) — https://github.com/adelespinasse/reverbGen
42. audiobuffer-to-wav — https://github.com/Jam3/audiobuffer-to-wav
43. Euclidean rhythms (Toussaint-faithful lib) — https://github.com/mkontogiannis/euclidean-rhythms
44. schollz acid-test (Markov acid) — https://github.com/schollz/acid-test
45. Elektronauts trig conditions — https://www.elektronauts.com/t/a4-k-mkii-trig-conditions-thread/16997 ; https://www.elektronauts.com/t/nei-and-pre-trig-conditions/51959
46. Roland TR-8S reference / product — https://static.roland.com/assets/media/pdf/TR-8S_Reference_eng04_W.pdf ; https://www.roland.com/global/products/tr-8s/
47. Ableton Learning Synths/Music — https://cdm.link/learn-synthesis-basics-in-your-browser-free-with-ableton/ ; https://learningmusic.ableton.com/make-beats/make-beats.html
48. io-808 coverage — https://www.musicradar.com/news/tech/io-808-could-be-the-best-browser-based-drum-machine-yet-641236
49. Arrangement: https://beatkitchen.io/guides/electronic-music/06-arrangement-and-energy/ ; https://musicradar.com/news/song-arrangement-template-explained ; https://www.elektronauts.com/t/simple-tips-in-techno-structure/151609
50. Erica Synths HiHat manual (606 oscillator set) — https://www.ericasynths.lv/media/HIHAT_MANUAL_1.pdf