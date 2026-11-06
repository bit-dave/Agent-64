// "THE COMPLEX" - fictional arena. Grid + ramps + prop boxes. All geometry low poly, vertex-shaded.
import * as THREE from './three.module.js';
export const X0 = -42, Z0 = -10, GW = 100, GH = 78;
const cells = new Array(GW * GH).fill(null); // {f, c, theme, ramp}
export const ramps = [];
export const props = []; // {min:[x,y,z], max:[x,y,z]}
const propGrid = new Map();
export const ROOMS = [];
const theme = { // GoldenEye-style: concrete walls, tile wainscot, lattice ceilings
  hub:     { floor: 'ftile', wall: 'concrete', wains: 'wtile', ceil: 'lattice', tint: [1.0, 0.97, 0.92] },
  storage: { floor: 'slab', wall: 'gconcrete', wains: 'gtile', ceil: 'lattice', tint: [0.9, 1.0, 0.95] },
  machine: { floor: 'slab', wall: 'concrete', wains: null, ceil: 'lattice', tint: [0.95, 0.97, 1.0] },
  basement:{ floor: 'dark', wall: 'dark', wains: null, ceil: 'dark', tint: [1.25, 0.85, 0.5] },
  clean:   { floor: 'btile', wall: 'gconc2', wains: 'wtile', ceil: 'lattice', tint: [0.95, 1.0, 1.05] },
  long:    { floor: 'btile', wall: 'teal', wains: 'wtile', ceil: 'lattice', tint: [0.95, 1.02, 1.02] },
  prep:    { floor: 'ftile', wall: 'concrete', wains: 'wtile', ceil: 'lattice', tint: [1.0, 0.96, 0.9] },
};
function room(name, x0, z0, x1, z1, f, c, th) {
  ROOMS.push({ name, x0, z0, x1, z1, th });
  for (let x = x0; x < x1; x++) for (let z = z0; z < z1; z++) { const i = x - X0, j = z - Z0; cells[j * GW + i] = { f, c, th }; }
}
function ramp(x0, z0, x1, z1, y0, y1, th) { // slope along +z from y0 (at z0) to y1 (at z1)
  const r = { x0, z0, x1, z1, y0, y1 }; ramps.push(r);
  for (let x = x0; x < x1; x++) for (let z = z0; z < z1; z++) {
    const a = y0 + (y1 - y0) * (z - z0) / (z1 - z0), b = y0 + (y1 - y0) * (z + 1 - z0) / (z1 - z0);
    cells[(z - Z0) * GW + (x - X0)] = { f: Math.min(a, b), c: Math.max(a, b) + 3, th, ramp: r };
  }
}
// ---------- LAYOUT ----------
room('Control Hub', 0, 0, 10, 10, 0, 4.5, 'hub');
room('Hub Doors', 10, 3, 14, 6, 0, 3, 'hub');
room('Storage Bay', 14, -6, 34, 14, 0, 7, 'storage');
room('Bay Doors', 34, -3, 38, 0, 0, 3, 'storage');
room('Pump Room', 38, -6, 48, 4, 0, 3.6, 'machine');
room('Sublevel Hall', 44, 9, 47, 18, -3, -0.5, 'basement');
room('Sublevel', 30, 18, 50, 32, -3, -0.5, 'basement');
ramp(44, 4, 47, 9, 0, -3, 'basement');
ramp(31, 14, 34, 19, 0, -3, 'basement');
room('Hub South Doors', 3, 10, 6, 14, 0, 3, 'clean');
room('White Corridor', -4, 14, 6, 44, 0, 3.5, 'clean');
room('Blue Doors', 0, 44, 3, 48, 0, 3, 'clean');
room('Long Gallery', -34, 48, 6, 63, 0, 4.5, 'long');
room('Prep Hall', -28, 38, -25, 48, 0, 3, 'prep');
room('Prep Room', -31, 30, -23, 38, 0, 3.5, 'prep');
room('Back Hallway', -26, 2, -24, 30, 0, 3, 'prep');
room('Back Hallway', -26, 2, 0, 4, 0, 3, 'prep');

export function cellAt(x, z) {
  const i = Math.floor(x - X0), j = Math.floor(z - Z0);
  if (i < 0 || j < 0 || i >= GW || j >= GH) return null; return cells[j * GW + i];
}
export function floorAt(x, z) {
  const c = cellAt(x, z); if (!c) return -99;
  if (c.ramp) { const r = c.ramp; const t = Math.min(1, Math.max(0, (z - r.z0) / (r.z1 - r.z0))); return r.y0 + (r.y1 - r.y0) * t; }
  return c.f;
}
export function ceilAt(x, z) { const c = cellAt(x, z); if (!c) return -99; return c.ramp ? floorAt(x, z) + 3 : c.c; }
export function roomName(x, z) { for (let i = ROOMS.length - 1; i >= 0; i--) { const r = ROOMS[i]; if (x >= r.x0 && x < r.x1 && z >= r.z0 && z < r.z1) return r.name; } return ''; }

// ---------- TEXTURES (32x32 procedural, nearest filtered) ----------
function rnd(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function makeTex(kind) {
  const S = 64, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d'); const r = rnd(kind.length * 997 + 13);
  const fill = c => { g.fillStyle = c; g.fillRect(0, 0, S, S); };
  const blot = (n, cols, sz = 6, a = 0.25) => { for (let i = 0; i < n; i++) { g.globalAlpha = a; g.fillStyle = cols[Math.floor(r() * cols.length)]; const w = 2 + r() * sz; g.beginPath(); g.ellipse(r() * S, r() * S, w, w * (0.5 + r()), r() * 3, 0, 7); g.fill(); } g.globalAlpha = 1; };
  const tiles = (n, base, grout, var_ = ['#fff', '#000'], gw = 1.5) => { fill(grout); const t = S / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { g.fillStyle = base; g.fillRect(x * t + gw / 2, y * t + gw / 2, t - gw, t - gw);
      g.globalAlpha = 0.07; g.fillStyle = var_[Math.floor(r() * 2)]; g.fillRect(x * t + gw / 2, y * t + gw / 2, t - gw, t - gw);
      g.globalAlpha = 0.18; g.fillStyle = '#fff'; g.fillRect(x * t + gw / 2, y * t + gw / 2, t - gw, 1.5); g.globalAlpha = 1; } blot(10, ['#000', '#fff'], 5, 0.04); };
  switch (kind) {
    case 'concrete': fill('#7d766a'); blot(60, ['#6c665b', '#8b8476', '#746d61', '#958e80'], 8, 0.25); break;
    case 'gconcrete': fill('#5f6a62'); blot(70, ['#4e5951', '#6c776f', '#58635b'], 6, 0.3); break;
    case 'gconc2': fill('#8a8e92'); blot(60, ['#7a7e83', '#9a9ea2', '#83878b'], 9, 0.25); break;
    case 'teal': fill('#5a9a98'); { const gr = g.createLinearGradient(0, 0, 0, S); gr.addColorStop(0, 'rgba(255,255,255,0.15)'); gr.addColorStop(1, 'rgba(0,0,0,0.2)'); g.fillStyle = gr; g.fillRect(0, 0, S, S); } blot(30, ['#4d8a88', '#68aaa8'], 6, 0.2); break;
    case 'dark': fill('#4c4a46'); blot(70, ['#3e3c39', '#5a5853', '#45433f'], 6, 0.3); break;
    case 'wtile': tiles(4, '#dcdcd8', '#4a4a48'); break;
    case 'gtile': tiles(4, '#9aa69c', '#3a423c'); break;
    case 'ftile': tiles(2, '#a8b0b4', '#33383a', ['#fff', '#000'], 1.2); break;
    case 'btile': tiles(4, '#8fa2b2', '#3c4650'); break;
    case 'slab': tiles(1, '#a39a88', '#4a463e', ['#fff', '#000'], 1.2); blot(30, ['#8f8676', '#b0a796'], 10, 0.15); break;
    case 'lattice': fill('#101214'); g.fillStyle = '#3a3e42'; for (let i = 0; i < S; i += 16) { g.fillRect(i, 0, 2, S); g.fillRect(0, i, S, 2); } g.fillStyle = '#24272a'; for (let i = 0; i < S; i += 16) for (let k = 0; k < S; k += 16) g.fillRect(i + 5, k + 5, 8, 8); break;
    case 'redcon': fill('#7d4a3c'); blot(60, ['#6e3f33', '#8c5646'], 6, 0.3); break;
    case 'cinder': fill('#d8d6cf'); g.fillStyle = '#a8a59c'; for (let y = 0; y < S; y += 16) { g.fillRect(0, y, S, 2); const off = (y / 16) % 2 ? 16 : 0; for (let x = off; x < S; x += 32) g.fillRect(x, y, 2, 16); } break;
    case 'white': fill('#e6e4dc'); blot(20, ['#dddad2', '#eeece6'], 8, 0.3); break;
    case 'tile': tiles(4, '#d6caa8', '#8a7e60'); break;
    case 'dropceil': fill('#ecebe6'); g.fillStyle = '#9b9a95'; g.fillRect(0, 0, S, 2); g.fillRect(0, 0, 2, S); break;
    case 'corr': fill('#7d828a'); for (let x = 0; x < S; x += 8) { g.fillStyle = '#9aa0a8'; g.fillRect(x, 0, 4, S); } break;
    case 'metal': fill('#8a9098'); blot(20, ['#7a8088', '#9aa0a8'], 6, 0.25); g.fillStyle = '#5c626a'; g.fillRect(0, 0, S, 2); g.fillRect(0, 0, 2, S); for (let y = 8; y < S; y += 16) { g.fillStyle = '#6a7078'; g.fillRect(0, y, S, 3); } break;
    case 'grate': fill('#2a2c2e'); g.fillStyle = '#6a6e72'; for (let i = 0; i < S; i += 8) { g.fillRect(i, 0, 3, S); g.fillRect(0, i, S, 2); } break;
    case 'crate': fill('#8a6a40'); g.fillStyle = '#5e4424'; g.fillRect(0, 0, S, 4); g.fillRect(0, S - 4, S, 4); g.fillRect(0, 0, 4, S); g.fillRect(S - 4, 0, 4, S); g.save(); g.translate(S / 2, S / 2); g.rotate(Math.PI / 4); g.fillRect(-45, -2, 90, 4); g.restore(); break;
    case 'cage': g.clearRect(0, 0, S, S); g.strokeStyle = '#b8bcc0'; g.lineWidth = 1.5; for (let i = -S; i < S * 2; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke(); g.beginPath(); g.moveTo(i, 0); g.lineTo(i - S, S); g.stroke(); } g.fillStyle = '#b8bcc0'; g.fillRect(0, 0, S, 3); break;
    case 'hazard': fill('#151515'); g.fillStyle = '#e8c020'; for (let i = -S; i < S * 2; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 8, 0); g.lineTo(i + 8 + S, S); g.lineTo(i + S, S); g.fill(); } break;
    case 'bag': fill('#eeeeea'); blot(20, ['#d8d8d2', '#fafaf6'], 8, 0.4); g.fillStyle = '#c8c8c0'; g.fillRect(0, 31, S, 2); break;
    case 'panel': fill('#8e9294'); g.fillStyle = '#6e7274'; g.fillRect(4, 4, 56, 56); g.fillStyle = '#9ea2a4'; g.fillRect(7, 7, 50, 50); g.fillStyle = '#333'; g.fillRect(48, 28, 4, 8); g.fillStyle = '#c03020'; g.fillRect(14, 14, 6, 6); g.fillStyle = '#30a030'; g.fillRect(24, 14, 6, 6); break;
    case 'mat': fill('#1c1c1c'); g.fillStyle = '#c8a820'; g.fillRect(0, 0, S, 4); g.fillRect(0, S - 4, S, 4); break;
    case 'door': { fill('#8a9096'); const gr = g.createLinearGradient(0, 0, S, 0); gr.addColorStop(0, '#9aa0a6'); gr.addColorStop(0.5, '#7c8288'); gr.addColorStop(1, '#9aa0a6'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
      g.fillStyle = '#4a4f54'; g.fillRect(31, 0, 2, S); g.fillRect(0, 0, S, 2); g.fillStyle = '#c8ccd0'; g.fillRect(25, 30, 3, 10); g.fillRect(36, 30, 3, 10); g.fillStyle = '#3a3e42'; g.fillRect(24, 40, 5, 1); g.fillRect(35, 40, 5, 1); break; }
    case 'window': { fill('#2a2e30'); const gr = g.createLinearGradient(0, 0, S, S); gr.addColorStop(0, '#d8e4e0'); gr.addColorStop(0.6, '#a8b8b4'); gr.addColorStop(1, '#7a8a88'); g.fillStyle = gr; g.fillRect(4, 4, S - 8, S - 8); g.fillStyle = '#2a2e30'; g.fillRect(30, 0, 4, S); break; }
    case 'light': fill('#fffef4'); break;
  }
  if (!['lattice', 'cage', 'hazard', 'light', 'window'].includes(kind)) { const c2 = document.createElement('canvas'); c2.width = c2.height = S; const g2 = c2.getContext('2d'); g2.filter = 'blur(0.6px)'; g2.drawImage(cv, 0, 0); g.clearRect(0, 0, S, S); g.drawImage(c2, 0, 0); }
  const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 2;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const texCache = {};
export function tex(k) { return texCache[k] || (texCache[k] = makeTex(k)); }

// ---------- MESH BUILDER ----------
const lamps = [];
for (const r of ROOMS) { const w = r.x1 - r.x0, d = r.z1 - r.z0; const nx = Math.max(1, Math.round(w / 6)), nz = Math.max(1, Math.round(d / 6));
  for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) lamps.push([r.x0 + (a + 0.5) * w / nx, r.z0 + (b + 0.5) * d / nz]); }
function lightAt(x, y, z) {
  let best = 0; for (const l of lamps) { const dx = x - l[0], dz = z - l[1]; const d = Math.sqrt(dx * dx + dz * dz); const v = Math.max(0, 1 - d / 6.5); best += v * v * 0.8; }
  best = Math.min(1, best);
  // ambient occlusion: darker near walls and toward the floor
  const c = cellAt(x, z); let ao = 1;
  if (c) { const f = floorAt(x, z), cl = ceilAt(x, z); const h = (y - f) / Math.max(1, cl - f); ao = 0.72 + 0.28 * Math.min(1, Math.max(0, h * 1.6));
    let near = 0; for (const [ox, oz] of [[0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6]]) if (!cellAt(x + ox, z + oz)) near++; if (y - f < 0.05) ao *= 1 - near * 0.1; }
  return (0.38 + 0.62 * best) * ao;
}
class Builder {
  constructor() { this.g = {}; }
  quad(key, a, b, c, d, uvScale, shade, tint) { // a,b,c,d corners CCW seen from front; uv from world coords
    const G = this.g[key] || (this.g[key] = { p: [], uv: [], col: [] });
    const pts = [a, b, c, d];
    // choose uv plane by normal
    const ux = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], vx = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    const n = [ux[1] * vx[2] - ux[2] * vx[1], ux[2] * vx[0] - ux[0] * vx[2], ux[0] * vx[1] - ux[1] * vx[0]];
    const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
    const uvOf = p => ay >= ax && ay >= az ? [p[0] / uvScale, p[2] / uvScale] : ax >= az ? [p[2] / uvScale, p[1] / uvScale] : [p[0] / uvScale, p[1] / uvScale];
    const idx = [0, 1, 2, 0, 2, 3];
    for (const i of idx) { const p = pts[i]; G.p.push(p[0], p[1], p[2]); const uv = uvOf(p); G.uv.push(uv[0], uv[1]);
      const L = shade * lightAt(p[0], p[1], p[2]) * (0.93 + 0.07 * Math.sin(p[0] * 1.7 + p[2] * 2.3));
      G.col.push(Math.min(1.4, L * tint[0]), Math.min(1.4, L * tint[1]), Math.min(1.4, L * tint[2])); }
  }
  box(key, x0, y0, z0, x1, y1, z1, uvs = 1, tint = [1, 1, 1], faces = 'all') {
    const q = (a, b, c, d, s) => this.quad(key, a, b, c, d, uvs, s, tint);
    q([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], 1.0); // top
    if (faces === 'all') q([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], 0.5);
    q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], 0.78); // +z
    q([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], 0.7); // -z
    q([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], 0.88); // +x
    q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], 0.62); // -x
  }
  cyl(key, cx, y0, cz, r, h, seg = 8, tint = [1, 1, 1], axis = 'y') {
    for (let i = 0; i < seg; i++) {
      const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2; const s = 0.6 + 0.35 * Math.abs(Math.cos((a0 + a1) / 2 - 0.8));
      const P = (a, y) => axis === 'y' ? [cx + Math.cos(a) * r, y, cz + Math.sin(a) * r] : [cx + y, y0 + Math.cos(a) * r, cz + Math.sin(a) * r];
      if (axis === 'y') { this.quad(key, P(a1, y0), P(a0, y0), P(a0, y0 + h), P(a1, y0 + h), 1, s, tint);
        this.quad(key, [cx, y0 + h, cz], P(a1, y0 + h), P(a0, y0 + h), [cx, y0 + h, cz], 1, 1, tint); }
      else { this.quad(key, P(a0, 0), P(a1, 0), P(a1, h), P(a0, h), 1, s, tint); }
    }
  }
  build(scene, opts = {}) {
    for (const k in this.g) {
      const G = this.g[k]; const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(G.p, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(G.uv, 2)); geo.setAttribute('color', new THREE.Float32BufferAttribute(G.col, 3));
      const [texName, col] = k.split('|');
      const m = new THREE.MeshBasicMaterial({ map: texName === 'none' ? null : tex(texName), vertexColors: true, color: col ? new THREE.Color(col) : 0xffffff, side: texName === 'cage' ? THREE.DoubleSide : THREE.FrontSide, transparent: texName === 'cage', alphaTest: texName === 'cage' ? 0.5 : 0 });
      const mesh = new THREE.Mesh(geo, m); mesh.matrixAutoUpdate = false; scene.add(mesh);
    }
  }
}
function addProp(x0, y0, z0, x1, y1, z1) {
  const p = { min: [Math.min(x0, x1), y0, Math.min(z0, z1)], max: [Math.max(x0, x1), y1, Math.max(z0, z1)] }; props.push(p);
  for (let x = Math.floor(p.min[0]); x <= Math.floor(p.max[0]); x++) for (let z = Math.floor(p.min[2]); z <= Math.floor(p.max[2]); z++) {
    const k = x * 1000 + z; if (!propGrid.has(k)) propGrid.set(k, []); propGrid.get(k).push(p); }
  return p;
}
export function propsNear(x, z) { return propGrid.get(Math.floor(x) * 1000 + Math.floor(z)) || []; }

export function buildLevel(scene) {
  const B = new Builder();
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const c = cells[j * GW + i]; if (!c) continue; const T = theme[c.th]; const x = X0 + i, z = Z0 + j;
    const fa = floorAt(x + 0.5, z + 0.001), fb = floorAt(x + 0.5, z + 0.999); // ramp along z
    const y00 = c.ramp ? c.ramp.y0 + (c.ramp.y1 - c.ramp.y0) * (z - c.ramp.z0) / (c.ramp.z1 - c.ramp.z0) : c.f;
    const y01 = c.ramp ? c.ramp.y0 + (c.ramp.y1 - c.ramp.y0) * (z + 1 - c.ramp.z0) / (c.ramp.z1 - c.ramp.z0) : c.f;
    const floorKey = c.ramp ? 'metal' : T.floor;
    B.quad(floorKey, [x, y01, z + 1], [x + 1, y01, z + 1], [x + 1, y00, z], [x, y00, z], 2, 0.85, T.tint);
    const cy0 = c.ramp ? y00 + 3 : c.c, cy1 = c.ramp ? y01 + 3 : c.c;
    B.quad(T.ceil, [x, cy0, z], [x + 1, cy0, z], [x + 1, cy1, z + 1], [x, cy1, z + 1], T.ceil === 'dropceil' ? 2 : 2, 0.7, T.tint);
    if (c.ramp && (j % 1 === 0)) { // step lines on ramps (visual stairs)
      for (let s = 0; s < 3; s++) { const zz = z + s / 3, yy = floorAt(x + 0.5, zz) + 0.01; B.quad('dark', [x, yy, zz + 0.06], [x + 1, yy, zz + 0.06], [x + 1, yy, zz], [x, yy, zz], 1, 0.7, [1, 1, 1]); } }
    for (const [dx, dz] of dirs) {
      const n = cellAt(x + dx + 0.5, z + dz + 0.5);
      // edge endpoints (as seen from inside this cell, CCW)
      let e0, e1; if (dx === 1) { e0 = [x + 1, z + 1]; e1 = [x + 1, z]; } else if (dx === -1) { e0 = [x, z]; e1 = [x, z + 1]; } else if (dz === 1) { e0 = [x, z + 1]; e1 = [x + 1, z + 1]; } else { e0 = [x + 1, z]; e1 = [x, z]; }
      const fy0 = Math.min(y00, y01), cyT = Math.max(cy0, cy1);
      const sh = dx !== 0 ? 0.85 : 0.72;
      const q = (yb, yt, key) => { if (yt - yb < 0.01) return; B.quad(key, [e1[0], yb, e1[1]], [e0[0], yb, e0[1]], [e0[0], yt, e0[1]], [e1[0], yt, e1[1]], 2, sh, T.tint); };
      const wall = (yb, yt, key) => { // tile wainscot below 1.25m, concrete above; split for smoother vertex lighting
        const wy = c.f + 1.25; const cuts = [yb]; if (T.wains && wy > yb && wy < yt) cuts.push(wy); const mid = (Math.max(yb, wy) + yt) / 2; if (yt - yb > 3 && mid > cuts[cuts.length - 1] + 0.5) cuts.push(mid); cuts.push(yt);
        for (let k = 0; k < cuts.length - 1; k++) q(cuts[k], cuts[k + 1], T.wains && cuts[k + 1] <= wy + 0.001 ? T.wains : key);
        if (T.wains && wy > yb && wy < yt) { const n = [e1[1] - e0[1], 0, e0[0] - e1[0]]; const o = 0.03; // tile cap trim
          B.quad('none|#9a9a96', [e1[0] + n[0] * o, wy, e1[1] + n[2] * o], [e0[0] + n[0] * o, wy, e0[1] + n[2] * o], [e0[0] + n[0] * o, wy + 0.06, e0[1] + n[2] * o], [e1[0] + n[0] * o, wy + 0.06, e1[1] + n[2] * o], 1, sh, T.tint); } };
      if (!n) { wall(fy0, cyT, T.wall); continue; }
      const nc = n.ramp ? ceilAt(x + dx + 0.5, z + dz + 0.5) : n.c; const nf = n.ramp ? Math.min(floorAt(x + dx + 0.5, z + dz + 0.01), floorAt(x + dx + 0.5, z + dz + 0.99)) : n.f;
      if (nc < cyT) wall(nc, cyT, T.wall);
      if (!c.ramp && !n.ramp && nf > c.f) wall(c.f, nf, T.wall);
    }
  }
  // ---- PROPS ----
  const P = (key, x0, y0, z0, x1, y1, z1, collide = true, uvs = 1, tint) => { B.box(key, x0, y0, z0, x1, y1, z1, uvs, tint); if (collide) addProp(x0, y0, z0, x1, y1, z1); };
  const decal = (key, x0, z0, x1, z1, y = 0.02) => B.quad(key, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], 2, 0.9, [1, 1, 1]);
  const barrel = (x, z, y = 0, col = '#3060c0') => { B.cyl('none|' + col, x, y, z, 0.4, 1.2, 8); addProp(x - 0.4, y, z - 0.4, x + 0.4, y + 1.2, z + 0.4); };
  const rack = (x0, z0, x1, z1, h = 4.2) => {
    const post = 'none|#3a8a3a', beam = 'none|#e07020';
    for (const px of [x0, (x0 + x1) / 2, x1 - 0.15]) for (const pz of [z0, z1 - 0.15]) B.box(post, px, 0, pz, px + 0.15, h, pz + 0.15);
    for (const y of [1.3, 2.7, 4.0]) { B.box(beam, x0, y, z0, x1, y + 0.15, z0 + 0.15); B.box(beam, x0, y, z1 - 0.15, x1, y + 0.15, z1); B.box('crate', x0 + 0.1, y - 0.05, z0 + 0.1, x1 - 0.1, y, z1 - 0.1, 1); }
    for (let x = x0 + 0.2; x < x1 - 1; x += 1.4) { B.box('bag', x, 0, z0 + 0.15, x + 1.1, 1.1, z1 - 0.15); B.box('bag', x, 1.45, z0 + 0.2, x + 1.1, 2.4, z1 - 0.2);
      B.cyl('none|#2050b0', x + 0.55, 2.85, (z0 + z1) / 2, 0.38, 1.0, 8); }
    addProp(x0, 0, z0, x1, h, z1);
  };
  // Hub
  P('panel', 0, 0.8, 0, 2, 2.6, 0.3); P('panel', 2.3, 0.8, 0, 3.6, 2.2, 0.35); P('panel', 6.5, 0.6, 0, 8.5, 2.4, 0.3);
  decal('hazard', 6, 6, 8.5, 8.5); decal('hazard', 1, 7, 2.5, 8.5);
  P('crate', 2, 0, 4.5, 3.2, 1.2, 5.7); P('crate', 7, 0, 2, 8, 1, 3);
  P('door', 9.9, 0, 3, 10, 2.6, 3.1, false); // door leaves (opened)
  // Storage bay
  rack(17, -3.2, 24, -1.8); rack(26, -3.2, 32, -1.8); rack(17, 9.6, 23, 11);
  barrel(20.5, 3); barrel(21.4, 3.1); barrel(20.9, 3.9); barrel(31, 7, 0, '#a0a8b0'); barrel(31.9, 7.4, 0, '#3060c0');
  P('none|#3a5aa8', 27.5, 0, 3.5, 30.5, 1.3, 5.5); B.box('none|#3a5aa8', 27.5, 1.3, 3.5, 27.7, 3, 3.7); B.box('none|#3a5aa8', 30.3, 1.3, 5.3, 30.5, 3, 5.5); B.box('none|#3a5aa8', 27.5, 3, 3.5, 30.5, 3.2, 5.5);
  P('none|#8a9098', 23, 0, 5, 24.5, 1.5, 7); P('white', 14, 0, 1.5, 15.2, 3.6, 3.3);
  P('none|#a0a4ac', 24, 0, 6.5, 25.6, 1.4, 7.6); P('none|#2a5ad0', 29.5, 0, 11.5, 33, 0.95, 12.5);
  P('crate', 15.5, 0, -5.5, 16.8, 1.3, -4.2); P('crate', 15.5, 1.3, -5.3, 16.6, 2.4, -4.4);
  // pipes / ducts on storage ceiling
  B.cyl('none|#9aa0a8', 14, 6.2, 0, 0.35, 20, 6, [1, 1, 1], 'x'); B.cyl('none|#9aa0a8', 14, 6.2, 8, 0.25, 20, 6, [1, 1, 1], 'x');
  // Pump room
  P('none|#3a8a4a', 39, 0, -5.5, 41.5, 2.8, -3); B.box('none|#2a2a2a', 39.5, 2.8, -5, 41, 3.2, -3.5);
  B.cyl('none|#d8b020', 43.5, 0, 0, 1, 2, 8); addProp(42.5, 0, -1, 44.5, 2, 1);
  barrel(39.6, 2.6, 0, '#b02020');
  B.cyl('none|#303438', 43.5, 1.2, -3.5, 1.1, 3.4, 8, [1, 1, 1], 'x');
  P('cage', 43, 0, -5.5, 47.5, 2.9, -1.5, true, 1);
  // Sublevel (basement) floor y=-3, ceiling -0.5
  const Y = -3;
  P('metal', 33, Y, 20, 47, Y + 0.5, 21.5); P('metal', 36, Y, 26, 48, Y + 0.5, 27.5);
  for (const [x0, x1, z] of [[33, 47, 20], [33, 47, 21.45], [36, 48, 26], [36, 48, 27.45]]) B.box('none|#d0a020', x0, Y + 1.4, z, x1, Y + 1.5, z + 0.05);
  for (const x of [36, 41, 46]) P('dark', x, Y, 23.5, x + 0.6, -0.5, 24.1);
  P('dark', 32, Y, 29, 32.6, -0.5, 29.6); P('crate', 48, Y, 29.5, 49.5, Y + 1.2, 31); barrel(44, 30, Y, '#3060c0'); barrel(44.9, 30.5, Y, '#3060c0');
  for (let z = 19; z < 32; z += 2.5) B.cyl('none|#5a6066', 30, -0.9, z, 0.18, 20, 6, [1, 1, 1], 'x');
  B.cyl('none|#8a5a30', 30, -1.3, 25, 0.25, 20, 6, [1, 1, 1], 'x');
  for (const [x, z] of [[34, 24], [42, 22.5], [46, 29], [38, 30], [45.5, 13]]) B.box('none|#ffb030', x, -0.62, z, x + 0.6, -0.5, z + 0.3, 1, [1.5, 1.5, 1.5]);
  for (const [x, z] of [[39, 24.6], [33, 26]]) { B.cyl('none|#3a3a3a', x, Y + 0.01, z, 0.6, 0.02, 10); B.cyl('none|#d8b020', x, Y + 0.005, z, 0.72, 0.01, 10); }
  P('none|#151515', 30, Y, 24, 30.12, Y + 2.3, 26.5, false);
  // White corridor: machine blocks forming central lane
  for (const [z0, z1] of [[16, 20], [22, 27], [29, 34], [36, 41]]) P('none|#b8c4cc', -3.5, 0, z0, -0.2, 2, z1);
  for (const [z0, z1] of [[17, 21], [24, 29], [31, 36], [38, 42]]) P('none|#a8c8e0', 3.4, 0, z0, 5.6, 1.8, z1);
  for (const z of [21, 28, 35]) { B.cyl('none|#f4f4f0', 4.4, 0.2, z, 0.35, 1.2, 8); B.cyl('none|#f4f4f0', -2, 2.4, z, 0.3, 1, 8, [1, 1, 1], 'x'); }
  P('none|#3060c0', 0, 0, 43.9, 3, 2.6, 44, false);
  // Long gallery
  for (const [x0, x1] of [[-30, -20], [-18, -8], [-6, 3]]) { P('none|#c8dcc8', x0, 0, 55, x1, 1.3, 56.5); B.box('none|#e8eee8', x0 + 0.5, 1.3, 55.3, x1 - 0.5, 1.9, 56.2); }
  decal('mat', -30, 53.5, 3, 54.8); decal('mat', -30, 56.8, 3, 58);
  P('none|#909498', -33.5, 0, 49, -31, 2.2, 52); P('none|#b8bcc0', -15, 0, 59.2, -9, 0.9, 60.4); P('none|#909498', -33.5, 0, 59, -31, 2.2, 62.5);
  P('crate', -2, 0, 60, -0.8, 1.2, 61.2); P('crate', -24, 0, 49.5, -22.8, 1.2, 50.7);
  // Prep room
  B.cyl('none|#c8ccd0', -27, 0.25, 33, 0.7, 1.4, 10); addProp(-27.7, 0, 32.3, -26.3, 1.65, 33.7);
  P('none|#888c90', -30.5, 0, 36.2, -28, 0.9, 37.3); P('white', -24, 1.2, 30, -23.1, 2, 30.1, false);
  P('none|#f0f0f0', -1, 0, 3.8, 0.02, 2.4, 2.2, false);
  // ================= GoldenEye-style detail pass =================
  const box = (key, x0, y0, z0, x1, y1, z1, tint) => B.box(key, Math.min(x0, x1), y0, Math.min(z0, z1), Math.max(x0, x1), y1, Math.max(z0, z1), 1, tint);
  // door frames on every doorway (steel jambs + header), both faces of the wall
  const frame = (axis, at, a0, a1, top, y0 = 0) => { const t = 0.14, d = 0.12, k = 'none|#6e747a';
    if (axis === 'x') { box(k, at - d, y0, a0 - t, at + d, y0 + top, a0); box(k, at - d, y0, a1, at + d, y0 + top, a1 + t); box(k, at - d, y0 + top - 0.02, a0 - t, at + d, y0 + top + 0.18, a1 + t); }
    else { box(k, a0 - t, y0, at - d, a0, y0 + top, at + d); box(k, a1, y0, at - d, a1 + t, y0 + top, at + d); box(k, a0 - t, y0 + top - 0.02, at - d, a1 + t, y0 + top + 0.18, at + d); } };
  frame('x', 10, 3, 6, 2.95); frame('x', 14, 3, 6, 2.95); frame('x', 34, -3, 0, 2.95); frame('x', 38, -3, 0, 2.95);
  frame('z', 10, 3, 6, 2.95); frame('z', 14, 3, 6, 2.95); frame('z', 44, 0, 3, 2.95); frame('z', 48, 0, 3, 2.95);
  frame('z', 48, -28, -25, 2.95); frame('z', 38, -28, -25, 2.95); frame('x', 0, 2, 4, 2.95); frame('z', 4, 44, 47, 2.95);
  frame('z', 30, -26, -24, 2.95); frame('z', 14, 31, 34, 2.95);
  // closed grey steel double doors (decor) set into walls, with frames
  const ddoor = (axis, at, a0, side, y0 = 0) => { const w = 2.0, h = 2.4, o = side * 0.02; // side: which way the room is (+1/-1)
    if (axis === 'z') { B.quad('door', [a0, y0, at + o], [a0 + w, y0, at + o], [a0 + w, y0 + h, at + o], [a0, y0 + h, at + o].map(v => v), 2, 0.95, [1, 1, 1]);
      if (side < 0) {} frame('z', at, a0, a0 + w, h, y0); }
    else { B.quad('door', [at + o, y0, a0 + w], [at + o, y0, a0], [at + o, y0 + h, a0], [at + o, y0 + h, a0 + w], 2, 0.95, [1, 1, 1]); frame('x', at, a0, a0 + w, h, y0); } };
  const dq = (pts) => B.quad('door', ...pts, 2, 0.95, [1, 1, 1]);
  // facing +z (wall at low z), facing -z (wall at high z), facing +x, facing -x
  const doorZp = (z, x0, y0 = 0) => { dq([[x0, y0, z + 0.02], [x0 + 2, y0, z + 0.02], [x0 + 2, y0 + 2.4, z + 0.02], [x0, y0 + 2.4, z + 0.02]]); frame('z', z, x0, x0 + 2, 2.4, y0); };
  const doorZm = (z, x0, y0 = 0) => { dq([[x0 + 2, y0, z - 0.02], [x0, y0, z - 0.02], [x0, y0 + 2.4, z - 0.02], [x0 + 2, y0 + 2.4, z - 0.02]]); frame('z', z, x0, x0 + 2, 2.4, y0); };
  const doorXp = (x, z0, y0 = 0) => { dq([[x + 0.02, y0, z0 + 2], [x + 0.02, y0, z0], [x + 0.02, y0 + 2.4, z0], [x + 0.02, y0 + 2.4, z0 + 2]]); frame('x', x, z0, z0 + 2, 2.4, y0); };
  const doorXm = (x, z0, y0 = 0) => { dq([[x - 0.02, y0, z0], [x - 0.02, y0, z0 + 2], [x - 0.02, y0 + 2.4, z0 + 2], [x - 0.02, y0 + 2.4, z0]]); frame('x', x, z0, z0 + 2, 2.4, y0); };
  doorZp(0, 4.1); doorZp(-6, 29.5); doorXm(48, -0.5); doorZm(63, -11); doorXp(-4, 30); doorZm(63, 2); doorXp(-34, 55); doorZm(32, 40, -3); doorZp(30, -30);
  // fluorescent strip lights on ceilings (merged, emissive)
  for (const r of ROOMS) { const w = r.x1 - r.x0, d = r.z1 - r.z0; const cy = cellAt(r.x0 + 0.5, r.z0 + 0.5); if (!cy || cy.ramp) continue; const y = cy.c - 0.04;
    const along = w >= d; const n = Math.max(1, Math.round((along ? w : d) / 5)); const m = Math.max(1, Math.round((along ? d : w) / 5));
    for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) { const cx = r.x0 + (along ? (i + 0.5) * w / n : (j + 0.5) * w / m), cz = r.z0 + (along ? (j + 0.5) * d / m : (i + 0.5) * d / n);
      const lx = along ? 1.2 : 0.18, lz = along ? 0.18 : 1.2; box('none|#3a3c3e', cx - lx / 2 - 0.05, y - 0.06, cz - lz / 2 - 0.05, cx + lx / 2 + 0.05, y, cz + lz / 2 + 0.05);
      B.quad(cy.th === 'basement' ? 'none|#ffb040' : 'light', [cx - lx / 2, y - 0.065, cz - lz / 2], [cx + lx / 2, y - 0.065, cz - lz / 2], [cx + lx / 2, y - 0.065, cz + lz / 2], [cx - lx / 2, y - 0.065, cz + lz / 2], 1, 1.6, [1, 1, 1]); } }
  // storage bay: high beams, catwalk with railings along the north wall, windows, steel stair, dark tanks on legs
  for (let x = 16; x < 34; x += 4) box('none|#3e4448', x, 6.3, -6, x + 0.35, 6.75, 14);
  box('none|#3e4448', 14, 6.4, 4, 34, 6.7, 4.35);
  box('grate', 14, 3.5, -6, 34, 3.65, -4.6); for (let x = 14.2; x < 34; x += 2) box('none|#2e3236', x, 3.65, -4.68, x + 0.07, 4.65, -4.6);
  box('none|#2e3236', 14, 4.6, -4.68, 34, 4.67, -4.6); box('none|#2e3236', 14, 4.1, -4.68, 34, 4.14, -4.6);
  for (let x = 16; x < 34; x += 3) box('none|#2e3236', x, 0, -4.75, x + 0.12, 3.5, -4.63);
  for (let x = 15; x < 33; x += 3) B.quad('window', [x, 4.3, -5.98], [x + 1.8, 4.3, -5.98], [x + 1.8, 5.6, -5.98], [x, 5.6, -5.98], 1.8, 1.1, [1, 1, 1]);
  // stair up to catwalk (east end), solid underneath so nobody walks through it
  for (let k = 0; k < 12; k++) { const y = 0.29 * (k + 1), x = 20 + k * 0.6; box('grate', x, y - 0.06, -5.9, x + 0.6, y, -4.65); }
  box('none|#2e3236', 20, 0, -4.7, 27.2, 0.1, -4.6); for (let k = 0; k <= 12; k += 3) box('none|#2e3236', 20 + k * 0.6, 0.29 * k, -4.68, 20.06 + k * 0.6, 0.29 * k + 1.0, -4.6);
  addProp(20, 0, -6, 27.2, 3.5, -4.6);
  for (const [tx, tz] of [[16.6, 6.6], [19.2, 7.4]]) { B.cyl('none|#1c1e20', tx, 1.1, tz, 1.0, 3.2, 8); B.cyl('none|#2a2c2e', tx, 4.3, tz, 0.3, 0.3, 6);
    for (const [ox, oz] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) box('none|#222', tx + ox - 0.07, 0, tz + oz - 0.07, tx + ox + 0.07, 1.15, tz + oz + 0.07);
    addProp(tx - 0.95, 0, tz - 0.95, tx + 0.95, 4.3, tz + 0.95); }
  // pipes: red/grey runs under ceilings (pump room, white corridor, back hallway)
  for (const [z, col] of [[-5.3, '#8a2a22'], [-4.8, '#7a8288'], [3.4, '#8a2a22']]) B.cyl('none|' + col, 38, 3.25, z, 0.12, 10, 6, [1, 1, 1], 'x');
  for (const [x, col] of [[-3.3, '#8a2a22'], [-2.8, '#6a7278'], [5.3, '#8a2a22']]) {     for (let z = 14; z < 44; z += 1) B.box('none|' + col, x - 0.1, 3.18, z, x + 0.1, 3.38, z + 1.0); }
  for (let z = 2; z < 30; z += 1) B.box('none|#7a2a22', -25.95, 2.7, z, -25.8, 2.85, z + 1);
  // long gallery: teal partition stalls along the south wall (low, cover)
  for (const x of [-30, -24, -4]) { box('teal', x, 0, 60.5, x + 0.12, 2.2, 63); addProp(x, 0, 60.5, x + 0.12, 2.2, 63); }
  // clean corridor: wall radiators/handrails like the reference
  for (const z of [16, 24, 32, 40]) { box('none|#c8ccd0', 5.85, 0.3, z, 6, 0.9, z + 3); box('none|#5a6066', 5.8, 1.0, z - 0.5, 5.95, 1.06, z + 3.5); }
  // hub: tall atrium feel - upper walkway ledge with window openings on the east wall
  box('none|#6a6e72', 8.6, 3.0, 0, 10, 3.2, 10); for (let z = 0.5; z < 10; z += 1.6) B.quad('window', [9.98, 3.4, z], [9.98, 3.4, z + 1], [9.98, 4.2, z + 1], [9.98, 4.2, z], 1, 1.1, [1, 1, 1]);
  B.build(scene);
}
// ---------- spawn points ----------
export const SPAWNS = [[5, 0, 5], [20, 0, 0], [30, 0, 9], [40, 0, 0], [40, -3, 29], [46, -3, 22], [1.5, 0, 25], [1.5, 0, 40], [-10, 0, 52], [-28, 0, 60], [-27, 0, 35], [-25, 0, 15], [24, 0, 12], [-15, 0, 3]];
// ---------- collision helpers ----------
export const STEP = 0.55;
export function blockedAt(x, z, feet, head, r) {
  for (const [ox, oz] of [[-r, -r], [r, -r], [-r, r], [r, r], [0, 0]]) {
    const c = cellAt(x + ox, z + oz); if (!c) return true;
    const f = floorAt(x + ox, z + oz), cl = ceilAt(x + ox, z + oz);
    if (f > feet + STEP) return true; if (cl < Math.max(f, feet) + 1.5) return true;
  }
  for (const p of propsNear(x, z).concat(propsNear(x + r, z + r), propsNear(x - r, z - r))) {
    if (x + r > p.min[0] && x - r < p.max[0] && z + r > p.min[2] && z - r < p.max[2] && p.max[1] > feet + STEP && p.min[1] < head) return true;
  }
  return false;
}
export function groundAt(x, z, feet, r) {
  let g = floorAt(x, z);
  for (const p of propsNear(x, z).concat(propsNear(x + r, z + r), propsNear(x - r, z - r))) {
    if (x + r > p.min[0] && x - r < p.max[0] && z + r > p.min[2] && z - r < p.max[2] && p.max[1] <= feet + STEP && p.max[1] > g) g = p.max[1];
  }
  return g;
}
export function solidAt(x, y, z) {
  const c = cellAt(x, z); if (!c) return true; if (y < floorAt(x, z) || y > ceilAt(x, z)) return true;
  for (const p of propsNear(x, z)) if (x > p.min[0] && x < p.max[0] && y > p.min[1] && y < p.max[1] && z > p.min[2] && z < p.max[2]) return true;
  return false;
}
// returns distance to first solid along ray (step-marched), max d
export function rayWorld(o, d, maxD) {
  const st = 0.12; let t = 0;
  while (t < maxD) { t += st; if (solidAt(o.x + d.x * t, o.y + d.y * t, o.z + d.z * t)) { // refine
      let a = t - st, b = t; for (let k = 0; k < 5; k++) { const m = (a + b) / 2; if (solidAt(o.x + d.x * m, o.y + d.y * m, o.z + d.z * m)) b = m; else a = m; } return a; } }
  return maxD;
}
// ---------- waypoint graph ----------
export const NODES = [];
export function buildNav() {
  for (let j = 0; j < GH; j += 2) for (let i = 0; i < GW; i += 2) {
    const x = X0 + i + 1, z = Z0 + j + 1; if (!cellAt(x, z)) continue; const y = floorAt(x, z);
    if (blockedAt(x, z, y, y + 1.7, 0.3)) continue; NODES.push({ x, y, z, n: [] });
  }
  for (const a of NODES) for (const b of NODES) {
    if (a === b) continue; const dx = b.x - a.x, dz = b.z - a.z; const d = Math.hypot(dx, dz); if (d > 2.9) continue;
    let ok = true, py = a.y; const steps = Math.ceil(d / 0.25);
    for (let s = 1; s <= steps; s++) { const x = a.x + dx * s / steps, z = a.z + dz * s / steps; const g = groundAt(x, z, py, 0.3);
      if (Math.abs(g - py) > 0.6 || blockedAt(x, z, g, g + 1.7, 0.3)) { ok = false; break; } py = g; }
    if (ok) a.n.push(b);
  }
}
export function nearestNode(x, y, z) { let best = null, bd = 1e9; for (const n of NODES) { const d = (n.x - x) ** 2 + (n.z - z) ** 2 + ((n.y - y) * 3) ** 2; if (d < bd) { bd = d; best = n; } } return best; }
export function findPath(a, b) {
  if (!a || !b) return []; const open = [a], came = new Map(), gs = new Map([[a, 0]]), fs = new Map([[a, 0]]); const closed = new Set(); let it = 0;
  while (open.length && it++ < 3000) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (fs.get(open[i]) < fs.get(open[bi])) bi = i; const cur = open.splice(bi, 1)[0];
    if (cur === b) { const p = [cur]; let c = cur; while (came.has(c)) { c = came.get(c); p.unshift(c); } return p; }
    closed.add(cur);
    for (const n of cur.n) { if (closed.has(n)) continue; const g = gs.get(cur) + Math.hypot(n.x - cur.x, n.z - cur.z, n.y - cur.y);
      if (!gs.has(n) || g < gs.get(n)) { came.set(n, cur); gs.set(n, g); fs.set(n, g + Math.hypot(b.x - n.x, b.z - n.z, b.y - n.y)); if (!open.includes(n)) open.push(n); } }
  }
  return [];
}
