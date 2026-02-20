/* eslint-disable max-lines */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Abalone, AbaloneState, ICubeCoords } from './models/abalone.class';

@Component({
  selector: 'app-abalone',
  standalone: true,
  imports: [CanvasComponent, NgIf],
  template: `
    <div class="game-info">
      Tura: <b [style.color]="game.state.currentPlayer === 'BLACK' ? 'black' : 'gray'">
        {{ game.state.currentPlayer }}
      </b> | 
      Punkty - Czarne: <b>{{ game.state.deadMarbles.WHITE }}</b>, 
      Białe: <b>{{ game.state.deadMarbles.BLACK }}</b> |
      Faza: <b>{{ game.state.phase === 'SELECT' ? 'Zaznaczanie' : 'Ruch' }}</b>
    </div>
    <div class="game-hint" *ngIf="!game.state.isGameOver">
      {{ game.state.phase === 'SELECT'
        ? 'Space: zaznacz/odznacz | Enter: zatwierdź wybór | Esc: anuluj'
        : 'Q/W/E/D/S/A: wykonaj ruch | Esc: wróć' }}
    </div>
    <div class="game-over" *ngIf="game.state.isGameOver" style="color: #2200ff; font-size: 1.2em; font-weight: bold;">
      Koniec gry! Wygrywa: {{ game.state.winner === 'BLACK' ? 'Czarne' : 'Białe' }}!
    </div>
    <app-canvas [displayMode]="'horizontal'" #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b>
  `,
})
export class AbaloneGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public override game!: Abalone;
  private readonly HEX_SIZE = 30;

  private _moveQueue: number[] = [];
  private _actionQueue: number[] = [];

  private readonly keyToMoveMap: Record<string, number> = {
    'q': 1, 'w': 2, 'e': 3,
    'd': 4, 's': 5, 'a': 6
  };

  private readonly keyToActionMap: Record<string, number> = {
    ' ': 1,
    'Enter': 2,
    'Escape': 3
  };

  private readonly directions: Record<number, ICubeCoords> = {
    1: { x: 0, y: -1, z: 1 },
    2: { x: 1, y: -1, z: 0 },
    3: { x: 1, y: 0, z: -1 },
    4: { x: 0, y: 1, z: -1 },
    5: { x: -1, y: 1, z: 0 },
    6: { x: -1, y: 0, z: 1 }
  };

  // 6 znormalizowanych kierunków osi hex (używane do walidacji linii)
  private readonly HEX_AXIS_DIRS: ICubeCoords[] = [
    { x: 1, y: -1, z: 0 },
    { x: 1, y: 0, z: -1 },
    { x: 0, y: 1, z: -1 },
  ];

  private readonly _dirKeyLabels: Record<number, string> = {
    1: 'Q', 2: 'W', 3: 'E', 4: 'D', 5: 'S', 6: 'A'
  };

  private _boundKeyHandler = (e: KeyboardEvent): void => this.onAbaloneKeyDown(e);

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Abalone;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    window.addEventListener('keydown', this._boundKeyHandler);
    this.render();
  }

  public override ngOnDestroy(): void {
    window.removeEventListener('keydown', this._boundKeyHandler);
    super.ngOnDestroy();
  }

  public override restart(): void {
    this.game.state = new AbaloneState();
    this._moveQueue = [];
    this._actionQueue = [];
  }

  private onAbaloneKeyDown(event: KeyboardEvent): void {
    if (this.isPaused || this.game.state.isGameOver) return;

    let moveDir = this.keyToMoveMap[event.key];
    if (moveDir !== undefined) {
      // Odwróć kierunek gdy plansza jest obrócona (tura białych)
      if (this.game.state.currentPlayer === 'WHITE') {
        moveDir = ((moveDir - 1 + 3) % 6) + 1;
      }
      this._moveQueue.push(moveDir);
      return;
    }

    const actionId = this.keyToActionMap[event.key];
    if (actionId !== undefined) {
      this._actionQueue.push(actionId);
    }
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

    if (state.phase === 'SELECT') {
      this.handleSelectPhaseInput();
    } else if (state.phase === 'MOVE') {
      this.handleMovePhaseInput();
    }
  }

  private handleSelectPhaseInput(): void {
    const moveDir = this._moveQueue.shift();
    if (moveDir !== undefined) {
      this.moveCursor(moveDir);
    }

    const action = this._actionQueue.shift();
    if (action !== undefined) {
      this.handleAction(action);
    }
  }

  private handleMovePhaseInput(): void {
    const state = this.game.state;

    const dir = this._moveQueue.shift();
    if (dir !== undefined && state.possibleMoves.includes(dir)) {
      this.executeMove(dir);
    }

    const action = this._actionQueue.shift();
    if (action === 3) {
      state.phase = 'SELECT';
      state.possibleMoves = [];
    }
  }

  private moveCursor(dirIdx: number): void {
    const d = this.directions[dirIdx];
    if (!d) return;

    const cur = this.game.state.cursor;
    const next = { x: cur.x + d.x, y: cur.y + d.y, z: cur.z + d.z };

    if (Math.max(Math.abs(next.x), Math.abs(next.y), Math.abs(next.z)) <= 4) {
      this.game.state.cursor = next;
    }
  }

  private handleAction(action: number): void {
    const state = this.game.state;
    const currentKey = `${state.cursor.x},${state.cursor.y},${state.cursor.z}`;

    if (action === 1) {
      this.toggleSelection(currentKey);
    } else if (action === 2) {
      if (state.selectedMarbles.length > 0) {
        this.enterMovePhase();
      }
    } else if (action === 3) {
      state.selectedMarbles = [];
    }
  }

  private toggleSelection(key: string): void {
    const state = this.game.state;
    const colorAtCursor = state.board.get(key);

    if (colorAtCursor !== state.currentPlayer) return;

    const idx = state.selectedMarbles.indexOf(key);

    // Odznacz jeśli już zaznaczona
    if (idx > -1) {
      state.selectedMarbles.splice(idx, 1);
      return;
    }

    if (state.selectedMarbles.length >= 3) return;

    this.addToSelection(key);
  }

  private addToSelection(key: string): void {
    const state = this.game.state;

    if (state.selectedMarbles.length === 0) {
      // Pierwsza kulka — zawsze OK
      state.selectedMarbles.push(key);
    } else if (state.selectedMarbles.length === 1) {
      this.tryAddSecondMarble(key);
    } else if (state.selectedMarbles.length === 2) {
      this.tryAddThirdMarble(key);
    }
  }

  private tryAddSecondMarble(key: string): void {
    const state = this.game.state;
    const first = this.keyToCoords(state.selectedMarbles[0]);
    const next = this.keyToCoords(key);
    if (this.areNeighbors(first, next)) {
      state.selectedMarbles.push(key);
    }
  }

  private tryAddThirdMarble(key: string): void {
    const state = this.game.state;
    const c0 = this.keyToCoords(state.selectedMarbles[0]);
    const c1 = this.keyToCoords(state.selectedMarbles[1]);
    const c2 = this.keyToCoords(key);
    if (this.areInLine(c0, c1, c2)) {
      state.selectedMarbles.push(key);
    }
  }

  private areNeighbors(a: ICubeCoords, b: ICubeCoords): boolean {
    return this.cubeDistance(a, b) === 1;
  }

  private cubeDistance(a: ICubeCoords, b: ICubeCoords): number {
    return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z)) / 2;
  }


  private areInLine(a: ICubeCoords, b: ICubeCoords, c: ICubeCoords): boolean {
    const points = [a, b, c];

    for (const axis of this.HEX_AXIS_DIRS) {
      const projections = points.map(p => p.x * axis.x + p.y * axis.y + p.z * axis.z);
      projections.sort((x, y) => x - y);

      if (projections[1] - projections[0] === 1 && projections[2] - projections[1] === 1) {
        const otherAxes = this.HEX_AXIS_DIRS.filter(ax => ax !== axis);
        const allSamePlane = otherAxes.some(oa => {
          const pp = points.map(p => p.x * oa.x + p.y * oa.y + p.z * oa.z);
          return true; 
        });

        const sorted = [...points].sort((p1, p2) => {
          return (p1.x * axis.x + p1.y * axis.y + p1.z * axis.z) -
                 (p2.x * axis.x + p2.y * axis.y + p2.z * axis.z);
        });
        const d1 = { x: sorted[1].x - sorted[0].x, y: sorted[1].y - sorted[0].y, z: sorted[1].z - sorted[0].z };
        const d2 = { x: sorted[2].x - sorted[1].x, y: sorted[2].y - sorted[1].y, z: sorted[2].z - sorted[1].z };

        if (d1.x === d2.x && d1.y === d2.y && d1.z === d2.z &&
            this.cubeDistance({ x: 0, y: 0, z: 0 }, d1) === 1) {
          return true;
        }
      }
    }
    return false;
  }

  private executeMove(dirIdx: number): void {
    const state = this.game.state;
    const selected = state.selectedMarbles.map(k => this.keyToCoords(k));
    const dir = this.directions[dirIdx];

    if (selected.length === 1) {
      this.executeInlineMove(selected, dir);
    } else {
      const axis = this.getLineAxis(selected);
      if (this.isInlineDirection(axis, dir)) {
        this.executeInlineMove(selected, dir);
      } else {
        this.executeBroadsideMove(selected, dir);
      }
    }

    if (state.deadMarbles.BLACK >= 6 || state.deadMarbles.WHITE >= 6) {
      state.isGameOver = true;
      state.winner = state.deadMarbles.BLACK >= 6 ? 'WHITE' : 'BLACK';
      return;
    }

    state.currentPlayer = state.currentPlayer === 'BLACK' ? 'WHITE' : 'BLACK';
    state.selectedMarbles = [];
    state.possibleMoves = [];
    state.phase = 'SELECT';
  }

  // ── Faza ruchu ──────────────────────────────────────────────

  private enterMovePhase(): void {
    const possibleMoves = this.computePossibleMoves();
    if (possibleMoves.length > 0) {
      this.game.state.possibleMoves = possibleMoves;
      this.game.state.phase = 'MOVE';
    }
  }

  private computePossibleMoves(): number[] {
    const valid: number[] = [];
    for (let dirIdx = 1; dirIdx <= 6; dirIdx++) {
      if (this.isMoveValid(dirIdx)) {
        valid.push(dirIdx);
      }
    }
    return valid;
  }

  private isMoveValid(dirIdx: number): boolean {
    const selected = this.game.state.selectedMarbles.map(k => this.keyToCoords(k));
    const dir = this.directions[dirIdx];

    if (selected.length === 1) {
      return this.isInlineMoveValid(selected, dir);
    }

    const axis = this.getLineAxis(selected);
    if (this.isInlineDirection(axis, dir)) {
      return this.isInlineMoveValid(selected, dir);
    }
    return this.isBroadsideMoveValid(selected, dir);
  }

  private isInlineMoveValid(selected: ICubeCoords[], dir: ICubeCoords): boolean {
    const state = this.game.state;
    const sorted = this.sortMarblesAlongDir(selected, dir);
    const front = sorted[sorted.length - 1];

    const pos: ICubeCoords = { x: front.x + dir.x, y: front.y + dir.y, z: front.z + dir.z };

    if (!this.isOnBoard(pos)) return false;

    const posKey = `${pos.x},${pos.y},${pos.z}`;
    if (!state.board.has(posKey)) return true;
    if (state.board.get(posKey) === state.currentPlayer) return false;

    return this.canPushOpponents(pos, dir, selected.length);
  }

  private canPushOpponents(startPos: ICubeCoords, dir: ICubeCoords, ownCount: number): boolean {
    const state = this.game.state;
    let pos = { ...startPos };
    let opponentCount = 0;

    while (
      this.isOnBoard(pos) &&
      state.board.has(`${pos.x},${pos.y},${pos.z}`) &&
      state.board.get(`${pos.x},${pos.y},${pos.z}`) !== state.currentPlayer
    ) {
      opponentCount++;
      pos = { x: pos.x + dir.x, y: pos.y + dir.y, z: pos.z + dir.z };
    }

    if (ownCount <= opponentCount) return false;

    if (this.isOnBoard(pos) && state.board.has(`${pos.x},${pos.y},${pos.z}`)) {
      return false;
    }

    return true;
  }

  private isBroadsideMoveValid(selected: ICubeCoords[], dir: ICubeCoords): boolean {
    const state = this.game.state;

    for (const marble of selected) {
      const dest: ICubeCoords = { x: marble.x + dir.x, y: marble.y + dir.y, z: marble.z + dir.z };
      const destKey = `${dest.x},${dest.y},${dest.z}`;

      if (!this.isOnBoard(dest)) return false;
      if (state.board.has(destKey)) return false;
    }
    return true;
  }

  private getLineAxis(marbles: ICubeCoords[]): ICubeCoords {
    return {
      x: marbles[1].x - marbles[0].x,
      y: marbles[1].y - marbles[0].y,
      z: marbles[1].z - marbles[0].z,
    };
  }

  private isInlineDirection(axis: ICubeCoords, dir: ICubeCoords): boolean {
    return (
      (dir.x === axis.x && dir.y === axis.y && dir.z === axis.z) ||
      (dir.x === -axis.x && dir.y === -axis.y && dir.z === -axis.z)
    );
  }

  private sortMarblesAlongDir(marbles: ICubeCoords[], dir: ICubeCoords): ICubeCoords[] {
    return [...marbles].sort((a, b) => {
      const projA = a.x * dir.x + a.y * dir.y + a.z * dir.z;
      const projB = b.x * dir.x + b.y * dir.y + b.z * dir.z;
      return projA - projB;
    });
  }

  private isOnBoard(pos: ICubeCoords): boolean {
    return Math.max(Math.abs(pos.x), Math.abs(pos.y), Math.abs(pos.z)) <= 4;
  }

  // ── Wykonanie ruchów ───────────────────────────────────────

  private executeInlineMove(selected: ICubeCoords[], dir: ICubeCoords): void {
    const state = this.game.state;
    const sorted = this.sortMarblesAlongDir(selected, dir);
    const front = sorted[sorted.length - 1];

    // Zebranie kuleczek przeciwnika do zepchnięcia
    let pushPos: ICubeCoords = { x: front.x + dir.x, y: front.y + dir.y, z: front.z + dir.z };
    const opponentMarbles: ICubeCoords[] = [];

    while (this.isOnBoard(pushPos)) {
      const key = `${pushPos.x},${pushPos.y},${pushPos.z}`;
      const color = state.board.get(key);
      if (!color || color === state.currentPlayer) break;
      opponentMarbles.push({ ...pushPos });
      pushPos = { x: pushPos.x + dir.x, y: pushPos.y + dir.y, z: pushPos.z + dir.z };
    }

    // Przesuwanie kulek przeciwnika (od najdalszej)
    for (let i = opponentMarbles.length - 1; i >= 0; i--) {
      const opp = opponentMarbles[i];
      const oppKey = `${opp.x},${opp.y},${opp.z}`;
      const oppColor = state.board.get(oppKey);
      state.board.delete(oppKey);

      if (!oppColor) continue;

      const newPos: ICubeCoords = { x: opp.x + dir.x, y: opp.y + dir.y, z: opp.z + dir.z };
      if (this.isOnBoard(newPos)) {
        state.board.set(`${newPos.x},${newPos.y},${newPos.z}`, oppColor);
      } else {
        state.deadMarbles[oppColor]++;
      }
    }

    // Przesuwanie własnych kulek
    const colors = sorted.map(m => state.board.get(`${m.x},${m.y},${m.z}`) ?? state.currentPlayer);
    sorted.forEach(m => state.board.delete(`${m.x},${m.y},${m.z}`));
    sorted.forEach((m, i) => {
      state.board.set(`${m.x + dir.x},${m.y + dir.y},${m.z + dir.z}`, colors[i]);
    });
  }

  private executeBroadsideMove(selected: ICubeCoords[], dir: ICubeCoords): void {
    const state = this.game.state;
    const colors = selected.map(m => state.board.get(`${m.x},${m.y},${m.z}`) ?? state.currentPlayer);
    selected.forEach(m => state.board.delete(`${m.x},${m.y},${m.z}`));
    selected.forEach((m, i) => {
      state.board.set(`${m.x + dir.x},${m.y + dir.y},${m.z + dir.z}`, colors[i]);
    });
  }



  private render(): void {
    const ctx = this._canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    ctx.save();
    ctx.translate(this._canvas.width / 2, this._canvas.height / 2);

    // Obrót planszy o 180° gdy tura białych
    if (this.game.state.currentPlayer === 'WHITE') {
      ctx.rotate(Math.PI);
    }

    this.drawHexGrid(ctx);
    this.drawMarbles(ctx);
    this.drawMoveGhosts(ctx);
    this.drawDirectionCompass(ctx);
    this.drawCursor(ctx);

    ctx.restore();
  }

  private drawHexGrid(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;

    for (let x = -4; x <= 4; x++) {
      for (let y = -4; y <= 4; y++) {
        const z = -x - y;
        if (Math.abs(z) <= 4) {
          const pos = this.cubeToPixel(x, y);
          this.drawHexagon(ctx, pos.x, pos.y, this.HEX_SIZE);
        }
      }
    }
  }

  private drawMarbles(ctx: CanvasRenderingContext2D): void {
    const state = this.game.state;
    const selectedSet = new Set(state.selectedMarbles);

    state.board.forEach((color, key) => {
      const [x, y] = key.split(',').map(Number);
      const pos = this.cubeToPixel(x, y);
      const marbleRadius = this.HEX_SIZE * 0.8;
      const isSelected = selectedSet.has(key);

      // Kulka
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, marbleRadius, 0, Math.PI * 2);
      ctx.fillStyle = color === 'BLACK' ? '#000000' : '#ffffff';
      ctx.fill();

      // Podświetlenie zaznaczonych kulek — zielone obramowanie
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, marbleRadius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#22c55e'; 
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    });
  } 

  private drawCursor(ctx: CanvasRenderingContext2D): void {
    const pos = this.cubeToPixel(this.game.state.cursor.x, this.game.state.cursor.y);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.HEX_SIZE * 0.85, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // ── Wizualizacja możliwych ruchów ──────────────────────────────

  private drawMoveGhosts(ctx: CanvasRenderingContext2D): void {
    const state = this.game.state;
    if (state.phase !== 'MOVE' || state.possibleMoves.length === 0) return;

    const selected = state.selectedMarbles.map(k => this.keyToCoords(k));
    const selectedKeySet = new Set(state.selectedMarbles);

    for (const dirIdx of state.possibleMoves) {
      const dir = this.directions[dirIdx];

      for (const marble of selected) {
        const dest: ICubeCoords = { x: marble.x + dir.x, y: marble.y + dir.y, z: marble.z + dir.z };
        const destKey = `${dest.x},${dest.y},${dest.z}`;

        if (selectedKeySet.has(destKey) || !this.isOnBoard(dest)) continue;

        const pos = this.cubeToPixel(dest.x, dest.y);

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, this.HEX_SIZE * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }

  private drawDirectionCompass(ctx: CanvasRenderingContext2D): void {
    const state = this.game.state;
    if (state.phase !== 'MOVE' || state.selectedMarbles.length === 0) return;

    const isRotated = state.currentPlayer === 'WHITE';
    const selected = state.selectedMarbles.map(k => this.keyToCoords(k));
    const cx = selected.reduce((s, c) => s + c.x, 0) / selected.length;
    const cy = selected.reduce((s, c) => s + c.y, 0) / selected.length;

    for (let dirIdx = 1; dirIdx <= 6; dirIdx++) {
   
      const visualDir = isRotated ? ((dirIdx - 1 + 3) % 6) + 1 : dirIdx;
      const dir = this.directions[visualDir];
      const isValid = state.possibleMoves.includes(visualDir);

      const targetPx = this.cubeToPixel(cx + dir.x, cy + dir.y);
      const arrowX = targetPx.x;
      const arrowY = targetPx.y;

      ctx.beginPath();
      ctx.arc(arrowX, arrowY, this.HEX_SIZE * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = isValid ? 'rgba(34, 197, 94, 0.75)' : 'rgba(100, 100, 100, 0.25)';
      ctx.fill();

      // Obrót tekstu z powrotem, żeby litery nie były do góry nogami
      ctx.save();
      ctx.translate(arrowX, arrowY);
      if (isRotated) {
        ctx.rotate(Math.PI);
      }
      ctx.fillStyle = isValid ? '#ffffff' : 'rgba(180, 180, 180, 0.4)';
      ctx.font = `bold ${this.HEX_SIZE * 0.5}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this._dirKeyLabels[dirIdx], 0, 0);
      ctx.restore();
    }
  }

  private drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle_rad = (Math.PI / 3) * i - (Math.PI / 6);
      const px = x + size * Math.cos(angle_rad);
      const py = y + size * Math.sin(angle_rad);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }

  private cubeToPixel(x: number, y: number): { x: number; y: number } {
    const px = this.HEX_SIZE * Math.sqrt(3) * (x + y / 2);
    const py = this.HEX_SIZE * (3 / 2) * y;
    return { x: px, y: py };
  }

  private keyToCoords(key: string): ICubeCoords {
    const [x, y, z] = key.split(',').map(Number);
    return { x, y, z };
  }
}