/* eslint-disable max-lines */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Pacman, PacmanState } from './models/pacman.class';
import { PacmanMaps } from './models/pacman.maps';

@Component({
  selector: 'app-pacman',
  standalone: true,
  imports: [CanvasComponent],
  template: `<div>
    level: <b>{{ game.state.level }}</b>
    score: <b>{{ game.state.score }}</b>
    map_ID: <b>{{ game.state.mapId }}</b>
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
  private _movingDirectionX = 0;
  private _movingDirectionY = 0;
  private _inputDirectionX = 0;
  private _inputDirectionY = 0;

  private _mouthAnimCounter = 0;

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
    const randomIndex = Math.floor(Math.random() * PacmanMaps.length);
    const selectedMap = PacmanMaps[randomIndex].map(row => [...row]);
  
    this.game.state = new PacmanState(selectedMap);
    this.game.state.mapId = randomIndex;
  
    this._canvas.width = selectedMap[0].length * this.game.state.tileSize;
    this._canvas.height = selectedMap.length * this.game.state.tileSize;
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

      this.moveEnemies();
      this.checkPacmanGhostCollision();

      this._mouthAnimCounter += 0.15;
    }
    if (this.game.state.isPowerMode) {
      this.powerMode();
    }
    if (this.isLevelComplete()) {
      this.nextLevel();
    }

    this.render();
  }

  private powerMode(): void{
    this.game.state.powerModeTimer++;
      if (this.game.state.powerModeTimer > this.game.state.maxPowerModeTime) {
        this.game.state.isPowerMode = false;
        this.game.state.powerModeTimer = 0;
      }
  }

  private handleInput(): void {
    const player = this.game.players[0];
    const inputX = player.inputData['moveX'] as number || 0;
    const inputY = player.inputData['moveY'] as number || 0;

    if (inputX !== 0 || inputY !== 0) {
      this._inputDirectionX = inputX;
      this._inputDirectionY = inputY;
    }

    const tileSize = this.game.state.tileSize;
    const isOnTileCenter =
      Math.abs(this.game.state.pacmanX % tileSize - tileSize / 2) < 3 &&
      Math.abs(this.game.state.pacmanY % tileSize - tileSize / 2) < 3;

    if (isOnTileCenter && this.canMoveInDirection(this._inputDirectionX, this._inputDirectionY)) {
      this._movingDirectionX = this._inputDirectionX;
      this._movingDirectionY = this._inputDirectionY;
    }
  }

  private movePacman(): void {
    if (this.canMoveInDirection(this._movingDirectionX, this._movingDirectionY)) {
      this.game.state.pacmanX += this._movingDirectionX * this.game.state.speed;
      this.game.state.pacmanY += this._movingDirectionY * this.game.state.speed;
    }
  }

  private canMoveEntity(posX: number, posY: number, dirX: number, dirY: number, speed: number, radius: number): boolean {
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
    } else if (this.game.state.map[y]?.[x] === 3) {
      this.game.state.map[y][x] = 0;
      this.game.state.score += 30;
      this.game.state.isPowerMode = true;
      this.game.state.powerModeTimer = 0;
    }
  }

  //GHOST
  private moveEnemies(): void {
    for (const enemy of this.game.state.enemies) {
      if (!enemy.isVisible) {
        enemy.respawnTimer++;
        if (enemy.respawnTimer >= 120) {
          enemy.x = 13.5 * this.game.state.tileSize; //RESPAWN X
          enemy.y = 9.5 * this.game.state.tileSize; //RESPAWN Y
          enemy.dirX = 0;
          enemy.dirY = -1;
          enemy.isVisible = true;
          enemy.respawnTimer = 0;
        }
        continue;
      }

      if (this.canMoveEntity(enemy.x, enemy.y, enemy.dirX, enemy.dirY, this.game.state.speed, this.game.state.tileSize / 2.2)) {
        enemy.x += enemy.dirX * this.game.state.speed;
        enemy.y += enemy.dirY * this.game.state.speed;
      } else {
        const directions = [
          { x: 1, y: 0 },
          { x: -1, y: 0 },
          { x: 0, y: 1 },
          { x: 0, y: -1 },
        ];
        const available = directions.filter(d => this.canMoveEntity(enemy.x, enemy.y, d.x, d.y, this.game.state.speed, this.game.state.tileSize / 2.2));
        if (available.length > 0) {
          const newDir = available[Math.floor(Math.random() * available.length)];
          enemy.dirX = newDir.x;
          enemy.dirY = newDir.y;
        }
      }
    }
  }

  private checkPacmanGhostCollision(): void {
    for(const enemy of this.game.state.enemies){
      const pacman = this.game.state;
      const dx = pacman.pacmanX - enemy.x;
      const dy = pacman.pacmanY - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < pacman.tileSize / 2) {
        if (this.game.state.isPowerMode) {
          enemy.isVisible = false;
          enemy.respawnTimer = 0;
          this.game.state.score += 100;
          enemy.x = -999;
          enemy.y = -999;
        } else {
          this.restart();
      }
    }

    }
  }

  private render(): void {
    const context = this._canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, this._canvas.width, this._canvas.height);

      this.drawMap(context);
      this.drawPacman(context);
      this.drawEnemies(context);
      if (this.game.state.isPowerMode) {
        this.drawPowerMode(context);
      }
    }
  }

  private drawMap(context: CanvasRenderingContext2D): void{
    const tileSize = this.game.state.tileSize;
    const map = this.game.state.map;
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
        } else if (value === 3) {
          context.fillStyle = 'yellow';
          context.beginPath();
          context.arc(px + tileSize / 2, py + tileSize / 2, tileSize / 4, 0, Math.PI * 2);
          context.fill();
        }
      }
    }
  }

  private drawPacman(context: CanvasRenderingContext2D): void {
    const tileSize = this.game.state.tileSize;
    const pacX = this.game.state.pacmanX;
    const pacY = this.game.state.pacmanY;
    const radius = tileSize / 2.2;

    const mouthOpening = Math.abs(Math.sin(this._mouthAnimCounter)) * (Math.PI / 4);

    let startAngle = mouthOpening;
    let endAngle = 2 * Math.PI - mouthOpening;

    if (this._movingDirectionX === -1) {
      startAngle += Math.PI;
      endAngle += Math.PI;
    } else if (this._movingDirectionY === -1) {
      startAngle -= Math.PI / 2;
      endAngle -= Math.PI / 2;
    } else if (this._movingDirectionY === 1) {
      startAngle += Math.PI / 2;
      endAngle += Math.PI / 2;
    }

    context.fillStyle = 'gold';
    context.beginPath();
    context.moveTo(pacX, pacY);
    context.arc(pacX, pacY, radius, startAngle, endAngle);
    context.closePath();
    context.fill();
  }

  private drawEnemies(context: CanvasRenderingContext2D): void {
    for (const enemy of this.game.state.enemies) {
      if (!enemy.isVisible) continue;
      context.fillStyle = enemy.color;
      context.beginPath();
      context.arc(enemy.x, enemy.y, this.game.state.tileSize / 2.2, 0, Math.PI * 2);
      context.fill();
    }
  }

  private drawPowerMode(context: CanvasRenderingContext2D): void {
    const secondsLeft =
          ((this.game.state.maxPowerModeTime - this.game.state.powerModeTimer) / 60).toFixed(1);
      
        if (context) {
          context.fillStyle = 'lime';
          context.font = '20px Arial';
          context.fillText(`Posiadasz SUPERMOC: ${secondsLeft}s`, 5, 20);
        }
  }

  private isLevelComplete(): boolean {
    for (const row of this.game.state.map) {
      for (const tile of row) {
        if (tile === 2 || tile === 3) return false;
      }
    }
    return true;
  }

  private nextLevel(): void {
    const randomIndex = Math.floor(Math.random() * PacmanMaps.length);
    const nextMap = PacmanMaps[randomIndex].map(row => [...row]);

    const newState = new PacmanState(nextMap);
    newState.score = this.game.state.score;
    newState.level = this.game.state.level + 1;
    this.game.state = newState;

    this._canvas.width = nextMap[0].length * this.game.state.tileSize;
    this._canvas.height = nextMap.length * this.game.state.tileSize;

    this._movingDirectionX = 0;
    this._movingDirectionY = 0;
    this._inputDirectionX = 0;
    this._inputDirectionY = 0;
}
}