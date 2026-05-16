import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class CrashballState implements TGameState {
    // to implement
}

export class Crashball extends Game {
    public override name = 'crashball';
    public override author = 'Ignacy Janus';
    public override state = new CrashballState();

    public override outputSpec = ``;
    public override players = [
        //to implement
        //new Player()
    ];
}