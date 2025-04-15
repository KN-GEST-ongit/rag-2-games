import { TExchangeData } from '@gameModels/exchange-data.type';
import { Player } from '@gameModels/player.class';

export interface IPlayerInputData {
  player: Player;
  data: TExchangeData;
}
