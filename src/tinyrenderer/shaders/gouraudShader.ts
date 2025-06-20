import { getTexturePixel } from "../../utils/tgaImage";
import { Triangle, Vec3, Color, Matrix4 } from "../../utils/utils";
import { Shader, UniformBase } from "./shaderBase";

export class GouraudShader extends Shader<UniformBase> {
  readonly name = 'Gouraud Shader';

  faceLightning: Vec3[] = [];

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
    this.faceLightning = [];
    for (let i = 0; i < lights.length; i++) {
      const dir = lights[i].direction.clone().negate();
      const lightDir = this.uniform.viewMatrix.multiplyVec3(dir).norm();

      const v = new Vec3();
      v.x = Math.max(0, tri.n0.dot(lightDir));
      v.y = Math.max(0, tri.n1.dot(lightDir));
      v.z = Math.max(0, tri.n2.dot(lightDir));
      this.faceLightning.push(v);
    }

    return tri;
  }

  fragmentFunc(p: Vec3, t: Vec3, n: Vec3, b: Vec3): { pxl: Vec3; color: Color; } | null {
    const lights = this.uniform.lights;
    const lightSumColor: Color = new Color(0, 0, 0, 255);
    let surfaceColor: Color = new Color(255, 255, 255, 255);

    for (let i = 0; i < lights.length; i++) {
      const intensity = Math.max(this.faceLightning[i].dot(b), 0);
      lightSumColor.addColor(lights[i].color.clone().mulScalar(intensity));
    }

    if (this.uniform.diffuseMap) {
      surfaceColor = getTexturePixel(t, this.uniform.diffuseMap);
    }
    else if (this.uniform.color) {
      surfaceColor = this.uniform.color;
    }

    return { pxl: p, color: surfaceColor.mul(lightSumColor) };
  }

  static init(): GouraudShader {
    return new GouraudShader({
      lights: [],
      viewMatrix: new Matrix4(),
      viewInverse: new Matrix4(),
      viewPortMatrix: new Matrix4(),
      viewProjMatrix: new Matrix4(),
      shadowM: new Matrix4(),
    });
  }
}