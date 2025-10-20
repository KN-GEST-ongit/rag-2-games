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

//WIEŻE
export const TowerTypes: Record<string, ITowerData> = {
  'BASIC': {
    name: 'Działko Lvl 1',
    cost: 100,
    damage: 36,
    range: 2.5,
    fireRate: 30,
    color: 'brown',
    canHitAir: true,
    canHitGround: true,
    upgradeCost: 100,
    upgradesTo: 'BASIC_L2',
    splashRadius: 0
  },
  'BASIC_L2': {
    name: 'Działko Lvl 2',
    cost: 0,
    damage: 50,
    range: 3.0,
    fireRate: 25,
    color: '#D2691E',
    canHitAir: true,
    canHitGround: true,
    splashRadius: 0
  },

  'CANNON': {
    name: 'Armata Lvl 1',
    cost: 200,
    damage: 72,
    range: 3.5,
    fireRate: 90,
    color: '#444',
    canHitAir: false,
    canHitGround: true,
    upgradeCost: 300,
    upgradesTo: 'CANNON_L2',
    splashRadius: 1.5
  },
  'CANNON_L2': {
    name: 'Armata Lvl 2',
    cost: 0,
    damage: 120,
    range: 4.0,
    fireRate: 80,
    color: '#222',
    canHitAir: false,
    canHitGround: true,
    splashRadius: 2.0
  },
};

//WROGOWIE
export const EnemyTypes = {
  'TANK': {
    health: 350,
    speed: 0.7,
    reward: 25,
    color: 'purple',
    isFlying: false
  },
  'HELICOPTER': {
    health: 80,
    speed: 1.2,
    reward: 20,
    color: '#00BFFF',
    isFlying: true
  }
};

//FALE
export const WaveDefinitions = [
  [ { type: 'TANK', count: 8 }, { type: 'HELICOPTER', count: 5 } ],

  [ { type: 'TANK', count: 12 }, { type: 'HELICOPTER', count: 3 } ],

  [ { type: 'TANK', count: 15 }, { type: 'HELICOPTER', count: 6 } ],

  [ { type: 'TANK', count: 2 }, { type: 'HELICOPTER', count: 10 } ],

  [ { type: 'TANK', count: 10 }, { type: 'HELICOPTER', count: 4 } ],
];