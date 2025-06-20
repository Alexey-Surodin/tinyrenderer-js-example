import { generateTestDiffuseTexture, generateTestNormalTexture, TgaImage } from "../utils/tgaImage";
import { Vec3, Vec4 } from "../utils/utils";
import { ShaderBase } from "./shaders/shaderBase";

export class Model {
  vert = Array<Array<number>>();
  text = Array<Array<number>>();
  norm = Array<Array<number>>();
  faces = Array<Array<Array<number>>>();

  shader?: ShaderBase;

  diffuseTexture?: TgaImage;
  normalTexture?: TgaImage;
  normalTangentTexture?: TgaImage;

  parse(text: string): this {
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      const str = line.split(/\s+/);

      if (str[0] == 'v') {
        const v = new Array<number>();
        this.vert.push(v);

        for (let i = 1; i < str.length; i++) {
          v.push(parseFloat(str[i]));
        }
      }
      else if (str[0] == 'f') {
        const face = Array<Array<number>>();

        for (let i = 1; i < str.length; i++) {
          const f_str = str[i].split('/');
          const f = Array<number>();
          face.push(f);

          for (let j = 0; j < f_str.length; j++) {
            f.push(parseInt(f_str[j]) - 1);
          }
        }

        this.faces.push(face);
      }
      else if (str[0] == 'vt') {
        const t = new Array<number>();
        this.text.push(t);

        for (let i = 1; i < str.length; i++) {
          t.push(parseFloat(str[i]));
        }
      }
      else if (str[0] == 'vn') {
        const n = new Array<number>();
        this.norm.push(n);

        for (let i = 1; i < str.length; i++) {
          n.push(parseFloat(str[i]));
        }
      }
    }
    return this;
  }

  getVertex(faceIndex: number, vIndex: number): Vec4 {
    const face = this.faces[faceIndex];
    const v_ind = face[vIndex][0];
    const v_arr = this.vert[v_ind];
    return new Vec4(v_arr[0], v_arr[1], v_arr[2], 1);
  }

  getTexture(faceIndex: number, vIndex: number): Vec3 {
    const face = this.faces[faceIndex];
    const t_ind = face[vIndex][1];
    const t_arr = this.text[t_ind];
    return new Vec3(t_arr[0], t_arr[1], t_arr[2]);
  }

  getNormal(faceIndex: number, vIndex: number): Vec3 {
    const face = this.faces[faceIndex];
    const n_ind = face[vIndex][2];
    const n_arr = this.norm[n_ind];
    return new Vec3(n_arr[0], n_arr[1], n_arr[2]);
  }
}

export function getTestModel(): Model {
  const model = new Model();
  model.vert = [[-1, -1, 1], [1, -1, 1], [1, -1, -1], [-1, -1, -1]];
  model.text = [[0, 0, 0], [0.9, 0, 0], [0.9, 0.9, 0], [0, 0.9, 0]];
  model.norm = [[0, 1, 0]];
  model.faces = [[[0, 0, 0], [1, 1, 0], [2, 2, 0]], [[0, 0, 0], [2, 2, 0], [3, 3, 0]]];
  model.diffuseTexture = generateTestDiffuseTexture(200, 200, 20);
  model.normalTexture = generateTestNormalTexture(200, 200, new Vec3(0, 1, 0));
  return model;
}