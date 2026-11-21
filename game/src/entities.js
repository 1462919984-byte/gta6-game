// Low-poly people and cars, all built from a few boxes and cylinders so every
// character and vehicle of Solara Coast is original art and cheap to render.

import * as THREE from 'three';
import { COLOURS } from './config.js';

function mat(colour) { return new THREE.MeshLambertMaterial({ color: colour }); }
function basic(colour) { return new THREE.MeshBasicMaterial({ color: colour }); }
function box(w, h, d, m) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** A humanoid: torso, head, two arms, two legs, all in a group at ground level. */
export function makePerson(colour, headColour) {
  const g = new THREE.Group();
  const skin = mat(headColour ?? '#e0b896');
  const cloth = mat(colour);
  const torso = box(0.62, 0.74, 0.34, cloth);
  torso.position.y = 1.06;
  g.add(torso);
  const head = box(0.36, 0.36, 0.36, skin);
  head.position.y = 1.62;
  g.add(head);
  const armL = box(0.16, 0.66, 0.16, skin);
  armL.position.set(-0.42, 1.02, 0);
  g.add(armL);
  const armR = box(0.16, 0.66, 0.16, skin);
  armR.position.set(0.42, 1.02, 0);
  g.add(armR);
  const legL = box(0.2, 0.78, 0.2, mat('#3a3530'));
  legL.position.set(-0.16, 0.39, 0);
  g.add(legL);
  const legR = box(0.2, 0.78, 0.2, mat('#3a3530'));
  legR.position.set(0.16, 0.39, 0);
  g.add(legR);
  return g;
}

/** A stylised car: body, cabin, wheels and brake lights. */
export function makeCar(colour) {
  const g = new THREE.Group();
  const bodyMat = mat(colour);
  const body = box(1.9, 0.55, 4.2, bodyMat);
  body.position.y = 0.62;
  g.add(body);
  const cabin = box(1.6, 0.5, 2.0, mat('#2b3038'));
  cabin.position.set(0, 1.08, -0.25);
  g.add(cabin);
  const wheels = mat('#17181c');
  for (const sx of [-0.82, 0.82]) {
    for (const sz of [-1.35, 1.4]) {
      const w = box(0.3, 0.62, 0.62, wheels);
      w.position.set(sx, 0.31, sz);
      g.add(w);
    }
  }
  const tailL = box(0.12, 0.16, 0.1, basic('#ff4b4b'));
  tailL.position.set(-0.5, 0.72, 2.08);
  g.add(tailL);
  const tailR = box(0.12, 0.16, 0.1, basic('#ff4b4b'));
  tailR.position.set(0.5, 0.72, 2.08);
  g.add(tailR);
  const headL = box(0.12, 0.16, 0.1, basic('#ffe9a0'));
  headL.position.set(-0.5, 0.72, -2.08);
  g.add(headL);
  const headR = box(0.12, 0.16, 0.1, basic('#ffe9a0'));
  headR.position.set(0.5, 0.72, -2.08);
  g.add(headR);
  return g;
}

/** A police cruiser: white/black body with a light bar and push bumper. */
export function makeCopCar() {
  const g = makeCar('#e8ecf2');
  const bar = box(1.1, 0.22, 0.5, basic(COLOURS.copLightBlue));
  bar.position.set(0, 1.4, -0.2);
  g.add(bar);
  const red = box(0.4, 0.22, 0.24, basic(COLOURS.copLightRed));
  red.position.set(-0.3, 1.4, -0.2);
  g.add(red);
  const blue = box(0.4, 0.22, 0.24, basic(COLOURS.copLightBlue));
  blue.position.set(0.3, 1.4, -0.2);
  g.add(blue);
  const bumper = box(1.9, 0.35, 0.3, mat('#20242c'));
  bumper.position.set(0, 0.4, 2.2);
  g.add(bumper);
  return g;
}

/** A police officer: uniform and cap. */
export function makeCop(colour) {
  const g = makePerson(COLOURS.cop, '#d9b8a3');
  const cap = box(0.42, 0.16, 0.42, mat('#111826'));
  cap.position.y = 1.82;
  g.add(cap);
  return g;
}

/** A helicopter: body, tail boom, rotor and skids. */
export function makeHelicopter() {
  const g = new THREE.Group();
  const shell = box(1.6, 1.0, 3.4, mat(COLOURS.cop));
  shell.position.y = 1.0;
  g.add(shell);
  const tail = box(0.4, 0.4, 2.6, mat(COLOURS.cop));
  tail.position.set(0, 1.1, 2.9);
  g.add(tail);
  const rotor = box(6.4, 0.08, 0.3, mat('#30343c'));
  rotor.position.y = 1.6;
  g.add(rotor);
  const tailRotor = box(0.2, 0.6, 0.1, mat('#30343c'));
  tailRotor.position.set(0, 1.4, 4.1);
  g.add(tailRotor);
  for (const sx of [-0.5, 0.5]) {
    const skid = box(0.1, 0.3, 3.0, mat('#20242c'));
    skid.position.set(sx, 0.15, 0);
    g.add(skid);
  }
  const light = box(0.8, 0.5, 0.4, basic(COLOURS.copLightBlue));
  light.position.set(0, 0.9, -1.8);
  g.add(light);
  return g;
}

/** The player, a little brighter and slightly shorter than a cop. */
export function makePlayer() {
  const g = makePerson(COLOURS.player, '#f0c9a8');
  const cap = box(0.44, 0.12, 0.44, mat('#173a5e'));
  cap.position.y = 1.8;
  g.add(cap);
  return g;
}
