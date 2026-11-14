// Real 3D table props, seen from above: pillar candles in brass dishes, an amethyst cluster with a quartz point
// and a rose-quartz stone, and the brass stand for the crystal ball. Rendered with three.js into one transparent
// canvas laid over the cloth. A warm key light casts soft shadows onto the cloth; candle flames flicker.
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Seeded random so props look the same on every render.
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function glowTexture(inner, outer) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.25, outer);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Lathe-turned shapes are drawn double-sided so their winding never matters (three flips back-face normals).
const brass = () => new THREE.MeshStandardMaterial({ color: 0xb08440, metalness: 0.9, roughness: 0.38, side: THREE.DoubleSide });

function makeCandle({ r, dark, seed }, tex) {
  const rand = rng(seed);
  const g = new THREE.Group();
  // Brass dish
  const dish = new THREE.Mesh(
    new THREE.LatheGeometry([
      new THREE.Vector2(0, 0), new THREE.Vector2(r * 1.25, 0), new THREE.Vector2(r * 1.36, r * 0.08),
      new THREE.Vector2(r * 1.34, r * 0.17), new THREE.Vector2(r * 1.22, r * 0.11), new THREE.Vector2(0, r * 0.09),
    ], 48),
    brass(),
  );
  dish.castShadow = dish.receiveShadow = true;
  g.add(dish);
  // Wax pillar with a melted, dipped top
  const h = r * (1.7 + rand() * 1.1);
  const wax = new THREE.MeshPhysicalMaterial({
    color: dark ? 0x2c2132 : 0xf2e4c4, roughness: 0.55, sheen: 0.6, sheenColor: dark ? 0x6a4a80 : 0xfff2d8,
    emissive: dark ? 0x100510 : 0x3a1a00, emissiveIntensity: dark ? 0.5 : 0.18, side: THREE.DoubleSide,
  });
  const pillar = new THREE.Mesh(
    new THREE.LatheGeometry([
      new THREE.Vector2(0, h - r * 0.22), new THREE.Vector2(r * 0.55, h - r * 0.17), new THREE.Vector2(r * 0.88, h - r * 0.05),
      new THREE.Vector2(r * 0.97, h), new THREE.Vector2(r, h - r * 0.08), new THREE.Vector2(r, r * 0.1),
      new THREE.Vector2(r * 1.02, r * 0.1),
    ], 40),
    wax,
  );
  pillar.castShadow = pillar.receiveShadow = true;
  g.add(pillar);
  // Drips down the side
  const drips = 4 + Math.floor(rand() * 4);
  for (let i = 0; i < drips; i++) {
    const a = rand() * Math.PI * 2;
    const len = r * (0.3 + rand() * 0.9);
    const d = new THREE.Mesh(new THREE.CapsuleGeometry(r * (0.07 + rand() * 0.05), len, 4, 8), wax);
    d.position.set(Math.cos(a) * r * 0.99, h - r * 0.05 - len / 2, Math.sin(a) * r * 0.99);
    d.castShadow = true;
    g.add(d);
  }
  // Wick and flame
  const wick = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.035, r * 0.035, r * 0.3, 6), new THREE.MeshStandardMaterial({ color: 0x140b06 }));
  wick.position.y = h - r * 0.06;
  g.add(wick);
  const flame = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.flame, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  flame.position.y = h + r * 0.28;
  flame.scale.setScalar(r * 1.15);
  flame.material.depthTest = false;
  flame.renderOrder = 10;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.halo, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.3 }));
  halo.position.y = h + r * 0.25;
  halo.scale.setScalar(r * 3.2);
  g.add(flame, halo);
  const light = new THREE.PointLight(0xffa64d, 0.55, r * 12, 0);
  light.position.y = h + r * 1.6;
  g.add(light);
  g.userData = { flame, halo, light, phase: rand() * 100, base: 0.55 };
  return g;
}

function crystalPoint(len, rad) {
  const body = new THREE.CylinderGeometry(rad, rad * 1.08, len * 0.74, 6, 1);
  body.translate(0, len * 0.37, 0);
  const tip = new THREE.ConeGeometry(rad, len * 0.26, 6, 1);
  tip.translate(0, len * 0.87, 0);
  return mergeGeometries([body.toNonIndexed(), tip.toNonIndexed()]);
}

function makeCrystals({ s, seed }) {
  const rand = rng(seed);
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0x3a2a44, roughness: 0.9, flatShading: true });
  const base = new THREE.IcosahedronGeometry(s * 0.17, 1);
  const p = base.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = 0.8 + rand() * 0.35;
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.55, p.getZ(i) * k);
  }
  base.computeVertexNormals();
  const rock = new THREE.Mesh(base, stone);
  rock.castShadow = rock.receiveShadow = true;
  g.add(rock);
  const amethyst = new THREE.MeshPhysicalMaterial({
    color: 0x9d6ae0, roughness: 0.08, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05, flatShading: true,
    transparent: true, opacity: 0.9, iridescence: 0.35, emissive: 0x2a0a50, emissiveIntensity: 0.4, envMapIntensity: 1.6,
  });
  for (let i = 0; i < 9; i++) {
    const len = s * (0.22 + rand() * 0.32);
    const m = new THREE.Mesh(crystalPoint(len, len * (0.14 + rand() * 0.05)), amethyst);
    const az = rand() * Math.PI * 2;
    const tilt = 0.25 + rand() * 0.75;
    m.position.set(Math.cos(az) * s * 0.06, s * 0.02, Math.sin(az) * s * 0.06);
    m.rotation.set(Math.sin(az) * tilt, rand() * Math.PI, -Math.cos(az) * tilt, 'YXZ');
    m.castShadow = true;
    g.add(m);
  }
  // A clear quartz point lying on the cloth
  const quartz = new THREE.Mesh(crystalPoint(s * 0.34, s * 0.045), new THREE.MeshPhysicalMaterial({
    color: 0xeef6ff, roughness: 0.05, clearcoat: 1, flatShading: true, transparent: true, opacity: 0.7, envMapIntensity: 2,
  }));
  quartz.rotation.set(0, 0.9, Math.PI / 2);
  quartz.position.set(-s * 0.32, s * 0.045, s * 0.26);
  quartz.castShadow = true;
  // A tumbled rose quartz
  const rose = new THREE.Mesh(new THREE.SphereGeometry(s * 0.075, 24, 16), new THREE.MeshPhysicalMaterial({
    color: 0xf0b3c4, roughness: 0.3, clearcoat: 0.8, transparent: true, opacity: 0.94, sheen: 0.4,
  }));
  rose.scale.set(1.25, 0.65, 0.9);
  rose.position.set(s * 0.3, s * 0.05, s * 0.3);
  rose.castShadow = true;
  g.add(quartz, rose);
  return g;
}

function makeOrbStand({ d }) {
  const r = d / 2;
  const g = new THREE.Group();
  const m = brass();
  const foot = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0, 0), new THREE.Vector2(r * 1.02, 0), new THREE.Vector2(r * 1.1, r * 0.08), new THREE.Vector2(r * 0.95, r * 0.16),
    new THREE.Vector2(r * 0.7, r * 0.22), new THREE.Vector2(r * 0.62, r * 0.38), new THREE.Vector2(r * 0.7, r * 0.46), new THREE.Vector2(0, r * 0.46),
  ], 64), m);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 0.66, r * 0.06, 12, 64), m);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = r * 0.48;
  foot.castShadow = foot.receiveShadow = ring.castShadow = true;
  g.add(foot, ring);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * r * 0.66, r * 0.48, Math.sin(a) * r * 0.66),
      new THREE.Vector3(Math.cos(a) * r * 1.0, r * 0.75, Math.sin(a) * r * 1.0),
      new THREE.Vector3(Math.cos(a) * r * 0.92, r * 1.05, Math.sin(a) * r * 0.92),
    ]);
    const claw = new THREE.Mesh(new THREE.TubeGeometry(curve, 12, r * 0.05, 8), m);
    claw.castShadow = true;
    g.add(claw);
  }
  // Invisible ball that still casts its shadow on the cloth (the glowing ball itself is drawn on top).
  const ball = new THREE.Mesh(new THREE.SphereGeometry(r * 0.98, 32, 16), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
  ball.position.y = r * 1.23;
  ball.castShadow = true;
  g.add(ball);
  return g;
}

export const ORB_LIFT = 1.23; // ball center height, in ball radii

export default function Props3D({ W, H, candles = [], crystals = null, orb = null }) {
  const ref = useRef(null);
  const key = JSON.stringify({ W, H, candles, crystals, orb });

  useEffect(() => {
    const host = ref.current;
    if (!host || !W || !H) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(W, H);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.45;

    // Camera straight above the table; the cloth plane (z = 0) maps 1:1 onto screen pixels.
    const D = H * 1.9;
    const camera = new THREE.PerspectiveCamera((2 * Math.atan(H / 2 / D) * 180) / Math.PI, W / H, 10, D * 2);
    camera.position.set(0, 0, D);
    camera.lookAt(0, 0, 0);
    const toWorld = (x, y) => [x - W / 2, H / 2 - y];

    scene.add(new THREE.HemisphereLight(0xb8a8d0, 0x2a1010, 0.55));
    const key = new THREE.DirectionalLight(0xfff0dc, 1.7);
    key.position.set(-W * 0.45, H * 0.55, D * 0.55);
    key.castShadow = true;
    const ext = Math.max(W, H) * 0.75;
    Object.assign(key.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 10, far: D * 3 });
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias = -0.0004;
    key.shadow.radius = 6;
    scene.add(key);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(W * 2, H * 2), new THREE.ShadowMaterial({ opacity: 0.55 }));
    ground.receiveShadow = true;
    scene.add(ground);

    const tex = { flame: glowTexture('rgba(255,255,240,1)', 'rgba(255,170,60,1)'), halo: glowTexture('rgba(255,170,80,.5)', 'rgba(255,120,40,.18)') };
    const place = (obj, x, y) => {
      const [wx, wy] = toWorld(x, y);
      obj.rotation.x = Math.PI / 2; // props are modeled Y-up; the table's "up" is +Z
      obj.position.set(wx, wy, 0);
      scene.add(obj);
      return obj;
    };
    const lit = candles.map((c, i) => place(makeCandle({ ...c, seed: 11 + i * 7 }, tex), c.x, c.y));
    if (crystals) place(makeCrystals({ s: crystals.s, seed: 5 }), crystals.x, crystals.y).rotation.y = 0.6;
    if (orb) place(makeOrbStand({ d: orb.d }), orb.x, orb.y);

    let raf = 0, last = 0, alive = true;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const frame = t => {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (t - last < 33) return; // ~30 fps is plenty for candlelight
      last = t;
      for (const c of lit) {
        const u = c.userData;
        const f = reduce ? 1 : 0.86 + 0.1 * Math.sin(t * 0.011 + u.phase) + 0.06 * Math.sin(t * 0.027 + u.phase * 2) + 0.04 * Math.sin(t * 0.063);
        u.flame.scale.setScalar(u.flame.userData.s ??= u.flame.scale.x);
        u.flame.scale.multiplyScalar(f);
        u.halo.material.opacity = 0.4 + 0.15 * f;
        u.light.intensity = u.base * f;
      }
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(frame);
    const vis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(frame);
    };
    document.addEventListener('visibilitychange', vis);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', vis);
      scene.traverse(o => {
        o.geometry?.dispose();
        const m = o.material;
        if (m) (Array.isArray(m) ? m : [m]).forEach(x => { x.map?.dispose(); x.dispose(); });
      });
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return <div ref={ref} className="props3d" aria-hidden="true" />;
}
