/* eslint-disable max-lines */
/* eslint-disable max-depth */
/* eslint-disable complexity */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from 'app/game/components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { HappyJump, HappyJumpState } from './models/happyjump.class';

@Component({
  selector: 'app-happyjump',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    <div>
      score: <b>{{ game.state.score }}</b
      >, difficulty: <b>{{ game.state.difficulty }}</b
      >, jumpPower: <b>{{ game.state.jumpPowerY }}</b
      >, gravity: <b>{{ game.state.gravity }}</b
      >, platformSpeed: <b>{{ game.state.platformSpeed }}</b
      >, movingPlatforms:
      <b>{{ game.state.movingPlatforms }}</b>
    </div>
    <app-canvas [displayMode]="'vertical'" class="bg-zinc-300" #gameCanvas>
    </app-canvas>
    <b>FPS: {{ fps }}</b>
  `,
})
export class HappyJumpGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private _playerWidth = 30;
  private _playerHeight = 30;
  private _playerXMove = 5;
  private _platformHeight = 10;
  private _platformWidth = 100;
  private _minPlatformGap = 120;
  private _visitedPlatforms: boolean[] = new Array(5).fill(false);

  public override game!: HappyJump;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as HappyJump;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.resetGame();
    this.render();
  }

  public override restart(): void {
    const tempFailCounter = this.game.state.failCounter;
    this.game.state = new HappyJumpState();
    this.game.state.failCounter = tempFailCounter;

    this.game.state.isGameStarted = false;
    this.resetGame();
  }

  protected override update(): void {
    super.update();

    this.updatePlayerSpeed();
    if (!this.isPaused && this.game.state.isGameStarted) {
      this.updatePlayerPosition();
      this.updatePlatforms();
      this.checkCollisions();
    }

    this.render();
  }

  private resetGame(): void {
    this.game.state.playerX = this._canvas.width / 2 - this._playerWidth / 2;
    this.game.state.playerY = 570;
    this.game.state.playerSpeedY = 0;

    this.game.state.platforms.forEach((platform, index) => {
      platform.y = index * this._minPlatformGap;
      platform.x = this.random(50, this._canvas.width - this._platformWidth);
    });

    this.game.state.score = 0;
    this.game.state.difficulty = 1;
    this._visitedPlatforms = Array(4).fill(false);
  }

  private updatePlayerSpeed(): void {
    if (
      !this.game.state.isGameStarted &&
      this.game.players[0].inputData['jump'] === 1
    ) {
      this.game.state.isGameStarted = true;
      this.game.state.playerSpeedY = -this.game.state.jumpPowerY;
    }

    if (this.game.players[0].inputData['move'] === -1) {
      this.game.state.playerSpeedX = -this._playerXMove;
    }
    if (this.game.players[0].inputData['move'] === 1) {
      this.game.state.playerSpeedX = this._playerXMove;
    }
    if (this.game.players[0].inputData['move'] === 0) {
      this.game.state.playerSpeedX = 0;
    }
  }

  private updatePlayerPosition(): void {
    this.game.state.playerX += this.game.state.playerSpeedX;

    this.game.state.playerSpeedY += this.game.state.gravity;
    this.game.state.playerY += this.game.state.playerSpeedY;

    if (this.game.state.playerY > this._canvas.height) {
      this.game.state.failCounter++;
      this.restart();
    }

    this.game.state.playerX = Math.max(
      0,
      Math.min(this._canvas.width - this._playerWidth, this.game.state.playerX)
    );
  }

  private updatePlatforms(): void {
    this.game.state.platforms.forEach((platform, index) => {
      platform.y += this.game.state.platformSpeed;

      if (
        this.game.state.score >= 60 &&
        index < this.game.state.movingPlatforms
      ) {
        if (platform.directionX === 0) platform.directionX = 1;

        platform.x += platform.directionX * 2;

        if (platform.x <= 0) {
          platform.x = 0;
          platform.directionX = 1;
        } else if (platform.x >= this._canvas.width - this._platformWidth) {
          platform.x = this._canvas.width - this._platformWidth;
          platform.directionX = -1;
        }
      }

      if (platform.y > this._canvas.height) {
        platform.y = -this._platformHeight;
        platform.x = this.random(50, this._canvas.width - this._platformWidth);
        this._visitedPlatforms[index] = false;
      }
    });
  }

  private checkCollisions(): void {
    const playerBottom = this.game.state.playerY + this._playerHeight;
    const playerLeft = this.game.state.playerX;
    const playerRight = this.game.state.playerX + this._playerWidth;

    let isOnPlatform = false;

    for (const [index, platform] of this.game.state.platforms.entries()) {
      const platformTop = platform.y;
      const platformBottom = platform.y + this._platformHeight;
      const platformLeft = platform.x;
      const platformRight = platform.x + this._platformWidth;

      if (
        playerBottom >= platformTop &&
        playerBottom <= platformBottom + 5 &&
        playerRight > platformLeft &&
        playerLeft < platformRight &&
        this.game.state.playerSpeedY >= 0
      ) {
        this.game.state.playerSpeedY = 0;
        this.game.state.playerY = platformTop - this._playerHeight;

        isOnPlatform = true;

        if (!this._visitedPlatforms[index]) {
          this.game.state.score++;
          this._visitedPlatforms[index] = true;
          this.increaseDifficulty();
        }

        break;
      }
    }

    if (isOnPlatform && this.game.players[0].inputData['jump'] === 0) {
      this.game.state.playerSpeedY = this.game.state.platformSpeed;
    }

    if (isOnPlatform && this.game.players[0].inputData['jump'] === 1) {
      this.game.state.playerSpeedY = -this.game.state.jumpPowerY;
    }
  }

  private increaseDifficulty(): void {
    if (this.game.state.score > 0 && this.game.state.score % 10 === 0) {
      if (this.game.state.score <= 200) {
        this.game.state.difficulty++;
      }

      this.game.state.gravity = Math.min(
        1,
        this.round(this.game.state.gravity + 0.05, 2)
      );

      if (this.game.state.score < 100) {
        this.game.state.platformSpeed = Math.min(
          4,
          this.round(this.game.state.platformSpeed + 0.4, 2)
        );
      } else {
        this.game.state.platformSpeed = Math.min(
          6,
          this.round(this.game.state.platformSpeed + 0.4, 2)
        );
      }

      if (this.game.state.score > 30) {
        this.game.state.jumpPowerY = Math.min(
          15,
          this.round(this.game.state.jumpPowerY + 0.5, 2)
        );
      }

      if (this.game.state.score < 60) this.game.state.movingPlatforms = 0;
      if (this.game.state.score >= 60) this.game.state.movingPlatforms = 1;
      if (this.game.state.score >= 90) this.game.state.movingPlatforms = 2;
      if (this.game.state.score >= 120) this.game.state.movingPlatforms = 3;
      if (this.game.state.score >= 150) this.game.state.movingPlatforms = 4;
      if (this.game.state.score >= 200) this.game.state.movingPlatforms = 5;
    }
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

      context.fillStyle = 'blue';
      this.game.state.platforms.forEach(platform => {
        context.fillRect(
          platform.x,
          platform.y,
          this._platformWidth,
          this._platformHeight
        );
      });
    }
  }

  private random(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  private round(value: number, decimals = 2): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}
