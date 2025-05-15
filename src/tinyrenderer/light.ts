import { Color, Vec3 } from "../utils/utils";

export class Light {
  position: Vec3;
  direction: Vec3;
  color: Color;

  constructor(pos?: Vec3, dir?: Vec3, color?: Color) {
    this.position = pos?.clone() ?? new Vec3();
    this.direction = dir?.clone()?.norm() ?? new Vec3();
    this.color = color?.clone() ?? new Color();
  }
}