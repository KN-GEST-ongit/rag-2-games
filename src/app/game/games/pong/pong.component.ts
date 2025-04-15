/* eslint-disable max-lines */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from 'app/game/components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Pong, PongState } from './models/pong.class';

@Component({
  selector: 'app-pong',
  standalone: true,
  imports: [CanvasComponent],
  template: `<div>{{ game.state.scoreLeft }}:{{ game.state.scoreRight }}</div>
    <app-canvas
      [displayMode]="'horizontal'"
      class="bg-zinc-300"
      #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b> `,
})
export class PongGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private _paddleHeight = 150;
  private _paddleWidth = 10;
  private _paddleJump = 20;
  private _ballWidth = 10;

  private _leftPaddleX = 10;
  private _rightPaddleX!: number;
  private _leftPaddleXHitbox = this._leftPaddleX + this._ballWidth + 10;
  private _rightPaddleXHitbox!: number;

  private isStarted = false;

  private _ballSpeedMultiplierJump = 0.08;

  public override game!: Pong;

  public override ngOnInit(): void {
    super.ngOnInit();

    this.game = this.game as Pong;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    this.resetPaddlesAndBall();
  }

  public override restart(): void {
    this.game.state = new PongState();

    this.isStarted = false;
    this.resetPaddlesAndBall();
  }

  //

  protected override update(): void {
    super.update();
    this.render();
    this.checkStartButton();

    if (
      !this.isStarted &&
      this.game.state.scoreLeft == 0 &&
      this.game.state.scoreRight == 0
    )
      return;

    if (!this.isPaused) {
      this.updatePaddlesSpeeds();
      this.updatePaddlesPositions();
      this.updateBallPosition();
    }
  }

  private render(): void {
    const context = this._canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, this._canvas.width, this._canvas.height);
      context.fillStyle = 'red';
      context.fillRect(
        this._leftPaddleX,
        this.game.state.leftPaddleY,
        this._paddleWidth,
        this._paddleHeight
      );
      context.fillRect(
        this._rightPaddleX,
        this.game.state.rightPaddleY,
        this._paddleWidth,
        this._paddleHeight
      );
      context.beginPath();
      context.arc(
        this.game.state.ballX,
        this.game.state.ballY,
        this._ballWidth,
        0,
        2 * Math.PI
      );
      context.fillStyle = 'blue';
      context.fill();
    }
  }

  private checkStartButton(): void {
    if (
      this.game.players[0].inputData['start'] != 0 ||
      this.game.players[1].inputData['start'] != 0 ||
      this.game.players[0].inputData['move'] != 0 ||
      this.game.players[1].inputData['move'] != 0
    ) {
      this.isStarted = true;
    }
  }

  private resetPaddlesAndBall(): void {
    this.game.state.leftPaddleY =
      (this._canvas.height - this._paddleHeight) / 2;
    this.game.state.rightPaddleY =
      (this._canvas.height - this._paddleHeight) / 2;
    this.game.state.ballX = this._canvas.width / 2;
    this.game.state.ballY = this._canvas.height / 2;
    this.game.state.ballSpeedX = 0;
    this.game.state.ballSpeedY = 0;
    this.game.state.ballSpeedMultiplier = 1;

    this._rightPaddleX = this._canvas.width - this._paddleWidth - 10;
    this._rightPaddleXHitbox = this._rightPaddleX - this._ballWidth;

    this.game.players[0].inputData['start'] = 0;
    this.game.players[1].inputData['start'] = 0;
    this.game.players[0].inputData['move'] = 0;
    this.game.players[1].inputData['move'] = 0;
  }

  private updateBallPosition(): void {
    this.game.state.ballX +=
      this.game.state.ballSpeedX * this.game.state.ballSpeedMultiplier;
    this.game.state.ballY += this.game.state.ballSpeedY;

    if (this.game.state.ballSpeedX === 0 && this.game.state.ballSpeedY === 0) {
      this.initializeBallSpeed();
    }

    if (Math.abs(this.game.state.ballSpeedY) > 12) {
      this.game.state.ballSpeedY = 12;
    }

    this.checkCollisionWithPaddles();
    this.checkCollisionWithWalls();
    this.checkPointScored();
  }

  private checkPointScored(): void {
    if (this.game.state.ballX <= 0 - this._ballWidth) {
      this.resetPaddlesAndBall();
      this.game.state.scoreRight++;
    }
    if (this.game.state.ballX >= this._canvas.width + this._ballWidth) {
      this.resetPaddlesAndBall();
      this.game.state.scoreLeft++;
    }
  }

  private checkCollisionWithWalls(): void {
    if (
      this.game.state.ballY <= 0 + this._ballWidth ||
      this.game.state.ballY >= this._canvas.height - this._ballWidth
    ) {
      if (Math.abs(this.game.state.ballSpeedY) < 2) {
        this.game.state.ballSpeedY = 2;
      }
      this.game.state.ballSpeedY = -this.game.state.ballSpeedY;
    }
  }

  private checkCollisionWithPaddles(): void {
    // left paddle
    if (
      this.game.state.ballX <= this._leftPaddleXHitbox &&
      this.game.state.ballY > this.game.state.leftPaddleY &&
      this.game.state.ballY < this.game.state.leftPaddleY + this._paddleHeight
    ) {
      const rotation = this.game.state.leftPaddleSpeed / 4;
      this.game.state.ballSpeedY += rotation;
      this.game.state.ballSpeedX = -this.game.state.ballSpeedX;
      this.game.state.ballSpeedMultiplier += this._ballSpeedMultiplierJump;
      this.game.state.ballX = this._leftPaddleXHitbox;
    }

    // right paddle
    if (
      this.game.state.ballX >= this._rightPaddleXHitbox &&
      this.game.state.ballY > this.game.state.rightPaddleY &&
      this.game.state.ballY < this.game.state.rightPaddleY + this._paddleHeight
    ) {
      const rotation = this.game.state.rightPaddleSpeed / 4;
      this.game.state.ballSpeedY += rotation;
      this.game.state.ballSpeedX = -this.game.state.ballSpeedX;
      this.game.state.ballSpeedMultiplier += this._ballSpeedMultiplierJump;
      this.game.state.ballX = this._rightPaddleXHitbox;
    }
  }

  private initializeBallSpeed(): void {
    const ballXInitialSpeed = this.random(7, 9);
    const ballYInitialSpeed = this.random(2, 4);

    this.game.state.ballSpeedX =
      this.random(0, 1) === 0 ? ballXInitialSpeed : -ballXInitialSpeed;
    this.game.state.ballSpeedY =
      this.random(0, 1) === 0 ? ballYInitialSpeed : -ballYInitialSpeed;
  }

  private random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  private updatePaddlesSpeeds(): void {
    switch (this.game.players[0].inputData['move']) {
      case 1:
        this.game.state.leftPaddleSpeed = -this._paddleJump;
        break;
      case -1:
        this.game.state.leftPaddleSpeed = this._paddleJump;
        break;
      default:
        this.game.state.leftPaddleSpeed = 0;
        break;
    }
    switch (this.game.players[1].inputData['move']) {
      case 1:
        this.game.state.rightPaddleSpeed = -this._paddleJump;
        break;
      case -1:
        this.game.state.rightPaddleSpeed = this._paddleJump;
        break;
      default:
        this.game.state.rightPaddleSpeed = 0;
        break;
    }
  }

  private updatePaddlesPositions(): void {
    this.game.state.rightPaddleY = Math.max(
      0,
      Math.min(
        this._canvas.height - this._paddleHeight,
        this.game.state.rightPaddleY + this.game.state.rightPaddleSpeed
      )
    );

    this.game.state.leftPaddleY = Math.max(
      0,
      Math.min(
        this._canvas.height - this._paddleHeight,
        this.game.state.leftPaddleY + this.game.state.leftPaddleSpeed
      )
    );
  }
}
