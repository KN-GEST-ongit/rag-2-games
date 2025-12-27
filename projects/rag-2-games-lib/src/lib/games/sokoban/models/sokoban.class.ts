import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export interface IPoint {
  x: number;
  y: number;
}

export class SokobanState implements TGameState {
  public player: IPoint = { x: 2, y: 2 };
  public boxes: IPoint[] = [];
  public walls: IPoint[] = [];
  public gridSize = 40;
}

export class Sokoban extends Game {
  public override author = "Jakub Strózik";
  public override name = 'sokoban';
  public override state = new SokobanState();

  public override outputSpec = `
        output:
            player: { x: int, y: int };
            boxes: [{ x: int, y: int }];
            walls: [{ x: int, y: int }];
    `;

  public override players = [
    new Player(
      0,
      true,
      'Player 1',
      { move: 0 },
      {
        ArrowUp: { variableName: 'move', pressedValue: 4, releasedValue: 0 },
        ArrowDown: { variableName: 'move', pressedValue: 3, releasedValue: 0 },
        ArrowLeft: { variableName: 'move', pressedValue: 2, releasedValue: 0 },
        ArrowRight: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
      },
      '<move>: 1:R, 2:L, 3:D, 4:U',
      { up: '[UP]', down: '[DOWN]', left: '[LEFT]', right: '[RIGHT]' }
    ),
  ];
}