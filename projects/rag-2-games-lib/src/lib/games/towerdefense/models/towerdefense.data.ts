export interface ITowerData {
  name: string;
  cost: number;
  damage: number;
  range: number;
  fireRate: number;
  color: string;
}

//WIEŻE
export const TowerTypes = {
  'BASIC': {
    name: 'Działko',
    cost: 100,
    damage: 12,
    range: 2.5,
    fireRate: 30,
    color: 'brown'
  },
  'CANNON': {
    name: 'Armata',
    cost: 250,
    damage: 40,
    range: 3.5,
    fireRate: 90,
    color: '#444'
  },
};

//WROGOWIE
export const EnemyTypes = {
  'NORMAL': {
    health: 100,
    speed: 1.0,
    reward: 10,
    color: 'green'
  },
  'FAST': {
    health: 60,
    speed: 1.8,
    reward: 15,
    color: 'yellow'
  },
  'TANK': {
    health: 350,
    speed: 0.7,
    reward: 25,
    color: 'purple'
  }
};

//FALE
export const WaveDefinitions = [
  [ { type: 'NORMAL', count: 8 } ],

  [ { type: 'NORMAL', count: 12 }, { type: 'FAST', count: 3 } ],

  [ { type: 'NORMAL', count: 15 }, { type: 'FAST', count: 6 } ],

  [ { type: 'TANK', count: 2 }, { type: 'NORMAL', count: 10 } ],

  [ { type: 'FAST', count: 10 }, { type: 'TANK', count: 4 } ],
];