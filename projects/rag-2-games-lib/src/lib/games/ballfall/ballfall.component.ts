/* eslint-disable complexity */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Ballfall, BallfallState } from './models/ballfall.class';
import { Base3DGameWindowComponent } from '../../engine-3d/base-3d-game.component';
import { Base3DRenderer } from '../../engine-3d/base-3d.renderer';
import { BallfallRenderer } from './models/ballfall.renderer';

export enum SegmentType {
  Empty = 0,
  Normal = 1,
  Danger = 2,
}

export interface Platform {
  y: number;
  segments: SegmentType[];
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
    <b>FPS: {{ fps }}</b>
  `,
})
export class BallfallGameWindowComponent
  extends Base3DGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public override game!: Ballfall;
  protected override renderer3D?: BallfallRenderer;

  public gravity = 0.015;
  public bounceForce = 0.35;
  public rotationSpeed = 0.08;
  private platforms: Platform[] = [];

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Ballfall;

    if (this.platforms.length === 0) {
      this.generateInitialPlatforms();
    }
  }

  protected override createRenderer(canvas: HTMLCanvasElement): Base3DRenderer {
    const renderer = new BallfallRenderer(canvas);
    this.renderer3D = renderer;
    return renderer;
  }

  public override restart(): void {
    this.game.state = new BallfallState();
    this.platforms = [];
    this.generateInitialPlatforms();
  }

  protected override update(): void {
    super.update();
    if (!this.renderer3D || this.isPaused || this.game.state.isGameOver) {
      return;
    }

    this.handleInput();
    this.updatePhysics();
    this.renderer3D.render(this.game.state, this.platforms);
  }

  private handleInput(): void {
    const state = this.game.state;
    const player = this.game.players[0];

    if (player) {
      const move = (player.inputData['move'] as number) || 0;
      state.cylinderRotY += move * this.rotationSpeed;
    }
  }

  private updatePhysics(): void {
    const state = this.game.state;

    if (state.isGameOver) return;

    state.ballVY -= this.gravity;
    state.ballY += state.ballVY;

    const ballRadius = 0.4;
    const segmentsCount = 12;
    const anglePerSegment = (Math.PI * 2) / segmentsCount;

    if (this.platforms.length > 0) {
      const lowestPlatform = this.platforms[this.platforms.length - 1];
      if (state.ballY < lowestPlatform.y + 12) {
        this.spawnPlatform(lowestPlatform.y - 4);
      }
      if (this.platforms[0].y > state.ballY + 10) {
        this.platforms.shift();
      }
    }

    const nextPlatform = this.platforms.find(p => p.y < state.ballY);
    if (nextPlatform) {
      state.distToNextPlatform = state.ballY - nextPlatform.y;
      state.nextPlatformSegments = [...nextPlatform.segments];
    }

    for (const platform of this.platforms) {
      const distanceToLevel = state.ballY - platform.y;

      if (
        distanceToLevel <= ballRadius &&
        distanceToLevel >= 0 &&
        state.ballVY < 0
      ) {
        let localAngle = (Math.PI / 2 - state.cylinderRotY) % (Math.PI * 2);
        if (localAngle <= 0) localAngle += Math.PI * 2;

        const currentSegmentIndex =
          Math.ceil(localAngle / anglePerSegment) % segmentsCount;
        const segmentUnderBall = platform.segments[currentSegmentIndex];

        if (segmentUnderBall === SegmentType.Empty) {
          continue;
        } else if (segmentUnderBall === SegmentType.Danger) {
          state.isGameOver = true;
          console.log('GAME OVER! Piłka trafiła w czerwoną strefę.');
          this.restart();
          return;
        } else if (segmentUnderBall === SegmentType.Normal) {
          state.ballY = platform.y + ballRadius;
          state.ballVY = this.bounceForce;

          break;
        }
      }
    }

    if (state.ballY < -100) {
      this.restart();
    }
  }

  private spawnPlatform(yLevel: number): void {
    const state = this.game.state;
    const segments: number[] = [];

    for (let i = 0; i < 12; i++) {
      const rand = Math.random();
      if (rand < 0.2) segments.push(0);
      else if (rand < 0.4) segments.push(2);
      else segments.push(1);
    }

    if (!segments.includes(0)) segments[Math.floor(Math.random() * 12)] = 0;

    this.platforms.push({
      y: yLevel,
      segments: segments,
    });
  }

  private generateInitialPlatforms(): void {
    for (let i = 0; i < 6; i++) {
      this.spawnPlatform(12 - i * 4);
    }
  }
}
