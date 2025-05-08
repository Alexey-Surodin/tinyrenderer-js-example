import { Color, getCanvas, Triangle } from "../utils/utils";
import { getTestModel, Model } from "./model";
import { Vec3 } from "../utils/utils";
import { getTexturePixel, readTexture } from "../utils/tgaImage";
//@ts-ignore
import modelFile from "../static/model.txt";
//@ts-ignore
import textureFile from "../static/texture.tga";
import { Camera } from "./camera";
import { linearInterpolation } from "./linearInterpolation";
import { barycentricInterpolation } from "./barycentricInterpolation";

const black = new Color(0, 0, 0, 255);

const camera = new Camera(new Vec3(0, 0, 2), new Vec3(0, 0, 0), new Vec3(0, 1, 0));
const light_dir = new Vec3(0, 0.5, -1).norm();

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

  const viewProjMatrix = camera.getViewProjMatrix();
  const viewPortMatrix = camera.getViewPortMatrix(imageData.width, imageData.height, 255)
  const view = camera.getViewMatrix();
  const viewInverse = view.inverse().transpose();

  const vertFunc = function (tri: Triangle): Triangle {
    tri.p0 = viewProjMatrix.multiplyVec4(tri.p0);
    tri.p1 = viewProjMatrix.multiplyVec4(tri.p1);
    tri.p2 = viewProjMatrix.multiplyVec4(tri.p2);

    tri.n0 = viewInverse.multiplyVec3(tri.n0).norm();
    tri.n1 = viewInverse.multiplyVec3(tri.n1).norm();
    tri.n2 = viewInverse.multiplyVec3(tri.n2).norm();
    return tri;
  }

  const fragFunc = function (p: Vec3, t: Vec3, n: Vec3): void {
    let color: Color;
    let intensity = n.norm().dot(light_dir);

    if (intensity < 0.001)
      intensity = 0;

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

  //linearInterpolation(tri, viewPortMatrix, vertFunc, fragFunc);
  barycentricInterpolation(tri, viewPortMatrix, vertFunc, fragFunc);
}

function drawModel(imageData: ImageData, model: Model, zBuffer?: Uint8ClampedArray): void {

  for (let i = 0; i < model.faces.length; i++) {

    let triangle: Triangle = {
      p0: model.getVertex(i, 0),
      p1: model.getVertex(i, 1),
      p2: model.getVertex(i, 2),

      t0: model.getTexture(i, 0),
      t1: model.getTexture(i, 1),
      t2: model.getTexture(i, 2),

      n0: model.getNormal(i, 0),
      n1: model.getNormal(i, 1),
      n2: model.getNormal(i, 2),

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

  // const depthImageData = context.createImageData(canvasRect.width, canvasRect.height);
  // storeZBuffer(depthImageData, zBuffer);
  // context.putImageData(depthImageData, 0, 0);

}

function storeZBuffer(imageData: ImageData, zBuffer: Uint8ClampedArray) {
  const depthImageBuffer = imageData.data;
  zBuffer.forEach((v, i) => {
    let ind = i * 4;
    depthImageBuffer[ind++] = v;
    depthImageBuffer[ind++] = v;
    depthImageBuffer[ind++] = v;
    depthImageBuffer[ind++] = 255;
  });

}