import { TGameState } from '@gameModels/game-state.type';
import { Game } from '@gameModels/game.class';
import { Player } from '@gameModels/player.class';

export class PongState implements TGameState {
  public leftPaddleY = 0;
  public rightPaddleY = 0;
  public leftPaddleSpeed = 0;
  public rightPaddleSpeed = 0;
  public ballX = 0;
  public ballY = 0;
  public ballSpeedX = 0;
  public ballSpeedY = 0;
  public ballSpeedMultiplier = 1;
  public scoreLeft = 0;
  public scoreRight = 0;
}

export class Pong extends Game {
  public override name = 'pong';
  public override state = new PongState();
  public override outputSpec = `
      output:
        leftPaddleY: int, <0, 600>;
        rightPaddleY: int, <0, 600>;
        leftPaddleSpeed: int, {-20, 0, 20};
        rightPaddleSpeed: int, {-20, 0, 20};
        ballX: float, <0, 1000>;
        ballY: float, <0, 600>;
        ballSpeedX: float, <-inf, inf>;
        ballSpeedY: float, <-inf, inf>;
        ballSpeedMultiplier: float, <1, inf>;
        scoreLeft: int, <0, inf>;
        scoreRight: int, <0, inf>;

      default values:
        ballX: 500;
        ballY: 300;
        leftPaddleY: 250;
        rightPaddleY: 250;
    `;
  public override players = [
    new Player(
      0,
      true,
      'Player 1',
      { move: 0, start: 0 },
      {
        w: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        s: { variableName: 'move', pressedValue: -1, releasedValue: 0 },
        ' ': { variableName: 'start', pressedValue: 1, releasedValue: 0 },
      },
      '<move>: value of {-1, 0, 1}, -1: down, 0: stop, 1: up; <start>: value of {0, 1}, 0: not start, 1: start',
      { up: '[W]', down: '[S]', start: '[SPACE]' }
    ),
    new Player(
      1,
      true,
      'Player 2',
      { move: 0, start: 0 },
      {
        ArrowUp: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        ArrowDown: { variableName: 'move', pressedValue: -1, releasedValue: 0 },
        ' ': { variableName: 'start', pressedValue: 1, releasedValue: 0 },
      },
      '<move>: value of {-1, 0, 1}, -1: down, 0: stop, 1: up; <start>: value of {0, 1}, 0: not start, 1: start',
      { up: '[ARROW_UP]', down: '[ARROW_DOWN]', start: '[SPACE]' }
    ),
  ];
}
