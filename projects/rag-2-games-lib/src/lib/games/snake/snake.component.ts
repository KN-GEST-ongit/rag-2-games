/* eslint-disable max-lines */
/* eslint-disable complexity */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Snake, SnakeState } from './models/snake.class';
import { ISnakeSegment } from './models/snake.segments';
import { ISnakeFood } from './models/snake.food';

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
    <b>FPS: {{ fps }}</b> 
    
  `,
})
export class SnakeGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  private _moveInterval = 100;
  private _lastMoveTime = 0;
  private _gridWidth = 0;
  private _gridHeight = 0;
  private _iterationCount = 0;

  public override game!: Snake;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Snake;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this._canvas.width = Math.floor(this._canvas.width / this.game.state.gridSize) * this.game.state.gridSize;
    this._canvas.height = Math.floor(this._canvas.height / this.game.state.gridSize) * this.game.state.gridSize;
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
    this.game.state.velocity = 0;
    this._moveInterval = 100;
    this.game.state.score = 0;
    this.game.state.isGameStarted = false;
    this.game.state.isGameOver = false;

    this.generateFood();
  }

  private gameStart(): void {
    if (!this.game.state.isGameStarted && this.game.players[0].inputData['start'] === 1) {
      this.game.state.isGameStarted = true;
    }
    else if (this.game.state.isGameOver && this.game.players[0].inputData['start'] === 1) {
      this.resetGame();
    }
  }

  private updateDirection(): void {
    if (this.game.state.isGameOver) return;

    const moveValue = Number(this.game.players[0].inputData['move']);

    switch (moveValue) {
      case 1:
        if (this.game.state.direction !== 'left') {
          this.game.state.direction = 'right';
        }
        break;
      case 2:
        if (this.game.state.direction !== 'right') {
          this.game.state.direction = 'left';
        }
        break;
      case 3:
        if (this.game.state.direction !== 'up') {
          this.game.state.direction = 'down';
        }
        break;
      case 4:
        if (this.game.state.direction !== 'down') {
          this.game.state.direction = 'up';
        }
        break;
    }
  }

  private moveSnake(): void {
    if (this.game.state.direction === 'none') return;

    const newHead = this.calculateNewHeadPosition();

    if (this.isCollisionWithWall(newHead)) {
      this.game.state.isGameOver = true;
      return;
    }

    if (this.isCollisionWithSelf(newHead)) {
      this.game.state.isGameOver = true;
      return;
    }

    if (newHead.x === this.game.state.foodItem.x && newHead.y === this.game.state.foodItem.y) {
        this.game.state.score += 1;
        this._iterationCount += 1;
        if (this._moveInterval > 25 && this._iterationCount == 5) {
          this.game.state.velocity += 3;
          this._moveInterval -= 2;
          this._iterationCount = 0;
        }
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

  private isCollisionWithWall(head: ISnakeSegment): boolean {
    return (
        head.x < 0 || 
        head.y < 0 || 
        head.x >= this._gridWidth || 
        head.y >= this._gridHeight
    );
}

private isCollisionWithSelf(head: ISnakeSegment): boolean {
  for (let i = 1; i < this.game.state.segments.length; i++) {
      const segment = this.game.state.segments[i];
      if (segment.x === head.x && segment.y === head.y) {
          return true;
      }
  }
  return false;
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

    let newFoodPosition: ISnakeFood;
    do {
        newFoodPosition = {
            x: Math.floor(Math.random() * gridWidth),
            y: Math.floor(Math.random() * gridHeight),
        };
    } while (this.isFoodOnSnake(newFoodPosition));

    this.game.state.foodItem = newFoodPosition;
}

private isFoodOnSnake(position: ISnakeFood): boolean {
    return this.game.state.segments.some(segment => segment.x === position.x && segment.y === position.y);
}
}