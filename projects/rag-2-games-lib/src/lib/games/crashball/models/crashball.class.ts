import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';
import {
  BASE_BALL_SPEED,
  IBall,
  ICrashPlayer,
  SIDES,
  SPAWN_INTERVAL_START,
  TGameMode,
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
    })
  );
  public ballSpeed = BASE_BALL_SPEED;
  public nextBallId = 0;
  public spawnTimer = SPAWN_INTERVAL_START;
  public speedTimer = 0;
  public isGameOver = false;
  public winner: TPlayerSide | null = null;
  public rankings: TPlayerSide[] = []; // order of elimination: index 0 = eliminated first (4th place)
  public gameMode: TGameMode = 'ffa';
  public isLobbyActive = true;
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
      true, // isActive
      'Player 1 (red)',
      { move: 0, super: 0, restart: 0, mode: 0 },
      {
        k:     { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        K:     { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        ';':   { variableName: 'move', pressedValue: 2, releasedValue: 0 },
        ':':   { variableName: 'move', pressedValue: 2, releasedValue: 0 },
        o:     { variableName: 'super', pressedValue: 1, releasedValue: 0 },
        O:     { variableName: 'super', pressedValue: 1, releasedValue: 0 },
        Enter: { variableName: 'restart', pressedValue: 1, releasedValue: 0 },
        '1':   { variableName: 'mode', pressedValue: 1, releasedValue: 0 },
        '2':   { variableName: 'mode', pressedValue: 2, releasedValue: 0 },
      },
      '<move>: 1=left, 2=right, 0=stop; <super>: 1=activate',
      { left: '[K]', right: '[;]', super: '[O]' }
    ),
    new Player(
      1,
      true,
      'Player 2 (blue)',
      { move: 0, super: 0, restart: 0, mode: 0 },
      {
        f:     { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        F:     { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        h:     { variableName: 'move', pressedValue: 2, releasedValue: 0 },
        H:     { variableName: 'move', pressedValue: 2, releasedValue: 0 },
        t:     { variableName: 'super', pressedValue: 1, releasedValue: 0 },
        T:     { variableName: 'super', pressedValue: 1, releasedValue: 0 },
        Enter: { variableName: 'restart', pressedValue: 1, releasedValue: 0 },
        '1':   { variableName: 'mode', pressedValue: 1, releasedValue: 0 },
        '2':   { variableName: 'mode', pressedValue: 2, releasedValue: 0 },
      },
      '<move>: 1=left, 2=right, 0=stop; <super>: 1=activate',
      { left: '[F]', right: '[H]', super: '[T]' }
    ),
    new Player(
      2,
      true,
      'Player 3 (green)',
      { move: 0, super: 0, restart: 0, mode: 0 },
      {
        a:     { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        A:     { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        d:     { variableName: 'move', pressedValue: 2, releasedValue: 0 },
        D:     { variableName: 'move', pressedValue: 2, releasedValue: 0 },
        w:     { variableName: 'super', pressedValue: 1, releasedValue: 0 },
        W:     { variableName: 'super', pressedValue: 1, releasedValue: 0 },
        Enter: { variableName: 'restart', pressedValue: 1, releasedValue: 0 },
        '1':   { variableName: 'mode', pressedValue: 1, releasedValue: 0 },
        '2':   { variableName: 'mode', pressedValue: 2, releasedValue: 0 },
      },
      '<move>: 1=left, 2=right, 0=stop; <super>: 1=activate',
      { left: '[A]', right: '[D]', super: '[W]' }
    ),
    new Player(
      3,
      true,
      'Player 4 (yellow)',
      { move: 0, super: 0, restart: 0, mode: 0 },
      {
        ArrowLeft:  { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        ArrowRight: { variableName: 'move', pressedValue: 2, releasedValue: 0 },
        ArrowUp:    { variableName: 'super', pressedValue: 1, releasedValue: 0 },
        Enter:      { variableName: 'restart', pressedValue: 1, releasedValue: 0 },
        '1':        { variableName: 'mode', pressedValue: 1, releasedValue: 0 },
        '2':        { variableName: 'mode', pressedValue: 2, releasedValue: 0 },
      },
      '<move>: 1=left, 2=right, 0=stop; <super>: 1=activate',
      { left: '[←]', right: '[→]', super: '[↑]' }
    ),
  ];
}
