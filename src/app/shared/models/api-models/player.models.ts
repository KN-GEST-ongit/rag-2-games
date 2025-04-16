import { TExchangeData } from '../../../../../projects/rag-2-games-lib/src/public-api';
import { PlayerSourceType } from '../../../../../projects/rag-2-games-lib/src/public-api';

export interface IPlayer {
  id: number;
  name: string;
  isObligatory: boolean;
  isActive: boolean;
  playerType: PlayerSourceType;
  inputData: TExchangeData;
  expectedDataDescription: string;
}
