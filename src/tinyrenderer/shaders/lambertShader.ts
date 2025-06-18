import { getTexturePixel, getTexturePixelAsVec3, TgaImage } from "../../utils/tgaImage";
import { Color, getTangentBasis, getTriNormal, Matrix4, Triangle, Vec3 } from "../../utils/utils";
import { RenderOptions } from "../renerOptions";
import { Shader, UniformBase } from "./shaderBase";

export type LambertShaderUniform = UniformBase & {
  factor?: number,
  diffuseMap?: TgaImage,
  color?: Color
};

export class LambertShader extends Shader<LambertShaderUniform> {
  readonly name = 'Lambert Shader';

  tangent: Vec3 = new Vec3();
  bitangent: Vec3 = new Vec3();

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

    if (RenderOptions.useTangentNormalMap) {
      const viewMatrix = this.uniform.viewMatrix;
      const p0 = viewMatrix.multiplyVec3(tri.p0.toVec3());
      const p1 = viewMatrix.multiplyVec3(tri.p1.toVec3());
      const p2 = viewMatrix.multiplyVec3(tri.p2.toVec3());
      [this.tangent, this.bitangent] = getTangentBasis([p0, p1, p2], [tri.t0, tri.t1, tri.t2]);
    }

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
    let normal: Vec3;

    if (RenderOptions.useTangentNormalMap && this.uniform.tangentNormalMap) {
      normal = getTexturePixelAsVec3(t, this.uniform.tangentNormalMap);
      n.norm();
      const tangentMatrix = new Matrix4();
      tangentMatrix.data = [
        this.tangent.x, this.bitangent.x, n.x, 0,
        this.tangent.y, this.bitangent.y, n.y, 0,
        this.tangent.z, this.bitangent.z, n.z, 0,
        0, 0, 0, 0,
      ];

      normal = tangentMatrix.multiplyVec3(normal).norm();
    }
    else if (this.uniform.normalMap) {
      normal = getTexturePixelAsVec3(t, this.uniform.normalMap);
      normal = this.uniform.viewInverse.multiplyVec3(normal).norm();
    }
    else {
      normal = n.norm();
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