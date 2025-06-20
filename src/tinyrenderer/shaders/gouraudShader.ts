import { getTexturePixel, TgaImage } from "../../utils/tgaImage";
import { Triangle, Vec3, Color } from "../../utils/utils";
import { Camera } from "../camera";
import { Light } from "../light";
import { Model } from "../model";
import { Shader, UniformBase } from "./shaderBase";

export type GouraudShaderUniform = UniformBase & {
  faceLightning: Vec3[],
  lightsDir: Vec3[],
  diffuseMap?: TgaImage,
  color?: Color,
};

export class GouraudShader extends Shader<GouraudShaderUniform> {
  readonly name = 'Gouraud Shader';

  override updateUniform(camera: Camera, lights: Light[], model: Model): void {
    super.updateUniform(camera, lights, model);

    const dir = new Vec3();
    this.uniform.lightsDir = [];
    for (const light of lights) {
      dir.copy(light.direction).negate();
      this.uniform.lightsDir.push(this.uniform.viewMatrix.multiplyVec3(dir).norm());
    }

    this.uniform.diffuseMap = model.diffuseTexture;
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

    const lights = this.uniform.lights;
    this.uniform.faceLightning = [];

    for (let i = 0; i < lights.length; i++) {
      const lightDir = this.uniform.lightsDir[i];

      const v = new Vec3();
      v.x = Math.max(0, tri.n0.dot(lightDir));
      v.y = Math.max(0, tri.n1.dot(lightDir));
      v.z = Math.max(0, tri.n2.dot(lightDir));
      this.uniform.faceLightning.push(v);
    }

    return tri;
  }

  fragmentFunc(p: Vec3, t: Vec3, n: Vec3, b: Vec3): { pxl: Vec3; color: Color; } | null {
    const lights = this.uniform.lights;
    const lightSumColor: Color = new Color(0, 0, 0, 255);
    let surfaceColor: Color;

    for (let i = 0; i < lights.length; i++) {
      const intensity = Math.max(this.uniform.faceLightning[i].dot(b), 0);
      lightSumColor.addColor(lights[i].color.clone().mulScalar(intensity));
    }

    if (this.uniform.diffuseMap) {
      surfaceColor = getTexturePixel(t, this.uniform.diffuseMap);
    }
    else if (this.uniform.color) {
      surfaceColor = this.uniform.color;
    }
    else {
      surfaceColor = new Color(255, 255, 255, 255);
    }

    return { pxl: p, color: surfaceColor.mul(lightSumColor) };
  }

  static init(): GouraudShader {
    const gouraudUniform = {
      lightsDir: [],
      faceLightning: [],
    };
    return new GouraudShader(Object.assign(Shader.getBaseUniform(), gouraudUniform));
  }
}