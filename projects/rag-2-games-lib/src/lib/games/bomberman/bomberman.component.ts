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
  private _moveSpeed = 5;

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

    if (!this.isPaused && !this.game.state.isGameOver) {
      this.movePlayers();
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
    this.game.state.player1score = 0;
    this.game.state.player1alive = true;
    this.game.state.player1bombCount = 1;
    this.game.state.player1bombRange = 1;

    this.game.state.player2lives = 3;
    this.game.state.player2score = 0;
    this.game.state.player2alive = true;
    this.game.state.player2bombCount = 1;
    this.game.state.player2bombRange = 1;

    this.game.state.walls = [];
    this.game.state.bombs = [];
    this.game.state.isGameOver = false;
    this.game.state.winner = 0;

    this.selectMap();
    this.loadMap();
  }

  private selectMap(): void {
    const maps = Object.values(BombermanMap);
    const randomIndex = Math.floor(Math.random() * maps.length);
    this._currentMap = maps[randomIndex];
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

      if (moveX !== 0) {
        const newX = this.game.state.player1x + moveX * this._moveSpeed;

        if (this.canMove(newX, this.game.state.player1y)) {
          this.game.state.player1x = newX;
        }
      } else if (moveY !== 0) {
        const newY = this.game.state.player1y + moveY * this._moveSpeed;

        if (this.canMove(this.game.state.player1x, newY)) {
          this.game.state.player1y = newY;
        }
      }
    }

    if (this.game.state.player2alive) {
      const moveX = Number(this.game.players[1].inputData['moveX']);
      const moveY = Number(this.game.players[1].inputData['moveY']);

      if (moveX !== 0) {
        const newX = this.game.state.player2x + moveX * this._moveSpeed;

        if (this.canMove(newX, this.game.state.player2y)) {
          this.game.state.player2x = newX;
        }
      } else if (moveY !== 0) {
        const newY = this.game.state.player2y + moveY * this._moveSpeed;
        if (this.canMove(this.game.state.player2x, newY)) {
          this.game.state.player2y = newY;
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
