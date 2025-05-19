import { Camera } from "./tinyrenderer/camera";

export function move(camera: Camera, delta: { x: number, y: number }): void {
  const radius = camera.target.clone().sub(camera.eye).length();

  let phi = Math.atan2(camera.eye.x, camera.eye.z);
  if (phi < 0)
    phi = 2 * Math.PI + phi;

  const newPhi = (phi + 0.001 * (delta.x)) % (2 * Math.PI);

  const x = radius * Math.sin(newPhi);
  const z = radius * Math.cos(newPhi);

  camera.eye.x = x;
  camera.eye.z = z;
}