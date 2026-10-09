import * as THREE from 'three';

/** Shared, cached materials keep the draw state cheap on low-end GPUs. */
const cache = new Map<string, THREE.MeshLambertMaterial>();

export function lambert(color: number, opts: { opacity?: number; emissive?: number } = {}): THREE.MeshLambertMaterial {
  const opacity = opts.opacity ?? 1;
  const emissive = opts.emissive ?? 0x000000;
  const key = `${color}|${opacity}|${emissive}`;
  let mat = cache.get(key);
  if (!mat) {
    mat = new THREE.MeshLambertMaterial({ color, emissive, opacity, transparent: opacity < 1, depthWrite: opacity >= 1 });
    cache.set(key, mat);
  }
  return mat;
}

export function box(w: number, h: number, d: number, color: number, x = 0, y = 0, z = 0, opacity = 1): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lambert(color, { opacity }));
  m.position.set(x, y, z);
  return m;
}

export function cyl(rTop: number, rBottom: number, h: number, color: number, x = 0, y = 0, z = 0, opacity = 1, segments = 14): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), lambert(color, { opacity }));
  m.position.set(x, y, z);
  return m;
}

export function sphere(r: number, color: number, x = 0, y = 0, z = 0, segments = 16): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, segments, Math.max(8, segments - 4)), lambert(color));
  m.position.set(x, y, z);
  return m;
}

export function tube(points: THREE.Vector3[], radius: number, color: number): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points);
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, radius, 6, false), lambert(color));
  m.userData.ignoreRay = true;
  return m;
}

export function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d')!);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

let shadowTexture: THREE.CanvasTexture | null = null;

/** Cheap fake shadow: a soft dark blob on the floor (real-time shadows are too costly for weak GPUs). */
export function blobShadow(w: number, d: number, x: number, z: number): THREE.Mesh {
  if (!shadowTexture) {
    shadowTexture = canvasTexture(64, 64, (g) => {
      const grad = g.createRadialGradient(32, 32, 2, 32, 32, 32);
      grad.addColorStop(0, 'rgba(0,0,0,0.42)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
    });
  }
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.006, z);
  m.userData.ignoreRay = true;
  return m;
}

export function disposeScene(root: THREE.Object3D): void {
  const shared = new Set<THREE.Material>(cache.values());
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (!mat) return;
    (Array.isArray(mat) ? mat : [mat]).forEach((m) => {
      if (shared.has(m)) return;
      (m as THREE.MeshBasicMaterial).map?.dispose();
      m.dispose();
    });
  });
  cache.forEach((m) => m.dispose());
  cache.clear();
  shadowTexture?.dispose();
  shadowTexture = null;
}
