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
    <div>
      wave: <b>{{ game.state.difficulty }}</b>
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
  private _modSize = 10;
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
    this.updateLaser();
    this.checkWideLaserStatus();
    this.moveAliens();
    this.moveMods();
    this.checkModPickup();
    this.difficulty();
    this.checkLossCondition();

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
      this.game.state.laserX = this.game.state.playerX + (this._playerWidth - this._laserWidth) / 2;
      this.game.state.laserY = this._canvas.height - this._playerHeight - this._laserHeight;
      if (this.game.state.laserWidthPowerupActive === true) {
        this.game.state.laserAmount = this.game.state.laserAmount - 1;
      }
    }
  }

  private updateLaser(): void {
    if (this.game.state.laserY < 0) return;

    this.updateLaserPosition();
    this.checkLaserCollision();
    
    if (this.game.state.laserY < 0) {
      this.game.state.laserY = -1;
    }
  }

  private updateLaserPosition(): void {
    this.game.state.laserY -= this.game.state.laserSpeed;
  }

  private checkLaserCollision(): void {
    const laserLeft = this.game.state.laserX;
    const laserRight = this.game.state.laserX + this._laserWidth;
    const laserTop = this.game.state.laserY;
    const laserBottom = this.game.state.laserY + this._laserHeight;

    for (const alien of this.game.state.aliens) {
      if (!alien.alive) continue;

      const alienLeft = alien.x;
      const alienRight = alien.x + this._alienSize;
      const alienTop = alien.y;
      const alienBottom = alien.y + this._alienSize;

      const isHit =
        laserRight > alienLeft &&
        laserLeft < alienRight &&
        laserBottom > alienTop &&
        laserTop < alienBottom;

      if (isHit) {
        alien.alive = false;
        this.game.state.laserY = -1;
        this.game.state.score += 5;
        this.game.state.alienCount--;
        if (Math.random() < this.game.state.modChance) {
          this.game.state.generateMod();
        }
        break;
      }
    }
  }

  private moveAliens(): void {
    let isEdgeReached = false;

    for (const alien of this.game.state.aliens) {
      if (!alien.alive) continue;

      alien.x += this.game.state.alienSpeed * this.game.state.alienDirection;

      if (
        alien.x < 0 ||
        alien.x + this._alienSize > this._canvas.width
      ) {
        isEdgeReached = true;
      }
    }

    if (isEdgeReached) {
      this.game.state.alienDirection *= -1;
      for (const alien of this.game.state.aliens) {
        alien.y += 20;
      }
    }
  }

  private difficulty(): void {
    if (this.game.state.alienCount === 0) {
      this.game.state.difficulty++;
      this.game.state.score += 100;
      this.game.state.generateAliens();

      this.game.state.modChance = Math.min(this.game.state.modChance + (this.game.state.difficulty - 1) * 0.05, (this.game.state.modChance + 0.2));
    }
  }

   private checkLossCondition(): void {
    for (const alien of this.game.state.aliens) {
      if (
        alien.alive &&
        alien.y + this._alienSize > this._canvas.height - this._playerHeight
      ) {
        this.game.state.failCounter++;
        this.restart();
        break;
      }
    }
  }

    private moveMods(): void {
      for (const mod of this.game.state.mods) {
          if (!mod.alive) continue;
          mod.y += this.game.state.modSpeed;

          if (mod.y > this._canvas.height) {
              mod.alive = false;
          }
      }
  }

    private checkModPickup(): void {
      for (const mod of this.game.state.mods) {
          if (!mod.alive) continue;

          const isPicked =
              mod.y + this._modSize > this._canvas.height - this._playerHeight &&
              mod.x < this.game.state.playerX + this._playerWidth &&
              mod.x + this._modSize > this.game.state.playerX;

          if (isPicked) {
              mod.alive = false;
              this.activateWideLaser();
          }
      }
  }

    private activateWideLaser(): void {
      this.game.state.laserWidthPowerupActive = true;
      this._laserWidth = 50;
      this.game.state.laserAmount += 10; 
  }

    private checkWideLaserStatus(): void {
      if (this.game.state.laserWidthPowerupActive && this.game.state.laserAmount <= -1) {
        this.game.state.laserWidthPowerupActive = false;
        this._laserWidth = 4;
      }
    }

  private render(): void {
    const context = this._canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, this._canvas.width, this._canvas.height);

      //player
      context.fillStyle = 'green';
      context.fillRect(
      this.game.state.playerX,
      this._canvas.height - this._playerHeight,
      this._playerWidth,
      this._playerHeight
      );

      //laser
      if (this.game.state.laserY >= 0) {
        context.fillStyle = 'red';
        context.fillRect(
          this.game.state.laserX,
          this.game.state.laserY,
          this._laserWidth,
          this._laserHeight
      );
    }

    

    //alien
    context.fillStyle = 'purple';
    for (const alien of this.game.state.aliens) {
      if (alien.alive) {
        context.fillRect(alien.x, alien.y, this._alienSize, this._alienSize);
      }
    }

    //mod
    context.fillStyle = 'blue';
    for (const mod of this.game.state.mods) {
        if (mod.alive) {
            context.fillRect(mod.x, mod.y, this._modSize, this._modSize);
        }
    }

    }
  }

}