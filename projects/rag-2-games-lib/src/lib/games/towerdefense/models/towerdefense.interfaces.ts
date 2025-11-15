export interface ITower {
  x: number;
  y: number;
  type: string;
  range: number;
  damage: number;
  fireRate: number;
  cooldown: number;
  rotation: number;
  totalInvestedCost: number;
}

export interface IEnemy {
  x: number;
  y: number;
  id: number;
  health: number;
  maxHealth: number;
  speed: number;
  reward: number;
  color: string;
  pathIndex: number;
  isFlying: boolean;
  type: string;
  rotation: number;
}

export interface IBullet {
  x: number;
  y: number;
  targetEnemyId: number;
  damage: number;
  speed: number;
  color: string;
  splashRadius: number;
  canHitAir: boolean;
  canHitGround: boolean;
}

export interface ITowerData {
  name: string;
  cost: number;
  damage: number;
  range: number;
  fireRate: number;
  color: string;
  canHitAir: boolean;
  canHitGround: boolean;
  upgradeCost?: number;
  upgradesTo?: string;
  splashRadius?: number;
}