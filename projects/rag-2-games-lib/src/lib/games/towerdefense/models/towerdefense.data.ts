export interface ITowerData {
  name: string;
  cost: number;
  damage: number;
  range: number;
  fireRate: number;
  color: string;
  canHitAir: boolean;
  canHitGround: boolean;
}

//WIEŻE
export const TowerTypes = {
  'BASIC': {
    name: 'Działko',
    cost: 100,
    damage: 36,
    range: 2.5,
    fireRate: 30,
    color: 'brown',
    canHitAir: true,
    canHitGround: true
  },
  'CANNON': {
    name: 'Armata',
    cost: 200,
    damage: 72,
    range: 3.5,
    fireRate: 90,
    color: '#444',
    canHitAir: false,
    canHitGround: true
  },
};

//WROGOWIE
export const EnemyTypes = {
  'NORMAL': {
    health: 100,
    speed: 1.0,
    reward: 10,
    color: 'green',
    isFlying: false
  },
  'FAST': {
    health: 60,
    speed: 1.8,
    reward: 15,
    color: 'yellow',
    isFlying: false
  },
  'TANK': {
    health: 350,
    speed: 0.7,
    reward: 25,
    color: 'purple',
    isFlying: false
  },
  'FLYER': {
    health: 80,
    speed: 1.2,
    reward: 20,
    color: '#00BFFF',
    isFlying: true
  }
};

//FALE
export const WaveDefinitions = [
  [ { type: 'NORMAL', count: 8 }, { type: 'FLYER', count: 5 } ],

  [ { type: 'NORMAL', count: 12 }, { type: 'FAST', count: 3 } ],

  [ { type: 'NORMAL', count: 15 }, { type: 'FAST', count: 6 } ],

  [ { type: 'TANK', count: 2 }, { type: 'NORMAL', count: 10 } ],

  [ { type: 'FAST', count: 10 }, { type: 'TANK', count: 4 } ],
];