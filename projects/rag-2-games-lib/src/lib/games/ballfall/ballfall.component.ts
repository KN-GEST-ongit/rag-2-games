/* eslint-disable max-lines */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/naming-convention */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { Base3DGameWindowComponent } from '../../engine-3d/base-3d-game.component';
import { Base3DRenderer } from '../../engine-3d/base-3d.renderer';
import { Ballfall, BallfallState } from './models/ballfall.class';
import { BallfallRenderer } from './models/ballfall.renderer';

export interface Obstacle {
  x: number;
  z: number;
}

export interface TrackSegment {
  zStart: number;
  zEnd: number;
  xOffset: number;
  width: number;
  isRamp?: boolean;
  rampAngle?: number;
  rampX?: number;
  obstacles?: Obstacle[];
}

@Component({
  selector: 'app-ballfall',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    <app-canvas
      [displayMode]="'horizontal'"
      [is3DEnabled]="true"
      #gameCanvas></app-canvas>

    <b>Wynik: {{ Math.floor(game.state.score) }} | FPS: {{ fps }}</b>
  `,
})
export class BallfallGameWindowComponent
  extends Base3DGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public override game!: Ballfall;
  protected override renderer3D?: BallfallRenderer;
  public Math = Math;

  public forwardSpeed = 0.2;
  public sideSpeed = 0.15;
  public gravity = 0.02;

  public maxForwardSpeed = 0.8;
  public acceleration = 0.0005;

  private track: TrackSegment[] = [];
  private lastTrackZ = 0;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Ballfall;
    if (this.track.length === 0) this.generateInitialTrack();
  }

  protected override createRenderer(canvas: HTMLCanvasElement): Base3DRenderer {
    const renderer = new BallfallRenderer(canvas);
    this.renderer3D = renderer;
    return renderer;
  }

  public override restart(): void {
    if (this.renderer3D) {
      this.renderer3D.clear();
    }

    this.game.state = new BallfallState();

    this.track = [];
    this.lastTrackZ = 0;

    this.forwardSpeed = 0.2;

    this.generateInitialTrack();
  }

  protected override update(): void {
    super.update();
    if (!this.renderer3D || this.isPaused) return;

    this.handleInput();

    if (!this.game.state.isGameOver) {
      this.updatePhysics();
    }

    this.renderer3D.render(this.game.state, this.track);
  }

  private handleInput(): void {
    const state = this.game.state;
    const player = this.game.players[0];

    if (!player) return;

    if (state.isGameOver) {
      if (player.inputData['action'] === 1) {
        this.restart();
      }
      return;
    }

    const move = (player.inputData['move'] as number) || 0;
    state.ballX += move * this.sideSpeed;
  }

  private updatePhysics(): void {
    const state = this.game.state;

    if (this.forwardSpeed < this.maxForwardSpeed) {
      this.forwardSpeed += this.acceleration;
    }

    state.ballZ += this.forwardSpeed;
    state.score = state.ballZ;

    if (state.ballZ > this.lastTrackZ - 100) {
      this.spawnTrackSegment();
    }

    if (this.track.length > 0 && this.track[0].zEnd < state.ballZ - 20) {
      this.track.shift();
    }

    state.ballVY -= this.gravity;
    state.ballY += state.ballVY;

    for (const segment of this.track) {
      if (segment.obstacles) {
        for (const obs of segment.obstacles) {
          const dist = Math.sqrt(
            Math.pow(state.ballX - (segment.xOffset + obs.x), 2) +
              Math.pow(state.ballZ - obs.z, 2)
          );

          if (dist < 0.95) {
            this.game.state.isGameOver = true;
            return;
          }
        }
      }
    }

    let isOnTrack = false;
    let activeSegment: TrackSegment | null = null;

    for (const segment of this.track) {
      if (state.ballZ >= segment.zStart && state.ballZ <= segment.zEnd) {
        const leftEdge = segment.xOffset - segment.width / 2;
        const rightEdge = segment.xOffset + segment.width / 2;

        if (state.ballX >= leftEdge && state.ballX <= rightEdge) {
          isOnTrack = true;
          activeSegment = segment;
          break;
        }
      }
    }

    if (isOnTrack && activeSegment) {
      let groundLevel = 0.5;

      if (activeSegment.isRamp && activeSegment.rampX !== undefined) {
        const rampLength = 4;
        const rampZStart = activeSegment.zEnd - rampLength;
        const rampZEnd = activeSegment.zEnd;
        const rampWidth = 2.0;

        const absoluteRampX = activeSegment.xOffset + activeSegment.rampX;

        const isHitX =
          Math.abs(state.ballX - absoluteRampX) < rampWidth / 2 + 0.5;

        if (isHitX && state.ballZ >= rampZStart && state.ballZ <= rampZEnd) {
          const distOnRamp = state.ballZ - rampZStart;
          const t = Math.max(0, Math.min(1, distOnRamp / rampLength));

          groundLevel = 0.5 + Math.pow(t, 2) * 2;

          if (distOnRamp > rampLength - this.forwardSpeed - 0.1) {
            state.ballVY = 0.35;
          }
        }
      }

      if (state.ballY < groundLevel) {
        state.ballY = groundLevel;
        if (state.ballVY < 0) {
          state.ballVY = 0;
        }
      }
    }

    if (state.ballY < -5) {
      this.game.state.isGameOver = true;
      return;
    }
  }

  private spawnTrackSegment(): void {
    const segmentLength = 20;
    const isRamp = Math.random() > 0.9;

    const newSegment: TrackSegment = {
      zStart: this.lastTrackZ,
      zEnd: this.lastTrackZ + segmentLength,
      xOffset: (Math.random() - 0.5) * 4,
      width: 6,
      isRamp: isRamp,
      rampX: isRamp ? (Math.random() - 0.5) * 3 : undefined,
      obstacles:
        !isRamp && Math.random() > 0.5
          ? [{ x: (Math.random() - 0.5) * 4, z: this.lastTrackZ + 10 }]
          : [],
    };

    this.track.push(newSegment);

    if (isRamp) {
      this.lastTrackZ += segmentLength + 10;
    } else {
      this.lastTrackZ += segmentLength;
    }
  }

  private generateInitialTrack(): void {
    this.track.push({ zStart: -10, zEnd: 20, xOffset: 0, width: 6 });
    this.lastTrackZ = 20;
    for (let i = 0; i < 5; i++) this.spawnTrackSegment();
  }
}
