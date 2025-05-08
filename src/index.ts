import { getTestModel, Model } from "./tinyrenderer/model";
import { render } from "./tinyrenderer/tinyrenderer";
import { readTexture } from "./utils/tgaImage";
import { SimpleDepthShader, SimpleShader } from "./tinyrenderer/shaders/simpleShader";

//@ts-ignore
import modelFile from "./static/model.txt";
//@ts-ignore
import textureFile from "./static/texture.tga";

async function main(): Promise<void> {
  const model = new Model().parse(modelFile);
  model.texture = await readTexture(textureFile);

  const testModel = getTestModel();

  const shader = SimpleShader.init();
  const depthShader = SimpleDepthShader.init();

  render([
    { model: model, shader: shader },
    { model: testModel, shader: shader }
  ]);
}

main();
