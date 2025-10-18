/* eslint-disable @typescript-eslint/naming-convention */
import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';
import { IBombermanBomb, IBombermanWall } from './bomberman.object';

export class BombermanState implements TGameState {
  public player1x = 1;
  public player1y = 1;
  public player1lives = 3;
  public player1score = 0;
  public player1alive = true;
  public player1bombCount = 1;
  public player1bombRange = 1;

  public player2x = 13;
  public player2y = 11;
  public player2lives = 3;
  public player2score = 0;
  public player2alive = true;
  public player2bombCount = 1;
  public player2bombRange = 1;

  public walls: IBombermanWall[] = [];
  public bombs: IBombermanBomb[] = [];
  public gridSize = 30;
  public isGameOver = false;
  public winner = 0;
}

export class Bomberman extends Game {
  public override name = 'bomberman';
  public override author = 'Norbert Stachowicz';
  public override state = new BombermanState();

  public override outputSpec = `
        output:
            player1x: int, <0, 14>;
            player1y: int, <0, 12>;
            player1lives: int, <0, 3>;
            player1score: int, <0, inf>;
            player1alive: boolean
            player1bombCount: int, <1, 10>;
            player1bombRange: int, <1, 10>;

            player2x: int, <0, 14>;
            player2y: int, <0, 12>;
            player2lives: int, <0, 3>;
            player2score: int, <0, inf>;
            player2alive: boolean
            player2bombCount: int, <1, 10>;
            player2bombRange: int, <1, 10>;

            walls: [{ x: int, <0, 14>, y: int, <0, 12>, destructible: boolean }];
            bombs: [{ playerId: int, <1, 2>, x: int, <0, 14>, y: int, <0, 12>, timer: int, <0, 3000>, range: int, <1, 10> }];
            gridSize: int, <20, 40>;
            isGameOver: boolean;
            winner: int, <0, 2>;

            default values:
            player1x: 1;
            player1y: 1;
            player1lives: 3;
            player1score: 0;
            player1alive: true;
            player1bombCount: 1;
            player1bombRange: 2;

            player2x: 13;
            player2y: 11;
            player2lives: 3;
            player2score: 0;
            player2alive: true;
            player2bombCount: 1;
            player2bombRange: 2;

            walls: [];
            bombs: [];
            gridSize: 30;
            isGameOver: false;
            winner: 0;  
            `;
  public override players = [
    new Player(
      1,
      true,
      'Player 1',
      { moveX: 0, moveY: 0, bomb: 0 },
      {
        w: {
          variableName: 'moveY',
          pressedValue: -1,
          releasedValue: 0,
        },
        s: {
          variableName: 'moveY',
          pressedValue: 1,
          releasedValue: 0,
        },
        a: {
          variableName: 'moveX',
          pressedValue: -1,
          releasedValue: 0,
        },
        d: {
          variableName: 'moveX',
          pressedValue: 1,
          releasedValue: 0,
        },
        ' ': {
          variableName: 'bomb',
          pressedValue: 1,
          releasedValue: 0,
        },
      },
      '<moveX>: value of {-1, 0, 1}, -1: left, 0: stop, 1: right; <moveY>: value of {-1, 0, 1}, -1: up, 0: stop, 1: down; <bomb>: value of {0, 1}, 0: no bomb, 1: place bomb',
      {
        up: '[W]',
        down: '[S]',
        left: '[A]',
        right: '[D]',
        bomb: '[SPACE]',
      }
    ),
    new Player(
      2,
      true,
      'Player 2',
      { moveX: 0, moveY: 0, bomb: 0 },
      {
        ArrowUp: {
          variableName: 'moveY',
          pressedValue: -1,
          releasedValue: 0,
        },
        ArrowDown: {
          variableName: 'moveY',
          pressedValue: 1,
          releasedValue: 0,
        },
        ArrowLeft: {
          variableName: 'moveX',
          pressedValue: -1,
          releasedValue: 0,
        },
        ArrowRight: {
          variableName: 'moveX',
          pressedValue: 1,
          releasedValue: 0,
        },
        Enter: {
          variableName: 'bomb',
          pressedValue: 1,
          releasedValue: 0,
        },
      },
      '<moveX>: value of {-1, 0, 1}, -1: left, 0: stop, 1: right; <moveY>: value of {-1, 0, 1}, -1: up, 0: stop, 1: down; <bomb>: value of {0, 1}, 0: no bomb, 1: place bomb',
      {
        up: '[ARROW_UP]',
        down: '[ARROW_DOWN]',
        left: '[ARROW_LEFT]',
        right: '[ARROW_RIGHT]',
        bomb: '[ENTER]',
      }
    ),
  ];
}
