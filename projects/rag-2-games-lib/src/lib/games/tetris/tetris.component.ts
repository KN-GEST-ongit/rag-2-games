/* eslint-disable max-lines */
/* eslint-disable complexity */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Tetris, TetrisState } from './models/tetris.class';
import { IPlayerContext } from './models/player-context.interface';
import { TETROMINOS } from './models/tetrominos';
import { TETRIS_COLORS } from './models/colors';

@Component({
  selector: 'app-tetris',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    @if (!isMultiplayer) {
      <div>
        Player Best Score: <b>{{ playerBestScores[0] }}</b>
      </div>
      <div>
        Score: <b>{{ game.state.score0 }}</b> | Lines:
        <b>{{ game.state.lines0 }}</b> | Level: <b>{{ game.state.level0 }}</b>
      </div>
    } @else {
      <div style="display: flex; justify-content: space-around; width: 85%">
        <span
          >P1 Best: <b>{{ playerBestScores[0] }}</b></span
        >
        <span
          >P1 Score: <b>{{ game.state.score0 }}</b></span
        >
        <span
          >P2 Best: <b>{{ playerBestScores[1] }}</b></span
        >
        <span
          >P2 Score: <b>{{ game.state.score1 }}</b></span
        >
      </div>
    }

    <app-canvas [displayMode]="canvasDisplayMode" #gameCanvas> </app-canvas>

    <br />
    <b>FPS: {{ fps }}</b>
  `,
})
export class TetrisGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public playerBestScores: number[] = [0, 0];
  public isStarted = false;

  public get isMultiplayer(): boolean {
    return this.game.players.length > 1 && this.game.players[1].isActive;
  }

  public get canvasDisplayMode(): 'vertical' | 'horizontal' {
    return this.isMultiplayer ? 'horizontal' : 'vertical';
  }

  private _blockWidth = 30;
  private _blockHeight = 30;
  private _previousIsMultiplayer: boolean | null = null;

  private _playerContexts: IPlayerContext[] = [];

  public override game!: Tetris;

  private updateGameMode(): void {
    const mode = this.isMultiplayer ? 'multiplayer' : 'singleplayer';
    const st = this.game.state as TetrisState;
    st.gameMode = mode;
    this.resizeCanvas();
    this.restart();
  }

  private resizeCanvas(): void {
    if (!this._canvas) return;

    if (this.isMultiplayer) {
      this._canvas.width = 900;
      this._canvas.height = 620;
    } else {
      this._canvas.width = 500;
      this._canvas.height = 620;
    }
  }

  private initPlayerContexts(): void {
    this._playerContexts = [];
    for (let i = 0; i < 2; i++) {
      this._playerContexts.push({
        isRotationPressed: false,
        isDropDownPressed: false,
        tickCounter: 0,
        lastMoveTick: 0,
        lastRotationTick: 0,
        moveCooldown: 6,
        rotationCooldown: 12,
        fallTimer: 0,
        currentGravity: 60,
      });
    }
  }

  private getPlayerInput(playerIndex: number, name: string): number {
    return (this.game.players[playerIndex].inputData[name] as number) || 0;
  }

  public override restart(): void {
    this.isStarted = false;
    this.initPlayerContexts();
    this.resetBoard(0);
    this.resetBoard(1);
    this.spawnPiece(0);
    if (this.isMultiplayer) {
      this.spawnPiece(1);
    }
    this.render();
  }

  private resetBoard(index: number): void {
    const st = this.game.state as TetrisState;
    const arr = Array.from({ length: st.rows }, () =>
      Array.from({ length: st.cols }, () => 0)
    );

    const context = this._playerContexts[index];
    if (context) {
      context.fallTimer = 0;
      context.currentGravity = 60;
    }

    if (index === 0) {
      st.board0 = arr;
      st.active0 = null;
      st.nextType0 = Math.floor(Math.random() * 7);
      st.score0 = 0;
      st.level0 = 1;
      st.lines0 = 0;
      st.isGameOver0 = false;
    } else {
      st.board1 = arr;
      st.active1 = null;
      st.nextType1 = Math.floor(Math.random() * 7);
      st.score1 = 0;
      st.level1 = 1;
      st.lines1 = 0;
      st.isGameOver1 = false;
    }
  }

  protected override update(): void {
    super.update();

    if (this._previousIsMultiplayer !== this.isMultiplayer) {
      this._previousIsMultiplayer = this.isMultiplayer;
      this.updateGameMode();
      return;
    }

    if (!this.processStart()) {
      this.render();
      return;
    }

    if (!this.isPaused) {
      const playersToUpdate = this.isMultiplayer ? [0, 1] : [0];
      playersToUpdate.forEach(playerIndex => {
        if (this.processGameOver(playerIndex)) return;

        const context = this._playerContexts[playerIndex];
        context.tickCounter++;
        context.fallTimer++;

        this.processMovement(playerIndex);
        this.processRotation(playerIndex);
        this.processGravity(playerIndex);
        this.processHardDrop(playerIndex);
      });
    }

    this.render();
  }

  private processStart(): boolean {
    if (this.isStarted) return true;

    const willStart =
      this.getPlayerInput(0, 'start') === 1 ||
      this.getPlayerInput(1, 'start') === 1;
    if (willStart) {
      this.isStarted = true;
      if (this.getPlayerInput(0, 'start') === 1)
        this._playerContexts[0].isDropDownPressed = true;
      if (this.getPlayerInput(1, 'start') === 1)
        this._playerContexts[1].isDropDownPressed = true;
      return true;
    }
    return false;
  }

  private processGameOver(playerIndex: number): boolean {
    const st = this.game.state as TetrisState;
    const isGameOver = playerIndex === 0 ? st.isGameOver0 : st.isGameOver1;
    if (!isGameOver) return false;

    const score = playerIndex === 0 ? st.score0 : st.score1;
    if (score > this.playerBestScores[playerIndex])
      this.playerBestScores[playerIndex] = score;

    const startInput = this.getPlayerInput(playerIndex, 'start');
    const context = this._playerContexts[playerIndex];
    const isCurrentlyPressed = startInput === 1;
    if (isCurrentlyPressed && !context.isDropDownPressed) {
      this.resetBoard(playerIndex);
      this.spawnPiece(playerIndex);
      context.isDropDownPressed = true;
      return false;
    }

    context.isDropDownPressed = isCurrentlyPressed;
    return true;
  }

  private processMovement(playerIndex: number): void {
    const moveInput = this.getPlayerInput(playerIndex, 'move');
    const context = this._playerContexts[playerIndex];

    if (context.tickCounter - context.lastMoveTick >= context.moveCooldown) {
      if (moveInput === 1) {
        if (this.tryMove(playerIndex, -1, 0)) {
          context.lastMoveTick = context.tickCounter;
        }
      } else if (moveInput === 2) {
        if (this.tryMove(playerIndex, 1, 0)) {
          context.lastMoveTick = context.tickCounter;
        }
      } else if (moveInput === 4) {
        if (this.tryMove(playerIndex, 0, 1)) {
          context.lastMoveTick = context.tickCounter;
          context.fallTimer = 0;
        }
      }
    }
  }

  private drawPredictedLanding(
    ctx: CanvasRenderingContext2D,
    playerIndex: number,
    startX: number,
    startY: number
  ): void {
    const st = this.game.state as TetrisState;
    const active = playerIndex === 0 ? st.active0 : st.active1;
    if (!active) return;
    let drop = active.y;
    while (
      this.canPlacePiece(
        playerIndex,
        active.type,
        active.rotation,
        active.x,
        drop + 1
      )
    )
      drop += 1;

    const matrix = this.getPieceMatrix(active.type, active.rotation);
    ctx.save();
    ctx.globalAlpha = 0.35;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          const bx = active.x + c;
          const by = drop + r;
          if (by >= 0) {
            this.drawBlock(
              ctx,
              startX + bx * this._blockWidth,
              startY + by * this._blockHeight,
              matrix[r][c]
            );
          }
        }
      }
    }

    ctx.restore();
  }

  private processRotation(playerIndex: number): void {
    const moveInput = this.getPlayerInput(playerIndex, 'move');
    const context = this._playerContexts[playerIndex];
    const isCurrentlyRotating = moveInput === 3;
    if (isCurrentlyRotating) {
      if (!context.isRotationPressed) {
        this.tryRotate(playerIndex);
        context.lastRotationTick = context.tickCounter;
      } else if (
        context.tickCounter - context.lastRotationTick >=
        context.rotationCooldown
      ) {
        this.tryRotate(playerIndex);
        context.lastRotationTick = context.tickCounter;
      }
    }
    context.isRotationPressed = isCurrentlyRotating;
  }

  private processGravity(playerIndex: number): void {
    const context = this._playerContexts[playerIndex];
    const st = this.game.state as TetrisState;
    const level = playerIndex === 0 ? st.level0 : st.level1;
    context.currentGravity = Math.max(5, 60 - (level - 1) * 2);

    if (context.fallTimer >= context.currentGravity) {
      if (this.tryMove(playerIndex, 0, 1)) {
        context.fallTimer = 0;
      } else {
        this.lockPiece(playerIndex);
        this.clearLines(playerIndex);
        this.spawnPiece(playerIndex);
        context.fallTimer = 0;
      }
    }
  }

  private processHardDrop(playerIndex: number): void {
    const startInput = this.getPlayerInput(playerIndex, 'start');
    const context = this._playerContexts[playerIndex];
    const isCurrentlyPressed = startInput === 1;
    const st = this.game.state as TetrisState;
    const isGameOver = playerIndex === 0 ? st.isGameOver0 : st.isGameOver1;
    if (this.isStarted && !isGameOver) {
      if (isCurrentlyPressed && !context.isDropDownPressed) {
        while (this.tryMove(playerIndex, 0, 1));
        this.lockPiece(playerIndex);
        this.clearLines(playerIndex);
        this.spawnPiece(playerIndex);
        context.fallTimer = 0;
      }
    }

    context.isDropDownPressed = isCurrentlyPressed;
  }

  private spawnPiece(playerIndex: number): void {
    const st = this.game.state as TetrisState;
    const next =
      (playerIndex === 0 ? st.nextType0 : st.nextType1) ??
      Math.floor(Math.random() * 7);
    if (playerIndex === 0) st.nextType0 = Math.floor(Math.random() * 7);
    else st.nextType1 = Math.floor(Math.random() * 7);

    const startX = Math.floor(
      (st.cols - this.getPieceMatrix(next, 0)[0].length) / 2
    );
    const startY = 0;

    if (playerIndex === 0)
      st.active0 = { type: next, rotation: 0, x: startX, y: startY };
    else st.active1 = { type: next, rotation: 0, x: startX, y: startY };

    const active = playerIndex === 0 ? st.active0 : st.active1;
    if (!active) return;
    if (
      !this.canPlacePiece(
        playerIndex,
        active.type,
        active.rotation,
        active.x,
        active.y
      )
    ) {
      if (playerIndex === 0) st.isGameOver0 = true;
      else st.isGameOver1 = true;
    }
  }

  private getPieceMatrix(type: number, rotation: number): number[][] {
    const rotations = TETROMINOS[type];
    rotation = rotation % rotations.length;
    return rotations[rotation];
  }

  private canPlacePiece(
    playerIndex: number,
    type: number,
    rotation: number,
    x: number,
    y: number
  ): boolean {
    const st = this.game.state as TetrisState;
    const matrix = this.getPieceMatrix(type, rotation);
    const cols = st.cols;
    const rows = st.rows;
    const boardArr = playerIndex === 0 ? st.board0 : st.board1;
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j] === 0) continue;
        const boardX = x + j;
        const boardY = y + i;
        if (boardX < 0 || boardX >= cols || boardY < 0 || boardY >= rows)
          return false;
        if (boardArr[boardY][boardX] !== 0) return false;
      }
    }
    return true;
  }

  private tryMove(
    playerIndex: number,
    deltaX: number,
    deltaY: number
  ): boolean {
    const st = this.game.state as TetrisState;
    const active = playerIndex === 0 ? st.active0 : st.active1;
    if (!active) return false;

    const newX = active.x + deltaX;
    const newY = active.y + deltaY;

    const canPlace = this.canPlacePiece(
      playerIndex,
      active.type,
      active.rotation,
      newX,
      newY
    );
    if (!canPlace) return false;

    active.x = newX;
    active.y = newY;

    if (playerIndex === 0) st.active0 = active;
    else st.active1 = active;

    return true;
  }

  private tryRotate(playerIndex: number): boolean {
    const st = this.game.state as TetrisState;
    const active = playerIndex === 0 ? st.active0 : st.active1;
    if (!active) return false;
    const newRotation = (active.rotation + 1) % TETROMINOS[active.type].length;

    const tries = [
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
      { x: -2, y: 0 },
      { x: 2, y: 0 },
    ];
    for (const t of tries) {
      if (
        this.canPlacePiece(
          playerIndex,
          active.type,
          newRotation,
          active.x + t.x,
          active.y + t.y
        )
      ) {
        active.rotation = newRotation;
        active.x += t.x;
        active.y += t.y;
        return true;
      }
    }
    return false;
  }

  private lockPiece(playerIndex: number): void {
    const st = this.game.state as TetrisState;
    const active = playerIndex === 0 ? st.active0 : st.active1;
    if (!active) return;
    const matrix = this.getPieceMatrix(active.type, active.rotation);
    const boardArr = playerIndex === 0 ? st.board0 : st.board1;
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j] === 0) continue;
        const boardX = active.x + j;
        const boardY = active.y + i;
        if (
          boardX < st.cols &&
          boardX >= 0 &&
          boardY < st.rows &&
          boardY >= 0
        ) {
          boardArr[boardY][boardX] = matrix[i][j];
        }
      }
    }
    if (playerIndex === 0) st.active0 = null;
    else st.active1 = null;
  }

  private clearLines(playerIndex: number): void {
    const st = this.game.state as TetrisState;
    const boardArr = playerIndex === 0 ? st.board0 : st.board1;
    const cols = st.cols;
    const rows = st.rows;
    const newBoard: number[][] = [];
    let cleared = 0;
    for (let i = 0; i < rows; i++) {
      const isFull = boardArr[i].every(cell => cell !== 0);
      if (isFull) {
        cleared++;
      } else {
        newBoard.push(boardArr[i]);
      }
    }
    while (newBoard.length < rows) {
      newBoard.unshift(Array.from({ length: cols }, () => 0));
    }
    if (cleared > 0) {
      if (playerIndex === 0) st.board0 = newBoard;
      else st.board1 = newBoard;
      const scoreMap: Record<number, number> = {
        1: 100,
        2: 300,
        3: 500,
        4: 800,
      };
      if (playerIndex === 0) st.score0 += scoreMap[cleared] ?? cleared * 200;
      else st.score1 += scoreMap[cleared] ?? cleared * 200;
      if (playerIndex === 0) st.lines0 += cleared;
      else st.lines1 += cleared;
      if (playerIndex === 0) st.level0 = 1 + Math.floor(st.lines0 / 5);
      else st.level1 = 1 + Math.floor(st.lines1 / 5);
    }
  }

  private render(): void {
    if (!this._canvas) return;

    const context = this._canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    if (!this.isMultiplayer) {
      const boardW = this.game.state.cols * this._blockWidth;
      const offsetX = (this._canvas.width - boardW) / 2;
      this.renderBoard(context, 0, offsetX, 10);
    } else {
      const boardW = 10 * this._blockWidth;
      // Player1
      this.renderBoard(context, 0, 50, 10);
      // Player2
      const offsetP2 = this._canvas.width - boardW - 100;
      this.renderBoard(context, 1, offsetP2, 10);
    }
  }
  private renderBoard(
    ctx: CanvasRenderingContext2D,
    playerIndex: number,
    startX: number,
    startY: number
  ): void {
    const st = this.game.state as TetrisState;
    const cols = st.cols;
    const rows = st.rows;
    const bw = this._blockWidth;
    const bh = this._blockHeight;

    ctx.fillStyle = '#000';
    ctx.fillRect(startX, startY, cols * bw, rows * bh);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    for (let i = 0; i <= rows; i++) {
      ctx.moveTo(startX, startY + i * bh);
      ctx.lineTo(startX + cols * bw, startY + i * bh);
    }
    for (let j = 0; j <= cols; j++) {
      ctx.moveTo(startX + j * bw, startY);
      ctx.lineTo(startX + j * bw, startY + rows * bh);
    }
    ctx.stroke();
    const boardArr = playerIndex === 0 ? st.board0 : st.board1;
    for (let r = 0; r < rows; r++) {
      if (!boardArr[r]) continue;
      for (let c = 0; c < cols; c++) {
        if (boardArr[r][c] !== 0) {
          this.drawBlock(ctx, startX + c * bw, startY + r * bh, boardArr[r][c]);
        }
      }
    }
    this.drawPredictedLanding(ctx, playerIndex, startX, startY);

    const active = playerIndex === 0 ? st.active0 : st.active1;
    if (active) {
      const matrix = this.getPieceMatrix(active.type, active.rotation);
      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] !== 0) {
            const bx = active.x + c;
            const by = active.y + r;
            if (by >= 0) {
              this.drawBlock(
                ctx,
                startX + bx * bw,
                startY + by * bh,
                matrix[r][c]
              );
            }
          }
        }
      }
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, cols * bw, rows * bh);
    ctx.lineWidth = 1;

    const isGameOver = playerIndex === 0 ? st.isGameOver0 : st.isGameOver1;
    if (isGameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillRect(startX, startY + (rows * bh) / 2 - 40, cols * bw, 80);
      ctx.fillStyle = 'red';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'GAME OVER',
        startX + (cols * bw) / 2,
        startY + (rows * bh) / 2 + 10
      );
    }
    const previewX = startX + cols * bw + 10;
    const previewY = startY;
    const nextType = playerIndex === 0 ? st.nextType0 : st.nextType1;
    this.renderPreview(ctx, nextType, previewX, previewY);
  }

  private drawBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    colorIndex: number
  ): void {
    ctx.fillStyle = TETRIS_COLORS[colorIndex] || '#888';
    ctx.fillRect(x + 1, y + 1, this._blockWidth - 2, this._blockHeight - 2);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x + 1, y + 1, this._blockWidth - 2, 4);
  }

  private renderPreview(
    ctx: CanvasRenderingContext2D,
    type: number,
    x: number,
    y: number
  ): void {
    ctx.fillStyle = '#222';
    ctx.fillRect(x, y, 80, 80);
    ctx.strokeStyle = '#555';
    ctx.strokeRect(x, y, 80, 80);

    const matrix = this.getPieceMatrix(type, 0);
    const miniBlockSize = 15;
    const offsetX = x + (80 - matrix[0].length * miniBlockSize) / 2;
    const offsetY = y + (80 - matrix.length * miniBlockSize) / 2;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] !== 0) {
          ctx.fillStyle = TETRIS_COLORS[matrix[r][c]] || '#999';
          ctx.fillRect(
            offsetX + c * miniBlockSize,
            offsetY + r * miniBlockSize,
            miniBlockSize - 1,
            miniBlockSize - 1
          );
        }
      }
    }
  }
}
