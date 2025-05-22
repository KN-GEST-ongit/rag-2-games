import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class TetrisState implements TGameState {
    public playerY = 0;
    public playerX = 0;
    public playerColour = 0;
    public playerType = 0;
    public entityX = 0;
    public entityY = 0;
    public score = 0;
}

export class Tetris extends Game {
    public override name = 'tetris';
    public override state = new TetrisState();

    public override outputSpec = `
        output:
            playerY: int, <0, 20>;
            playerX: int, <0, 10>;
            playerColour: int, <0, 7>;
            playerType: int, <0, 7>;
            entityX: int, <0, 10>;
            entityY: int, <0, 20>;
            score: int, <0, inf>;

        default values:
            playerY: 40;
            playerX: 10;
    `;
    public override players = [
        new Player(
            0,
            true,
            'Player 1',
            { move: 0, start: 0 },
            {
                a: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
                d: { variableName: 'move', pressedValue: -1, releasedValue: 0 },
                ' ': { variableName: 'start', pressedValue: 1, releasedValue: 0 },
            },
            '<move>: value of {-1, 0, 1}, -1: down, 0: stop, 1: up; <start>: value of {0, 1}, 0: not start, 1: start',
            { left: '[A]', right: '[D]', start: '[SPACE]' }
            
        ),
    ];
}