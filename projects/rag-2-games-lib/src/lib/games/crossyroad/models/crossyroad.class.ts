/* eslint-disable @typescript-eslint/explicit-member-accessibility */
import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';
import { ILane } from './crossyroad.interfaces';

export class CrossyRoadState implements TGameState {
    public playerX = 0; 
    public playerZ = 0;
  
    public score = 0;
    public highestZ = 0;
    public isGameOver = false;
  
    public moveCooldown = 0; 
    public isMoving = false;

    public lanes: ILane[] = [];
    public nextObstacleId = 0;

    constructor() {
        for (let i = -2; i < 15; i++) {
            this.lanes.push({
                z: i,
                type: (i <= 0) ? 'grass' : 'road',
                obstacles: []
            });
        }
    }
}

export class CrossyRoad extends Game {
    public override author = 'Norbert Mazur';
    public override name = 'crossyroad';
    public override state = new CrossyRoadState();

    public override outputSpec = `output: playerX, playerZ, score, isGameOver`;

  public override players = [
    new Player(
      0,
      true,
      'Player 1',
      { move: 0 },
      {
        ArrowUp: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        ArrowDown: { variableName: 'move', pressedValue: 2, releasedValue: 0 },
        ArrowLeft: { variableName: 'move', pressedValue: 3, releasedValue: 0 },
        ArrowRight: { variableName: 'move', pressedValue: 4, releasedValue: 0 },
        w: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
        s: { variableName: 'move', pressedValue: 2, releasedValue: 0 },
        a: { variableName: 'move', pressedValue: 3, releasedValue: 0 },
        d: { variableName: 'move', pressedValue: 4, releasedValue: 0 },
      },
      `Move with Arrows/WASD`,
      { up: '↑', down: '↓', left: '←', right: '→' }
    ),
  ];
}