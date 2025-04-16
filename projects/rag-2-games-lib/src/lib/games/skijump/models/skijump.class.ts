import { TGameState } from '@gameModels/game-state.type';
import { Game } from '@gameModels/game.class';
import { Player } from '@gameModels/player.class';

export class SkiJumpState implements TGameState {
  public distance = 0;
  public jumperX = 0;
  public jumperY = 0;
  public jumperInclineRad = Math.PI / 2;
  public isMoving = false;
  public isFlying = false;
  public isLanded = false;
  public isCrashed = false;
  public jumperFlightVelocityX = 0;
  public jumperHeightAboveGround = 0;
  public jumperFlightVelocityY = 0;
  public stylePoints = 0;
  public windPoints = 0;
  public totalPoints = 0;
  public wind = 0;
  public windDirection = 'left';
}

export class SkiJump extends Game {
  public override name = 'skijump';
  public override state = new SkiJumpState();
  public override outputSpec = `
    output:
      distance: float, <0, 100>;
      jumperX: float, <0, 600>
      jumperY: float, <0, 600>
      jumperInclineRad: float, <0, PI>
      isMoving: boolean
      isFlying: boolean
      isLanded: boolean
      isCrashed: boolean
      jumperFlightVelocityX: float, <0, inf>
      jumperFlightVelocityY: float, <-inf, inf>
      jumperHeightAboveGround: float, <0, inf>
      stylePoints: int, <0, 20>
      windPoints: float, <-inf, inf>
      totalPoints: float, <0, inf>
      wind: float, <0, 2>
      windDirection: string, 'left' or 'right'
    default values:
      distance: 0;
      jumperX: 0
      jumperY: 0
      jumperFlightVelocityX: 0
      jumperFlightVelocityY: 0
  `;
  public override players = [
    new Player(
      0,
      true,
      'Player 1',
      { space: 0, up: 0, down: 0 },
      {
        ' ': {
          variableName: 'space',
          pressedValue: 1,
          releasedValue: 0,
        },
        ArrowUp: {
          variableName: 'up',
          pressedValue: 1,
          releasedValue: 0,
        },
        ArrowDown: {
          variableName: 'down',
          pressedValue: 1,
          releasedValue: 0,
        },
      },
      '<space>, <up>, <down>: value of {0, 1}, 0: not pressed, 1: pressed',
      {
        start: '[SPACE]',
        jump: '[SPACE]',
        land: '[SPACE]',
        restart: '[SPACE]',
        rotate_up: '[ARROW_DOWN]',
        rotate_down: '[ARROW_UP]',
      }
    ),
  ];
}
