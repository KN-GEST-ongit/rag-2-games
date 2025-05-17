import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class SpaceinvadersState implements TGameState {
    // to implement
}

export class Spaceinvaders extends Game {
    public override name = 'spaceinvaders';
    public override state = new SpaceinvadersState();

    public override outputSpec = ``;
    public override players = [
        //to implement
        //new Player()
    ];
}