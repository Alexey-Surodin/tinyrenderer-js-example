import { Matrix4 } from "../utils/utils";
import { Vec3 } from "../utils/utils";

export class Camera {

  zFar = 10;
  zNear = 1;

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

  getProjMatrix(): Matrix4 {
    const m = new Matrix4().identity();

    m.data[10] = (this.zFar + this.zNear) / (this.zFar - this.zNear);
    m.data[11] = -2 * this.zFar * this.zNear / (this.zFar - this.zNear);

    m.data[14] = 1;
    m.data[15] = 0;

    return m;
  }

  getViewProjMatrix(width: number, height: number, depth: number): Matrix4 {

    const view = this.getViewMatrix();
    const proj = this.getProjMatrix();
    const viewport = this.getViewPortMatrix(width, height, depth);

    return viewport.multiply(proj.multiply(view));
  }

}

