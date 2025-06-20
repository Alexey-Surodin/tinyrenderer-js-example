import { Color, Vec3 } from "../utils/utils";
import { Light } from "./light";

export class RenderOptions {
  static useBarycentricInterpolation = true;
  static useOrthoCamera = false;
  static useZBuffer = true;
  static useTangentNormalMap = false;
  static shadowPassEnable = true;
  static rotate = false;
  static DirWhiteLight = new Light(new Vec3(0, 1, 1), new Vec3(0, -1, -1), new Color(255, 255, 255, 255));
  static DirectionalLightRed = new Light(new Vec3(0, 1, -2), new Vec3(0, -1, 1), new Color(255, 0, 0, 255));
  static DirectionalLightGreen = new Light(new Vec3(-2, 1, 0), new Vec3(1, -1, 0), new Color(0, 255, 0, 255));
  static DirectionalLightBlue = new Light(new Vec3(2, 1, 0), new Vec3(-1, -1, 0), new Color(0, 0, 255, 255));
}