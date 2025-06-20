import { getTexturePixel, getTexturePixelAsVec3, TgaImage } from "../../utils/tgaImage";
import { Color, getPixelIndex, getTangentBasis, Matrix4, Triangle, Vec3 } from "../../utils/utils";
import { Camera } from "../camera";
import { Light } from "../light";
import { Model } from "../model";
import { RenderOptions } from "../renerOptions";
import { Shader, UniformBase } from "./shaderBase";

export type LambertShaderUniform = UniformBase & {
  tangentMatrix: Matrix4,
  lightsDir: Vec3[],
  shadowM: Matrix4[],
  diffuseMap?: TgaImage,
  normalMap?: TgaImage,
  tangentNormalMap?: TgaImage,
  color?: Color,
};

export class LambertShader extends Shader<LambertShaderUniform> {
  readonly name = 'Lambert Shader';

  static init(): LambertShader {
    const lambertUniform = {
      tangentMatrix: new Matrix4(),
      shadowM: [],
      lightsDir: [],
    };
    const uniform = Object.assign(Shader.getBaseUniform(), lambertUniform);
    return new LambertShader(uniform);
  }

  override updateUniform(camera: Camera, lights: Light[], model: Model): void {
    super.updateUniform(camera, lights, model);

    this.uniform.lightsDir = [];
    this.uniform.shadowM = [];
    this.uniform.diffuseMap = model.diffuseTexture;
    this.uniform.normalMap = model.normalTexture;
    this.uniform.tangentNormalMap = model.normalTangentTexture;

    const dir = new Vec3();
    const viewPInv = (this.uniform.viewPortMatrix.clone().multiply(this.uniform.viewProjMatrix)).inverse();

    for (const light of lights) {
      dir.copy(light.direction).negate();
      this.uniform.lightsDir.push(this.uniform.viewMatrix.multiplyVec3(dir).norm());

      if (light.shadowMap?.matrix) {
        this.uniform.shadowM.push(light.shadowMap.matrix.clone().multiply(viewPInv))
      }
    }
  }

  vertexFunc(tri: Triangle): Triangle {
    if (RenderOptions.useTangentNormalMap) {
      const viewMatrix = this.uniform.viewMatrix;
      const p0 = viewMatrix.multiplyVec3(tri.p0.toVec3());
      const p1 = viewMatrix.multiplyVec3(tri.p1.toVec3());
      const p2 = viewMatrix.multiplyVec3(tri.p2.toVec3());
      const [tangent, bitangent] = getTangentBasis([p0, p1, p2], [tri.t0, tri.t1, tri.t2]);

      this.uniform.tangentMatrix.data = [
        tangent.x, bitangent.x, 0, 0,
        tangent.y, bitangent.y, 0, 0,
        tangent.z, bitangent.z, 0, 0,
        0, 0, 0, 0,
      ];
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
    const lights = this.uniform.lights;
    const lightSumColor: Color = new Color(0, 0, 0, 255);
    let surfaceColor: Color = new Color(255, 255, 255, 255);
    let normal: Vec3;

    if (RenderOptions.useTangentNormalMap && this.uniform.tangentNormalMap) {
      n.norm();
      this.uniform.tangentMatrix.data[2] = n.x;
      this.uniform.tangentMatrix.data[6] = n.y;
      this.uniform.tangentMatrix.data[10] = n.z;

      normal = getTexturePixelAsVec3(t, this.uniform.tangentNormalMap);
      normal = this.uniform.tangentMatrix.multiplyVec3(normal).norm();
    }
    else if (this.uniform.normalMap) {
      normal = getTexturePixelAsVec3(t, this.uniform.normalMap);
      normal = this.uniform.viewInverse.multiplyVec3(normal).norm();
    }
    else {
      normal = n.norm();
    }

    for (let i = 0; i < lights.length; i++) {
      const light = lights[i];
      const lightDir = this.uniform.lightsDir[i];
      let intensity = Math.max(normal.dot(lightDir), 0);

      if (RenderOptions.shadowPassEnable && light.shadowMap) {
        const shadow = light.shadowMap;
        const point = this.uniform.shadowM[i].multiplyVec3(p, 1.0);

        if (point.x >= 0 && point.y >= 0 && point.x < shadow.viewport.x && point.y < shadow.viewport.y) {
          const index = getPixelIndex(point, shadow.viewport.x, shadow.viewport.y);

          if (shadow.map[index] + 1 < point.z) {
            intensity *= 0.3;
          }
        }
      }

      lightSumColor.addColor(light.color.clone().premultiplyAlpha().mulScalar(intensity));
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