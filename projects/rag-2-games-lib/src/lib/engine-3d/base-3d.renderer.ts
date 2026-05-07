/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { 
  Engine, 
  Scene, 
  Color4, 
  EngineOptions, 
  Vector3, 
  HemisphericLight, 
  DirectionalLight, 
  ShadowGenerator 
} from '@babylonjs/core';

export abstract class Base3DRenderer {
  protected engine: Engine;
  protected scene: Scene;

  private handleResize = (): void => {
    this.engine.resize();
  };

  constructor(canvas: HTMLCanvasElement, clearColor: Color4 = new Color4(0, 0, 0, 1)) {
    const engineOptions: EngineOptions = {
      antialias: true,
      preserveDrawingBuffer: true,
      stencil: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
      doNotHandleContextLost: true
    };

    this.engine = new Engine(canvas, true, engineOptions, true);
    
    this.scene = new Scene(this.engine);
    this.scene.clearColor = clearColor;

    window.addEventListener('resize', this.handleResize);

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
  }

  protected setupStandardLightingAndShadows(
    sunDirection: Vector3 = new Vector3(-0.5, -1.5, -0.5),
    shadowResolution: number = 2048,
    shadowDarkness: number = 0.35
  ): { dirLight: DirectionalLight, shadowGenerator: ShadowGenerator } {
    
    const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), this.scene);
    hemiLight.intensity = 0.5;

    const dirLight = new DirectionalLight("dirLight", sunDirection, this.scene);
    dirLight.position = new Vector3(20, 40, 20);
    dirLight.intensity = 1.2;

    const shadowGenerator = new ShadowGenerator(shadowResolution, dirLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;
    shadowGenerator.setDarkness(shadowDarkness);

    return { dirLight, shadowGenerator };
  }

  public dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    this.scene.dispose();
    this.engine.dispose();
  }
}