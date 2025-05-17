import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class SpaceinvadersState implements TGameState {
    public playerX = 300;
    public playerSpeed = 5;
    public laserX = -1;
    public laserY = -1;
    public laserSpeed = 15;

    public aliens = Array.from({ length: 50 }, (_, i) => {
        const cols = 10;
        const spacingX = 80;
        const spacingY = 60;

        const col = i % cols;
        const row = Math.floor(i / cols);

        return {
            x: 100 + col * spacingX,
            y: 50 + row * spacingY,
            alive: true,
        };
    });

    public alienDirection = 1;
    public alienSpeed = 2;
    public score = 0;
    public isGameStarted = false;
    public failCounter = 0;
}

export class Spaceinvaders extends Game {
    public override name = 'spaceinvaders';
    public override state = new SpaceinvadersState();

    public override outputSpec = `
    output:
        playerX: int, <0, 600>;
        playerSpeed: int, <1, 10>;
        laserY: int, <-1, 600>; # -1 means no laser
        laserSpeed: int, <1, 20>;
        aliens: [{x: int, <0, 600>, y: int, <0, 400>, alive: boolean}];
        alienDirection: int, {-1, 1};
        alienSpeed: int, <1, 5>;
        score: int, <0, inf>;
        isGameStarted: boolean;
        failCounter: int, <0, inf>;

        default values:
        playerX: 300;
        playerSpeed: 5;
        laserY: -1;
        laserSpeed: 10;
        alienDirection: 1;
        alienSpeed: 2;
        score: 0;
        isGameStarted: false;
        failCounter: 0;
    `;
    public override players = [
        new Player(
            0,
            true,
            'Player 1',
            { left: 0, right: 0, shoot: 0 },
            {
                a: { variableName: 'move', pressedValue: -1, releasedValue: 0 },
                d: { variableName: 'move', pressedValue: 1, releasedValue: 0 },
                ' ': { variableName: 'shoot', pressedValue: 1, releasedValue: 0 },
            },
            '<move>: value of {-1, 0, 1}, -1: left, 0: stop, 1: right; <shoot>: value of {0, 1}, 0: not shoot, 1: shoot',
            { left: '[A]', right: '[D]', shoot: '[SPACE]' }
        ),
    ];
}