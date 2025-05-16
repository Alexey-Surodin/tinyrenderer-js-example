import { Matrix4 } from "../utils/utils";
import { Vec3 } from "../utils/utils";

export abstract class Camera {

  constructor(readonly position: Vec3, readonly eye: Vec3, readonly up: Vec3) {

  }

  getViewMatrix(): Matrix4 {
    const z = this.eye.clone().sub(this.position).norm();
    const x = this.up.cross(z).norm();
    const y = z.cross(x).norm();

    const m = new Matrix4().identity();
    m.data[0] = x.x;
    m.data[1] = x.y;
    m.data[2] = x.z;
    m.data[3] = 0;

    m.data[4] = y.x;
    m.data[5] = y.y;
    m.data[6] = y.z;
    m.data[7] = 0;

    m.data[8] = z.x;
    m.data[9] = z.y;
    m.data[10] = z.z;
    m.data[11] = 0;

    m.data[12] = 0;
    m.data[13] = 0;
    m.data[14] = 0;
    m.data[15] = 1;

    const t = new Matrix4().identity();
    t.data[3] = -this.position.x;
    t.data[7] = -this.position.y;
    t.data[11] = -this.position.z;

    return m.multiply(t);
  }

  getViewPortMatrix(width: number, height: number, depth: number): Matrix4 {
    const m = new Matrix4().identity();

    m.data[0] = width / 2;
    m.data[3] = width / 2;

    m.data[5] = height / 2;
    m.data[7] = height / 2;

    m.data[10] = depth / 2;
    m.data[11] = depth / 2;

    return m;
  }

  getViewProjMatrix(): Matrix4 {
    const view = this.getViewMatrix();
    const proj = this.getProjMatrix();
    return proj.multiply(view);
  }

  abstract getProjMatrix(): Matrix4;
}

export class PerspectiveCamera extends Camera {
  constructor(position: Vec3, eye: Vec3, up: Vec3, readonly zFar: number = 100, readonly zNear = 1) {
    super(position, eye, up);
  }

  getProjMatrix(): Matrix4 {
    const m = new Matrix4().identity();

    m.data[10] = (this.zFar + this.zNear) / (this.zFar - this.zNear);
    m.data[11] = -2 * this.zFar * this.zNear / (this.zFar - this.zNear);

    m.data[14] = 1;
    m.data[15] = 0;

    return m;
  }
}

export class OrthographicCamera extends Camera {
  zFar = 3;
  zNear = 1;

  left = -0.5;
  right = -0.5;
  top = 0.5;
  bottom = -0.5;

  constructor(position: Vec3, eye: Vec3, up: Vec3, width: number = 1, height: number = 1) {
    super(position, eye, up);
    this.right = width / 2;
    this.left = -this.right;

    this.top = height / 2;
    this.bottom = -this.top;
  }

  getProjMatrix(): Matrix4 {
    const m = new Matrix4().identity();

    m.data[0] = 2 / (this.right - this.left);
    m.data[5] = 2 / (this.top - this.bottom);

    m.data[10] = 2 / (this.zFar - this.zNear);
    m.data[11] = -(this.zFar + this.zNear) / (this.zFar - this.zNear);

    m.data[14] = 0;
    m.data[15] = 1;

    return m;
  }
}

