import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export interface ISnakeSegment {
    x: number;
    y: number;
  }

export class SnakeState implements TGameState {
    public score = 0;
    public segments: ISnakeSegment[] = [{ x: 10, y: 10 }];
    public isGameStarted = false;
    public direction = 'none';
    public gridSize = 20;
    public isGameOver = false;
    public foodItem: ISnakeSegment = { x: 15, y: 15 };
}

export class Snake extends Game {
    public override name = 'snake';
    public override state = new SnakeState();

    public override outputSpec = `
        output:
            segments: [{ x: int, <0, 49>, y: int, <0, 29> }];
            direction: string, {'up', 'down', 'left', 'right', 'none'};
            isGameStarted: boolean;
            score: int, <0, inf>;
            gridSize: int, <10, 30>;
            foodItem: { x: int, <0, 49>, y: int, <0, 29> };
            isGameOver: boolean;
        
        default values:
            segments: [{ x: 10, y: 10 }];
            direction: 'none';
            isGameStarted: false;
            score: 0;
            gridSize: 20;
            foodItem: { x: 15, y: 15 };
            isGameOver: false;
    `;
    public override players = [
        new Player(
            0,
            true,
            'Player 1',
            { moveY: 0, moveX: 0, start: 0 },
            {
                ArrowUp: {
                    variableName: 'moveY',
                    pressedValue: -1,
                    releasedValue: 0,
                },
                ArrowDown: {
                    variableName: 'moveY',
                    pressedValue: 1,
                    releasedValue: 0,
                },
                ArrowLeft: {
                    variableName: 'moveX',
                    pressedValue: -1,
                    releasedValue: 0,
                },
                ArrowRight: {
                    variableName: 'moveX',
                    pressedValue: 1,
                    releasedValue: 0,
                },
                ' ': {
                    variableName: 'start',
                    pressedValue: 1,
                    releasedValue: 0,
                },
            },
            '<moveX>: value of {-1, 0, 1}, -1: left, 0: stop, 1: right; <moveY>: value of {-1, 0, 1}, -1: up, 0: stop, 1: down; <start>: value of {0, 1}, 0: not pressed, 1: pressed;',
            {
                up: '[ARROW_UP]',
                down: '[ARROW_DOWN]',
                left: '[ARROW_LEFT]',
                right: '[ARROW_RIGHT]',
                start: '[SPACE]',
            }
        ),
    ];
}