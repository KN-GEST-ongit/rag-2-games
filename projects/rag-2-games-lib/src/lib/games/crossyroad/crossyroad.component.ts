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
  template: `<div>
    Score: <b>{{ game.state.score }}</b> | 
    Best: <b>{{ game.state.highestZ }}</b>
  </div>
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

    const savedHighScore = localStorage.getItem('crossyroadBestScore');
    if (savedHighScore) {
      state.highestZ = parseInt(savedHighScore, 10);
    }
    
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
      if (player.inputData['action'] === 1) {
        this.restart();
      }
      return;
    }

    if (state.moveCooldown > 0) {
      state.moveCooldown--;
      return;
    }

    const move = player.inputData['move'] as number;

    let moved = false;

    if (move === 1) {
      state.playerZ += 1;
      moved = true;
    } else if (move === 2) {
      const targetZ = state.playerZ - 1;
      const canMoveBack = state.lanes.some(l => l.z === targetZ);

      if (canMoveBack && targetZ >= -1) {
        state.playerZ -= 1;
        moved = true;
      }
    }

    if (move === 3) {
      state.playerX -= 1;
      moved = true;
    } else if (move === 4) {
      state.playerX += 1;
      moved = true;
    }

    if (moved) {
      state.playerX = Math.max(-8, Math.min(12, state.playerX));
      
      if (state.playerZ > state.highestZ) {
        state.highestZ = state.playerZ;
        localStorage.setItem('crossyroadBestScore', state.highestZ.toString());
      }

      if (state.playerZ > state.score) {
        state.score = state.playerZ;
      }

      state.moveCooldown = 8;
    }

    player.inputData['move'] = 0;
    player.inputData['action'] = 0;
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
          const isTruck = Math.random() < 0.10;

          const obstacleType = isTruck ? 'truck' : (speed > 0.15 ? 'car_fast' : 'car_slow');
          const obstacleWidth = isTruck ? 3.5 : 1.5; 
          const obstacleSpeed = isTruck ? speed * 0.7 : speed;

          lane.obstacles.push({
            id: state.nextObstacleId++,
            x: candidateX,
            speed: obstacleSpeed,
            direction: direction as -1 | 1,
            type: obstacleType,
            width: obstacleWidth
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
    } else if (lane.type === 'water') {
      let direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;

      const prevLane = state.lanes[state.lanes.length - 1];
      if (prevLane && prevLane.type === 'water' && prevLane.obstacles.length > 0) {
        direction = prevLane.obstacles[0].direction === 1 ? -1 : 1;
      }

      const speed = 0.04 + Math.random() * 0.04;
       
      const logCount = Math.floor(Math.random() * 2) + 3;
      const placedX: number[] = [];
      const minDistance = 6;

      for (let j = 0; j < logCount; j++) {
        let attempts = 0;
        let validPosition = false;
        let candidateX = 0;

        while (!validPosition && attempts < 10) {
          candidateX = (Math.random() - 0.5) * 40;
          const collision = placedX.some(x => Math.abs(x - candidateX) < minDistance);
          if (!collision) validPosition = true;
          attempts++;
        }

        if (validPosition) {
          placedX.push(candidateX);
          lane.obstacles.push({
            id: state.nextObstacleId++,
            x: candidateX,
            speed: speed,
            direction: direction as -1 | 1,
            type: 'log',
            width: 3.0 + Math.random() * 2
          });
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

        const prevLaneType = state.lanes.length > 0 ? state.lanes[state.lanes.length - 1].type : 'grass';

        let consecutiveGrass = 0;
        let consecutiveWater = 0;
        for (let k = state.lanes.length - 1; k >= 0; k--) {
          if (state.lanes[k].type === prevLaneType) {
            if (prevLaneType === 'grass') consecutiveGrass++;
            if (prevLaneType === 'water') consecutiveWater++;
          } else {
            break;
          }
        }

        let laneType: 'grass' | 'road' | 'water' = 'grass';
        const rand = Math.random();
        
        if (newZ > 15) {
            if (rand < 0.15) laneType = 'grass';
            else if (rand < 0.80) laneType = 'road';
            else laneType = 'water';
        } else {
            laneType = rand > 0.3 ? 'road' : 'grass';
        }

        if (consecutiveGrass >= 2) {
          laneType = 'road';
        }

        if (consecutiveWater >= 2) {
          laneType = 'grass';
        }

        if (prevLaneType === 'water' && laneType === 'road') {
            laneType = 'grass';
        }

        if (prevLaneType === 'road' && laneType === 'water') {
            laneType = 'grass';
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

    let isSafeOnWater = false;
    let logSpeed = 0;
    let logDirection = 1;

    for (const obs of playerLane.obstacles) {
      const dist = Math.abs(obs.x - state.playerX);
      const collisionThreshold = (obs.width / 2) + (playerHitboxWidth / 2) - graceMargin;

      if (dist < collisionThreshold) {
        if (obs.type === 'log') {
          isSafeOnWater = true;
          logSpeed = obs.speed;
          logDirection = obs.direction;
        } else if (obs.type === 'tree') {
          state.isGameOver = true;
          state.deathReason = 'You cannot move tree!';
          return;
        } else {
          state.isGameOver = true;
          state.deathReason = obs.type === 'truck' ? 'Hit by truck!' : 'Hit by car!';
          return;
        }
      }
    }

    if (playerLane.type === 'water') {
      if (!isSafeOnWater) {
        state.isGameOver = true;
        state.deathReason = 'Better learn to swim!';
      } else {
        state.playerX += logSpeed * logDirection;

        if (state.playerX < -8 || state.playerX > 12) {
          state.isGameOver = true;
          state.deathReason = 'Better stay in safe area!';
        }
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