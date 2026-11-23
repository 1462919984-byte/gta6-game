// The three.js scene: builds every mesh of Solara Coast from the procedural world
// and updates the sky, sun, water and the camera each frame. This file is
// geometry and materials only — no game rules live here. The sky is a gradient
// dome with a low orange sun and a soft glow sprite, so the city reads as a
// sun-soaked coastal sunset rather than a flat grey afternoon.

import * as THREE from 'three';
import { CITY, COLOURS } from './config.js';

const V3 = THREE.Vector3;
const tmp = new V3();

function mat(colour) { return new THREE.MeshLambertMaterial({ color: colour }); }
function basic(colour) { return new THREE.MeshBasicMaterial({ color: colour }); }

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
    const roof = box(b.w * 0.4, 3, b.d * 0.4, COLOURS.roof);
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
    new THREE.CylinderGeometry(0.16 * s, 0.32 * s, 5.8 * s, 5),
    new THREE.MeshLambertMaterial({ color: COLOURS.palmTrunk })
  );
  trunk.position.y = 2.9 * s;
  trunk.castShadow = true;
  group.add(trunk);
  const leaf = new THREE.MeshLambertMaterial({ color: COLOURS.palmLeaf, side: THREE.DoubleSide });
  const leafDark = new THREE.MeshLambertMaterial({ color: COLOURS.palmLeafDark, side: THREE.DoubleSide });
  for (let i = 0; i < 7; i += 1) {
    const ang = (i / 7) * Math.PI * 2;
    const frond = new THREE.Mesh(new THREE.PlaneGeometry(4.6 * s, 1.4 * s), i % 2 ? leaf : leafDark);
    frond.position.set(Math.cos(ang) * 2.4 * s, 6.0 * s, Math.sin(ang) * 2.4 * s);
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

function makeStall(s) {
  const group = new THREE.Group();
  const base = box(s.w, s.h, s.d, s.colour);
  base.position.y = s.h / 2;
  group.add(base);
  const roof = box(s.w + 0.6, 0.3, s.d + 0.6, COLOURS.stallRoof);
  roof.position.y = s.h + 0.15;
  group.add(roof);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(s.w * 0.8, 0.9),
    new THREE.MeshBasicMaterial({ color: COLOURS.window })
  );
  sign.position.set(0, s.h - 0.9, s.d / 2 + 0.02);
  group.add(sign);
  group.position.set(s.x, 0, s.z);
  return group;
}

// The sky is a big inverted sphere with vertex colours baked from the palette, so
// the horizon is warm and the zenith stays blue. Fog is disabled on the material.
function makeSkyDome() {
  const geo = new THREE.SphereGeometry(900, 24, 16);
  const colours = new Float32Array(geo.attributes.position.count * 3);
  const top = new THREE.Color(COLOURS.skyTop);
  const upper = new THREE.Color(COLOURS.skyUpper);
  const mid = new THREE.Color(COLOURS.skyMid);
  const low = new THREE.Color(COLOURS.skyLow);
  const horizon = new THREE.Color(COLOURS.skyHorizon);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const y = pos.getY(i) / 900; // -1..1
    let c;
    if (y > 0.45) c = top.clone().lerp(upper, (y - 0.45) / 0.55);
    else if (y > 0.1) c = upper.clone().lerp(mid, (y - 0.1) / 0.35);
    else if (y > -0.15) c = mid.clone().lerp(low, (y + 0.15) / 0.25);
    else c = low.clone().lerp(horizon, (y + 1) / 0.85);
    colours[i * 3] = c.r;
    colours[i * 3 + 1] = c.g;
    colours[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colours, 3));
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  mesh.renderOrder = -10;
  return mesh;
}

export function createScene(world, renderer) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(COLOURS.skyMid, 120, 820);

  const sky = makeSkyDome();
  scene.add(sky);

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(22, 24, 16),
    new THREE.MeshBasicMaterial({ color: COLOURS.sunCore, fog: false })
  );
  sun.position.set(430, 190, -820);
  scene.add(sun);

  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    color: COLOURS.sunGlow, fog: false, transparent: true, opacity: 0.7, depthWrite: false,
  }));
  sunGlow.scale.set(180, 180, 1);
  sunGlow.position.copy(sun.position);
  scene.add(sunGlow);

  // Water, wide enough to fill the horizon and bright where the sun hits it.
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY.half * 3.4, 700, 1, 1),
    new THREE.MeshLambertMaterial({ color: COLOURS.water })
  );
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.05, 700);
  scene.add(water);

  // Sand beach.
  const sand = new THREE.Mesh(
    new THREE.PlaneGeometry(1120, 108, 1, 1),
    new THREE.MeshLambertMaterial({ color: COLOURS.sand })
  );
  sand.rotation.x = -Math.PI / 2;
  sand.position.set(0, 0, 478);
  scene.add(sand);

  // City ground.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(CITY.half * 2.4, CITY.half * 2.4, 1, 1),
    new THREE.MeshLambertMaterial({ color: '#7a6a58' })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0, -30);
  ground.receiveShadow = true;
  scene.add(ground);

  // Roads. These meshes share one dark asphalt material (not the colour-string
  // path of box()), so the street grid and the boulevard read clearly against the
  // sand and buildings.
  const roadMat = new THREE.MeshLambertMaterial({ color: COLOURS.road });
  const lineMat = new THREE.MeshBasicMaterial({ color: COLOURS.roadLine });
  const spacing = world.spacing;
  function roadMesh(w, d) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), roadMat);
    mesh.receiveShadow = true;
    return mesh;
  }
  for (let k = -9; k <= 9; k += 1) {
    const rx = roadMesh(spacing * 2.4, CITY.roadW);
    rx.position.set(k * spacing, 0.06, 0);
    scene.add(rx);
    const rz = roadMesh(CITY.roadW, spacing * 2.4);
    rz.position.set(0, 0.06, k * spacing);
    scene.add(rz);
    if (k % 2 === 0) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 6), lineMat);
      dash.position.set(k * spacing, 0.1, 0);
      scene.add(dash);
    }
  }
  const boulevard = roadMesh(1120, 30);
  boulevard.position.set(0, 0.06, CITY.boulevardZ);
  scene.add(boulevard);

  // Sidewalk borders along the boulevard.
  const walkN = box(1120, 0.3, 4, mat(COLOURS.sidewalk));
  walkN.position.set(0, 0.15, CITY.boulevardZ - 15);
  scene.add(walkN);
  const walkS = box(1120, 0.3, 4, mat(COLOURS.sidewalk));
  walkS.position.set(0, 0.15, CITY.boulevardZ + 15);
  scene.add(walkS);

  for (const b of world.buildings) scene.add(makeBuilding(b));
  for (const p of world.palms) scene.add(makePalm(p.x, p.z, p.s));
  for (const l of world.lamps) scene.add(makeLamp(l.x, l.z));
  for (const d of world.docks) scene.add(makeDock(d));
  for (const st of world.stalls) scene.add(makeStall(st));

  // String lights above the market: a warm glowing line with small bulbs.
  const stringGroup = new THREE.Group();
  const lineMatGlow = new THREE.MeshBasicMaterial({ color: COLOURS.stringLight });
  for (const st of world.stalls) {
    for (const sx of [-2, 0, 2]) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), lineMatGlow);
      bulb.position.set(st.x + sx, 3.6, st.z);
      stringGroup.add(bulb);
    }
  }
  stringGroup.name = 'string-lights';
  scene.add(stringGroup);

  // Lights: a warm low key from the sun side and a cool fill. Long shadows sell
  // the golden hour more than brightness, so the key is low and slightly red.
  const key = new THREE.DirectionalLight('#ffd9a0', 2.6);
  key.position.set(160, 150, -260);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -300;
  key.shadow.camera.right = 300;
  key.shadow.camera.top = 300;
  key.shadow.camera.bottom = -300;
  key.shadow.camera.far = 1000;
  key.shadow.bias = -0.0004;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#8fb7e0', 0.55);
  fill.position.set(-180, 90, 200);
  scene.add(fill);
  const amb = new THREE.AmbientLight('#9a7a68', 0.95);
  scene.add(amb);
  // A warm point light over the night market so the stalls and string lights
  // glow even when the sky is dark.
  const marketLight = new THREE.PointLight('#ffb35c', 0, 140, 1.6);
  marketLight.position.set(-360, 6, -120);
  scene.add(marketLight);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 1800);

  const barrierGroup = new THREE.Group();
  barrierGroup.name = 'roadblocks';
  scene.add(barrierGroup);

  // Blend the palette between golden hour and deep night. `sunset` warms the sky
  // and boosts the key, while `night` pulls everything blue and lowers the sun.
  function updateSky(clock) {
    const sunset = Math.max(0, Math.min(1, clock.sunset));
    const night = Math.max(0, Math.min(1, clock.night));

    const dayFog = new THREE.Color(COLOURS.skyMid).lerp(new THREE.Color(COLOURS.skyLow), sunset * 0.35);
    const nightFog = new THREE.Color('#1a2340');
    scene.fog.color.copy(dayFog.lerp(nightFog, night));

    // At night the sky dome drops to a deep indigo so the street lights and the
    // night market read clearly against it. Golden hour keeps the warm gradient.
    // We lerp toward a desaturated blue-white, not just darken, so the horizon
    // loses its orange instead of turning muddy brown.
    const nr = 1 - night * 0.82;
    const ng = 1 - night * 0.70;
    const nb = 1 - night * 0.36;
    sky.material.color.setRGB(nr, ng, nb);

    key.intensity = 2.6 + sunset * 0.25 - night * 2.0;
    amb.intensity = 0.95 - night * 0.22;
    amb.color.setHex(night > 0.4 ? 0x5a6a9a : 0x9a7a68);
    fill.intensity = 0.62 - night * 0.05;
    marketLight.intensity = night * 3.2;

    const waterC = new THREE.Color(COLOURS.water)
      .lerp(new THREE.Color(COLOURS.waterSunset), sunset * 0.5)
      .lerp(new THREE.Color(COLOURS.waterDeep), night * 0.55);
    water.material.color.copy(waterC);

    sun.material.color.setRGB(1, 1 - night * 0.15, 0.72 - night * 0.25);
    sunGlow.material.opacity = 0.7 - night * 0.62;
  }

  function setOverviewLighting(on) {
    if (on) {
      key.intensity = 2.8;
      key.position.y = 260;
      amb.intensity = 1.1;
      fill.intensity = 0.75;
    } else {
      key.intensity = 2.6;
      key.position.y = 150;
      amb.intensity = 0.95;
      fill.intensity = 0.55;
    }
  }

  return { scene, camera, sun, water, sky, stringGroup, barrierGroup, marketLight, updateSky, setOverviewLighting };
}
