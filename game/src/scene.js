// The three.js scene: builds every mesh of Solara Coast from the procedural world
// and updates the sky, sun, water and the camera each frame. This file is
// geometry and materials only — no game rules live here. The roadblock barriers
// are pre-built once and handed to the police system, and the overview lighting
// tweak gives the staged map shot a flat, readable sun.

import * as THREE from 'three';
import { CITY, COLOURS } from './config.js';

const V3 = THREE.Vector3;
const tmp = new V3();

function box(w, h, d, colour) {
  const m = new THREE.MeshLambertMaterial({ color: colour });
  const g = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(g, m);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeBuilding(b) {
  const mesh = box(b.w, b.h, b.d, b.colour);
  mesh.position.set(b.x, b.h / 2, b.z);
  if (b.style === 'tower') {
    const roof = box(b.w * 0.4, 3, b.d * 0.4, COLOURS.buildingD);
    roof.position.set(0, b.h + 1.5, 0);
    mesh.add(roof);
  }
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(b.w - 1, 1.4, b.d - 1),
    new THREE.MeshBasicMaterial({ color: COLOURS.window })
  );
  glow.position.set(0, b.h * 0.62, 0);
  mesh.add(glow);
  return mesh;
}

function makePalm(x, z, s) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18 * s, 0.32 * s, 5.5 * s, 5),
    new THREE.MeshLambertMaterial({ color: COLOURS.palmTrunk })
  );
  trunk.position.y = 2.75 * s;
  trunk.castShadow = true;
  group.add(trunk);
  const leaf = new THREE.MeshLambertMaterial({ color: COLOURS.palmLeaf, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i += 1) {
    const ang = (i / 7) * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.PlaneGeometry(4.4 * s, 1.4 * s), leaf);
    frond.position.set(Math.cos(ang) * 2.4 * s, 5.8 * s, Math.sin(ang) * 2.4 * s);
    frond.rotation.y = -ang;
    frond.rotation.z = 0.35;
    group.add(frond);
  }
  group.position.set(x, 0, z);
  group.rotation.y = (x * 13 + z * 7) % 6.28;
  return group;
}

function makeLamp(x, z) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.16, 6, 5),
    new THREE.MeshLambertMaterial({ color: '#5a5f66' })
  );
  pole.position.y = 3;
  group.add(pole);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.45, 8, 6),
    new THREE.MeshBasicMaterial({ color: COLOURS.window })
  );
  head.position.set(0, 6, 0);
  group.add(head);
  group.position.set(x, 0, z);
  return group;
}

function makeDock(d) {
  const mesh = box(d.w, 1.4, d.d, '#7c7164');
  mesh.position.set(d.x, 0.7, d.z);
  return mesh;
}

export function createScene(world, renderer) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(COLOURS.skyMid, 140, 720);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(16, 24, 16),
    new THREE.MeshBasicMaterial({ color: COLOURS.sun, fog: false })
  );
  sun.position.set(260, 180, -720);
  scene.add(sun);

  // Water.
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY.half * 3.2, 620, 1, 1),
    new THREE.MeshLambertMaterial({ color: COLOURS.water })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.05, 660);
  scene.add(water);

  // Sand beach.
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(1040, 92, 1, 1),
    new THREE.MeshLambertMaterial({ color: COLOURS.sand })
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, 0, 470);
  scene.add(sand);

  // City ground.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY.half * 2.2, CITY.half * 2.2, 1, 1),
    new THREE.MeshLambertMaterial({ color: '#6e6a63' })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -30);
  ground.receiveShadow = true;
  scene.add(ground);

  // Roads.
  const roadMat = new THREE.MeshLambertMaterial({ color: COLOURS.road });
  const lineMat = new THREE.MeshBasicMaterial({ color: COLOURS.roadLine });
  const spacing = world.spacing;
  for (let k = -9; k <= 9; k += 1) {
    const rx = box(spacing * 2.4, 0.12, CITY.roadW, roadMat);
    rx.position.set(k * spacing, 0.06, 0);
    scene.add(rx);
    const rz = box(CITY.roadW, 0.12, spacing * 2.4, roadMat);
    rz.position.set(0, 0.06, k * spacing);
    scene.add(rz);
    if (k % 2 === 0) {
      const dash = box(0.4, 0.16, 6, lineMat);
      dash.position.set(k * spacing, 0.1, 0);
      scene.add(dash);
    }
  }
  const boulevard = box(1080, 0.12, 30, roadMat);
  boulevard.position.set(0, 0.06, 446);
  scene.add(boulevard);

  // Sidewalk borders along the boulevard.
  const walkN = box(1080, 0.3, 4, new THREE.MeshLambertMaterial({ color: COLOURS.sidewalk }));
  walkN.position.set(0, 0.15, 430);
  scene.add(walkN);

  for (const b of world.buildings) scene.add(makeBuilding(b));
  for (const p of world.palms) scene.add(makePalm(p.x, p.z, p.s));
  for (const l of world.lamps) scene.add(makeLamp(l.x, l.z));
  for (const d of world.docks) scene.add(makeDock(d));

  // Lights: a warm key from the sun side and a cool fill.
  const key = new THREE.DirectionalLight('#ffd9a0', 2.0);
  key.position.set(180, 240, -260);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -260;
  key.shadow.camera.right = 260;
  key.shadow.camera.top = 260;
  key.shadow.camera.bottom = -260;
  key.shadow.camera.far = 900;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#8fb7e0', 0.65);
  fill.position.set(-180, 90, 200);
  scene.add(fill);
  const amb = new THREE.AmbientLight('#8a7a70', 0.75);
  scene.add(amb);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1600);

  // A shared group for roadblock barrier meshes. Police adds and removes the
  // actual barrier geometry into this group so the scene stays the single owner
  // of world-space objects and the staged screenshots see the same barriers.
  const barrierGroup = new THREE.Group();
  barrierGroup.name = 'roadblocks';
  scene.add(barrierGroup);

  function updateSky(clock) {
    const t = Math.max(0, Math.min(1, clock.night));
    renderer.setClearColor(new THREE.Color().setHSL(0.62 - t * 0.62, 0.55 - t * 0.4, 0.55 - t * 0.42));
    scene.fog.color.copy(new THREE.Color().setHSL(0.62 - t * 0.62, 0.5, 0.5 - t * 0.4));
    key.intensity = 2.0 - t * 1.7;
    amb.intensity = 0.75 + t * 0.25;
  }

  // Overview lighting tweak: raises the ambient fill and lifts the key light so
  // an overhead map/stats screenshot stays bright and legible at golden hour.
  function setOverviewLighting(on) {
    if (on) {
      key.intensity = 2.3;
      key.position.y = 320;
      amb.intensity = 0.95;
      fill.intensity = 0.85;
    } else {
      key.intensity = 2.0;
      key.position.y = 240;
      amb.intensity = 0.75;
      fill.intensity = 0.65;
    }
  }

  return { scene, camera, sun, water, barrierGroup, updateSky, setOverviewLighting };
}
