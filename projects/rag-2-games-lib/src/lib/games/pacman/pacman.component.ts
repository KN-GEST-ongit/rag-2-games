import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Pacman, PacmanState } from './models/pacman.class';

@Component({
  selector: 'app-pacman',
  standalone: true,
  imports: [CanvasComponent],
  template: `<div>
    score: <b>{{ game.state.score }}</b>
    </div>
    <app-canvas
      [displayMode]="'horizontal'"
      #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b> `,
})
export class PacmanGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public override game!: Pacman;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Pacman;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this._canvas.width = this.game.state.map[0].length * this.game.state.tileSize;
    this._canvas.height = this.game.state.map.length * this.game.state.tileSize;
    this.render();
  }

  public override restart(): void {
    this.game.state = new PacmanState();
  }

  protected override update(): void {
    super.update();
  
    this.handleInput();
    this.movePacman();
    this.collectPoint(); 
  
    this.render();
  }

  private handleInput(): void {
    const player = this.game.players[0];
    const inputX = player.inputData['moveX'] as number || 0;
    const inputY = player.inputData['moveY'] as number || 0;
  
    if (inputX !== 0 || inputY !== 0) {
      this.game.state.inputDirectionX = inputX;
      this.game.state.inputDirectionY = inputY;
    }
  
    const tileSize = this.game.state.tileSize;
    const isOnTileCenter =
      Math.abs(this.game.state.pacmanX % tileSize - tileSize / 2) < 3 &&
      Math.abs(this.game.state.pacmanY % tileSize - tileSize / 2) < 3;
  
    if (isOnTileCenter && this.canMoveInDirection(this.game.state.inputDirectionX, this.game.state.inputDirectionY)) {
      this.game.state.movingDirectionX = this.game.state.inputDirectionX;
      this.game.state.movingDirectionY = this.game.state.inputDirectionY;
    }
  }

  private movePacman(): void {
    if (this.canMoveInDirection(this.game.state.movingDirectionX, this.game.state.movingDirectionY)) {
      this.game.state.pacmanX += this.game.state.movingDirectionX * this.game.state.speed;
      this.game.state.pacmanY += this.game.state.movingDirectionY * this.game.state.speed;
    }
  }

  private canMoveInDirection(dirX: number, dirY: number): boolean {
    const tileSize = this.game.state.tileSize;
    const map = this.game.state.map;
    const pacmanRadius = tileSize / 2.2;
  
    const futureX = this.game.state.pacmanX + dirX * this.game.state.speed;
    const futureY = this.game.state.pacmanY + dirY * this.game.state.speed;
  
    const checkPoints = [
      { x: futureX - pacmanRadius, y: futureY - pacmanRadius },
      { x: futureX + pacmanRadius, y: futureY - pacmanRadius },
      { x: futureX - pacmanRadius, y: futureY + pacmanRadius },
      { x: futureX + pacmanRadius, y: futureY + pacmanRadius },
    ];
  
    for (const point of checkPoints) {
      const tileX = Math.floor(point.x / tileSize);
      const tileY = Math.floor(point.y / tileSize);
  
      if (tileY < 0 || tileY >= map.length || tileX < 0 || tileX >= map[0].length) {
        return false;
      }
  
      if (map[tileY][tileX] === 1) {
        return false;
      }
    }
  
    return true;
  }
  
  private collectPoint(): void {
    const tileSize = this.game.state.tileSize;
    const x = Math.floor(this.game.state.pacmanX / tileSize);
    const y = Math.floor(this.game.state.pacmanY / tileSize);

    if (this.game.state.map[y]?.[x] === 2) {
      this.game.state.map[y][x] = 0;
      this.game.state.score++;
}
  }

  private render(): void {
    const context = this._canvas.getContext('2d');
    if (!context) return;
  
    const tileSize = this.game.state.tileSize;
    const map = this.game.state.map;
  
    context.clearRect(0, 0, this._canvas.width, this._canvas.height);
  
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        const value = map[y][x];
        const px = x * tileSize;
        const py = y * tileSize;
  
        if (value === 1) {
          context.fillStyle = 'blue';
          context.fillRect(px, py, tileSize, tileSize);
        } else if (value === 2) {
          context.fillStyle = 'yellow';
          context.beginPath();
          context.arc(px + tileSize / 2, py + tileSize / 2, tileSize / 6, 0, Math.PI * 2);
          context.fill();
        }
      }
    }
  
    const pacX = this.game.state.pacmanX;
    const pacY = this.game.state.pacmanY;

    context.fillStyle = 'gold';
    context.beginPath();
    context.arc(pacX, pacY, tileSize / 2.2, 0, Math.PI * 2);
    context.fill();
  }
}