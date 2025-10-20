/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-lines */
/* eslint-disable complexity */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { TowerDefense, TowerDefenseState, ITower, IEnemy } from './models/towerdefense.class';
import { TowerTypes, EnemyTypes, WaveDefinitions, ITowerData } from './models/towerdefense.data';

@Component({
  selector: 'app-towerdefense',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    <div>
      Życie Bazy: <b>{{ game.state.baseHealth }}</b> | 
      Złoto: <b>{{ game.state.gold }}</b> | 
      Fala: <b>{{ game.state.waveNumber + 1 }}</b> |
      Wybrana wieża: <b>{{ getSelectedTowerData().name }} (Koszt: {{ getSelectedTowerData().cost }})</b> [Q]
    </div>
    <app-canvas
      [displayMode]="'horizontal'"
      #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b> `,
})
export class TowerDefenseGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public override game!: TowerDefense;

  private readonly BUILD_COST = 100;

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

  public getSelectedTowerData(): ITowerData {
    return TowerTypes[this.game.state.selectedTowerType];
  }

  private handleGlobalInput(): void {
    const player = this.game.players[0];
    const pauseAction = player.inputData['pause'] as number;

    if (pauseAction === 1) {
      if (!this.game.state.isGameOver && !this.game.state.isGameWon) {
        this.isPaused = !this.isPaused;
      }
      player.inputData['pause'] = 0;
    }
  }

  protected override update(): void {
    this.handleGlobalInput();
    super.update();

    if (this.game.state.isGameOver || this.game.state.isGameWon) {
      const player = this.game.players[0];
      const action = player.inputData['action'] as number;

      if (action === 1 || action === 2) {
        this.restart();
        player.inputData['action'] = 0;
      }
    }
    else if (!this.isPaused) {
      //logika do budowania
      if (!this.game.state.isWaveActive) {
        this.handleInput();
        this.handleActions();
      }

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
    const moveX = player.inputData['moveX'] as number;
    const moveY = player.inputData['moveY'] as number;
    const state = this.game.state;

    const newCursorX = state.cursorX + moveX;
    const newCursorY = state.cursorY + moveY;

    if (newCursorX >= 0 && newCursorX < state.map[0].length) {
      state.cursorX = newCursorX;
    }
    if (newCursorY >= 0 && newCursorY < state.map.length) {
      state.cursorY = newCursorY;
    }

    player.inputData['moveX'] = 0;
    player.inputData['moveY'] = 0;
  }

  private handleActions(): void {
    const player = this.game.players[0];
    const action = player.inputData['action'] as number;
    const cycleTower = player.inputData['cycleTower'] as number;

    if (action === 1) {
      this.tryPlaceTower(this.game.state.cursorX, this.game.state.cursorY);
    } else if (action === 2) {
      this.startWave();
    }
    
    //przełączanie wież
    if (cycleTower === 1) {
      const availableTowers = Object.keys(TowerTypes) as (keyof typeof TowerTypes)[];
      const currentIndex = availableTowers.indexOf(this.game.state.selectedTowerType);
      const nextIndex = (currentIndex + 1) % availableTowers.length;
      this.game.state.selectedTowerType = availableTowers[nextIndex];
    }

    player.inputData['action'] = 0;
    player.inputData['cycleTower'] = 0;
  }

  private tryPlaceTower(x: number, y: number): void {
    const state = this.game.state;
    const selectedTower = this.getSelectedTowerData(); 
    const isFreeTile = state.map[y]?.[x] === 0;
    const isTowerAlreadyHere = state.towers.some(t => t.x === x && t.y === y);

    if (isFreeTile && !isTowerAlreadyHere && state.gold >= selectedTower.cost) {
      state.towers.push({
        x: x, y: y,
        type: state.selectedTowerType.toLowerCase() as ITower['type'],
        range: selectedTower.range * state.tileSize,
        damage: selectedTower.damage,
        fireRate: selectedTower.fireRate,
        cooldown: 0,
        rotation: 0,
      });
      state.gold -= selectedTower.cost;
    }
  }

  private startWave(): void {
    const state = this.game.state;
    if (state.isWaveActive) return;
    if (state.path.length === 0) return;
    
    const waveIndex = state.waveNumber % WaveDefinitions.length;
    const waveData = WaveDefinitions[waveIndex];

    state.isWaveActive = true;
    let totalDelay = 0;
    
    state.enemiesToSpawn = 0;
    for (const group of waveData) {
      state.enemiesToSpawn += group.count;
    }

    for (const group of waveData) {
      const enemyData = EnemyTypes[group.type as keyof typeof EnemyTypes];
      for (let i = 0; i < group.count; i++) {
        setTimeout(() => {
          if (!state.isWaveActive) return;

          const startPoint = state.path[0];
          const startX = (startPoint.x + 0.5) * state.tileSize;
          const startY = (startPoint.y + 0.5) * state.tileSize;

          state.enemies.push({
            x: startX, y: startY,
            health: enemyData.health,
            maxHealth: enemyData.health,
            id: state.nextEnemyId++,
            speed: enemyData.speed,
            reward: enemyData.reward,
            color: enemyData.color,
            pathIndex: 1,
          });
          state.enemiesToSpawn--;
        }, totalDelay);
        totalDelay += 500;
      }
      totalDelay += 2000;
    }
  }

  private updateBullets(): void {
    const state = this.game.state;
    state.bullets = state.bullets.filter(bullet => {
      const target = state.enemies.find(e => e.id === bullet.targetEnemyId);

      if (!target) {
        return false;
      }

      const dx = target.x - bullet.x;
      const dy = target.y - bullet.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < bullet.speed) {
        target.health -= bullet.damage;
        return false;
      }
      bullet.x += (dx / distance) * bullet.speed;
      bullet.y += (dy / distance) * bullet.speed;
      return true;
    });
  }

  private updateWave(): void {
    this.moveEnemies();
    this.towersAttack();
    this.updateBullets();
    this.cleanupEnemies();

    const state = this.game.state;

    if (state.enemies.length === 0 && state.enemiesToSpawn === 0 && state.isWaveActive) {
      state.isWaveActive = false;
      if (state.waveNumber + 1 >= WaveDefinitions.length) {
        state.isGameWon = true;
      } else {
        state.waveNumber++;
      }
    }
  }

  //logika ruchu oraz ścieżka
  private calculatePath(): void {
    const map = this.game.state.map;
    let startPos: { x: number; y: number } | null = null;

    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        if (map[y][x] === 3) {
          startPos = { x, y };
          break;
        }
      }
    }

    if (!startPos) {
      console.error("Błąd: Nie znaleziono punktu startowego na mapie!");
      return;
    }

    const path: { x: number; y: number }[] = [];
    let currentPos = startPos;
    let prevPos = { x: -1, y: -1 };

    while (map[currentPos.y][currentPos.x] !== 4) {
      path.push(currentPos);
      const { x, y } = currentPos;
      const neighbors = [ { x, y: y - 1 }, { x, y: y + 1 }, { x: x - 1, y }, { x: x + 1, y }];

      let foundNext = false;
      for (const nextPos of neighbors) {
        if (nextPos.x < 0 || nextPos.y < 0 || nextPos.y >= map.length || nextPos.x >= map[0].length) continue;
        if (nextPos.x === prevPos.x && nextPos.y === prevPos.y) continue;

        const tileValue = map[nextPos.y][nextPos.x];
        if (tileValue === 2 || tileValue === 4) {
          prevPos = currentPos;
          currentPos = nextPos;
          foundNext = true;
          break;
        }
      }
      if (!foundNext) break;
    }
    path.push(currentPos);
    this.game.state.path = path;
  }

  private moveEnemies(): void {
    const state = this.game.state;
    const tileSize = state.tileSize;

    for (const enemy of state.enemies) {
      if (enemy.pathIndex >= state.path.length) continue;

      const targetPos = state.path[enemy.pathIndex];
      const targetX = (targetPos.x + 0.5) * tileSize;
      const targetY = (targetPos.y + 0.5) * tileSize;

      const dx = targetX - enemy.x;
      const dy = targetY - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < enemy.speed) {
        enemy.pathIndex++;
      } else {
        enemy.x += (dx / distance) * enemy.speed;
        enemy.y += (dy / distance) * enemy.speed;
      }
    }
  }

  private towersAttack(): void {
    for (const tower of this.game.state.towers) {
      tower.cooldown++;
      if (tower.cooldown >= tower.fireRate) {
        const target = this.findTarget(tower);
        if (target) {
          tower.cooldown = 0;
          const towerCenterX = (tower.x + 0.5) * this.game.state.tileSize;
          const towerCenterY = (tower.y + 0.5) * this.game.state.tileSize;

          const angle = Math.atan2(target.y - towerCenterY, target.x - towerCenterX);
          tower.rotation = angle;
          
          this.game.state.bullets.push({
            x: towerCenterX,
            y: towerCenterY,
            targetEnemyId: target.id,
            damage: tower.damage,
            speed: 8,
            color: 'white',
          });
        }
      }
    }
  }
  
  private findTarget(tower: ITower): IEnemy | undefined {
    const towerCenterX = (tower.x + 0.5) * this.game.state.tileSize;
    const towerCenterY = (tower.y + 0.5) * this.game.state.tileSize;

    for (const enemy of this.game.state.enemies) {
        const distance = Math.sqrt(Math.pow(enemy.x - towerCenterX, 2) + Math.pow(enemy.y - towerCenterY, 2));
        if (distance <= tower.range) {
            return enemy;
        }
    }
    return undefined;
  }

  private cleanupEnemies(): void {
    const state = this.game.state;
    state.enemies = state.enemies.filter(enemy => {
      if (enemy.pathIndex >= state.path.length) {
        state.baseHealth--;

        if (state.baseHealth <= 0) {
          state.baseHealth = 0;
          state.isGameOver = true;
          state.isWaveActive = false;
        }
        return false;
      }
      
      if (enemy.health <= 0) {
        state.gold += enemy.reward;
        return false;
      }
      return true;
    });
  }


  //rysowanie
  private render(): void {
    const context = this._canvas.getContext('2d');
    if (!context) return;
    
    context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this.drawMap(context);
    this.drawTowers(context);
    this.drawEnemies(context);
    this.drawBullets(context);

    if (!this.game.state.isWaveActive && !this.game.state.isGameOver) {
      this.drawCursor(context);
    }

    if (this.game.state.isGameOver) {
      this.drawGameOver(context);
    } else if (this.game.state.isGameWon) {
      this.drawGameWon(context);
    }

    if (this.isPaused && !this.game.state.isGameOver && !this.game.state.isGameWon && this.game.state.isWaveActive) {
      this.drawPauseScreen(context);
    }
  }

  private drawMap(context: CanvasRenderingContext2D): void {
    const { tileSize, map } = this.game.state;
    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        const tileValue = map[y][x];
        const px = x * tileSize;
        const py = y * tileSize;

        context.strokeStyle = '#333';
        context.lineWidth = 1;
        
        switch (tileValue) {
          case 1: context.fillStyle = '#666'; break;
          case 2: context.fillStyle = '#bbb'; break;
          case 3: context.fillStyle = 'yellow'; break;
          case 4: context.fillStyle = 'red'; break;
          default: context.fillStyle = '#111';
        }
        context.fillRect(px, py, tileSize, tileSize);
        context.strokeRect(px, py, tileSize, tileSize);
      }
    }
  }

  private drawCursor(context: CanvasRenderingContext2D): void {
    const { tileSize, cursorX, cursorY, gold } = this.game.state;
    const x = cursorX * tileSize;
    const y = cursorY * tileSize;

    context.strokeStyle = gold >= this.getSelectedTowerData().cost ? 'lime' : 'orange';
    context.lineWidth = 3;
    context.strokeRect(x + 1.5, y + 1.5, tileSize - 3, tileSize - 3);
  }

  private drawTowers(context: CanvasRenderingContext2D): void {
    const { tileSize, towers, isWaveActive } = this.game.state;
    for (const tower of towers) {
      const centerX = (tower.x + 0.5) * tileSize;
      const centerY = (tower.y + 0.5) * tileSize;
      
      const towerData = TowerTypes[tower.type.toUpperCase() as keyof typeof TowerTypes];
      context.fillStyle = towerData.color;

      if (!isWaveActive) {
        context.fillStyle = 'rgba(173, 216, 230, 0.2)';
        context.beginPath();
        context.arc(centerX, centerY, tower.range, 0, Math.PI * 2);
        context.fill();
      }

      context.fillStyle = towerData.color;
      context.fillStyle = '#777';
      context.fillRect(centerX - tileSize / 3, centerY - tileSize / 3, tileSize * 2 / 3, tileSize * 2 / 3);
      context.strokeStyle = '#444';
      context.lineWidth = 2;
      context.strokeRect(centerX - tileSize / 3, centerY - tileSize / 3, tileSize * 2 / 3, tileSize * 2 / 3);

      context.save();
      context.translate(centerX, centerY);
      context.rotate(tower.rotation);

      context.fillStyle = towerData.color;
      context.fillRect(0, -tileSize / 8, tileSize / 2, tileSize / 4);
      context.strokeStyle = '#333';
      context.strokeRect(0, -tileSize / 8, tileSize / 2, tileSize / 4);

      context.restore();
    }
  }

  private drawEnemies(context: CanvasRenderingContext2D): void {
    const { tileSize, enemies } = this.game.state;
    const radius = tileSize / 3;

    for (const enemy of enemies) {
      context.fillStyle = enemy.color;
      context.beginPath();
      context.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
      context.fill();

      const healthPercentage = enemy.health / enemy.maxHealth;
      const healthBarWidth = tileSize * 0.8;
      const barX = enemy.x - healthBarWidth / 2;
      const barY = enemy.y - radius - 8;

      context.fillStyle = 'red';
      context.fillRect(barX, barY, healthBarWidth, 5);
      context.fillStyle = 'lime';
      context.fillRect(barX, barY, healthBarWidth * healthPercentage, 5);
    }
  }

  private drawBullets(context: CanvasRenderingContext2D): void {
    const { bullets } = this.game.state;
    for (const bullet of bullets) {
      context.fillStyle = bullet.color;
      context.beginPath();
      context.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
      context.fill();
    }
  }

  private drawGameOver(context: CanvasRenderingContext2D): void {
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, this._canvas.width, this._canvas.height);

    context.fillStyle = 'white';
    context.font = '36px sans-serif';
    context.textAlign = 'center';
    context.fillText('GAME OVER', this._canvas.width / 2, this._canvas.height / 2 - 30);

    context.font = '12px sans-serif';
    context.fillText('Naciśnij Enter lub Spację, aby zrestartować', this._canvas.width / 2, this._canvas.height / 2 + 20);
  }

  private drawGameWon(context: CanvasRenderingContext2D): void {
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, this._canvas.width, this._canvas.height);

    context.fillStyle = 'white';
    context.font = '36px sans-serif';
    context.textAlign = 'center';
    context.fillText('WIN!', this._canvas.width / 2, this._canvas.height / 2 - 30);

    context.font = '12px sans-serif';
    context.fillText('Naciśnij Enter lub Spację, aby kontynuować', this._canvas.width / 2, this._canvas.height / 2 + 20);
  }

  private drawPauseScreen(context: CanvasRenderingContext2D): void {
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, this._canvas.width, this._canvas.height);

    context.fillStyle = 'white';
    context.font = '36px sans-serif';
    context.textAlign = 'center';
    context.fillText('PAUZA', this._canvas.width / 2, this._canvas.height / 2);
  }
}