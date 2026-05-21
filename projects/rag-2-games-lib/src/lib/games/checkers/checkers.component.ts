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
      <label class="ml-4"><input type="checkbox" [(ngModel)]="game.isRotationEnabled"> Rotate each turn</label>
    </div>
    <app-canvas [displayMode]="'horizontal'" #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b> `,
})
export class CheckersGameWindowComponent extends BaseGameWindowComponent implements OnInit, AfterViewInit {
  public override game!: Checkers;
  private _squareSize = 0;
  private _boardOrigin = { x: 0, y: 0 };
  private _labelMargin = 0;

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
    const minSide = Math.min(this._canvas.width, this._canvas.height);
    this._labelMargin = Math.floor(minSide * 0.09);

    const boardSize = minSide - this._labelMargin * 2;
    this._squareSize = Math.floor(boardSize / 8);

    const actualBoardSize = this._squareSize * 8;
    this._boardOrigin.x = Math.floor((this._canvas.width - actualBoardSize) / 2);
    this._boardOrigin.y = Math.floor((this._canvas.height - actualBoardSize) / 2);
  }

    private drawNotation(ctx: CanvasRenderingContext2D, shouldRotate: boolean): void {
    const fontSize = Math.max(20, Math.floor(this._squareSize * 0.26));
    const offset = Math.floor(this._labelMargin * 0.55);

    ctx.fillStyle = '#2f3148';
    ctx.font = `${fontSize}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const drawText = (text: string, x: number, y: number): void => {
      if (shouldRotate) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(Math.PI);
        ctx.fillText(text, 0, 0);
        ctx.restore();
        return;
      }
      ctx.fillText(text, x, y);
    };

    for (let c = 0; c < 8; c++) {
      const letter = String.fromCharCode(97 + c);
      const cx = this._boardOrigin.x + c * this._squareSize + this._squareSize / 2;
      drawText(letter, cx, this._boardOrigin.y - offset);
      drawText(letter, cx, this._boardOrigin.y + this._squareSize * 8 + offset);
    }

    for (let r = 0; r < 8; r++) {
      const num = (8 - r).toString();
      const cy = this._boardOrigin.y + r * this._squareSize + this._squareSize / 2;
      drawText(num, this._boardOrigin.x - offset, cy);
      drawText(num, this._boardOrigin.x + this._squareSize * 8 + offset, cy);
    }
  }

    private drawPiece(ctx: CanvasRenderingContext2D, piece: string, cx: number, cy: number, radius: number): void {
    const isWhite = piece.toLowerCase() === 'w';

    const base = isWhite ? '#f3e3d9' : '#3f4a86';
    const edge = isWhite ? '#e6d1c7' : '#2a2f5f';
    const highlight = isWhite ? '#f9f2ed' : '#4f5aa1';

    const size = 16;
    const r = size * 0.42;
    const center = (size - 1) / 2;

    const off = document.createElement('canvas');
    off.width = size;
    off.height = size;
    const octx = off.getContext('2d');
    if (!octx) return;

    octx.fillStyle = base;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        if (dx * dx + dy * dy <= r * r) {
          octx.fillRect(x, y, 1, 1);
        }
      }
    }

    octx.fillStyle = edge;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center;
        const dy = y - center;
        const d2 = dx * dx + dy * dy;
        if (d2 <= r * r && d2 >= (r - 1.2) * (r - 1.2)) {
          octx.fillRect(x, y, 1, 1);
        }
      }
    }

    octx.fillStyle = highlight;
    const hx = Math.floor(center - 2);
    const hy = Math.floor(center - 2);
    octx.fillRect(hx, hy, 2, 2);

    const drawSize = Math.floor(radius * 2);
    const dx = Math.floor(cx - drawSize / 2);
    const dy = Math.floor(cy - drawSize / 2);

    if (piece === 'W' || piece === 'B') {
      const crownOuter = '#d9b77b'
      const crownInner = '#f0d7a1'

      octx.fillStyle = crownOuter;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = x - center;
          const dy = y - center;
          const d2 = dx * dx + dy * dy;
          if (d2 <= (r - 2.2) * (r - 2.2) && d2 >= (r - 3.4) * (r - 3.4)) {
            octx.fillRect(x, y, 1, 1);
          }
        }
      }

      octx.fillStyle = crownInner;
      octx.fillRect(Math.floor(center - 1), Math.floor(center - 1), 3, 3);
    }
    
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, dx, dy, drawSize, drawSize);
    ctx.restore();
  }

  private render(): void {
    const ctx = this._canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this.computeBoardLayout();

    ctx.fillStyle = '#5b5f93';
    ctx.fillRect(
      this._boardOrigin.x - this._labelMargin,
      this._boardOrigin.y - this._labelMargin,
      this._squareSize * 8 + this._labelMargin * 2,
      this._squareSize * 8 + this._labelMargin * 2
    );

    ctx.strokeStyle = '#2a2b55';
    ctx.lineWidth = Math.max(2, Math.floor(this._squareSize * 0.08));
    ctx.strokeRect(
      this._boardOrigin.x - this._labelMargin + ctx.lineWidth / 2,
      this._boardOrigin.y - this._labelMargin + ctx.lineWidth / 2,
      this._squareSize * 8 + this._labelMargin * 2 - ctx.lineWidth,
      this._squareSize * 8 + this._labelMargin * 2 - ctx.lineWidth
    );

    ctx.strokeStyle = 'rgba(140,145,190,0.9)';
    ctx.lineWidth = Math.max(1, Math.floor(this._squareSize * 0.04));
    ctx.strokeRect(
      this._boardOrigin.x - this._labelMargin + ctx.lineWidth * 2,
      this._boardOrigin.y - this._labelMargin + ctx.lineWidth * 2,
      this._squareSize * 8 + this._labelMargin * 2 - ctx.lineWidth * 4,
      this._squareSize * 8 + this._labelMargin * 2 - ctx.lineWidth * 4
    );

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
        ctx.fillStyle = isDark ? '#b78996' : '#e6c2ab';
        ctx.fillRect(x, y, this._squareSize, this._squareSize);
      }
    }

    this.drawNotation(ctx, this.getShouldRotate());
    
    

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

    const cursor = this.game.state.cursor;
    ctx.strokeStyle = 'rgba(59,130,246,0.9)';
    ctx.lineWidth = 3.5;
    ctx.strokeRect(
      this._boardOrigin.x + cursor.c * this._squareSize + 2,
      this._boardOrigin.y + cursor.r * this._squareSize + 2,
      this._squareSize - 4,
      this._squareSize - 4
    );

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
        this.drawPiece(ctx, piece, cx, cy, radius);
        
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