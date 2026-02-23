export interface IPlayerContext {
  isRotationPressed: boolean;
  isDropDownPressed: boolean;
  tickCounter: number;
  lastMoveTick: number;
  lastRotationTick: number;
  moveCooldown: number;
  rotationCooldown: number;
  fallTimer: number;
  currentGravity: number;
}
