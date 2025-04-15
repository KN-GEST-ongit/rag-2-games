import { TGameState } from '@gameModels/game-state.type';
import { Game } from '@gameModels/game.class';
import { Player } from '@gameModels/player.class';

export class FlappyBirdState implements TGameState {
  public birdY = 0;
  public birdSpeedY = 0;
  public gravity = 0;
  public jumpPowerY = 0;
  public obstacleSpeed = 0;
  public score = 0;
  public difficulty = 0;
  public obstacles = Array.from({ length: 4 }, () => ({
    distanceX: 0,
    centerGapY: 0,
  }));
  public isGameStarted = false;
  public failCounter = 0;
}

export class FlappyBird extends Game {
  public override name = 'flappybird';
  public override state = new FlappyBirdState();
  public override outputSpec = `
        output:
          birdY: float, <0, 600>;
          birdSpeedY: float, <-20, 90>;
          gravity: float, <0.5, 1>;
          jumpPowerY: float, <5, 15>;
          obstacleSpeed = <2, 10>;
          score: int, <0, inf>;
          difficulty: int, <0, inf>;
          obstacles: [{distanceX: int, <-50, 1900>, centerGapyY: int <100, 500>}];
          isGameStarted: boolean;
          failCounter: int, <0, inf>
  
        default values:
          birdY: 300;
          birdSpeedY: 0;
          gravity: 0.5;
          jumpPowerY: 10;
          obstacleSpeed: 2;
          score: 0;
          difficulty: 1;
          isGameStarted: false;
          failCounter: 0;
      `;

  public override players = [
    new Player(
      0,
      true,
      'Player 1',
      { jump: 0 },
      {
        ' ': {
          variableName: 'jump',
          pressedValue: 1,
          releasedValue: 0,
        },
      },
      '<jump>:  value of {0, 1}, 0: not jump, 1: jump',
      { jump: '[SPACE]' }
    ),
  ];
}
