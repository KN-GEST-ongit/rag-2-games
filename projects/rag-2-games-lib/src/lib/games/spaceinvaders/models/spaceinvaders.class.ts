import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class SpaceinvadersState implements TGameState {
    public playerX = 300;
    public playerSpeed = 5;
    public laserX = -1;
    public laserY = -1;
    public laserSpeed = 15;
    public difficulty = 1;
    public alienCount = this.difficulty*5;

    public aliens: { x: number; y: number; alive: boolean }[] = [];

    private readonly _cols = 10;
    private readonly _spacingX = 80;
    private readonly _spacingY = 60;

    public constructor() {
        this.generateAliens();
    }

    public generateAliens(): void {
        this.alienCount = this.difficulty * 5;

        this.aliens = Array.from({ length: this.alienCount }, (_, i) => {
        const col = i % this._cols;
        const row = Math.floor(i / this._cols);

        return {
            x: 100 + col * this._spacingX,
            y: 50 + row * this._spacingY,
            alive: true,
        };
        });
    }


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
        difficulty: int, <1,10>;
        alienDirection: int, {-1, 1};
        alienSpeed: int, <1, 5>;
        alienCount; int, <0,50>;
        score: int, <0, inf>;
        isGameStarted: boolean;
        failCounter: int, <0, inf>;

        default values:
        playerX: 300;
        playerSpeed: 5;
        laserY: -1;
        laserSpeed: 10;
        difficulty: 1;
        alienDirection: 1;
        alienSpeed: 2;
        alienCount: 5;
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