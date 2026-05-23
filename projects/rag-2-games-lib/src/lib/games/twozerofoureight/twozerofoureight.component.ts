/* eslint-disable max-lines */
/* eslint-disable complexity */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import {
  Twozerofoureight,
  TwozerofoureightState,
} from './models/twozerofoureight.class';
import { PlayerSourceType } from '../../models/player-source-type.enum';

type TMoveDir = 'left' | 'right' | 'up' | 'down';
type TTileAnimType = 'spawn' | 'merge';

interface ITileAnim {
  r: number;
  c: number;
  type: TTileAnimType;
  startTime: number;
  duration: number;
}

@Component({
  selector: 'app-twozerofoureight',
  standalone: true,
  imports: [CanvasComponent, NgIf],
  template: `
    <div class="game-info">
      Score: <b>{{ game.state.score }}</b> | Best:
      <b>{{ game.state.bestScore }}</b>
    </div>

    <div class="game-shell" [class.is-win-overlay]="game.state.hasWon && !hasWinAcknowledged">
      <app-canvas [displayMode]="'horizontal'" #gameCanvas></app-canvas>

      <div class="win-overlay" *ngIf="game.state.hasWon && !hasWinAcknowledged">
        <div class="win-text">
          You reached 2048
          <div class="win-sub">Press any key to continue playing</div>
        </div>
      </div>
    </div>

    <b>FPS: {{ fps }}</b>
  `,
  styles: [`
  .game-shell {
    position: relative;
    display: inline-block;
  }

  .game-shell.is-win-overlay canvas {
    filter: blur(6px);
  }

  .win-overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.25);
    pointer-events: none;
  }

  .win-text {
    color: #f9f6f2;
    font-size: 32px;
    font-weight: 700;
    text-align: center;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  }

  .win-sub {
    margin-top: 6px;
    font-size: 16px;
    opacity: 0.9;
  }
`],
})
export class TwozerofoureightGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public override game!: Twozerofoureight;

  private _lastMove = 0;
  public hasWinAcknowledged = false;
  private _tileAnims: ITileAnim[] = [];
  private _animDuration = 160;
  private _gameOverAt = 0;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Twozerofoureight;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.resetGame();
    this.render();
  }

  public override ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  public override restart(): void {
    const best = this.game.state.bestScore;
    this.game.state = new TwozerofoureightState();
    this.game.state.bestScore = best;
    this.resetGame();
  }

  protected override update(): void {
    super.update();

    if (!this.isPaused) {
      this.processMoveInput();
    }

    this.render();
  }

  private resetGame(): void {
    const st = this.game.state;
    st.grid = Array.from({ length: st.size }, () =>
      Array.from({ length: st.size }, () => 0)
    );
    st.score = 0;
    this._gameOverAt = 0;
    st.isGameOver = false;
    st.hasWon = false;
    this._lastMove = 0;
    this.hasWinAcknowledged = false;
    this._tileAnims = [];

    this.spawnRandomTile();
    this.spawnRandomTile();
  }

  private processMoveInput(): void {
    const player = this.game.players[0];
    const move = Number(player.inputData['move'] ?? 0);
    const isSocket = player.playerType === PlayerSourceType.SOCKET;
    
    if (this.game.state.isGameOver) {
      if (move === 0) {
        this._lastMove = 0;
        return;
      }

      if (!isSocket) {
        if (move === this._lastMove) return;
        this._lastMove = move;
      }

      if (performance.now() - this._gameOverAt < 150) return;

      this.restart();
      return;
    }

    if (move === 0) {
      this._lastMove = 0;
      return;
    }

    if (!isSocket) {
      if (move === this._lastMove) return;
      this._lastMove = move;
    }  

    if (this.game.state.hasWon && !this.hasWinAcknowledged) {
      this.hasWinAcknowledged = true;
      return;
    }

    const direction = this.mapMoveToDirection(move);
    if (!direction) return;

    const isMoved = this.tryMove(direction);
    if (isMoved) {
      this.spawnRandomTile();
      this.updateGameOverState();
    }

  }

  private mapMoveToDirection(value: number): TMoveDir | null {
    switch (value) {
      case 1:
        return 'right';
      case 2:
        return 'left';
      case 3:
        return 'down';
      case 4:
        return 'up';
      default:
        return null;
    }
  }

  private tryMove(dir: TMoveDir): boolean {
    const st = this.game.state;
    const size = st.size;
    let isMoved = false;
    let gained = 0;
    const grid = this.cloneGrid(st.grid);

    if (dir === 'left' || dir === 'right') {
      for (let r = 0; r < size; r++) {
        const originalRow = grid[r].slice();
        const line =
          dir === 'right' ? originalRow.slice().reverse() : originalRow;
        const result = this.slideAndMerge(line);
        const finalLine =
          dir === 'right' ? result.line.reverse() : result.line;

        if (!this.linesEqual(originalRow, finalLine)) isMoved = true;
        grid[r] = finalLine;

        for (let i = 0; i < size; i++) {
          if (finalLine[i] !== 0 && finalLine[i] > originalRow[i]) {
            this._tileAnims.push({
              r,
              c: i,
              type: 'merge',
              startTime: performance.now(),
              duration: this._animDuration,
            });
          }
        }

        gained += result.score;
      }
    } else {
      for (let c = 0; c < size; c++) {
        const originalCol: number[] = [];
        for (let r = 0; r < size; r++) originalCol.push(grid[r][c]);

        const line =
          dir === 'down' ? originalCol.slice().reverse() : originalCol;
        const result = this.slideAndMerge(line);
        const finalLine =
          dir === 'down' ? result.line.reverse() : result.line;

        for (let r = 0; r < size; r++) {
          if (grid[r][c] !== finalLine[r]) isMoved = true;
          grid[r][c] = finalLine[r];
        }

        for (let r = 0; r < size; r++) {
          if (finalLine[r] !== 0 && finalLine[r] > originalCol[r]) {
            this._tileAnims.push({
              r,
              c,
              type: 'merge',
              startTime: performance.now(),
              duration: this._animDuration,
            });
          }
        }

        gained += result.score;
      }
    }

    if (isMoved) {
      st.grid = grid;
      st.score += gained;
      if (st.score > st.bestScore) st.bestScore = st.score;
      if (this.containsValue(st.grid, 2048)) st.hasWon = true;
    }

    return isMoved;
  }

  private slideAndMerge(line: number[]): { line: number[]; score: number } {
    const size = line.length;
    const nonZero = line.filter(v => v !== 0);
    const result: number[] = [];
    let score = 0;

    for (let i = 0; i < nonZero.length; i++) {
      if (i + 1 < nonZero.length && nonZero[i] === nonZero[i + 1]) {
        const merged = nonZero[i] * 2;
        result.push(merged);
        score += merged;
        i++;
      } else {
        result.push(nonZero[i]);
      }
    }

    while (result.length < size) result.push(0);
    return { line: result, score };
  }

  private updateGameOverState(): void {
    const st = this.game.state;
    if (this.hasMovesAvailable(st.grid)) {
      st.isGameOver = false;
      return;
    }
    st.isGameOver = true;
    this._gameOverAt = performance.now();
  }

  private hasMovesAvailable(grid: number[][]): boolean {
    const size = grid.length;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === 0) return true;
        if (r + 1 < size && grid[r][c] === grid[r + 1][c]) return true;
        if (c + 1 < size && grid[r][c] === grid[r][c + 1]) return true;
      }
    }
    return false;
  }

  private spawnRandomTile(): void {
    const st = this.game.state;
    const empty: { r: number; c: number }[] = [];
    for (let r = 0; r < st.size; r++) {
      for (let c = 0; c < st.size; c++) {
        if (st.grid[r][c] === 0) empty.push({ r, c });
      }
    }

    if (empty.length === 0) return;

    const pick = empty[Math.floor(Math.random() * empty.length)];
    st.grid[pick.r][pick.c] = Math.random() < 0.9 ? 2 : 4;

    this._tileAnims.push({
      r: pick.r,
      c: pick.c,
      type: 'spawn',
      startTime: performance.now(),
      duration: this._animDuration,
    });
  }

  private containsValue(grid: number[][], value: number): boolean {
    for (const row of grid) {
      if (row.includes(value)) return true;
    }
    return false;
  }

  private linesEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  private cloneGrid(grid: number[][]): number[][] {
    return grid.map(row => row.slice());
  }

  private render(): void {
    if (!this._canvas) return;
    const ctx = this._canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    const st = this.game.state;
    const boardSize = Math.min(this._canvas.height - 40, this._canvas.width - 40);
    const gap = Math.floor(boardSize * 0.03);
    const tileSize = (boardSize - gap * (st.size + 1)) / st.size;

    const startX = (this._canvas.width - boardSize) / 2;
    const startY = (this._canvas.height - boardSize) / 2;

    ctx.fillStyle = '#bbada0';
    this.drawRoundedRect(ctx, startX, startY, boardSize, boardSize, 12);
    ctx.fill();

    for (let r = 0; r < st.size; r++) {
      for (let c = 0; c < st.size; c++) {
        const x = startX + gap + c * (tileSize + gap);
        const y = startY + gap + r * (tileSize + gap);
        const value = st.grid[r][c];

        const scale = value !== 0 ? this.getTileScale(r, c) : 1;
        const scaledSize = tileSize * scale;
        const offset = (tileSize - scaledSize) / 2;

        ctx.fillStyle = this.getTileColor(value);
        this.drawRoundedRect(
          ctx,
          x + offset,
          y + offset,
          scaledSize,
          scaledSize,
          8 * scale
        );
        ctx.fill();

        if (value !== 0) {
          ctx.fillStyle = value <= 4 ? '#776e65' : '#f9f6f2';
          const digits = value.toString().length;
          const base = tileSize * 0.5;
          const fontSize = Math.max(
            16,
            base - (digits - 2) * (tileSize * 0.06)
          );

          ctx.font = `bold ${Math.floor(fontSize * scale)}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            String(value),
            x + tileSize / 2,
            y + tileSize / 2
          );
        }
      }
    }

    if (st.isGameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(startX, startY, boardSize, boardSize);
      ctx.fillStyle = '#f9f6f2';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        'GAME OVER',
        startX + boardSize / 2,
        startY + boardSize / 2
      );
      ctx.font = '18px Arial';
      ctx.fillText(
        'Press any key to restart',
        startX + boardSize / 2,
        startY + boardSize / 2 + 34
      );
    }

    const now = performance.now();
    this._tileAnims = this._tileAnims.filter(
      a => now - a.startTime < a.duration
    );
  }

  private getTileScale(r: number, c: number): number {
    let anim: ITileAnim | undefined;
    for (let i = this._tileAnims.length - 1; i >= 0; i--) {
      const a = this._tileAnims[i];
      if (a.r === r && a.c === c) {
        anim = a;
        break;
      }
    }
    if (!anim) return 1;

    const t = (performance.now() - anim.startTime) / anim.duration;
    if (t >= 1) return 1;

    const from = anim.type === 'spawn' ? 0.6 : 1.15;
    const eased = this.easeOutCubic(t);
    return from + (1 - from) * eased;
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ): void {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  private getTileColor(value: number): string {
    if (value === 0) return '#cdc1b4';
    if (value <= 131072) {
      const colors: Record<number, string> = {
        2: '#eee4da',
        4: '#ede0c8',
        8: '#f2b179',
        16: '#f59563',
        32: '#f67c5f',
        64: '#f65e3b',
        128: '#edcf72',
        256: '#edcc61',
        512: '#edc850',
        1024: '#edc53f',
        2048: '#edc22e',
        4096: '#3e5a92',
        8192: '#4468a3',
        16384: '#4a77b3',
        32768: '#5086c4',
        65536: '#5a96d6',
        131072: '#66a6e8',
      };
      return colors[value] ?? '#3c3a32';
    }
    return '#171716';
  }
} 