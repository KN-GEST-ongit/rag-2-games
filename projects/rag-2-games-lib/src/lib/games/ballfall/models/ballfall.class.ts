import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export interface AISegment {
  zStart: number;
  zEnd: number;
  xOffset: number;
  isRamp: boolean;
  obstacles: { x: number; z: number }[];
  boostPads: { x: number; z: number }[];
}

export class BallfallState implements TGameState {
  public score = 0;
  public isGameOver = false;

  public ballX = 0;
  public ballY = 0.5;
  public ballZ = 0;

  public ballVY = 0;
  public boostTimer = 0;

  public upcomingTrack: AISegment[] = [];
}

export class Ballfall extends Game {
  public override name = 'ballfall';
  public override author = 'Mateusz Mączyński';
  public override state = new BallfallState();

  public override outputSpec = `
  output:
    score: int, <0, inf>;
    ballX: float, <-5.0, 5.0>;
    ballY: float, <-5.0, 5.0>;
    ballZ: float, <0, inf>;
    ballVY: float, <-2.0, 1.0>;
    boostTimer: int, <0, 30>;
    isGameOver: boolean;
    upcomingTrack: array of 3 objects {
      zStart: float, <-10.0, inf>;
      zEnd: float, <0.0, inf>;
      xOffset: float, <-2.0, 2.0>;
      isRamp: boolean;
      obstacles: array of {x: float, <-2.0, 2.0>, z: float, <0.0, inf>};
      boostPads: array of {x: float, <-2.0, 2.0>, z: float, <0.0, inf>};
    };
  `;

  public override players = [
    new Player(
      0,
      true,
      'Player 1',
      { move: 0, restart: 0 },
      {
        ArrowLeft: { variableName: 'move', pressedValue: -1, releasedValue: 0 },
        ArrowRight: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        a: { variableName: 'move', pressedValue: -1, releasedValue: 0 },
        d: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        A: { variableName: 'move', pressedValue: -1, releasedValue: 0 },
        D: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        Enter: { variableName: 'restart', pressedValue: 1, releasedValue: 0 },
      },
      `<move>: -1 left, 1 right; <restart>: 1 restart;`,
      { left: '[←/A]', right: '[→/D]', restart: '[ENTER]' }
    ),
  ];
}
