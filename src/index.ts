import { getTestModel, Model } from "./tinyrenderer/model";
import { render, renderOptions, runRenderLoop } from "./tinyrenderer/tinyrenderer";
import { readTexture } from "./utils/tgaImage";
import { AfricanHeadModel } from "./obj/african_head/african_head";
import { LambertShader } from "./tinyrenderer/shaders/lambertShader";
import { GouraudShader } from "./tinyrenderer/shaders/gouraudShader";
import { DepthShader } from "./tinyrenderer/shaders/shaderBase";
import { GUI } from 'lil-gui';

const gui = new GUI();


async function main(): Promise<void> {
  const lambertShader = LambertShader.init(0.1);
  const depthShader = DepthShader.init();
  const gouraudShader = GouraudShader.init();
  const shaders = [lambertShader, depthShader, gouraudShader];
  const shaderMap = new Map((shaders.map(s => [s.name, s])));

  const options: renderOptions = {
    useBarycentricInterpolation: true,
    useOrthoCamera: false,
    useZBuffer: true,
    rotate: false,
  }

  const renderGui = gui.addFolder('render options');
  renderGui.add(options, "useBarycentricInterpolation");
  renderGui.add(options, "useOrthoCamera");
  renderGui.add(options, "useZBuffer");
  renderGui.add(options, "rotate");

  const head = new Model().parse(AfricanHeadModel.head);
  head.shader = lambertShader;
  head.diffuseTexture = await readTexture(AfricanHeadModel.headDiffuse);
  head.normalTexture = await readTexture(AfricanHeadModel.headNormal);
  head.normalTangentMap = await readTexture(AfricanHeadModel.headNormalTangent);

  const headGUI = gui.addFolder('Head');
  headGUI.add(head, 'shader', Array.from(shaderMap.values()));

  const innerEye = new Model().parse(AfricanHeadModel.innerEye);
  innerEye.shader = lambertShader;
  innerEye.diffuseTexture = await readTexture(AfricanHeadModel.innerEyeDiffuse);
  innerEye.normalTexture = await readTexture(AfricanHeadModel.innerEyeNormal);

  const eyeGUI = gui.addFolder('Eye');
  eyeGUI.add(innerEye, 'shader', Array.from(shaderMap.values()));

  const checkboard = getTestModel();
  checkboard.shader = lambertShader;
  const checkboardGUI = gui.addFolder('Checkboard');
  checkboardGUI.add(checkboard, 'shader', Array.from(shaderMap.values()));

  const models = [head, innerEye, checkboard];

  render(models, options);

  let cancelLoop: (() => void) | undefined;
  gui.onChange(async () => {
    if (cancelLoop){
      cancelLoop();
      cancelLoop = undefined;
    }

    if (options.rotate) {
      cancelLoop = await runRenderLoop(models, options);
    }
    else {
      render(models, options);
    }

  });
}

main();
