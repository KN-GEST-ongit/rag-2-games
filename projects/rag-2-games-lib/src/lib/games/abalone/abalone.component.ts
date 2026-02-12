/* eslint-disable max-lines */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Abalone, AbaloneState, ICubeCoords } from './models/abalone.class';

@Component({
  selector: 'app-abalone',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    <div class="game-info">
      Tura: <b [style.color]="game.state.currentPlayer === 'BLACK' ? 'black' : 'gray'">
        {{ game.state.currentPlayer }}
      </b> | 
      Punkty - Czarne: <b>{{ game.state.deadMarbles.WHITE }}</b>, 
      Białe: <b>{{ game.state.deadMarbles.BLACK }}</b>
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
    if (this.isPaused) return;

    const moveDir = this.keyToMoveMap[event.key];
    if (moveDir !== undefined) {
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
    if (this._moveQueue.length > 0) {
      const move = this._moveQueue.shift()!;
      this.moveCursor(move);
    }

    if (this._actionQueue.length > 0) {
      const action = this._actionQueue.shift()!;
      this.handleAction(action);
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
      this.executeMove();
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

  // --- Walidacja linii ---

  /** Czy dwa pola sąsiadują (dystans kubiczny = 1) */
  private areNeighbors(a: ICubeCoords, b: ICubeCoords): boolean {
    return this.cubeDistance(a, b) === 1;
  }

  /** Dystans kubiczny */
  private cubeDistance(a: ICubeCoords, b: ICubeCoords): number {
    return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z)) / 2;
  }

  /**
   * Sprawdza czy 3 pola leżą na jednej z 3 osi hex (w linii prostej).
   * Wymagane: jedno pole jest środkowe, a dwa pozostałe są jego sąsiadami
   * w tym samym kierunku osi.
   */
  private areInLine(a: ICubeCoords, b: ICubeCoords, c: ICubeCoords): boolean {
    const points = [a, b, c];

    // Sprawdź każdą z 3 osi hex
    for (const axis of this.HEX_AXIS_DIRS) {
      // Rzutuj punkty na tę oś (iloczyn skalarny z wektorem osi)
      const projections = points.map(p => p.x * axis.x + p.y * axis.y + p.z * axis.z);
      projections.sort((x, y) => x - y);

      // 3 punkty w linii na osi = kolejne wartości rzutu (np. 0,1,2 lub -1,0,1)
      if (projections[1] - projections[0] === 1 && projections[2] - projections[1] === 1) {
        // Dodatkowa weryfikacja: sprawdź że na osi prostopadłej mają tę samą wartość
        // Użyj drugiej osi do sprawdzenia współliniowości
        const otherAxes = this.HEX_AXIS_DIRS.filter(ax => ax !== axis);
        const allSamePlane = otherAxes.some(oa => {
          const pp = points.map(p => p.x * oa.x + p.y * oa.y + p.z * oa.z);
          // Dwa z trzech muszą mieć ten sam rzut na prostopadłą oś — to za mało
          // Prostsze: po prostu sprawdź, że wektor (a->b) i (b->c) to ten sam kierunek osi
          return true; // rzutowanie na oś wystarczy
        });

        // Zweryfikuj bezpośrednio: wektor a→b i b→c muszą być równoległe do osi
        const sorted = [...points].sort((p1, p2) => {
          return (p1.x * axis.x + p1.y * axis.y + p1.z * axis.z) -
                 (p2.x * axis.x + p2.y * axis.y + p2.z * axis.z);
        });
        const d1 = { x: sorted[1].x - sorted[0].x, y: sorted[1].y - sorted[0].y, z: sorted[1].z - sorted[0].z };
        const d2 = { x: sorted[2].x - sorted[1].x, y: sorted[2].y - sorted[1].y, z: sorted[2].z - sorted[1].z };

        // Oba wektory muszą być identyczne i być jednym z 6 kierunków hex
        if (d1.x === d2.x && d1.y === d2.y && d1.z === d2.z &&
            this.cubeDistance({ x: 0, y: 0, z: 0 }, d1) === 1) {
          return true;
        }
      }
    }
    return false;
  }

  private executeMove(): void {
    if (this.game.state.selectedMarbles.length > 0) {
      this.game.state.selectedMarbles = [];
      this.game.state.currentPlayer = this.game.state.currentPlayer === 'BLACK' ? 'WHITE' : 'BLACK';
    }
  }



  private render(): void {
    const ctx = this._canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    ctx.save();
    ctx.translate(this._canvas.width / 2, this._canvas.height / 2);

    this.drawHexGrid(ctx);
    this.drawMarbles(ctx);
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
        ctx.strokeStyle = '#22c55e'; // zielony
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    });
  }

  private drawCursor(ctx: CanvasRenderingContext2D): void {
    const pos = this.cubeToPixel(this.game.state.cursor.x, this.game.state.cursor.y);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, this.HEX_SIZE * 0.85, 0, Math.PI * 2);
    ctx.strokeStyle = '#facc15';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
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