/* eslint-disable max-lines */
/* eslint-disable complexity */
import {
  ArcRotateCamera,
  Color3,
  Color4,
  GlowLayer,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  PointLight,
  StandardMaterial,
  TransformNode,
  Vector3,
} from '@babylonjs/core';
import {
  AdvancedDynamicTexture,
  Control,
  Rectangle,
  StackPanel,
  TextBlock,
} from '@babylonjs/gui';
import { Base3DRenderer } from '../../../engine-3d/base-3d.renderer';
import { CrashballState } from './crashball.class';
import {
  ARENA_HALF,
  CORNER_POS,
  CORNER_R,
  SIDES,
  TPlayerSide,
} from './crashball.interfaces';
import { getVehicleWorldPos } from './crashball.physics';

const WALL_H = 1.0;
const VEHICLE_R = 1.2;
const VEHICLE_H = 0.38;
const ARENA_SCALE = 0.92;  // visual floor slightly smaller than physics boundary
const CORNER_VISUAL_R = 2.0; // visual-only corner radius, independent of physics CORNER_R

const PLAYER_COLORS: Record<TPlayerSide, Color3> = {
  top:    new Color3(0.15, 0.45, 1.0),
  bottom: new Color3(1.0,  0.2,  0.15),
  left:   new Color3(0.1,  0.75, 0.25),
  right:  new Color3(1.0,  0.75, 0.05),
};

const COLOR_CSS: Record<TPlayerSide, string> = {
  top:    '#2277ff',
  bottom: '#ff3322',
  left:   '#11cc44',
  right:  '#ffcc00',
};

export class CrashballRenderer extends Base3DRenderer {
  private _vehicleMeshes: Mesh[] = [];
  private _ballMeshes = new Map<number, Mesh>();
  private _superWaveMeshes: Mesh[] = [];
  private _ballMat!: StandardMaterial;
  private _guiTexture!: AdvancedDynamicTexture;
  private _hpTexts: TextBlock[] = [];
  private _superFills: Rectangle[] = [];
  private _playerPanels: StackPanel[] = [];

  public constructor(canvas: HTMLCanvasElement) {
    super(canvas, new Color4(0.02, 0.02, 0.05, 1));
    this.initScene();
  }

  private initScene(): void {
    // === CAMERA — locked isometric top-down, cannot be rotated by player ===
    const cam = new ArcRotateCamera('cam', -Math.PI / 2, 0.45, 38, Vector3.Zero(), this.scene);
    cam.inputs.clear();

    // === LIGHTING ===
    // Ambient hemisphere: cool blue sky light, dark ground bounce
    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
    hemi.intensity = 0.4;
    hemi.diffuse = new Color3(0.7, 0.82, 1.0);
    hemi.groundColor = new Color3(0.05, 0.08, 0.2);
    hemi.specular = new Color3(0.3, 0.45, 1.0);

    // Global glow layer — picks up all emissiveColor meshes automatically
    const glow = new GlowLayer('glow', this.scene);
    glow.intensity = 0.25;

    // Blue neon point lights above each corner bumper
    const inner = ARENA_HALF * ARENA_SCALE;
    const cornerPos = [
      new Vector3(-inner, 4, -inner), new Vector3(inner, 4, -inner),
      new Vector3(-inner, 4,  inner), new Vector3(inner, 4,  inner),
    ];
    for (let i = 0; i < cornerPos.length; i++) {
      const pl = new PointLight(`pl${i}`, cornerPos[i], this.scene);
      pl.diffuse = new Color3(0.15, 0.5, 1.0);
      pl.specular = new Color3(0.2, 0.6, 1.0);
      pl.intensity = 14;
      pl.range = 10;
    }

    // Ball glow material — bright emissive white/blue
    this._ballMat = new StandardMaterial('ballMat', this.scene);
    this._ballMat.diffuseColor = new Color3(0.9, 0.95, 1.0);
    this._ballMat.emissiveColor = new Color3(0.85, 0.9, 1.0);
    this._ballMat.specularColor = new Color3(1, 1, 1);
    this._ballMat.specularPower = 12;

    this.buildFloor();
    this.buildCorners();
    this.buildVehicles();
    this.buildSuperWaves();
    this.setupGUI();
  }

  private buildFloor(): void {
    const size = ARENA_HALF * 2 * ARENA_SCALE;
    const floor = MeshBuilder.CreateGround('floor', { width: size, height: size }, this.scene);

    // PBR material: metallic, low roughness — subtle reflective sci-fi surface
    const mat = new PBRMaterial('floorMat', this.scene);
    mat.albedoColor = new Color3(0.05, 0.1, 0.25);
    mat.roughness = 0.22;
    mat.metallic = 0.9;
    mat.emissiveColor = new Color3(0.01, 0.03, 0.1);
    floor.material = mat;
  }

  private buildCorners(): void {
    // Visual corners aligned with physics arc centres — both use CORNER_POS
    const c = CORNER_POS;

    const cornerDefs = [
      { x: -c, z: -c, rotY:  Math.PI / 4 },
      { x:  c, z: -c, rotY: -Math.PI / 4 },
      { x: -c, z:  c, rotY:  3 * Math.PI / 4 },
      { x:  c, z:  c, rotY: -3 * Math.PI / 4 },
    ];

    // Outer body — dark industrial metal (PBR, high roughness)
    const bodyMat = new PBRMaterial('cBodyMat', this.scene);
    bodyMat.albedoColor = new Color3(0.07, 0.18, 0.07);
    bodyMat.roughness = 0.72;
    bodyMat.metallic = 0.65;

    // Inner barrel — dark matte, no speculars
    const barrelMat = new StandardMaterial('cBarrelMat', this.scene);
    barrelMat.diffuseColor = new Color3(0.04, 0.04, 0.06);
    barrelMat.specularColor = Color3.Black();

    // Plasma core — jaskrawy błękit; picked up by GlowLayer
    const coreMat = new StandardMaterial('cCoreMat', this.scene);
    coreMat.emissiveColor = new Color3(0, 0.6, 0.9);
    coreMat.disableLighting = true;

    // Metallic accent rings
    const ringMat = new PBRMaterial('cRingMat', this.scene);
    ringMat.albedoColor = new Color3(0.28, 0.32, 0.28);
    ringMat.roughness = 0.3;
    ringMat.metallic = 0.92;

    for (let i = 0; i < cornerDefs.length; i++) {
      const def = cornerDefs[i];

      // Group all parts under a TransformNode for easy rotation
      const node = new TransformNode(`corner${i}`, this.scene);
      node.position.set(def.x, 0, def.z);
      node.rotation.y = def.rotY;

      // Main body cylinder
      const body = MeshBuilder.CreateCylinder(`cBody${i}`, {
        diameter: CORNER_VISUAL_R * 2, height: WALL_H, tessellation: 20,
      }, this.scene);
      body.parent = node;
      body.position.y = WALL_H / 2;
      body.material = bodyMat;

      // Horizontal barrel — exit nozzle pointing toward arena center (+Z in local space)
      const barrel = MeshBuilder.CreateCylinder(`cBarrel${i}`, {
        diameter: 1.1, height: 2.0, tessellation: 12,
      }, this.scene);
      barrel.parent = node;
      barrel.rotation.x = Math.PI / 2;
      barrel.position.y = WALL_H / 2;
      barrel.position.z = CORNER_VISUAL_R * 0.55;
      barrel.material = barrelMat;

      // Plasma core inside barrel — glows via GlowLayer
      const core = MeshBuilder.CreateSphere(`cCore${i}`, { diameter: 0.8, segments: 8 }, this.scene);
      core.parent = node;
      core.position.y = WALL_H / 2;
      core.position.z = CORNER_VISUAL_R * 0.65;
      core.material = coreMat;

      // Top metallic ring
      const topRing = MeshBuilder.CreateTorus(`cTop${i}`, {
        diameter: CORNER_VISUAL_R * 2 + 0.1, thickness: 0.2, tessellation: 20,
      }, this.scene);
      topRing.parent = node;
      topRing.position.y = WALL_H + 0.01;
      topRing.material = ringMat;

      // Bottom metallic ring
      const botRing = MeshBuilder.CreateTorus(`cBot${i}`, {
        diameter: CORNER_VISUAL_R * 2 + 0.1, thickness: 0.2, tessellation: 20,
      }, this.scene);
      botRing.parent = node;
      botRing.position.y = 0.18;
      botRing.material = ringMat;
    }
  }

  private buildVehicles(): void {
    // Hovercrafts: flat cylinder body + translucent glass dome on top
    // === INSERT PLAYER MOVEMENT LOGIC HERE ===
    // Update mesh.position.x / mesh.position.z each frame based on player input
    for (const side of SIDES) {
      const bodyMat = new StandardMaterial(`vMat_${side}`, this.scene);
      bodyMat.diffuseColor = PLAYER_COLORS[side];
      bodyMat.emissiveColor = PLAYER_COLORS[side].scale(0.4);
      bodyMat.specularColor = new Color3(0.6, 0.6, 0.6);
      bodyMat.specularPower = 32;

      const body = MeshBuilder.CreateCylinder(`vehicle_${side}`, {
        diameter: VEHICLE_R * 2, height: VEHICLE_H, tessellation: 20,
      }, this.scene);
      body.material = bodyMat;
      body.position.y = VEHICLE_H / 2 + 0.05;
      this._vehicleMeshes.push(body);

      // Translucent glass dome — aesthetic hovercraft canopy
      const domeMat = new StandardMaterial(`domeMat_${side}`, this.scene);
      domeMat.diffuseColor = new Color3(0.7, 0.88, 1.0);
      domeMat.emissiveColor = new Color3(0.1, 0.2, 0.35);
      domeMat.alpha = 0.48;
      const dome = MeshBuilder.CreateSphere(`dome_${side}`, { diameter: VEHICLE_R * 1.05, segments: 10 }, this.scene);
      dome.scaling.y = 0.52;
      dome.parent = body;
      dome.position.y = VEHICLE_H * 0.75;
      dome.material = domeMat;
    }
  }

  private buildSuperWaves(): void {
    for (const side of SIDES) {
      const mat = new StandardMaterial(`swMat_${side}`, this.scene);
      mat.diffuseColor = PLAYER_COLORS[side];
      mat.emissiveColor = PLAYER_COLORS[side].scale(0.7);
      mat.alpha = 0.38;
      const disc = MeshBuilder.CreateDisc(`sw_${side}`, { radius: 1, tessellation: 32 }, this.scene);
      disc.rotation.x = Math.PI / 2;
      disc.position.y = 0.12;
      disc.material = mat;
      disc.isVisible = false;
      this._superWaveMeshes.push(disc);
    }
  }

  private setupGUI(): void {
    this._guiTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');

    const alignments: { hAlign: number; vAlign: number; left: string; top: string }[] = [
      { hAlign: Control.HORIZONTAL_ALIGNMENT_CENTER, vAlign: Control.VERTICAL_ALIGNMENT_TOP,    left: '0px',  top: '8px'  },
      { hAlign: Control.HORIZONTAL_ALIGNMENT_CENTER, vAlign: Control.VERTICAL_ALIGNMENT_BOTTOM, left: '0px',  top: '-8px' },
      { hAlign: Control.HORIZONTAL_ALIGNMENT_LEFT,   vAlign: Control.VERTICAL_ALIGNMENT_CENTER, left: '8px',  top: '0px'  },
      { hAlign: Control.HORIZONTAL_ALIGNMENT_RIGHT,  vAlign: Control.VERTICAL_ALIGNMENT_CENTER, left: '-8px', top: '0px'  },
    ];

    for (let i = 0; i < 4; i++) {
      const side = SIDES[i];
      const css = COLOR_CSS[side];
      const a = alignments[i];

      const panel = new StackPanel(`panel_${side}`);
      panel.isVertical = true;
      panel.horizontalAlignment = a.hAlign;
      panel.verticalAlignment = a.vAlign;
      panel.left = a.left;
      panel.top = a.top;
      panel.width = '100px';
      panel.adaptHeightToChildren = true;
      this._guiTexture.addControl(panel);
      this._playerPanels.push(panel);

      const hp = new TextBlock(`hp_${side}`, 'HP: 20');
      hp.color = css;
      hp.fontSize = 16;
      hp.height = '22px';
      hp.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
      panel.addControl(hp);
      this._hpTexts.push(hp);

      const barBg = new Rectangle(`barBg_${side}`);
      barBg.width = '80px';
      barBg.height = '8px';
      barBg.background = '#111';
      barBg.color = css;
      barBg.thickness = 1;
      panel.addControl(barBg);
      this._superFills.push(this.addFill(barBg, css));
    }
  }

  private addFill(parent: Rectangle, color: string): Rectangle {
    const fill = new Rectangle();
    fill.width = '0px';
    fill.height = '100%';
    fill.background = color;
    fill.thickness = 0;
    fill.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    parent.addControl(fill);
    return fill;
  }

  public render(state: CrashballState): void {
    this.updateVehicles(state);
    this.updateBalls(state);
    this.updateSupers(state);
    this.updateGUI(state);
  }

  private updateVehicles(state: CrashballState): void {
    // === INSERT VEHICLE UPDATE LOGIC HERE (called every frame) ===
    for (let i = 0; i < SIDES.length; i++) {
      const cp = state.players[i];
      const mesh = this._vehicleMeshes[i];
      const wp = getVehicleWorldPos(cp.side, cp.position);
      mesh.position.x = wp.x;
      mesh.position.z = wp.z;
      mesh.isVisible = !cp.eliminated;
    }
  }

  private updateBalls(state: CrashballState): void {
    // === INSERT BALL PHYSICS / COLLISION LOGIC BEFORE THIS (in component) ===
    const activeIds = new Set(state.balls.map(b => b.id));
    for (const [id, mesh] of this._ballMeshes) {
      if (!activeIds.has(id)) { mesh.dispose(); this._ballMeshes.delete(id); }
    }
    for (const ball of state.balls) {
      if (!this._ballMeshes.has(ball.id)) {
        const sphere = MeshBuilder.CreateSphere(`ball_${ball.id}`, { diameter: ball.radius * 2, segments: 10 }, this.scene);
        sphere.material = this._ballMat;
        this._ballMeshes.set(ball.id, sphere);
      }
      const mesh = this._ballMeshes.get(ball.id);
      if (mesh) { mesh.position.x = ball.x; mesh.position.y = ball.radius; mesh.position.z = ball.z; }
    }
  }

  private updateSupers(state: CrashballState): void {
    for (let i = 0; i < SIDES.length; i++) {
      const cp = state.players[i];
      const disc = this._superWaveMeshes[i];
      if (cp.superActive && cp.superWaveRadius > 0) {
        const wp = getVehicleWorldPos(cp.side, cp.position);
        disc.position.x = wp.x;
        disc.position.z = wp.z;
        disc.scaling.setAll(cp.superWaveRadius);
        disc.isVisible = true;
      } else {
        disc.isVisible = false;
      }
    }
  }

  private updateGUI(state: CrashballState): void {
    for (let i = 0; i < SIDES.length; i++) {
      const cp = state.players[i];
      this._hpTexts[i].text = cp.eliminated ? 'OUT' : `HP: ${cp.hp}`;
      this._superFills[i].width = `${Math.round(cp.superCharge * 78)}px`;
    }
  }

  public clear(): void {
    for (const [, mesh] of this._ballMeshes) { mesh.dispose(); }
    this._ballMeshes.clear();
  }
}
