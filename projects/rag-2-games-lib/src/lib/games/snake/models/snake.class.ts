import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class SnakeState implements TGameState {
    // to implement
}

export class Snake extends Game {
    public override name = 'snake';
    public override state = new SnakeState();

    public override outputSpec = ``;
    public override players = [
        //to implement
        //new Player()
    ];
}