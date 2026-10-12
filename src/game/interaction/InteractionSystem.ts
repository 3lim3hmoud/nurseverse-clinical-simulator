import * as THREE from 'three';

export interface InteractableInfo {
  id: string;
  labelKey: string; // i18n key
  /** Ready-made text (already translated) that is shown instead of the key. */
  label?: string;
}

interface Entry {
  root: THREE.Object3D;
  info: InteractableInfo;
  setHighlight?: (on: boolean) => void;
}

/** Looks at the centre of the screen and finds the interactable object (if any) within reach. */
export class InteractionSystem {
  target: InteractableInfo | null = null;
  private entries: Entry[] = [];
  private current: Entry | null = null;
  private raycaster = new THREE.Raycaster();
  private center = new THREE.Vector2(0, 0);
  private sinceCheck = 0;

  constructor(
    private camera: THREE.Camera,
    private scene: THREE.Scene,
    maxDistance: number,
    private onTargetChange: (t: InteractableInfo | null) => void,
  ) {
    this.raycaster.far = maxDistance;
  }

  register(root: THREE.Object3D, info: InteractableInfo, setHighlight?: (on: boolean) => void): void {
    this.entries.push({ root, info, setHighlight });
  }

  unregister(root: THREE.Object3D): void {
    const entry = this.entries.find((e) => e.root === root);
    if (!entry) return;
    if (entry === this.current) this.clear();
    this.entries = this.entries.filter((e) => e !== entry);
  }

  /** Raycasts ~20 times per second; objects in front (walls, bed...) block the ray. */
  update(dt: number): void {
    this.sinceCheck += dt;
    if (this.sinceCheck < 0.05) return;
    this.sinceCheck = 0;

    this.raycaster.setFromCamera(this.center, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    let found: Entry | null = null;
    for (const hit of hits) {
      if (hit.object.userData.ignoreRay) continue;
      found = this.entries.find((e) => this.isInside(hit.object, e.root)) ?? null;
      break;
    }

    if (found === this.current) return;
    this.current?.setHighlight?.(false);
    found?.setHighlight?.(true);
    this.current = found;
    this.target = found?.info ?? null;
    this.onTargetChange(this.target);
  }

  clear(): void {
    this.current?.setHighlight?.(false);
    if (this.current) this.onTargetChange(null);
    this.current = null;
    this.target = null;
  }

  private isInside(obj: THREE.Object3D, root: THREE.Object3D): boolean {
    for (let o: THREE.Object3D | null = obj; o; o = o.parent) if (o === root) return true;
    return false;
  }
}
