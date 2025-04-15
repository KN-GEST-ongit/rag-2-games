import { TGameState } from '@gameModels/game-state.type';
import { Game } from '@gameModels/game.class';
import { Player } from '@gameModels/player.class';

export class HappyJumpState implements TGameState {
  public playerX = 185;
  public playerY = 570;
  public playerSpeedX = 0;
  public playerSpeedY = 0;
  public gravity = 0.5;
  public jumpPowerY = 10;
  public platformSpeed = 2;
  public movingPlatforms = 0;
  public score = 0;
  public difficulty = 1;
  public platforms = Array.from({ length: 5 }, (_, i) => ({
    x: Math.random() * 800,
    y: i * 120,
    directionX: 0,
  }));
  public isGameStarted = false;
  public failCounter = 0;
}

export class HappyJump extends Game {
  public override name = 'happyjump';
  public override state = new HappyJumpState();

  public override outputSpec = `
      output:
        playerX: float, <0, 400>;
        playerY: float, <0, 600>;
        playerSpeedX: float, <-5, 5>;
        playerSpeedY: float, <-20, 50>;
        gravity: float, <0.5, 1>;
        jumpPowerY: float, <10, 15>;
        platformSpeed: float, <2, 6>;
        movingPlatforms: int, <0, 5>;
        score: int, <0, inf>;
        difficulty: int, <0, inf>
        platforms: [{ x: float, <0, 400>, y: float, <0, 600>, directionX: int, <-1,1> }];
        isGameStarted: boolean;
        failCounter: int, <0, inf>

      default values:
        playerX: 185;
        playerY: 570;
        playerSpeedX: 0;
        playerSpeedY: 0;
        gravity: 0.5;
        jumpPowerY: 10;
        platformSpeed: 2;
        movingPlatforms: 0
        score: 0;
        difficulty: 1;
        isGameStarted: false;
        failCounter: 0;

      const values:
        playerWidth: 30;
        playerHeight: 30;
        platformHeight: 10;
        platformWidth: 100;
    `;

  public override players = [
    new Player(
      0,
      true,
      'Player 1',
      { move: 0, jump: 0 },
      {
        ArrowLeft: {
          variableName: 'move',
          pressedValue: -1,
          releasedValue: 0,
        },
        ArrowRight: {
          variableName: 'move',
          pressedValue: 1,
          releasedValue: 0,
        },
        ' ': { variableName: 'jump', pressedValue: 1, releasedValue: 0 },
      },
      '<move>: value of {-1, 0, 1}, -1: left, 0: stop, 1: right; <jump>:  value of {0, 1}, 0: not jump, 1: jump',
      {
        left: '[ARROW_LEFT]',
        right: '[ARROW_RIGHT]',
        jump: '[SPACE]',
      }
    ),
  ];
}
