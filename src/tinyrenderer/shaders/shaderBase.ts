import { TgaImage } from "../../utils/tgaImage";
import { Color, Matrix4, Triangle } from "../../utils/utils";
import { Vec3 } from "../../utils/utils";
import { Light } from "../light";

export type UniformBase = {
  viewMatrix: Matrix4,
  viewProjMatrix: Matrix4,
  viewPortMatrix: Matrix4,
  viewInverse: Matrix4,
  shadowM: Matrix4,
  lights: Light[],

  diffuseMap?: TgaImage,
  normalMap?: TgaImage,
  tangentNormalMap?: TgaImage,

  [key: string]: any,
}

export abstract class Shader<T extends UniformBase> {
  abstract readonly name: string;
  constructor(public uniform: T) { }

  abstract vertexFunc(tri: Triangle): Triangle;
  abstract fragmentFunc(p: Vec3, t: Vec3, n: Vec3, b?: Vec3): { pxl: Vec3, color: Color } | null;

  toString(): string {
    return this.name;
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
    return new DepthShader({
      lights: [],
      viewMatrix: new Matrix4(),
      viewInverse: new Matrix4(),
      viewPortMatrix: new Matrix4(),
      viewProjMatrix: new Matrix4(),
      shadowM: new Matrix4(),
    });
  }
}