import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class BombermanState implements TGameState {
    // to implement
}

export class Bomberman extends Game {
    public override name = 'bomberman';
    public override state = new BombermanState();

    public override outputSpec = ``;
    public override players = [
        //to implement
        //new Player()
    ];
}