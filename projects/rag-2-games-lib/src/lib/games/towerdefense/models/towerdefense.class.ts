import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class TowerDefenseState implements TGameState {
    // to implement
}

export class TowerDefense extends Game {
    public override name = 'towerdefense';
    public override author = 'Norbert Mazur';
    public override state = new TowerDefenseState();

    public override outputSpec = ``;
    public override players = [
        //to implement
        //new Player()
    ];
}