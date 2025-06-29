import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export interface IEnemy {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  isVisible: boolean;
  respawnTimer: number;
  color: string;
}

export class PacmanState implements TGameState {
  public tileSize = 35;
  public pacmanX: number;
  public pacmanY: number;
  public speed = 3;
  public score = 0;

  public level = 1;

  public isGameStarted = false;
  public isPowerMode = false;
  public powerModeTimer = 0;
  public maxPowerModeTime = 420;

  public enemies: IEnemy[] = [];

  public map: number[][];

  public constructor(map?: number[][]) {
    this.map = map ?? [
      [1, 1, 1],
      [1, 0, 1],
      [1, 1, 1],
    ];

    this.pacmanX = 1.5 * this.tileSize;
    this.pacmanY = 1.5 * this.tileSize;
    this.enemies = [
      {
        x: 12.5 * this.tileSize,
        y: 9.5 * this.tileSize,
        dirX: 1,
        dirY: 0,
        isVisible: true,
        respawnTimer: 0,
        color: 'red',
      },
      {
        x: 11.5 * this.tileSize,
        y: 9.5 * this.tileSize,
        dirX: -1,
        dirY: 0,
        isVisible: true,
        respawnTimer: 0,
        color: 'cyan',
      },
      {
        x: 11.5 * this.tileSize,
        y: 8.5 * this.tileSize,
        dirX: 0,
        dirY: -1,
        isVisible: true,
        respawnTimer: 0,
        color: 'pink',
      },
      {
        x: 12.5 * this.tileSize,
        y: 8.5 * this.tileSize,
        dirX: 0,
        dirY: 1,
        isVisible: true,
        respawnTimer: 0,
        color: 'orange',
      },
    ];
  }
}

export class Pacman extends Game {
  public override name = 'pacman';
  public override author = 'Norbert Mazur';
  public override state = new PacmanState();

  public override outputSpec = `
    output:
    pacmanX: float, <0, ${24 * this.state.tileSize}>;
    pacmanY: float, <0, ${16 * this.state.tileSize}>;
    ghostX: float, <0, ${24 * this.state.tileSize}>;
    ghostY: float, <0, ${16 * this.state.tileSize}>;
    tileSize: int, <1, 100>;
    speed: float, <1, 10>;
    ghostSpeed: float, <1, 10>;
    score: int, <0, inf>;
    level: int, <1, inf>;
    isGameStarted: boolean;
    isPowerMode: boolean;
    powerModeTimer: int, <0, inf>;
    maxPowerModeTime: int, <1, inf>;
    map: int[${this.state.map.length}][${this.state.map[0].length}] (0: empty, 1: wall, 2: point, 3: superpoint);

  default values:
    pacmanX: ${this.state.pacmanX};
    pacmanY: ${this.state.pacmanY};
    tileSize: ${this.state.tileSize};
    speed: ${this.state.speed};
    score: 0;
    level: 1;
    isGameStarted: false;
    isPowerMode: false;
    powerModeTimer: 0;
    maxPowerModeTime: ${this.state.maxPowerModeTime};
    map: [[...]];
    `;
  public override players = [
    new Player(
      0,
      true,
      'Player 1',
      { move: 0 },
      {
        w: { variableName: 'move', pressedValue: 3, releasedValue: 0 },
        s: { variableName: 'move', pressedValue: 4, releasedValue: 0 },
        a: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        d: { variableName: 'move', pressedValue: 2, releasedValue: 0 },

        ArrowUp: { variableName: 'move', pressedValue: 3, releasedValue: 0 },
        ArrowDown: { variableName: 'move', pressedValue: 4, releasedValue: 0 },
        ArrowLeft: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        ArrowRight: { variableName: 'move', pressedValue: 2, releasedValue: 0 },
      },
      '<move>: value of {0: stop, 1: left, 2: right, 3: up, 4: down}',
      { up: '[W]/[↑]', down: '[S]/[↓]', left: '[A]/[←]', right: '[D]/[→]' }
    ),
  ];
}
