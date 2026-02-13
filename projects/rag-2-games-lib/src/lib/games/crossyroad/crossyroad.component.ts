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
    if (this.renderer3D) {
      this.renderer3D.clear();
    }

    this.game.state = new CrossyRoadState();
    const state = this.game.state;
    
    for (const lane of state.lanes) {
        if (lane.z > 3) {
            if (Math.random() > 0.7) {
                lane.type = 'grass';
            }
            this.spawnObstaclesOnLane(lane);
        }
    }
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

    if (state.isGameOver) {
      if (player.inputData['moveUp'] || player.inputData['moveDown']) {
        this.restart();
      }
      return;
    }

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
      const targetZ = state.playerZ - 1;
      const canMoveBack = state.lanes.some(l => l.z === targetZ);

      if (canMoveBack) {
        state.playerZ -= 1;
        moved = true;
      }
    }

    if (moveLeft === 1) {
      state.playerX -= 1;
      moved = true;
    } else if (moveRight === 1) {
      state.playerX += 1;
      moved = true;
    }

    if (moved) {
      state.playerX = Math.max(-15, Math.min(15, state.playerX));
      
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

  private spawnObstaclesOnLane(lane: ILane): void {
    const state = this.game.state;

    if (lane.type === 'road') {
      const difficultyFactor = Math.min(Math.max(0, lane.z) * 0.0005, 0.15);

      let maxCars = 2;
      if (lane.z > 100) maxCars = 3; 

      const carCount = Math.floor(Math.random() * maxCars) + 1;
      const baseSpeed = 0.06 + difficultyFactor;
      const fastCarThreshold = Math.max(0.3, 0.6 - (lane.z * 0.002));
      
      let speed = Math.random() > fastCarThreshold ? (baseSpeed * 2) : baseSpeed;
      speed = Math.min(speed, 0.25);

      const direction = Math.random() > 0.5 ? 1 : -1;

      const placedCarsX: number[] = [];
      const minDistance = 5;

      for (let j = 0; j < carCount; j++) {
        let attempts = 0;
        let validPosition = false;
        let candidateX = 0;

        while (!validPosition && attempts < 10) {
          candidateX = (Math.random() - 0.5) * 50;
          const collision = placedCarsX.some(x => Math.abs(x - candidateX) < minDistance);
          if (!collision) {
            validPosition = true;
          }
          attempts++;
        }

        if (validPosition) {
          placedCarsX.push(candidateX);
          lane.obstacles.push({
            id: state.nextObstacleId++,
            x: candidateX,
            speed: speed,
            direction: direction as -1 | 1,
            type: speed > 0.15 ? 'car_fast' : 'car_slow',
            width: 1.5
          });
        }
      }
    } else if (lane.type === 'grass') {
      if (Math.random() > 0.3) {
        const treeCount = Math.floor(Math.random() * 4) + 1;
        const placedX: number[] = [];

        for (let j = 0; j < treeCount; j++) {
          let attempts = 0;
          let validPosition = false;
          let candidateX = 0;

          while (!validPosition && attempts < 5) {
            candidateX = Math.round((Math.random() - 0.5) * 28); 
            const collision = placedX.some(x => Math.abs(x - candidateX) < 2.5);
            const blockingCenter = (lane.z < 5 && Math.abs(candidateX) < 2);

            if (!collision && !blockingCenter) {
              validPosition = true;
            }
            attempts++;
          }

          if (validPosition) {
            placedX.push(candidateX);
              lane.obstacles.push({
              id: state.nextObstacleId++,
              x: candidateX,
              speed: 0,
              direction: 1,
              type: 'tree',
              width: 0.8
            });
          }
        }
      }
    }
  }

  private generateNewLanes(): void {
    const state = this.game.state;
    const maxZ = Math.max(...state.lanes.map(l => l.z), state.playerZ);
    
    if (maxZ < state.playerZ + 15) {
      for (let i = 1; i <= 3; i++) {
        const newZ = maxZ + i;

        let consecutiveGrass = 0;
        for (let k = state.lanes.length - 1; k >= 0; k--) {
          if (state.lanes[k].type === 'grass') {
            consecutiveGrass++;
          } else {
            break;
          }
        }

        let laneType: 'road' | 'grass' = Math.random() > 0.3 ? 'road' : 'grass';

        if (consecutiveGrass >= 2) {
          laneType = 'road';
        }
        const newLane: ILane = {
          z: newZ,
          type: laneType,
          obstacles: []
        };

        this.spawnObstaclesOnLane(newLane);

        state.lanes.push(newLane);
      }
    }

    state.lanes = state.lanes.filter(l => l.z > state.playerZ - 15);
  }

  private updateObstacles(): void {
    const state = this.game.state;

    const resetLimit = 30;

    for (const lane of state.lanes) {
      for (const obs of lane.obstacles) {
        if (obs.speed > 0) {
          obs.x += obs.speed * obs.direction;
          
          if (obs.x > resetLimit) obs.x = -resetLimit;
          if (obs.x < -resetLimit) obs.x = resetLimit;
        }
      }
    }
  }

  private checkCollisions(): void {
    const state = this.game.state;
    
    const playerLane = state.lanes.find(
      l => l.z === Math.round(state.playerZ)
    );

    if (!playerLane) return;

    const playerHitboxWidth = 0.6;
    const graceMargin = 0.1;

    for (const obs of playerLane.obstacles) {
      const dist = Math.abs(obs.x - state.playerX);
      const collisionThreshold = (obs.width / 2) + (playerHitboxWidth / 2) - graceMargin;

      if (dist < collisionThreshold) {
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