import { Player } from '@gameModels/player.class';
import { TGameState } from '@gameModels/game-state.type';

export abstract class Game {
  public abstract name: string;
  public abstract players: Player[];
  public abstract state: TGameState;
  public abstract outputSpec: string;
}
