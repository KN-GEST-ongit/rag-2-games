import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Spaceinvaders, SpaceinvadersState } from './models/spaceinvaders.class';

@Component({
  selector: 'app-spaceinvaders',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    <div>
      score: <b>{{ game.state.score }}</b>
    </div>
    <app-canvas
      [displayMode]="'horizontal'"
      #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b> `,
})
export class SpaceinvadersGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public override game!: Spaceinvaders;
  private _playerWidth = 40;
  private _playerHeight = 20;
  private _alienSize = 30;
  private _laserWidth = 4;
  private _laserHeight = 15;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Spaceinvaders;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.render();
  }

  public override restart(): void {
    this.game.state = new SpaceinvadersState();
  }

  protected override update(): void {
    super.update();

    this.handleInput();

    this.render();
  }

   private handleInput(): void {
    const input = this.game.players[0].inputData;

    if (input['move'] === -1) this.game.state.playerX -= this.game.state.playerSpeed;
    if (input['move'] === 1) this.game.state.playerX += this.game.state.playerSpeed;

    const canvasWidth = this._canvas.width;
    this.game.state.playerX = Math.max(
      0,
      Math.min(canvasWidth - this._playerWidth, this.game.state.playerX)
    );

    if (input['shoot'] && this.game.state.laserY < 0) {
      this.game.state.laserY = this._canvas.height - this._playerHeight - this._laserHeight;
    }
  }

  private render(): void {
    const context = this._canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, this._canvas.width, this._canvas.height);

      context.fillStyle = 'green';
      context.fillRect(
      this.game.state.playerX,
      this._canvas.height - this._playerHeight,
      this._playerWidth,
      this._playerHeight
      );
    }
  }

}