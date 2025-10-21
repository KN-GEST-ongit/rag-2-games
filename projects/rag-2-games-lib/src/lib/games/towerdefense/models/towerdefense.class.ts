/* eslint-disable @typescript-eslint/naming-convention */
import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';
import { TowerDefenseMaps } from './towerdefense.maps';
import { TowerTypes } from './towerdefense.data';

export interface ITower {
  x: number;
  y: number;
  type: string;
  range: number;
  damage: number;
  fireRate: number;
  cooldown: number;
  rotation: number;
  totalInvestedCost: number;
}

export interface IEnemy {
  x: number;
  y: number;
  id: number;
  health: number;
  maxHealth: number;
  speed: number;
  reward: number;
  color: string;
  pathIndex: number;
  isFlying: boolean;
  type: string;
  rotation: number;
}

export interface IBullet {
  x: number;
  y: number;
  targetEnemyId: number;
  damage: number;
  speed: number;
  color: string;
  splashRadius: number;
  canHitAir: boolean;
  canHitGround: boolean;
}

export class TowerDefenseState implements TGameState {
  public tileSize = 40;
  public baseHealth = 20;
  public gold = 200;
  public waveNumber = 0;
  public isWaveActive = false;
  public cursorX = 1;
  public cursorY = 1;
  public nextEnemyId = 0;
  public isGameOver = false;
  public isGameWon = false;

  public towers: ITower[] = [];
  public enemies: IEnemy[] = [];
  public map: number[][];
  public bullets: IBullet[] = [];

  public path: { x: number; y: number }[] = [];

  public selectedTowerType: keyof typeof TowerTypes = 'BASIC';

  public enemiesToSpawn = 0;

  public constructor(map?: number[][]) {
    this.map = map ?? TowerDefenseMaps[0];
  }
}

export class TowerDefense extends Game {
  public override name = 'towerdefense';
  public override author = 'Norbert Mazur';
  public override state = new TowerDefenseState();

  private mapWidth = this.state.map[0].length;
  private mapHeight = this.state.map.length;

  public override outputSpec = `
    output:
    tileSize: int, <1, 100>;
    baseHealth: int, <0, inf>;
    gold: int, <0, inf>;
    waveNumber: int, <0, inf>;
    isWaveActive: boolean;
    cursorX: int, <0, ${this.mapWidth - 1}>;
    cursorY: int, <0, ${this.mapHeight - 1}>;
    map: int[${this.mapHeight}][${this.mapWidth}] (0: wolne, 1: ściana, 2: start, 3: baza);
    isGameOver: boolean;
    isGameWon: boolean;

  default values:
    tileSize: ${this.state.tileSize};
    baseHealth: ${this.state.baseHealth};
    gold: ${this.state.gold};
    waveNumber: ${this.state.waveNumber};
    isWaveActive: ${this.state.isWaveActive};
    cursorX: ${this.state.cursorX};
    cursorY: ${this.state.cursorY};
    map: [[...]];
    isGameOver: ${this.state.isGameOver};
    isGameWon: ${this.state.isGameWon};
    `;
    
   public override players = [
    new Player(
      0,
      true,
      'Player 1',
      { moveX: 0, moveY: 0, action: 0, cycleTower: 0, pause: 0, sell: 0 },
      {
        w: { variableName: 'moveY', pressedValue: -1, releasedValue: 0 },
        s: { variableName: 'moveY', pressedValue: 1, releasedValue: 0 },
        a: { variableName: 'moveX', pressedValue: -1, releasedValue: 0 },
        d: { variableName: 'moveX', pressedValue: 1, releasedValue: 0 },
        ArrowUp: { variableName: 'moveY', pressedValue: -1, releasedValue: 0 },
        ArrowDown: { variableName: 'moveY', pressedValue: 1, releasedValue: 0 },
        ArrowLeft: { variableName: 'moveX', pressedValue: -1, releasedValue: 0 },
        ArrowRight: { variableName: 'moveX', pressedValue: 1, releasedValue: 0 },
        ' ': { variableName: 'action', pressedValue: 1, releasedValue: 0 },
        Enter: { variableName: 'action', pressedValue: 2, releasedValue: 0 },

        q: { variableName: 'cycleTower', pressedValue: 1, releasedValue: 0 },
        p: { variableName: 'pause', pressedValue: 1, releasedValue: 0 },
        e: { variableName: 'sell', pressedValue: 1, releasedValue: 0 },
      },
      `
      ...
      `,
      {
        up: '[W]/[↑]',
        down: '[S]/[↓]',
        left: '[A]/[←]',
        right: '[D]/[→]',
        build: '[SPACE]',
        startWave: '[ENTER]',
        pause: '[P]',
        cycleTower: '[Q]',
        sell: '[E]'
      }
    ),
  ];
}