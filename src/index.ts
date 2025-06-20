import { getTestModel, Model } from "./tinyrenderer/model";
import { render, runRenderLoop } from "./tinyrenderer/tinyrenderer";
import { readTexture } from "./utils/tgaImage";
import { AfricanHeadModel } from "./obj/african_head/african_head";
import { LambertShader } from "./tinyrenderer/shaders/lambertShader";
import { GouraudShader } from "./tinyrenderer/shaders/gouraudShader";
import { DepthShader } from "./tinyrenderer/shaders/shaderBase";
import { GUI } from 'lil-gui';
import { RenderOptions } from "./tinyrenderer/renerOptions";

const gui = new GUI();

async function main(): Promise<void> {
  const lambertShader = LambertShader.init();
  const depthShader = DepthShader.init();
  const gouraudShader = GouraudShader.init();
  const shaders = [lambertShader, depthShader, gouraudShader];
  const shaderMap = new Map((shaders.map(s => [s.name, s])));

  const renderGui = gui.addFolder('RenderOptions');
  renderGui.add(RenderOptions, "useBarycentricInterpolation");
  renderGui.add(RenderOptions, "useOrthoCamera");
  renderGui.add(RenderOptions, "useZBuffer");
  renderGui.add(RenderOptions, "useTangentNormalMap");
  renderGui.add(RenderOptions, "shadowPassEnable");
  renderGui.add(RenderOptions, "rotate");

  const headGUI = gui.addFolder('Head');
  const head = new Model().parse(AfricanHeadModel.head);
  head.shader = lambertShader;
  head.diffuseTexture = await readTexture(AfricanHeadModel.headDiffuse);
  head.normalTexture = await readTexture(AfricanHeadModel.headNormal);
  head.normalTangentTexture = await readTexture(AfricanHeadModel.headNormalTangent);
  headGUI.add(head, 'shader', Array.from(shaderMap.values()));

  const eyeGUI = gui.addFolder('Eye');
  const innerEye = new Model().parse(AfricanHeadModel.innerEye);
  innerEye.shader = lambertShader;
  innerEye.diffuseTexture = await readTexture(AfricanHeadModel.innerEyeDiffuse);
  innerEye.normalTexture = await readTexture(AfricanHeadModel.innerEyeNormal);
  eyeGUI.add(innerEye, 'shader', Array.from(shaderMap.values()));

  const checkboardGUI = gui.addFolder('Checkboard');
  const checkboard = getTestModel();
  checkboard.shader = lambertShader;
  checkboardGUI.add(checkboard, 'shader', Array.from(shaderMap.values()));

  const lightGUI = gui.addFolder('Light');
  lightGUI.addFolder('White').add(RenderOptions.DirWhiteLight.color, 'a', 0, 255, 1);
  lightGUI.addFolder('Blue').add(RenderOptions.DirectionalLightBlue.color, 'a', 0, 255, 1);
  lightGUI.addFolder('Green').add(RenderOptions.DirectionalLightGreen.color, 'a', 0, 255, 1);
  lightGUI.addFolder('Red').add(RenderOptions.DirectionalLightRed.color, 'a', 0, 255, 1);

  const models = [head, innerEye, checkboard];
  render(models);

  let cancelLoop: (() => void) | undefined;
  gui.onChange(async () => {
    if (cancelLoop) {
      cancelLoop();
      cancelLoop = undefined;
    }

    if (RenderOptions.rotate) {
      cancelLoop = await runRenderLoop(models);
    }
    else {
      render(models);
    }
  });
}

main();
