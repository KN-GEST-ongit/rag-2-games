/* eslint-disable max-lines */
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

    if (
      !this.game.state.isGameStarted &&
      (this.game.players[0].inputData['moveX'] !== 0 || this.game.players[0].inputData['moveY'] !== 0)
    ) {
      this.game.state.isGameStarted = true;
    }

    if (!this.isPaused && this.game.state.isGameStarted) {
      this.handleInput();
      this.movePacman();
      this.collectPoint(); 

      this.moveGhost();
      this.checkPacmanGhostCollision();
    }
  
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

  private canMoveEntity(
    posX: number,
    posY: number,
    dirX: number,
    dirY: number,
    speed: number,
    radius: number
  ): boolean {
    const tileSize = this.game.state.tileSize;
    const map = this.game.state.map;
  
    const futureX = posX + dirX * speed;
    const futureY = posY + dirY * speed;
  
    const checkPoints = [
      { x: futureX - radius, y: futureY - radius },
      { x: futureX + radius, y: futureY - radius },
      { x: futureX - radius, y: futureY + radius },
      { x: futureX + radius, y: futureY + radius },
    ];
  
    for (const point of checkPoints) {
      const tileX = Math.floor(point.x / tileSize);
      const tileY = Math.floor(point.y / tileSize);
  
      if (
        tileY < 0 ||
        tileY >= map.length ||
        tileX < 0 ||
        tileX >= map[0].length ||
        map[tileY][tileX] === 1
      ) {
        return false;
      }
    }
  
    return true;
  }

  private canMoveInDirection(dirX: number, dirY: number): boolean {
    const state = this.game.state;
    const radius = state.tileSize / 2.2;
    return this.canMoveEntity(state.pacmanX, state.pacmanY, dirX, dirY, state.speed, radius);
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

  //GHOST
  private moveGhost(): void {
    const ghost = this.game.state;
  
    if (this.canGhostMoveInDirection(ghost.ghostDirX, ghost.ghostDirY)) {
      ghost.ghostX += ghost.ghostDirX * ghost.ghostSpeed;
      ghost.ghostY += ghost.ghostDirY * ghost.ghostSpeed;
    } else {
      const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];
  
      const available = directions.filter(d =>
        this.canGhostMoveInDirection(d.x, d.y)
      );
  
      if (available.length > 0) {
        const newDir = available[Math.floor(Math.random() * available.length)];
        ghost.ghostDirX = newDir.x;
        ghost.ghostDirY = newDir.y;
      }
    }
  }

  private canGhostMoveInDirection(dirX: number, dirY: number): boolean {
    const state = this.game.state;
    const radius = state.tileSize / 2.2;
    return this.canMoveEntity(state.ghostX, state.ghostY, dirX, dirY, state.ghostSpeed, radius);
  }

  private checkPacmanGhostCollision(): void {
    const pacman = this.game.state;
    const dx = pacman.pacmanX - pacman.ghostX;
    const dy = pacman.pacmanY - pacman.ghostY;
    const distance = Math.sqrt(dx * dx + dy * dy);
  
    if (distance < pacman.tileSize / 2) {
      //GAME OVER
      this.restart();
    }
  }
  

  private render(): void {
    const context = this._canvas.getContext('2d');
    if (context){
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


      const ghostX = this.game.state.ghostX;
      const ghostY = this.game.state.ghostY;

      context.fillStyle = 'red';
      context.beginPath();
      context.arc(ghostX, ghostY, tileSize / 2.2, 0, Math.PI * 2);
      context.fill();
    }
  }
}