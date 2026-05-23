import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player, IPlayerControlsBinding } from '../../../models/player.class';

export class TwozerofoureightState implements TGameState {
  public size = 4;
  public grid: number[][] = [];
  public score = 0;
  public bestScore = 0;
  public isGameOver = false;
  public hasWon = false;

  public constructor() {
    this.grid = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => 0)
    );
  }
}

export class Twozerofoureight extends Game {
  public override name = 'twozerofoureight';
  public override author = 'NAME SURNAME';
  public override state = new TwozerofoureightState();

  public override outputSpec = `
    output:
      size: int, 4;
      grid: number[4][4];
      score: int, <0, inf>;
      bestScore: int, <0, inf>;
      isGameOver: boolean;
      hasWon: boolean;

    default values:
      size: 4;
      grid: 4x4 array of 0;
      score: 0;
      bestScore: 0;
      isGameOver: false;
      hasWon: false;
  `;

  public override players = [
    new Player(
      0,
      true,
      'Player 1',
      { move: 0 },
      Twozerofoureight.getKeyboardBindings(),
      '<move>: 0 none, 1 right, 2 left, 3 down, 4 up;',
      {
        up: 'arrow_up or W',
        down: 'arrow_down or S',
        left: 'arrow_left or A',
        right: 'arrow_right or D',
      }
    ),
  ];

  private static getKeyboardBindings(): Record<string, IPlayerControlsBinding> {
    return {
      ArrowRight: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
      ArrowLeft: { variableName: 'move', pressedValue: 2, releasedValue: 0 },
      ArrowDown: { variableName: 'move', pressedValue: 3, releasedValue: 0 },
      ArrowUp: { variableName: 'move', pressedValue: 4, releasedValue: 0 },
      d: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
      a: { variableName: 'move', pressedValue: 2, releasedValue: 0 },
      s: { variableName: 'move', pressedValue: 3, releasedValue: 0 },
      w: { variableName: 'move', pressedValue: 4, releasedValue: 0 },
      D: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
      A: { variableName: 'move', pressedValue: 2, releasedValue: 0 },
      S: { variableName: 'move', pressedValue: 3, releasedValue: 0 },
      W: { variableName: 'move', pressedValue: 4, releasedValue: 0 },
    };
  }
}