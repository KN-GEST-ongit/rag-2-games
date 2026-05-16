import {
  normalizeToSpeed,
  resolveCornerCollision,
  resolveWallCollision,
} from './crashball.physics';
import { ARENA_HALF, BALL_RADIUS, CORNER_R } from './crashball.interfaces';

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
    const ball = { x: -7.5, z: -7.5, vx: -1, vz: -1, radius: BALL_RADIUS };
    const corner = { cx: -(ARENA_HALF - CORNER_R), cz: -(ARENA_HALF - CORNER_R) };
    const hit = resolveCornerCollision(ball, corner, 6);
    expect(hit).toBeTrue();
    const nx = ball.x - corner.cx;
    const nz = ball.z - corner.cz;
    expect(ball.vx * nx + ball.vz * nz).toBeGreaterThan(0);
  });

  it('does not affect ball far from corner', () => {
    const ball = { x: 0, z: 0, vx: 1, vz: 0, radius: BALL_RADIUS };
    const corner = { cx: -(ARENA_HALF - CORNER_R), cz: -(ARENA_HALF - CORNER_R) };
    const hit = resolveCornerCollision(ball, corner, 6);
    expect(hit).toBeFalse();
  });
});

describe('resolveWallCollision', () => {
  it('bounces ball off top wall outside goal', () => {
    const ball = { x: 5, z: -(ARENA_HALF - BALL_RADIUS + 0.01), vx: 0, vz: -1, radius: BALL_RADIUS };
    const result = resolveWallCollision(ball, 'top', false, 6);
    expect(result).toBe('bounce');
    expect(ball.vz).toBeGreaterThan(0);
  });

  it('detects goal when ball passes through opening with live player', () => {
    const ball = { x: 0, z: -(ARENA_HALF - BALL_RADIUS + 0.01), vx: 0, vz: -1, radius: BALL_RADIUS };
    const result = resolveWallCollision(ball, 'top', false, 6);
    expect(result).toBe('goal');
  });

  it('bounces off eliminated player wall even in goal area', () => {
    const ball = { x: 0, z: -(ARENA_HALF - BALL_RADIUS + 0.01), vx: 0, vz: -1, radius: BALL_RADIUS };
    const result = resolveWallCollision(ball, 'top', true, 6);
    expect(result).toBe('bounce');
  });
});
