export const ARENA_HALF = 10;
export const CORNER_R = 1.5;         // corner bumper collision radius (matches visual)
export const CORNER_POS = 9.2;      // corner bumper centre offset (visual + physics)
export const GOAL_HALF = 3;          // half-width of goal opening
export const BALL_RADIUS = 0.4;
export const VEHICLE_HALF_W = 1.2;   // half-width of vehicle along its wall
export const VEHICLE_DEPTH = 0.8;    // vehicle extent into arena
export const VEHICLE_RANGE = 7;        // max ±offset along wall

export const BASE_BALL_SPEED = 6;
export const MAX_BALL_SPEED = 12;
export const SPEED_INCREMENT = 0.3;  // added to base speed every 30s
export const SPAWN_INTERVAL_START = 2.5; // seconds between ball spawns initially
export const SPAWN_INTERVAL_MIN = 0.6;

export const SUPER_CHARGE_TIME = 5;  // seconds to fully charge
export const SUPER_RADIUS = 2.5;     // radius of super skill effect
export const SUPER_SPEED_MULT = 2;   // speed multiplier applied to hit balls
export const BARRIER_SPEED_MULT = 1.35; // speed multiplier on eliminated-barrier bounce
export const CORNER_SPEED_VARY = 0.22;  // ±variance on corner bounce (0 = none)
export const SPIN_FACTOR = 0.3;       // how much vehicle velocity affects ball

export type TPlayerSide = 'top' | 'bottom' | 'left' | 'right';
export const SIDES: TPlayerSide[] = ['top', 'bottom', 'left', 'right'];

export type TGameMode = 'ffa' | '2v2';
export const TEAMS_2V2: [TPlayerSide, TPlayerSide][] = [
  ['bottom', 'right'],  // Blue + Yellow
  ['top', 'left'],      // Red + Green
];

export interface IBall {
  id: number;
  x: number;
  z: number;
  vx: number;
  vz: number;
  radius: number;
  speed: number;  // per-ball speed, can diverge from state.ballSpeed after boosts
}

export interface ICrashPlayer {
  side: TPlayerSide;
  position: number;        // [-1, 1] → maps to x or z offset on wall
  velocity: number;        // current lateral movement speed (units/frame)
  hp: number;              // starts at 20
  superCharge: number;     // [0, 1] — 1 means ready to fire
  superActive: boolean;    // true during wave animation
  superWaveRadius: number; // grows during animation, 0 when inactive
  eliminated: boolean;
}
