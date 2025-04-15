/* eslint-disable complexity */
/* eslint-disable max-lines */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from 'app/game/components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { SkiJump, SkiJumpState } from './models/skijump.class';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skijump',
  standalone: true,
  imports: [CanvasComponent, CommonModule],
  template: `<div>
      Distance: <b>{{ game.state.distance | number: '1.0-1' }}</b> m, wind:
      <b>{{ game.state.wind | number: '1.0-1' }} m/s </b> to the
      <b>{{ game.state.windDirection }}</b
      >, style:<b> {{ game.state.stylePoints }} pts</b>, wind:<b>
        {{ game.state.windPoints | number: '1.0-1' }} pts</b
      >, total:<b> {{ game.state.totalPoints | number: '1.0-1' }} pts</b>
    </div>
    <app-canvas
      [displayMode]="'horizontal'"
      class="bg-zinc-300"
      #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b> `,
})
export class SkiJumpGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private _jumperHeight = 10;
  private _jumperRideVelocity = 0;
  private _towerEndX = 250;
  private hasPressedLand = false;
  private _wrongFlightCounter = 0;
  private _localRecord = 0;
  private _windInterval: ReturnType<typeof setTimeout> | undefined;

  private _jumpForce = 1.1;
  private _windImpact = 0.2;
  private _flightDeviationTolerance = Math.PI / 28;

  public override game!: SkiJump;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as SkiJump;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.resetGame();
    this.updateWind();
  }

  public override ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this._windInterval) {
      clearInterval(this._windInterval);
    }
  }

  public override restart(): void {
    this.game.state = new SkiJumpState();
    this.resetGame();
  }

  protected override update(): void {
    super.update();

    if (!this.isPaused) {
      this.updatePhysics();
      this.render();
    }
  }

  //render

  private render(): void {
    const context = this._canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, this._canvas.width, this._canvas.height);

    this.renderSkis(context);
    this.renderBody(context);
    this.renderTowerAndHill(context);
  }

  private renderSkis(context: CanvasRenderingContext2D): void {
    const lineLength = 25;

    context.lineWidth = 3;
    context.strokeStyle = 'red';
    context.beginPath();
    context.moveTo(this.game.state.jumperX, this.game.state.jumperY);
    context.lineTo(
      this.game.state.jumperX +
        lineLength * Math.cos(this.game.state.jumperInclineRad),
      this.game.state.jumperY +
        lineLength * Math.sin(this.game.state.jumperInclineRad)
    );
    context.stroke();
    context.lineWidth = 1;
    context.save();
  }

  private renderBody(context: CanvasRenderingContext2D): void {
    if (this.game.state.isFlying) {
      context.translate(this.game.state.jumperX, this.game.state.jumperY);
      context.rotate(this.game.state.jumperInclineRad + Math.PI / 4);
      context.fillStyle = 'blue';
      context.fillRect(3, -25, 2, 20);
      context.restore();
    } else if (this.game.state.isLanded) {
      context.translate(this.game.state.jumperX, this.game.state.jumperY);
      context.rotate(this.game.state.jumperInclineRad);
      context.fillStyle = 'blue';
      context.fillRect(3, -20, 2, 20);
      context.restore();
    } else {
      context.translate(this.game.state.jumperX, this.game.state.jumperY);
      context.rotate(this.game.state.jumperInclineRad);
      context.fillStyle = 'blue';
      context.font = '20px Arial';
      context.fillText('T', 0, 0);
      context.restore();
    }
  }

  private renderTowerAndHill(context: CanvasRenderingContext2D): void {
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(0, 0);
    for (let x = 0; x <= this._towerEndX; x++) {
      const y = this.calcTowerParabola(x);
      context.lineTo(x, y);
    }
    context.stroke();
    context.beginPath();
    context.moveTo(this._towerEndX, this.calcTowerParabola(this._towerEndX));
    for (let x = this._towerEndX; x <= this._canvas.width; x++) {
      const y = this.calcHillParabola(x);
      context.lineTo(x, y);
    }
    context.stroke();
    context.lineWidth = 1;

    if (this._localRecord > 0) {
      context.strokeStyle = 'green';
      context.lineWidth = 1;
      context.beginPath();
      const distance = this._towerEndX + this._localRecord * 5;
      context.moveTo(distance, 0);
      context.lineTo(distance, this.calcHillParabola(distance));
      context.stroke();
    }
  }

  //math

  private calcTowerParabola(x: number): number {
    const progress = x / this._towerEndX;
    return 200 * (1 - Math.pow(progress - 1, 2));
  }

  private calcHillParabola(x: number): number {
    const progress =
      ((x - this._towerEndX) / (this._canvas.width - this._towerEndX)) * 2;
    return 230 + 200 * Math.pow(progress, 2);
  }

  private calcSkisInclination(y1: number, y2: number): number {
    return Math.atan(y2 - y1);
  }

  private calcWasLandingPossible(): boolean {
    return (
      Math.abs(
        this.game.state.jumperInclineRad -
          this.calcSkisInclination(
            this.calcHillParabola(this.game.state.jumperX),
            this.calcHillParabola(this.game.state.jumperX + 1)
          )
      ) <
      Math.PI / 8
    );
  }

  private calcHasInclineDeviation(): boolean {
    return (
      Math.abs(
        this.game.state.jumperInclineRad -
          this.calcSkisInclination(
            this.calcHillParabola(this.game.state.jumperX),
            this.calcHillParabola(this.game.state.jumperX + 1)
          )
      ) > this._flightDeviationTolerance
    );
  }

  //update

  private resetGame(): void {
    setTimeout(() => {
      this.game.state.jumperX = 0;
      this.game.state.jumperY = 0;
      this.game.state.isMoving = false;
      this.game.state.distance = 0;
      this._jumperRideVelocity = 0;
      this.game.state.jumperFlightVelocityX = 0;
      this.game.state.jumperFlightVelocityY = 0;
      this.game.state.isFlying = false;
      this.game.state.isLanded = false;
      this.game.state.wind = Math.random() * 2;
      this.game.state.windDirection = Math.random() > 0.5 ? 'left' : 'right';
      this.game.state.jumperInclineRad = this.calcSkisInclination(
        this.calcTowerParabola(0),
        this.calcTowerParabola(1)
      );
      this.hasPressedLand = false;
      this.game.state.isCrashed = false;
      this._wrongFlightCounter = 0;
      this.game.state.stylePoints = 0;
      this.game.state.windPoints = 0;
      this.game.state.totalPoints = 0;
      this.game.state.jumperHeightAboveGround = 0;
    });
  }

  private updateWind(): void {
    this._windInterval = setInterval(() => {
      const windChange = (Math.random() - 0.5) * 0.1;
      this.game.state.wind += windChange;

      if (this.game.state.wind < 0) {
        this.game.state.wind = 0;
      } else if (this.game.state.wind > 2) {
        this.game.state.wind = 2;
      }

      if (this.game.state.wind <= 0.1) {
        this.game.state.windDirection = Math.random() > 0.5 ? 'left' : 'right';
      }
    }, 1000);
  }

  private updatePhysics(): void {
    if (!this.game.state.isMoving) {
      if (this.game.players[0].inputData['space'] === 1) {
        this.game.state.isMoving = true;
      } else {
        return;
      }
    }

    this.game.state.jumperHeightAboveGround =
      this.calcHillParabola(this.game.state.jumperX) - this.game.state.jumperY;

    if (this.game.state.jumperX < this._towerEndX) {
      this.ride();
    } else if (
      this.game.state.jumperY + this._jumperHeight >=
      this._canvas.height
    ) {
      this.endJump();
    } else if (this.game.state.jumperHeightAboveGround > 0) {
      this.fly();
    } else {
      this.land();
    }
  }

  private ride(): void {
    this.game.state.jumperY = this.calcTowerParabola(this.game.state.jumperX);
    this.game.state.jumperX += this._jumperRideVelocity;
    this._jumperRideVelocity += 0.03;

    this.game.state.jumperInclineRad = this.calcSkisInclination(
      this.calcTowerParabola(this.game.state.jumperX),
      this.calcTowerParabola(this.game.state.jumperX + 1)
    );

    const distance = Math.abs(this.game.state.jumperX - this._towerEndX);
    if (
      distance < 50 &&
      this.game.players[0].inputData['space'] === 1 &&
      !this.game.state.isFlying
    ) {
      //jump
      this.game.state.jumperFlightVelocityY -=
        (Math.log(50 - distance) / 2.8) * this._jumpForce;
      this.game.state.isFlying = true;
    }
  }

  private fly(): void {
    const windSpeed = (this.game.state.wind / 230) * this._windImpact;
    if (this.game.state.windDirection === 'left') {
      this.game.state.jumperFlightVelocityX -= windSpeed;
      this.game.state.jumperFlightVelocityY -= windSpeed;
    } else {
      this.game.state.jumperFlightVelocityX += windSpeed;
      this.game.state.jumperFlightVelocityY += windSpeed;
    }

    this.game.state.jumperFlightVelocityX = this._jumperRideVelocity;
    this.game.state.jumperFlightVelocityY += 0.08;
    this.game.state.jumperX += this.game.state.jumperFlightVelocityX;
    this.game.state.jumperY += this.game.state.jumperFlightVelocityY;

    this.game.state.distance = (this.game.state.jumperX - this._towerEndX) / 5;

    if (this.game.players[0].inputData['up']) {
      this.game.state.jumperInclineRad += 0.02;
    }
    if (this.game.players[0].inputData['down']) {
      this.game.state.jumperInclineRad -= 0.02;
    }

    if (
      this.game.players[0].inputData['space'] === 1 &&
      this.game.state.distance > 10
    ) {
      //land
      this.game.state.jumperFlightVelocityY += 0.2;
      this.game.state.jumperFlightVelocityX -= 0.1;
      this.hasPressedLand = true;
    }

    if (this.calcHasInclineDeviation()) {
      this._wrongFlightCounter++;
    }
  }

  private land(): void {
    if (!this.hasPressedLand || !this.calcWasLandingPossible()) {
      this.game.state.isCrashed = true;
    } else {
      this.game.state.isLanded = true;
    }

    this.game.state.jumperX += this.game.state.jumperFlightVelocityX;
    this.game.state.jumperY = this.calcHillParabola(this.game.state.jumperX);

    if (this.game.state.isCrashed) {
      this.game.state.jumperInclineRad += Math.PI / 8;
    } else {
      this.game.state.jumperInclineRad = this.calcSkisInclination(
        this.calcHillParabola(this.game.state.jumperX),
        this.calcHillParabola(this.game.state.jumperX + 1)
      );
    }
    this.game.state.isFlying = false;
  }

  private endJump(): void {
    this.game.state.jumperFlightVelocityX = 0;
    this.game.state.jumperFlightVelocityY = 0;
    this.game.state.isMoving = false;
    this.game.state.stylePoints = 20;
    if (this.game.state.isCrashed) {
      this.game.state.stylePoints -= 12;
    }
    let style = 0;
    if (this._wrongFlightCounter > 20) {
      style = 5;
    } else if (this._wrongFlightCounter > 18) {
      style = 4;
    } else if (this._wrongFlightCounter > 16) {
      style = 3;
    } else if (this._wrongFlightCounter > 8) {
      style = 2;
    } else if (this._wrongFlightCounter > 3) {
      style = 1;
    }

    this.game.state.windPoints =
      (this.game.state.windDirection === 'left' ? -1 : 1) *
      this.game.state.wind *
      5;

    this.game.state.stylePoints -= style;

    this.game.state.totalPoints =
      this.game.state.distance +
      this.game.state.stylePoints +
      this.game.state.windPoints;

    if (
      this.game.state.distance > this._localRecord &&
      !this.game.state.isCrashed
    ) {
      this._localRecord = this.game.state.distance;
    }

    if (this.game.players[0].inputData['space'] === 1) {
      this.resetGame();
      this.game.players[0].inputData['space'] = 0;
    }
  }
}
