import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Snake, SnakeState } from './models/snake.class';

@Component({
  selector: 'app-snake',
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
export class SnakeGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private _playerWidth = 30;
  private _playerHeight = 30;
  private _playerXMove = 2;
  private _playerYMove = 2;
  private _foodWidth = 10;
  private _foodHeight = 10;

  public override game!: Snake;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Snake;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.resetGame();
    this.render();
  }

  public override restart(): void {
    this.game.state = new SnakeState();

    this.game.state.isGameStarted = false;
    this.resetGame();
  }

  protected override update(): void {
    super.update();

    this.gameStart();
    this.updatePlayerSpeed();
    if (!this.isPaused && this.game.state.isGameStarted) {
      this.updatePlayerPosition();
    }

    this.render();
  }

  private resetGame(): void {
    this.game.state.playerX = this._canvas.width / 2 - this._playerWidth / 2;
    this.game.state.playerY = this._canvas.height / 2 - this._playerHeight / 2;
    this.game.state.score = 0;
    this.game.state.isGameStarted = false;
    this.game.state.playerSpeedY = 0;
    this.game.state.playerSpeedX = 0;
  }

  private gameStart(): void {
    if (!this.game.state.isGameStarted && this.game.players[0].inputData['start'] === 1) {
      this.game.state.isGameStarted = true;
    }
  }

  private updatePlayerSpeed(): void {
    if (this.game.players[0].inputData['moveX'] === -1) {
      this.game.state.playerSpeedX = -this._playerXMove;
    }
    if (this.game.players[0].inputData['moveX'] === 1) {
      this.game.state.playerSpeedX = this._playerXMove;
    }
    if (this.game.players[0].inputData['moveX'] === 0) {
      this.game.state.playerSpeedX = 0;
    }
    if (this.game.players[0].inputData['moveY'] === -1) {
      this.game.state.playerSpeedY = -this._playerYMove;
    }
    if (this.game.players[0].inputData['moveY'] === 1) {
      this.game.state.playerSpeedY = this._playerYMove;
    }
    if (this.game.players[0].inputData['moveY'] === 0) {
      this.game.state.playerSpeedY = 0;
    }
  }

  private updatePlayerPosition(): void {
    this.game.state.playerX += this.game.state.playerSpeedX;

    this.game.state.playerY += this.game.state.playerSpeedY;
  }

  private render(): void {
    const context = this._canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, this._canvas.width, this._canvas.height);

      context.fillStyle = 'red';
      context.fillRect(
        this.game.state.playerX,
        this.game.state.playerY,
        this._playerWidth,
        this._playerHeight
      );

      // context.fillStyle = 'green';
      // this.game.state.foodItems.forEach((food) => {
      //   context.fillRect(
      //     food.x,
      //     food.y,
      //     this._foodWidth,
      //     this._foodHeight
      //   );
      // }
      // );
    }
  }

  //
}