/* eslint-disable @typescript-eslint/consistent-generic-constructors */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */

import {
  UniversalCamera,
  Vector3,
  MeshBuilder,
  Mesh,
  StandardMaterial,
  Color3,
  Color4,
  DirectionalLight,
  HemisphericLight,
} from '@babylonjs/core';

import { Base3DRenderer } from '../../../engine-3d/base-3d.renderer';
import { BallfallState } from './ballfall.class';

// ZMIANA: Importujemy interfejs Platform z komponentu, używając 'import type'
import type { Platform } from '../ballfall.component';

export class BallfallRenderer extends Base3DRenderer {
  private camera: UniversalCamera;

  private ballMesh!: Mesh;
  private mainPillar!: Mesh;

  private safeMat!: StandardMaterial;
  private dangerMat!: StandardMaterial;
  private pillarMat!: StandardMaterial;

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, new Color4(0.88, 0.95, 0.92, 1));

    this.camera = new UniversalCamera(
      'camera',
      new Vector3(0, 18, -12),
      this.scene
    );
    this.camera.setTarget(new Vector3(0, 15, 0));
    this.camera.inputs.clear();

    const light = new DirectionalLight(
      'dirLight',
      new Vector3(-1, -2, -1),
      this.scene
    );
    light.position = new Vector3(20, 40, 20);
    light.intensity = 0.7;

    const ambientLight = new HemisphericLight(
      'ambientLight',
      new Vector3(0, 1, 0),
      this.scene
    );
    ambientLight.intensity = 0.5;

    this.createEnvironment();
  }

  private createEnvironment(): void {
    this.pillarMat = new StandardMaterial('pillarMat', this.scene);
    this.pillarMat.diffuseColor = new Color3(1, 1, 1);

    this.mainPillar = MeshBuilder.CreateCylinder(
      'pillar',
      { height: 40, diameter: 3 },
      this.scene
    );
    this.mainPillar.position.y = 0;
    this.mainPillar.material = this.pillarMat;
    this.mainPillar.receiveShadows = true;

    this.ballMesh = MeshBuilder.CreateSphere(
      'ball',
      { diameter: 0.8 },
      this.scene
    );
    this.ballMesh.position = new Vector3(0, 15, -2.2);

    const ballMat = new StandardMaterial('ballMat', this.scene);
    ballMat.diffuseColor = new Color3(0.2, 0.6, 1);
    this.ballMesh.material = ballMat;

    this.safeMat = new StandardMaterial('safeMat', this.scene);
    this.safeMat.diffuseColor = new Color3(0.2, 0.8, 0.2);

    this.dangerMat = new StandardMaterial('dangerMat', this.scene);
    this.dangerMat.diffuseColor = new Color3(0.8, 0.2, 0.2);
  }

  public render(state: BallfallState, platforms: Platform[]): void {
    if (this.mainPillar) {
      this.mainPillar.rotation.y = state.cylinderRotY;
    }

    if (this.ballMesh) {
      this.ballMesh.position.y = state.ballY;
    }

    this.syncPlatforms(platforms);

    const targetCameraY = state.ballY + 3;
    this.camera.position.y += (targetCameraY - this.camera.position.y) * 0.1;
    this.camera.setTarget(new Vector3(0, this.camera.position.y - 3, 0));
  }

  private renderedPlatforms: Map<number, Mesh[]> = new Map();

  private syncPlatforms(platforms: Platform[]): void {
    for (const platform of platforms) {
      if (!this.renderedPlatforms.has(platform.y)) {
        this.buildPlatformMesh(platform);
      }
    }

    const stateYLevels = platforms.map(p => p.y);
    for (const [y, meshes] of this.renderedPlatforms.entries()) {
      if (!stateYLevels.includes(y)) {
        meshes.forEach(mesh => mesh.dispose());
        this.renderedPlatforms.delete(y);
      }
    }
  }

  private buildPlatformMesh(platform: Platform): void {
    const platformMeshes: Mesh[] = [];
    const segmentsCount = 12;
    const anglePerSegment = (Math.PI * 2) / segmentsCount;

    for (let i = 0; i < segmentsCount; i++) {
      const segmentType = platform.segments[i];
      if (segmentType === 0) continue;

      const slice = MeshBuilder.CreateCylinder(
        `slice_Y${platform.y}_${i}`,
        {
          height: 0.5,
          diameter: 5.5,
          arc: 1 / segmentsCount,
        },
        this.scene
      );

      slice.position.y = platform.y;
      slice.rotation.y = i * anglePerSegment;
      slice.setParent(this.mainPillar);

      slice.material = segmentType === 1 ? this.safeMat : this.dangerMat;
      platformMeshes.push(slice);
    }

    this.renderedPlatforms.set(platform.y, platformMeshes);
  }

  public clear(): void {}
}
