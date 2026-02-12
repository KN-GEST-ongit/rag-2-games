/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/array-type */
/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/consistent-generic-constructors */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { 
  Engine, 
  Scene, 
  UniversalCamera,
  Vector3, 
  HemisphericLight, 
  DirectionalLight, 
  MeshBuilder, 
  Mesh, 
  StandardMaterial, 
  Color3,
  Color4,
  ShadowGenerator,
  Scalar,
  EngineOptions
} from '@babylonjs/core';
import { CrossyRoadState } from './crossyroad.class';
import { ILane, IObstacle } from './crossyroad.interfaces';

export class CrossyRoadRenderer {
  private engine: Engine;
  private scene: Scene;
  private camera: UniversalCamera;
  private shadowGenerator: ShadowGenerator;

  private playerMesh: Mesh;
  private laneMeshes: Map<number, Mesh> = new Map();
  private obstacleMeshes: Map<number, Mesh> = new Map();

  private grassMat: StandardMaterial;
  private roadMat: StandardMaterial;
  private playerMat: StandardMaterial;

  private readonly cameraOffset = new Vector3(2, 10, -10);

  private handleResize = (): void => {
    this.engine.resize();
  };

  constructor(canvas: HTMLCanvasElement) {
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
    this.scene.clearColor = new Color4(0.53, 0.81, 0.92, 1);

    this.camera = new UniversalCamera(
      "camera",
      new Vector3(2, 10, -10),
      this.scene
    );
    
    this.camera.setTarget(Vector3.Zero());
    
    this.camera.inputs.clear();

    const hemiLight = new HemisphericLight("hemi", new Vector3(0, 1, 0), this.scene);
    hemiLight.intensity = 0.8;

    const dirLight = new DirectionalLight("dir", new Vector3(-0.5, -1, -0.5), this.scene);
    dirLight.position = new Vector3(20, 40, 20);
    dirLight.intensity = 0.6;
    
    this.shadowGenerator = new ShadowGenerator(2048, dirLight);
    this.shadowGenerator.useBlurExponentialShadowMap = true;
    this.shadowGenerator.blurKernel = 32;

    const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, this.scene);
    ground.position.y = -0.25;
    ground.receiveShadows = true;
    
    const groundMat = new StandardMaterial("groundMat", this.scene);
    groundMat.diffuseColor = new Color3(0.4, 0.6, 0.4);
    ground.material = groundMat;

    this.grassMat = new StandardMaterial("grassMat", this.scene);
    this.grassMat.diffuseColor = new Color3(0.3, 0.7, 0.3);

    this.roadMat = new StandardMaterial("roadMat", this.scene);
    this.roadMat.diffuseColor = new Color3(0.25, 0.25, 0.25);

    this.playerMat = new StandardMaterial("playerMat", this.scene);
    this.playerMat.diffuseColor = Color3.White();
    this.playerMat.emissiveColor = new Color3(0.1, 0.1, 0.1);

    this.playerMesh = MeshBuilder.CreateBox("player", { 
      height: 0.9, 
      width: 0.7, 
      depth: 0.7 
    }, this.scene);
    this.playerMesh.position.y = 0.45;
    this.playerMesh.material = this.playerMat;
    this.shadowGenerator.addShadowCaster(this.playerMesh);

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
    
    window.addEventListener('resize', this.handleResize);
  }

  public render(state: CrossyRoadState): void {
    this.playerMesh.position.x = Scalar.Lerp(
      this.playerMesh.position.x, 
      state.playerX, 
      0.15
    );
    this.playerMesh.position.z = Scalar.Lerp(
      this.playerMesh.position.z, 
      state.playerZ, 
      0.15
    );

    const jumpHeight = Math.abs(
      Math.sin((this.playerMesh.position.x + this.playerMesh.position.z) * 2)
    ) * 0.1;
    this.playerMesh.position.y = 0.45 + jumpHeight;

    const targetCameraPosition = new Vector3(
      this.playerMesh.position.x + this.cameraOffset.x,
      this.cameraOffset.y,
      this.playerMesh.position.z + this.cameraOffset.z
    );

    this.camera.position = Vector3.Lerp(
      this.camera.position,
      targetCameraPosition,
      0.1
    );

    this.camera.setTarget(new Vector3(
      this.playerMesh.position.x,
      0,
      this.playerMesh.position.z
    ));

    this.syncLanes(state.lanes);
    
    const allObstacles: Array<IObstacle & { z: number }> = state.lanes.flatMap(
      lane => lane.obstacles.map(obs => ({ ...obs, z: lane.z }))
    );
    this.syncObstacles(allObstacles);
  }

  private syncLanes(lanesData: ILane[]): void {
    const existingZ = new Set(lanesData.map(l => l.z));

    for (const [z, mesh] of this.laneMeshes) {
      if (!existingZ.has(z)) {
        mesh.dispose();
        this.laneMeshes.delete(z);
      }
    }

    for (const lane of lanesData) {
      if (!this.laneMeshes.has(lane.z)) {
        const mesh = MeshBuilder.CreateBox(
          `lane_${lane.z}`, 
          { width: 60, height: 0.15, depth: 1 }, 
          this.scene
        );
        mesh.position.set(0, -0.075, lane.z);
        mesh.receiveShadows = true;
        mesh.material = lane.type === 'grass' ? this.grassMat : this.roadMat;
        this.laneMeshes.set(lane.z, mesh);
      }
    }
  }

  private syncObstacles(obstaclesData: Array<IObstacle & { z: number }>): void {
    const currentIds = new Set(obstaclesData.map(o => o.id));

    for (const [id, mesh] of this.obstacleMeshes) {
      if (!currentIds.has(id)) {
        mesh.dispose();
        this.obstacleMeshes.delete(id);
      }
    }

    for (const obs of obstaclesData) {
      let mesh = this.obstacleMeshes.get(obs.id);

      if (!mesh) {
        if (obs.type === 'tree') {
          mesh = MeshBuilder.CreateCylinder(
            `obs_${obs.id}`, 
            { height: 1.2, 
            diameterTop: 0,
            diameterBottom: 0.8, 
            tessellation: 4 }, 
            this.scene
          );
        } else {
          mesh = MeshBuilder.CreateBox(
            `obs_${obs.id}`, 
            { width: obs.width, height: 0.7, depth: 0.9 }, 
            this.scene
          );
        }
        
        const mat = new StandardMaterial(`obsMat_${obs.id}`, this.scene);
        
        if (obs.type === 'tree') {
          mat.diffuseColor = new Color3(0.13, 0.55, 0.13);
        } else if (obs.type === 'car_fast') {
          mat.diffuseColor = Color3.Red();
          mat.emissiveColor = new Color3(0.2, 0, 0);
        } else {
          mat.diffuseColor = new Color3(0.9, 0.9, 0.2);
          mat.emissiveColor = new Color3(0.1, 0.1, 0);
        }
        
        mesh.material = mat;
        this.obstacleMeshes.set(obs.id, mesh);
        this.shadowGenerator.addShadowCaster(mesh);
      }

      mesh.position.x = obs.x;
      mesh.position.z = obs.z;
      mesh.position.y = obs.type === 'tree' ? 0.6 : 0.4;

      if (obs.type !== 'tree') {
        mesh.rotation.y = obs.direction === 1 ? 0 : Math.PI;
      }
      if (obs.type.includes('car')) {
        mesh.rotation.z = Math.sin(Date.now() * 0.01 + obs.id) * 0.02;
      }
    }
  }

  public dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    this.scene.dispose();
    this.engine.dispose();
  }
}