import {
  normalizeToSpeed,
  resolveCornerCollision,
  resolveWallCollision,
} from './crashball.physics';
import { BALL_RADIUS, CORNER_POS } from './crashball.interfaces';

describe('normalizeToSpeed', () => {
  it('scales vector to given speed', () => {
    const [vx, vz] = normalizeToSpeed(3, 4, 10);
    expect(Math.round(Math.sqrt(vx * vx + vz * vz))).toBe(10);
  });

  it('handles zero vector by returning speed on X axis', () => {
    const [vx, vz] = normalizeToSpeed(0, 0, 6);
    expect(vx).toBe(6);
    expect(vz).toBe(0);
  });
});

describe('resolveCornerCollision', () => {
  it('reflects ball moving into top-left corner', () => {
    const ball = { x: -8.5, z: -8.5, vx: -1, vz: -1, radius: BALL_RADIUS };
    const corner = { cx: -CORNER_POS, cz: -CORNER_POS };
    const didHit = resolveCornerCollision(ball, corner, 6);
    expect(didHit).toBeTrue();
    const nx = ball.x - corner.cx;
    const nz = ball.z - corner.cz;
    expect(ball.vx * nx + ball.vz * nz).toBeGreaterThan(0);
  });

  it('does not affect ball far from corner', () => {
    const ball = { x: 0, z: 0, vx: 1, vz: 0, radius: BALL_RADIUS };
    const corner = { cx: -CORNER_POS, cz: -CORNER_POS };
    const didHit = resolveCornerCollision(ball, corner, 6);
    expect(didHit).toBeFalse();
  });
});

describe('resolveWallCollision', () => {
  it('detects ball crossing top wall', () => {
    const ball = { x: 5, z: -(CORNER_POS - BALL_RADIUS + 0.01), radius: BALL_RADIUS };
    expect(resolveWallCollision(ball, 'top')).toBeTrue();
  });

  it('does not trigger when ball is inside arena', () => {
    const ball = { x: 0, z: 0, radius: BALL_RADIUS };
    expect(resolveWallCollision(ball, 'top')).toBeFalse();
  });

  it('detects ball crossing bottom wall', () => {
    const ball = { x: 0, z: CORNER_POS - BALL_RADIUS + 0.01, radius: BALL_RADIUS };
    expect(resolveWallCollision(ball, 'bottom')).toBeTrue();
  });
});
