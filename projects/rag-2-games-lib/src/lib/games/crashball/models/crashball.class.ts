import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';
import {
  BASE_BALL_SPEED,
  IBall,
  ICrashPlayer,
  SIDES,
  SPAWN_INTERVAL_START,
  TPlayerSide,
} from './crashball.interfaces';

export class CrashballState implements TGameState {
  public balls: IBall[] = [];
  public players: ICrashPlayer[] = SIDES.map(
    (side: TPlayerSide): ICrashPlayer => ({
      side,
      position: 0,
      velocity: 0,
      hp: 20,
      superCharge: 0,
      superActive: false,
      superWaveRadius: 0,
      eliminated: false,
      dashTimer: 0,
    })
  );
  public ballSpeed = BASE_BALL_SPEED;
  public nextBallId = 0;
  public spawnTimer = SPAWN_INTERVAL_START;
  public speedTimer = 0;
  public isGameOver = false;
  public winner: TPlayerSide | null = null;
}

export class Crashball extends Game {
  public override name = 'crashball';
  public override author = 'Ignacy Janus';
  public override state = new CrashballState();

  public override outputSpec = `output:
  balls: IBall[];
  players: ICrashPlayer[];
  ballSpeed: number;
  gameOver: boolean;
  winner: TPlayerSide | null;`;

  public override players: Player[] = [
    new Player(
      0,
      true,
      'Player 1 (top)',
      { move: 0, super: 0, dash: 0 },
      {
        a: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        d: { variableName: 'move', pressedValue: 2, releasedValue: 0 },
        q: { variableName: 'super', pressedValue: 1, releasedValue: 0 },
        Shift: { variableName: 'dash', pressedValue: 1, releasedValue: 0 },
      },
      '<move>: 1=left, 2=right, 0=stop; <super>: 1=activate; <dash>: 1=dash',
      { left: '[A]', right: '[D]', super: '[Q]', dash: '[SHIFT]' }
    ),
    new Player(
      1,
      false,
      'Player 2 (bottom)',
      { move: 0, super: 0, dash: 0 },
      {
        ArrowLeft: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        ArrowRight: { variableName: 'move', pressedValue: 2, releasedValue: 0 },
        Enter: { variableName: 'super', pressedValue: 1, releasedValue: 0 },
        ' ': { variableName: 'dash', pressedValue: 1, releasedValue: 0 },
      },
      '<move>: 1=left, 2=right, 0=stop; <super>: 1=activate; <dash>: 1=dash',
      { left: '[ARROW_LEFT]', right: '[ARROW_RIGHT]', super: '[ENTER]', dash: '[SPACE]' }
    ),
    new Player(
      2,
      false,
      'Player 3 (left)',
      { move: 0, super: 0, dash: 0 },
      {
        f: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        h: { variableName: 'move', pressedValue: 2, releasedValue: 0 },
        r: { variableName: 'super', pressedValue: 1, releasedValue: 0 },
        CapsLock: { variableName: 'dash', pressedValue: 1, releasedValue: 0 },
      },
      '<move>: 1=left, 2=right, 0=stop; <super>: 1=activate; <dash>: 1=dash',
      { left: '[F]', right: '[H]', super: '[R]', dash: '[CAPS]' }
    ),
    new Player(
      3,
      false,
      'Player 4 (right)',
      { move: 0, super: 0, dash: 0 },
      {
        j: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        l: { variableName: 'move', pressedValue: 2, releasedValue: 0 },
        u: { variableName: 'super', pressedValue: 1, releasedValue: 0 },
        p: { variableName: 'dash', pressedValue: 1, releasedValue: 0 },
      },
      '<move>: 1=left, 2=right, 0=stop; <super>: 1=activate; <dash>: 1=dash',
      { left: '[J]', right: '[L]', super: '[U]', dash: '[P]' }
    ),
  ];
}
