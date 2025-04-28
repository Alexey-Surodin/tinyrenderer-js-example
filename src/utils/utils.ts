
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

export function getTriNormal(a: Vec3, b: Vec3, c: Vec3): Vec3 {
  let ab = b.clone().sub(a);
  let ac = c.clone().sub(a);
  return ab.cross(ac).norm();
}

