export interface IBombermanBomb {
  playerId: number;
  x: number;
  y: number;
  timer: number;
  range: number;
}

export interface IBombermanWall {
  x: number;
  y: number;
  destructible: boolean;
}

export interface IBombermanPowerUp {
  x: number;
  y: number;
  type: 'bombs' | 'range' | 'speed';
}
