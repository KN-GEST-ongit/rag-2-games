/* eslint-disable max-lines */
/* eslint-disable complexity */
import { Component, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { Base3DGameWindowComponent } from '../../engine-3d/base-3d-game.component';
import { Base3DRenderer } from '../../engine-3d/base-3d.renderer';
import { Crashball, CrashballState } from './models/crashball.class';
import { CrashballRenderer } from './models/crashball.renderer';
import {
  BALL_RADIUS,
  BARRIER_SPEED_MULT,
  BASE_BALL_SPEED,
  CORNER_R,
  CORNER_POS,
  CORNER_SPEED_VARY,
  MAX_BALL_SPEED,
  SIDES,
  SPAWN_INTERVAL_MIN,
  SPAWN_INTERVAL_START,
  SPEED_INCREMENT,
  SUPER_CHARGE_TIME,
  SUPER_RADIUS,
  SUPER_SPEED_MULT,
  VEHICLE_HALF_W,
  VEHICLE_RANGE,
} from './models/crashball.interfaces';
import {
  getCornerCenter,
  getVehicleWorldPos,
  resolveBallCollision,
  resolveCornerCollision,
  resolveVehicleCollision,
  resolveWallCollision,
  spawnBallAtCorner,
} from './models/crashball.physics';

const PLAYER_SPEED = 2.5;
const SPEED_INTERVAL = 30;
const HP_PER_GOAL = 1;

@Component({
  selector: 'app-crashball',
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
export class CrashballGameWindowComponent
  extends Base3DGameWindowComponent
  implements OnInit
{
  public override game!: Crashball;
  protected override renderer3D?: CrashballRenderer;

  private readonly _dt = 1 / 60;

  public override ngOnInit(): void {
    this.game = new Crashball();
    super.ngOnInit();
  }

  protected override createRenderer(canvas: HTMLCanvasElement): Base3DRenderer {
    const renderer = new CrashballRenderer(canvas);
    this.renderer3D = renderer;
    return renderer;
  }

  public override restart(): void {
    this.renderer3D?.clear();
    this.game = new Crashball();
  }

  protected override update(): void {
    super.update();
    if (!this.renderer3D || this.isPaused) return;
    this.handleInput();
    this.updateGameLogic();
    this.renderer3D.render(this.game.state);
  }

  private handleInput(): void {
    const state = this.game.state;
    if (state.isGameOver) return;

    this.game.players.forEach((player, i) => {
      if (!player.isActive) return;
      const cp = state.players[i];
      if (cp.eliminated) return;

      const move = player.inputData['move'] as number;
      cp.velocity = move === 1 ? -PLAYER_SPEED : move === 2 ? PLAYER_SPEED : 0;

      if (
        (player.inputData['super'] as number) === 1 &&
        cp.superCharge >= 1.0 &&
        !cp.superActive
      ) {
        cp.superActive = true;
        cp.superWaveRadius = 0;
        cp.superCharge = 0;
        player.inputData['super'] = 0;
      }
    });
  }

  private updateGameLogic(): void {
    const state = this.game.state;
    if (state.isGameOver) return;

    const dt = this._dt;
    this.updatePlayers(state, dt);
    this.updateSpawner(state, dt);
    this.updateBalls(state, dt);
    this.checkGameOver(state);
  }

  private updatePlayers(state: CrashballState, dt: number): void {
    for (const cp of state.players) {
      if (cp.eliminated) continue;
      const maxPos = (CORNER_POS - CORNER_R - VEHICLE_HALF_W) / VEHICLE_RANGE;
      cp.position = Math.max(-maxPos, Math.min(maxPos, cp.position + cp.velocity * dt));
      if (cp.superCharge < 1.0) {
        cp.superCharge = Math.min(1.0, cp.superCharge + dt / SUPER_CHARGE_TIME);
      }
      if (cp.superActive) {
        cp.superWaveRadius += dt * 10;
        if (cp.superWaveRadius >= SUPER_RADIUS) {
          cp.superActive = false;
          cp.superWaveRadius = 0;
        }
      }
    }

    state.speedTimer += dt;
    if (state.speedTimer >= SPEED_INTERVAL && state.ballSpeed < MAX_BALL_SPEED) {
      state.ballSpeed = Math.min(MAX_BALL_SPEED, state.ballSpeed + SPEED_INCREMENT);
      state.speedTimer = 0;
    }
  }

  private updateSpawner(state: CrashballState, dt: number): void {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      const corner = Math.floor(Math.random() * 4);
      const spawn = spawnBallAtCorner(corner, state.ballSpeed);
      state.balls.push({ id: state.nextBallId++, ...spawn, radius: BALL_RADIUS, speed: state.ballSpeed });
      const baseInterval = Math.max(
        SPAWN_INTERVAL_MIN,
        SPAWN_INTERVAL_START - (state.ballSpeed - BASE_BALL_SPEED) * 0.5
      );
      const countBonus = Math.max(0, state.balls.length - 3);
      state.spawnTimer = Math.max(SPAWN_INTERVAL_MIN, baseInterval * Math.pow(0.82, countBonus));
    }
  }

  private updateBalls(state: CrashballState, dt: number): void {
    for (const ball of state.balls) {
      ball.x += ball.vx * dt;
      ball.z += ball.vz * dt;
    }

    this.applySupers(state);

    for (const ball of state.balls) {
      for (let ci = 0; ci < 4; ci++) {
        if (resolveCornerCollision(ball, getCornerCenter(ci), ball.speed)) {
          const vary = 1 + (Math.random() - 0.5) * CORNER_SPEED_VARY;
          ball.speed = Math.min(MAX_BALL_SPEED * 1.5, ball.speed * vary);
        }
      }
    }

    // Vehicle collision before wall — prevents ball tunnelling through paddle to wall
    for (const ball of state.balls) {
      for (const cp of state.players) {
        if (cp.eliminated) continue;
        const vp = getVehicleWorldPos(cp.side, cp.position);
        resolveVehicleCollision(
          ball,
          { ...vp, side: cp.side, velocity: cp.velocity },
          ball.speed
        );
      }
    }

    for (let i = 0; i < state.balls.length; i++) {
      for (let j = i + 1; j < state.balls.length; j++) {
        const a = state.balls[i];
        const b = state.balls[j];
        resolveBallCollision(a, b, Math.max(a.speed, b.speed));
      }
    }

    const toRemove = new Set<number>();
    for (const ball of state.balls) {
      for (let si = 0; si < SIDES.length; si++) {
        const side = SIDES[si];
        const cp = state.players[si];
        const result = resolveWallCollision(ball, side, cp.eliminated, ball.speed);
        if (result === 'goal') {
          cp.hp = Math.max(0, cp.hp - HP_PER_GOAL);
          if (cp.hp === 0) cp.eliminated = true;
          toRemove.add(ball.id);
        } else if (result === 'bounce') {
          ball.speed = Math.min(MAX_BALL_SPEED * 1.5, ball.speed * BARRIER_SPEED_MULT);
        }
      }
    }
    state.balls = state.balls.filter(b => !toRemove.has(b.id));
  }

  private applySupers(state: CrashballState): void {
    for (const cp of state.players) {
      if (!cp.superActive) continue;
      const origin = getVehicleWorldPos(cp.side, cp.position);
      for (const ball of state.balls) {
        const dx = ball.x - origin.x;
        const dz = ball.z - origin.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0 && dist <= cp.superWaveRadius) {
          ball.vx = (dx / dist) * ball.speed * SUPER_SPEED_MULT;
          ball.vz = (dz / dist) * ball.speed * SUPER_SPEED_MULT;
        }
      }
    }
  }

  private checkGameOver(state: CrashballState): void {
    const alive = state.players.filter(p => !p.eliminated);
    if (alive.length <= 1) {
      state.isGameOver = true;
      state.winner = alive.length === 1 ? alive[0].side : null;
    }
  }
}
