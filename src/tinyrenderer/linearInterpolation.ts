import { Color, getBarycentricCoord, Matrix4, Triangle, Vec3, Vec4 } from "../utils/utils";
import { ShaderBase } from "./shaders/shaderBase";

export function linearInterpolation(input: Triangle, shader: ShaderBase, onPixelCallback: (pxlData: { pxl: Vec3, color: Color }) => void): void {
  let pr = new Vec3();
  let tr = new Vec3();
  let nr = new Vec3();
  let pl = new Vec3();
  let tl = new Vec3();
  let nl = new Vec3();

  const bMat = new Matrix4();
  const p = new Vec3();
  const t = new Vec3();
  const n = new Vec3();

  const i0 = new Vec3(1, 0, 0);
  const i1 = new Vec3(0, 1, 0);
  const i2 = new Vec3(0, 0, 1);

  const p2p0 = new Vec3();
  const t2t0 = new Vec3();
  const n2n0 = new Vec3();
  const p2p1 = new Vec3();
  const t2t1 = new Vec3();
  const n2n1 = new Vec3();
  const p1p0 = new Vec3();
  const t1t0 = new Vec3();
  const n1n0 = new Vec3();

  const viewPortMatrix = shader.uniform.viewPortMatrix;
  const tri = shader.vertexFunc(input);

  const toVec3 = (v: Vec4): Vec3 => {
    return viewPortMatrix.multiplyVec3(v.toVec3(), 1.0).round();
  };

  const arr = [
    [toVec3(tri.p0), tri.t0, tri.n0, i0],
    [toVec3(tri.p1), tri.t1, tri.n1, i1],
    [toVec3(tri.p2), tri.t2, tri.n2, i2]
  ].sort((a, b) => a[0].y - b[0].y);

  const [p0, t0, n0] = arr[0];
  const [p1, t1, n1] = arr[1];
  const [p2, t2, n2] = arr[2];

  p2p0.copy(p2).sub(p0);
  t2t0.copy(t2).sub(t0);
  n2n0.copy(n2).sub(n0);

  p2p1.copy(p2).sub(p1);
  t2t1.copy(t2).sub(t1);
  n2n1.copy(n2).sub(n1);

  p1p0.copy(p1).sub(p0);
  t1t0.copy(t1).sub(t0);
  n1n0.copy(n1).sub(n0);


  for (let y = p0.y; y <= p2.y; y++) {
    let s = (y - p0.y) / p2p0.y;
    pl.copy(p2p0).mulScalar(s).add(p0);
    tl.copy(t2t0).mulScalar(s).add(t0);
    nl.copy(n2n0).mulScalar(s).add(n0);

    if (y < p1.y) {
      s = (y - p0.y) / p1p0.y;
      pr.copy(p1p0).mulScalar(s).add(p0);
      tr.copy(t1t0).mulScalar(s).add(t0);
      nr.copy(n1n0).mulScalar(s).add(n0);
    }
    else {
      s = (y - p1.y) / p2p1.y;
      pr.copy(p2p1).mulScalar(s).add(p1);
      tr.copy(t2t1).mulScalar(s).add(t1);
      nr.copy(n2n1).mulScalar(s).add(n1);
    }

    pl.round();
    pr.round();

    if (pl.x > pr.x) {
      [pl, pr] = [pr, pl];
      [tl, tr] = [tr, tl];
      [nl, nr] = [nr, nl];
    }

    for (let x = pl.x; x <= pr.x; x++, bMat.identity()) {
      const k = pl.x == pr.x ? 1 : (x - pl.x) / (pr.x - pl.x);
      p.copy(pr).sub(pl).mulScalar(k).add(pl);
      t.copy(tr).sub(tl).mulScalar(k).add(tl);
      n.copy(nr).sub(nl).mulScalar(k).add(nl);

      for (let i = 0; i < 3; i++) {
        bMat.data[i] = arr[i][3].x;
        bMat.data[i + 4] = arr[i][3].y;
        bMat.data[i + 8] = arr[i][3].z;
      }
      const b = bMat.multiplyVec3(getBarycentricCoord(p0, p1, p2, p));

      const pxlData = shader.fragmentFunc(p, t, n, b);
      if (pxlData) {
        onPixelCallback(pxlData);
      }
    }
  }
}