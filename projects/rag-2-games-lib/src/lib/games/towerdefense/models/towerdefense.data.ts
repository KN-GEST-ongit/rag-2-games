import { ITowerData } from "./towerdefense.interfaces";

//WIEŻE
export const TowerTypes: Record<string, ITowerData> = {
  'BASIC': {
    name: 'Turret Lvl 1',
    cost: 100,
    damage: 48,
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
    name: 'Turret Lvl 2',
    cost: 0,
    damage: 72,
    range: 3.0,
    fireRate: 25,
    color: '#D2691E',
    canHitAir: true,
    canHitGround: true,
    splashRadius: 0
  },

  'CANNON': {
    name: 'Cannon Lvl 1',
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
    name: 'Cannon Lvl 2',
    cost: 0,
    damage: 108,
    range: 4.0,
    fireRate: 80,
    color: '#222',
    canHitAir: false,
    canHitGround: true,
    splashRadius: 2.0
  },
  'AA_GUN': {
    name: 'Anti-Air Gun Lvl 1',
    cost: 150,
    damage: 105,
    range: 4.0,
    fireRate: 30,
    color: '#00FF00',
    canHitAir: true,
    canHitGround: false,
    splashRadius: 0,
    upgradeCost: 200,
    upgradesTo: 'AA_GUN_L2'
  },
  'AA_GUN_L2': {
    name: 'Anti-Air Gun Lvl 2',
    cost: 0,
    damage: 155,
    range: 4.5,
    fireRate: 25,
    color: '#32CD32',
    canHitAir: true,
    canHitGround: false,
    splashRadius: 0,
  },
};

//WROGOWIE
export const EnemyTypes = {
  'TANK': {
    health: 350,
    speed: 0.7,
    reward: 10,
    color: 'purple',
    isFlying: false
  },
  'HELICOPTER': {
    health: 175,
    speed: 1.2,
    reward: 15,
    color: '#00BFFF',
    isFlying: true
  },
  'BOSS_TANK': {
    health: 2500,
    speed: 0.5,
    reward: 500,
    color: '#FF4500',
    isFlying: false,
  },
  'VEHICLE': {
    health: 180,
    speed: 1.5,
    reward: 5,
    color: '#0f0904ff',
    isFlying: false,
  },
  'JET': {
    health: 120,
    speed: 2.5,
    reward: 15,
    color: '#A9A9A9',
    isFlying: true,
  }
};

//FALE
export const WaveDefinitions = {
  map0: [
    [ { type: 'TANK', count: 4 }, { type: 'VEHICLE', count: 3 }, { type: 'HELICOPTER', count: 2 } ],
    [ { type: 'TANK', count: 12 }, { type: 'HELICOPTER', count: 3 } ],
    [ { type: 'TANK', count: 15 }, { type: 'HELICOPTER', count: 6 } ],
    [ { type: 'TANK', count: 2 }, { type: 'HELICOPTER', count: 10 } ],
    [ { type: 'TANK', count: 10 }, { type: 'HELICOPTER', count: 4 }, { type: 'BOSS_TANK', count: 1 } ],
    [ { type: 'TANK', count: 20 }, { type: 'HELICOPTER', count: 8 } ],
    [ { type: 'TANK', count: 10 }, { type: 'HELICOPTER', count: 15 } ],
    [ { type: 'TANK', count: 25 }, { type: 'HELICOPTER', count: 5 } ],
    [ { type: 'TANK', count: 18 }, { type: 'HELICOPTER', count: 12 } ],
    [ { type: 'TANK', count: 30 }, { type: 'HELICOPTER', count: 15 }, { type: 'BOSS_TANK', count: 2 } ],
  ],
  map1: [
    [ { type: 'TANK', count: 6 }, { type: 'VEHICLE', count: 3 } ],
    [ { type: 'HELICOPTER', count: 8 } ],
    [ { type: 'TANK', count: 14 }, { type: 'HELICOPTER', count: 4 } ],
    [ { type: 'TANK', count: 8 }, { type: 'HELICOPTER', count: 10 } ],
    [ { type: 'TANK', count: 20 }, { type: 'HELICOPTER', count: 5 }, { type: 'BOSS_TANK', count: 1 } ],
    [ { type: 'HELICOPTER', count: 18 } ],
    [ { type: 'TANK', count: 22 } ],
    [ { type: 'TANK', count: 15 }, { type: 'HELICOPTER', count: 15 } ],
    [ { type: 'HELICOPTER', count: 25 }, { type: 'TANK', count: 5 } ],
    [ { type: 'TANK', count: 25 }, { type: 'HELICOPTER', count: 10 }, { type: 'BOSS_TANK', count: 2 } ],
  ],
  map2: [
    [ { type: 'HELICOPTER', count: 6 }, { type: 'VEHICLE', count: 5 } ],
    [ { type: 'TANK', count: 10 }, { type: 'HELICOPTER', count: 4 } ],
    [ { type: 'TANK', count: 18 } ],
    [ { type: 'HELICOPTER', count: 12 }, { type: 'TANK', count: 5 } ],
    [ { type: 'TANK', count: 15 }, { type: 'HELICOPTER', count: 10 }, { type: 'BOSS_TANK', count: 1 } ],
    [ { type: 'TANK', count: 22 }, { type: 'HELICOPTER', count: 6 } ],
    [ { type: 'HELICOPTER', count: 20 } ],
    [ { type: 'TANK', count: 28 } ],
    [ { type: 'TANK', count: 15 }, { type: 'HELICOPTER', count: 18 } ],
    [ { type: 'TANK', count: 20 }, { type: 'HELICOPTER', count: 20 }, { type: 'BOSS_TANK', count: 2 } ],
  ],
  map3: [
    [ { type: 'TANK', count: 6 }, { type: 'VEHICLE', count: 4 } ],
    [ { type: 'TANK', count: 8 }, { type: 'HELICOPTER', count: 6 } ],
    [ { type: 'HELICOPTER', count: 14 } ],
    [ { type: 'TANK', count: 18 }, { type: 'HELICOPTER', count: 5 } ],
    [ { type: 'TANK', count: 12 }, { type: 'HELICOPTER', count: 12 }, { type: 'BOSS_TANK', count: 1 } ],
    [ { type: 'TANK', count: 25 }, { type: 'HELICOPTER', count: 8 } ],
    [ { type: 'HELICOPTER', count: 22 }, { type: 'TANK', count: 5 } ],
    [ { type: 'TANK', count: 30 } ],
    [ { type: 'TANK', count: 20 }, { type: 'HELICOPTER', count: 15 } ],
    [ { type: 'TANK', count: 25 }, { type: 'HELICOPTER', count: 20 }, { type: 'BOSS_TANK', count: 3 } ],
  ],
};