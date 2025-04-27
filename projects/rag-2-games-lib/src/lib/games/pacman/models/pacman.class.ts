import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class PacmanState implements TGameState {
    public tileSize = 35;
    public pacmanX: number;
    public pacmanY: number;
    public speed = 2;
    public score = 0;

    public ghostX: number;
    public ghostY: number;
    public ghostSpeed = 2;

    public isGameStarted = false;

    public map: number[][];

    public constructor(map?: number[][]) {
      this.map = map ?? [
        [1, 1, 1],
        [1, 0, 1],
        [1, 1, 1],
      ];
    
      this.pacmanX = 1.5 * this.tileSize;
      this.pacmanY = 1.5 * this.tileSize;
      this.ghostX = 12.5 * this.tileSize;
      this.ghostY = 9.5 * this.tileSize;
    }
}

export class Pacman extends Game {
    public override name = 'pacman';
    public override state = new PacmanState();

    public override outputSpec = ``;
    public override players = [
        new Player(
            0,
            true,
            'Player 1',
            { moveX: 0, moveY: 0 },
            {
              w: { variableName: 'moveY', pressedValue: -1, releasedValue: 0 },
              s: { variableName: 'moveY', pressedValue: 1, releasedValue: 0 },
              a: { variableName: 'moveX', pressedValue: -1, releasedValue: 0 },
              d: { variableName: 'moveX', pressedValue: 1, releasedValue: 0 },
            },
            '<moveX>: value of {-1, 0, 1}, -1: left, 0: stop, 1: right; <moveY>: value of {-1, 0, 1}, -1: up, 0: stop, 1: down',
            { up: '[W]', down: '[S]', left: '[A]', right: '[D]' }
        ),
    ];
}