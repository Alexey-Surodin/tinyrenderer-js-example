import { Matrix4, Triangle, Vec3, Vec4 } from "../utils/utils";

export function barycentricInterpolation(input: Triangle, viewPortMatrix: Matrix4, vertexFunc: (tri: Triangle) => Triangle, fragmentFunc: (pos: Vec3, tex: Vec3, norm: Vec3) => void): void {

  //get triangle in clip space
  const tri = vertexFunc(input);

  const iz0 = 1 / tri.p0.w;
  const iz1 = 1 / tri.p1.w;
  const iz2 = 1 / tri.p2.w;

  //get triangle points in screen space
  const p0 = viewPortMatrix.multiplyVec4(tri.p0).divideW(); 
  const p1 = viewPortMatrix.multiplyVec4(tri.p1).divideW();
  const p2 = viewPortMatrix.multiplyVec4(tri.p2).divideW();

  const w = 2 * viewPortMatrix.data[0];
  const h = 2 * viewPortMatrix.data[5]

  //clip in screen space
  const xmin = Math.round(Math.min(w, Math.min(p0.x, p1.x, p2.x)));
  const xmax = Math.round(Math.max(0, Math.max(p0.x, p1.x, p2.x)));
  const ymin = Math.round(Math.min(h, Math.min(p0.y, p1.y, p2.y)));
  const ymax = Math.round(Math.max(0, Math.max(p0.y, p1.y, p2.y)));

  const v = new Vec3();
  for (let y = ymin; y <= ymax; y++) {
    for (let x = xmin; x <= xmax; x++) {
      v.x = x;
      v.y = y;
      const b = getBarycentricCoord(p0, p1, p2, v); // screen space barycentric

      if (b.x < 0 || b.y < 0 || b.z < 0)
        continue;

      //v.z = (p0.z * b.x + p1.z * b.y + p2.z * b.z); // screen space z linear interpolation

      // clip space barycentric
      const b0 = b.x * iz0;
      const b1 = b.y * iz1;
      const b2 = b.z * iz2;

      const z = 1 / (b.x * iz0 + b.y * iz1 + b.z * iz2);

      v.z = (b0 * tri.p0.z + b1 * tri.p1.z + b2 * tri.p2.z) * z;  // clip space z barycentric interpolation
      v.z = v.z * viewPortMatrix.data[10] + viewPortMatrix.data[11];  // z in screen space

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
