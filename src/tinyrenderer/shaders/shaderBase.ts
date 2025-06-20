import { Color, Matrix4, Triangle } from "../../utils/utils";
import { Vec3 } from "../../utils/utils";
import { Camera } from "../camera";
import { Light } from "../light";
import { Model } from "../model";

export type UniformBase = {
  viewMatrix: Matrix4,
  viewProjMatrix: Matrix4,
  viewPortMatrix: Matrix4,
  viewInverse: Matrix4,
  lights: Light[]
}

export abstract class Shader<T extends UniformBase> {
  abstract readonly name: string;
  constructor(public uniform: T) { }

  abstract vertexFunc(tri: Triangle): Triangle;
  abstract fragmentFunc(p: Vec3, t: Vec3, n: Vec3, b?: Vec3): { pxl: Vec3, color: Color } | null;

  updateUniform(camera: Camera, lights: Light[], _: Model): void {
    const viewM = this.uniform.viewMatrix = camera.getViewMatrix();
    this.uniform.viewProjMatrix = camera.getViewProjMatrix();
    this.uniform.viewPortMatrix = camera.getViewPortMatrix();
    this.uniform.viewInverse = viewM.clone().inverse().transpose();
    this.uniform.lights = lights;
  }

  toString(): string {
    return this.name;
  }

  static getBaseUniform(): UniformBase {
    return {
      lights: [],
      viewMatrix: new Matrix4(),
      viewInverse: new Matrix4(),
      viewPortMatrix: new Matrix4(),
      viewProjMatrix: new Matrix4(),
    };
  }
}

export type ShaderBase = Shader<UniformBase>;


export class DepthShader extends Shader<UniformBase> {
  readonly name = 'Depth Shader';

  override vertexFunc(tri: Triangle): Triangle {
    const viewProjMatrix = this.uniform.viewProjMatrix;
    tri.p0 = viewProjMatrix.multiplyVec4(tri.p0);
    tri.p1 = viewProjMatrix.multiplyVec4(tri.p1);
    tri.p2 = viewProjMatrix.multiplyVec4(tri.p2);
    return tri;
  }

  override fragmentFunc(p: Vec3): { pxl: Vec3; color: Color; } {
    return { pxl: p, color: new Color(p.z, p.z, p.z, 255) };
  }

  static init(): DepthShader {
    return new DepthShader(Shader.getBaseUniform());
  }
}