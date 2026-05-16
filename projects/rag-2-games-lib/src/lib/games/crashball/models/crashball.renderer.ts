import { Base3DRenderer } from '../../../engine-3d/base-3d.renderer';
import { CrashballState } from './crashball.class';

export class CrashballRenderer extends Base3DRenderer {
  public constructor(canvas: HTMLCanvasElement) {
    super(canvas);
    this.initScene();
  }

  private initScene(): void {
    // implemented later
  }

  public render(_state: CrashballState): void {
    // rendering handled by Babylon.js engine render loop
    // mesh updates will go here
  }

  public clear(): void {
    // dispose scene meshes here on restart
  }
}
