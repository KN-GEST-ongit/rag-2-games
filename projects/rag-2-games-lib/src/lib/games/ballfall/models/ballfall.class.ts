import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class BallfallState implements TGameState {
  public score = 0;
  public isGameOver = false;
  public ballY = 15;
  public cylinderRotY = 0;
  public gravity = 0.015;
  public bounceForce = 0.35;
  public rotationSpeed = 0.08;
}

export class Ballfall extends Game {
  public override name = 'ballfall';
  public override author = 'Mateusz Mączyński';
  public override state = new BallfallState();

  public override outputSpec = `
  output:
    score: int, <0, inf>;
    ballY: float;
    cylinderRotY: float;
  `;

  public override players = [
    new Player(
      0,
      true,
      'Gracz',
      { move: 0 },
      {
        ArrowLeft: { variableName: 'move', pressedValue: -1, releasedValue: 0 },
        ArrowRight: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        a: { variableName: 'move', pressedValue: -1, releasedValue: 0 },
        d: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
      },
      `<move>: -1 obraca w lewo, 1 obraca w prawo;`,
      { left: '[←/A]', right: '[→/D]' }
    ),
  ];
}
