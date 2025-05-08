import { getTexturePixel, TgaImage } from "../../utils/tgaImage";
import { Color, Matrix4, Triangle, Vec3 } from "../../utils/utils";
import { Shader, UniformBase } from "./shaderBase";

export type SimpleShaderUniform = UniformBase & {
  texture?: TgaImage,
  color?: Color
};

export class SimpleShader extends Shader<SimpleShaderUniform> {

  static init(): SimpleShader {
    return new SimpleShader({
      light_dir: new Vec3(),
      viewInverse: new Matrix4(),
      viewPortMatrix: new Matrix4(),
      viewProjMatrix: new Matrix4()
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
    let intensity = n.norm().dot(this.uniform.light_dir);

    if (intensity < 0.001)
      intensity = 0;

    if (this.uniform.texture) {
      color = getTexturePixel(t, this.uniform.texture).mulScalar(intensity);
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

export class SimpleDepthShader extends SimpleShader {

  override fragmentFunc(p: Vec3): { pxl: Vec3; color: Color; } {
    return { pxl: p, color: new Color(p.z, p.z, p.z, 255) };
  }

  static init(): SimpleDepthShader {
    return new SimpleDepthShader({
      light_dir: new Vec3(),
      viewInverse: new Matrix4(),
      viewPortMatrix: new Matrix4(),
      viewProjMatrix: new Matrix4()
    });
  }
}