import { Color, Vec3 } from "./utils";

enum TgaBppFormat {
  GRAYSCALE = 1,
  RGB = 3,
  RGBA = 4
};

class TgaHeader {
  idLength: number = 0;
  colormaptype: number = 0;
  datatypecode: number = 0;
  colormaporigin: number = 0;
  colorMapLength: number = 0;
  colorMapDepth: number = 0;
  x_origin: number = 0;
  y_origin: number = 0;
  width: number = 0;
  height: number = 0;
  bitsperpixel: number = 0;
  imagedescriptor: number = 0;
}

export type TgaImage = {
  header: TgaHeader;
  imageData: Uint8Array;
}

function readTgaHeader(dataView: DataView): TgaHeader {
  const header = new TgaHeader();

  header.idLength = dataView.getUint8(0);
  header.colormaptype = dataView.getUint8(1);
  header.datatypecode = dataView.getUint8(2);
  header.colormaporigin = dataView.getUint16(3, true);
  header.colorMapLength = dataView.getUint16(5, true);
  header.colorMapDepth = dataView.getUint8(7);
  header.x_origin = dataView.getUint16(8, true);
  header.y_origin = dataView.getUint16(10, true);
  header.width = dataView.getUint16(12, true);
  header.height = dataView.getUint16(14, true);
  header.bitsperpixel = dataView.getUint8(16);
  header.imagedescriptor = dataView.getUint8(17);

  return header;
}

function readRleImageData(header: TgaHeader, dataView: DataView): Uint8Array {
  const imageIdOffset = 18;
  const colorMapOffset = imageIdOffset + header.idLength;
  const imageDataOffset = colorMapOffset + (header.colorMapLength * (header.colorMapDepth / 8));

  const pixelCount = header.width * header.height;
  const bpp = header.bitsperpixel >> 3;

  let image = new Uint8Array(pixelCount * bpp);

  let currentPixelOffset = 0;
  let offset = imageDataOffset;

  while (currentPixelOffset != image.byteLength) {
    const packetHeader = dataView.getUint8(offset++);
    const isRunLengthPacket = (packetHeader & 0x80) !== 0;
    const pixelCount = (packetHeader & 0x7F) + 1;

    if (!isRunLengthPacket) {
      //raw packet
      const nbytes = pixelCount * bpp;
      const pixelData = new Uint8Array(dataView.buffer, offset, nbytes);

      image.set(pixelData, currentPixelOffset);
      currentPixelOffset += nbytes;
      offset += nbytes;
    }
    else {
      //rle packet
      const pixelData = new Uint8Array(dataView.buffer, offset, bpp);
      offset += bpp;

      for (let i = 0; i < pixelCount; i++) {
        image.set(pixelData, currentPixelOffset);
        currentPixelOffset += bpp;
      }
    }
  }

  return image;
}

export function readTgaImage(array: Uint8Array): TgaImage {
  //read header
  const dataView = new DataView(array.buffer);
  const header = readTgaHeader(dataView);
  let formats = Object.values(TgaBppFormat);

  const width = header.width;
  const height = header.height;
  const bpp = header.bitsperpixel >> 3;

  if (width <= 0 || height <= 0 || !formats.includes(bpp)) {
    throw ("bad bpp (or width/height) value");
  }

  if (header.datatypecode == 2 || header.datatypecode == 3) {
    const imageIdOffset = 18;
    const colorMapOffset = imageIdOffset + header.idLength;
    const imageDataOffset = colorMapOffset + (header.colorMapLength * (header.colorMapDepth / 8));

    return {
      imageData: new Uint8Array(array.buffer, imageDataOffset),
      header: header
    }
  }

  if (header.datatypecode == 10 || header.datatypecode == 11) {
    return {
      imageData: readRleImageData(header, dataView),
      header: header
    }
  }

  throw ("unknown file format");
}

export function getTexturePixel(point: Vec3, texture: TgaImage): Color {

  const width = texture.header.width;
  const height = texture.header.height;
  const imageData = texture.imageData;
  const bpp = texture.header.bitsperpixel >> 3;

  const color = new Color();
  if (point.x > width || point.y > height)
    return color;

  let x = Math.round(point.x * width);
  let y = Math.round(point.y * height);

  const desc = texture.header.imagedescriptor;

  let a = (desc & 0x20) ? height - y : y;
  let b = !(desc & 0x10) ? x : width - x;

  let index = a * width + b;

  index *= bpp;

  if (bpp == 1) {
    color.r = color.g = color.b = imageData[index];
  }
  else {
    color.b = imageData[index++];
    color.g = imageData[index++];
    color.r = imageData[index++];
    color.a = bpp == 4 ? imageData[index] : 255;
  }

  return color;
}

export function getTexturePixelAsVec3(point: Vec3, texture: TgaImage): Vec3{
  const color = getTexturePixel(point, texture);
  return new Vec3(color.b, color.g, color.r);
}

export async function readTexture(path: string | URL): Promise<TgaImage> {

  const file = await fetch(path);

  const byteArray = await file.bytes();

  return readTgaImage(byteArray);
}

export function generateTestTexture(w: number, h: number, cellSize: number): TgaImage {
  const header = new TgaHeader();
  header.width = w;
  header.height = h;
  header.bitsperpixel = 3 * 8;

  const imageData = new Uint8Array(w * h * 3);
  const red = [255, 0, 0];
  const green = [0, 255, 0];

  let index = 0;

  for (let y = 0; y < h; y++) {

    for (let x = 0; x < w; x++) {

      const oddX = Math.ceil(x / cellSize) % 2 == 0;
      const oddY = Math.ceil(y / cellSize) % 2 == 0;

      let color = oddX !== oddY ? red : green;
      imageData[index++] = color[2];
      imageData[index++] = color[1];
      imageData[index++] = color[0];
    }
  }

  return {
    header: header,
    imageData: imageData,
  };
}