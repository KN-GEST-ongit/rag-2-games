/* eslint-disable complexity */
/* eslint-disable max-lines */
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Checkers, CheckersState, posToKey, keyToPos, ICaptureMove } from './models/checkers.class';
import { TExchangeData } from '../../models/exchange-data.type';

@Component({
  selector: 'app-checkers',
  standalone: true,
  imports: [CanvasComponent, FormsModule],
  template: `
    <div class="game-info">
      Turn: <b>{{ game.state.currentPlayer }}</b>
      <button class="px-3 py-1 ml-4 bg-mainOrange" (click)="restart()">Restart</button>
      <label class="ml-4"><input type="checkbox" [(ngModel)]="game.isRotationEnabled"> Rotate each turn</label>
    </div>
    <app-canvas [displayMode]="'horizontal'" #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b> `,
})
export class CheckersGameWindowComponent extends BaseGameWindowComponent implements OnInit, AfterViewInit {
  public override game!: Checkers;
  private _squareSize = 0;
  private _boardOrigin = { x: 0, y: 0 };

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Checkers;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.render();
  }

  public override restart(): void {
    this.game.state = new CheckersState();
    this.render();
  }

  private getShouldRotate(): boolean {
    return !!this.game.isRotationEnabled && this.game.state.currentPlayer === 'BLACK';
  }

  protected override update(): void {
    super.update();
    if (!this.isPaused) {
      this.handleInput();
    }
    this.render();
  }

  private handleInput(): void {
    const state = this.game.state;
    const input = this.getCurrentTurnInput();

    const rawMove = (input['move'] as number) || 0;
    const action = (input['action'] as number) || 0;

    if (rawMove !== 0) {
      input['move'] = 0;
    }
    if (action !== 0) {
      input['action'] = 0;
    }

    if (state.isGameOver) {
      return;
    }

    const move = this.translateMoveIfRotated(rawMove);

    if (move !== 0) {
      this.moveCursor(move);
    }

    if (action === 1) {
      this.handleSelectOrConfirm();
    } else if (action === 3) {
      this.game.clearSelection();
    }
  }

  private getCurrentTurnInput(): TExchangeData {
    const playerIndex = this.game.state.currentPlayer === 'WHITE' ? 0 : 1;
    const currentPlayer = this.game.players[playerIndex] ?? this.game.players[0];
    return currentPlayer?.inputData ?? {};
  }

  private translateMoveIfRotated(move: number): number {
    if (!this.getShouldRotate()) return move;
    if (move === 1) return 4;
    if (move === 2) return 3;
    if (move === 3) return 2;
    if (move === 4) return 1;
    return move;
  }

  private moveCursor(move: number): void {
    const cur = this.game.state.cursor;
    let r = cur.r;
    let c = cur.c;

    if (move === 1) { r -= 1; c -= 1; }
    if (move === 2) { r -= 1; c += 1; } 
    if (move === 3) { r += 1; c -= 1; } 
    if (move === 4) { r += 1; c += 1; }

    if (r < 0 || r > 7 || c < 0 || c > 7) {
      return;
    }

    this.game.state.cursor = { r, c };
  }

  private handleSelectOrConfirm(): void {
    const state = this.game.state;
    const key = posToKey(state.cursor.r, state.cursor.c);
    const piece = this.game.getPiece(key);
    const currentPlayer = state.currentPlayer;

    const maxCapturingPieces = this.game.getPiecesWithMaxCaptures(currentPlayer);

    if (!state.selected) {
      if (maxCapturingPieces.length > 0) {
        if (piece && this.game.pieceColor(piece) === currentPlayer && maxCapturingPieces.includes(key)) {
          state.selected = key;
          state.possibleMoves = this.game.computeMovesFor(key);
        }
        return;
      }
      if (piece && this.game.pieceColor(piece) === currentPlayer) {
        state.selected = key;
        state.possibleMoves = this.game.computeMovesFor(key);
      }
      return;
    }

    const selectedKey = state.selected;

    if (selectedKey === key) {
      this.game.clearSelection();
      return;
    }

    if (piece && this.game.pieceColor(piece) === currentPlayer) {
      if (maxCapturingPieces.length > 0 && !maxCapturingPieces.includes(key)) {
        return;
      }
      state.selected = key;
      state.possibleMoves = this.game.computeMovesFor(key);
      return;
    }

    const moves = state.possibleMoves as (string | ICaptureMove)[];
    const found = moves.find(m => (typeof m === 'string' ? m === key : m.dst === key));

    if (!found) {
      this.game.clearSelection();
      return;
    }

    if (typeof found === 'string' && maxCapturingPieces.length > 0) {
      return;
    }

    this.game.executeMove(selectedKey, found);
  }

  private computeBoardLayout(): void {
    const size = this._canvas.height;
    this._squareSize = Math.floor(size / 8);
    this._boardOrigin.x = Math.floor((this._canvas.width - this._squareSize * 8) / 2);
    this._boardOrigin.y = Math.floor((this._canvas.height - this._squareSize * 8) / 2);
  }

  private render(): void {
    const ctx = this._canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this.computeBoardLayout();

    ctx.save();
    ctx.translate(this._boardOrigin.x + (this._squareSize * 8) / 2, this._boardOrigin.y + (this._squareSize * 8) / 2);
    if (this.getShouldRotate()) {
      ctx.rotate(Math.PI);
    }
    ctx.translate(-(this._boardOrigin.x + (this._squareSize * 8) / 2), -(this._boardOrigin.y + (this._squareSize * 8) / 2));

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const x = this._boardOrigin.x + c * this._squareSize;
        const y = this._boardOrigin.y + r * this._squareSize;
        const isDark = (r + c) % 2 === 1;
        ctx.fillStyle = isDark ? '#7b5e3b' : '#e8d7c3';
        ctx.fillRect(x, y, this._squareSize, this._squareSize);
      }
    }

    const cursor = this.game.state.cursor;
    ctx.strokeStyle = 'rgba(59,130,246,0.9)';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      this._boardOrigin.x + cursor.c * this._squareSize + 2,
      this._boardOrigin.y + cursor.r * this._squareSize + 2,
      this._squareSize - 4,
      this._squareSize - 4
    );

    if (this.game.state.selected) {
      const p = keyToPos(this.game.state.selected);
      ctx.fillStyle = 'rgba(255,255,0,0.35)';
      ctx.fillRect(this._boardOrigin.x + p.c * this._squareSize, this._boardOrigin.y + p.r * this._squareSize, this._squareSize, this._squareSize);
    }

    for (const m of this.game.state.possibleMoves as (string | ICaptureMove)[]) {
      if (typeof m === 'string') {
        const p = keyToPos(m);
        const cx = this._boardOrigin.x + p.c * this._squareSize + this._squareSize / 2;
        const cy = this._boardOrigin.y + p.r * this._squareSize + this._squareSize / 2;
        ctx.fillStyle = 'rgba(50,205,50,0.7)';
        ctx.beginPath();
        ctx.arc(cx, cy, this._squareSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const pd = keyToPos(m.dst);
        ctx.fillStyle = 'rgba(255,80,80,0.7)';
        ctx.beginPath();
        ctx.arc(this._boardOrigin.x + pd.c * this._squareSize + this._squareSize / 2, this._boardOrigin.y + pd.r * this._squareSize + this._squareSize / 2, this._squareSize * 0.16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,50,50,0.9)';
        ctx.lineWidth = 2;
        for (const cap of m.captures) {
          const pc = keyToPos(cap);
          ctx.strokeRect(this._boardOrigin.x + pc.c * this._squareSize + 2, this._boardOrigin.y + pc.r * this._squareSize + 2, this._squareSize - 4, this._squareSize - 4);
        }
      }
    }

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const key = posToKey(r, c);
        const piece = this.game.getPiece(key);
        if (!piece) {
          continue;
        }
        const cx = this._boardOrigin.x + c * this._squareSize + this._squareSize / 2;
        const cy = this._boardOrigin.y + r * this._squareSize + this._squareSize / 2;
        const radius = this._squareSize * 0.38;
        ctx.beginPath();
        ctx.fillStyle = piece.toLowerCase() === 'w' ? '#fff' : '#000';
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#333';
        ctx.stroke();
        if (piece === 'W' || piece === 'B') {
          ctx.fillStyle = piece.toLowerCase() === 'w' ? '#222' : '#fff';
          ctx.font = `${Math.floor(radius)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('K', cx, cy);
        }
      }
    }

    ctx.restore();

    if (this.game.state.isGameOver) {
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
      ctx.fillStyle = '#fff';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Game Over - Winner: ${this.game.state.winner}`, this._canvas.width / 2, this._canvas.height / 2);
    }
  }
}