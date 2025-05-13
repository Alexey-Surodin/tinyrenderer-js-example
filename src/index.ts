import { getTestModel, Model } from "./tinyrenderer/model";
import { render } from "./tinyrenderer/tinyrenderer";
import { readTexture } from "./utils/tgaImage";
import { AfricanHeadModel } from "./obj/african_head/african_head";
import { LambertShader } from "./tinyrenderer/shaders/lambertShader";
import { GouraudShader } from "./tinyrenderer/shaders/gouraudShader";
import { DepthShader } from "./tinyrenderer/shaders/shaderBase";

async function main(): Promise<void> {
  const head = new Model().parse(AfricanHeadModel.head);
  head.diffuseTexture = await readTexture(AfricanHeadModel.headDiffuse);
  head.normalTexture = await readTexture(AfricanHeadModel.headNormal);

  const innerEye = new Model().parse(AfricanHeadModel.innerEye);
  innerEye.diffuseTexture = await readTexture(AfricanHeadModel.innerEyeDiffuse);
  innerEye.normalTexture = await readTexture(AfricanHeadModel.innerEyeNormal);

  const outerEye = new Model().parse(AfricanHeadModel.outerEye);
  outerEye.diffuseTexture = await readTexture(AfricanHeadModel.outerEyeDiffuse);
  outerEye.normalTexture = await readTexture(AfricanHeadModel.outerEyeNormal);

  const testModel = getTestModel();

  const lambertShader = LambertShader.init(0.1);
  const depthShader = DepthShader.init();
  const gouraudShader = GouraudShader.init();

  render([
    { model: head, shader: lambertShader },
    { model: innerEye, shader: lambertShader },
    //{ model: outerEye, shader: shader },
    { model: testModel, shader: lambertShader }
  ]);
}

main();
