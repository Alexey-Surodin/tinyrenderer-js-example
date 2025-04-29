
export async function getCanvas(): Promise<HTMLCanvasElement> {
  const canvas = document.querySelector("canvas");
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
    let a = this;

    return new Vec3(
      a.y * b.z - a.z * b.y,
      a.z * b.x - a.x * b.z,
      a.x * b.y - a.y * b.x
    )

  }

  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z);
  }

  length(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
  }

  norm(): this {
    return this.mulScalar(1 / this.length());
  }

  round(): this {
    this.x = Math.round(this.x);
    this.y = Math.round(this.y);
    this.z = Math.round(this.z);
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

  multiplyVec3(b: Vec3): Vec3 {
    const r = new Vec3();
    const a = this.data;

    r.x = a[0] * b.x + a[1] * b.y + a[2] * b.z + a[3];
    r.y = a[4] * b.x + a[5] * b.y + a[6] * b.z + a[7];
    r.z = a[8] * b.x + a[9] * b.y + a[10] * b.z + a[11];

    const w = a[12] * b.x + a[13] * b.y + a[14] * b.z + a[15];
    r.mulScalar(1 / w);

    return r;
  }

  clone():Matrix4{
    const m = new Matrix4();
    m.data = Array.from(this.data);
    return m;
  }

  transpose():this{
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
}

export function getTriNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  let ab = b.clone().sub(a);
  let ac = c.clone().sub(a);
  return ab.cross(ac).norm();
}

