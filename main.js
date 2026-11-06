import { makeKit, buildCharacter } from './chars3d.js';
import * as THREE from './three.module.js';
import * as L from './level.js';
import { initAudio, sfx, playMusic, setMusicOn, audioState } from './audio.js';

const $ = id => document.getElementById(id);
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
import { CHARACTERS as CHARS } from './characters.js';
const NC = CHARS.length;
const W = { // weapon table
  knife:   { name: 'KNIFE', melee: true, dmg: 55, rate: 0.45, range: 2.0, snd: 'knife', pri: 0 },
  pistol:  { name: 'PISTOL', dmg: 22, rate: 0.32, spread: 0.012, ammo: 14, max: 60, snd: 'pistol', pri: 1, color: 0xffee88 },
  shotgun: { name: 'SHOTGUN', dmg: 11, pellets: 8, rate: 0.9, spread: 0.075, ammo: 8, max: 32, snd: 'shotgun', pri: 4, color: 0xffcc66 },
  mg:      { name: 'MACHINE GUN', dmg: 11, rate: 0.085, spread: 0.035, ammo: 60, max: 200, snd: 'mg', pri: 3, auto: true, color: 0xffee88 },
  rocket:  { name: 'ROCKET LNCHR', proj: 'rocket', dmg: 110, splash: 3.8, rate: 1.0, ammo: 4, max: 12, snd: 'rocket', pri: 6 },
  mine:    { name: 'MINE GUN', proj: 'mine', dmg: 120, splash: 3.2, rate: 0.8, ammo: 4, max: 10, snd: 'mine', pri: 2 },
  laser:   { name: 'LASER', dmg: 34, rate: 0.26, spread: 0.004, ammo: 20, max: 60, snd: 'laser', pri: 5, beam: 0x30ffff },
  grenade: { name: 'GRENADE LNCHR', proj: 'grenade', dmg: 95, splash: 3.8, rate: 0.85, ammo: 6, max: 18, snd: 'grenade', pri: 4 },
};
const WORDER = ['knife', 'pistol', 'shotgun', 'mg', 'laser', 'grenade', 'rocket', 'mine'];
const BOTDIFF = {
  easy:   { react: 0.9, spread: 0.11, turn: 2.2, speed: 0.75, fov: 0.9, seek: 0.4 },
  normal: { react: 0.45, spread: 0.055, turn: 4.5, speed: 0.9, fov: 1.3, seek: 0.7 },
  hard:   { react: 0.18, spread: 0.022, turn: 9, speed: 1.0, fov: 2.2, seek: 1.0 },
};
const ITEMKINDS = { health: 'HEALTH', armor: 'BODY ARMOR', ammo: 'AMMO', inv: 'INVINCIBLE', invis: 'INVISIBLE' };

// ---------------- RENDERER ----------------
const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x101010); scene.fog = new THREE.Fog(0x101010, 8, 42);
const camera = new THREE.PerspectiveCamera(70, 1, 0.05, 60); scene.add(camera);
scene.add(new THREE.HemisphereLight(0xffffff, 0x554433, 1.6)); const sun = new THREE.DirectionalLight(0xffffff, 1.0); sun.position.set(0.3, 1, 0.5); scene.add(sun);
L.buildLevel(scene); L.buildNav();
function resize() {
  const w = window.innerWidth, h = window.innerHeight; const sc = window.__hiRes ? 1 : Math.min(1, 340 / Math.min(w, h));
  renderer.setSize(Math.round(w * sc), Math.round(h * sc), false); canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  camera.aspect = w / h; const hf = 78 * Math.PI / 180;
  camera.fov = w >= h ? 66 : Math.min(105, 2 * Math.atan(Math.tan(hf / 2) / camera.aspect) * 180 / Math.PI);
  camera.updateProjectionMatrix(); gyro.reset = true;
}
window.addEventListener('resize', resize);

// ---------------- MODELS ----------------
const lam = c => new THREE.MeshLambertMaterial({ color: c });
const boxG = new THREE.BoxGeometry(1, 1, 1);
function bx(mat, w, h, d, x, y, z, parent) { const m = new THREE.Mesh(boxG, mat); m.scale.set(w, h, d); m.position.set(x, y, z); parent.add(m); return m; }
function weaponMesh(w) {
  const g = new THREE.Group(); const dark = lam(0x2a2a2e), grey = lam(0x8a8e94), brown = lam(0x6a4020);
  switch (w) {
    case 'knife': bx(lam(0xd0d4d8), 0.03, 0.04, 0.32, 0, 0, -0.2, g); bx(dark, 0.04, 0.06, 0.14, 0, 0, 0.02, g); break;
    case 'pistol': bx(dark, 0.06, 0.08, 0.26, 0, 0, -0.1, g); bx(dark, 0.05, 0.14, 0.07, 0, -0.09, 0.0, g); break;
    case 'shotgun': bx(grey, 0.05, 0.05, 0.6, 0, 0.02, -0.3, g); bx(brown, 0.07, 0.09, 0.3, 0, -0.02, 0.05, g); bx(brown, 0.06, 0.05, 0.18, 0, -0.03, -0.25, g); break;
    case 'mg': bx(dark, 0.08, 0.1, 0.45, 0, 0, -0.15, g); bx(grey, 0.03, 0.03, 0.3, 0, 0.02, -0.5, g); bx(dark, 0.05, 0.16, 0.06, 0, -0.12, -0.12, g); break;
    case 'rocket': { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 6), lam(0x4a6a30)); m.rotation.x = Math.PI / 2; m.position.z = -0.2; g.add(m); bx(dark, 0.05, 0.12, 0.06, 0, -0.1, 0, g); break; }
    case 'mine': bx(lam(0xd0a020), 0.12, 0.12, 0.35, 0, 0, -0.15, g); bx(lam(0xc02020), 0.14, 0.14, 0.03, 0, 0, -0.34, g); bx(dark, 0.05, 0.12, 0.06, 0, -0.1, 0, g); break;
    case 'laser': bx(lam(0xe8eef4), 0.08, 0.1, 0.4, 0, 0, -0.15, g); bx(new THREE.MeshBasicMaterial({ color: 0x30ffff }), 0.05, 0.05, 0.08, 0, 0.0, -0.38, g); bx(lam(0x3050c0), 0.09, 0.03, 0.3, 0, 0.06, -0.12, g); break;
    case 'grenade': { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.35, 6), lam(0x5a6030)); m.rotation.x = Math.PI / 2; m.position.z = -0.2; g.add(m); bx(brown, 0.06, 0.08, 0.25, 0, -0.03, 0.08, g); break; }
  }
  return g;
}
const charKit = CHARS.map(c => makeKit(c));
function makeChar(ci) { return buildCharacter(CHARS[ci % NC], charKit[ci % NC]); }
function setCharGun(e) {
  const u = e.mesh.userData; if (u.gunName === e.weapon) return; if (u.gun) u.gunHold.remove(u.gun);
  u.gun = weaponMesh(e.weapon); u.gun.scale.setScalar(1.0); u.gun.position.z = 0.06; u.gunHold.add(u.gun); u.gunName = e.weapon;
  u.gun.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); u.mats.push(o.material); } });
}
function setOpacity(e, a) {
  const u = e.mesh.userData; if (u.alpha === a) return; u.alpha = a;
  for (const m of u.mats) { m.transparent = a < 1; m.opacity = a; m.depthWrite = a >= 1; }
}

// ---------------- VIEWMODEL ----------------
const vm = new THREE.Group(); vm.scale.setScalar(0.65); camera.add(vm); vm.position.set(0.22, -0.2, -0.35);
let vmGun = null, vmName = '';
const flash = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), new THREE.MeshBasicMaterial({ color: 0xffd060, transparent: true, opacity: 0, depthTest: false }));
flash.position.set(0, 0.02, -0.62); vm.add(flash);
function setVM(w) { if (vmName === w) return; if (vmGun) vm.remove(vmGun); vmGun = weaponMesh(w); vmGun.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.material.depthTest = false; o.renderOrder = 10; o.material.fog = false; } }); vm.add(vmGun); vmName = w; }

// ---------------- STATE ----------------
const G = {
  mode: 'title', online: false, isHost: true, room: null, send: () => {}, myId: 'me', code: '',
  ents: new Map(), items: [], projs: [], fx: [], settings: { frag: 10, time: 5, bots: 3, skill: 'normal' },
  endAt: 0, running: false, char: (+(localStorage.n64char || 0)) % NC, nick: localStorage.n64nick || '', roster: new Map(), pidc: 0,
};
const now = () => performance.now() / 1000;
function newEnt(o) {
  const e = Object.assign({ id: '', name: '', char: 0, bot: false, diff: 'normal', pos: new THREE.Vector3(5, 0, 5), vel: new THREE.Vector3(), yaw: 0, pitch: 0,
    hp: 100, armor: 0, alive: true, ammo: { knife: 1 }, weapon: 'knife', frags: 0, deaths: 0, inv: 0, invis: 0, lastFire: 0, onGround: true,
    tpos: new THREE.Vector3(), tyaw: 0, walk: 0, ai: {} }, o);
  e.mesh = makeChar(e.char); scene.add(e.mesh); e.tpos.copy(e.pos); setCharGun(e); return e;
}
function removeEnt(id) { const e = G.ents.get(id); if (e) { scene.remove(e.mesh); G.ents.delete(id); } }
const me = () => G.ents.get(G.myId);
function simulatedLocally(e) { return e.id === G.myId || (e.bot && G.isHost); }

// ---------------- INPUT ----------------
const input = { mx: 0, mz: 0, fire: false, jump: false, keys: {}, lookDX: 0, lookDY: 0 };
const gyro = { on: false, last: null, reset: true, sens: +(localStorage.n64sens || 1.2) };
let tsens = +(localStorage.n64tsens || 1.2), invertY = localStorage.n64inv === '1';
const zee = new THREE.Vector3(0, 0, 1), q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)), eul = new THREE.Euler(), q0 = new THREE.Quaternion(), dq = new THREE.Quaternion();
function onOrient(ev) {
  if (!gyro.on || ev.alpha == null) return;
  const D = Math.PI / 180; eul.set(ev.beta * D, ev.alpha * D, -ev.gamma * D, 'YXZ'); dq.setFromEuler(eul); dq.multiply(q1);
  const so = ((screen.orientation && screen.orientation.angle) || window.orientation || 0) * D; dq.multiply(q0.setFromAxisAngle(zee, -so));
  const f = new THREE.Vector3(0, 0, -1).applyQuaternion(dq); const yaw = Math.atan2(-f.x, -f.z), pitch = Math.asin(Math.max(-1, Math.min(1, f.y)));
  if (gyro.last && !gyro.reset) { let dy = yaw - gyro.last.yaw; if (dy > Math.PI) dy -= 2 * Math.PI; if (dy < -Math.PI) dy += 2 * Math.PI;
    const dp = pitch - gyro.last.pitch; if (Math.abs(f.y) < 0.97 && Math.abs(dy) < 1) input.lookDX += dy * gyro.sens; if (Math.abs(dp) < 1) input.lookDY += dp * gyro.sens * (invertY ? -1 : 1); }
  gyro.last = { yaw, pitch }; gyro.reset = false;
}
window.addEventListener('deviceorientation', onOrient);
async function enableGyro() {
  try { if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') { const r = await DeviceOrientationEvent.requestPermission(); if (r !== 'granted') { toast('Motion access denied - use drag to look'); gyro.on = false; updGyroBtns(); return; } } } catch (e) { }
  gyro.on = true; gyro.reset = true; updGyroBtns();
}
function updGyroBtns() { $('hbGyro').classList.toggle('on', gyro.on); $('mGyro').textContent = 'Motion look: ' + (gyro.on ? 'ON' : 'OFF'); }
$('hbGyro').onclick = () => { if (gyro.on) { gyro.on = false; updGyroBtns(); toast('Motion look OFF'); } else enableGyro().then(() => gyro.on && toast('Motion look ON - move your phone to aim')); };
$('mGyro').onclick = $('hbGyro').onclick;
$('hbCenter').onclick = () => { const p = me(); if (p) p.pitch = 0; gyro.reset = true; };
// joystick
const joy = $('joy'), knob = $('knob'); let joyId = null;
function joyMove(ev) { const r = joy.getBoundingClientRect(); let dx = (ev.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (ev.clientY - (r.top + r.height / 2)) / (r.height / 2);
  const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; } knob.style.transform = `translate(${dx * r.width / 2.6}px,${dy * r.height / 2.6}px)`; input.mx = dx; input.mz = dy; }
joy.addEventListener('pointerdown', ev => { joyId = ev.pointerId; try { joy.setPointerCapture(ev.pointerId); } catch (e) { } joyMove(ev); ev.preventDefault(); });
joy.addEventListener('pointermove', ev => { if (ev.pointerId === joyId) joyMove(ev); });
const joyEnd = ev => { if (ev.pointerId !== joyId) return; joyId = null; input.mx = input.mz = 0; knob.style.transform = ''; };
joy.addEventListener('pointerup', joyEnd); joy.addEventListener('pointercancel', joyEnd);
// look pad (drag)
const pad = $('lookpad'); const padPts = new Map();
pad.addEventListener('pointerdown', ev => { try { pad.setPointerCapture(ev.pointerId); } catch (e) { } padPts.set(ev.pointerId, [ev.clientX, ev.clientY]); ev.preventDefault(); });
pad.addEventListener('pointermove', ev => { const p = padPts.get(ev.pointerId); if (!p) return; const s = tsens * 0.0055;
  input.lookDX -= (ev.clientX - p[0]) * s; input.lookDY -= (ev.clientY - p[1]) * s * (invertY ? -1 : 1); p[0] = ev.clientX; p[1] = ev.clientY; });
const padEnd = ev => padPts.delete(ev.pointerId); pad.addEventListener('pointerup', padEnd); pad.addEventListener('pointercancel', padEnd);
function holdBtn(id, on, off) { const b = $(id); b.addEventListener('pointerdown', ev => { ev.preventDefault(); try { b.setPointerCapture(ev.pointerId); } catch (e) { } on(); });
  b.addEventListener('pointerup', () => off && off()); b.addEventListener('pointercancel', () => off && off()); b.addEventListener('contextmenu', e => e.preventDefault()); }
holdBtn('bFire', () => input.fire = true, () => input.fire = false);
holdBtn('bJump', () => input.jump = true, () => input.jump = false);
holdBtn('bSwitch', () => { const p = me(); if (p) switchWeapon(p, 1); });
// keyboard / mouse
window.addEventListener('keydown', ev => { input.keys[ev.code] = true; if (G.mode !== 'game') return;
  const p = me(); if (ev.code === 'KeyQ' && p) switchWeapon(p, 1); if (ev.code === 'Tab') { ev.preventDefault(); showScores(true); }
  const n = +ev.key; if (n >= 1 && n <= 8 && p && p.ammo[WORDER[n - 1]] > 0) setWeapon(p, WORDER[n - 1]);
  if (ev.code === 'KeyT') pttSet(true); });
window.addEventListener('keyup', ev => { input.keys[ev.code] = false; if (ev.code === 'Tab' && G.mode === 'game' && !G.ended) showScores(false); if (ev.code === 'KeyT') pttSet(false); });
canvas.addEventListener('click', () => { if (G.mode === 'game' && !isTouch && canvas.requestPointerLock) canvas.requestPointerLock(); });
pad.addEventListener('mousedown', ev => { if (!isTouch && G.mode === 'game' && document.pointerLockElement !== canvas) canvas.requestPointerLock(); });
document.addEventListener('mousemove', ev => { if (document.pointerLockElement === canvas) { input.lookDX -= ev.movementX * 0.0025 * tsens; input.lookDY -= ev.movementY * 0.0025 * tsens * (invertY ? -1 : 1); } });
document.addEventListener('mousedown', ev => { if (document.pointerLockElement === canvas) input.mouseFire = true; });
document.addEventListener('mouseup', () => input.mouseFire = false);
document.addEventListener('wheel', ev => { if (G.mode === 'game' && me()) switchWeapon(me(), ev.deltaY > 0 ? 1 : -1); });
document.addEventListener('gesturestart', e => e.preventDefault());

// ---------------- UI ----------------
let toastT = 0; function toast(s, d = 2.5) { const t = $('toast'); t.textContent = s; t.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(() => t.style.display = 'none', d * 1000); }
function show(id) { for (const s of ['start', 'lobby', 'scores', 'menu']) $(s).classList.toggle('hidden', s !== id); $('hud').classList.toggle('hidden', G.mode !== 'game'); }
function buildChars() {
  const box = $('chars'); box.innerHTML = '';
  CHARS.forEach((c, i) => { const d = document.createElement('div'); d.className = 'char' + (i === G.char ? ' sel' : ''); d.innerHTML = `<img src="${c.img}"><div>${c.code}</div>`;
    d.onclick = () => { G.char = i; localStorage.n64char = i; buildChars(); sendHello(); if (!$('nick').value || CHARS.some(x => x.code === $('nick').value)) { $('nick').value = c.code; G.nick = c.code; localStorage.n64nick = c.code; } }; box.appendChild(d); });
}
$('nick').value = G.nick || CHARS[G.char].code;
$('nick').oninput = () => { G.nick = $('nick').value.trim().slice(0, 12); localStorage.n64nick = G.nick; sendHello(); };
const myName = () => (G.nick || CHARS[G.char].code).toUpperCase();
function firstTap() { initAudio(); playMusic('lobby'); if (isTouch && !gyro.on && (localStorage.n64ctrl || 'motion') === 'motion') enableGyro(); }
$('btnJoin').onclick = () => { firstTap(); G.online = true; G.mode = 'lobby'; $('lobbyTitle').textContent = 'ONLINE LOBBY'; $('onlineBox').classList.remove('hidden'); $('roomPick').classList.remove('hidden'); $('roomInfo').classList.add('hidden'); $('hostBox').classList.add('hidden'); $('waitHost').classList.add('hidden'); buildChars(); show('lobby'); };
$('btnBots').onclick = () => { firstTap(); leaveRoom(); G.online = false; G.isHost = true; G.mode = 'lobby'; $('lobbyTitle').textContent = 'PLAY VS BOTS'; $('onlineBox').classList.add('hidden'); $('hostBox').classList.remove('hidden'); $('waitHost').classList.add('hidden'); buildChars(); show('lobby'); };
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => { leaveRoom(); G.mode = 'title'; show('start'); });
function musicBtns() { const t = '\u266B Music: ' + (audioState.musicOn ? 'ON' : 'OFF'); $('btnMusic').textContent = t; $('mMusic').textContent = t; }
$('btnMusic').onclick = $('mMusic').onclick = () => { initAudio(); setMusicOn(!audioState.musicOn); musicBtns(); };
for (const id of ['botCount', 'botSkill', 'fragLimit', 'timeLimit']) $(id).onchange = () => { readSettings(); if (G.online && G.isHost) broadcastLobby(); };
function readSettings() { G.settings = { bots: +$('botCount').value, skill: $('botSkill').value, frag: +$('fragLimit').value, time: +$('timeLimit').value }; }
$('btnStart').onclick = () => { readSettings(); hostStartMatch(); };
$('hbScore').onclick = () => showScores($('scores').classList.contains('hidden'));
$('btnCloseScores').onclick = () => showScores(false);
$('hbMenu').onclick = () => { $('menu').classList.remove('hidden'); document.exitPointerLock && document.exitPointerLock(); };
$('mResume').onclick = () => { $('menu').classList.add('hidden'); document.querySelectorAll('.padfocus').forEach(e => e.classList.remove('padfocus')); };
$('mQuit').onclick = () => { $('menu').classList.add('hidden'); endLocal(); leaveRoom(); G.mode = 'title'; show('start'); playMusic('lobby'); };
$('sens').value = gyro.sens; $('tsens').value = tsens; $('invertY').checked = invertY;
$('sens').oninput = () => { gyro.sens = +$('sens').value; localStorage.n64sens = gyro.sens; };
$('tsens').oninput = () => { tsens = +$('tsens').value; localStorage.n64tsens = tsens; };
$('invertY').onchange = () => { invertY = $('invertY').checked; localStorage.n64inv = invertY ? '1' : '0'; };
function msg(s, d = 2) { $('msg').textContent = s; clearTimeout(msg.t); msg.t = setTimeout(() => $('msg').textContent = '', d * 1000); }
function feed(s) { const d = document.createElement('div'); d.textContent = s; $('killfeed').prepend(d); setTimeout(() => d.remove(), 6000); while ($('killfeed').children.length > 5) $('killfeed').lastChild.remove(); }
function showScores(on, final) {
  if (!on) { $('scores').classList.add('hidden'); return; }
  const rows = [...G.ents.values()].sort((a, b) => b.frags - a.frags || a.deaths - b.deaths);
  $('scoreTbl').innerHTML = '<tr><th>AGENT</th><th>KILLS</th><th>DEATHS</th></tr>' + rows.map(e => `<tr${e.id === G.myId ? ' style="color:#e8c040"' : ''}><td>${esc(e.name)}${e.bot ? ' <small>(' + e.diff + ' bot)</small>' : ''}</td><td>${e.frags}</td><td>${e.deaths}</td></tr>`).join('');
  $('scoreTitle').textContent = final ? (rows[0] ? rows[0].name + ' WINS!' : 'MATCH OVER') : 'SCORES';
  $('endBtns').innerHTML = final ? (G.online ? '<button id="bE1" class="big">BACK TO LOBBY</button>' : '<button id="bE1" class="big">PLAY AGAIN</button><button id="bE2">TITLE</button>') : '<button id="bE3">CLOSE</button>';
  if (final) { $('bE1').onclick = () => { $('scores').classList.add('hidden'); endLocal(); G.mode = 'lobby'; if (G.online) { $('roomPick').classList.add('hidden'); $('roomInfo').classList.remove('hidden'); } show('lobby'); playMusic('lobby'); if (!G.online) {} };
    if ($('bE2')) $('bE2').onclick = () => { $('scores').classList.add('hidden'); endLocal(); G.mode = 'title'; show('start'); playMusic('lobby'); }; }
  else $('bE3').onclick = () => showScores(false);
  $('scores').classList.remove('hidden');
}
const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

// ---------------- NETWORK (Trystero / Nostr public relays) ----------------
let trystero = null;
async function loadNet() { if (!trystero) trystero = await import('./trystero-nostr.js'); return trystero; }
const APP = { appId: 'zedhead-agent64-the-complex-v1' };
function genCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 4; i++) s += A[Math.floor(Math.random() * A.length)]; return s; }
async function joinNet(code, host) {
  leaveRoom(); const T = await loadNet(); G.code = code; G.isHost = host; G.myId = T.selfId; G.hostId = host ? T.selfId : null;
  $('roomPick').classList.add('hidden'); $('roomInfo').classList.remove('hidden'); $('roomCode').textContent = code;
  $('hostBox').classList.toggle('hidden', !host); $('waitHost').classList.toggle('hidden', host);
  $('netStatus').textContent = host ? 'Room open. Tell friends the code! Waiting for players...' : 'Searching for the room... (can take 5-20 sec)';
  const room = T.joinRoom(APP, 'room-' + code); G.room = room;
  const act = room.makeAction('m'); G.send = (d, to) => { try { act.send(d, to ? { target: to } : undefined); } catch (e) { } };
  act.onMessage = (d, ctx) => onNet(d, ctx && ctx.peerId);
  G.roster = new Map(); G.roster.set(G.myId, { id: G.myId, name: myName(), char: G.char });
  room.onPeerJoin = pid => { sendHello(pid); if (voice.stream) room.addStream(voice.stream, { target: pid }); };
  room.onPeerLeave = pid => { G.roster.delete(pid); removeEnt(pid); if (pid === G.hostId && !G.isHost) { toast('Host left the room.', 4); $('netStatus').textContent = 'Host disconnected.'; } if (G.isHost) broadcastLobby(); renderPlist(); };
  room.onPeerStream = (stream, pid) => { let a = voice.els.get(pid); if (!a) { a = new Audio(); a.autoplay = true; a.playsInline = true; voice.els.set(pid, a); document.body.appendChild(a); } a.srcObject = stream; a.play().catch(() => {}); };
  renderPlist();
}
function leaveRoom() { if (G.room) { try { G.room.leave(); } catch (e) { } } G.room = null; G.send = () => {}; voice.els.forEach(a => a.remove()); voice.els.clear(); }
function sendHello(to) { if (!G.room) return; G.roster.set(G.myId, { id: G.myId, name: myName(), char: G.char }); G.send({ t: 'hello', name: myName(), char: G.char }, to); if (G.isHost) broadcastLobby(); renderPlist(); }
function lobbyPayload() { return { t: 'lobby', host: G.myId, roster: [...G.roster.values()], settings: G.settings, running: G.running }; }
function broadcastLobby() { if (G.room && G.isHost) G.send(lobbyPayload()); renderPlist(); }
function renderPlist() {
  const l = [...G.roster.values()].map(r => `<div>${r.id === G.myId ? '&#9733; ' : ''}${esc(r.name)} <small>(${CHARS[r.char % NC].code})</small>${r.id === (G.isHost ? G.myId : G.hostId) ? ' <small>[HOST]</small>' : ''}</div>`);
  const s = G.isHost ? G.settings : (G.remoteSettings || G.settings); for (let i = 0; i < s.bots; i++) l.push(`<div class="bot">BOT ${i + 1} <small>(${s.skill})</small></div>`);
  $('plist').innerHTML = l.join('');
  if (G.room) { const n = Object.keys(G.room.getPeers ? G.room.getPeers() : {}).length; if (n) $('netStatus').textContent = `Connected: ${n + 1} player(s) in room.` + (G.isHost ? '' : ' Waiting for host to start.'); }
}
$('btnCreate').onclick = () => { readSettings(); joinNet(genCode(), true).catch(e => toast('Network error: ' + e.message)); };
$('btnEnter').onclick = () => { const c = $('codeIn').value.trim().toUpperCase(); if (c.length < 4) return toast('Enter the 4-letter room code'); joinNet(c, false).catch(e => toast('Network error: ' + e.message)); };

function onNet(d, from) {
  if (!d || !d.t) return;
  switch (d.t) {
    case 'hello': G.roster.set(from, { id: from, name: String(d.name).slice(0, 12), char: (d.char | 0) % NC });
      if (G.isHost) { broadcastLobby(); if (G.running) sendStartTo(from); } else renderPlist();
      { const e = G.ents.get(from); if (e) e.name = String(d.name).slice(0, 12); } break;
    case 'lobby': if (G.isHost) break; G.hostId = from; G.remoteSettings = d.settings;
      for (const r of d.roster) G.roster.set(r.id, r); renderPlist(); break;
    case 'start': if (G.isHost) break; G.hostId = from; startMatch(d); break;
    case 'roster': if (!G.isHost && G.running) syncRoster(d.roster); break;
    case 's': { // states batch
      for (const s of d.l) { if (s.id === G.myId) continue; const e = G.ents.get(s.id); if (!e || simulatedLocally(e)) continue;
        e.tpos.set(s.p[0], s.p[1], s.p[2]); e.tyaw = s.y; e.pitch = s.pi; if (s.w !== e.weapon) { e.weapon = s.w; setCharGun(e); }
        e.inv = s.iv ? now() + 1 : 0; e.invis = s.is ? now() + 1 : 0; e.moving = s.m; if (!e.seen) { e.pos.copy(e.tpos); e.seen = true; } } break; }
    case 'fire': { const e = G.ents.get(d.id); if (!e || simulatedLocally(e)) break; remoteFire(e, d); break; }
    case 'boom': { const p = G.projs.find(p => p.pid === d.pid); if (p) p.dead = true; explodeFx(new THREE.Vector3(...d.p), d.r || 3.5); break; }
    case 'hit': if (G.isHost) applyDamage(d.tg, d.dmg, d.by, d.w); break;
    case 'hp': { const e = G.ents.get(d.id); if (!e) break; const dropped = d.hp < e.hp; e.hp = d.hp; e.armor = d.ar; if (e.id === G.myId && dropped) hurtFx(); break; }
    case 'kill': onKill(d); break;
    case 'take': if (G.isHost) hostTake(d.i, from); break;
    case 'item': onItem(d); break;
    case 'alive': if (G.isHost) { const e = G.ents.get(from); if (e) { e.hp = 100; e.armor = 0; e.alive = true; G.send({ t: 'hp', id: e.id, hp: 100, ar: 0 }); } } else { const e = G.ents.get(d.id); if (e) e.alive = true; } break;
    case 'end': if (!G.isHost) endMatch(d); break;
  }
}

// ---------------- MATCH ----------------
function randomItems() {
  const spots = []; const nodes = L.NODES.slice().sort(() => Math.random() - 0.5);
  for (const n of nodes) { if (spots.every(s => Math.hypot(s.x - n.x, s.z - n.z) > 6.5) && L.SPAWNS.every(s => Math.hypot(s[0] - n.x, s[2] - n.z) > 2)) spots.push(n); if (spots.length >= 40) break; }
  const types = []; for (const w of ['pistol', 'shotgun', 'mg', 'rocket', 'mine', 'laser', 'grenade']) types.push(w, w, ...(w === 'pistol' || w === 'mg' ? [w] : []));
  types.push('ammo', 'ammo', 'ammo', 'ammo', 'ammo', 'ammo', 'health', 'health', 'health', 'health', 'health', 'health', 'armor', 'armor', 'armor', 'armor', 'inv', 'inv', 'invis', 'invis');
  types.sort(() => Math.random() - 0.5);
  return types.slice(0, spots.length).map((type, i) => ({ i, type, x: spots[i].x, y: spots[i].y, z: spots[i].z }));
}
function buildRoster() {
  const r = [{ id: G.myId, name: myName(), char: G.char }];
  if (G.online) for (const p of G.roster.values()) if (p.id !== G.myId) r.push(p);
  const used = new Set(r.map(x => x.char)); const BN = ['DRONE', 'SPECTRE', 'GHOST', 'RAVEN', 'COBRA', 'JACKAL'];
  for (let i = 0; i < G.settings.bots; i++) { let c = [...CHARS.keys()].sort(() => Math.random() - 0.5).find(k => !used.has(k)); if (c === undefined) c = Math.floor(Math.random() * NC); used.add(c);
    r.push({ id: 'bot' + i, name: BN[i] + ' (' + CHARS[c].code + ')', char: c, bot: true, diff: G.settings.skill }); }
  return r;
}
function hostStartMatch() {
  if (!G.online) { G.myId = 'me'; G.isHost = true; }
  const roster = buildRoster(); const items = randomItems(); const dur = G.settings.time * 60;
  G.startMsg = { t: 'start', roster, items, settings: G.settings, remain: dur };
  G.startTime = now();
  startMatch(G.startMsg);
  if (G.online) G.send(G.startMsg);
}
function sendStartTo(pid) {
  const roster = [...G.ents.values()].map(e => ({ id: e.id, name: e.name, char: e.char, bot: e.bot, diff: e.diff, frags: e.frags, deaths: e.deaths }));
  if (!roster.find(r => r.id === pid)) { const r = G.roster.get(pid); roster.push({ id: pid, name: r.name, char: r.char }); }
  syncRoster(roster);
  const items = G.items.map(it => ({ i: it.i, type: it.type, x: it.x, y: it.y, z: it.z, gone: !it.avail }));
  G.send({ t: 'start', roster, items, settings: G.settings, remain: G.settings.time ? Math.max(1, G.endAt - now()) : 0 }, pid);
  G.send({ t: 'roster', roster });
}
function syncRoster(roster) {
  for (const r of roster) if (!G.ents.has(r.id)) { const e = newEnt({ id: r.id, name: r.name, char: r.char, bot: !!r.bot, diff: r.diff || 'normal', frags: r.frags || 0, deaths: r.deaths || 0 });
    G.ents.set(r.id, e); if (r.id === G.myId || (r.bot && G.isHost)) respawn(e, true); else e.seen = false; }
}
function startMatch(d) {
  endLocal(); G.settings = d.settings; G.running = true; G.ended = false;
  syncRoster(d.roster);
  G.items = d.items.map(it => { const o = Object.assign({}, it, { avail: !it.gone, back: 0 }); o.mesh = itemMesh(it.type); o.mesh.position.set(it.x, it.y + 0.5, it.z); o.mesh.visible = o.avail; scene.add(o.mesh); return o; });
  G.endAt = d.settings.time ? now() + (d.remain || d.settings.time * 60) : 0;
  G.mode = 'game'; show(null); $('hud').classList.remove('hidden'); $('bTalk').classList.toggle('hidden', !(voice.stream && voice.ptt));
  playMusic('game'); msg('THE COMPLEX - ' + (d.settings.frag ? 'FIRST TO ' + d.settings.frag + ' KILLS' : 'MOST KILLS WINS'), 3); resize();
}
function endLocal() {
  G.running = false; for (const e of G.ents.values()) scene.remove(e.mesh); G.ents.clear();
  for (const it of G.items) scene.remove(it.mesh); G.items = []; for (const p of G.projs) scene.remove(p.mesh); G.projs = []; for (const f of G.fx) scene.remove(f.obj); G.fx = [];
  $('deathScr').classList.add('hidden'); if (document.exitPointerLock) document.exitPointerLock();
}
function endMatch(d) {
  if (G.ended) return; G.ended = true; G.running = false;
  if (d && d.scores) for (const s of d.scores) { const e = G.ents.get(s.id); if (e) { e.frags = s.f; e.deaths = s.d; } }
  showScores(true, true); playMusic('lobby');
}
function hostCheckEnd() {
  if (!G.isHost || G.ended) return; const top = Math.max(...[...G.ents.values()].map(e => e.frags));
  if ((G.settings.frag && top >= G.settings.frag) || (G.endAt && now() >= G.endAt)) {
    const d = { t: 'end', scores: [...G.ents.values()].map(e => ({ id: e.id, f: e.frags, d: e.deaths })) }; G.send(d); endMatch(d); G.running = false; }
}
function respawn(e, first) {
  let best = null, bd = -1; for (const s of L.SPAWNS) { let md = 1e9; for (const o of G.ents.values()) if (o !== e && o.alive) md = Math.min(md, Math.hypot(o.pos.x - s[0], o.pos.z - s[2]) + Math.random() * 6); if (md > bd) { bd = md; best = s; } }
  e.pos.set(best[0], best[1], best[2]); e.vel.set(0, 0, 0); e.yaw = Math.random() * Math.PI * 2; e.pitch = 0;
  e.hp = 100; e.armor = 0; e.alive = true; e.ammo = { knife: 1 }; e.weapon = 'knife'; setCharGun(e); e.inv = 0; e.invis = 0; e.ai = {};
  e.tpos.copy(e.pos); e.mesh.visible = true;
  if (!first && G.online) { if (G.isHost) G.send({ t: 'hp', id: e.id, hp: 100, ar: 0 }), G.send({ t: 'alive', id: e.id }); else G.send({ t: 'alive', id: e.id }); }
}

// ---------------- ITEMS ----------------
function itemTex(type) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 16; const g = cv.getContext('2d');
  const C = { health: ['#fff', '#d02020'], armor: ['#2a4ab0', '#9ab0ff'], ammo: ['#5a6030', '#e8c040'], inv: ['#e8c040', '#fff'], invis: ['#30d0e0', '#fff'] }[type];
  g.fillStyle = C[0]; g.fillRect(0, 0, 16, 16); g.fillStyle = C[1];
  if (type === 'health') { g.fillRect(6, 2, 4, 12); g.fillRect(2, 6, 12, 4); } else if (type === 'ammo') { for (let i = 2; i < 14; i += 4) g.fillRect(i, 3, 2, 10); } else if (type === 'armor') { g.fillRect(3, 3, 10, 2); g.fillRect(5, 5, 6, 8); } else { g.fillRect(7, 1, 2, 14); g.fillRect(1, 7, 14, 2); }
  const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace; return t;
}
function itemMesh(type) {
  const g = new THREE.Group();
  if (W[type]) { const m = weaponMesh(type); m.scale.setScalar(1.8); g.add(m); const ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.45, 8), new THREE.MeshBasicMaterial({ color: 0xe8c040, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = -0.48; g.add(ring); }
  else if (type === 'inv') g.add(new THREE.Mesh(new THREE.OctahedronGeometry(0.3), new THREE.MeshBasicMaterial({ color: 0xffd040 })));
  else if (type === 'invis') g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.3), new THREE.MeshBasicMaterial({ color: 0x40e0ff, transparent: true, opacity: 0.55 })));
  else { const m = new THREE.Mesh(boxG, new THREE.MeshBasicMaterial({ map: itemTex(type) })); m.scale.set(0.45, type === 'armor' ? 0.5 : 0.35, 0.3); g.add(m); }
  g.userData.spin = true; return g;
}
const RESPAWN_T = t => W[t] ? 12 : (t === 'inv' || t === 'invis') ? 45 : 20;
function canUse(e, type) {
  if (type === 'health') return e.hp < 100; if (type === 'armor') return e.armor < 100; if (W[type]) return !e.ammo[type] || e.ammo[type] < W[type].max;
  if (type === 'ammo') return Object.keys(e.ammo).some(w => w !== 'knife' && e.ammo[w] < W[w].max); return true;
}
function checkPickups(e) {
  for (const it of G.items) { if (!it.avail || it.pending) continue; if (Math.hypot(it.x - e.pos.x, it.z - e.pos.z) < 1.0 && Math.abs(it.y - e.pos.y) < 1.5 && canUse(e, it.type)) {
      if (G.isHost) hostTake(it.i, e.id); else { it.pending = now(); G.send({ t: 'take', i: it.i }); } } }
}
function hostTake(i, by) { const it = G.items[i]; if (!it || !it.avail) return; const d = { t: 'item', i, by, gone: true }; G.send(d); onItem(d); }
function onItem(d) {
  const it = G.items[d.i]; if (!it) return; it.pending = 0;
  if (d.gone) { it.avail = false; it.mesh.visible = false; it.back = now() + RESPAWN_T(it.type); const e = G.ents.get(d.by); if (e) giveItem(e, it.type); }
  else { it.avail = true; it.mesh.visible = true; }
}
function giveItem(e, type) {
  const mine = e.id === G.myId;
  if (W[type]) { const had = e.ammo[type] > 0; e.ammo[type] = Math.min(W[type].max, (e.ammo[type] || 0) + W[type].ammo); if (!had && W[type].pri > W[e.weapon].pri) setWeapon(e, type); if (mine) msg(W[type].name, 1.2); }
  else if (type === 'health') { e.hp = Math.min(100, e.hp + 40); if (mine) msg('+40 HEALTH', 1.2); }
  else if (type === 'armor') { e.armor = Math.min(100, e.armor + 50); if (mine) msg('BODY ARMOR', 1.2); }
  else if (type === 'ammo') { for (const w in e.ammo) if (w !== 'knife') e.ammo[w] = Math.min(W[w].max, e.ammo[w] + Math.ceil(W[w].ammo * 0.75)); if (mine) msg('AMMO', 1.2); }
  else if (type === 'inv') { e.inv = now() + 15; if (mine) msg('INVINCIBLE!', 2); }
  else if (type === 'invis') { e.invis = now() + 15; if (mine) msg('INVISIBLE!', 2); }
  if (mine) sfx(type === 'inv' || type === 'invis' ? 'power' : 'pickup');
  if (G.isHost && (type === 'health' || type === 'armor')) G.send({ t: 'hp', id: e.id, hp: e.hp, ar: e.armor });
}

// ---------------- WEAPONS ----------------
function setWeapon(e, w) { e.weapon = w; e.lastFire = now() - 0.2; setCharGun(e); if (e.id === G.myId) { sfx('switch'); } }
function switchWeapon(e, dir) {
  const have = WORDER.filter(w => e.ammo[w] > 0); let i = have.indexOf(e.weapon); i = (i + dir + have.length) % have.length; setWeapon(e, have[i]);
}
const tmpV = new THREE.Vector3();
function aimDir(yaw, pitch, out = new THREE.Vector3()) { return out.set(-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)); }
function eyePos(e, out = new THREE.Vector3()) { return out.set(e.pos.x, e.pos.y + 1.55, e.pos.z); }
function rayEnts(o, d, maxD, skip) { // returns {e, t, head}
  let best = null;
  for (const e of G.ents.values()) { if (e === skip || !e.alive) continue;
    const boxes = [[e.pos.x - 0.35, e.pos.y, e.pos.z - 0.35, e.pos.x + 0.35, e.pos.y + 1.3, e.pos.z + 0.35, false], [e.pos.x - 0.25, e.pos.y + 1.3, e.pos.z - 0.25, e.pos.x + 0.25, e.pos.y + 1.78, e.pos.z + 0.25, true]];
    for (const b of boxes) { let t0 = 0, t1 = maxD, ok = true;
      for (let a = 0; a < 3; a++) { const oa = [o.x, o.y, o.z][a], da = [d.x, d.y, d.z][a], mn = b[a], mx = b[a + 3];
        if (Math.abs(da) < 1e-6) { if (oa < mn || oa > mx) { ok = false; break; } } else { let ta = (mn - oa) / da, tb = (mx - oa) / da; if (ta > tb) [ta, tb] = [tb, ta]; t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) { ok = false; break; } } }
      if (ok && (!best || t0 < best.t)) best = { e, t: t0, head: b[6] }; } }
  return best;
}
function dealHit(by, tg, dmg, w) { if (G.isHost) applyDamage(tg.id, dmg, by.id, w); else G.send({ t: 'hit', by: by.id, tg: tg.id, dmg, w }); if (by.id === G.myId) sfx('hit'); }
function fire(e) {
  const w = W[e.weapon], t = now(); if (t - e.lastFire < w.rate || !e.alive) return false;
  if (!w.melee && !(e.ammo[e.weapon] > 0)) { if (e.id === G.myId) sfx('empty'); e.lastFire = t; const have = WORDER.filter(x => e.ammo[x] > 0 && x !== 'knife'); setWeapon(e, have.sort((a, b) => W[b].pri - W[a].pri)[0] || 'knife'); return false; }
  e.lastFire = t; if (!w.melee) e.ammo[e.weapon]--;
  const o = eyePos(e); const spreadExtra = e.bot ? BOTDIFF[e.diff].spread : 0;
  const dir = aimDir(e.yaw, e.pitch); const vol = e.id === G.myId ? 1 : Math.max(0.05, 1 - o.distanceTo(camera.position) / 40);
  sfx(w.snd, vol);
  if (e.id === G.myId) { vmKick = 1; if (!w.melee) flash.material.opacity = 1; }
  const net = { t: 'fire', id: e.id, w: e.weapon, o: [o.x, o.y, o.z].map(r2), tr: [] };
  if (w.melee) { const h = rayEnts(o, dir, w.range, e); if (h && L.rayWorld(o, dir, h.t) >= h.t - 0.01) dealHit(e, h.e, w.dmg, e.weapon); }
  else if (w.proj) { const pid = e.id + ':' + (G.pidc++); const d = dir.clone(); spawnProj(w.proj, e, o.clone().addScaledVector(d, 0.5), d, pid, true); net.pid = pid; net.d = [d.x, d.y, d.z].map(r2); }
  else { const n = w.pellets || 1;
    for (let i = 0; i < n; i++) { const sp = (w.spread || 0) + spreadExtra; const d = dir.clone(); d.x += (Math.random() - 0.5) * 2 * sp; d.y += (Math.random() - 0.5) * 2 * sp; d.z += (Math.random() - 0.5) * 2 * sp; d.normalize();
      const wd = L.rayWorld(o, d, 60); const h = rayEnts(o, d, wd, e); const end = o.clone().addScaledVector(d, h ? h.t : wd);
      if (h) dealHit(e, h.e, Math.round(w.dmg * (h.head ? 1.8 : 1)), e.weapon); else puff(end);
      tracer(e, end, w); net.tr.push([end.x, end.y, end.z].map(r2)); } }
  if (G.online) G.send(net);
  return true;
}
const r2 = v => Math.round(v * 100) / 100;
function remoteFire(e, d) {
  const w = W[d.w]; if (!w) return; if (d.w !== e.weapon) { e.weapon = d.w; setCharGun(e); }
  sfx(w.snd, Math.max(0.05, 1 - e.pos.distanceTo(camera.position) / 40));
  if (w.proj && d.d) spawnProj(w.proj, e, new THREE.Vector3(...d.o).addScaledVector(new THREE.Vector3(...d.d), 0.5), new THREE.Vector3(...d.d), d.pid, false);
  for (const p of d.tr || []) { const end = new THREE.Vector3(...p); tracer(e, end, w); puff(end); }
}
function muzzleWorld(e) { if (e.id === G.myId) { return flash.getWorldPosition(new THREE.Vector3()); } return eyePos(e).add(aimDir(e.yaw, e.pitch).multiplyScalar(0.6)).add(new THREE.Vector3(0, -0.25, 0)); }
function tracer(e, end, w) {
  const a = muzzleWorld(e); const geo = new THREE.BufferGeometry().setFromPoints([a, end]);
  const ln = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: w.beam || w.color || 0xffffaa, transparent: true, opacity: w.beam ? 1 : 0.6 }));
  scene.add(ln); G.fx.push({ obj: ln, life: w.beam ? 0.18 : 0.05, fade: true });
  if (w.beam) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, a.distanceTo(end), 4, 1, true), new THREE.MeshBasicMaterial({ color: 0x30ffff, transparent: true, opacity: 0.7 }));
    m.position.copy(a).add(end).multiplyScalar(0.5); m.lookAt(end); m.rotateX(Math.PI / 2); scene.add(m); G.fx.push({ obj: m, life: 0.2, fade: true }); }
}
const puffMat = new THREE.SpriteMaterial({ color: 0xcfc8b0, transparent: true });
function puff(p) { const s = new THREE.Sprite(puffMat.clone()); s.position.copy(p); s.scale.setScalar(0.18); scene.add(s); G.fx.push({ obj: s, life: 0.3, grow: 0.8, fade: true }); }
function explodeFx(p, r) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshBasicMaterial({ color: 0xff8020, transparent: true, opacity: 0.9 })); m.position.copy(p); m.scale.setScalar(0.4);
  scene.add(m); G.fx.push({ obj: m, life: 0.45, grow: r * 2.4, fade: true }); sfx('boom', Math.max(0.1, 1 - p.distanceTo(camera.position) / 45));
  if (p.distanceTo(camera.position) < r * 2.5) shake = 0.5;
}
const projGeo = { rocket: new THREE.BoxGeometry(0.12, 0.12, 0.4), grenade: new THREE.IcosahedronGeometry(0.1, 0), mine: new THREE.CylinderGeometry(0.16, 0.16, 0.08, 6) };
const projMat = { rocket: new THREE.MeshBasicMaterial({ color: 0x9aa060 }), grenade: new THREE.MeshBasicMaterial({ color: 0x4a5a2a }), mine: new THREE.MeshBasicMaterial({ color: 0xd0a020 }) };
function spawnProj(kind, owner, pos, dir, pid, auth) {
  const p = { kind, owner, pos, pid, auth, born: now(), vel: dir.clone().multiplyScalar(kind === 'rocket' ? 24 : 15), stuck: false };
  if (kind !== 'rocket') p.vel.y += 2.5;
  p.mesh = new THREE.Mesh(projGeo[kind], projMat[kind]); p.mesh.position.copy(pos); if (kind === 'rocket') p.mesh.lookAt(pos.clone().add(dir));
  if (kind === 'mine') { const led = new THREE.Mesh(boxG, new THREE.MeshBasicMaterial({ color: 0xff2020 })); led.scale.setScalar(0.06); led.position.y = 0.06; p.mesh.add(led); p.led = led; }
  scene.add(p.mesh); G.projs.push(p);
  if (kind === 'mine' && auth) { const mine = G.projs.filter(q => q.kind === 'mine' && q.owner === owner && !q.dead); if (mine.length > 6) explodeProj(mine[0]); }
}
function explodeProj(p) {
  if (p.dead) return; p.dead = true; const w = W[p.kind]; const r = w.splash; explodeFx(p.pos, r);
  if (!p.auth) return;
  G.send({ t: 'boom', pid: p.pid, p: [p.pos.x, p.pos.y, p.pos.z].map(r2), r });
  for (const e of G.ents.values()) { if (!e.alive) continue; const c = e.pos.clone(); c.y += 0.9; const d = c.distanceTo(p.pos); if (d > r) continue;
    const dir = c.clone().sub(p.pos).normalize(); if (d > 0.6 && L.rayWorld(p.pos, dir, d) < d - 0.4) continue;
    let dmg = Math.round(w.dmg * (1 - d / r * 0.75)); if (e === p.owner) dmg = Math.round(dmg * 0.5);
    if (e === p.owner && e.id === G.myId) e.vel.addScaledVector(dir, 6);
    dealHit(p.owner, e, dmg, p.kind); }
}
function updateProjs(dt) {
  for (const p of G.projs) { if (p.dead) continue; const age = now() - p.born;
    if (!p.auth && age > 20) { p.dead = true; continue; }
    if (p.stuck) { if (p.kind === 'mine') { p.led.visible = age > 1 && Math.floor(age * 3) % 2 === 0;
        if (p.auth && age > 1) for (const e of G.ents.values()) { if (!e.alive || e === p.owner) continue; if (e.pos.distanceTo(p.pos) < 2.2 || Math.hypot(e.pos.x - p.pos.x, e.pos.y + 0.9 - p.pos.y, e.pos.z - p.pos.z) < 2.2) { explodeProj(p); break; } } }
      if (p.kind === 'grenade' && p.auth && age > 2.2) explodeProj(p); continue; }
    if (p.kind !== 'rocket') p.vel.y -= 18 * dt;
    const steps = Math.ceil(p.vel.length() * dt / 0.15); const sd = dt / steps;
    for (let s = 0; s < steps && !p.dead && !p.stuck; s++) {
      const np = p.pos.clone().addScaledVector(p.vel, sd);
      if (L.solidAt(np.x, np.y, np.z)) {
        if (p.kind === 'rocket') { if (p.auth) explodeProj(p); else p.stuck = true; }
        else if (p.kind === 'mine') { p.stuck = true; p.born = now(); p.mesh.rotation.set(0, 0, 0); }
        else { // grenade bounce
          if (L.solidAt(np.x, p.pos.y, p.pos.z)) p.vel.x *= -0.5; if (L.solidAt(p.pos.x, np.y, p.pos.z)) p.vel.y *= -0.45; if (L.solidAt(p.pos.x, p.pos.y, np.z)) p.vel.z *= -0.5;
          p.vel.multiplyScalar(0.8); if (p.vel.length() < 1.2 && L.solidAt(p.pos.x, p.pos.y - 0.15, p.pos.z)) { p.stuck = true; } }
        break; }
      p.pos.copy(np);
      if (p.auth && p.kind !== 'mine') { for (const e of G.ents.values()) { if (!e.alive || e === p.owner) continue; if (Math.abs(e.pos.x - p.pos.x) < 0.45 && Math.abs(e.pos.z - p.pos.z) < 0.45 && p.pos.y > e.pos.y && p.pos.y < e.pos.y + 1.8) { explodeProj(p); break; } } }
    }
    if (p.auth && age > 8 && p.kind === 'rocket') explodeProj(p);
    if (p.auth && p.kind === 'grenade' && age > 2.2) explodeProj(p);
    p.mesh.position.copy(p.pos); if (p.kind === 'grenade') p.mesh.rotation.x += dt * 10;
  }
  for (const p of G.projs) if (p.dead) scene.remove(p.mesh);
  G.projs = G.projs.filter(p => !p.dead);
}

// ---------------- DAMAGE (host authority) ----------------
function applyDamage(tgId, dmg, byId, w) {
  const e = G.ents.get(tgId); if (!e || !e.alive || G.ended) return; if (e.inv > now()) return;
  dmg = Math.max(0, Math.min(200, dmg | 0));
  if (e.armor > 0) { const ab = Math.min(e.armor, Math.round(dmg * 0.66)); e.armor -= ab; dmg -= ab; }
  e.hp -= dmg; if (e.id === G.myId) hurtFx();
  if (e.bot) { e.ai.hurtBy = byId; e.ai.alert = now(); }
  if (e.hp <= 0) { e.hp = 0; const by = G.ents.get(byId); if (by && by !== e) by.frags++; else if (by === e) e.frags = Math.max(0, e.frags - 1); e.deaths++;
    const d = { t: 'kill', tg: e.id, by: byId, w, sc: [...G.ents.values()].map(x => [x.id, x.frags, x.deaths]) }; G.send(d); onKill(d); hostCheckEnd(); }
  else G.send({ t: 'hp', id: e.id, hp: e.hp, ar: e.armor });
}
function onKill(d) {
  const e = G.ents.get(d.tg), by = G.ents.get(d.by); if (d.sc) for (const [id, f, de] of d.sc) { const x = G.ents.get(id); if (x) { x.frags = f; x.deaths = de; } }
  if (!e) return; e.alive = false; e.hp = 0; e.deathT = now();
  feed(by && by !== e ? `${by.name} [${W[d.w] ? W[d.w].name : d.w}] ${e.name}` : `${e.name} self-destructed`);
  sfx('die', Math.max(0.1, 1 - e.pos.distanceTo(camera.position) / 30));
  if (e.id === G.myId) { $('deathScr').classList.remove('hidden'); $('deathBy').textContent = by && by !== e ? 'by ' + by.name : ''; }
  if (by && by.id === G.myId && by !== e) msg('ELIMINATED ' + e.name, 1.5);
}
let shake = 0, vmKick = 0;
function hurtFx() { const f = $('dmgflash'); f.style.transition = 'none'; f.style.opacity = 0.45; requestAnimationFrame(() => { f.style.transition = 'opacity .35s'; f.style.opacity = 0; }); sfx('hurt'); shake = Math.max(shake, 0.15); }

// ---------------- MOVEMENT ----------------
const R = 0.32;
function moveEnt(e, wx, wz, jump, dt, speed = 6.5) {
  const accel = e.onGround ? 14 : 3; e.vel.x += (wx * speed - e.vel.x) * Math.min(1, accel * dt); e.vel.z += (wz * speed - e.vel.z) * Math.min(1, accel * dt);
  if (jump && e.onGround) { e.vel.y = 7.2; e.onGround = false; if (e.id === G.myId) sfx('jump'); }
  e.vel.y -= 22 * dt;
  const head = () => e.pos.y + 1.75;
  let nx = e.pos.x + e.vel.x * dt; if (!L.blockedAt(nx, e.pos.z, e.pos.y, head(), R)) e.pos.x = nx; else e.vel.x = 0;
  let nz = e.pos.z + e.vel.z * dt; if (!L.blockedAt(e.pos.x, nz, e.pos.y, head(), R)) e.pos.z = nz; else e.vel.z = 0;
  const g = L.groundAt(e.pos.x, e.pos.z, e.pos.y, R); const ny = e.pos.y + e.vel.y * dt; const ceil = L.ceilAt(e.pos.x, e.pos.z);
  if (ny + 1.8 > ceil && e.vel.y > 0) { e.vel.y = 0; }
  else if (ny <= g) { // landed or stepping
    if (e.onGround && g - e.pos.y > 0) e.pos.y += Math.min(g - e.pos.y, 8 * dt + 0.05); else e.pos.y = g; e.vel.y = 0; e.onGround = true;
    if (g - e.pos.y > 0.001) e.pos.y = Math.max(e.pos.y, g - 0.2); }
  else if (e.onGround && ny > g && ny - g < 0.4 && e.vel.y <= 0) { e.pos.y = g; e.vel.y = 0; } // stick to ramps / down steps
  else { e.pos.y = ny; e.onGround = false; }
  if (e.pos.y < -20) { e.pos.set(5, 0, 5); e.vel.set(0, 0, 0); }
  return Math.hypot(e.vel.x, e.vel.z);
}

// ---------------- BOT AI ----------------
function canSee(a, b) { const o = eyePos(a), t = eyePos(b, new THREE.Vector3()); t.y -= 0.4; const d = o.distanceTo(t); if (d > 45) return false; const dir = t.clone().sub(o).normalize(); return L.rayWorld(o, dir, d) >= d - 0.3; }
function nearestItem(e, pred) { let best = null, bd = 1e9; for (const it of G.items) { if (!it.avail || !pred(it)) continue; const d = Math.hypot(it.x - e.pos.x, it.z - e.pos.z) + Math.abs(it.y - e.pos.y) * 3; if (d < bd) { bd = d; best = it; } } return best; }
function botUpdate(e, dt) {
  const D = BOTDIFF[e.diff] || BOTDIFF.normal, ai = e.ai, t = now();
  // perception (throttled)
  if (!ai.nextLook || t > ai.nextLook) { ai.nextLook = t + 0.2;
    let best = null, bd = 1e9;
    for (const o of G.ents.values()) { if (o === e || !o.alive) continue; if (o.invis > t && Math.random() > 0.15) continue;
      const dx = o.pos.x - e.pos.x, dz = o.pos.z - e.pos.z; const d = Math.hypot(dx, dz); let ang = Math.atan2(-dx, -dz) - e.yaw; ang = Math.atan2(Math.sin(ang), Math.cos(ang));
      const aware = Math.abs(ang) < D.fov || (ai.hurtBy === o.id && t - (ai.alert || 0) < 3) || d < 4; if (!aware || d > bd) continue; if (canSee(e, o)) { best = o; bd = d; } }
    if (best && best !== ai.enemy) { ai.enemy = best; ai.seenAt = t; } if (!best && ai.enemy && t - (ai.lastSee || 0) > 2) { ai.lastPos = ai.enemy.pos.clone(); ai.enemy = null; }
    if (best) ai.lastSee = t;
    // weapon choice
    const have = WORDER.filter(w => e.ammo[w] > 0); if (have.length) { let pick;
      if (best && e.diff !== 'easy') { const d = bd; pick = have.slice().sort((a, b) => score(b, d) - score(a, d))[0]; } else pick = have.sort((a, b) => W[b].pri - W[a].pri)[0];
      if (pick && pick !== e.weapon && t - (ai.swT || 0) > 1.5) { setWeapon(e, pick); ai.swT = t; } }
  }
  function score(w, d) { const W0 = W[w]; let s = W0.pri; if (w === 'shotgun') s += d < 7 ? 4 : -2; if (w === 'knife') s = d < 2 ? 3 : -5; if ((w === 'rocket' || w === 'grenade') && d < 4) s -= 6; if (w === 'mine') s -= 2; if (w === 'mg' && d < 15) s += 1; return s; }
  let wx = 0, wz = 0, jump = false; const en = ai.enemy && ai.enemy.alive ? ai.enemy : null;
  let goal = null;
  if (en) { // combat
    const tgt = eyePos(en); tgt.y -= en.weapon ? 0.45 : 0.45; const o = eyePos(e); const dx = tgt.x - o.x, dz = tgt.z - o.z, dy = tgt.y - o.y;
    const wantYaw = Math.atan2(-dx, -dz), wantPitch = Math.atan2(dy, Math.hypot(dx, dz));
    let dyaw = Math.atan2(Math.sin(wantYaw - e.yaw), Math.cos(wantYaw - e.yaw)); const mx = D.turn * dt;
    e.yaw += Math.max(-mx, Math.min(mx, dyaw)); e.pitch += Math.max(-mx, Math.min(mx, wantPitch - e.pitch));
    const dist = Math.hypot(dx, dz);
    if (t - ai.seenAt > D.react && Math.abs(dyaw) < 0.12 + D.spread && (ai.lastSee && t - ai.lastSee < 0.5)) { if (W[e.weapon].melee ? dist < 1.9 : true) fire(e); }
    // strafe / approach
    if (!ai.strafeT || t > ai.strafeT) { ai.strafeT = t + 0.6 + Math.random() * 1.2; ai.strafe = Math.random() < 0.5 ? -1 : 1; if (e.diff === 'easy' && Math.random() < 0.5) ai.strafe = 0; }
    const want = W[e.weapon].melee ? 0.8 : e.weapon === 'shotgun' ? 4 : (e.weapon === 'rocket' || e.weapon === 'grenade') ? 9 : 7;
    const fwd = dist > want + 2 ? 1 : dist < want - 2 ? -0.6 : 0; const s = Math.sin(e.yaw), c = Math.cos(e.yaw);
    wx = -s * fwd + c * ai.strafe * 0.8; wz = -c * fwd - s * ai.strafe * 0.8;
    if (fwd > 0 && Math.random() < 0.01 * D.seek) jump = true;
    ai.path = null;
  } else {
    // pick goal
    if (!ai.path || !ai.path.length || t > (ai.replan || 0)) {
      let tgt = null;
      if (e.hp < 55) tgt = nearestItem(e, it => it.type === 'health');
      if (!tgt && Object.keys(e.ammo).length <= 2 && Math.random() < D.seek + 0.2) tgt = nearestItem(e, it => !!W[it.type]);
      if (!tgt && Math.random() < D.seek * 0.5) tgt = nearestItem(e, it => it.type === 'armor' || it.type === 'inv' || it.type === 'invis' || (W[it.type] && !e.ammo[it.type]));
      let goalN; if (tgt) goalN = L.nearestNode(tgt.x, tgt.y, tgt.z); else if (ai.lastPos) { goalN = L.nearestNode(ai.lastPos.x, ai.lastPos.y, ai.lastPos.z); ai.lastPos = null; }
      else { const others = [...G.ents.values()].filter(o => o !== e && o.alive); if (others.length && Math.random() < 0.5 * D.seek) { const o = others[Math.floor(Math.random() * others.length)]; goalN = L.nearestNode(o.pos.x, o.pos.y, o.pos.z); } else goalN = L.NODES[Math.floor(Math.random() * L.NODES.length)]; }
      ai.path = L.findPath(L.nearestNode(e.pos.x, e.pos.y, e.pos.z), goalN); ai.replan = t + 6 + Math.random() * 4; ai.goalItem = tgt;
    }
    if (ai.path && ai.path.length) { const n = ai.path[0]; const dx = n.x - e.pos.x, dz = n.z - e.pos.z; const d = Math.hypot(dx, dz);
      if (d < 0.7) ai.path.shift(); else { wx = dx / d; wz = dz / d; const wantYaw = Math.atan2(-dx, -dz); const dy = Math.atan2(Math.sin(wantYaw - e.yaw), Math.cos(wantYaw - e.yaw)); e.yaw += Math.max(-D.turn * dt * 0.7, Math.min(D.turn * dt * 0.7, dy)); e.pitch *= 0.9; } }
    else if (ai.goalItem) { const dx = ai.goalItem.x - e.pos.x, dz = ai.goalItem.z - e.pos.z, d = Math.hypot(dx, dz); if (d > 0.3) { wx = dx / d; wz = dz / d; } }
  }
  const sp = moveEnt(e, wx, wz, jump, dt, 6.5 * D.speed);
  // stuck detection
  if ((wx || wz) && sp < 0.5) { ai.stuck = (ai.stuck || 0) + dt; if (ai.stuck > 0.8) { ai.stuck = 0; ai.path = null; ai.replan = 0; if (e.onGround) e.vel.y = 7; } } else ai.stuck = 0;
  e.moving = sp > 0.5; checkPickups(e);
}

// ---------------- VOICE CHAT ----------------
const voice = { stream: null, ptt: false, els: new Map(), muted: false };
async function micOn() {
  if (!G.room) { toast('Voice chat works in online rooms'); return; }
  try { voice.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false }); }
  catch (e) { toast('Microphone blocked: ' + e.message); return; }
  G.room.addStream(voice.stream); setMicEnabled(!voice.ptt); updMic(); toast(voice.ptt ? 'Voice ON - hold TALK to speak' : 'Voice ON - open mic');
}
function micOff() { if (voice.stream) { voice.stream.getTracks().forEach(t => t.stop()); try { G.room && G.room.removeStream(voice.stream); } catch (e) { } } voice.stream = null; updMic(); }
function setMicEnabled(on) { if (voice.stream) voice.stream.getAudioTracks().forEach(t => t.enabled = on); $('bTalk').classList.toggle('on', on && voice.ptt); }
function pttSet(on) { if (voice.ptt && voice.stream) setMicEnabled(on); }
function updMic() { $('btnMic').textContent = '\uD83C\uDFA4 Voice: ' + (voice.stream ? (voice.muted ? 'MUTED' : 'ON') : 'OFF'); $('btnMicMode').textContent = 'Mode: ' + (voice.ptt ? 'PUSH-TO-TALK' : 'OPEN MIC');
  $('hbMic').classList.toggle('on', !!voice.stream && !voice.muted); $('bTalk').classList.toggle('hidden', !(voice.stream && voice.ptt && G.mode === 'game')); }
$('btnMic').onclick = () => voice.stream ? micOff() : micOn();
$('btnMicMode').onclick = () => { voice.ptt = !voice.ptt; setMicEnabled(!voice.ptt && !voice.muted); updMic(); };
$('hbMic').onclick = () => { if (!voice.stream) { micOn(); return; } voice.muted = !voice.muted; setMicEnabled(!voice.muted && !voice.ptt); updMic(); toast(voice.muted ? 'Mic muted' : 'Mic live'); };
holdBtn('bTalk', () => pttSet(true), () => pttSet(false));

// ---------------- MAIN LOOP ----------------
let last = now(), netT = 0, hudT = 0;
const camTarget = new THREE.Vector3();
function step() {
  requestAnimationFrame(step);
  const t = now(); let dt = Math.min(0.05, t - last); last = t;
  if (G.mode !== 'game' || !G.running) { try { pollPad(dt); } catch (e) { } }
  if (G.mode === 'game' && G.running !== undefined && G.ents.size) {
    const p = me();
    if (p) {
      // look
      if (typeof ctrlFrame === 'function') ctrlFrame(dt);
      p.yaw += input.lookDX; p.pitch = Math.max(-1.35, Math.min(1.35, p.pitch + input.lookDY)); input.lookDX = input.lookDY = 0;
      if (p.alive && !G.ended) {
        let mx = input.mx + (input.padMx || 0), mz = input.mz + (input.padMz || 0); const k = input.keys;
        if (k.KeyW || k.ArrowUp) mz -= 1; if (k.KeyS || k.ArrowDown) mz += 1; if (k.KeyA) mx -= 1; if (k.KeyD) mx += 1; if (k.ArrowLeft) p.yaw += 2.5 * dt; if (k.ArrowRight) p.yaw -= 2.5 * dt;
        const m = Math.hypot(mx, mz); if (m > 1) { mx /= m; mz /= m; }
        const s = Math.sin(p.yaw), c = Math.cos(p.yaw);
        const wx = c * mx + (-s) * (-mz), wz = (-s) * mx + (-c) * (-mz);
        const sp = moveEnt(p, wx, wz, input.jump || input.padJump || k.Space, dt); p.moving = sp > 0.5; p.walk += sp * dt;
        if (input.fire || input.mouseFire || input.padFire || k.KeyF) { const w = W[p.weapon]; if (w.auto || !p.fireHeld) fire(p); p.fireHeld = true; } else p.fireHeld = false;
        checkPickups(p);
      } else if (!p.alive && t - (p.deathT || t) > 3 && !G.ended) { respawn(p); $('deathScr').classList.add('hidden'); }
    }
    if (G.isHost && G.running) for (const e of G.ents.values()) { if (!e.bot) continue; if (e.alive) botUpdate(e, dt); else if (t - (e.deathT || t) > 3) respawn(e); }
    // remote interpolation
    for (const e of G.ents.values()) { if (simulatedLocally(e)) continue; e.pos.lerp(e.tpos, Math.min(1, dt * 12)); let dy = e.tyaw - e.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); e.yaw += dy * Math.min(1, dt * 12); }
    updateProjs(dt);
    // items
    for (const it of G.items) { if (it.mesh.visible) { it.mesh.rotation.y += dt * 2; it.mesh.position.y = it.y + 0.5 + Math.sin(t * 3 + it.i) * 0.08; }
      if (G.isHost && !it.avail && it.back && t > it.back) { it.back = 0; const d = { t: 'item', i: it.i, gone: false }; G.send(d); onItem(d); }
      if (it.pending && t - it.pending > 2) it.pending = 0; }
    // entity visuals
    for (const e of G.ents.values()) {
      const m = e.mesh; m.visible = e.id !== G.myId && (e.alive || t - (e.deathT || 0) < 1.2);
      m.position.copy(e.pos); m.rotation.y = e.yaw + Math.PI; const u = m.userData;
      if (!e.alive) { m.rotation.x = Math.min(Math.PI / 2, (t - e.deathT) * 4) * -1; } else m.rotation.x = 0;
      if (e.moving) e.walk += dt * 9; const sw = e.moving ? Math.sin(e.walk) * 0.6 : 0;
      u.legL.rotation.x = -sw; u.legR.rotation.x = sw; u.kneeL.rotation.x = e.moving ? Math.max(0, Math.sin(e.walk + 1.4)) * 0.9 : 0; u.kneeR.rotation.x = e.moving ? Math.max(0, -Math.sin(e.walk + 1.4)) * 0.9 : 0;
      u.armL.rotation.x = sw * 0.6; u.elbowL.rotation.x = -0.25 - (e.moving ? 0.3 : 0);
      u.armR.rotation.x = -(1.35 + e.pitch * 0.85); u.elbowR.rotation.x = -0.12; u.armR.rotation.z = 0.0;
      setOpacity(e, e.invis > t ? 0.12 : 1);
      u.faceMat.color.setHex(e.inv > t && Math.floor(t * 8) % 2 ? 0xffff60 : 0xffffff);
    }
    // camera
    if (p) { camera.position.set(p.pos.x, p.pos.y + (p.alive ? 1.55 + (p.onGround ? Math.sin(p.walk * 1.5) * 0.03 * (p.moving ? 1 : 0) : 0) : 0.3), p.pos.z);
      camera.rotation.set(p.pitch, p.yaw, p.alive ? 0 : 0.6, 'YXZ');
      if (shake > 0) { camera.rotation.x += (Math.random() - 0.5) * shake * 0.1; camera.rotation.y += (Math.random() - 0.5) * shake * 0.1; shake = Math.max(0, shake - dt * 2); }
      setVM(p.weapon); vm.visible = p.alive && !window.__hideVM; vmKick = Math.max(0, vmKick - dt * 8); const bob = p.moving ? Math.sin(p.walk * 1.5) : 0;
      vm.position.set(0.22 + bob * 0.012, -0.2 + Math.abs(bob) * 0.012 - vmKick * 0.02, -0.35 + vmKick * 0.06); vm.rotation.x = vmKick * 0.25;
      if (W[p.weapon].melee) vm.rotation.y = -vmKick * 0.8; else vm.rotation.y = 0;
      flash.material.opacity = Math.max(0, flash.material.opacity - dt * 20); flash.rotation.z = Math.random() * 3;
      const inv = p.invis > t; if (vmGun) vmGun.traverse(o => { if (o.isMesh) { o.material.transparent = true; o.material.opacity = inv ? 0.35 : 1; } });
      // fog tint by area
      const c = L.cellAt(p.pos.x, p.pos.z); const fc = c && c.th === 'basement' ? 0x1a0e04 : c && (c.th === 'clean' || c.th === 'long') ? 0x2c3236 : c && c.th === 'storage' ? 0x161c1a : 0x141618; scene.fog.color.setHex(fc); scene.background.setHex(fc);
    }
    // fx
    for (const f of G.fx) { f.age = (f.age || 0) + dt; const k = f.age / f.life; if (f.grow) f.obj.scale.setScalar((f.obj.userData.s0 || (f.obj.userData.s0 = f.obj.scale.x)) + f.grow * k); if (f.fade && f.obj.material) f.obj.material.opacity = Math.max(0, 1 - k); if (k >= 1) { scene.remove(f.obj); f.obj.geometry && f.obj.geometry !== boxG && !f.obj.isSprite && f.obj.geometry.dispose(); } }
    G.fx = G.fx.filter(f => f.age < f.life);
    // net send
    netT += dt; if (G.online && netT > 1 / 12) { netT = 0; const l = [];
      for (const e of G.ents.values()) if (simulatedLocally(e)) l.push({ id: e.id, p: [r2(e.pos.x), r2(e.pos.y), r2(e.pos.z)], y: r2(e.yaw), pi: r2(e.pitch), w: e.weapon, m: e.moving ? 1 : 0, iv: e.inv > t ? 1 : 0, is: e.invis > t ? 1 : 0 });
      G.send({ t: 's', l }); }
    if (G.isHost) hostCheckEnd();
    hudT += dt; if (hudT > 0.1 && p) { hudT = 0; updHud(p, t); }
  } else if (G.mode !== 'game') { // attract-mode camera flythrough behind menus
    const a = t * 0.08; camera.position.set(22 + Math.cos(a) * 6, 3, 4 + Math.sin(a) * 6); camera.rotation.set(-0.15, a * 1.0 + 1.2, 0, 'YXZ'); vm.visible = false;
  }
  renderer.render(scene, camera);
}
function updHud(p, t) {
  $('hpBar').style.width = Math.max(0, p.hp) + '%'; $('arBar').style.width = p.armor + '%'; $('hpTxt').textContent = Math.max(0, Math.round(p.hp)) + (p.armor ? ' +' + p.armor : '');
  const w = W[p.weapon]; $('wName').textContent = w.name; $('wAmmo').textContent = w.melee ? '' : p.ammo[p.weapon] || 0;
  if (G.endAt) { const r = Math.max(0, G.endAt - t); $('timer').textContent = Math.floor(r / 60) + ':' + String(Math.floor(r % 60)).padStart(2, '0'); } else $('timer').textContent = '';
  $('score').textContent = 'K ' + p.frags + (G.settings.frag ? '/' + G.settings.frag : '');
  const pu = []; if (p.inv > t) pu.push('INVINCIBLE ' + Math.ceil(p.inv - t)); if (p.invis > t) pu.push('INVISIBLE ' + Math.ceil(p.invis - t)); $('powerups').innerHTML = pu.join('<br>') + '<div class="small" style="color:#9ab070">' + L.roomName(p.pos.x, p.pos.z) + '</div>';
}
resize(); updGyroBtns(); musicBtns(); updMic(); show('start'); step();
// debug/test hook
window.__game = { G, W, L, fire, me, startBots: (n = 3, skill = 'normal') => { G.online = false; G.settings = { bots: n, skill, frag: 10, time: 5 }; G.myId = 'me'; G.isHost = true; hostStartMatch(); }, joinNet };
// ---- lobby 3D preview of the selected agent ----
const pv = { r: null, scene: new THREE.Scene(), cam: new THREE.PerspectiveCamera(30, 0.8, 0.1, 20), model: null, ci: -1 };
pv.scene.add(new THREE.HemisphereLight(0xffffff, 0x445533, 2.0)); const pvl = new THREE.DirectionalLight(0xffffff, 1.2); pvl.position.set(1, 2, 3); pv.scene.add(pvl);
pv.cam.position.set(0, 0.95, 3.75); pv.cam.lookAt(0, 0.92, 0);
function pvLoop() {
  requestAnimationFrame(pvLoop); if ($('lobby').classList.contains('hidden')) return;
  if (!pv.r) { pv.r = new THREE.WebGLRenderer({ canvas: $('preview'), antialias: false, alpha: true }); pv.r.setPixelRatio(1); pv.r.setSize(120, 150, false); pv.r.outputColorSpace = THREE.SRGBColorSpace; }
  if (pv.ci !== G.char) { if (pv.model) pv.scene.remove(pv.model); pv.model = makeChar(G.char); const e = { mesh: pv.model, weapon: 'pistol' }; setCharGun(e); pv.scene.add(pv.model); pv.ci = G.char; }
  pv.model.rotation.y = Math.sin(now() * 0.8) * 1.2; pv.r.render(pv.scene, pv.cam);
}
pvLoop();
window.__game.makeChar = makeChar; window.__game.THREE = THREE; window.__game.scene = scene;
// ================= CONTROL CONFIGURATION (motion / dual stick / Bluetooth controller) =================
const ctrl = { mode: localStorage.n64ctrl || 'motion', rsSens: +(localStorage.n64rs || 1.6), padSens: +(localStorage.n64ps || 1.8), dz: +(localStorage.n64dz || 0.15), rx: 0, ry: 0, padIdx: -1, prev: [], prompted: false };
const HELP = { motion: 'Tilt/turn your phone to aim, drag on the right side to fine-tune. Joystick bottom-left moves.',
  dual: 'Left stick moves/strafes, right stick aims. FIRE sits left of the right stick, JUMP and SWITCH above it.',
  pad: 'Left stick move, right stick look, RT/R2 fire, A/Cross jump, Y/Triangle or RB next weapon, LB previous, Start = scores, Select/Back = menu. D-pad + A/B work in menus.' };
function applyCtrl() {
  localStorage.n64ctrl = ctrl.mode; $('ctrlMode').value = ctrl.mode; $('ctrlHelp').textContent = HELP[ctrl.mode];
  document.body.classList.toggle('dual', ctrl.mode === 'dual'); document.body.classList.toggle('padon', ctrl.mode === 'pad' && ctrl.padIdx >= 0);
  if (ctrl.mode !== 'motion' && gyro.on) { gyro.on = false; updGyroBtns(); }
}
$('ctrlMode').onchange = () => { ctrl.mode = $('ctrlMode').value; applyCtrl(); if (ctrl.mode === 'motion' && isTouch) enableGyro(); };
$('rsSens').value = ctrl.rsSens; $('padSens').value = ctrl.padSens; $('padDz').value = ctrl.dz;
$('rsSens').oninput = () => { ctrl.rsSens = +$('rsSens').value; localStorage.n64rs = ctrl.rsSens; };
$('padSens').oninput = () => { ctrl.padSens = +$('padSens').value; localStorage.n64ps = ctrl.padSens; };
$('padDz').oninput = () => { ctrl.dz = +$('padDz').value; localStorage.n64dz = ctrl.dz; };
const openMenu = () => { $('menu').classList.remove('hidden'); $('mQuit').classList.toggle('hidden', G.mode !== 'game'); document.exitPointerLock && document.exitPointerLock(); };
$('btnCtrl').onclick = $('btnCtrl2').onclick = openMenu; $('hbMenu').onclick = openMenu;
// right virtual stick
{ const rj = $('rjoy'), rk = $('rknob'); let id = null;
  const mv = ev => { const r = rj.getBoundingClientRect(); let dx = (ev.clientX - (r.left + r.width / 2)) / (r.width / 2), dy = (ev.clientY - (r.top + r.height / 2)) / (r.height / 2); const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
    rk.style.transform = `translate(${dx * r.width / 2.6}px,${dy * r.height / 2.6}px)`; ctrl.rx = dx; ctrl.ry = dy; };
  rj.addEventListener('pointerdown', ev => { id = ev.pointerId; try { rj.setPointerCapture(id); } catch (e) { } mv(ev); ev.preventDefault(); });
  rj.addEventListener('pointermove', ev => { if (ev.pointerId === id) mv(ev); });
  const end = ev => { if (ev.pointerId !== id) return; id = null; ctrl.rx = ctrl.ry = 0; rk.style.transform = ''; }; rj.addEventListener('pointerup', end); rj.addEventListener('pointercancel', end); }
// gamepad
const dzf = v => Math.abs(v) < ctrl.dz ? 0 : Math.sign(v) * (Math.abs(v) - ctrl.dz) / (1 - ctrl.dz);
function getPad() { const ps = navigator.getGamepads ? navigator.getGamepads() : []; for (const p of ps) if (p && p.connected !== false) return p; return null; }
window.addEventListener('gamepadconnected', ev => { ctrl.padIdx = ev.gamepad.index; $('padStatus').textContent = 'Connected: ' + ev.gamepad.id.slice(0, 40);
  if (ctrl.mode !== 'pad') $('padPrompt').classList.remove('hidden'); else { applyCtrl(); toast('Controller connected'); } });
window.addEventListener('gamepaddisconnected', () => { ctrl.padIdx = -1; $('padStatus').textContent = 'No controller detected'; applyCtrl(); toast('Controller disconnected'); });
$('padYes').onclick = () => { ctrl.mode = 'pad'; $('padPrompt').classList.add('hidden'); applyCtrl(); toast('Using controller'); };
$('padNo').onclick = () => $('padPrompt').classList.add('hidden');
function visibleScreen() { for (const id of ['padPrompt', 'menu', 'scores', 'lobby', 'start']) { const e = $(id); if (!e.classList.contains('hidden')) return e; } return null; }
function focusables(root) { return [...root.querySelectorAll('button,select,input,.char')].filter(e => e.offsetParent !== null && !e.disabled); }
let navIdx = 0, navT = 0;
function menuNav(btn, ax, ay) {
  const root = visibleScreen(); if (!root) return false; const f = focusables(root); if (!f.length) return true;
  navIdx = Math.min(navIdx, f.length - 1); const t = now(); let moved = 0;
  if ((btn(12) || ay < -0.6) && t > navT) moved = -1; if ((btn(13) || ay > 0.6) && t > navT) moved = 1;
  if (moved) { navIdx = (navIdx + moved + f.length) % f.length; navT = t + 0.22; }
  const el = f[navIdx]; document.querySelectorAll('.padfocus').forEach(e => e !== el && e.classList.remove('padfocus')); el.classList.add('padfocus'); if (moved) el.scrollIntoView({ block: 'nearest' });
  const lr = (btn(15) || ax > 0.6) ? 1 : (btn(14) || ax < -0.6) ? -1 : 0;
  if (lr && t > navT) { navT = t + 0.18;
    if (el.tagName === 'SELECT') { el.selectedIndex = Math.max(0, Math.min(el.options.length - 1, el.selectedIndex + lr)); el.dispatchEvent(new Event('change')); }
    else if (el.type === 'range') { el.value = +el.value + lr * (+el.step || 0.1) * 2; el.dispatchEvent(new Event('input')); }
    else { navIdx = (navIdx + lr + f.length) % f.length; } }
  if (pressed(0)) { if (el.type === 'checkbox') { el.checked = !el.checked; el.dispatchEvent(new Event('change')); } else if (el.tagName === 'INPUT' && el.type !== 'range') el.focus(); else el.click(); }
  if (pressed(1)) { if (root.id === 'padPrompt') $('padNo').click(); else if (root.id === 'menu') $('mResume').click(); else if (root.id === 'scores') showScores(false); else { const b = root.querySelector('[data-back]'); if (b) b.click(); } navIdx = 0; }
  return true;
}
let padBtns = [];
const pressed = i => padBtns[i] && !ctrl.prev[i];
function pollPad(dt) {
  const pad = getPad(); if (!pad) { if (ctrl.padIdx >= 0) { ctrl.padIdx = -1; applyCtrl(); } return; }
  if (ctrl.padIdx < 0) { ctrl.padIdx = pad.index; $('padStatus').textContent = 'Connected: ' + pad.id.slice(0, 40); if (ctrl.mode !== 'pad' && !ctrl.prompted) { ctrl.prompted = true; $('padPrompt').classList.remove('hidden'); } applyCtrl(); }
  padBtns = pad.buttons.map(b => b.pressed || b.value > 0.4); const btn = i => !!padBtns[i];
  const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
  const inGame = G.mode === 'game' && G.running && $('menu').classList.contains('hidden') && $('padPrompt').classList.contains('hidden') && $('scores').classList.contains('hidden');
  if (!inGame) { menuNav(btn, ax, ay); if (G.mode === 'game' && pressed(9) && !$('scores').classList.contains('hidden') && !G.ended) showScores(false); }
  else if (ctrl.mode === 'pad' || $('padPrompt').classList.contains('hidden')) {
    const p = me();
    input.padMx = dzf(ax); input.padMz = dzf(ay);
    const lx = dzf(pad.axes[2] || 0), ly = dzf(pad.axes[3] || 0); const sp = ctrl.padSens * 2.4 * dt;
    input.lookDX -= Math.sign(lx) * lx * lx * sp; input.lookDY -= Math.sign(ly) * ly * ly * sp * (invertY ? -1 : 1);
    input.padFire = btn(7) || (pad.buttons[7] && pad.buttons[7].value > 0.3); input.padJump = btn(0);
    if (p && (pressed(3) || pressed(5))) switchWeapon(p, 1); if (p && pressed(4)) switchWeapon(p, -1);
    if (pressed(9)) showScores(true); if (pressed(8)) openMenu();
  }
  ctrl.prev = padBtns.slice();
}
function ctrlFrame(dt) {
  pollPad(dt);
  if (ctrl.mode === 'dual' && (ctrl.rx || ctrl.ry)) { const sp = ctrl.rsSens * 2.6 * dt; input.lookDX -= Math.sign(ctrl.rx) * ctrl.rx * ctrl.rx * sp; input.lookDY -= Math.sign(ctrl.ry) * ctrl.ry * ctrl.ry * sp * (invertY ? -1 : 1); }
}
applyCtrl();
window.__game.ctrl = ctrl;
