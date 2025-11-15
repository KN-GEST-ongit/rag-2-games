/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-lines */
/* eslint-disable complexity */
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { TowerDefense, TowerDefenseState } from './models/towerdefense.class';
import { TowerTypes, EnemyTypes, WaveDefinitions } from './models/towerdefense.data';
import { ITower, IEnemy, ITowerData } from './models/towerdefense.interfaces';
import { findShortestPath } from './models/towerdefense.pathfinding.helper';
import * as Drawing from './models/towerdefense.drawing.helper';

@Component({
  selector: 'app-towerdefense',
  standalone: true,
  imports: [CanvasComponent, CommonModule],
  template: `
    <div>
      Base Health: <b>{{ game.state.baseHealth }}</b> | 
      Gold: <b>{{ game.state.gold }}</b> | 
      Wave: <b>{{ game.state.waveNumber + 1 }}</b> |
      Maps Cleared: <b>{{ game.state.mapsCompleted }}</b> | 
      <b>{{ getCursorActionText() }}</b>
    </div>

    <app-canvas
      [displayMode]="'horizontal'"
      #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b>
    <button (click)="toggleInfo()">Click [I] or HERE to check how to play.</button>

    <div *ngIf="showInfo" class="absolute inset-0 w-full h-full flex justify-center items-center bg-black/85 z-50">
      <div class="bg-mainGray text-gray-200 p-5 md:p-10 rounded-lg border-2 border-mainOrange max-w-3xl max-h-[80vh] overflow-y-auto relative">
        
        <button (click)="toggleInfo()" class="absolute top-2 right-3 w-10 h-10 text-mainOrange text-xl font-bold">X</button>
        
        <h2 class="text-center text-2xl text-mainOrange mb-4">Game Guide</h2>
        
        <h3 class="text-xl font-semibold text-mainOrange border-b border-darkGray pb-1 mb-2">Objective</h3>
        <p class="mb-4">Stop the enemy waves before they reach your base (red tile). Build towers on empty fields (dark green) to destroy them. Earn gold for every enemy defeated.</p>
        
        <h3 class="text-xl font-semibold text-mainOrange border-b border-darkGray pb-1 mb-2">Your Towers</h3>
        <ul>
          <li class="mb-2"><b>Turret</b>: Versatile tower. Attacks <strong>ground and air</strong> targets. Good against everything.</li>
          <li class="mb-2"><b>Cannon</b>: Heavy cannon. Attacks <strong>GROUND targets ONLY</strong>. Deals area-of-effect (splash) damage - ideal against groups of Tanks and Vehicles.</li>
          <li class="mb-2"><b>AA Gun</b>: Specialist tower. Attacks <strong>AIR targets ONLY</strong>. Fires very fast. Essential for dealing with Helicopters and Jets.</li>
        </ul>

        <h3 class="text-xl font-semibold text-mainOrange border-b border-darkGray pb-1 mb-2">Enemy Units</h3>
        <ul>
          <li class="mb-2"><b>Vehicle (VEHICLE)</b>: Basic, fast ground unit.</li>
          <li class="mb-2"><b>Tank (TANK)</b>: Slow but durable ground target.</li>
          <li class="mb-2"><b>Helicopter (HELICOPTER)</b>: Basic flying unit. Ignores the path. <strong>Cannons cannot hit it.</strong></li>
          <li class="mb-2"><b>Jet (JET)</b>: Very fast flying unit. Low health, but hard to hit. <strong>Requires AA Guns.</strong></li>
          <li class="mb-2"><b>Boss (BOSS_TANK)</b>: Huge ground tank. Extremely durable and takes 5 base lives. <strong>Ignored by AA Guns.</strong></li>
        </ul>
      </div>
    </div>
  `,
})
export class TowerDefenseGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public override game!: TowerDefense;
  
  public showInfo = false;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as TowerDefense;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this.setupGame();
    this.render();
  }

  private setupGame(): void {
    const state = this.game.state;
    this._canvas.width = state.map[0].length * state.tileSize;
    this._canvas.height = state.map.length * state.tileSize;
    this.calculatePath();
  }

  public override restart(): void { 
    this.game.state = new TowerDefenseState(); 
    this.setupGame();
  }

  public toggleInfo(): void {
    this.showInfo = !this.showInfo;
    this.isPaused = this.showInfo;
  }

  public togglePause(): void {
    if (this.isPaused && this.showInfo) {
      return;
    }

    if (this.game.state.isWaveActive){
      this.isPaused = !this.isPaused;
    }
  }

  public getSelectedTowerData(): ITowerData {
    return TowerTypes[this.game.state.selectedTowerType];
  }

  public getCursorActionText(): string {
    const state = this.game.state;
    if (!state) return '';

    const tower = state.towers.find(t => t.x === state.cursorX && t.y === state.cursorY);

    if (tower) {
      const towerData = TowerTypes[tower.type.toUpperCase() as keyof typeof TowerTypes];
      const refund = Math.floor(tower.totalInvestedCost * 0.8);
      if (towerData.upgradesTo && towerData.upgradeCost) {
        const nextTowerData = TowerTypes[towerData.upgradesTo];
        return `Upgrade to: ${nextTowerData.name} (Cost: ${towerData.upgradeCost}) [Space] | Sell [E] (Profit: ${refund})`;
      }
      return `${towerData.name} (Max Level)| Sell [E] (Profit: ${refund})`;
    }
      const selectedData = this.getSelectedTowerData();
      if (selectedData.cost > 0) {
         return `Selected tower: ${selectedData.name} (Cost: ${selectedData.cost}) [Q]`;
      }
      return `Choose another tower [Q]`;
  }

  private handleGlobalInput(): void {
    const player = this.game.players[0];
    const pauseAction = player.inputData['pause'] as number;
    const infoAction = player.inputData['info'] as number;

    if (pauseAction === 1) {
      if (!this.game.state.isGameOver && !this.game.state.isGameWon) {
        this.togglePause();
        player.inputData['pause'] = 0;
      }
    }

    if (infoAction === 1) {
      this.toggleInfo();
      player.inputData['info'] = 0;
    }
  }

  protected override update(): void {
    this.handleGlobalInput();
    super.update();

    if (this.game.state.isGameOver || this.game.state.isGameWon) {
      const player = this.game.players[0];
      const action = player.inputData['action'] as number;

      if (action === 1 || action === 2) {
        let mapsDone = this.game.state.mapsCompleted; 
        if (this.game.state.isGameWon) {
          mapsDone++; 
        }
        this.restart()
        this.game.state.mapsCompleted = mapsDone;
        player.inputData['action'] = 0;
        return;
      }
    }
    else if (!this.isPaused) {
      //logika do budowania
      this.handleInput();
      this.handleActions();

      //logika podczas fali
      if (this.game.state.isWaveActive) {
        this.updateWave();
      }
    }
    this.render();
  }

  //logika gry
  private handleInput(): void {
    const player = this.game.players[0];
    const move = player.inputData['move'] as number;
    const state = this.game.state;

    let newCursorX = state.cursorX;
    let newCursorY = state.cursorY;

    if (move === 1) {
      newCursorY--;
    } else if (move === 2) {
      newCursorY++;
    } else if (move === 3) {
      newCursorX--;
    } else if (move === 4) {
      newCursorX++;
    }

    if (newCursorX >= 0 && newCursorX < state.map[0].length) {
      state.cursorX = newCursorX;
    }
    if (newCursorY >= 0 && newCursorY < state.map.length) {
      state.cursorY = newCursorY;
    }

    player.inputData['move'] = 0;
  }

  private handleActions(): void {
    const player = this.game.players[0];
    const action = player.inputData['action'] as number;
    const state = this.game.state;

    if (action === 1) {
      const towerOnTile = state.towers.find(t => t.x === state.cursorX && t.y === state.cursorY);
      
      if (towerOnTile) {
        this.tryUpgradeTower(towerOnTile);
      } else {
        this.tryPlaceTower(state.cursorX, state.cursorY);
      }
    } else if (action === 2 && !state.isWaveActive) {
      this.startWave();
    }
    
    if (action === 3) {
      const availableTowers = Object.keys(TowerTypes) as (keyof typeof TowerTypes)[];
      let currentIndex = availableTowers.indexOf(this.game.state.selectedTowerType);
      
      do {
        currentIndex = (currentIndex + 1) % availableTowers.length;
        this.game.state.selectedTowerType = availableTowers[currentIndex];
      } while (TowerTypes[this.game.state.selectedTowerType].cost === 0);
    }

    if (action === 4) {
      this.trySellTower(state.cursorX, state.cursorY);
    }

    player.inputData['action'] = 0;
  }

  private trySellTower(x: number, y: number): void {
    const state = this.game.state;
    const towerIndex = state.towers.findIndex(t => t.x === x && t.y === y);

    if (towerIndex !== -1) {
      const tower = state.towers[towerIndex];
      const refundAmount = Math.floor(tower.totalInvestedCost * 0.8); 
      
      state.gold += refundAmount;
      state.towers.splice(towerIndex, 1);
    }
  }

  private tryPlaceTower(x: number, y: number): void {
    const state = this.game.state;
    const selectedTower = this.getSelectedTowerData(); 
    const isFreeTile = state.map[y]?.[x] === 0;
    const isTowerAlreadyHere = state.towers.some(t => t.x === x && t.y === y);

    if (isFreeTile && !isTowerAlreadyHere && state.gold >= selectedTower.cost && selectedTower.cost > 0) {
      state.towers.push({
        x: x, y: y,
        type: state.selectedTowerType.toLowerCase(),
        range: selectedTower.range * state.tileSize,
        damage: selectedTower.damage,
        fireRate: selectedTower.fireRate,
        cooldown: 0,
        rotation: 0,
        totalInvestedCost: selectedTower.cost,
      });
      state.gold -= selectedTower.cost;
    }
  }

  private tryUpgradeTower(towerToUpgrade: ITower): void {
    const state = this.game.state;
    const currentTowerData = TowerTypes[towerToUpgrade.type.toUpperCase() as keyof typeof TowerTypes];

    if (!currentTowerData.upgradesTo || !currentTowerData.upgradeCost) {
      return;
    }
    if (state.gold < currentTowerData.upgradeCost) {
      return;
    }

    const nextTowerKey = currentTowerData.upgradesTo;
    const nextTowerData = TowerTypes[nextTowerKey];
    if (!nextTowerData) {
      console.error(`Error: Did not find data for upgrade: ${nextTowerKey}`);
      return;
    }

    state.gold -= currentTowerData.upgradeCost;
    towerToUpgrade.type = nextTowerKey.toLowerCase();
    
    towerToUpgrade.damage = nextTowerData.damage;
    towerToUpgrade.range = nextTowerData.range * state.tileSize;
    towerToUpgrade.fireRate = nextTowerData.fireRate;
    towerToUpgrade.totalInvestedCost += currentTowerData.upgradeCost;
  }

  private startWave(): void {
    const state = this.game.state;
    if (state.isWaveActive) return;
    if (state.path.length === 0) return;
    
    const mapKey = `map${state.currentMapIndex}` as keyof typeof WaveDefinitions;
    const wavesForThisMap = WaveDefinitions[mapKey];

    if (!wavesForThisMap || state.waveNumber >= wavesForThisMap.length) {
      console.error(`Error: No wave definition found for wave ${state.waveNumber} on map ${state.currentMapIndex}.`);
      state.isGameWon = true;
      return;
    }
    const waveData = wavesForThisMap[state.waveNumber];

    state.isWaveActive = true;
    let totalDelay = 0;
    let enemiesToSpawnThisWave = 0; 

    for (const group of waveData) {
      const enemyData = EnemyTypes[group.type as keyof typeof EnemyTypes];
      if (!enemyData) {
        console.error(`Error: Did not find enemy data for type: ${group.type}`);
        continue; 
      }
      enemiesToSpawnThisWave += group.count; 

      for (let i = 0; i < group.count; i++) {
        setTimeout(() => {
          if (!state.isWaveActive) return;
          const startPoint = state.path[0];
          const startX = (startPoint.x + 0.5) * state.tileSize;
          const startY = (startPoint.y + 0.5) * state.tileSize;
          state.enemies.push({
            x: startX, y: startY, health: enemyData.health, maxHealth: enemyData.health,
            id: state.nextEnemyId++, speed: enemyData.speed, reward: enemyData.reward,
            color: enemyData.color, pathIndex: 1, isFlying: enemyData.isFlying || false,
            type: group.type, rotation: 0,
          });
          state.enemiesToSpawn--;
        }, totalDelay);
        totalDelay += 500;
      }
      totalDelay += 2000;
    }
    state.enemiesToSpawn = enemiesToSpawnThisWave;
  }

  private updateBullets(): void {
    const state = this.game.state;
 
    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const bullet = state.bullets[i];
      const target = state.enemies.find(e => e.id === bullet.targetEnemyId);

      if (!target) {
        state.bullets.splice(i, 1);
        continue;
      }

      const dx = target.x - bullet.x;
      const dy = target.y - bullet.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < bullet.speed) {
        if (bullet.splashRadius > 0) {
          for (const enemy of state.enemies) {
            const distToExplosion = Math.sqrt(Math.pow(enemy.x - bullet.x, 2) + Math.pow(enemy.y - bullet.y, 2));
            if (distToExplosion <= bullet.splashRadius) {
              if (enemy.isFlying && bullet.canHitAir) {
                enemy.health -= bullet.damage;
              } else if (!enemy.isFlying && bullet.canHitGround) {
                enemy.health -= bullet.damage;
              }
            }
          }
        } else {
          target.health -= bullet.damage;
        }

        state.bullets.splice(i, 1);
      } else {
        bullet.x += (dx / distance) * bullet.speed;
        bullet.y += (dy / distance) * bullet.speed;
      }
    }
  }

  private updateWave(): void {
    this.moveEnemies();
    this.towersAttack();
    this.updateBullets();
    this.cleanupEnemies();

    const state = this.game.state;

    if (state.enemies.length === 0 && state.enemiesToSpawn === 0 && state.isWaveActive) {
      state.isWaveActive = false; 
      
      const mapKey = `map${state.currentMapIndex}` as keyof typeof WaveDefinitions;
      const wavesForThisMap = WaveDefinitions[mapKey];
      
      if (!wavesForThisMap || state.waveNumber + 1 >= wavesForThisMap.length) { 
        state.isGameWon = true; 
      } else {
        state.waveNumber++; 
      }
    }
  }

  private calculatePath(): void {
    this.game.state.path = findShortestPath(this.game.state.map);
  }

  private moveEnemies(): void {
    const state = this.game.state;
    const tileSize = state.tileSize;

    const baseTile = state.path[state.path.length - 1];
    const baseTargetX = (baseTile.x + 0.5) * tileSize;
    const baseTargetY = (baseTile.y + 0.5) * tileSize;

    for (const enemy of state.enemies) {
      let dx: number;
      let dy: number;

      if (enemy.isFlying) {
        dx = baseTargetX - enemy.x;
        dy = baseTargetY - enemy.y;
        
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < enemy.speed) {
          enemy.pathIndex = state.path.length; 
        } else {
          enemy.x += (dx / distance) * enemy.speed;
          enemy.y += (dy / distance) * enemy.speed;
        }

      } else {
        if (enemy.pathIndex >= state.path.length) continue;

        const targetPos = state.path[enemy.pathIndex];
        const targetX = (targetPos.x + 0.5) * tileSize;
        const targetY = (targetPos.y + 0.5) * tileSize;

        dx = targetX - enemy.x;
        dy = targetY - enemy.y;
        
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < enemy.speed) {
          enemy.pathIndex++;
        } else {
          enemy.x += (dx / distance) * enemy.speed;
          enemy.y += (dy / distance) * enemy.speed;
        }
      }

      if (dx !== 0 || dy !== 0) {
        enemy.rotation = Math.atan2(dy, dx);
      }
    }
  }

  private towersAttack(): void {
    const state = this.game.state;
    for (const tower of state.towers) {
      tower.cooldown++;
        const target = this.findTarget(tower);
        if (target) {
          const towerCenterX = (tower.x + 0.5) * state.tileSize;
          const towerCenterY = (tower.y + 0.5) * state.tileSize;
          const angle = Math.atan2(target.y - towerCenterY, target.x - towerCenterX);
          tower.rotation = angle;
      }
      if (target && tower.cooldown >= tower.fireRate) {
        tower.cooldown = 0;
        const towerCenterX = (tower.x + 0.5) * state.tileSize;
        const towerCenterY = (tower.y + 0.5) * state.tileSize;

        const towerData = TowerTypes[tower.type.toUpperCase() as keyof typeof TowerTypes];

        this.game.state.bullets.push({
          x: towerCenterX,
          y: towerCenterY,
          targetEnemyId: target.id,
          damage: tower.damage,
          speed: 8,
          color: 'white',
          splashRadius: (towerData.splashRadius || 0) * this.game.state.tileSize,
          canHitAir: towerData.canHitAir,
          canHitGround: towerData.canHitGround,
        });
      }
    }
  }
  
  private findTarget(tower: ITower): IEnemy | undefined {
    const towerCenterX = (tower.x + 0.5) * this.game.state.tileSize;
    const towerCenterY = (tower.y + 0.5) * this.game.state.tileSize;

    const towerData = TowerTypes[tower.type.toUpperCase() as keyof typeof TowerTypes];

    for (const enemy of this.game.state.enemies) {
        const distance = Math.sqrt(Math.pow(enemy.x - towerCenterX, 2) + Math.pow(enemy.y - towerCenterY, 2));
        if (distance > tower.range) {
            continue
        }
        if (enemy.isFlying && !towerData.canHitAir) {
            continue;
        }

        if (!enemy.isFlying && !towerData.canHitGround) {
            continue;
        }
        return enemy;
    }
    return undefined;
  }

  private cleanupEnemies(): void {
    const state = this.game.state;

    for (let i = state.enemies.length - 1; i >= 0; i--) {
      const enemy = state.enemies[i];

      if (enemy.pathIndex >= state.path.length) {
        if (enemy.type === 'BOSS_TANK') {
          state.baseHealth -= 10;
        } else {
          state.baseHealth -= 1;
        }

        if (state.baseHealth <= 0) {
          state.baseHealth = 0;
          state.isGameOver = true;
          state.isWaveActive = false;
        }
        
        state.enemies.splice(i, 1);
        continue;
      }
      
      if (enemy.health <= 0) {
        state.gold += enemy.reward;
        state.enemies.splice(i, 1);
        continue;
      }
    }
  }


  //rysowanie
  private render(): void {
    const context = this._canvas.getContext('2d');
    if (!context) return;
    const state = this.game.state;

    context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    
    Drawing.drawMap(context, state);
    Drawing.drawTowers(context, state);
    Drawing.drawEnemies(context, state);
    Drawing.drawBullets(context, state);
    
    if (!state.isGameOver && !state.isGameWon && !this.isPaused) {
      Drawing.drawCursor(context, state, () => this.getSelectedTowerData());
    }

    if (state.isGameOver) {
      Drawing.drawGameOver(context, this._canvas);
    } else if (state.isGameWon) {
      Drawing.drawGameWon(context, this._canvas);
    }

    if (this.isPaused && !state.isGameOver && !state.isGameWon && this.game.state.isWaveActive) {
      Drawing.drawPauseScreen(context, this._canvas);
    }
  }
}