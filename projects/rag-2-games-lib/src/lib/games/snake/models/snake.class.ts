import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class SnakeState implements TGameState {
    public score = 0;
    public playerX = 485;
    public playerY = 285;
    public isGameStarted = false;
    // public foodItems = Array.from({ length: 10 }, () => ({
    //     x: Math.random() * 800,
    //     y: Math.random() * 600,
    //   }));
    public playerSpeedX = 0;
    public playerSpeedY = 0;
}

export class Snake extends Game {
    public override name = 'snake';
    public override state = new SnakeState();

    public override outputSpec = `
        output:
            playerX: float, <0, 980>;
            playerY: float, <0, 580>;
            playerSpeedX: float, <-5, 5>;
            playerSpeedY: float, <-5, 5>;
            isGameStarted: boolean;
            score: int, <0, inf>;
        
        default values:
            playerX: 485;
            playerY: 285;
            playerSpeedX: 0;
            playerSpeedY: 0;
            isGameStarted: false;
            score: 0;

        const values:
            playerWidth: 30;
            playerHeight: 30;
    `;
    public override players = [
        new Player(
            0,
            true,
            'Player 1',
            { moveY: 0, moveX: 0 },
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