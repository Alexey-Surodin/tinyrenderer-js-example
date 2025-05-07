import { Triangle, Vec3, Vec4 } from "../utils/utils";

export function barycentricInterpolation(input: Triangle, vertexFunc: (tri: Triangle) => Triangle, fragmentFunc: (pos: Vec3, tex: Vec3, norm: Vec3) => void): void {

  const tri = vertexFunc(input);

  const p0 = tri.p0;
  const p1 = tri.p1;
  const p2 = tri.p2;

  const iz0 = 1 / p0.w;
  const iz1 = 1 / p1.w;
  const iz2 = 1 / p2.w;

  p0.mulScalar(iz0);
  p1.mulScalar(iz1);
  p2.mulScalar(iz2);

  const xmin = Math.round(Math.min(p0.x, p1.x, p2.x));
  const xmax = Math.round(Math.max(p0.x, p1.x, p2.x));
  const ymin = Math.round(Math.min(p0.y, p1.y, p2.y));
  const ymax = Math.round(Math.max(p0.y, p1.y, p2.y));

  const v = new Vec3();
  for (let y = ymin; y <= ymax; y++) {
    for (let x = xmin; x <= xmax; x++) {
      v.x = x;
      v.y = y;
      const b = getBarycentricCoord(p0, p1, p2, v);

      if (b.x < 0 || b.y < 0 || b.z < 0)
        continue;

      v.z = (p0.z * b.x + p1.z * b.y + p2.z * b.z);

      const b0 = b.x * iz0;
      const b1 = b.y * iz1;
      const b2 = b.z * iz2;

      const z = 1 / (b.x * iz0 + b.y * iz1 + b.z * iz2);

      const izt = tri.t0.clone().mulScalar(b0).add(tri.t1.clone().mulScalar(b1)).add(tri.t2.clone().mulScalar(b2));
      izt.mulScalar(z);

      const izn = tri.n0.clone().mulScalar(b0).add(tri.n1.clone().mulScalar(b1)).add(tri.n2.clone().mulScalar(b2));
      izn.mulScalar(z);

      fragmentFunc(v, izt, izn);
    }
  }
}

function getBarycentricCoord(t1: Vec4, t2: Vec4, t3: Vec4, p: Vec3): Vec3 {
  const v0 = new Vec3(t2.x - t1.x, t3.x - t1.x, t1.x - p.x);
  const v1 = new Vec3(t2.y - t1.y, t3.y - t1.y, t1.y - p.y);
  const res = v0.cross(v1);
  if (Math.abs(res.z) > 0.001) {
    res.mulScalar(1 / res.z)
    return new Vec3(1 - res.x - res.y, res.x, res.y);
  }
  return new Vec3(-1, -1, -1);
}
