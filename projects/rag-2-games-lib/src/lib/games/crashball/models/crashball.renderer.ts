/* eslint-disable max-lines */
import {
  ArcRotateCamera,
  Color3,
  Color4,
  DynamicTexture,
  GlowLayer,
  HemisphericLight,
  Layer,
  Mesh,
  MeshBuilder,
  PBRMaterial,
  PointLight,
  StandardMaterial,
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
  SIDES,
  TPlayerSide,
} from './crashball.interfaces';
import { getVehicleWorldPos } from './crashball.physics';

const VEHICLE_R = 1.2;
const VEHICLE_H = 0.38;
const ARENA_SCALE = 1.2;   // visual floor extends beyond physics boundary (field behind players)
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
  private _barrierRibbons: Mesh[] = [];
  private _barrierMats: StandardMaterial[] = [];
  private _barrierTime = 0;
  private _columnRibbons: Mesh[] = [];
  private _columnTime = 0;
  private _cornerRings: Mesh[] = [];
  private _cornerTime = 0;
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
    const cam = new ArcRotateCamera('cam', -Math.PI / 2, 0.45, 30, Vector3.Zero(), this.scene);
    cam.inputs.clear();

    // === LIGHTING ===
    // Ambient hemisphere: cool blue sky light, dark ground bounce
    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene);
    hemi.intensity = 0.7;
    hemi.diffuse = new Color3(0.75, 0.88, 1.0);
    hemi.groundColor = new Color3(0.08, 0.12, 0.3);
    hemi.specular = new Color3(0.4, 0.55, 1.0);

    // Global glow layer — picks up all emissiveColor meshes automatically
    const glow = new GlowLayer('glow', this.scene);
    glow.intensity = 0.25;

    // Central point light above the arena
    const centerLight = new PointLight('centerLight', new Vector3(0, 5, 0), this.scene);
    centerLight.diffuse = new Color3(1.0, 0.85, 0.6);
    centerLight.specular = new Color3(1.0, 0.9, 0.7);
    centerLight.intensity = 3;
    centerLight.range = 40;

    // Ball glow material — bright emissive white/blue
    this._ballMat = new StandardMaterial('ballMat', this.scene);
    this._ballMat.diffuseColor = new Color3(0.9, 0.95, 1.0);
    this._ballMat.emissiveColor = new Color3(0.85, 0.9, 1.0);
    this._ballMat.specularColor = new Color3(1, 1, 1);
    this._ballMat.specularPower = 12;

    this.buildStars();
    this.buildEnvironment();
    this.buildFloor();
    this.buildPlatformEdge();
    this.buildFloorArrows();
    this.buildCorners();
    this.buildVehicles();
    this.buildSuperWaves();
    this.buildBarriers();
    this.setupGUI();
  }

  private buildEnvironment(): void {
    this.scene.fogMode = 2; // FOGMODE_EXP
    this.scene.fogColor = new Color3(0.01, 0.01, 0.06);
    this.scene.fogDensity = 0.007;

    // Glowing edge strips along arena perimeter
    const stripMat = new StandardMaterial('stripMat', this.scene);
    stripMat.emissiveColor = new Color3(0.05, 0.3, 0.9);
    stripMat.disableLighting = true;
    const sl = (CORNER_POS - CORNER_VISUAL_R) * 2;
    const sd = 0.07;
    const sh = 0.06;
    const edgeDefs = [
      { w: sl, d: sd, x: 0,           z: -CORNER_POS },
      { w: sl, d: sd, x: 0,           z:  CORNER_POS },
      { w: sd, d: sl, x: -CORNER_POS, z: 0 },
      { w: sd, d: sl, x:  CORNER_POS, z: 0 },
    ];
    for (let i = 0; i < edgeDefs.length; i++) {
      const e = edgeDefs[i];
      const strip = MeshBuilder.CreateBox(`strip${i}`, { width: e.w, height: sh, depth: e.d }, this.scene);
      strip.position.set(e.x, sh / 2, e.z);
      strip.material = stripMat;
    }

    this.buildColumns();
  }

  private buildColumns(): void {
    const off = CORNER_POS + 2;
    const colPositions = [
      { x: -off, z: -off }, { x: off, z: -off },
      { x: -off, z:  off }, { x: off, z:  off },
    ];
    const colColors = [
      new Color3(0.2, 0.5, 1.0), new Color3(1.0, 0.8, 0.1),
      new Color3(0.1, 0.9, 0.3), new Color3(1.0, 0.3, 0.2),
    ];

    for (let i = 0; i < colPositions.length; i++) {
      const { x, z } = colPositions[i];
      const color = colColors[i];
      const colH = 16;

      // Flat platform at base
      const platMat = new StandardMaterial(`colPlatMat${i}`, this.scene);
      platMat.emissiveColor = color.scale(0.4);
      platMat.disableLighting = true;
      const plat = MeshBuilder.CreateCylinder(`colPlat${i}`, { diameter: 3.2, height: 0.25, tessellation: 16 }, this.scene);
      plat.position.set(x, 0.12, z);
      plat.material = platMat;

      // Body — slightly emissive so it reads against dark bg
      const bodyMat = new StandardMaterial(`colBodyMat${i}`, this.scene);
      bodyMat.diffuseColor = new Color3(0.12, 0.15, 0.22);
      bodyMat.emissiveColor = color.scale(0.08);
      bodyMat.specularColor = new Color3(0.5, 0.6, 0.8);
      bodyMat.specularPower = 24;
      const body = MeshBuilder.CreateCylinder(`colBody${i}`, { diameter: 1.4, height: colH, tessellation: 14 }, this.scene);
      body.position.set(x, colH / 2, z);
      body.material = bodyMat;

      // Bright glowing core
      const coreMat = new StandardMaterial(`colCoreMat${i}`, this.scene);
      coreMat.emissiveColor = color;
      coreMat.disableLighting = true;
      const core = MeshBuilder.CreateCylinder(`colCore${i}`, { diameter: 0.45, height: colH + 0.2, tessellation: 8 }, this.scene);
      core.position.set(x, colH / 2, z);
      core.material = coreMat;

      // Base orb sitting on platform
      const orbMat = new StandardMaterial(`colOrbMat${i}`, this.scene);
      orbMat.emissiveColor = color;
      orbMat.disableLighting = true;
      const baseOrb = MeshBuilder.CreateSphere(`colBase${i}`, { diameter: 1.8, segments: 10 }, this.scene);
      baseOrb.position.set(x, 1.2, z);
      baseOrb.material = orbMat;

      // Top orb
      const topOrb = MeshBuilder.CreateSphere(`colTop${i}`, { diameter: 2.4, segments: 10 }, this.scene);
      topOrb.position.set(x, colH + 0.8, z);
      topOrb.material = orbMat;

      // Double helix — two ribbons offset by PI
      for (let r = 0; r < 2; r++) {
        const ribbon = MeshBuilder.CreateRibbon(`colRibbon${i}_${r}`, {
          pathArray: this.buildColumnPaths(x, z, colH, r * Math.PI),
          updatable: true,
          sideOrientation: Mesh.DOUBLESIDE,
        }, this.scene);
        const ribMat = new StandardMaterial(`colRibMat${i}_${r}`, this.scene);
        ribMat.emissiveColor = color;
        ribMat.disableLighting = true;
        ribMat.alpha = 0.9;
        ribMat.backFaceCulling = false;
        ribbon.material = ribMat;
        this._columnRibbons.push(ribbon);
      }
    }
  }

  private buildColumnPaths(x: number, z: number, h: number, time: number): Vector3[][] {
    const segments = 40;
    const helixR = 0.65;  // inside the column body (body radius = 0.8)
    const halfW = 0.32;
    const yStart = 1.8;   // start above the base orb
    const yEnd = h - 0.8; // stop below the top orb
    const path0: Vector3[] = [];
    const path1: Vector3[] = [];
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const y = yStart + t * (yEnd - yStart);
      const angle = t * Math.PI * 8 + time;
      const cx = x + Math.cos(angle) * helixR;
      const cz = z + Math.sin(angle) * helixR;
      const tx = -Math.sin(angle);
      const tz =  Math.cos(angle);
      path0.push(new Vector3(cx + tx * halfW, y, cz + tz * halfW));
      path1.push(new Vector3(cx - tx * halfW, y, cz - tz * halfW));
    }
    return [path0, path1];
  }

  private buildStars(): void {
    const size = 1024;
    const tex = new DynamicTexture('starTex', { width: size, height: size }, this.scene, false);
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    ctx.fillStyle = '#01010a';
    ctx.fillRect(0, 0, size, size);
    this.drawNebulae(ctx, size);
    this.drawDimStars(ctx, size);
    this.drawGlowStars(ctx, size);
    this.drawBrightStars(ctx, size);
    tex.update();
    const layer = new Layer('starLayer', null, this.scene, true);
    layer.texture = tex;
  }

  private drawNebulae(ctx: CanvasRenderingContext2D, size: number): void {
    for (let n = 0; n < 4; n++) {
      const nx = Math.random() * size;
      const ny = Math.random() * size;
      const nr = 120 + Math.random() * 140;
      const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr);
      const nb = Math.floor(15 + Math.random() * 25);
      grad.addColorStop(0, `rgba(${Math.floor(nb*0.4)},${Math.floor(nb*0.5)},${nb},0.35)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    }
  }

  private drawDimStars(ctx: CanvasRenderingContext2D, size: number): void {
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const b = Math.floor((0.2 + Math.random() * 0.35) * 255);
      ctx.fillStyle = `rgb(${b},${b},${b})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.4 + Math.random() * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawGlowStars(ctx: CanvasRenderingContext2D, size: number): void {
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const bv = 0.55 + Math.random() * 0.45;
      const tint = Math.random();
      const cr = tint < 0.2 ? bv * 0.65 : bv;
      const cb = tint < 0.35 ? bv * 0.8 : bv;
      const r = Math.floor(cr * 255), g = Math.floor(bv * 0.95 * 255), b = Math.floor(cb * 255);
      const glowR = 4 + Math.random() * 4;
      const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, glowR);
      glowGrad.addColorStop(0, `rgba(${r},${g},${b},0.7)`);
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(x - glowR, y - glowR, glowR * 2, glowR * 2);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.9 + Math.random() * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawBrightStars(ctx: CanvasRenderingContext2D, size: number): void {
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const bv = 210 + Math.floor(Math.random() * 45);
      const flareLen = 18 + Math.random() * 22;
      for (let d = 0; d < 4; d++) {
        const angle = d * Math.PI / 2;
        const lineGrad = ctx.createLinearGradient(x, y, x + Math.cos(angle) * flareLen, y + Math.sin(angle) * flareLen);
        lineGrad.addColorStop(0, `rgba(${bv},${bv},${bv},0.9)`);
        lineGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * flareLen, y + Math.sin(angle) * flareLen);
        ctx.stroke();
      }
      const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, 9);
      coreGrad.addColorStop(0, `rgba(${bv},${bv},${bv},1)`);
      coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreGrad;
      ctx.fillRect(x - 9, y - 9, 18, 18);
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
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

  private buildPlatformEdge(): void {
    const half = ARENA_HALF * ARENA_SCALE;
    const wallH = 3.0;
    const wallD = 0.2;
    const rimH = 0.1;

    const wallMat = new StandardMaterial('platWallMat', this.scene);
    wallMat.diffuseColor = new Color3(0.05, 0.07, 0.14);
    wallMat.emissiveColor = new Color3(0.02, 0.03, 0.07);
    wallMat.specularColor = new Color3(0.3, 0.4, 0.6);
    wallMat.specularPower = 28;

    const rimMat = new StandardMaterial('platRimMat', this.scene);
    rimMat.emissiveColor = new Color3(0.05, 0.3, 0.9);
    rimMat.disableLighting = true;

    const span = half * 2 + wallD * 2;
    const defs = [
      { w: span,   d: wallD, x: 0,     z: -half },
      { w: span,   d: wallD, x: 0,     z:  half },
      { w: wallD,  d: span,  x: -half, z: 0 },
      { w: wallD,  d: span,  x:  half, z: 0 },
    ];

    for (let i = 0; i < defs.length; i++) {
      const def = defs[i];
      const wall = MeshBuilder.CreateBox(`platWall${i}`, {
        width: def.w, height: wallH, depth: def.d,
      }, this.scene);
      wall.position.set(def.x, -wallH / 2, def.z);
      wall.material = wallMat;

      const rim = MeshBuilder.CreateBox(`platRim${i}`, {
        width: def.w, height: rimH, depth: def.d + 0.02,
      }, this.scene);
      rim.position.set(def.x, rimH / 2, def.z);
      rim.material = rimMat;
    }
  }

  private buildFloorArrows(): void {
    const c = CORNER_POS;
    const mat = new StandardMaterial('arrowMat', this.scene);
    mat.emissiveColor = new Color3(0.08, 0.4, 1.0);
    mat.disableLighting = true;

    // Each corner: direction toward center, two >> chevrons spaced along that diagonal
    const corners = [
      { x: -c, z: -c, rotY:  Math.PI / 4 },
      { x:  c, z: -c, rotY: -Math.PI / 4 },
      { x: -c, z:  c, rotY:  3 * Math.PI / 4 },
      { x:  c, z:  c, rotY: -3 * Math.PI / 4 },
    ];

    const th = 0.06;
    const wingLen = 1.8;  // length of each wing arm
    const wingW = 0.22;
    // distances from corner center to the tip of each chevron (> and >)
    // CORNER_VISUAL_R=2 means bumper extends ~2 units — start past that
    const chevronDists = [5.5, 7.5];

    for (let i = 0; i < corners.length; i++) {
      const { x, z, rotY } = corners[i];
      const dx = Math.sin(rotY);
      const dz = Math.cos(rotY);

      for (let ci = 0; ci < chevronDists.length; ci++) {
        // tip of chevron (the pointy end, facing center)
        const tipX = x + dx * chevronDists[ci];
        const tipZ = z + dz * chevronDists[ci];

        // each wing angled 135° from forward (i.e. 45° from backward)
        for (const sign of [-1, 1]) {
          const wingRotY = rotY + sign * (3 * Math.PI / 4);
          // center of wing box = tip + half-length in wing direction
          const wcx = tipX + Math.sin(wingRotY) * (wingLen / 2);
          const wcz = tipZ + Math.cos(wingRotY) * (wingLen / 2);
          const wing = MeshBuilder.CreateBox(`chev${i}_${ci}_${sign > 0 ? 1 : 0}`, {
            width: wingW, height: th, depth: wingLen,
          }, this.scene);
          wing.position.set(wcx, th / 2, wcz);
          wing.rotation.y = wingRotY;
          wing.material = mat;
        }
      }
    }
  }

  private buildCorners(): void {
    const c = CORNER_POS;
    const r = CORNER_VISUAL_R;

    const positions = [
      { x: -c, z: -c }, { x: c, z: -c },
      { x: -c, z:  c }, { x: c, z:  c },
    ];

    const bodyMat = new PBRMaterial('cBodyMat', this.scene);
    bodyMat.albedoColor = new Color3(0.08, 0.1, 0.18);
    bodyMat.roughness = 0.2;
    bodyMat.metallic = 0.98;

    const body2Mat = new PBRMaterial('cBody2Mat', this.scene);
    body2Mat.albedoColor = new Color3(0.06, 0.08, 0.14);
    body2Mat.roughness = 0.2;
    body2Mat.metallic = 0.98;

    const bandMat = new StandardMaterial('cBandMat', this.scene);
    bandMat.emissiveColor = new Color3(0.05, 0.4, 1.0);
    bandMat.disableLighting = true;

    const band2Mat = new StandardMaterial('cBand2Mat', this.scene);
    band2Mat.emissiveColor = new Color3(0.3, 0.8, 1.0);
    band2Mat.disableLighting = true;

    const coreMat = new StandardMaterial('cCoreMat', this.scene);
    coreMat.emissiveColor = new Color3(0.2, 0.8, 1.0);
    coreMat.disableLighting = true;

    const spinMat = new PBRMaterial('cSpinMat', this.scene);
    spinMat.albedoColor = new Color3(0.4, 0.5, 0.7);
    spinMat.roughness = 0.1;
    spinMat.metallic = 1.0;
    spinMat.emissiveColor = new Color3(0.05, 0.15, 0.4);

    const baseMat = new StandardMaterial('cBaseMat', this.scene);
    baseMat.emissiveColor = new Color3(0.02, 0.15, 0.5);
    baseMat.disableLighting = true;

    for (let i = 0; i < positions.length; i++) {
      const { x, z } = positions[i];

      // Glowing base disc
      const base = MeshBuilder.CreateCylinder(`cBase${i}`, {
        diameter: r * 2 + 1.2, height: 0.12, tessellation: 24,
      }, this.scene);
      base.position.set(x, 0.06, z);
      base.material = baseMat;

      // Lower wide body section
      const lower = MeshBuilder.CreateCylinder(`cLower${i}`, {
        diameter: r * 2, diameterTop: r * 1.6, height: 1.0, tessellation: 24,
      }, this.scene);
      lower.position.set(x, 0.5, z);
      lower.material = bodyMat;

      // Lower glowing band
      const band1 = MeshBuilder.CreateCylinder(`cBand1_${i}`, {
        diameter: r * 1.62, height: 0.16, tessellation: 24,
      }, this.scene);
      band1.position.set(x, 1.0, z);
      band1.material = bandMat;

      // Upper narrow body section
      const upper = MeshBuilder.CreateCylinder(`cUpper${i}`, {
        diameter: r * 1.6, diameterTop: r * 0.9, height: 0.9, tessellation: 24,
      }, this.scene);
      upper.position.set(x, 1.5, z);
      upper.material = body2Mat;

      // Upper glowing band
      const band2 = MeshBuilder.CreateCylinder(`cBand2_${i}`, {
        diameter: r * 0.92, height: 0.14, tessellation: 24,
      }, this.scene);
      band2.position.set(x, 1.95, z);
      band2.material = band2Mat;

      // Narrow top cap
      const cap = MeshBuilder.CreateCylinder(`cCap${i}`, {
        diameter: r * 0.9, height: 0.3, tessellation: 24,
      }, this.scene);
      cap.position.set(x, 2.25, z);
      cap.material = bodyMat;

      // Spinning torus ring — stored for animation
      const spinRing = MeshBuilder.CreateTorus(`cSpin${i}`, {
        diameter: r * 1.9, thickness: 0.14, tessellation: 32,
      }, this.scene);
      spinRing.position.set(x, 0.9, z);
      spinRing.material = spinMat;
      this._cornerRings.push(spinRing);

      // Plasma orb on top
      const orb = MeshBuilder.CreateSphere(`cOrb${i}`, { diameter: 1.0, segments: 12 }, this.scene);
      orb.position.set(x, 2.6, z);
      orb.material = coreMat;
    }
  }

  private updateCorners(): void {
    this._cornerTime += 0.025;
    for (let i = 0; i < this._cornerRings.length; i++) {
      this._cornerRings[i].rotation.y = this._cornerTime * (i % 2 === 0 ? 1 : -1);
      this._cornerRings[i].rotation.x = Math.sin(this._cornerTime * 0.7 + i) * 0.3;
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

  private buildBarriers(): void {
    const w = (CORNER_POS - CORNER_VISUAL_R) * 2;
    const h = 2.2;
    const defs = [
      { x: 0,           z: -CORNER_POS, rotY: 0 },
      { x: 0,           z:  CORNER_POS, rotY: 0 },
      { x: -CORNER_POS, z: 0,           rotY: Math.PI / 2 },
      { x:  CORNER_POS, z: 0,           rotY: Math.PI / 2 },
    ];
    for (let i = 0; i < 4; i++) {
      const side = SIDES[i];
      const mat = new StandardMaterial(`barrierMat_${side}`, this.scene);
      mat.emissiveColor = PLAYER_COLORS[side].scale(3);
      mat.disableLighting = true;
      mat.alpha = 0;
      mat.backFaceCulling = false;
      this._barrierMats.push(mat);

      const ribbon = MeshBuilder.CreateRibbon(`barrier_${side}`, {
        pathArray: this.buildWavePaths(w, h, 0),
        updatable: true,
        sideOrientation: Mesh.DOUBLESIDE,
      }, this.scene);
      ribbon.position.set(defs[i].x, 0, defs[i].z);
      ribbon.rotation.y = defs[i].rotY;
      ribbon.material = mat;
      ribbon.isVisible = false;
      this._barrierRibbons.push(ribbon);
    }
  }

  private buildWavePaths(w: number, h: number, time: number): Vector3[][] {
    const cols = 48;
    const rows = 10;
    const amp = 0.28;
    const paths: Vector3[][] = [];
    for (let r = 0; r <= rows; r++) {
      const y = (r / rows) * h;
      const rowAmp = amp * Math.sin((r / rows) * Math.PI);
      const path: Vector3[] = [];
      for (let c = 0; c <= cols; c++) {
        const x = (c / cols - 0.5) * w;
        const z = rowAmp * Math.sin((c / cols) * Math.PI * 5 + time);
        path.push(new Vector3(x, y, z));
      }
      paths.push(path);
    }
    return paths;
  }

  private setupGUI(): void {
    this._guiTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');

    const alignments: { hAlign: number; vAlign: number; left: string; top: string }[] = [
      { hAlign: Control.HORIZONTAL_ALIGNMENT_CENTER, vAlign: Control.VERTICAL_ALIGNMENT_BOTTOM, left: '0px',  top: '-8px' },
      { hAlign: Control.HORIZONTAL_ALIGNMENT_CENTER, vAlign: Control.VERTICAL_ALIGNMENT_TOP,    left: '0px',  top: '8px'  },
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
    this.updateBarriers(state);
    this.updateColumns();
    this.updateCorners();
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

  private updateColumns(): void {
    this._columnTime += 0.04;
    const off = CORNER_POS + 2;
    const colPositions = [
      { x: -off, z: -off }, { x: off, z: -off },
      { x: -off, z:  off }, { x: off, z:  off },
    ];
    for (let i = 0; i < colPositions.length; i++) {
      const { x, z } = colPositions[i];
      const phaseOffset = i * Math.PI / 3;
      for (let r = 0; r < 2; r++) {
        MeshBuilder.CreateRibbon(`colRibbon${i}_${r}`, {
          pathArray: this.buildColumnPaths(x, z, 16, this._columnTime + phaseOffset + r * Math.PI),
          instance: this._columnRibbons[i * 2 + r],
        });
      }
    }
  }

  private updateBarriers(state: CrashballState): void {
    this._barrierTime += 0.06;
    const w = (CORNER_POS - CORNER_VISUAL_R) * 2;
    const h = 2.2;
    for (let i = 0; i < SIDES.length; i++) {
      const isEliminated = state.players[i].eliminated;
      const ribbon = this._barrierRibbons[i];
      const mat = this._barrierMats[i];
      ribbon.isVisible = isEliminated;
      if (!isEliminated) continue;
      mat.alpha = 0.4 + Math.sin(this._barrierTime * 4 + i) * 0.2;
      MeshBuilder.CreateRibbon(`barrier_${SIDES[i]}`, {
        pathArray: this.buildWavePaths(w, h, this._barrierTime + i * Math.PI / 2),
        instance: ribbon,
      });
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
