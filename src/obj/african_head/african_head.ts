// @ts-nocheck
import headModelFile from "./african_head.txt";
import headDiffuseFile from "./african_head_diffuse.tga";
import headNormalFile from "./african_head_nm.tga";
import headNormalTangentFile from "./african_head_nm_tangent.tga";
import headSpecFile from "./african_head_spec.tga";
import gridFile from "./grid.tga"

import innerEyeModelFile from "./african_head_eye_inner.txt";
import innerEyeDiffuseFile from "./african_head_eye_inner_diffuse.tga";
import innerEyeNormalFile from "./african_head_eye_inner_nm.tga";
import innerEyeNormalTangentFile from "./african_head_eye_inner_nm_tangent.tga";
import innerEyeSpecFile from "./african_head_eye_inner_spec.tga";

import outerEyeFile from "./african_head_eye_outer.txt";
import outerEyeDiffuseFile from "./african_head_eye_outer_diffuse.tga";
import outerEyeNormalFile from "./african_head_eye_outer_nm.tga";
import outerEyeNormalTangentFile from "./african_head_eye_outer_nm_tangent.tga";
import outerEyeSpecFile from "./african_head_eye_outer_spec.tga";
import outerEyeGlossFile from "./african_head_eye_outer_gloss.tga";

export class AfricanHeadModel {
  public static head = headModelFile;
  public static headDiffuse = headDiffuseFile;
  public static headNormal = headNormalFile;
  public static headNormalTangent = headNormalTangentFile;
  public static headSpec = headSpecFile;
  public static headGrid = gridFile;

  public static innerEye = innerEyeModelFile;
  public static innerEyeDiffuse = innerEyeDiffuseFile;
  public static innerEyeNormal = innerEyeNormalFile;
  public static innerEyeNormalTangent = innerEyeNormalTangentFile;
  public static innerEyeSpec = innerEyeSpecFile;

  public static outerEye = outerEyeFile;
  public static outerEyeDiffuse = outerEyeDiffuseFile;
  public static outerEyeNormal = outerEyeNormalFile;
  public static outerEyeNormalTangent = outerEyeNormalTangentFile;
  public static outerEyeSpec = outerEyeSpecFile;
  public static outerEyeGloss = outerEyeGlossFile;
}