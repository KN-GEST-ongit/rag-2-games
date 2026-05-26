import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class BallfallState implements TGameState {
  public score = 0;
  public isGameOver = false;

  public ballX = 0;
  public ballY = 0.5;
  public ballZ = 0;

  public ballVY = 0;
}

export class Ballfall extends Game {
  public override name = 'ballfall';
  public override author = 'Twój Nick';
  public override state = new BallfallState();

  public override outputSpec = `
  output:
    score: int;
    ballX: float;
    ballY: float;
    ballZ: float;
  `;

  public override players = [
    new Player(
      0,
      true,
      'Gracz',
      { move: 0, action: 0 },
      {
        ArrowLeft: { variableName: 'move', pressedValue: -1, releasedValue: 0 },
        ArrowRight: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        a: { variableName: 'move', pressedValue: -1, releasedValue: 0 },
        d: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        Enter: { variableName: 'action', pressedValue: 1, releasedValue: 0 },
      },
      `<move>: -1 left, 1 right; <action>: 1 restart;`,
      { left: '[←/A]', right: '[→/D]', restart: '[ENTER]' }
    ),
  ];
}
