/* eslint-disable max-lines */
/* eslint-disable complexity */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Bomberman, BombermanState } from './models/bomberman.class';
import { BombermanMap } from './models/bomberman.map';

@Component({
  selector: 'app-bomberman',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    <div>
      Player 1 - Lives: <b>{{ game.state.player1lives }}</b
      >, Score: <b>{{ game.state.player1score }}</b
      >, Bombs: <b>{{ game.state.player1bombCount }}</b
      >, Range: <b>{{ game.state.player1bombRange }}</b> Speed:
      <b>{{ game.state.player1speed }}</b>
      &nbsp;&nbsp;|&nbsp;&nbsp; Player 2 - Lives:
      <b>{{ game.state.player2lives }}</b
      >, Score:
      <b>{{ game.state.player2score }}</b>
      , Bombs:
      <b>{{ game.state.player2bombCount }}</b
      >, Range: <b>{{ game.state.player2bombRange }}</b> Speed:
      <b>{{ game.state.player2speed }}</b>
    </div>

    <app-canvas [displayMode]="'horizontal'" #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b>
  `,
})
export class BombermanGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private _gridWidth = 15;
  private _gridHeight = 13;
  private _cellSize = 50;

  private readonly _maxsSpeed = 8;
  private readonly _maxBombs = 4;
  private readonly _maxRange = 5;

  private _playerSize = 0.8 * this._cellSize;

  private _currentMap: number[][] = [];

  public override game!: Bomberman;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Bomberman;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    this._canvas.width = this._gridWidth * this._cellSize;
    this._canvas.height = this._gridHeight * this._cellSize;

    this.resetGame();
    this.render();
  }

  public override restart(): void {
    this.game.state = new BombermanState();
    this.resetGame();
  }

  protected override update(): void {
    super.update();

    if (!this.isPaused) {
      this.movePlayers();
      this.handleBombPlacement();
      this.updateBombs();
      this.updateExplosions();
    }

    this.render();
  }

  private resetGame(): void {
    const offset = (this._cellSize - this._playerSize) / 2;

    this.game.state.player1x = 1 * this._cellSize + offset;
    this.game.state.player1y = 1 * this._cellSize + offset;

    this.game.state.player2x = (this._gridWidth - 2) * this._cellSize + offset;
    this.game.state.player2y = (this._gridHeight - 2) * this._cellSize + offset;

    this.game.state.player1lives = 3;
    this.game.state.player1alive = true;
    this.game.state.player1bombCount = 1;
    this.game.state.player1bombRange = 1;

    this.game.state.player2lives = 3;
    this.game.state.player2alive = true;
    this.game.state.player2bombCount = 1;
    this.game.state.player2bombRange = 1;

    this.game.state.walls = [];
    this.game.state.bombs = [];
    this.game.state.powerups = [];
    this.game.state.explosions = [];

    this.selectMap();
    this.loadMap();
  }

  private selectMap(): void {
    // const maps = Object.values(BombermanMap);
    // const randomIndex = Math.floor(Math.random() * maps.length);
    // this._currentMap = maps[randomIndex];
    this._currentMap = BombermanMap.map1;
  }

  private loadMap(): void {
    for (let row = 0; row < this._gridHeight; row++) {
      for (let col = 0; col < this._gridWidth; col++) {
        const cell = this._currentMap[row][col];
        if (cell === 1) {
          this.game.state.walls.push({
            x: col,
            y: row,
            destructible: false,
          });
        } else if (cell === 2) {
          this.game.state.walls.push({
            x: col,
            y: row,
            destructible: true,
          });
        }
      }
    }
  }

  private movePlayers(): void {
    if (this.game.state.player1alive) {
      const moveX = Number(this.game.players[0].inputData['moveX']);
      const moveY = Number(this.game.players[0].inputData['moveY']);

      let speed = this.game.state.player1speed;

      if (moveX !== 0 && moveY !== 0) {
        speed = speed / Math.sqrt(2);
      }

      if (moveX !== 0) {
        const newX = this.game.state.player1x + moveX * speed;
        if (this.canMove(newX, this.game.state.player1y)) {
          this.game.state.player1x = newX;
          this.checkPowerups(0);
        }
      }
      if (moveY !== 0) {
        const newY = this.game.state.player1y + moveY * speed;
        if (this.canMove(this.game.state.player1x, newY)) {
          this.game.state.player1y = newY;
          this.checkPowerups(0);
        }
      }
    }

    if (this.game.state.player2alive) {
      const moveX = Number(this.game.players[1].inputData['moveX']);
      const moveY = Number(this.game.players[1].inputData['moveY']);

      let speed = this.game.state.player1speed;

      if (moveX !== 0 && moveY !== 0) {
        speed = speed / Math.sqrt(2);
      }

      if (moveX !== 0) {
        const newX = this.game.state.player2x + moveX * speed;
        if (this.canMove(newX, this.game.state.player2y)) {
          this.game.state.player2x = newX;
          this.checkPowerups(1);
        }
      }
      if (moveY !== 0) {
        const newY = this.game.state.player2y + moveY * speed;
        if (this.canMove(this.game.state.player2x, newY)) {
          this.game.state.player2y = newY;
          this.checkPowerups(1);
        }
      }
    }
  }

  private canMove(x: number, y: number): boolean {
    const playerLeft = x;
    const playerRight = x + this._playerSize;
    const playerTop = y;
    const playerBottom = y + this._playerSize;

    const xBorderLeft = 0;
    const xBorderRight = this._gridWidth * this._cellSize;
    const yBorderTop = 0;
    const yBorderBottom = this._gridHeight * this._cellSize;

    if (
      playerLeft < xBorderLeft ||
      playerRight > xBorderRight ||
      playerTop < yBorderTop ||
      playerBottom > yBorderBottom
    ) {
      return false;
    }

    for (const wall of this.game.state.walls) {
      const wallLeft = wall.x * this._cellSize;
      const wallRight = wallLeft + this._cellSize;
      const wallTop = wall.y * this._cellSize;
      const wallBottom = wallTop + this._cellSize;

      if (
        playerRight > wallLeft &&
        playerLeft < wallRight &&
        playerBottom > wallTop &&
        playerTop < wallBottom
      ) {
        return false;
      }
    }

    return true;
  }

  private handleBombPlacement(): void {
    if (this.game.state.player1alive) {
      const bombInput = Number(this.game.players[0].inputData['bomb']);
      if (bombInput === 1 && this.canPlaceBomb(0)) {
        this.placeBomb(0);
        this.game.players[0].inputData['bomb'] = 0;
      }
    }

    if (this.game.state.player2alive) {
      const bombInput = Number(this.game.players[1].inputData['bomb']);
      if (bombInput === 1 && this.canPlaceBomb(1)) {
        this.placeBomb(1);
        this.game.players[1].inputData['bomb'] = 0;
      }
    }
  }

  private canPlaceBomb(playerId: number): boolean {
    let playerX;
    if (playerId === 0) {
      playerX = this.game.state.player1x;
    } else {
      playerX = this.game.state.player2x;
    }

    let playerY;
    if (playerId === 0) {
      playerY = this.game.state.player1y;
    } else {
      playerY = this.game.state.player2y;
    }

    let maxBombs;
    if (playerId === 0) {
      maxBombs = this.game.state.player1bombCount;
    } else {
      maxBombs = this.game.state.player2bombCount;
    }

    const gridX = Math.floor((playerX + this._playerSize / 2) / this._cellSize);
    const gridY = Math.floor((playerY + this._playerSize / 2) / this._cellSize);

    let playerBombs = 0;
    for (const bomb of this.game.state.bombs) {
      if (bomb.playerId === playerId) {
        playerBombs++;
      }
    }

    if (playerBombs >= maxBombs) {
      return false;
    }

    for (const bomb of this.game.state.bombs) {
      if (bomb.x === gridX && bomb.y === gridY) {
        return false;
      }
    }

    return true;
  }

  private placeBomb(playerId: number): void {
    let playerX;
    if (playerId === 0) {
      playerX = this.game.state.player1x;
    } else {
      playerX = this.game.state.player2x;
    }

    let playerY;
    if (playerId === 0) {
      playerY = this.game.state.player1y;
    } else {
      playerY = this.game.state.player2y;
    }

    let range;
    if (playerId === 0) {
      range = this.game.state.player1bombRange;
    } else {
      range = this.game.state.player2bombRange;
    }

    const gridX = Math.floor((playerX + this._playerSize / 2) / this._cellSize);
    const gridY = Math.floor((playerY + this._playerSize / 2) / this._cellSize);

    this.game.state.bombs.push({
      playerId: playerId,
      x: gridX,
      y: gridY,
      range: range,
      timer: 3000,
    });
  }

  private updateBombs(): void {
    const deltaTime = 1000 / 60;

    for (let i = this.game.state.bombs.length - 1; i >= 0; i--) {
      const bomb = this.game.state.bombs[i];
      bomb.timer -= deltaTime;

      if (bomb.timer <= 0) {
        this.explodeBomb(bomb);
        this.game.state.bombs.splice(i, 1);
      }
    }
  }

  private explodeBomb(bomb: { x: number; y: number; range: number }): void {
    this.checkPlayerHit(bomb.x, bomb.y);
    this.createExplosionEffect(bomb.x, bomb.y);

    const directions = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];

    for (const dir of directions) {
      for (let i = 1; i <= bomb.range; i++) {
        const checkX = bomb.x + dir.x * i;
        const checkY = bomb.y + dir.y * i;

        this.checkPlayerHit(checkX, checkY);

        let wallIndex = -1;
        for (let w = 0; w < this.game.state.walls.length; w++) {
          if (
            this.game.state.walls[w].x === checkX &&
            this.game.state.walls[w].y === checkY
          ) {
            wallIndex = w;
            break;
          }
        }

        if (wallIndex !== -1) {
          const wall = this.game.state.walls[wallIndex];
          if (wall.destructible) {
            const wx = wall.x;
            const wy = wall.y;
            this.game.state.walls.splice(wallIndex, 1);
            this.spawnPowerUp(wx, wy);
            this.createExplosionEffect(checkX, checkY);
            continue;
          } else {
            break;
          }
        } else {
          this.createExplosionEffect(checkX, checkY);
        }
      }
    }
  }

  private checkPlayerHit(gridX: number, gridY: number): void {
    let didPlayer1Died = false;
    let didPlayer2Died = false;

    if (this.game.state.player1alive) {
      if (
        this.isPlayerOnCell(
          gridX,
          gridY,
          this.game.state.player1x,
          this.game.state.player1y
        )
      ) {
        this.game.state.player1lives--;
        if (this.game.state.player1lives <= 0) {
          this.game.state.player1alive = false;
          this.game.state.player2score += 1;
          didPlayer1Died = true;
        } else {
          this.respawnPlayer(0);
        }
      }
    }

    if (this.game.state.player2alive) {
      if (
        this.isPlayerOnCell(
          gridX,
          gridY,
          this.game.state.player2x,
          this.game.state.player2y
        )
      ) {
        this.game.state.player2lives--;
        if (this.game.state.player2lives <= 0) {
          this.game.state.player2alive = false;
          this.game.state.player1score += 1;
          didPlayer2Died = true;
        } else {
          this.respawnPlayer(1);
        }
      }
    }

    if (didPlayer1Died || didPlayer2Died) {
      this.resetGame();
    }
  }

  private isPlayerOnCell(
    gridX: number,
    gridY: number,
    playerX: number,
    playerY: number
  ): boolean {
    const cellLeft = gridX * this._cellSize;
    const cellRight = cellLeft + this._cellSize;
    const cellTop = gridY * this._cellSize;
    const cellBottom = cellTop + this._cellSize;

    const playerLeft = playerX;
    const playerRight = playerX + this._playerSize;
    const playerTop = playerY;
    const playerBottom = playerY + this._playerSize;

    return (
      playerRight > cellLeft &&
      playerLeft < cellRight &&
      playerBottom > cellTop &&
      playerTop < cellBottom
    );
  }

  private respawnPlayer(playerId: number): void {
    const offset = (this._cellSize - this._playerSize) / 2;

    if (playerId === 0) {
      this.game.state.player1x = 1 * this._cellSize + offset;
      this.game.state.player1y = 1 * this._cellSize + offset;
    } else {
      this.game.state.player2x =
        (this._gridWidth - 2) * this._cellSize + offset;
      this.game.state.player2y =
        (this._gridHeight - 2) * this._cellSize + offset;
    }
  }

  private spawnPowerUp(x: number, y: number): void {
    const chance = Math.random();
    if (chance > 0.3) return;

    let type: 'bombs' | 'range' | 'speed' = 'bombs';
    const roll = Math.random();

    if (roll < 0.4) type = 'bombs';
    else if (roll < 0.8) type = 'range';
    else type = 'speed';

    this.game.state.powerups.push({ x, y, type });
  }

  private checkPowerups(playerId: number): void {
    const px =
      playerId === 0 ? this.game.state.player1x : this.game.state.player2x;
    const py =
      playerId === 0 ? this.game.state.player1y : this.game.state.player2y;

    const centerX = px + this._playerSize / 2;
    const centerY = py + this._playerSize / 2;

    for (let i = this.game.state.powerups.length - 1; i >= 0; i--) {
      const p = this.game.state.powerups[i];
      const pLeft = p.x * this._cellSize;
      const pTop = p.y * this._cellSize;

      if (
        centerX > pLeft &&
        centerX < pLeft + this._cellSize &&
        centerY > pTop &&
        centerY < pTop + this._cellSize
      ) {
        if (p.type === 'bombs') {
          if (playerId === 0) {
            if (this.game.state.player1bombCount < this._maxBombs) {
              this.game.state.player1bombCount++;
            }
          } else {
            if (this.game.state.player2bombCount < this._maxBombs) {
              this.game.state.player2bombCount++;
            }
          }
        } else if (p.type === 'range') {
          if (playerId === 0) {
            if (this.game.state.player1bombRange < this._maxRange) {
              this.game.state.player1bombRange++;
            }
          } else {
            if (this.game.state.player2bombRange < this._maxRange) {
              this.game.state.player2bombRange++;
            }
          }
        } else if (p.type === 'speed') {
          if (playerId === 0) {
            if (this.game.state.player1speed < this._maxsSpeed) {
              this.game.state.player1speed++;
            }
          } else {
            if (this.game.state.player2speed < this._maxsSpeed) {
              this.game.state.player2speed++;
            }
          }
        }

        this.game.state.powerups.splice(i, 1);
      }
    }
  }

  private createExplosionEffect(x: number, y: number): void {
    const hasExplosion = this.game.state.explosions.some(
      e => e.x === x && e.y === y
    );
    if (!hasExplosion) {
      this.game.state.explosions.push({ x, y, timer: 500 });
    }
  }

  private updateExplosions(): void {
    const deltaTime = 1000 / 60;
    for (let i = this.game.state.explosions.length - 1; i >= 0; i--) {
      const explosion = this.game.state.explosions[i];
      explosion.timer -= deltaTime;
      if (explosion.timer <= 0) {
        this.game.state.explosions.splice(i, 1);
      }
    }
  }

  private render(): void {
    const context = this._canvas.getContext('2d');

    if (!context) {
      return;
    }

    context.clearRect(0, 0, this._canvas.width, this._canvas.height);

    this.renderMap(context);
    this.renderPlayers(context);
  }

  private renderMap(context: CanvasRenderingContext2D): void {
    this.game.state.walls.forEach(wall => {
      if (wall.destructible) {
        context.fillStyle = '#9b6036ff';
      } else {
        context.fillStyle = '#585858ff';
      }

      context.fillRect(
        wall.x * this._cellSize,
        wall.y * this._cellSize,
        this._cellSize,
        this._cellSize
      );

      context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      context.lineWidth = 1;
      context.strokeRect(
        wall.x * this._cellSize + 0.5,
        wall.y * this._cellSize + 0.5,
        this._cellSize - 1,
        this._cellSize - 1
      );
    });

    context.fillStyle = '#ff8800';
    this.game.state.explosions.forEach(explosion => {
      context.fillRect(
        explosion.x * this._cellSize + 2.5,
        explosion.y * this._cellSize + 2.5,
        this._cellSize - 5,
        this._cellSize - 5
      );
    });

    this.game.state.powerups.forEach(p => {
      const x = p.x * this._cellSize + 10;
      const y = p.y * this._cellSize + 10;
      const size = this._cellSize - 20;

      context.fillStyle = '#FFD700';
      context.fillRect(x, y, size, size);

      context.strokeStyle = 'black';
      context.lineWidth = 2;
      context.strokeRect(x, y, size, size);

      context.fillStyle = 'black';
      context.font = '20px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';

      let icon = '';
      if (p.type === 'bombs') icon = '💣';
      else if (p.type === 'range') icon = '🔥';
      else if (p.type === 'speed') icon = '⚡';

      context.fillText(icon, x + size / 2, y + size / 2);
    });

    for (const bomb of this.game.state.bombs) {
      context.fillStyle = '#000000';
      context.beginPath();
      context.arc(
        bomb.x * this._cellSize + this._cellSize / 2,
        bomb.y * this._cellSize + this._cellSize / 2,
        this._cellSize / 3,
        0,
        Math.PI * 2
      );
      context.fill();

      const blinkRate = bomb.timer < 1000 ? 100 : 500;
      if (Math.floor(bomb.timer / blinkRate) % 2 === 0) {
        context.fillStyle = '#ff0000';
        context.beginPath();
        context.arc(
          bomb.x * this._cellSize + this._cellSize / 2,
          bomb.y * this._cellSize + this._cellSize / 2,
          this._cellSize / 6,
          0,
          Math.PI * 2
        );
        context.fill();
      }
    }
  }

  private renderPlayers(context: CanvasRenderingContext2D): void {
    if (this.game.state.player1alive) {
      context.fillStyle = 'blue';
      context.fillRect(
        this.game.state.player1x,
        this.game.state.player1y,
        this._playerSize,
        this._playerSize
      );
    }

    if (this.game.state.player2alive) {
      context.fillStyle = 'red';
      context.fillRect(
        this.game.state.player2x,
        this.game.state.player2y,
        this._playerSize,
        this._playerSize
      );
    }
  }
}
