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
  speed: number;
}

export interface ICrashPlayer {
  side: TPlayerSide;
  position: number;
  velocity: number;
  hp: number;
  superCharge: number;
  superActive: boolean;
  superWaveRadius: number;
  eliminated: boolean;
}
