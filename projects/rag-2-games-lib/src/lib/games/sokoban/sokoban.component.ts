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
  
  private _levelWidth = 10;
  private _levelHeight = 10;
  private _isWon = false;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Sokoban;
    this.setupLevel();
  }

  private setupLevel(): void {
    this.game.state.walls = [];
    this._isWon = false;

    for (let i = 0; i < this._levelWidth; i++) {
      this.game.state.walls.push(
        { x: i, y: 0 }, 
        { x: i, y: this._levelHeight - 1 }, 
        { x: 0, y: i }, 
        { x: this._levelWidth - 1, y: i }
      );
    }
    
    this.game.state.boxes = [
      { x: 4, y: 4 },
      { x: 5, y: 6 }
    ];
    
    this.game.state.goals = [
      { x: 7, y: 7 },
      { x: 7, y: 8 }
    ];
  }

  protected override update(): void {
    super.update();
    const currentTime = performance.now();

    if (this._canvas) {
      this.game.state.gridSize = Math.floor(Math.min(
        this._canvas.width / this._levelWidth,
        this._canvas.height / this._levelHeight
      ));
    }

    if (!this.isPaused && !this._isWon && currentTime - this._lastMoveTime > 150) {
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

    const boxIndex = this.game.state.boxes.findIndex((b: IPoint) => b.x === newPos.x && b.y === newPos.y);
    
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
      
      this.checkWinCondition();
    }
  }

  private checkWinCondition(): void {
    const allBoxesOnGoals = this.game.state.boxes.every((box: IPoint) =>
      this.game.state.goals.some((goal: IPoint) => goal.x === box.x && goal.y === box.y)
    );

    if (allBoxesOnGoals) {
      this._isWon = true;
    }
  }

  private isWall(p: IPoint): boolean {
    return this.game.state.walls.some((w: IPoint) => w.x === p.x && w.y === p.y);
  }

  private isBox(p: IPoint): boolean {
    return this.game.state.boxes.some((b: IPoint) => b.x === p.x && b.y === p.y);
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

    const offsetX = (this._canvas.width - this._levelWidth * size) / 2;
    const offsetY = (this._canvas.height - this._levelHeight * size) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);

    ctx.fillStyle = '#228B22'; 
    this.game.state.goals.forEach((g: IPoint) => {
      ctx.beginPath();
      ctx.arc(g.x * size + size / 2, g.y * size + size / 2, size / 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#555';
    this.game.state.walls.forEach((w: IPoint) => ctx.fillRect(w.x * size, w.y * size, size - 1, size - 1));

    this.game.state.boxes.forEach((b: IPoint) => {
      const isOnGoal = this.game.state.goals.some((g: IPoint) => g.x === b.x && g.y === b.y);
      ctx.fillStyle = isOnGoal ? '#32CD32' : '#CD853F'; 
      ctx.fillRect(b.x * size + 4, b.y * size + 4, size - 8, size - 8);
    });

    ctx.fillStyle = 'blue';
    ctx.fillRect(this.game.state.player.x * size + 8, this.game.state.player.y * size + 8, size - 16, size - 16);

    if (this._isWon) {
      ctx.fillStyle = 'black';
      ctx.font = `bold ${size}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillText('WYGRANA!', (this._levelWidth * size) / 2, (this._levelHeight * size) / 2);
    }

    ctx.restore();
  }

  public override restart(): void {
    this.game.state.player = { x: 2, y: 2 };
    this.setupLevel();
  }
}