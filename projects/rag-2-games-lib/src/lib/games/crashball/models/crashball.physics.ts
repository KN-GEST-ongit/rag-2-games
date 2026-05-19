/* eslint-disable complexity */
import { CORNER_R, CORNER_POS, VEHICLE_HALF_W, VEHICLE_RANGE } from './crashball.constants';
import { TPlayerSide } from './crashball.interfaces';

const VEHICLE_DEPTH = 0.8;
const SPIN_FACTOR = 0.3;

export function normalizeToSpeed(vx: number, vz: number, speed: number): [number, number] {
  const len = Math.sqrt(vx * vx + vz * vz);
  if (len < 0.0001) return [speed, 0];
  return [(vx / len) * speed, (vz / len) * speed];
}

export function resolveCornerCollision(
  ball: { x: number; z: number; vx: number; vz: number; radius: number },
  corner: { cx: number; cz: number },
  speed: number
): boolean {
  const dx = ball.x - corner.cx;
  const dz = ball.z - corner.cz;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist < CORNER_R + ball.radius && dist > 0.0001) {
    const nx = dx / dist;
    const nz = dz / dist;
    ball.x = corner.cx + nx * (CORNER_R + ball.radius);
    ball.z = corner.cz + nz * (CORNER_R + ball.radius);
    const dot = ball.vx * nx + ball.vz * nz;
    if (dot < 0) {
      ball.vx -= 2 * dot * nx;
      ball.vz -= 2 * dot * nz;
      [ball.vx, ball.vz] = normalizeToSpeed(ball.vx, ball.vz, speed);
    }
    return true;
  }
  return false;
}

export function resolveWallCollision(
  ball: { x: number; z: number; vx: number; vz: number; radius: number },
  side: TPlayerSide,
  playerEliminated: boolean,
  speed: number
): 'goal' | 'bounce' | null {
  const limit = CORNER_POS;
  switch (side) {
    case 'top':
      if (ball.z + ball.radius >= limit) {
        if (!playerEliminated) return 'goal';
        ball.z = limit - ball.radius;
        ball.vz = -Math.abs(ball.vz);
        [ball.vx, ball.vz] = normalizeToSpeed(ball.vx, ball.vz, speed);
        return 'bounce';
      }
      break;
    case 'bottom':
      if (ball.z - ball.radius <= -limit) {
        if (!playerEliminated) return 'goal';
        ball.z = -limit + ball.radius;
        ball.vz = Math.abs(ball.vz);
        [ball.vx, ball.vz] = normalizeToSpeed(ball.vx, ball.vz, speed);
        return 'bounce';
      }
      break;
    case 'left':
      if (ball.x - ball.radius <= -limit) {
        if (!playerEliminated) return 'goal';
        ball.x = -limit + ball.radius;
        ball.vx = Math.abs(ball.vx);
        [ball.vx, ball.vz] = normalizeToSpeed(ball.vx, ball.vz, speed);
        return 'bounce';
      }
      break;
    case 'right':
      if (ball.x + ball.radius >= limit) {
        if (!playerEliminated) return 'goal';
        ball.x = limit - ball.radius;
        ball.vx = -Math.abs(ball.vx);
        [ball.vx, ball.vz] = normalizeToSpeed(ball.vx, ball.vz, speed);
        return 'bounce';
      }
      break;
  }
  return null;
}

export function getCornerCenter(index: number): { cx: number; cz: number } {
  return [
    { cx: -CORNER_POS, cz: -CORNER_POS },
    { cx:  CORNER_POS, cz: -CORNER_POS },
    { cx: -CORNER_POS, cz:  CORNER_POS },
    { cx:  CORNER_POS, cz:  CORNER_POS },
  ][index];
}

export function spawnBallAtCorner(
  cornerIndex: number,
  speed: number
): { x: number; z: number; vx: number; vz: number } {
  const ranges: { cx: number; cz: number; amin: number; amax: number }[] = [
    { cx: -CORNER_POS, cz: -CORNER_POS, amin: 0, amax: Math.PI / 2 },
    { cx:  CORNER_POS, cz: -CORNER_POS, amin: Math.PI / 2, amax: Math.PI },
    { cx: -CORNER_POS, cz:  CORNER_POS, amin: -Math.PI / 2, amax: 0 },
    { cx:  CORNER_POS, cz:  CORNER_POS, amin: Math.PI, amax: 3 * Math.PI / 2 },
  ];
  const c = ranges[cornerIndex];
  const angle = c.amin + Math.random() * (c.amax - c.amin);
  return {
    x: c.cx + Math.cos(angle) * (CORNER_R + 0.5),
    z: c.cz + Math.sin(angle) * (CORNER_R + 0.5),
    vx: Math.cos(angle) * speed,
    vz: Math.sin(angle) * speed,
  };
}

export function resolveBallCollision(
  a: { x: number; z: number; vx: number; vz: number; radius: number },
  b: { x: number; z: number; vx: number; vz: number; radius: number },
  speed: number
): boolean {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const minDist = a.radius + b.radius;
  if (dist >= minDist || dist < 0.0001) return false;

  const overlap = (minDist - dist) / 2;
  const nx = dx / dist;
  const nz = dz / dist;
  a.x -= nx * overlap;
  a.z -= nz * overlap;
  b.x += nx * overlap;
  b.z += nz * overlap;

  const dvx = b.vx - a.vx;
  const dvz = b.vz - a.vz;
  const dot = dvx * nx + dvz * nz;
  if (dot < 0) {
    a.vx += dot * nx;
    a.vz += dot * nz;
    b.vx -= dot * nx;
    b.vz -= dot * nz;
    [a.vx, a.vz] = normalizeToSpeed(a.vx, a.vz, speed);
    [b.vx, b.vz] = normalizeToSpeed(b.vx, b.vz, speed);
  }
  return true;
}

export function resolveVehicleCollision(
  ball: { x: number; z: number; vx: number; vz: number; radius: number },
  vehicle: { x: number; z: number; side: TPlayerSide; velocity: number },
  speed: number,
): boolean {
  const dx = ball.x - vehicle.x;
  const dz = ball.z - vehicle.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const minDist = ball.radius + VEHICLE_HALF_W;

  if (dist >= minDist || dist < 0.0001) return false;

  const nx = dx / dist;
  const nz = dz / dist;
  ball.x = vehicle.x + nx * minDist;
  ball.z = vehicle.z + nz * minDist;

  const dot = ball.vx * nx + ball.vz * nz;
  if (dot >= 0) return true;

  ball.vx -= 2 * dot * nx;
  ball.vz -= 2 * dot * nz;

  if (vehicle.side === 'top' || vehicle.side === 'bottom') {
    ball.vx += vehicle.velocity * SPIN_FACTOR;
  } else {
    ball.vz += vehicle.velocity * SPIN_FACTOR;
  }

  [ball.vx, ball.vz] = normalizeToSpeed(ball.vx, ball.vz, speed);
  return true;
}

export function getVehicleWorldPos(side: TPlayerSide, position: number): { x: number; z: number } {
  const offset = position * VEHICLE_RANGE;
  const wallEdge = CORNER_POS - VEHICLE_DEPTH / 2;
  switch (side) {
    case 'top':    return { x: offset,    z:  wallEdge };
    case 'bottom': return { x: offset,    z: -wallEdge };
    case 'left':   return { x: -wallEdge, z: offset };
    case 'right':  return { x: wallEdge,  z: offset };
  }
}
