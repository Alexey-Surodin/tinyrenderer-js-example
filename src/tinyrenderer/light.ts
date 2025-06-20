import { Color, Matrix4, Vec3 } from "../utils/utils";

export class Light {
  position: Vec3;
  direction: Vec3;
  color: Color;

  shadowMap: { viewport: Vec3, map: Uint8ClampedArray, matrix: Matrix4 } | undefined;

  constructor(pos?: Vec3, dir?: Vec3, color?: Color) {
    this.position = pos?.clone() ?? new Vec3();
    this.direction = dir?.clone()?.norm() ?? new Vec3();
    this.color = color?.clone() ?? new Color();
  }
}