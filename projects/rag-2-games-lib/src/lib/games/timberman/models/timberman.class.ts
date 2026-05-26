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
    // Player 1
    public positionP1: 'left' | 'right' = 'left';
    public scoreP1 = 0;
    public timeLeftP1 = INITIAL_TIME;
    public isGameOverP1 = false;
    public isDeadP1 = false;
    public visibleTreeLayoutP1: ITreeSegment[] = generateTree();
    public levelP1 = 1;
    public chopsThisLevelP1 = 0;
    public chopsToNextLevelP1 = 20;

    // Player 2
    public positionP2: 'left' | 'right' = 'left';
    public scoreP2 = 0;
    public timeLeftP2 = INITIAL_TIME;
    public isGameOverP2 = false;
    public isDeadP2 = false;
    public visibleTreeLayoutP2: ITreeSegment[] = generateTree();
    public levelP2 = 1;
    public chopsThisLevelP2 = 0;
    public chopsToNextLevelP2 = 20;
}

export class Timberman extends Game {
    public override name = 'timberman';
    public override author = 'Colin Sudół';
    public override state = new TimbermanState();

    public override outputSpec = `
        Both players run independent games side by side. All fields below exist for
        P1 (Player 1) and P2 (Player 2) — e.g. positionP1 / positionP2.

        input:
            chop:    0 = no action | 1 = chop left | 2 = chop right
            restart: 1 = restart this player's game (only works when isGameOver is true)

        output:
            positionP1 / positionP2: 'left' | 'right'
                Which side of the tree the player is currently standing on.

            scoreP1 / scoreP2: int >= 0
                Number of successful chops (each safe chop = +1).

            timeLeftP1 / timeLeftP2: float [0, 240]
                Remaining time. Drains every frame; each successful chop adds time back.
                Reaches 0 → game over by timeout (isDead stays false).

            isGameOverP1 / isGameOverP2: boolean
                True when the player's game has ended, either by branch hit or timeout.

            isDeadP1 / isDeadP2: boolean
                True when the player was killed by chopping into a branch.
                False when the game ended by running out of time.

            visibleTreeLayoutP1 / visibleTreeLayoutP2: { branch: 'left' | 'right' | null }[]  (length: 7)
                The visible tree segments, ordered bottom to top.
                [0] is the segment directly above the player — the one about to be chopped.
                If treeSegments[0].branch matches the player's current position → instant death.

            levelP1 / levelP2: int >= 1
                Current difficulty level. Goes up as the player accumulates enough chops.
                Higher level = smaller time bonus per chop.

            chopsThisLevelP1 / chopsThisLevelP2: int >= 0
                Chops completed so far toward the next level-up.

            chopsToNextLevelP1 / chopsToNextLevelP2: int >= 0
                Total chops needed this level to advance to the next one.

        default values (at game start):
            positionP1/P2: 'left'  |  scoreP1/P2: 0  |  timeLeftP1/P2: 120
            isGameOverP1/P2: false  |  isDeadP1/P2: false
            levelP1/P2: 1  |  chopsThisLevelP1/P2: 0  |  chopsToNextLevelP1/P2: 20
    `;
    public override players = [
        new Player(
            0,
            true,
            'Player 1',
            {chop: 0, restart: 0},
            {
                a: { variableName: 'chop', pressedValue: 1, releasedValue: 0 },
                d: { variableName: 'chop', pressedValue: 2, releasedValue: 0 },
                ' ': { variableName: 'restart', pressedValue: 1, releasedValue: 0 },
            },
            '<chop>: {0: none, 1: chop left, 2: chop right}; <restart>: 1=restart',
            {chopLeft: '[A]', chopRight: '[D]', restart: '[Space]' }
        ),
        new Player(
            1,
            false,
            'Player 2',
            {chop: 0, restart: 0},
            {
                ArrowLeft: { variableName: 'chop', pressedValue: 1, releasedValue: 0 },
                ArrowRight: { variableName: 'chop', pressedValue: 2, releasedValue: 0 },
                Enter: { variableName: 'restart', pressedValue: 1, releasedValue: 0 },
            },
            '<chop>: {0: none, 1: chop left, 2: chop right}; <restart>: 1=restart',
            {chopLeft: '[←]', chopRight: '[→]', restart: '[Enter]' }
        )
    ];
}