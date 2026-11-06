// Synthesized SFX + original spy-surf theme (WebAudio). No samples.
let ctx = null, master, sfxBus, musicBus, noiseBuf;
export const audioState = { musicOn: true, sfxVol: 0.8, musicVol: 0.45 };
export function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
  sfxBus = ctx.createGain(); sfxBus.gain.value = audioState.sfxVol; sfxBus.connect(master);
  musicBus = ctx.createGain(); musicBus.gain.value = audioState.musicOn ? audioState.musicVol : 0; musicBus.connect(master);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}
export function setMusicOn(on) { audioState.musicOn = on; if (musicBus) musicBus.gain.setTargetAtTime(on ? audioState.musicVol : 0, ctx.currentTime, 0.1); }
function noise(t, dur, f0, f1, q, vol, type = 'lowpass', bus = sfxBus) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  s.connect(f); f.connect(g); g.connect(bus); s.start(t, Math.random()); s.stop(t + dur + 0.05);
}
function tone(t, dur, f0, f1, type, vol, bus = sfxBus, attack = 0.005) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
}
export function sfx(name, vol = 1) {
  if (!ctx || ctx.state !== 'running') return; const t = ctx.currentTime; vol *= 1;
  switch (name) {
    case 'knife': noise(t, 0.15, 6000, 1500, 1, 0.4 * vol, 'bandpass'); break;
    case 'pistol': noise(t, 0.18, 3000, 300, 1, 0.9 * vol); tone(t, 0.08, 300, 80, 'square', 0.25 * vol); break;
    case 'shotgun': noise(t, 0.4, 2500, 150, 0.7, 1.0 * vol); tone(t, 0.15, 150, 50, 'square', 0.4 * vol); break;
    case 'mg': noise(t, 0.1, 3500, 400, 1, 0.7 * vol); break;
    case 'rocket': noise(t, 0.6, 800, 200, 0.5, 0.7 * vol); tone(t, 0.4, 200, 60, 'sawtooth', 0.2 * vol); break;
    case 'mine': tone(t, 0.12, 900, 400, 'square', 0.25 * vol); noise(t, 0.1, 2000, 800, 1, 0.3 * vol); break;
    case 'laser': tone(t, 0.25, 2400, 200, 'sawtooth', 0.25 * vol); tone(t, 0.25, 1800, 150, 'square', 0.12 * vol); break;
    case 'grenade': tone(t, 0.15, 180, 90, 'triangle', 0.5 * vol); noise(t, 0.15, 1200, 300, 1, 0.4 * vol); break;
    case 'boom': noise(t, 1.2, 1200, 40, 0.5, 1.2 * vol); tone(t, 0.6, 90, 30, 'sine', 0.8 * vol); break;
    case 'pickup': [0, 0.06, 0.12].forEach((d, i) => tone(t + d, 0.1, 660 * (1 + i * 0.26), 660 * (1 + i * 0.26), 'square', 0.15 * vol)); break;
    case 'power': [0, 0.08, 0.16, 0.24].forEach((d, i) => tone(t + d, 0.15, 440 * Math.pow(1.335, i), 440 * Math.pow(1.335, i), 'triangle', 0.25 * vol)); break;
    case 'hurt': tone(t, 0.2, 400, 120, 'square', 0.25 * vol); break;
    case 'die': tone(t, 0.8, 500, 50, 'sawtooth', 0.3 * vol); break;
    case 'jump': tone(t, 0.1, 200, 400, 'triangle', 0.15 * vol); break;
    case 'empty': tone(t, 0.04, 1200, 1200, 'square', 0.1 * vol); break;
    case 'switch': noise(t, 0.08, 4000, 2000, 2, 0.25 * vol, 'bandpass'); break;
    case 'hit': tone(t, 0.06, 1500, 1500, 'square', 0.12 * vol); break;
    case 'beep': tone(t, 0.1, 1000, 1000, 'square', 0.15 * vol); break;
  }
}
// ---------- MUSIC: original 60s spy / surf-guitar style theme ----------
// Key of D minor. Original riff (not derived from any film theme).
const N = n => 440 * Math.pow(2, (n - 69) / 12);
let musicTimer = null, step = 0, nextTime = 0, mode = 'lobby', tempo = 138;
// 16 steps per bar (16ths), 4 bar loop = 64 steps. null = rest
// Guitar riff (MIDI notes), tremolo picked
const riffA = [50,null,50,53, null,55,null,56, 57,null,null,55, 53,null,50,null,
               50,null,50,53, null,55,null,53, 60,null,58,null, 57,null,null,null,
               50,null,50,53, null,55,null,56, 57,null,null,60, 62,null,61,null,
               60,null,58,null, 57,null,55,null, 53,null,52,null, 50,null,null,null];
const riffB = [62,null,null,62, 61,null,60,null, 59,null,null,null, 58,null,57,null,
               57,null,null,57, 58,null,57,null, 55,null,null,null, 53,null,null,null,
               62,null,null,62, 61,null,60,null, 59,null,null,60, 62,null,65,null,
               64,null,62,null, 61,null,null,null, 57,null,null,null, null,null,null,null];
// bass: walking-ish, chromatic approach notes (beats only)
const bassA = [38,41,43,44, 45,43,41,40, 38,41,43,44, 45,46,45,44, 
               43,46,48,49, 50,48,46,45, 45,44,43,42, 41,40,39,37];
const chords = [[62,65,69],[62,65,69],[60,64,67],[61,64,69]]; // Dm Dm C A
function guitar(t, n, dur, vol) {
  const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = N(n);
  const o2 = ctx.createOscillator(); o2.type = 'square'; o2.frequency.value = N(n) * 1.003;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(900, t + dur); f.Q.value = 4;
  const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.004);
  // tremolo picking
  const pick = dur / 3; for (let i = 1; i < 3; i++) { g.gain.setValueAtTime(vol * 0.35, t + i * pick - 0.01); g.gain.linearRampToValueAtTime(vol * 0.9, t + i * pick); }
  g.gain.exponentialRampToValueAtTime(0.001, t + dur * 1.6);
  o.connect(f); o2.connect(f); f.connect(g); g.connect(musicFx);
  o.start(t); o2.start(t); o.stop(t + dur * 1.7); o2.stop(t + dur * 1.7);
}
function brass(t, notes, dur, vol) {
  notes.forEach(n => {
    for (const det of [0.997, 1.004]) {
      const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = N(n) * det;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(600, t); f.frequency.linearRampToValueAtTime(2800, t + 0.06); f.frequency.exponentialRampToValueAtTime(900, t + dur);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.03); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(f); f.connect(g); g.connect(musicBus); o.start(t); o.stop(t + dur + 0.05);
    }
  });
}
function bassNote(t, n, dur, vol) { tone(t, dur, N(n), N(n), 'triangle', vol, musicBus, 0.01); }
function drum(t, kind, vol) {
  if (kind === 'k') { tone(t, 0.25, 120, 40, 'sine', vol, musicBus); }
  else if (kind === 's') { noise(t, 0.18, 4000, 1200, 0.8, vol * 0.6, 'bandpass', musicBus); tone(t, 0.08, 220, 180, 'triangle', vol * 0.3, musicBus); }
  else if (kind === 'h') { noise(t, 0.05, 9000, 7000, 1, vol * 0.25, 'highpass', musicBus); }
  else if (kind === 'r') { noise(t, 0.3, 8000, 5000, 3, vol * 0.18, 'bandpass', musicBus); }
}
let musicFx;
function setupFx() {
  musicFx = ctx.createGain(); musicFx.gain.value = 1;
  const shaper = ctx.createWaveShaper(); const c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = Math.tanh(x * 2.5); } shaper.curve = c;
  const dl = ctx.createDelay(); dl.delayTime.value = 0.11; const fb = ctx.createGain(); fb.gain.value = 0.45; const wet = ctx.createGain(); wet.gain.value = 0.35;
  musicFx.connect(shaper); shaper.connect(musicBus); shaper.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(musicBus);
}
function schedule() {
  const spb = 60 / tempo / 4; // 16th
  while (nextTime < ctx.currentTime + 0.25) {
    const s = step % 64, bar = Math.floor(s / 16), b16 = s % 16, section = Math.floor(step / 64) % 4;
    const swing = (b16 % 2 === 1) ? spb * 0.28 : 0; const t = nextTime + swing;
    const game = mode === 'game';
    // drums: swing ride + kick/snare
    if (game || section > 0) {
      if (b16 % 4 === 0 || b16 % 4 === 3) drum(t, game ? 'r' : 'h', 0.7);
      if (game) { if (b16 === 0 || b16 === 10) drum(t, 'k', 0.7); if (b16 === 4 || b16 === 12) drum(t, 's', 0.6); }
      else if (b16 === 0) drum(t, 'k', 0.5);
    }
    // bass on quarter notes
    if (b16 % 4 === 0) bassNote(t, bassA[bar * 4 + b16 / 4 + (section % 2) * 16] || 38, spb * 3.6, game ? 0.45 : 0.35);
    // guitar riff
    const riff = (section === 3 && game) ? riffB : riffA;
    const n = riff[s];
    if (n && (game || section !== 0 || b16 < 12)) guitar(t, n - (game ? 0 : 0), spb * 1.8, game ? 0.16 : 0.12);
    // brass stabs: syncopated hits on bar 2 & 4
    if ((bar === 1 || bar === 3) && (b16 === 6 || b16 === 14) && (game || section >= 2)) brass(t, chords[bar], 0.35, 0.06);
    if (bar === 3 && b16 === 0 && game) brass(t, chords[bar].map(x => x - 12), 0.8, 0.05);
    nextTime += spb; step++;
  }
}
export function playMusic(m) {
  if (!initAudio()) return; if (!musicFx) setupFx();
  mode = m; tempo = m === 'game' ? 150 : 128;
  if (!musicTimer) { nextTime = ctx.currentTime + 0.1; step = 0; musicTimer = setInterval(schedule, 60); }
}
export function stopMusic() { clearInterval(musicTimer); musicTimer = null; }
export function getCtx() { return ctx; }
