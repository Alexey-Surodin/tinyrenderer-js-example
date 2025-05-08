import { Color, getBarycentricCoord, Matrix4, Triangle, Vec3, Vec4 } from "../utils/utils";
import { ShaderBase } from "./shaders/shaderBase";

export function linearInterpolation(input: Triangle, shader: ShaderBase, onPixelCallback: (pxlData: { pxl: Vec3, color: Color }) => void): void {
  const viewPortMatrix = shader.uniform.viewPortMatrix;
  const tri = shader.vertexFunc(input);

  const toVec3 = (v: Vec4): Vec3 => {
    v = viewPortMatrix.multiplyVec4(v).divideW().round();
    return new Vec3(v.x, v.y, v.z);
  };

  const arr = [
    [toVec3(tri.p0), tri.t0, tri.n0, new Vec3(1, 0, 0)],
    [toVec3(tri.p1), tri.t1, tri.n1, new Vec3(0, 1, 0)],
    [toVec3(tri.p2), tri.t2, tri.n2, new Vec3(0, 0, 1)]
  ].sort((a, b) => a[0].y - b[0].y);

  let [p0, t0, n0] = arr[0];
  let [p1, t1, n1] = arr[1];
  let [p2, t2, n2] = arr[2];

  let p2p0 = p2.clone().sub(p0);
  let t2t0 = t2.clone().sub(t0);
  let n2n0 = n2.clone().sub(n0);

  let p2p1 = p2.clone().sub(p1);
  let t2t1 = t2.clone().sub(t1);
  let n2n1 = n2.clone().sub(n1);

  let p1p0 = p1.clone().sub(p0);
  let t1t0 = t1.clone().sub(t0);
  let n1n0 = n1.clone().sub(n0);

  for (let y = p0.y; y <= p2.y; y++) {
    let s = (y - p0.y) / p2p0.y;
    let pl = p2p0.clone().mulScalar(s).add(p0);
    let tl = t2t0.clone().mulScalar(s).add(t0);
    let nl = n2n0.clone().mulScalar(s).add(n0);
    let pr: Vec3;
    let tr: Vec3;
    let nr: Vec3;

    if (y < p1.y) {
      s = (y - p0.y) / p1p0.y;
      pr = p1p0.clone().mulScalar(s).add(p0);
      tr = t1t0.clone().mulScalar(s).add(t0);
      nr = n1n0.clone().mulScalar(s).add(n0);
    }
    else {
      s = (y - p1.y) / p2p1.y;
      pr = p2p1.clone().mulScalar(s).add(p1);
      tr = t2t1.clone().mulScalar(s).add(t1);
      nr = n2n1.clone().mulScalar(s).add(n1);
    }

    pl.round();
    pr.round();

    if (pl.x > pr.x) {
      [pl, pr] = [pr, pl];
      [tl, tr] = [tr, tl];
      [nl, nr] = [nr, nl];
    }

    for (let x = pl.x; x <= pr.x; x++) {
      const k = pl.x == pr.x ? 1 : (x - pl.x) / (pr.x - pl.x);
      let p = pr.clone().sub(pl).mulScalar(k).add(pl);
      let t = tr.clone().sub(tl).mulScalar(k).add(tl);
      let n = nr.clone().sub(nl).mulScalar(k).add(nl);

      const bMat = new Matrix4().identity();
      for (let i = 0; i < 3; i++) {
        bMat.data[i] = arr[i][3].x;
        bMat.data[i + 4] = arr[i][3].y;
        bMat.data[i + 8] = arr[i][3].z;
      }
      const b = bMat.multiplyVec3(getBarycentricCoord(p0, p1, p2, p));

      const pxlData = shader.fragmentFunc(p, t, n, b);
      if (pxlData)
        onPixelCallback(pxlData);
    }
  }
}