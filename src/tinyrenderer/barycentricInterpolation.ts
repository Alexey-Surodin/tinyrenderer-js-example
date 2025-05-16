import { Color, getBarycentricCoord, Triangle, Vec3 } from "../utils/utils";
import { ShaderBase } from "./shaders/shaderBase";

export function barycentricInterpolation(input: Triangle, shader: ShaderBase, onPixelCallback: (pxlData: { pxl: Vec3, color: Color }) => void): void {

  const viewPortMatrix = shader.uniform.viewPortMatrix;

  //get triangle in clip space
  const tri = shader.vertexFunc(input);
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

      v.z = (p0.z * b.x + p1.z * b.y + p2.z * b.z);

      // clip space barycentric
      const b0 = b.x * iz0;
      const b1 = b.y * iz1;
      const b2 = b.z * iz2;

      const z = 1 / (b0 + b1 + b2);

      const izt = tri.t0.clone().mulScalar(b0).add(tri.t1.clone().mulScalar(b1)).add(tri.t2.clone().mulScalar(b2));
      izt.mulScalar(z);

      const izn = tri.n0.clone().mulScalar(b0).add(tri.n1.clone().mulScalar(b1)).add(tri.n2.clone().mulScalar(b2));
      izn.mulScalar(z);

      const pxlData = shader.fragmentFunc(v, izt, izn, new Vec3(b0, b1, b2).mulScalar(z));
      if (pxlData)
        onPixelCallback(pxlData);
    }
  }
}
