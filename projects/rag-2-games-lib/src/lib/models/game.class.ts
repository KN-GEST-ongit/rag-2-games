import { Player } from './player.class';
import { TGameState } from './game-state.type';

export abstract class Game {
  public abstract name: string;
  public abstract players: Player[];
  public abstract state: TGameState;
  public abstract outputSpec: string;
}
