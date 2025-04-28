import { Color, getCanvas, getTriNormal, Vec2 } from "../utils/utils";
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


type Triangle = {
  p0: Vec3;
  p1: Vec3;
  p2: Vec3;

  t0: Vec3;
  t1: Vec3;
  t2: Vec3;

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
  const arr = [[tri.p0, tri.t0], [tri.p1, tri.t1], [tri.p2, tri.t2]].sort((a, b) => a[0].y - b[0].y);

  let p0 = arr[0][0];
  let p1 = arr[1][0];
  let p2 = arr[2][0];

  let t0 = arr[0][1];
  let t1 = arr[1][1];
  let t2 = arr[2][1];

  let p2p0 = p2.clone().sub(p0);
  let t2t0 = t2.clone().sub(t0);

  let p2p1 = p2.clone().sub(p1);
  let t2t1 = t2.clone().sub(t1);

  let p1p0 = p1.clone().sub(p0);
  let t1t0 = t1.clone().sub(t0);

  for (let y = p0.y; y <= p2.y; y++) {
    let s = (y - p0.y) / p2p0.y;
    let pl = p2p0.clone().mulScalar(s).add(p0);
    let tl = t2t0.clone().mulScalar(s).add(t0);
    let pr: Vec3;
    let tr: Vec3;

    if (y < p1.y) {
      s = (y - p0.y) / p1p0.y;
      pr = p1p0.clone().mulScalar(s).add(p0);
      tr = t1t0.clone().mulScalar(s).add(t0);
    }
    else {
      s = (y - p1.y) / p2p1.y;
      pr = p2p1.clone().mulScalar(s).add(p1);
      tr = t2t1.clone().mulScalar(s).add(t1);
    }

    pl.round();
    pr.round();

    if (pl.x > pr.x) {
      [pl, pr] = [pr, pl];
      [tl, tr] = [tr, tl];
    }

    for (let x = pl.x; x <= pr.x; x++) {
      const k = pl.x == pr.x ? 1 : (x - pl.x) / (pr.x - pl.x);
      let p = pr.clone().sub(pl).mulScalar(k).add(pl);
      let t = tr.clone().sub(tl).mulScalar(k).add(tl);

      const color = getTexturePixel(t, tri.texture).mul(tri.color);

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

  const hw = imageData.width / 2;
  const hh = imageData.height / 2;

  const light_dir = new Vec3(0, 0, 1);
  const zBuffer = new Uint8ClampedArray(imageData.height * imageData.width);
  zBuffer.fill(0);

  for (let i = 0; i < faces.length; i++) {
    const face = faces[i];
    const v_ind0 = face[0][0];
    const v_ind1 = face[1][0];
    const v_ind2 = face[2][0];

    const t_ind0 = face[0][1];
    const t_ind1 = face[1][1];
    const t_ind2 = face[2][1];

    let v0 = new Vec3(vert[v_ind0][0], vert[v_ind0][1], vert[v_ind0][2]);
    let v1 = new Vec3(vert[v_ind1][0], vert[v_ind1][1], vert[v_ind1][2]);
    let v2 = new Vec3(vert[v_ind2][0], vert[v_ind2][1], vert[v_ind2][2]);

    let t0 = new Vec3(text[t_ind0][0], text[t_ind0][1], text[t_ind0][2]);
    let t1 = new Vec3(text[t_ind1][0], text[t_ind1][1], text[t_ind1][2]);
    let t2 = new Vec3(text[t_ind2][0], text[t_ind2][1], text[t_ind2][2]);

    const normal = getTriNormal(v0, v1, v2);
    const intensity = Math.round(normal.dot(light_dir) * 255);

    if (intensity < 0)
      continue;

    const screenProj = new Vec3(hw, hh, 125);
    v0 = v0.addScalar(1).mul(screenProj).round();
    v1 = v1.addScalar(1).mul(screenProj).round();
    v2 = v2.addScalar(1).mul(screenProj).round();

    let triangle: Triangle = {
      p0: v0,
      p1: v1,
      p2: v2,

      t0: t0,
      t1: t1,
      t2: t2,

      color: new Color(intensity, intensity, intensity, 255),
      texture: texture,
    }

    //drawTriangle(imageData, triangle, zBuffer);
    drawTexturedTriangle(imageData, triangle, zBuffer);

  }
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