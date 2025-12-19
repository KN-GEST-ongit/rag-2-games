export interface IEntity {
  x: number;
  y: number;
  radius: number;
  color: string;
}

export interface IMovableEntity extends IEntity {
  vx: number;
  vy: number;
  speed: number;
}