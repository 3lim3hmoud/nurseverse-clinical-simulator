import * as THREE from 'three';

export interface InteractableInfo {
  id: string;
  labelKey: string; // i18n key
  /** Ready-made text (already translated) that is shown instead of the key. */
  label?: string;
  /** Set by the system: the object is in the line of sight but too far to use. */
  far?: boolean;
}

interface Entry {
  root: THREE.Object3D;
  info: InteractableInfo;
  /** how close the nurse must be (metres, measured from the eye to the surface that is aimed at) */
  reach: number;
  setHighlight?: (on: boolean) => void;
}

interface Pick {
  entry: Entry;
  distance: number;
  near: boolean;
}

/**
 * Aim assist: besides the exact centre of the screen, a few rays around it are tried, so a phone thumb or a shaky
 * mouse still lands on the patient. Offsets are in normalised screen units (-1..1); the centre ray always wins.
 */
const RING: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [0.06, 0],
  [-0.06, 0],
  [0, 0.09],
  [0, -0.09],
  [0.13, 0.04],
  [-0.13, 0.04],
  [0.13, -0.09],
  [-0.13, -0.09],
];

/** The cheaper subset used every frame while looking around (taps use the full ring). */
const RING_LIVE = RING.slice(0, 5);

/** How much farther than `reach` we still look, so the HUD can say "move closer" instead of showing nothing. */
const FAR_FACTOR = 2.2;

/** Looks at the centre of the screen and finds the interactable object (if any) within reach. */
export class InteractionSystem {
  target: InteractableInfo | null = null;
  private entries: Entry[] = [];
  private current: Entry | null = null;
  private currentFar = false;
  private raycaster = new THREE.Raycaster();
  private point = new THREE.Vector2();
  private sinceCheck = 0;
  private lastPos = new THREE.Vector3(NaN, 0, 0);
  private lastQuat = new THREE.Quaternion();

  constructor(
    private camera: THREE.Camera,
    private scene: THREE.Scene,
    private maxDistance: number,
    private onTargetChange: (t: InteractableInfo | null) => void,
  ) {}

  /** `reach` overrides the default distance (the patient is something you should be able to use from the foot of the bed). */
  register(root: THREE.Object3D, info: InteractableInfo, setHighlight?: (on: boolean) => void, reach?: number): void {
    this.entries.push({ root, info, setHighlight, reach: reach ?? this.maxDistance });
  }

  /** Change the text shown for something that is already registered (the procedure screen reuses the patient). */
  relabel(id: string, label: string): void {
    for (const e of this.entries) if (e.info.id === id) e.info = { ...e.info, label };
  }

  unregister(root: THREE.Object3D): void {
    const entry = this.entries.find((e) => e.root === root);
    if (!entry) return;
    if (entry === this.current) this.clear();
    this.entries = this.entries.filter((e) => e !== entry);
    this.lastPos.x = NaN;
  }

  /** The first thing a ray hits that is an interactable (a wall or the bed in front blocks it). */
  private cast(nx: number, ny: number): { entry: Entry; distance: number } | null {
    this.point.set(nx, ny);
    this.raycaster.setFromCamera(this.point, this.camera);
    this.raycaster.far = this.maxDistance * FAR_FACTOR + 2;
    // only the nearest surface matters; BVH meshes can stop at their first hit
    (this.raycaster as THREE.Raycaster & { firstHitOnly?: boolean }).firstHitOnly = true;
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    for (const hit of hits) {
      if (hit.object.userData.ignoreRay) continue;
      const entry = this.entries.find((e) => this.isInside(hit.object, e.root));
      return entry ? { entry, distance: hit.distance } : null;
    }
    return null;
  }

  /** Best interactable around a screen point: the nearest ray to the point that lands on something usable. */
  private pick(cx: number, cy: number, scale = 1, ring: ReadonlyArray<readonly [number, number]> = RING): Pick | null {
    let far: Pick | null = null;
    for (const [ox, oy] of ring) {
      const hit = this.cast(cx + ox * scale, cy + oy * scale);
      if (!hit) continue;
      if (hit.distance <= hit.entry.reach) return { ...hit, near: true };
      if (!far && hit.distance <= hit.entry.reach * FAR_FACTOR) far = { ...hit, near: false };
    }
    return far;
  }

  /** ~10 times per second, and only when the view has moved; objects in front (walls, bed...) block the ray. */
  update(dt: number): void {
    this.sinceCheck += dt;
    if (this.sinceCheck < 0.1) return;
    this.sinceCheck = 0;

    // nothing in the room moves by itself, so an unchanged view has an unchanged answer
    if (this.camera.position.equals(this.lastPos) && this.camera.quaternion.equals(this.lastQuat)) return;
    this.lastPos.copy(this.camera.position);
    this.lastQuat.copy(this.camera.quaternion);

    this.resolve(RING_LIVE);
  }

  /**
   * Look right now, with the full aim-assist ring. Used when E is pressed, so a slow frame (or the 10 Hz throttle above)
   * can never leave the nurse with an old answer: what you see under the crosshair is what E uses.
   */
  refresh(): InteractableInfo | null {
    this.resolve(RING);
    return this.target;
  }

  private resolve(ring: ReadonlyArray<readonly [number, number]>): void {
    const found = this.pick(0, 0, 1, ring);
    const entry = found?.entry ?? null;
    const far = found ? !found.near : false;
    if (entry === this.current && far === this.currentFar) return;

    this.current?.setHighlight?.(false);
    if (entry && !far) entry.setHighlight?.(true);
    this.current = entry;
    this.currentFar = far;
    this.target = entry ? { ...entry.info, far } : null;
    this.onTargetChange(this.target);
  }

  /** What is under a screen point (a tap on a phone). Looks a little wider than the crosshair: fingers are not exact. */
  at(ndcX: number, ndcY: number): InteractableInfo | null {
    const found = this.pick(ndcX, ndcY, 1.4);
    return found ? { ...found.entry.info, far: !found.near } : null;
  }

  clear(): void {
    this.lastPos.x = NaN; // look again at the next update
    this.current?.setHighlight?.(false);
    if (this.current) this.onTargetChange(null);
    this.current = null;
    this.currentFar = false;
    this.target = null;
  }

  private isInside(obj: THREE.Object3D, root: THREE.Object3D): boolean {
    for (let o: THREE.Object3D | null = obj; o; o = o.parent) if (o === root) return true;
    return false;
  }
}
