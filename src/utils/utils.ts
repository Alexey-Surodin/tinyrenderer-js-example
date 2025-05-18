export type Triangle = {
  p0: Vec4;
  p1: Vec4;
  p2: Vec4;

  t0: Vec3;
  t1: Vec3;
  t2: Vec3;

  n0: Vec3;
  n1: Vec3;
  n2: Vec3;
}

export async function getCanvas(id?: string): Promise<HTMLCanvasElement> {
  const canvas = id ? document.getElementById(id) as HTMLCanvasElement : document.querySelector("canvas");
  if (!canvas) {
    throw new Error("Failed to get canvas.");
  }
  return canvas;
}


export class Color {
  constructor(
    public r: number = 0,
    public g: number = 0,
    public b: number = 0,
    public a: number = 0
  ) { }

  random(): this {
    this.r = Math.round(Math.random() * 255);
    this.g = Math.round(Math.random() * 255);
    this.b = Math.round(Math.random() * 255);
    this.a = 255;
    return this;
  }

  mul(color: Color): this {
    this.r *= color.r / 255;
    this.g *= color.g / 255;
    this.b *= color.b / 255;
    this.a *= color.a / 255;
    return this;
  }

  mulScalar(n: number): this {
    this.r *= n;
    this.g *= n;
    this.b *= n;
    return this;
  }

  addColor(color: Color): this {
    this.r = Math.min((color.r + this.r), 255);
    this.g = Math.min((color.g + this.g), 255);
    this.b = Math.min((color.b + this.b), 255);
    return this;
  }

  clone(): Color {
    return new Color(this.r, this.g, this.b, this.a);
  }
}

export class Vec2 {
  constructor(public x: number = 0, public y: number = 0) { }
}

export class Vec3 {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0) { }

  sub(v: Vec3): this {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  add(v: Vec3): this {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  addScalar(n: number): this {
    this.x += n;
    this.y += n;
    this.z += n;
    return this;
  }

  mul(v: Vec3): this {
    this.x *= v.x;
    this.y *= v.y;
    this.z *= v.z;
    return this;
  }

  mulScalar(n: number): this {
    this.x *= n;
    this.y *= n;
    this.z *= n;
    return this;
  }

  dot(v: Vec3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(b: Vec3): Vec3 {
    return new Vec3(
      this.y * b.z - this.z * b.y,
      this.z * b.x - this.x * b.z,
      this.x * b.y - this.y * b.x
    );
  }

  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z);
  }

  length(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
  }

  negate(): this {
    return this.mulScalar(-1);
  }

  norm(): this {
    const l = this.length();
    return this.mulScalar(l == 0 ? 0 : 1 / l);
  }

  round(): this {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    this.z = Math.round(this.z);
    return this;
  }
}

export class Vec4 {
  constructor(public x: number = 0, public y: number = 0, public z: number = 0, public w: number = 0) { }

  sub(v: Vec4): this {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    this.w -= v.w;
    return this;
  }

  add(v: Vec4): this {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    this.w += v.w;
    return this;
  }

  addScalar(n: number): this {
    this.x += n;
    this.y += n;
    this.z += n;
    this.w += n;
    return this;
  }

  mul(v: Vec4): this {
    this.x *= v.x;
    this.y *= v.y;
    this.z *= v.z;
    this.w *= v.w;
    return this;
  }

  mulScalar(n: number): this {
    this.x *= n;
    this.y *= n;
    this.z *= n;
    this.w *= n;
    return this;
  }

  dot(v: Vec4): number {
    return this.x * v.x + this.y * v.y + this.z * v.z + this.w * v.w;
  }

  clone(): Vec4 {
    return new Vec4(this.x, this.y, this.z, this.w);
  }

  length(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2 + this.w ** 2);
  }

  norm(): this {
    const l = this.length();
    return this.mulScalar(l == 0 ? 0 : 1 / l);
  }

  divideW(): this {
    return this.mulScalar(1 / this.w);
  }

  round(): this {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    this.z = Math.round(this.z);
    this.w = Math.round(this.w);
    return this;
  }
}

export class Matrix4 {
  data: Array<number> = new Array(16).fill(0);

  identity(): this {
    this.data.fill(0);
    this.data[0] = 1;
    this.data[5] = 1;
    this.data[10] = 1;
    this.data[15] = 1;
    return this;
  }

  multiply(m: Matrix4): this {

    const a = Array.from(this.data);
    const b = m.data;

    for (let i = 0; i < 4; i++) {
      this.data[i] = a[0] * b[i] + a[1] * b[i + 4] + a[2] * b[i + 8] + a[3] * b[i + 12];
      this.data[i + 4] = a[4] * b[i] + a[5] * b[i + 4] + a[6] * b[i + 8] + a[7] * b[i + 12];
      this.data[i + 8] = a[8] * b[i] + a[9] * b[i + 4] + a[10] * b[i + 8] + a[11] * b[i + 12];
      this.data[i + 12] = a[12] * b[i] + a[13] * b[i + 4] + a[14] * b[i + 8] + a[15] * b[i + 12];
    }

    return this;
  }

  multiplyVec3(b: Vec3, w: number = 0): Vec3 {
    const r = new Vec3();
    const a = this.data;

    r.x = a[0] * b.x + a[1] * b.y + a[2] * b.z + w * a[3];
    r.y = a[4] * b.x + a[5] * b.y + a[6] * b.z + w * a[7];
    r.z = a[8] * b.x + a[9] * b.y + a[10] * b.z + w * a[11];

    const rw = a[12] * b.x + a[13] * b.y + a[14] * b.z + w * a[15];
    if (w !== 0 && rw !== 0)
      r.mulScalar(1 / rw);

    return r;
  }

  multiplyVec4(b: Vec4): Vec4 {
    const r = new Vec4();
    const a = this.data;

    r.x = a[0] * b.x + a[1] * b.y + a[2] * b.z + a[3] * b.w;
    r.y = a[4] * b.x + a[5] * b.y + a[6] * b.z + a[7] * b.w;
    r.z = a[8] * b.x + a[9] * b.y + a[10] * b.z + a[11] * b.w;
    r.w = a[12] * b.x + a[13] * b.y + a[14] * b.z + a[15] * b.w;

    return r;
  }

  clone(): Matrix4 {
    const m = new Matrix4();
    m.data = Array.from(this.data);
    return m;
  }

  transpose(): this {
    const d = Array.from(this.data);

    d[1] = this.data[4];
    d[4] = this.data[1];

    d[2] = this.data[8];
    d[8] = this.data[2];

    d[3] = this.data[12];
    d[12] = this.data[3];

    d[6] = this.data[9];
    d[9] = this.data[6];

    d[7] = this.data[13];
    d[13] = this.data[7];

    d[11] = this.data[14];
    d[14] = this.data[11];

    this.data = d;
    return this;
  }

  inverse(): this {
    this.transpose();

    const te = this.data,

      n11 = te[0], n21 = te[1], n31 = te[2], n41 = te[3],
      n12 = te[4], n22 = te[5], n32 = te[6], n42 = te[7],
      n13 = te[8], n23 = te[9], n33 = te[10], n43 = te[11],
      n14 = te[12], n24 = te[13], n34 = te[14], n44 = te[15],

      t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
      t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
      t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
      t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

    const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

    if (det === 0) {
      this.data.fill(0);
      return this;
    }

    const detInv = 1 / det;

    te[0] = t11 * detInv;
    te[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * detInv;
    te[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * detInv;
    te[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * detInv;

    te[4] = t12 * detInv;
    te[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * detInv;
    te[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * detInv;
    te[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * detInv;

    te[8] = t13 * detInv;
    te[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * detInv;
    te[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * detInv;
    te[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * detInv;

    te[12] = t14 * detInv;
    te[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * detInv;
    te[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * detInv;
    te[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * detInv;

    return this.transpose();
  }
}

export function getTriNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  const ab = b.clone().sub(a);
  const ac = c.clone().sub(a);
  return ab.cross(ac).norm();
}

export function getBarycentricCoord(t1: Vec4 | Vec3, t2: Vec4 | Vec3, t3: Vec4 | Vec3, p: Vec4 | Vec3): Vec3 {
  const v0 = new Vec3(t2.x - t1.x, t3.x - t1.x, t1.x - p.x);
  const v1 = new Vec3(t2.y - t1.y, t3.y - t1.y, t1.y - p.y);
  const res = v0.cross(v1);
  if (Math.abs(res.z) > 0.001) {
    res.mulScalar(1 / res.z)
    return new Vec3(1 - res.x - res.y, res.x, res.y);
  }
  return new Vec3(-1, -1, -1);
}

