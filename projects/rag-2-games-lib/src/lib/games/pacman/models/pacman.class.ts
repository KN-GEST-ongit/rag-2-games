import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class PacmanState implements TGameState {
    public tileSize = 40;
    public pacmanX = 1.5 * this.tileSize;
    public pacmanY = 1.5 * this.tileSize;
    public speed = 2;
    public movingDirectionX = 0;
    public movingDirectionY = 0;
    public inputDirectionX = 0;
    public inputDirectionY = 0;
    public score = 0;
    
    // 1 - wall
    // 2 - point
    public map: number[][] = [
      [1,1,1,1,1,1,1,1,1,1,1],
      [1,2,2,2,1,2,2,2,2,2,1],
      [1,2,1,2,1,2,1,1,1,2,1],
      [1,2,1,2,2,2,2,2,1,2,1],
      [1,2,1,1,1,1,1,2,1,2,1],
      [1,2,2,2,2,2,2,2,1,2,1],
      [1,2,1,1,1,1,1,1,1,2,1],
      [1,2,2,2,2,2,2,2,2,2,1],
      [1,1,1,1,1,1,1,1,1,1,1],
    ];
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