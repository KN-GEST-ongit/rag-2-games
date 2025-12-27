import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Sokoban, SokobanState, IPoint } from './models/sokoban.class';

@Component({
  selector: 'app-sokoban',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    <div>Sokoban</div>
    <app-canvas [displayMode]="'horizontal'" #gameCanvas></app-canvas>
  `,
})
export class SokobanGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public override game!: Sokoban;
  private _lastMoveTime = 0;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Sokoban;
    this.setupLevel();
  }

  private setupLevel(): void {
    for (let i = 0; i < 10; i++) {
      this.game.state.walls.push({ x: i, y: 0 }, { x: i, y: 9 }, { x: 0, y: i }, { x: 9, y: i });
    }
    this.game.state.boxes = [
      { x: 4, y: 4 },
      { x: 5, y: 6 }
    ];
  }

  protected override update(): void {
    super.update();
    const currentTime = performance.now();

    if (!this.isPaused && currentTime - this._lastMoveTime > 150) {
      const moveValue = Number(this.game.players[0].inputData['move']);
      if (moveValue > 0) {
        this.handleAction(moveValue);
        this._lastMoveTime = currentTime;
      }
    }
    this.render();
  }

  private handleAction(direction: number): void {
    const delta = this.getDelta(direction);
    const newPos = { x: this.game.state.player.x + delta.x, y: this.game.state.player.y + delta.y };

    if (this.isWall(newPos)) return;

    const boxIndex = this.game.state.boxes.findIndex(b => b.x === newPos.x && b.y === newPos.y);
    
    if (boxIndex !== -1) {
      this.tryPushBox(boxIndex, newPos, delta);
    } else {
      this.game.state.player = newPos;
    }
  }

  private tryPushBox(index: number, boxPos: IPoint, delta: IPoint): void {
    const nextBoxPos = { x: boxPos.x + delta.x, y: boxPos.y + delta.y };

    if (!this.isWall(nextBoxPos) && !this.isBox(nextBoxPos)) {
      this.game.state.boxes[index] = nextBoxPos;
      this.game.state.player = boxPos;
    }
  }

private isWall(p: IPoint): boolean {
  return this.game.state.walls.some(w => w.x === p.x && w.y === p.y);
}

private isBox(p: IPoint): boolean {
  return this.game.state.boxes.some(b => b.x === p.x && b.y === p.y);
}

private getDelta(dir: number): IPoint {
  if (dir === 1) return { x: 1, y: 0 };
  if (dir === 2) return { x: -1, y: 0 };
  if (dir === 3) return { x: 0, y: 1 };
  if (dir === 4) return { x: 0, y: -1 };
  return { x: 0, y: 0 };
}
  private render(): void {
    const ctx = this._canvas.getContext('2d');
    const size = this.game.state.gridSize;
    if (!ctx) return;

    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    ctx.fillStyle = '#555';
    this.game.state.walls.forEach(w => ctx.fillRect(w.x * size, w.y * size, size - 1, size - 1));

    ctx.fillStyle = '#CD853F';
    this.game.state.boxes.forEach(b => ctx.fillRect(b.x * size + 4, b.y * size + 4, size - 8, size - 8));

    ctx.fillStyle = 'blue';
    ctx.fillRect(this.game.state.player.x * size + 8, this.game.state.player.y * size + 8, size - 16, size - 16);
  }

  public override restart(): void {
    this.game.state = new SokobanState();
    this.setupLevel();
  }
}