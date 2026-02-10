/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-lines */
/* eslint-disable complexity */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { CrossyRoad, CrossyRoadState } from './models/crossyroad.class';
import { CrossyRoadRenderer } from './models/crossyroad.renderer';
import { ILane } from './models/crossyroad.interfaces';

@Component({
  selector: 'app-crossyroad',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    <app-canvas
      [displayMode]="'horizontal'"
      [is3DEnabled]="true"
      #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b>
  `,
})
export class CrossyRoadGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public override game!: CrossyRoad;
  private renderer3D?: CrossyRoadRenderer;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as CrossyRoad;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();

    const parent = this._canvas.parentElement;
    if (parent) {
      const rect = parent.getBoundingClientRect();
      this._canvas.width = Math.max(rect.width, 800);
      this._canvas.height = Math.max(rect.height, 600);
    } else {
      this._canvas.width = 1200;
      this._canvas.height = 800;
    }

    this._canvas.style.width = '100%';
    this._canvas.style.height = '100%';
    this._canvas.style.display = 'block';

    setTimeout(() => {
      this.initBabylon();
    }, 300);
  }

  private initBabylon(): void {
    try {
      this.renderer3D = new CrossyRoadRenderer(this._canvas);
    } catch (error) {
      console.error('Babylon.js initialization failed: ', error);
    }
  }

  public override restart(): void {
    this.game.state = new CrossyRoadState();
  }

  protected override update(): void {
    super.update();

    if (!this.renderer3D || this.isPaused) {
      return;
    }

    this.handleInput();
    this.updateGameLogic();
    this.renderer3D.render(this.game.state);
  }

  private handleInput(): void {
    const state = this.game.state;
    const player = this.game.players[0];

    if (state.isGameOver) return;

    if (state.moveCooldown > 0) {
      state.moveCooldown--;
      return;
    }

    const moveUp = player.inputData['moveUp'] as number;
    const moveDown = player.inputData['moveDown'] as number;
    const moveLeft = player.inputData['moveLeft'] as number;
    const moveRight = player.inputData['moveRight'] as number;

    let moved = false;

    if (moveUp === 1) {
      state.playerZ += 1;
      moved = true;
    } else if (moveDown === 1) {
      state.playerZ -= 1;
      moved = true;
    }

    if (moveLeft === 1) {
      state.playerX -= 1;
      moved = true;
    } else if (moveRight === 1) {
      state.playerX += 1;
      moved = true;
    }

    if (moved) {
      state.playerX = Math.max(-10, Math.min(10, state.playerX));
      
      if (state.playerZ > state.highestZ) {
        state.highestZ = state.playerZ;
        state.score = state.highestZ;
      }

      state.moveCooldown = 8;
    }

    player.inputData['moveUp'] = 0;
    player.inputData['moveDown'] = 0;
    player.inputData['moveLeft'] = 0;
    player.inputData['moveRight'] = 0;
  }

  private updateGameLogic(): void {
    const state = this.game.state;
    if (state.isGameOver) return;

    this.generateNewLanes();
    this.updateObstacles();
    this.checkCollisions();
  }

  private generateNewLanes(): void {
    const state = this.game.state;
    const maxZ = Math.max(...state.lanes.map(l => l.z), state.playerZ);
    
    if (maxZ < state.playerZ + 15) {
      for (let i = 1; i <= 3; i++) {
        const newZ = maxZ + i;
        const laneType = Math.random() > 0.35 ? 'road' : 'grass';
        
        const newLane: ILane = {
          z: newZ,
          type: laneType,
          obstacles: []
        };

        if (laneType === 'road') {
          const carCount = Math.floor(Math.random() * 2) + 1;
          const speed = Math.random() > 0.6 ? 0.12 : 0.06;
          const direction = Math.random() > 0.5 ? 1 : -1;

          for (let j = 0; j < carCount; j++) {
            newLane.obstacles.push({
              id: state.nextObstacleId++,
              x: (Math.random() - 0.5) * 25 + (j * 8 * direction),
              speed: speed,
              direction: direction as -1 | 1,
              type: speed > 0.09 ? 'car_fast' : 'car_slow',
              width: 1.5
            });
          }
        } else if (Math.random() > 0.7) {
          const treeCount = Math.floor(Math.random() * 3) + 1;
          for (let j = 0; j < treeCount; j++) {
            newLane.obstacles.push({
              id: state.nextObstacleId++,
              x: (Math.random() - 0.5) * 16,
              speed: 0,
              direction: 1,
              type: 'tree',
              width: 0.8
            });
          }
        }

        state.lanes.push(newLane);
      }
    }

    state.lanes = state.lanes.filter(l => l.z > state.playerZ - 10);
  }

  private updateObstacles(): void {
    const state = this.game.state;

    for (const lane of state.lanes) {
      for (const obs of lane.obstacles) {
        if (obs.speed > 0) {
          obs.x += obs.speed * obs.direction;
          
          if (obs.x > 20) obs.x = -20;
          if (obs.x < -20) obs.x = 20;
        }
      }
    }
  }

  private checkCollisions(): void {
    const state = this.game.state;
    
    const playerLane = state.lanes.find(
      l => Math.abs(l.z - state.playerZ) < 0.5
    );

    if (!playerLane) return;

    for (const obs of playerLane.obstacles) {
      const distX = Math.abs(obs.x - state.playerX);
      
      if (distX < (obs.width * 0.6)) {
        state.isGameOver = true;
        break;
      }
    }
  }

  public override ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.renderer3D) {
      this.renderer3D.dispose();
    }
  }
}