import { TExchangeData } from '@gameModels/exchange-data.type';
import { PlayerSourceType } from 'app/shared/models/player-source-type.enum';

export interface IPlayerControlsBinding {
  variableName: string;
  pressedValue: unknown;
  releasedValue: unknown;
}
export class Player {
  public id: number;
  public name: string;
  public isObligatory: boolean;
  public playerType: PlayerSourceType;
  public isActive: boolean;
  public inputData: TExchangeData = {};
  public controlsBinding: Record<string, IPlayerControlsBinding> = {};
  public expectedDataDescription = '';
  public controlsDescription: TExchangeData = {};

  public constructor(
    id: number,
    isObligatory: boolean,
    name: string,
    inputData: TExchangeData = {},
    controlsBinding: Record<string, IPlayerControlsBinding> = {},
    expectedDataDescription: string,
    controlsDescription: TExchangeData = {},
    playerType: PlayerSourceType = PlayerSourceType.KEYBOARD
  ) {
    this.isObligatory = isObligatory;
    this.name = name;
    this.id = id;
    this.isActive = isObligatory;
    this.playerType = playerType;
    this.expectedDataDescription = expectedDataDescription;
    this.inputData = inputData;
    this.controlsBinding = controlsBinding;
    this.controlsDescription = controlsDescription;
  }
}
