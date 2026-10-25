import * as THREE from 'three';
import { acceleratedRaycast, computeBoundsTree } from 'three-mesh-bvh';

/**
 * Picking ("what am I looking at?") shoots rays into the scene several times a second. The bed, the patient and the
 * curtains have tens of thousands of triangles, and plain three.js tests every one of them for each ray: ~15-20 ms
 * on a PC, far more on a phone, which is a lost frame (or three) every time the crosshair is on the patient.
 * A BVH (bounding-volume tree) per heavy mesh makes the same exact test almost free.
 */
THREE.Mesh.prototype.raycast = acceleratedRaycast;

/** Meshes with fewer triangles than this are cheaper to test directly than to build a tree for. */
const MIN_TRIANGLES = 64;

const _inv = new THREE.Matrix4();
const _ray = new THREE.Ray();
const _hit = new THREE.Vector3();

/**
 * Skinned meshes (the bending mattress of the bed) cost ~3 ms per ray because three.js poses every vertex for the
 * test, and a BVH cannot follow the bones. They are picked by their bounding box instead (grown upward, so the raised
 * head end is still covered): the bed and the patient are big, near targets, and the patient has its own exact mesh.
 */
function boxRaycast(this: THREE.Mesh, raycaster: THREE.Raycaster, intersects: THREE.Intersection[]): void {
  const geo = this.geometry;
  if (!geo.boundingBox) geo.computeBoundingBox();
  const box = (this.userData.pickBox as THREE.Box3 | undefined) ?? (this.userData.pickBox = geo.boundingBox!.clone().expandByVector(new THREE.Vector3(0.05, 0, 0.05)));
  _inv.copy(this.matrixWorld).invert();
  _ray.copy(raycaster.ray).applyMatrix4(_inv);
  if (!_ray.intersectBox(box, _hit)) return;
  _hit.applyMatrix4(this.matrixWorld);
  const distance = raycaster.ray.origin.distanceTo(_hit);
  if (distance < raycaster.near || distance > raycaster.far) return;
  intersects.push({ distance, point: _hit.clone(), object: this });
}

/**
 * Make picking cheap for every heavy mesh under `root`: a BVH for rigid meshes (exact and almost free), a bounding box
 * for skinned ones. Light meshes are left alone, they are quicker to test directly.
 */
export function accelerateRaycast(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const geo = mesh.geometry as THREE.BufferGeometry & { boundsTree?: unknown };
    if (!geo) return;
    if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) {
      mesh.raycast = boxRaycast;
      return;
    }
    const triangles = (geo.index ? geo.index.count : geo.getAttribute('position').count) / 3;
    if (triangles >= MIN_TRIANGLES && !geo.boundsTree) computeBoundsTree.call(geo);
  });
}
