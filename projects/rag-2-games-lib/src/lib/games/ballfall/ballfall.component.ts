import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Ballfall, BallfallState } from './models/ballfall.class';
import { Base3DGameWindowComponent } from '../../engine-3d/base-3d-game.component';
import { Base3DRenderer } from '../../engine-3d/base-3d.renderer';
import { BallfallRenderer } from './models/ballfall.renderer';

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

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Ballfall;
  }

  protected override createRenderer(canvas: HTMLCanvasElement): Base3DRenderer {
    const renderer = new BallfallRenderer(canvas);
    this.renderer3D = renderer;
    return renderer;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
  }

  public override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  public override restart(): void {
    this.game.state = new BallfallState();
  }

  protected override update(): void {
    super.update();
    if (!this.renderer3D || this.isPaused || this.game.state.isGameOver) {
      return;
    }

    this.handleInput();
    this.updatePhysics();
    this.renderer3D.render(this.game.state);
  }

  private handleInput(): void {
    const state = this.game.state;
    const player = this.game.players[0];

    if (player) {
      const move = (player.inputData['move'] as number) || 0;
      state.cylinderRotY += move * state.rotationSpeed;
    }
  }

  private updatePhysics(): void {
    const state = this.game.state;

    state.ballVY -= state.gravity;
    state.ballY += state.ballVY;

    const ballRadius = 0.4;
    const totalLevels = 8;
    const distanceBetweenLevels = 4;
    const firstLevelY = 12;

    for (let i = 0; i < totalLevels; i++) {
      const levelY = firstLevelY - i * distanceBetweenLevels;
      const distanceToLevel = state.ballY - levelY;

      if (
        distanceToLevel <= ballRadius &&
        distanceToLevel >= 0 &&
        state.ballVY < 0
      ) {
        state.ballY = levelY + ballRadius;
        state.ballVY = state.bounceForce;

        break;
      }
    }

    if (state.ballY < -20) {
      this.restart();
    }
  }
}
