/* eslint-disable max-lines */
/* eslint-disable complexity */
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
import { AdvancedDynamicTexture, TextBlock, Rectangle } from '@babylonjs/gui';

export class BallfallRenderer extends Base3DRenderer {
  private camera: UniversalCamera;
  private ballMesh!: Mesh;
  private trackMat!: StandardMaterial;
  private obsMat!: StandardMaterial;
  private renderedTracks: Map<number, Mesh> = new Map();
  private guiTexture?: AdvancedDynamicTexture;
  private gameOverPanel?: Rectangle;
  private scoreText?: TextBlock;

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
    this.setupGUI();
  }

  private setupGUI(): void {
    this.guiTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');

    this.gameOverPanel = new Rectangle();
    this.gameOverPanel.width = 1;
    this.gameOverPanel.height = 1;
    this.gameOverPanel.background = 'rgba(0, 0, 0, 0.8)';
    this.gameOverPanel.color = 'transparent';
    this.gameOverPanel.isVisible = false;
    this.guiTexture.addControl(this.gameOverPanel);

    const title = new TextBlock();
    title.text = 'GAME OVER';
    title.color = 'red';
    title.fontSize = 64;
    title.fontWeight = 'bold';
    title.top = '-100px';
    this.gameOverPanel.addControl(title);

    this.scoreText = new TextBlock();
    this.scoreText.color = 'white';
    this.scoreText.fontSize = 32;
    this.scoreText.top = '40px';
    this.gameOverPanel.addControl(this.scoreText);

    const restartHint = new TextBlock();
    restartHint.text = 'Press Enter to Play Again';
    restartHint.color = 'white';
    restartHint.fontSize = 24;
    restartHint.top = '100px';
    this.gameOverPanel.addControl(restartHint);
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

    const obsMat = new StandardMaterial('obsMat', this.scene);
    obsMat.diffuseColor = new Color3(0, 0, 0);
    obsMat.specularColor = new Color3(0, 0, 0);
    this.obsMat = obsMat;
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

    if (this.gameOverPanel && this.scoreText) {
      if (state.isGameOver) {
        this.scoreText.text = `Score: ${Math.floor(state.score)}`;
        this.gameOverPanel.isVisible = true;
      } else {
        this.gameOverPanel.isVisible = false;
      }
    }

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

        if (segment.obstacles) {
          for (const obs of segment.obstacles) {
            const obstacle = MeshBuilder.CreateCylinder(
              'spike',
              {
                diameterTop: 0,
                diameterBottom: 1.6,
                height: 2.4,
                tessellation: 6,
              },
              this.scene
            );

            obstacle.parent = box;

            obstacle.position = new Vector3(obs.x, 1.7, obs.z - centerZ);

            obstacle.material = this.obsMat;
            obstacle.enableEdgesRendering();
            obstacle.edgesWidth = 8.0;
            obstacle.edgesColor = new Color4(1, 0, 0, 1);
          }
        }

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

  public clear(): void {
    this.renderedTracks.forEach(mesh => {
      mesh.dispose();
    });
    this.renderedTracks.clear();
  }
}
