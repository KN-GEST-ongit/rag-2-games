import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export type BranchSide = 'left' | 'right' | null;

export interface ITreeSegment{
    branch: BranchSide;
}

export const TREE_HEIGHT = 7;
export const INITIAL_TIME = 120;
export const MAX_TIME = INITIAL_TIME * 2;

export function generateSegment(prevBranch: BranchSide): ITreeSegment {
    if (prevBranch !== null) return {branch: null};
    const rand = Math.random();
    if(rand < 0.4) return { branch: 'left' };
    if(rand < 0.8) return { branch: 'right' };
    return { branch: null };
}

export function generateTree(): ITreeSegment[] {
    const segments: ITreeSegment[] = [];
    for (let i = 0; i < TREE_HEIGHT; i++){
        const prev = i > 0 ? segments[i-1].branch : null;
        segments.push(generateSegment(prev));
    }
    segments[0].branch = null;
    return segments;
}

export class TimbermanState implements TGameState {
    //Main player
    public position0: 'left' | 'right' = 'left';
    public score0 = 0;
    public timeLeft0 = INITIAL_TIME;
    public isGameOver0 = false;
    public isDead0 = false;
    public treeSegments0: ITreeSegment[] = generateTree();
    public level0 = 1;
    public chopsThisLevel0 = 0;
    public chopsToNextLevel0 = 20;

    //Additional player
    public position1: 'left' | 'right' = 'left';
    public score1 = 0;
    public timeLeft1 = INITIAL_TIME;
    public isGameOver1 = false;
    public isDead1 = false;
    public treeSegments1: ITreeSegment[] = generateTree();
    public level1 = 1;
    public chopsThisLevel1 = 0;
    public chopsToNextLevel1 = 20;
}

export class Timberman extends Game {
    public override name = 'timberman';
    public override author = 'Colin Sudół';
    public override state = new TimbermanState();

    public override outputSpec = `
        output:
            position0: string, {'left','right'};
            score0: int, <0, inf>;
            timeLeft0: float, <0, 120>;
            isGameOver0: boolean;
            isDead0: boolean;
            treeSegments0: [{ branch: string|null, {'left', 'right', null} }];
            position1: string, {'left', 'right'};
            score1: int, <0, inf>;
            timeLeft1: float, <0, 120>;
            isGameOver1: boolean;
            isDead1: boolean;
            treeSegments1: [{ branch: string|null, {'left', 'right', null} }];

        default values:
            position0: 'left'; score0: 0; timeLeft0: 120;
            isGameOver0: false; isDead0: false;
            position1: 'left'; score1: 0; timeLeft1: 120;
            isGameOver1: false; isDead1: false;
    `;
    public override players = [
        new Player(
            0,
            true,
            'Player 1',
            {chop: 0},
            {
                a: { variableName: 'chop', pressedValue: 1, releasedValue: 0 },
                d: { variableName: 'chop', pressedValue: 2, releasedValue: 0 },
            },
            '<chop>: {0: none, 1: chop left, 2: chop right}',
            {chopLeft: '[A]', chopRight: '[D]' }
        ),
        new Player(
            1,
            false,
            'Player 2',
            {chop: 0},
            {
                ArrowLeft: { variableName: 'chop', pressedValue: 1, releasedValue: 0 },
                ArrowRight: { variableName: 'chop', pressedValue: 2, releasedValue: 0 },
            },
            '<chop>: {0: none, 1: chop left, 2: chop right}',
            {chopLeft: '[←]', chopRight: '[→]' }
        )
    ];
}