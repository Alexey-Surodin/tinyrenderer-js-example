//@ts-ignore
import headModelFile from "./african_head.txt";
//@ts-ignore
import headDiffuseFile from "./african_head_diffuse.tga";
//@ts-ignore
import headNormalFile from "./african_head_nm.tga";
//@ts-ignore
import headNormalTangentFile from "./african_head_nm_tangent.tga";
//@ts-ignore
import headSpecFile from "./african_head_spec.tga";

//@ts-ignore
import innerEyeModelFile from "./african_head_eye_inner.txt";
//@ts-ignore
import innerEyeDiffuseFile from "./african_head_eye_inner_diffuse.tga";
//@ts-ignore
import innerEyeNormalFile from "./african_head_eye_inner_nm.tga";
//@ts-ignore
import innerEyeNormalTangentFile from "./african_head_eye_inner_nm_tangent.tga";
//@ts-ignore
import innerEyeSpecFile from "./african_head_eye_inner_spec.tga";

//@ts-ignore
import outerEyeFile from "./african_head_eye_outer.txt";
//@ts-ignore
import outerEyeDiffuseFile from "./african_head_eye_outer_diffuse.tga";
//@ts-ignore
import outerEyeNormalFile from "./african_head_eye_outer_nm.tga";
//@ts-ignore
import outerEyeNormalTangentFile from "./african_head_eye_outer_nm_tangent.tga";
//@ts-ignore
import outerEyeSpecFile from "./african_head_eye_outer_spec.tga";
//@ts-ignore
import outerEyeGlossFile from "./african_head_eye_outer_gloss.tga";

export class AfricanHeadModel {
  public static head = headModelFile;
  public static headDiffuse = headDiffuseFile;
  public static headNormal = headNormalFile;
  public static headNormalTangent = headNormalTangentFile;
  public static headSpec = headSpecFile;

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