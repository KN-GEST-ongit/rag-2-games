import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';
import { ISnakeObject } from '../../../games/snake/models/snake.object';

export class SnakeState implements TGameState {
  public currentScore = 0;
  public previousScore = 0;
  public segments: ISnakeObject[] = [{ x: 10, y: 10 }];
  public direction = 'none';
  public velocity = 0;
  public gridSize = 30;
  public isGameOver = false;
  public foodItem: ISnakeObject = {
    x: Math.floor(Math.random() * 50),
    y: Math.floor(Math.random() * 30),
  };
}

export class Snake extends Game {
  public override name = 'snake';
  public override author = 'Norbert Stachowicz';
  public override state = new SnakeState();

  public override outputSpec = `
        output:
            segments: [{ x: int, <0, 49>, y: int, <0, 29> }];
            direction: string, {'up', 'down', 'left', 'right', 'none'};
            velocity: int, <0, 75>;
            currentScore: int, <0, inf>;
            previousScore: int, <0, inf>;
            gridSize: int, <10, 30>;
            foodItem: { x: int, <0, 49>, y: int, <0, 29> };
            isGameOver: boolean;
        
        default values:
            segments: [{ x: 10, y: 10 }];
            direction: 'none';
            velocity: 0;
            currentScore: 0;
            previousScore: 0;
            gridSize: 20;
            foodItem: { x: 15, y: 15 };
            isGameOver: false;
    `;
  public override players = [
    new Player(
      0,
      true,
      'Player 1',
      { move: 0 },
      {
        ArrowUp: {
          variableName: 'move',
          pressedValue: 4,
          releasedValue: 0,
        },
        ArrowDown: {
          variableName: 'move',
          pressedValue: 3,
          releasedValue: 0,
        },
        ArrowLeft: {
          variableName: 'move',
          pressedValue: 2,
          releasedValue: 0,
        },
        ArrowRight: {
          variableName: 'move',
          pressedValue: 1,
          releasedValue: 0,
        },
        ' ': {
          variableName: 'start',
          pressedValue: 1,
          releasedValue: 0,
        },
      },
      '<move>: value of {0, 1, 2, 3, 4}, 0: stop, 1: right, 2: left, 3: down, 4: up;',
      {
        up: '[ARROW_UP]',
        down: '[ARROW_DOWN]',
        left: '[ARROW_LEFT]',
        right: '[ARROW_RIGHT]',
      }
    ),
  ];
}
