import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Snake, SnakeState, ISnakeSegment } from './models/snake.class';

@Component({
  selector: 'app-snake',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    <div>
      score: <b>{{ game.state.score }}</b>
    </div>
    <app-canvas
      [displayMode]="'horizontal'"
      #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b> `,
})
export class SnakeGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private _moveInterval = 150;
  private _lastMoveTime = 0;
  private _gridWidth = 0;
  private _gridHeight = 0;

  public override game!: Snake;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Snake;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this._gridWidth = Math.floor(this._canvas.width / this.game.state.gridSize);
    this._gridHeight = Math.floor(this._canvas.height / this.game.state.gridSize);
    this.resetGame();
    this.render();
  }

  public override restart(): void {
    this.game.state = new SnakeState();
    this.game.state.isGameStarted = false;
    this.resetGame();
  }

  protected override update(): void {
    const currentTime = performance.now();

    super.update();

    this.gameStart();
    this.updateDirection();

    if (!this.isPaused && this.game.state.isGameStarted && !this.game.state.isGameOver && currentTime - this._lastMoveTime > this._moveInterval){
      this.moveSnake();
      this._lastMoveTime = currentTime;
    }
    this.render();
  }

  private resetGame(): void {
    const centerX = Math.floor(this._gridWidth / 2);
    const centerY = Math.floor(this._gridHeight / 2);
    
    this.game.state.segments = [{ x: centerX, y: centerY }];
    this.game.state.direction = 'none';
    this.game.state.score = 0;
    this.game.state.isGameStarted = false;
    this.game.state.isGameOver = false;
  }

  private gameStart(): void {
    if (!this.game.state.isGameStarted && this.game.players[0].inputData['start'] === 1) {
      this.game.state.isGameStarted = true;
    }
  }

  private updateDirection(): void {
    if (this.game.state.isGameOver) return;

    const moveX = Number(this.game.players[0].inputData['moveX']);
    const moveY = Number(this.game.players[0].inputData['moveY']);

    if (this.isHorizontalMoveValid(moveX)) {
      this.setHorizontalDirection(moveX);
    }
  
    if (this.isVerticalMoveValid(moveY)) {
      this.setVerticalDirection(moveY);
    }
  }

  private isHorizontalMoveValid(moveX: number): boolean {
    const currentDirection = this.game.state.direction;
    return (moveX === -1 && currentDirection !== 'right') || 
           (moveX === 1 && currentDirection !== 'left');
  }

  private isVerticalMoveValid(moveY: number): boolean {
    const currentDirection = this.game.state.direction;
    return (moveY === -1 && currentDirection !== 'down') || 
           (moveY === 1 && currentDirection !== 'up');
  }

  private setHorizontalDirection(moveX: number): void {
    this.game.state.direction = moveX === -1 ? 'left' : 'right';
  }

  private setVerticalDirection(moveY: number): void {
    this.game.state.direction = moveY === -1 ? 'up' : 'down';
  }

  private moveSnake(): void {
    if (this.game.state.direction === 'none') return;

    const newHead = this.calculateNewHeadPosition();

    if (newHead.x === this.game.state.foodItem.x && newHead.y === this.game.state.foodItem.y) {
        this.game.state.score += 1;
        this.game.state.segments.unshift(newHead);
        this.generateFood();
    } else {
        this.game.state.segments.unshift(newHead);
        this.game.state.segments.pop();
    }
  }
  
  private calculateNewHeadPosition(): ISnakeSegment {
    const head = { ...this.game.state.segments[0] };
    
    switch (this.game.state.direction) {
      case 'up':
        head.y -= 1;
        break;
      case 'down':
        head.y += 1;
        break;
      case 'left':
        head.x -= 1;
        break;
      case 'right':
        head.x += 1;
        break;
    }
    
    return head;
  }

  private render(): void {
    const context = this._canvas.getContext('2d');
    if (context) {
        context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        context.fillStyle = 'blue';
        this.game.state.segments.forEach(segment => {
            context.fillRect(
                segment.x * this.game.state.gridSize,
                segment.y * this.game.state.gridSize,
                this.game.state.gridSize,
                this.game.state.gridSize
            );
        });

        context.fillStyle = 'red';
        context.fillRect(
            this.game.state.foodItem.x * this.game.state.gridSize,
            this.game.state.foodItem.y * this.game.state.gridSize,
            this.game.state.gridSize,
            this.game.state.gridSize
        );
    }
}

  private generateFood(): void {
    const gridWidth = Math.floor(this._canvas.width / this.game.state.gridSize);
    const gridHeight = Math.floor(this._canvas.height / this.game.state.gridSize);

    let newFoodPosition: ISnakeSegment;
    do {
        newFoodPosition = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight),
        };
    } while (this.isFoodOnSnake(newFoodPosition));

    this.game.state.foodItem = newFoodPosition;
}

private isFoodOnSnake(position: ISnakeSegment): boolean {
    return this.game.state.segments.some(segment => segment.x === position.x && segment.y === position.y);
}
}