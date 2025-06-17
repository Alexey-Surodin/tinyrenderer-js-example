import { clearImage, Color, getCanvas, setPixel, Triangle } from "../utils/utils";
import { Model } from "./model";
import { Vec3 } from "../utils/utils";
import { Camera, OrthographicCamera, PerspectiveCamera } from "./camera";
import { linearInterpolation } from "./linearInterpolation";
import { barycentricInterpolation } from "./barycentricInterpolation";
import { ShaderBase } from "./shaders/shaderBase";
import { Light } from "./light";
import { move } from "../cameraControl";

const clearColor = new Color(0, 0, 0, 255);
const perspectiveCamera = new PerspectiveCamera(new Vec3(0, 0, 2), new Vec3(0, 0, 0), new Vec3(0, 1, 0));
const orthoCamera = new OrthographicCamera(new Vec3(0, 0.1, 2), new Vec3(0, 0, 0), new Vec3(0, 1, 0), 4, 4);

const DirWhiteLight = new Light(new Vec3(), new Vec3(0, -1, -1), new Color(255, 255, 255, 255));
const DirectionalLightRed = new Light(new Vec3(), new Vec3(0, 0, 1), new Color(255, 0, 0, 255));
const DirectionalLightGreen = new Light(new Vec3(), new Vec3(1, 0, 0), new Color(0, 255, 0, 255));
const DirectionalLightBlue = new Light(new Vec3(), new Vec3(-1, 0, 0), new Color(0, 0, 255, 255));

export type renderOptions = {
  useZBuffer: boolean,
  useBarycentricInterpolation: boolean,
  useOrthoCamera: boolean,
  rotate: boolean,
}

function drawTriangle(imageData: ImageData, tri: Triangle, shader: ShaderBase, options: renderOptions, zBuffer?: Uint8ClampedArray): void {
  if (options.useBarycentricInterpolation)
    barycentricInterpolation(tri, shader, (pxlData: { pxl: Vec3, color: Color }) => setPixel(imageData, pxlData.pxl, pxlData.color, zBuffer));
  else
    linearInterpolation(tri, shader, (pxlData: { pxl: Vec3, color: Color }) => setPixel(imageData, pxlData.pxl, pxlData.color, zBuffer));
}

function drawModel(imageData: ImageData, model: Model, camera: Camera, lights: Light[], options: renderOptions, zBuffer?: Uint8ClampedArray): void {
  const shader = model.shader;
  if (!shader)
    return;
  // update unifrom
  shader.uniform.viewMatrix = camera.getViewMatrix();
  shader.uniform.viewProjMatrix = camera.getViewProjMatrix();
  shader.uniform.viewInverse = camera.getViewMatrix().inverse().transpose();
  shader.uniform.viewPortMatrix = camera.getViewPortMatrix();
  shader.uniform.lights = lights;
  shader.uniform.diffuseMap = model.diffuseTexture;
  shader.uniform.normalMap = model.normalTexture;

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

    drawTriangle(imageData, triangle, shader, options, zBuffer);
  }
}

async function drawDepthBuffer(zBuffer?: Uint8ClampedArray): Promise<void> {
  const depthImageCanvas = await getCanvas("depthImage");
  const depthImageContext = depthImageCanvas?.getContext("2d");

  if (depthImageContext && zBuffer) {
    const canvasRect = depthImageCanvas.getBoundingClientRect();
    const depthData = depthImageContext.createImageData(canvasRect.width, canvasRect.height);
    const depthImageData = depthData.data;
    for (let i = 0, j = 0; i < zBuffer.length; i++) {
      depthImageData[j++] = zBuffer[i];
      depthImageData[j++] = zBuffer[i];
      depthImageData[j++] = zBuffer[i];
      depthImageData[j++] = 255;
    }

    depthImageContext.putImageData(depthData, 0, 0);
  }
}

export async function render(models: Model[], options: renderOptions): Promise<void> {
  const canvas = await getCanvas();
  const context = canvas?.getContext("2d");

  if (!context)
    throw new Error("Failed to get 2d canvas context");

  const canvasRect = canvas.getBoundingClientRect();
  const imageData = context.createImageData(canvasRect.width, canvasRect.height);
  clearImage(imageData, clearColor);

  const camera = options.useOrthoCamera ? orthoCamera : perspectiveCamera;
  camera.setViewPort(canvasRect.width, canvasRect.height, 255);

  let zBuffer: Uint8ClampedArray | undefined;
  if (options.useZBuffer) {
    zBuffer = new Uint8ClampedArray(imageData.height * imageData.width);
    zBuffer.fill(255);
  }

  const lights = [DirectionalLightRed, DirectionalLightGreen, DirectionalLightBlue, DirWhiteLight];

  for (const model of models) {
    drawModel(imageData, model, camera, lights, options, zBuffer);
  }

  context.putImageData(imageData, 0, 0);

  await drawDepthBuffer(zBuffer);
}

export async function runRenderLoop(models: Model[], options: renderOptions): Promise<() => void> {
  const deltaCameraMove = new Vec3(100, 0, 0);
  let requestHandle: number;

  const cancel = () => cancelAnimationFrame(requestHandle);

  const frame = () => {
    if (options.rotate) {
      move(orthoCamera, deltaCameraMove);
      move(perspectiveCamera, deltaCameraMove);
    }
    render(models, options);
    requestHandle = requestAnimationFrame(frame);
  }
  requestHandle = requestAnimationFrame(frame);

  return cancel;
}