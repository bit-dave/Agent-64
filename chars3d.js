// GoldenEye-style low-poly humanoid built in code. Smooth (Gouraud) shaded, ~700 tris.
// Textures are painted at runtime from each character's picture (characters.js), so a new
// avatar only needs its picture + one line.
import * as THREE from './three.module.js';

// ---------- geometry helpers ----------
// rings: [{y, rx, rz, x=0, z=0}] ; builds a closed tube (optionally capped) with u around (front = 0.5)
function tube(rings, sides = 8, { capTop = false, capBot = false, a0 = -Math.PI, a1 = Math.PI, uvFn = null } = {}) {
  const pos = [], uv = [], idx = []; const n = sides + 1;
  let len = [0]; for (let i = 1; i < rings.length; i++) len.push(len[i - 1] + Math.abs(rings[i].y - rings[i - 1].y) + 1e-4);
  const L = len[len.length - 1];
  rings.forEach((r, i) => { for (let s = 0; s < n; s++) { const th = a0 + (a1 - a0) * s / sides;
      const x = (r.x || 0) + r.rx * Math.sin(th), z = (r.z || 0) + r.rz * Math.cos(th); pos.push(x, r.y, z);
      if (uvFn) { const t = uvFn(th, r, i, len[i] / L); uv.push(t[0], t[1]); } else uv.push((th + Math.PI) / (2 * Math.PI), len[i] / L); } });
  for (let i = 0; i < rings.length - 1; i++) for (let s = 0; s < sides; s++) { const a = i * n + s, b = a + 1, c = a + n, d = c + 1;
    // ring i is lower or upper depending on order; produce both-consistent winding (outward)
    if (rings[i + 1].y >= rings[i].y) idx.push(a, b, d, a, d, c); else idx.push(a, d, b, a, c, d); }
  const addCap = (ri, up) => { const r = rings[ri]; const ci = pos.length / 3; pos.push(r.x || 0, r.y + (up ? 0.001 : -0.001), r.z || 0); uv.push(0.5, ri === 0 ? 0 : 1);
    for (let s = 0; s < sides; s++) { const a = ri * n + s, b = a + 1; if (up) idx.push(a, b, ci); else idx.push(b, a, ci); } };
  const lastUp = rings[rings.length - 1].y >= rings[0].y;
  if (capTop) addCap(lastUp ? rings.length - 1 : 0, true); if (capBot) addCap(lastUp ? 0 : rings.length - 1, false);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const mesh = (geo, mat, parent, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent.add(m); return m; };

// ---------- texture painting ----------
function canvasTex(w, h) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.cv = cv; return t; }
const hex = c => '#' + (c >>> 0).toString(16).padStart(6, '0');
function avg(im, r, W, H) { const cv = document.createElement('canvas'); cv.width = cv.height = 8; const g = cv.getContext('2d'); g.drawImage(im, r[0] * W, r[1] * H, r[2] * W, r[3] * H, 0, 0, 8, 8);
  const d = g.getImageData(0, 0, 8, 8).data; let R = 0, G = 0, B = 0; for (let i = 0; i < d.length; i += 4) { R += d[i]; G += d[i + 1]; B += d[i + 2]; } return (Math.round(R / 64) << 16) | (Math.round(G / 64) << 8) | Math.round(B / 64); }
function shade(g, w, h, { sides = 0.35, top = 0.12, bottom = 0.15 } = {}) { // baked folds / AO
  let gr = g.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, `rgba(0,0,0,${sides})`); gr.addColorStop(0.2, 'rgba(0,0,0,0)'); gr.addColorStop(0.3, 'rgba(0,0,0,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.06)'); gr.addColorStop(0.7, 'rgba(0,0,0,0)'); gr.addColorStop(0.8, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${sides})`);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, `rgba(255,255,255,${top})`); gr.addColorStop(0.25, 'rgba(255,255,255,0)'); gr.addColorStop(0.8, 'rgba(0,0,0,0)'); gr.addColorStop(1, `rgba(0,0,0,${bottom})`);
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}
function noise(g, w, h, a = 0.08, n = 300) { for (let i = 0; i < n; i++) { g.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`; g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 3); } }

// Kit = shared textures for one character (painted when the picture loads)
export function makeKit(c) {
  const K = { head: canvasTex(128, 64), torso: canvasTex(64, 64), sleeve: canvasTex(32, 32), pants: canvasTex(32, 64), hair: canvasTex(32, 32), skin: canvasTex(16, 16), shoes: canvasTex(16, 16), colors: {} };
  const paintFlat = (t, col, a = 0.06) => { const g = t.cv.getContext('2d'); g.fillStyle = hex(col); g.fillRect(0, 0, t.cv.width, t.cv.height); noise(g, t.cv.width, t.cv.height, a, 120); t.needsUpdate = true; };
  const paint = (im) => {
    const W = im ? im.width : 1, H = im ? im.height : 1;
    const f = c.face || [0.36, 0.12, 0.28, 0.21]; const fcx = f[0] + f[2] / 2, fb = f[1] + f[3];
    const sh = c.shirt || [fcx - f[2] * 0.3, fb + 0.02, f[2] * 0.6, 0.07], pa = c.pants || [fcx - f[2] * 0.35, 0.75, f[2] * 0.25, 0.08];
    const col = K.colors = {
      skin: c.skin ?? (im ? avg(im, [f[0] + f[2] * 0.4, f[1] + f[3] * 0.45, f[2] * 0.2, f[3] * 0.12], W, H) : 0xd8a080),
      hair: c.hairColor ?? (im ? avg(im, [f[0] + f[2] * 0.2, f[1], f[2] * 0.6, f[3] * 0.06], W, H) : 0x3a2a1a),
      shirt: im ? avg(im, sh, W, H) : 0x667788, pants: im ? avg(im, pa, W, H) : 0x333344,
    };
    const crop = (g, r, x, y, w, h) => { if (im) g.drawImage(im, r[0] * W, r[1] * H, r[2] * W, r[3] * H, x, y, w, h); };
    // HEAD: 128x64. centre half = face picture (front hemisphere); outer quarters = back of head
    { const g = K.head.cv.getContext('2d'); g.fillStyle = hex(col.skin); g.fillRect(0, 0, 128, 64);
      const hairTop = c.hair === 'bald' ? col.skin : col.hair; g.fillStyle = hex(hairTop); g.fillRect(0, 0, 128, 40); g.fillRect(0, 0, 128, 8);
      if (c.hair === 'fur') { g.fillStyle = hex(col.hair); g.fillRect(0, 0, 128, 64); }
      // inset the crop a little so photo background never wraps onto the sides of the head
      const fi = [f[0] + f[2] * 0.08, f[1], f[2] * 0.84, f[3]]; crop(g, fi, 34, 4, 60, 60);
      for (const [x0, x1] of [[30, 40], [98, 88]]) { const e = g.createLinearGradient(x0, 0, x1, 0); e.addColorStop(0, hex(col.skin)); e.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = e; g.fillRect(Math.min(x0, x1), 18, 10, 46); }
      // feather face edges into the side colour
      const e = g.createLinearGradient(32, 0, 40, 0); e.addColorStop(0, hex(col.skin)); e.addColorStop(1, 'rgba(0,0,0,0)');
      K.head.needsUpdate = true; }
    // TORSO: 64x64 ; u .25-.75 front ; v 0 bottom (hips) .. 1 top (shoulders). canvas y inverted
    { const g = K.torso.cv.getContext('2d'); g.fillStyle = hex(col.shirt); g.fillRect(0, 0, 64, 64);
      if (im) { crop(g, sh, 16, 0, 32, 56); crop(g, sh, -2, 0, 20, 56); crop(g, sh, 46, 0, 20, 56); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(0, 0, 14, 56); g.fillRect(50, 0, 14, 56); }
      // hips/pants + belt
      g.fillStyle = hex(col.pants); g.fillRect(0, 56, 64, 8); crop(g, [pa[0], pa[1] - 0.02, pa[2], 0.03], 0, 57, 64, 7);
      g.fillStyle = c.belt !== undefined ? hex(c.belt) : '#1e1a16'; g.fillRect(0, 54, 64, 3);
      if (c.belt !== false) { g.fillStyle = '#b0a070'; g.fillRect(30, 54, 4, 3); }
      noise(g, 64, 64, 0.05, 200); shade(g, 64, 56, { sides: 0.3, top: 0.14, bottom: 0.2 }); K.torso.needsUpdate = true; }
    // SLEEVES 32x32 (v 0 = cuff, 1 = shoulder)
    { const g = K.sleeve.cv.getContext('2d'); if (c.sleeves !== undefined) { g.fillStyle = hex(c.sleeves); g.fillRect(0, 0, 32, 32); noise(g, 32, 32, 0.08, 150); }
      else { g.fillStyle = hex(col.shirt); g.fillRect(0, 0, 32, 32); crop(g, [sh[0], sh[1], sh[2] * 0.5, sh[3]], 0, 0, 32, 32); }
      if (c.shortSleeves) { g.fillStyle = hex(col.skin); g.fillRect(0, 18, 32, 14); }
      shade(g, 32, 32, { sides: 0.3, top: 0.1, bottom: 0.1 }); K.sleeve.needsUpdate = true; }
    // PANTS 32x64 (v 0 = ankle, 1 = hip)
    { const g = K.pants.cv.getContext('2d'); g.fillStyle = hex(col.pants); g.fillRect(0, 0, 32, 64); if (im) { crop(g, pa, 0, 0, 32, 32); crop(g, pa, 0, 32, 32, 32); }
      noise(g, 32, 64, 0.06, 200); shade(g, 32, 64, { sides: 0.3, top: 0.05, bottom: 0.2 });
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(12, 26, 8, 6); K.pants.needsUpdate = true; }
    paintFlat(K.hair, col.hair, 0.12); { const g = K.hair.cv.getContext('2d'); g.strokeStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 12; i++) { g.beginPath(); const x = Math.random() * 32; g.moveTo(x, 0); g.lineTo(x + Math.random() * 4 - 2, 32); g.stroke(); } }
    paintFlat(K.skin, col.skin, 0.04); paintFlat(K.shoes, c.shoes ?? 0x2a2420, 0.08);
    if (K.onPaint) K.onPaint();
  };
  paint(null);
  const im = new Image(); im.onload = () => paint(im); im.src = c.img; return K;
}

// ---------- body geometry (shared, built once) ----------
const HEAD_RINGS = [ // y relative to neck top (chin ~ 0)
  { y: -0.005, rx: 0.035, rz: 0.035, z: 0.035 }, { y: 0.02, rx: 0.06, rz: 0.06, z: 0.022 }, { y: 0.06, rx: 0.074, rz: 0.088, z: 0.008 },
  { y: 0.11, rx: 0.08, rz: 0.1, z: 0.0 }, { y: 0.16, rx: 0.08, rz: 0.102, z: -0.005 }, { y: 0.2, rx: 0.068, rz: 0.088, z: -0.008 }, { y: 0.228, rx: 0.035, rz: 0.05, z: -0.008 }, { y: 0.238, rx: 0.004, rz: 0.004, z: -0.008 }];
const HEAD_TOP = 0.238, FACE_TOP = 0.215;
function headUV(th, r) { // front hemisphere: planar projection of the face picture; back: wrap outer quarters
  const v = Math.min(1, Math.max(0, r.y / FACE_TOP)) * (60 / 64);
  const vv = v; let u; const a = th;
  if (Math.abs(a) <= Math.PI / 2) u = 0.5 + 0.25 * Math.sin(a); else u = a > 0 ? 0.75 + 0.25 * (a - Math.PI / 2) / (Math.PI / 2) : 0.25 - 0.25 * (-a - Math.PI / 2) / (Math.PI / 2);
  return [u, vv];
}
let GEO = null;
function geos() {
  if (GEO) return GEO;
  const T = [ // torso: hips -> shoulders (y relative to hip joint at 0.93)
    { y: 0.0, rx: 0.165, rz: 0.105, z: 0 }, { y: 0.1, rx: 0.148, rz: 0.095, z: 0.0 }, { y: 0.24, rx: 0.16, rz: 0.1, z: 0.01 }, { y: 0.36, rx: 0.19, rz: 0.11, z: 0.012 },
    { y: 0.47, rx: 0.205, rz: 0.1, z: 0.0 }, { y: 0.52, rx: 0.17, rz: 0.08, z: -0.005 }, { y: 0.545, rx: 0.07, rz: 0.06, z: -0.005 }];
  GEO = {
    torso: tube(T, 10, { capBot: true, capTop: true }),
    neck: tube([{ y: -0.02, rx: 0.055, rz: 0.055 }, { y: 0.085, rx: 0.048, rz: 0.05, z: 0.005 }], 8),
    head: tube(HEAD_RINGS, 12, { uvFn: headUV }),
    shoulder: new THREE.IcosahedronGeometry(0.056, 1),
    upperArm: tube([{ y: 0, rx: 0.058, rz: 0.06 }, { y: -0.14, rx: 0.052, rz: 0.055 }, { y: -0.29, rx: 0.042, rz: 0.045 }], 7, { capBot: true }),
    foreArm: tube([{ y: 0.01, rx: 0.044, rz: 0.046 }, { y: -0.1, rx: 0.045, rz: 0.044 }, { y: -0.25, rx: 0.033, rz: 0.036 }], 7, { capBot: true }),
    hand: tube([{ y: 0.0, rx: 0.03, rz: 0.04 }, { y: -0.045, rx: 0.036, rz: 0.05, z: 0.005 }, { y: -0.09, rx: 0.026, rz: 0.04, z: 0.008 }, { y: -0.105, rx: 0.01, rz: 0.015, z: 0.008 }], 6, { capTop: true }),
    thigh: tube([{ y: 0.03, rx: 0.088, rz: 0.095 }, { y: -0.2, rx: 0.078, rz: 0.08, z: 0.005 }, { y: -0.43, rx: 0.058, rz: 0.06 }], 8, { capTop: true }),
    shin: tube([{ y: 0.01, rx: 0.057, rz: 0.06 }, { y: -0.12, rx: 0.058, rz: 0.062, z: -0.008 }, { y: -0.4, rx: 0.042, rz: 0.045 }], 8),
  };
  // shoe: built along z then baked
  const s = tube([{ y: -0.07, rx: 0.045, rz: 0.035 }, { y: 0.02, rx: 0.052, rz: 0.04 }, { y: 0.14, rx: 0.05, rz: 0.035 }, { y: 0.19, rx: 0.025, rz: 0.02 }], 6, { capBot: true, capTop: true });
  s.rotateX(Math.PI / 2); s.translate(0, -0.035, 0); s.scale(1, 1, 1); s.computeVertexNormals(); GEO.shoe = s;
  return GEO;
}
// hair / accessories (per character, cached by style)
function capGeo(scale, frontY, backY, sides = 12) { // shell over the skull; edge height varies front->back
  const rows = 5, n = sides + 1, pos = [], uv = [], idx = [];
  const rAt = y => { for (let i = 1; i < HEAD_RINGS.length; i++) { const a = HEAD_RINGS[i - 1], b = HEAD_RINGS[i]; if (y <= b.y) { const t = (y - a.y) / (b.y - a.y); return { rx: a.rx + (b.rx - a.rx) * t, rz: a.rz + (b.rz - a.rz) * t, z: a.z + (b.z - a.z) * t }; } } return HEAD_RINGS[HEAD_RINGS.length - 1]; };
  for (let r = 0; r <= rows; r++) for (let s = 0; s < n; s++) { const th = -Math.PI + 2 * Math.PI * s / sides; const k = Math.pow(Math.abs(th) / Math.PI, 1.3);
    const edge = frontY * (1 - k) + backY * k; const y = HEAD_TOP + 0.012 - (HEAD_TOP + 0.012 - edge) * (r / rows);
    const R = rAt(Math.max(-0.004, Math.min(HEAD_TOP, y))); const sc = scale * (r === 0 ? 0.6 : 1);
    pos.push(R.rx * sc * Math.sin(th), y, R.z + R.rz * sc * Math.cos(th)); uv.push(s / sides, 1 - r / rows); }
  for (let r = 0; r < rows; r++) for (let s = 0; s < sides; s++) { const a = r * n + s, b = a + 1, c = a + n, d = c + 1; idx.push(a, c, d, a, d, b); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// ---------- build ----------
export function buildCharacter(c, K) {
  const G = geos(); const root = new THREE.Group();
  const M = t => new THREE.MeshLambertMaterial({ map: t });
  const mTorso = M(K.torso), mSleeve = M(K.sleeve), mPants = M(K.pants), mSkin = M(K.skin), mHair = M(K.hair), mShoe = M(K.shoes), mHead = M(K.head);
  const hips = new THREE.Group(); hips.position.y = 0.93; root.add(hips);
  mesh(G.torso, mTorso, hips);
  const neck = mesh(G.neck, mSkin, hips, 0, 0.52, 0.0);
  const head = new THREE.Group(); head.position.set(0, 0.605, 0.008); hips.add(head);
  const headMesh = mesh(G.head, mHead, head);
  // hair styles
  const st = c.hair || 'short';
  if (st === 'short') mesh(capGeo(1.07, 0.19, 0.07), mHair, head);
  if (st === 'curly') mesh(capGeo(1.13, 0.185, 0.07), mHair, head);
  if (st === 'long' || st === 'dreads' || st === 'fur') mesh(capGeo(st === 'fur' ? 1.25 : 1.1, st === 'fur' ? 0.17 : 0.19, 0.05), mHair, head);
  if (st === 'long' || st === 'fur') { const big = st === 'fur' ? 1.35 : 1;
    const curtain = tube([{ y: 0.2, rx: 0.085 * big, rz: 0.1 * big, z: -0.01 }, { y: 0.08, rx: 0.098 * big, rz: 0.11 * big, z: -0.01 }, { y: -0.08, rx: 0.11 * big, rz: 0.1 * big, z: -0.02 }, { y: -0.2, rx: 0.13 * big, rz: 0.08 * big, z: -0.03 }], 10, { a0: Math.PI * 0.42, a1: Math.PI * 1.58 });
    // a0..a1 covers the back + sides (front left open for the face)
    mesh(curtain, new THREE.MeshLambertMaterial({ map: K.hair, side: THREE.DoubleSide }), head); }
  if (st === 'dreads') { const strand = tube([{ y: 0, rx: 0.018, rz: 0.018 }, { y: -0.16, rx: 0.016, rz: 0.016 }, { y: -0.32, rx: 0.011, rz: 0.011 }], 4, { capBot: true });
    for (let i = 0; i < 13; i++) { const a = Math.PI * 0.42 + (Math.PI * 1.16) * i / 12; const m = mesh(strand, mHair, head, Math.sin(a) * 0.088, 0.16 - (i % 2) * 0.03, -0.006 + Math.cos(a) * 0.105);
      m.rotation.z = -Math.sin(a) * 0.18; m.rotation.x = Math.cos(a) * 0.15; m.scale.y = 0.85 + ((i * 7) % 5) * 0.08; } }
  if (st === 'hat') { mesh(capGeo(1.08, 0.205, 0.06), mHair, head); const mh = new THREE.MeshLambertMaterial({ color: c.hat ?? 0x6a4428 });
    const crown = tube([{ y: 0.17, rx: 0.098, rz: 0.115 }, { y: 0.25, rx: 0.088, rz: 0.105 }, { y: 0.29, rx: 0.07, rz: 0.09 }, { y: 0.3, rx: 0.03, rz: 0.06 }], 10, { capTop: true }); mesh(crown, mh, head, 0, 0.03, -0.008);
    const brim = tube([{ y: 0.19, rx: 0.055, rz: 0.07 }, { y: 0.19, rx: 0.1, rz: 0.115 }, { y: 0.175, rx: 0.2, rz: 0.2 }, { y: 0.185, rx: 0.22, rz: 0.215 }], 12); const bm = mesh(brim, new THREE.MeshLambertMaterial({ color: c.hat ?? 0x6a4428, side: THREE.DoubleSide }), head, 0, 0.03, -0.008);
    const band = tube([{ y: 0.175, rx: 0.1, rz: 0.117 }, { y: 0.2, rx: 0.098, rz: 0.115 }], 10); mesh(band, new THREE.MeshLambertMaterial({ color: 0x3a2412 }), head, 0, 0.03, -0.008); }
  if (c.beard !== undefined) { const mb = new THREE.MeshLambertMaterial({ color: c.beard });
    const beard = tube([{ y: 0.045, rx: 0.07, rz: 0.086, z: 0.008 }, { y: 0.012, rx: 0.058, rz: 0.07, z: 0.026 }, { y: -0.02, rx: 0.042, rz: 0.048, z: 0.04 }, { y: -0.045, rx: 0.015, rz: 0.015, z: 0.045 }], 10, { a0: -Math.PI * 0.55, a1: Math.PI * 0.55 });
    const bt = canvasTex(16, 16); { const g = bt.cv.getContext('2d'); g.fillStyle = hex(c.beard); g.fillRect(0, 0, 16, 16); g.strokeStyle = 'rgba(0,0,0,0.3)'; for (let i = 0; i < 10; i++) { g.beginPath(); const x = Math.random() * 16; g.moveTo(x, 0); g.lineTo(x + 1, 16); g.stroke(); } noise(g, 16, 16, 0.12, 60); bt.needsUpdate = true; }
    mesh(beard, new THREE.MeshLambertMaterial({ map: bt, side: THREE.DoubleSide }), head); }
  if (st === 'fur') { const fb = tube([{ y: 0.03, rx: 0.07, rz: 0.08, z: 0.02 }, { y: -0.08, rx: 0.08, rz: 0.06, z: 0.06 }, { y: -0.2, rx: 0.04, rz: 0.03, z: 0.07 }], 8, { a0: -Math.PI * 0.6, a1: Math.PI * 0.6 });
    mesh(fb, new THREE.MeshLambertMaterial({ map: K.hair, side: THREE.DoubleSide }), head); }
  if (c.hood !== undefined) { const hm = new THREE.MeshLambertMaterial({ color: c.hood });
    mesh(tube([{ y: 0.47, rx: 0.17, rz: 0.12, z: -0.02 }, { y: 0.55, rx: 0.13, rz: 0.11, z: -0.03 }, { y: 0.62, rx: 0.1, rz: 0.08, z: -0.05 }], 10), hm, hips); }
  if (c.chain !== undefined) { const ch = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.007, 4, 12), new THREE.MeshLambertMaterial({ color: c.chain, emissive: 0x302000 })); ch.rotation.x = Math.PI / 2 - 0.5; ch.position.set(0, 0.49, 0.045); hips.add(ch); }
  // arms (A-pose)
  const arm = side => { const sh = new THREE.Group(); sh.position.set(side * 0.205, 0.46, -0.005); hips.add(sh); mesh(G.shoulder, mSleeve, sh, -side * 0.012, -0.005, 0);
    mesh(G.upperArm, mSleeve, sh); const el = new THREE.Group(); el.position.y = -0.29; sh.add(el); mesh(G.foreArm, c.shortSleeves ? mSkin : mSleeve, el);
    const hand = new THREE.Group(); hand.position.y = -0.25; el.add(hand); mesh(G.hand, mSkin, hand); sh.rotation.z = side * 0.13; el.rotation.x = -0.15; return { sh, el, hand }; };
  const AL = arm(-1), AR = arm(1);
  // legs
  const leg = side => { const hp = new THREE.Group(); hp.position.set(side * 0.092, 0.0, 0); hips.add(hp); mesh(G.thigh, mPants, hp); const kn = new THREE.Group(); kn.position.y = -0.43; hp.add(kn);
    mesh(G.shin, mPants, kn); const ft = new THREE.Group(); ft.position.y = -0.43; kn.add(ft); mesh(G.shoe, mShoe, ft, 0, 0, 0); hp.rotation.z = side * 0.03; return { hp, kn }; };
  const LL = leg(-1), LR = leg(1);
  const gunHold = new THREE.Group(); gunHold.position.set(0, -0.07, 0.02); gunHold.rotation.x = -Math.PI / 2; AR.hand.add(gunHold);
  root.userData = { head, faceMat: mHead, legL: LL.hp, legR: LR.hp, kneeL: LL.kn, kneeR: LR.kn, armL: AL.sh, armR: AR.sh, elbowL: AL.el, elbowR: AR.el, gunHold, gun: null, mats: [], hips };
  root.traverse(o => { if (o.isMesh) root.userData.mats.push(o.material); });
  return root;
}
