import { Color, getCanvas, Triangle } from "../utils/utils";
import { Model } from "./model";
import { Vec3 } from "../utils/utils";
import { Camera, OrthographicCamera, PerspectiveCamera } from "./camera";
import { linearInterpolation } from "./linearInterpolation";
import { barycentricInterpolation } from "./barycentricInterpolation";
import { DepthShader, ShaderBase } from "./shaders/shaderBase";
import { Light } from "./light";

const clearColor = new Color(0, 0, 0, 255);
const camera = new PerspectiveCamera(new Vec3(0, 0, 2), new Vec3(0, 0, 0), new Vec3(0, 1, 0));
const orthoCamera = new OrthographicCamera(new Vec3(0, 0.1, 2), new Vec3(0, 0, 0), new Vec3(0, 1, 0), 4, 4);
const useBarycentricInterpolation = true;
const useZBuffer = true;

const DirectionalLightRed = new Light(new Vec3(), new Vec3(0, 0, -1), new Color(255, 0, 0, 255));
const DirectionalLightGreen = new Light(new Vec3(), new Vec3(-1, 0, 0), new Color(0, 255, 0, 255));
const DirectionalLightBlue = new Light(new Vec3(), new Vec3(1, 0, 0), new Color(0, 0, 255, 255));

function getPixelIndex(point: Vec3, width: number, height: number): number {
  const x = Math.round(point.x);
  const y = Math.round(point.y);
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

function clearImage(imageData: ImageData, color: Color = clearColor): void {
  const buffer = imageData.data.buffer;
  const array = new Uint32Array(buffer);
  const hexColor = color.a << 24 | color.b << 16 | color.g << 8 | color.r;
  array.fill(hexColor);
}

function drawTriangle(imageData: ImageData, tri: Triangle, shader: ShaderBase, zBuffer?: Uint8ClampedArray): void {
  if (useBarycentricInterpolation)
    barycentricInterpolation(tri, shader, (pxlData: { pxl: Vec3, color: Color }) => setPixel(imageData, pxlData.pxl, pxlData.color, zBuffer));
  else
    linearInterpolation(tri, shader, (pxlData: { pxl: Vec3, color: Color }) => setPixel(imageData, pxlData.pxl, pxlData.color, zBuffer));
}

function drawModel(imageData: ImageData, model: Model, camera: Camera, lights: Light[], shader: ShaderBase, zBuffer?: Uint8ClampedArray): void {

  // update unifrom
  shader.uniform.viewProjMatrix = camera.getViewProjMatrix();
  shader.uniform.viewInverse = camera.getViewMatrix().inverse().transpose();
  shader.uniform.viewPortMatrix = camera.getViewPortMatrix(imageData.width, imageData.height, 255);
  shader.uniform.lights = lights;
  shader.uniform['diffuseMap'] = model.diffuseTexture;
  shader.uniform['normalMap'] = model.normalTexture;

  for (let i = 0; i < model.faces.length; i++) {
    const triangle: Triangle = {
      p0: model.getVertex(i, 0),
      p1: model.getVertex(i, 1),
      p2: model.getVertex(i, 2),

      t0: model.getTexture(i, 0),
      t1: model.getTexture(i, 1),
      t2: model.getTexture(i, 2),

      n0: model.getNormal(i, 0),
      n1: model.getNormal(i, 1),
      n2: model.getNormal(i, 2),
    }

    drawTriangle(imageData, triangle, shader, zBuffer);
  }
}

export async function render(modelList: Array<{ model: Model, shader: ShaderBase }>): Promise<void> {

  const canvas = await getCanvas();
  const context = canvas?.getContext("2d");

  if (!context)
    throw new Error("Failed to get 2d canvas context");

  const canvasRect = canvas.getBoundingClientRect();

  const imageData = context.createImageData(canvasRect.width, canvasRect.height);
  let zBuffer: Uint8ClampedArray | undefined;

  if (useZBuffer) {
    zBuffer = new Uint8ClampedArray(imageData.height * imageData.width);
    zBuffer.fill(255);
  }

  clearImage(imageData, clearColor);

  const lights = [DirectionalLightRed, DirectionalLightGreen, DirectionalLightBlue];

  for (const { model, shader } of modelList) {
    drawModel(imageData, model, camera, lights, shader, zBuffer);
  }

  context.putImageData(imageData, 0, 0);

  const depthShader = DepthShader.init();
  const depthImageCanvas = await getCanvas("depthImage");
  const depthImageContext = depthImageCanvas?.getContext("2d");
  if (depthImageContext) {
    zBuffer?.fill(255);
    const depthData = depthImageContext.createImageData(canvasRect.width, canvasRect.height);
    for (const { model,  } of modelList) {
      drawModel(depthData, model, orthoCamera, lights, depthShader, zBuffer);
    }

    depthImageContext.putImageData(depthData, 0, 0);
  }
}