import { clearImage, Color, getCanvas, getPixelIndex, setPixel, Triangle } from "../utils/utils";
import { Model } from "./model";
import { Vec3 } from "../utils/utils";
import { Camera, OrthographicCamera, PerspectiveCamera } from "./camera";
import { linearInterpolation } from "./linearInterpolation";
import { barycentricInterpolation } from "./barycentricInterpolation";
import { DepthShader } from "./shaders/shaderBase";
import { Light } from "./light";
import { move } from "../cameraControl";
import { RenderOptions } from "./renerOptions";

const clearColor = new Color(0, 0, 0, 255);
const perspectiveCamera = new PerspectiveCamera(new Vec3(0, 0, 2), new Vec3(0, 0, 0), new Vec3(0, 1, 0));
const orthoCamera = new OrthographicCamera(new Vec3(0, 0.1, 2), new Vec3(0, 0, 0), new Vec3(0, 1, 0), 4, 4);
const shadowCamera = new OrthographicCamera(new Vec3(0, 0.1, 2), new Vec3(0, 0, 0), new Vec3(0, 1, 0), 4, 4);
const shadowPassShader = DepthShader.init();

function drawModel(model: Model, camera: Camera, lights: Light[], onPixelCallback: (pxlData: { pxl: Vec3, color: Color }) => void): void {
  const shader = model.shader;
  if (!shader)
    return;
  // update unifrom
  const viewM = shader.uniform.viewMatrix = camera.getViewMatrix();
  const viewprojM = shader.uniform.viewProjMatrix = camera.getViewProjMatrix();
  shader.uniform.viewInverse = viewM.clone().inverse().transpose();
  const viewportM = shader.uniform.viewPortMatrix = camera.getViewPortMatrix();
  shader.uniform.shadowM = (viewportM.clone().multiply(viewprojM)).inverse();
  shader.uniform.lights = lights;
  shader.uniform.diffuseMap = model.diffuseTexture;
  shader.uniform.normalMap = model.normalTexture;
  shader.uniform.tangentNormalMap = model.normalTangentTexture;

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

    if (RenderOptions.useBarycentricInterpolation)
      barycentricInterpolation(triangle, shader, onPixelCallback);
    else
      linearInterpolation(triangle, shader, onPixelCallback);
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

export async function render(models: Model[]): Promise<void> {
  const canvas = await getCanvas();
  const context = canvas?.getContext("2d");

  if (!context)
    throw new Error("Failed to get 2d canvas context");

  const canvasRect = canvas.getBoundingClientRect();
  const viewport = new Vec3(canvasRect.width, canvasRect.height, 255);
  const imageData = context.createImageData(viewport.x, viewport.y);
  clearImage(imageData, clearColor);

  const camera = RenderOptions.useOrthoCamera ? orthoCamera : perspectiveCamera;
  camera.setViewPort(viewport);

  let zBuffer: Uint8ClampedArray | undefined;
  if (RenderOptions.useZBuffer) {
    zBuffer = new Uint8ClampedArray(imageData.height * imageData.width);
    zBuffer.fill(255);
  }

  //const lights = [RenderOptions.DirWhiteLight, RenderOptions.DirectionalLightGreen, RenderOptions.DirectionalLightBlue, RenderOptions.DirectionalLightRed];
  const lights = [RenderOptions.DirWhiteLight];

  if (RenderOptions.shadowPassEnable) {
    for (const light of lights) {
      shadowPass(models, light, viewport);
    }
  }

  for (const model of models) {
    drawModel(model, camera, lights, (pxlData: { pxl: Vec3, color: Color }) => setPixel(imageData, pxlData.pxl, pxlData.color, zBuffer));
  }

  context.putImageData(imageData, 0, 0);

  await drawDepthBuffer(zBuffer);
}

export async function runRenderLoop(models: Model[]): Promise<() => void> {
  const deltaCameraMove = new Vec3(100, 0, 0);
  let requestHandle: number;

  const cancel = () => cancelAnimationFrame(requestHandle);

  const frame = () => {
    if (RenderOptions.rotate) {
      move(orthoCamera, deltaCameraMove);
      move(perspectiveCamera, deltaCameraMove);
    }
    render(models);
    requestHandle = requestAnimationFrame(frame);
  }
  requestHandle = requestAnimationFrame(frame);

  return cancel;
}

async function shadowPass(models: Model[], light: Light, viewport: Vec3) {
  shadowCamera.eye.mulScalar(0).add(light.position);
  shadowCamera.setViewPort(viewport);

  const size = viewport.x * viewport.y;

  if (light.shadowMap?.map?.length != size) {
    const zBuffer = new Uint8ClampedArray(size);
    const viewProjM = shadowCamera.getViewProjMatrix();
    const viewPortM = shadowCamera.getViewPortMatrix();
    const shadowMat = viewPortM.multiply(viewProjM);
    light.shadowMap = { viewport: viewport, map: zBuffer, matrix: shadowMat };
  }
  const shadow = light.shadowMap;
  shadow.map.fill(255);

  const setDepth = (pxlData: { pxl: Vec3, color: Color }) => {
    const index = getPixelIndex(pxlData.pxl, viewport.x, viewport.y);
    if (index < size && pxlData.pxl.z < shadow.map[index]) {
      shadow.map[index] = Math.round(pxlData.pxl.z);
    }
  }

  for (const model of models) {
    const modleShader = model.shader;
    model.shader = shadowPassShader;
    drawModel(model, shadowCamera, [light], setDepth);
    model.shader = modleShader;
  }
}