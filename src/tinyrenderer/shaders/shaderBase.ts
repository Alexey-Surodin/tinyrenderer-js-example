import { Color, Matrix4, Triangle } from "../../utils/utils";
import { Vec3 } from "../../utils/utils";

export type UniformBase = {
  viewProjMatrix: Matrix4,
  viewPortMatrix: Matrix4,
  viewInverse: Matrix4,
  light_dir: Vec3,
  [key: string]: any,
}

export abstract class Shader<T extends UniformBase> {
  constructor(public uniform: T) { }

  abstract vertexFunc(tri: Triangle): Triangle;
  abstract fragmentFunc(p: Vec3, t: Vec3, n: Vec3, b?: Vec3): { pxl: Vec3, color: Color } | null;
}

export type ShaderBase = Shader<UniformBase>;
