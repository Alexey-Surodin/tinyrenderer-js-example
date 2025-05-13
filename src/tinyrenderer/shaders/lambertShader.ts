import { getTexturePixel, getTexturePixelAsVec3, TgaImage } from "../../utils/tgaImage";
import { Color, Matrix4, Triangle, Vec3 } from "../../utils/utils";
import { Shader, UniformBase } from "./shaderBase";

export type LambertShaderUniform = UniformBase & {
  factor?: number,
  diffuseMap?: TgaImage,
  color?: Color
};

export class LambertShader extends Shader<LambertShaderUniform> {

  static init(factor: number = 0): LambertShader {
    return new LambertShader({
      light_dir: new Vec3(),
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
    let color: Color;
    let normal: Vec3 = n;

    if (this.uniform.normalMap) {
      normal = getTexturePixelAsVec3(t, this.uniform.normalMap);
      normal = this.uniform.viewInverse.multiplyVec3(normal);
    }

    let factor = this.uniform.factor ?? 0;
    let intensity = Math.max((normal.norm().dot(this.uniform.light_dir) + factor), 0) / (1 + factor);

    if (this.uniform.diffuseMap) {
      color = getTexturePixel(t, this.uniform.diffuseMap).mulScalar(intensity);
    }
    else if (this.uniform.color) {
      color = this.uniform.color.mulScalar(intensity);
    }
    else {
      color = new Color(intensity, intensity, intensity, 255).mulScalar(255);
    }

    return { pxl: p, color: color };
  }
}