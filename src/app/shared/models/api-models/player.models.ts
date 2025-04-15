import { TExchangeData } from '@gameModels/exchange-data.type';
import { PlayerSourceType } from '../player-source-type.enum';

export interface IPlayer {
  id: number;
  name: string;
  isObligatory: boolean;
  isActive: boolean;
  playerType: PlayerSourceType;
  inputData: TExchangeData;
  expectedDataDescription: string;
}
