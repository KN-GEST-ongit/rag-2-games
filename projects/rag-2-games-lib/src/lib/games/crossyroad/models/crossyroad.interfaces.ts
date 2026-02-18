/* eslint-disable @typescript-eslint/naming-convention */
export type LaneType = 'grass' | 'road' | 'water';

export interface IObstacle {
  id: number;
  x: number;
  speed: number;
  direction: -1 | 1;
  type: 'car_slow' | 'car_fast' | 'tree' | 'truck' | 'log';
  width: number;
}

export interface ILane {
  z: number;
  type: LaneType;
  obstacles: IObstacle[];
}