import { TExchangeData } from '@gameModels/exchange-data.type';
import { IPlayer } from '@api-models/player.models';
import { IUserResponse } from '@api-models/user.models';

export interface IRecordedGameResponse {
  id: number;
  gameName: string;
  user: IUserResponse;
  players: IPlayer[];
  started: string;
  ended: string;
  outputSpec: string;
  endState: TExchangeData;
  sizeMb: number;
  isEmptyRecord: boolean;
}

export interface IRecordedGameRequest {
  gameName: string;
  outputSpec: string;
  players: IPlayer[];
  values: TExchangeData[];
}
