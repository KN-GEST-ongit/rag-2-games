import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class TetrisState implements TGameState {
    public rows = 20;
    public cols = 10;
    public board0: number[][] = [];
    public active0: { type: number; rotation: number; x: number; y: number } | null = null;
    public nextType0 = 0;
    public score0 = 0;
    public level0 = 1;
    public lines0 = 0;
    public isGameOver0 = false;

    public board1: number[][] = [];
    public active1: { type: number; rotation: number; x: number; y: number } | null = null;
    public nextType1 = 0;
    public score1 = 0;
    public level1 = 1;
    public lines1 = 0;
    public isGameOver1 = false;

    public gameMode: 'singleplayer' | 'multiplayer' = 'singleplayer';
}

export class Tetris extends Game {
    public override name = 'tetris';
    public override author = 'Robert Poszelężny';
    public override state = new TetrisState();

    public override outputSpec = `
        output:
            gameMode: string, {'singleplayer', 'multiplayer'};
            rows: int, 20;
            cols: int, 10;
            board0: [{ x: int, <0, 9>, y: int, <0, 19>, value: int, <0, 7> }];
            active0: { type: int, <0, 6>, rotation: int, <0, 3>, x: int, <0, 9>, y: int, <0, 19> } | null;
            nextType0: int, <0, 6>;
            score0: int, <0, inf>;
            level0: int, <1, inf>;
            lines0: int, <0, inf>;
            isGameOver0: boolean;
            board1: [{ x: int, <0, 9>, y: int, <0, 19>, value: int, <0, 7> }];
            active1: { type: int, <0, 6>, rotation: int, <0, 3>, x: int, <0, 9>, y: int, <0, 19> } | null;
            nextType1: int, <0, 6>;
            score1: int, <0, inf>;
            level1: int, <1, inf>;
            lines1: int, <0, inf>;
            isGameOver1: boolean;

        default values:
            gameMode: 'singleplayer';
            rows: 20;
            cols: 10;
            board0: [];
            active0: null;
            nextType0: 0;
            score0: 0;
            level0: 1;
            lines0: 0;
            isGameOver0: false;
            board1: [];
            active1: null;
            nextType1: 0;
            score1: 0;
            level1: 1;
            lines1: 0;
            isGameOver1: false;
    `;

    public override players = [
        new Player(
            0,
            true,
            'Player 1',
            { move: 0, start: 0 },
            {
                a: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
                d: { variableName: 'move', pressedValue: 2, releasedValue: 0 },
                w: { variableName: 'move', pressedValue: 3, releasedValue: 0 },
                s: { variableName: 'move', pressedValue: 4, releasedValue: 0 },
                ' ': { variableName: 'start', pressedValue: 1, releasedValue: 0 },
            },
            '<move>: value of {0, 1, 2, 3, 4}, 0: none, 1: left, 2: right, 3: rotate, 4: down; <start>: value of {0, 1}, 0: not pressed, 1: pressed (start/drop)',
            { left: '[A]', right: '[D]', rotate: '[W]', down: '[S]', drop: '[SPACE]' }
        ),

        new Player(
            1,
            false,
            'Player 2',
            { move: 0, start: 0 },
            {
                ArrowLeft: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
                ArrowRight: { variableName: 'move', pressedValue: 2, releasedValue: 0 },
                ArrowUp: { variableName: 'move', pressedValue: 3, releasedValue: 0 },
                ArrowDown: { variableName: 'move', pressedValue: 4, releasedValue: 0 },
                Enter: { variableName: 'start', pressedValue: 1, releasedValue: 0 },
            },
            '<move>: value of {0, 1, 2, 3, 4}, 0: none, 1: left, 2: right, 3: rotate, 4: down; <start>: value of {0, 1}, 0: not pressed, 1: pressed (start/drop)',
            { left: '[←]', right: '[→]', rotate: '[↑]', down: '[↓]', drop: '[ENTER]' }
        ),
    ];
}