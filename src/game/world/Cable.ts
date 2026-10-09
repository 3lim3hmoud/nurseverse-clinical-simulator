import * as THREE from 'three';
import { lambert } from './helpers';

/** A thin tube/cable whose path is recomputed on demand (used for lines attached to a moving patient). */
export class Cable {
  readonly mesh: THREE.Mesh;

  constructor(private getPoints: () => THREE.Vector3[], private radius: number, color: number) {
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), lambert(color));
    this.mesh.userData.ignoreRay = true;
    this.update();
  }

  update(): void {
    const curve = new THREE.CatmullRomCurve3(this.getPoints());
    this.mesh.geometry.dispose();
    this.mesh.geometry = new THREE.TubeGeometry(curve, 24, this.radius, 5, false);
  }
}
