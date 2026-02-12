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
import { CrossyRoadAssets } from './crossyroad.assets';
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

    this.playerMesh = CrossyRoadAssets.createVoxelPlayer(this.scene, this.shadowGenerator);
    this.playerMesh.position.y = 0;

    this.engine.runRenderLoop(() => {
      this.scene.render();
    });
    
    window.addEventListener('resize', this.handleResize);
  }

  public render(state: CrossyRoadState): void {
    const diffX = Math.abs(state.playerX - this.playerMesh.position.x);
    const diffZ = Math.abs(state.playerZ - this.playerMesh.position.z);
    
    const distanceToTarget = diffX + diffZ;

    if (distanceToTarget < 0.05) {
        this.playerMesh.position.x = state.playerX;
        this.playerMesh.position.z = state.playerZ;
        this.playerMesh.position.y = 0;
    } else {
        const speed = 0.35; 
        
        this.playerMesh.position.x = Scalar.Lerp(this.playerMesh.position.x, state.playerX, speed);
        this.playerMesh.position.z = Scalar.Lerp(this.playerMesh.position.z, state.playerZ, speed);

        const jumpHeight = Math.sin(distanceToTarget * Math.PI) * 0.20;
        
        this.playerMesh.position.y = 0 + Math.max(0, jumpHeight);
    }

    this.camera.position.x = this.playerMesh.position.x + this.cameraOffset.x;
    this.camera.position.z = this.playerMesh.position.z + this.cameraOffset.z;
    
    this.camera.position.y = this.cameraOffset.y; 

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
          mesh = CrossyRoadAssets.createVoxelTree(this.scene, this.shadowGenerator);
        } else {
          mesh = CrossyRoadAssets.createVoxelCar(this.scene, this.shadowGenerator, obs.type, obs.width);
        }
        
        mesh.metadata = { type: obs.type };
        this.obstacleMeshes.set(obs.id, mesh);
      }

      mesh.position.x = obs.x;
      mesh.position.z = obs.z;
      mesh.position.y = 0;

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

  public clear(): void {
    this.laneMeshes.forEach(mesh => mesh.dispose());
    this.laneMeshes.clear();

    this.obstacleMeshes.forEach(mesh => mesh.dispose());
    this.obstacleMeshes.clear();
  }
}