import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class PacmanState implements TGameState {
    // to implement
}

export class Pacman extends Game {
    public override name = 'pacman';
    public override state = new PacmanState();

    public override outputSpec = ``;
    public override players = [
        //to implement
        //new Player()
    ];
}