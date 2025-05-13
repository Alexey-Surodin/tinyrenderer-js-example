import { getTexturePixel } from "../../utils/tgaImage";
import { Triangle, Vec3, Color, Matrix4 } from "../../utils/utils";
import { Shader, UniformBase } from "./shaderBase";

export class GouraudShader extends Shader<UniformBase> {

  faceLightning: Vec3 = new Vec3();

  vertexFunc(tri: Triangle): Triangle {
    const viewProjMatrix = this.uniform.viewProjMatrix;
    tri.p0 = viewProjMatrix.multiplyVec4(tri.p0);
    tri.p1 = viewProjMatrix.multiplyVec4(tri.p1);
    tri.p2 = viewProjMatrix.multiplyVec4(tri.p2);

    const viewInverse = this.uniform.viewInverse;
    tri.n0 = viewInverse.multiplyVec3(tri.n0).norm();
    tri.n1 = viewInverse.multiplyVec3(tri.n1).norm();
    tri.n2 = viewInverse.multiplyVec3(tri.n2).norm();

    this.faceLightning.x = Math.max(0, tri.n0.dot(this.uniform.light_dir));
    this.faceLightning.y = Math.max(0, tri.n1.dot(this.uniform.light_dir));
    this.faceLightning.z = Math.max(0, tri.n2.dot(this.uniform.light_dir));
    return tri;
  }

  fragmentFunc(p: Vec3, t: Vec3, n: Vec3, b: Vec3): { pxl: Vec3; color: Color; } | null {
    let color: Color;
    let intensity = Math.max(this.faceLightning.dot(b), 0);

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

  static init(): GouraudShader {
    return new GouraudShader({
      light_dir: new Vec3(),
      viewInverse: new Matrix4(),
      viewPortMatrix: new Matrix4(),
      viewProjMatrix: new Matrix4()
    });
  }
}