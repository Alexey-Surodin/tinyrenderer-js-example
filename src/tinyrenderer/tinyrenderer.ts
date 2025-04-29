import { Color, getCanvas, getTriNormal, Matrix4 } from "../utils/utils";
import { Model } from "./model";
import { Vec3 } from "../utils/utils";
import { getTexturePixel, readTgaImage, TgaImage } from "../utils/tgaImage";
//@ts-ignore
import modelFile from "../static/model.txt";
//@ts-ignore
import textureFile from "../static/texture.tga";

const red = new Color(255, 0, 0, 255);
const green = new Color(0, 255, 0, 255);
const blue = new Color(0, 0, 255, 255);
const white = new Color(255, 255, 255, 255);
const black = new Color(0, 0, 0, 255);

const camera_pos = new Vec3(0, 0, -20);
const camera_eye = new Vec3(0, 0, 0);
const camera_up = new Vec3(0, 1, 0);
const light_dir = camera_eye.clone().sub(camera_pos).norm();

type Triangle = {
  p0: Vec3;
  p1: Vec3;
  p2: Vec3;

  t0: Vec3;
  t1: Vec3;
  t2: Vec3;

  n0: Vec3;
  n1: Vec3;
  n2: Vec3;

  texture: TgaImage;
  color: Color;
}

function getPixelIndex(point: Vec3, width: number, height: number): number {
  let x = Math.round(point.x);
  let y = Math.round(point.y);
  return ((height - y) * width + x);
}

function setPixel(imageData: ImageData, point: Vec3, color: Color, zBuffer?: Uint8ClampedArray): void {
  if (point.x > imageData.width || point.y > imageData.height)
    return;

  let index = getPixelIndex(point, imageData.width, imageData.height);

  if (zBuffer) {
    if (point.z > zBuffer[index])
      zBuffer[index] = Math.round(point.z);
    else
      return;
  }

  index *= 4;
  imageData.data[index++] = color.r;
  imageData.data[index++] = color.g;
  imageData.data[index++] = color.b;
  imageData.data[index] = color.a;
}

function clearImage(imageData: ImageData, color: Color = black): void {
  const buffer = imageData.data.buffer;
  const array = new Uint32Array(buffer);
  const hexColor = color.a << 24 | color.b << 16 | color.g << 8 | color.r;
  array.fill(hexColor);
}

function drawLine(imageData: ImageData, a: Vec3, b: Vec3, color: Color, zBuffer?: Uint8ClampedArray): void {
  let delta = a.clone().sub(b);
  const step = Math.max(Math.abs(delta.x), Math.abs(delta.y));

  if (step == 0)
    return;

  delta.mulScalar(1 / step);
  const point = b.clone();

  for (let i = 0; i <= step; i++) {
    setPixel(imageData, point, color, zBuffer);
    point.add(delta);
  }
}

function drawTexturedTriangle(imageData: ImageData, tri: Triangle, zBuffer?: Uint8ClampedArray): void {
  const arr = [[tri.p0, tri.t0, tri.n0], [tri.p1, tri.t1, tri.n1], [tri.p2, tri.t2, tri.n2]].sort((a, b) => a[0].y - b[0].y);

  let [p0, t0, n0] = arr[0];
  let [p1, t1, n1] = arr[1];
  let [p2, t2, n2] = arr[2];

  let p2p0 = p2.clone().sub(p0);
  let t2t0 = t2.clone().sub(t0);
  let n2n0 = n2.clone().sub(n0);

  let p2p1 = p2.clone().sub(p1);
  let t2t1 = t2.clone().sub(t1);
  let n2n1 = n2.clone().sub(n1);

  let p1p0 = p1.clone().sub(p0);
  let t1t0 = t1.clone().sub(t0);
  let n1n0 = n1.clone().sub(n0);

  for (let y = p0.y; y <= p2.y; y++) {
    let s = (y - p0.y) / p2p0.y;
    let pl = p2p0.clone().mulScalar(s).add(p0);
    let tl = t2t0.clone().mulScalar(s).add(t0);
    let nl = n2n0.clone().mulScalar(s).add(n0);
    let pr: Vec3;
    let tr: Vec3;
    let nr: Vec3;

    if (y < p1.y) {
      s = (y - p0.y) / p1p0.y;
      pr = p1p0.clone().mulScalar(s).add(p0);
      tr = t1t0.clone().mulScalar(s).add(t0);
      nr = n1n0.clone().mulScalar(s).add(n0);
    }
    else {
      s = (y - p1.y) / p2p1.y;
      pr = p2p1.clone().mulScalar(s).add(p1);
      tr = t2t1.clone().mulScalar(s).add(t1);
      nr = n2n1.clone().mulScalar(s).add(n1);
    }

    pl.round();
    pr.round();

    if (pl.x > pr.x) {
      [pl, pr] = [pr, pl];
      [tl, tr] = [tr, tl];
      [nl, nr] = [nr, nl];
    }

    for (let x = pl.x; x <= pr.x; x++) {
      const k = pl.x == pr.x ? 1 : (x - pl.x) / (pr.x - pl.x);
      let p = pr.clone().sub(pl).mulScalar(k).add(pl);
      let t = tr.clone().sub(tl).mulScalar(k).add(tl);
      let n = nr.clone().sub(nl).mulScalar(k).add(nl);

      const intensity = n.norm().dot(light_dir);

      const color = getTexturePixel(t, tri.texture).mulScalar(intensity);

      setPixel(imageData, p, color, zBuffer);
    }
  }
}

function drawTriangle(imageData: ImageData, tri: Triangle, zBuffer?: Uint8ClampedArray): void {

  let color = tri.color;

  const arr = [tri.p0, tri.p1, tri.p2].sort((a, b) => a.y - b.y);

  let t0 = arr[0];
  let t1 = arr[1];
  let t2 = arr[2];

  let t2t0 = t2.clone().sub(t0);
  let t2t1 = t2.clone().sub(t1);
  let t1t0 = t1.clone().sub(t0);

  for (let y = t0.y; y <= t2.y; y++) {

    let p0 = t2t0.clone().mulScalar((y - t0.y) / t2t0.y).add(t0);
    let p1: Vec3;

    if (y < t1.y)
      p1 = t1t0.clone().mulScalar((y - t0.y) / t1t0.y).add(t0);
    else
      p1 = t2t1.clone().mulScalar((y - t1.y) / t2t1.y).add(t1);

    p0.round();
    p1.round();

    drawLine(imageData, p0, p1, color, zBuffer);
  }
}

function drawModel(imageData: ImageData, model: Model, texture: TgaImage): void {
  const faces = model.faces;
  const vert = model.vert;
  const text = model.text;
  const norm = model.norm;

  const zBuffer = new Uint8ClampedArray(imageData.height * imageData.width);
  zBuffer.fill(0);

  const getVector = (array: number[][], index: number) =>
    new Vec3(array[index][0], array[index][1], array[index][2]);

  const getIndex = (face: number[][], index: number) =>
    new Vec3(face[0][index], face[1][index], face[2][index]);

  const view = createViewMatrix(camera_pos, camera_eye, camera_up);
  const proj = createProjMatrix(-1/(camera_eye.clone().sub(camera_pos).length()));
  const viewport = createViewPortMatrix(0, 0, imageData.width, imageData.height, 255);

  const vp = proj.clone().multiply(view);
  const viewProjMatrix = viewport.multiply(vp);
  
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

    const normal = getTriNormal(v0, v1, v2);
    const intensity = Math.round(normal.dot(light_dir) * 255);

    v0 = viewProjMatrix.multiplyVec3(v0).round();
    v1 = viewProjMatrix.multiplyVec3(v1).round();
    v2 = viewProjMatrix.multiplyVec3(v2).round();

    let triangle: Triangle = {
      p0: v0,
      p1: v1,
      p2: v2,

      t0: t0,
      t1: t1,
      t2: t2,

      n0: n0,
      n1: n1,
      n2: n2,

      color: new Color(intensity, intensity, intensity, 255),
      texture: texture,
    }

    //drawTriangle(imageData, triangle, zBuffer);
    drawTexturedTriangle(imageData, triangle, zBuffer);
  }
}

function createViewMatrix(cameraPos: Vec3, eye: Vec3, up: Vec3): Matrix4 {

  const z = eye.clone().sub(cameraPos).norm();
  const x = up.cross(z).norm();
  const y = z.cross(x).norm();

  const m = new Matrix4().identity();

  m.data[0] = x.x;
  m.data[4] = x.y;
  m.data[8] = x.z;
  m.data[12] = 0;

  m.data[1] = y.x;
  m.data[5] = y.y;
  m.data[9] = y.z;
  m.data[13] = 0;

  m.data[2] = z.x;
  m.data[6] = z.y;
  m.data[10] = z.z;
  m.data[14] = 0;

  m.data[3] = 0;
  m.data[7] = 0;
  m.data[11] = 0;
  m.data[15] = 1;

  m.transpose();

  const t = new Matrix4().identity();
  // t.data[3] = -cameraPos.x;
  // t.data[7] = -cameraPos.y;
  // t.data[11] = -cameraPos.z;

  return m.multiply(t);
}

function createViewPortMatrix(x: number, y: number, width: number, height: number, depth: number): Matrix4 {
  const m = new Matrix4().identity();

  m.data[0] = width / 2;
  m.data[3] = x + width / 2;

  m.data[5] = height / 2;
  m.data[7] = y + height / 2;

  m.data[10] = depth / 2;
  m.data[11] = depth / 2;

  return m;
}

function createProjMatrix(w: number): Matrix4 {
  const m = new Matrix4().identity();

  m.data[14] = w;
  return m;
}

async function readTexture(path: string | URL): Promise<TgaImage> {

  const file = await fetch(path);

  const byteArray = await file.bytes();

  return readTgaImage(byteArray);
}

export async function runTinyRenderer(): Promise<void> {

  const canvas = await getCanvas();

  const context = canvas?.getContext("2d");

  if (!context)
    throw new Error("Failed to get 2d canvas context");

  const canvasRect = canvas.getBoundingClientRect();

  const imageData = context.createImageData(canvasRect.width, canvasRect.height);

  clearImage(imageData, black);

  const model = new Model(modelFile);
  const texture = await readTexture(textureFile);
  drawModel(imageData, model, texture);

  context.putImageData(imageData, 0, 0);
}