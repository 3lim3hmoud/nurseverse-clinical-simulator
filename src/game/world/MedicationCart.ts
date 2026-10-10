import * as THREE from 'three';
import { blobShadow, box } from './helpers';
import { cloneModel, makeHighlightable } from './models';

export interface MedCartRig {
  group: THREE.Group;
  setHighlight(on: boolean): void;
}

/** Medication cart with a syringe and pill bottles on top. Origin = floor, drawers face +z. */
export function createMedicationCart(): MedCartRig {
  const g = new THREE.Group();
  g.add(blobShadow(0.9, 1.0, 0, 0));

  const inner = new THREE.Group();
  const cart = cloneModel('medicationCart');
  if (cart) {
    inner.add(cart);
    const syringe = cloneModel('syringe');
    if (syringe) {
      syringe.position.set(0.1, 0.962, 0);
      inner.add(syringe);
    }
    for (const [x, z] of [[-0.2, 0.06], [-0.13, -0.08]]) {
      const bottle = cloneModel('pillBottle');
      if (bottle) {
        bottle.position.set(x, 0.95, z);
        inner.add(bottle);
      }
    }
  } else {
    inner.add(box(0.6, 0.85, 0.46, 0x3b6e96, 0, 0.45, 0));
    inner.add(box(0.66, 0.04, 0.5, 0xb5c2c7, 0, 0.92, 0));
    for (let i = 0; i < 5; i++) inner.add(box(0.5, 0.012, 0.02, 0xe3eaed, 0, 0.2 + i * 0.16, -0.235));
  }
  const setHighlight = makeHighlightable(inner);
  inner.rotation.y = Math.PI; // models face -z, the drawers must face +z
  g.add(inner);

  // Invisible, larger hit area so the cart is easy to target
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.1, 0.7), new THREE.MeshBasicMaterial({ visible: false }));
  hit.position.y = 0.55;
  g.add(hit);

  return { group: g, setHighlight };
}
