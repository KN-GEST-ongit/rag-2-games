/* eslint-disable complexity */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Bomberman, BombermanState } from './models/bomberman.class';

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
  private _lastMoveTime = 0;

  private _playerSize = 0.8 * this._cellSize;

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
  }

  private movePlayers(): void {
    if (this.game.state.player1alive) {
      const moveX = Number(this.game.players[0].inputData['moveX']);
      const moveY = Number(this.game.players[0].inputData['moveY']);

      if (moveX !== 0 || moveY !== 0) {
        const newX = this.game.state.player1x + moveX * this._moveSpeed;
        const newY = this.game.state.player1y + moveY * this._moveSpeed;

        if (this.canMove(newX, newY)) {
          this.game.state.player1x = newX;
          this.game.state.player1y = newY;
        }
      }
    }

    if (this.game.state.player2alive) {
      const moveX = Number(this.game.players[1].inputData['moveX']);
      const moveY = Number(this.game.players[1].inputData['moveY']);

      if (moveX !== 0 || moveY !== 0) {
        const newX = this.game.state.player2x + moveX * this._moveSpeed;
        const newY = this.game.state.player2y + moveY * this._moveSpeed;

        if (this.canMove(newX, newY)) {
          this.game.state.player2x = newX;
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

    return true;
  }

  private render(): void {
    const context = this._canvas.getContext('2d');

    if (!context) {
      return;
    }

    context.clearRect(0, 0, this._canvas.width, this._canvas.height);

    this.renderPlayers(context);
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
