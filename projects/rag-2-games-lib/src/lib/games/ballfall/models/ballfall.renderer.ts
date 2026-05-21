/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/explicit-member-accessibility */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/consistent-generic-constructors */
import {
  UniversalCamera,
  Vector3,
  MeshBuilder,
  Mesh,
  StandardMaterial,
  Color3,
  Color4,
  GlowLayer,
  DirectionalLight,
  HemisphericLight,
} from '@babylonjs/core';
import { Base3DRenderer } from '../../../engine-3d/base-3d.renderer';
import { BallfallState } from './ballfall.class';
import type { TrackSegment } from '../ballfall.component';

export class BallfallRenderer extends Base3DRenderer {
  private camera: UniversalCamera;
  private ballMesh!: Mesh;
  private trackMat!: StandardMaterial;
  private renderedTracks: Map<number, Mesh> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    super(canvas, new Color4(0.1, 0.1, 0.15, 1));

    this.camera = new UniversalCamera(
      'camera',
      new Vector3(0, 5, -10),
      this.scene
    );
    this.camera.inputs.clear();

    const ambientLight = new HemisphericLight(
      'ambientLight',
      new Vector3(0, 1, 0),
      this.scene
    );
    ambientLight.intensity = 0.6;
    const dirLight = new DirectionalLight(
      'dirLight',
      new Vector3(-1, -2, 1),
      this.scene
    );
    dirLight.intensity = 0.8;

    this.createEnvironment();
  }

  private createEnvironment(): void {
    this.ballMesh = MeshBuilder.CreateIcoSphere(
      'ball',
      { radius: 0.5, subdivisions: 2 },
      this.scene
    );

    const ballMat = new StandardMaterial('ballMat', this.scene);
    ballMat.diffuseColor = new Color3(0, 0, 0);
    ballMat.specularColor = new Color3(0, 0, 0);
    ballMat.emissiveColor = new Color3(0.05, 0.05, 0.05);
    this.ballMesh.material = ballMat;

    this.ballMesh.enableEdgesRendering();
    this.ballMesh.edgesWidth = 12.0;
    this.ballMesh.edgesColor = new Color4(1, 0.5, 0, 1);

    this.trackMat = new StandardMaterial('trackMat', this.scene);
    this.trackMat.diffuseColor = new Color3(0.1, 0.1, 0.1);
    this.trackMat.specularColor = new Color3(0, 0, 0);
  }

  public render(state: BallfallState, track: TrackSegment[]): void {
    this.ballMesh.position.x = state.ballX;
    this.ballMesh.position.y = state.ballY;
    this.ballMesh.position.z = state.ballZ;

    const radius = 0.5;
    const rollSpeedMultiplier = 0.3;

    this.ballMesh.rotation.x = (state.ballZ / radius) * rollSpeedMultiplier;
    this.ballMesh.rotation.z = (-state.ballX / radius) * rollSpeedMultiplier;

    const targetCamX = state.ballX * 0.5;
    const targetCamY = Math.max(state.ballY + 4, 4);
    const targetCamZ = state.ballZ - 8;

    this.camera.position.x += (targetCamX - this.camera.position.x) * 0.1;
    this.camera.position.y += (targetCamY - this.camera.position.y) * 0.1;
    this.camera.position.z = targetCamZ;

    this.camera.setTarget(
      new Vector3(
        this.ballMesh.position.x,
        this.ballMesh.position.y,
        state.ballZ + 5
      )
    );

    this.syncTrack(track);
  }

  private syncTrack(track: TrackSegment[]): void {
    for (const segment of track) {
      if (!this.renderedTracks.has(segment.zStart)) {
        const length = segment.zEnd - segment.zStart;
        const centerZ = segment.zStart + length / 2;

        const box = MeshBuilder.CreateBox(
          `track_${segment.zStart}`,
          { width: segment.width, height: 1, depth: length },
          this.scene
        );

        if (segment.isRamp) {
          box.rotation.x = -(segment.rampAngle || 0);
          box.position = new Vector3(
            segment.xOffset,
            -0.5 + (length / 2) * Math.sin(segment.rampAngle || 0),
            centerZ
          );
        } else {
          box.position = new Vector3(segment.xOffset, -0.5, centerZ);
        }

        box.position = new Vector3(segment.xOffset, -0.5, centerZ);
        box.material = this.trackMat;

        box.enableEdgesRendering();
        box.edgesWidth = 4.0;
        box.edgesColor = new Color4(1, 0.5, 0, 1);

        this.renderedTracks.set(segment.zStart, box);
      }
    }

    const activeZStarts = track.map(s => s.zStart);
    for (const [zStart, mesh] of this.renderedTracks.entries()) {
      if (!activeZStarts.includes(zStart)) {
        mesh.dispose();
        this.renderedTracks.delete(zStart);
      }
    }
  }

  public clear(): void {}
}
