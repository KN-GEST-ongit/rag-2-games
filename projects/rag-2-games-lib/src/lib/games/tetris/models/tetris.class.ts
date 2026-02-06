import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class TetrisSingleBoardState{
    public rows = 20;
    public cols = 10;
    public board: number[][] = [];
    public active:{
        type:number;
        rotation:number;
        x:number;
        y:number;
    } | null = null;
    public nextType = 0;
    public score = 0;
    public level = 1;
    public lines = 0;
    public isGameOver = false;
    
    public constructor() {
        this.resetBoard();
    }

    public resetBoard() :void {
        this.board = Array.from({length:this.rows},()=>Array.from({length:this.cols},()=>0));
        this.active = null;
        this.nextType = Math.floor(Math.random()*7);
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.isGameOver = false;
    }
}

export class TetrisState implements TGameState {
    public boards: TetrisSingleBoardState[] = [];
    public gameMode: 'singleplayer' | 'multiplayer' = 'singleplayer';

    public constructor(){
        this.boards = [new TetrisSingleBoardState(), new TetrisSingleBoardState()];
    }
}

export class Tetris extends Game {
    public override name = 'tetris';
    public override author = 'Robert Poszelężny';
    public override state = new TetrisState();

    public override outputSpec = `
        output:
            gameMode: string, {singleplayer, multiplayer};
            boards: list of board objects;
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
            'P1 Controls: WASD to move/rotate, SPACE to start/drop',
            { left: '[A]', right: '[D]', rotate: '[W]', down: '[S]', drop: '[SPACE]' }
        ),

        new Player(
            1,
            true,
            'Player 2',
            { move: 0, start: 0 },
            {
                ArrowLeft: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
                ArrowRight: { variableName: 'move', pressedValue: 2, releasedValue: 0 },
                ArrowUp: { variableName: 'move', pressedValue: 3, releasedValue: 0 },
                ArrowDown: { variableName: 'move', pressedValue: 4, releasedValue: 0 },
                Enter: { variableName: 'start', pressedValue: 1, releasedValue: 0 },
            },
            'P2 Controls: Arrows to move/rotate, ENTER to start/drop',
            { left: '[←]', right: '[→]', rotate: '[↑]', down: '[↓]', drop: '[ENTER]' }
        ),
    ];
}