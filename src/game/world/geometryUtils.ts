import * as THREE from 'three';

interface Vert {
  p: THREE.Vector3;
  n: THREE.Vector3;
  uv: THREE.Vector2 | null;
}

const mix = (a: Vert, b: Vert, t: number): Vert => ({
  p: a.p.clone().lerp(b.p, t),
  n: a.n.clone().lerp(b.n, t).normalize(),
  uv: a.uv && b.uv ? a.uv.clone().lerp(b.uv, t) : null,
});

/** Split every polygon at one z plane. Both halves keep the original winding. */
function clipPolygon(poly: Vert[], z: number): { above: Vert[]; below: Vert[] } {
  const above: Vert[] = [];
  const below: Vert[] = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const next = poly[(i + 1) % poly.length];
    const dc = cur.p.z - z;
    const dn = next.p.z - z;
    if (dc >= 0) above.push(cur);
    if (dc <= 0) below.push(cur);
    if ((dc > 0 && dn < 0) || (dc < 0 && dn > 0)) {
      const cut = mix(cur, next, dc / (dc - dn));
      above.push(cut);
      below.push(cut);
    }
  }
  return { above, below };
}

/**
 * Adds vertices along the given z planes by cutting triangles there (positions, normals and uvs are
 * interpolated). Bending a mesh needs vertices where the bend happens: a long box face has none in the middle.
 */
export function sliceByZ(source: THREE.BufferGeometry, planes: number[]): THREE.BufferGeometry {
  const geo = source.index ? source.toNonIndexed() : source.clone();
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const nor = geo.getAttribute('normal') as THREE.BufferAttribute | undefined;
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute | undefined;

  let polys: Vert[][] = [];
  for (let i = 0; i < pos.count; i += 3) {
    polys.push(
      [0, 1, 2].map((k) => ({
        p: new THREE.Vector3().fromBufferAttribute(pos, i + k),
        n: nor ? new THREE.Vector3().fromBufferAttribute(nor, i + k) : new THREE.Vector3(0, 1, 0),
        uv: uv ? new THREE.Vector2().fromBufferAttribute(uv, i + k) : null,
      })),
    );
  }

  for (const z of planes) {
    const next: Vert[][] = [];
    for (const tri of polys) {
      const zs = tri.map((v) => v.p.z - z);
      if (zs.every((d) => d >= 0) || zs.every((d) => d <= 0)) {
        next.push(tri);
        continue;
      }
      const { above, below } = clipPolygon(tri, z);
      for (const poly of [above, below]) {
        for (let k = 1; k + 1 < poly.length; k++) next.push([poly[0], poly[k], poly[k + 1]]);
      }
    }
    polys = next;
  }

  const count = polys.length * 3;
  const p = new Float32Array(count * 3);
  const n = new Float32Array(count * 3);
  const t = uv ? new Float32Array(count * 2) : null;
  polys.forEach((tri, i) =>
    tri.forEach((v, k) => {
      const o = i * 3 + k;
      v.p.toArray(p, o * 3);
      v.n.toArray(n, o * 3);
      if (t && v.uv) v.uv.toArray(t, o * 2);
    }),
  );
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(p, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  if (t) out.setAttribute('uv', new THREE.BufferAttribute(t, 2));
  return out;
}
