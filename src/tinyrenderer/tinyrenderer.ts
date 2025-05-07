import { Color, getCanvas, Triangle, Vec4 } from "../utils/utils";
import { getTestModel, Model } from "./model";
import { Vec3 } from "../utils/utils";
import { getTexturePixel, TgaImage, readTexture } from "../utils/tgaImage";
//@ts-ignore
import modelFile from "../static/model.txt";
//@ts-ignore
import textureFile from "../static/texture.tga";
import { Camera } from "./camera";
import { linearInterpolation } from "./linearInterpolation";
import { barycentricInterpolation } from "./barycentricInterpolation";

const black = new Color(0, 0, 0, 255);

const camera = new Camera(new Vec3(0, 0, 2), new Vec3(0, 0, 0), new Vec3(0, 1, 0));
const light_dir = new Vec3(0, 0, -1).norm();

function getPixelIndex(point: Vec3, width: number, height: number): number {
  let x = Math.round(point.x);
  let y = Math.round(point.y);
  return ((height - y) * width + x);
}

function setPixel(imageData: ImageData, point: Vec3, color: Color, zBuffer?: Uint8ClampedArray): void {
  if (point.x > imageData.width || point.y > imageData.height || point.z > 255 || point.z < 0)
    return;

  let index = getPixelIndex(point, imageData.width, imageData.height);

  if (zBuffer) {
    if (point.z < zBuffer[index])
      zBuffer[index] = Math.round(point.z);
    else
      return;
  }

  index *= 4;
  imageData.data[index++] = Math.round(color.r);
  imageData.data[index++] = Math.round(color.g);
  imageData.data[index++] = Math.round(color.b);
  imageData.data[index] = Math.round(color.a);
}

function clearImage(imageData: ImageData, color: Color = black): void {
  const buffer = imageData.data.buffer;
  const array = new Uint32Array(buffer);
  const hexColor = color.a << 24 | color.b << 16 | color.g << 8 | color.r;
  array.fill(hexColor);
}

function drawTriangle(imageData: ImageData, tri: Triangle, zBuffer?: Uint8ClampedArray): void {

  const viewProjMatrix = camera.getViewProjMatrix(imageData.width, imageData.height, 255);
  const view = camera.getViewMatrix();
  const proj = camera.getProjMatrix();
  const vpInverse = proj.multiply(view).inverse().transpose();

  const vertFunc = function (tri: Triangle): Triangle {
    tri.p0 = viewProjMatrix.multiplyVec4(tri.p0);
    tri.p1 = viewProjMatrix.multiplyVec4(tri.p1);
    tri.p2 = viewProjMatrix.multiplyVec4(tri.p2);

    tri.n0 = vpInverse.multiplyVec3(tri.n0).norm();
    tri.n1 = vpInverse.multiplyVec3(tri.n1).norm();
    tri.n2 = vpInverse.multiplyVec3(tri.n2).norm();
    return tri;
  }

  const fragFunc = function (p: Vec3, t: Vec3, n: Vec3): void {
    let color: Color;
    const intensity = n.norm().dot(light_dir);

    if (intensity < 0.001)
      return;

    if (tri.texture) {
      color = getTexturePixel(t, tri.texture).mulScalar(intensity);
    }
    else if (tri.color) {
      color = tri.color.mulScalar(intensity);
    }
    else {
      color = new Color(intensity, intensity, intensity, 255).mulScalar(255);
    }
    setPixel(imageData, p, color, zBuffer);
  }

  //linearInterpolation(tri, vertFunc, fragFunc);
  barycentricInterpolation(tri, vertFunc, fragFunc);
}

function drawModel(imageData: ImageData, model: Model, zBuffer?: Uint8ClampedArray): void {
  const faces = model.faces;
  const vert = model.vert;
  const text = model.text;
  const norm = model.norm;

  const getVector = (array: number[][], index: number) =>
    new Vec3(array[index][0], array[index][1], array[index][2]);

  const getIndex = (face: number[][], index: number) =>
    new Vec3(face[0][index], face[1][index], face[2][index]);

  for (let i = 0; i < faces.length; i++) {
    const face = faces[i];
    const v_ind = getIndex(face, 0);
    const t_ind = getIndex(face, 1);
    const n_ind = getIndex(face, 2);

    let v0 = getVector(vert, v_ind.x);
    let v1 = getVector(vert, v_ind.y);
    let v2 = getVector(vert, v_ind.z);

    let t0 = getVector(text, t_ind.x);
    let t1 = getVector(text, t_ind.y);
    let t2 = getVector(text, t_ind.z);

    let n0 = getVector(norm, n_ind.x);
    let n1 = getVector(norm, n_ind.y);
    let n2 = getVector(norm, n_ind.z);

    let triangle: Triangle = {
      p0: new Vec4(v0.x, v0.y, v0.z, 1),
      p1: new Vec4(v1.x, v1.y, v1.z, 1),
      p2: new Vec4(v2.x, v2.y, v2.z, 1),

      t0: t0,
      t1: t1,
      t2: t2,

      n0: n0,
      n1: n1,
      n2: n2,

      texture: model.texture,
      color: new Color().random()
    }

    drawTriangle(imageData, triangle, zBuffer);
  }
}

export async function runTinyRenderer(): Promise<void> {

  const canvas = await getCanvas();

  const context = canvas?.getContext("2d");

  if (!context)
    throw new Error("Failed to get 2d canvas context");

  const canvasRect = canvas.getBoundingClientRect();

  const imageData = context.createImageData(canvasRect.width, canvasRect.height);
  const zBuffer = new Uint8ClampedArray(imageData.height * imageData.width);
  zBuffer.fill(255);

  clearImage(imageData, black);

  const model = new Model().parse(modelFile);
  model.texture = await readTexture(textureFile);

  const testModel = getTestModel();

  drawModel(imageData, model, zBuffer);
  drawModel(imageData, testModel, zBuffer);

  context.putImageData(imageData, 0, 0);
}