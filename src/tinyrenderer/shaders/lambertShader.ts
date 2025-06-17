import { getTexturePixel, getTexturePixelAsVec3, TgaImage } from "../../utils/tgaImage";
import { Color, Matrix4, Triangle, Vec3 } from "../../utils/utils";
import { Shader, UniformBase } from "./shaderBase";

export type LambertShaderUniform = UniformBase & {
  factor?: number,
  diffuseMap?: TgaImage,
  color?: Color
};

export class LambertShader extends Shader<LambertShaderUniform> {
  readonly name = 'Lambert Shader';

  static init(factor: number = 0): LambertShader {
    return new LambertShader({
      lights: [],
      viewMatrix: new Matrix4(),
      viewInverse: new Matrix4(),
      viewPortMatrix: new Matrix4(),
      viewProjMatrix: new Matrix4(),
      factor: Math.max(Math.min(factor, 1), 0),
    });
  }

  vertexFunc(tri: Triangle): Triangle {
    const viewProjMatrix = this.uniform.viewProjMatrix;
    tri.p0 = viewProjMatrix.multiplyVec4(tri.p0);
    tri.p1 = viewProjMatrix.multiplyVec4(tri.p1);
    tri.p2 = viewProjMatrix.multiplyVec4(tri.p2);

    const viewInverse = this.uniform.viewInverse;
    tri.n0 = viewInverse.multiplyVec3(tri.n0).norm();
    tri.n1 = viewInverse.multiplyVec3(tri.n1).norm();
    tri.n2 = viewInverse.multiplyVec3(tri.n2).norm();
    return tri;
  }

  fragmentFunc(p: Vec3, t: Vec3, n: Vec3): { pxl: Vec3, color: Color } | null {
    const factor = this.uniform.factor ?? 0;
    const lights = this.uniform.lights;
    const lightSumColor: Color = new Color(0, 0, 0, 255);
    let surfaceColor: Color = new Color(255, 255, 255, 255);
    let normal: Vec3 = n.norm();

    if (this.uniform.normalMap) {
      normal = getTexturePixelAsVec3(t, this.uniform.normalMap);
      normal = this.uniform.viewInverse.multiplyVec3(normal).norm();
    }

    for (const light of lights) {
      const dir = light.direction.clone().negate();
      const lightDir = this.uniform.viewMatrix.multiplyVec3(dir).norm();
      const intensity = Math.max((normal.dot(lightDir) + factor), 0) / (1 + factor);
      lightSumColor.addColor(light.color.clone().mulScalar(intensity));
    }

    if (this.uniform.diffuseMap) {
      surfaceColor = getTexturePixel(t, this.uniform.diffuseMap);
    }
    else if (this.uniform.color) {
      surfaceColor = this.uniform.color;
    }

    return { pxl: p, color: surfaceColor.mul(lightSumColor) };
  }
}