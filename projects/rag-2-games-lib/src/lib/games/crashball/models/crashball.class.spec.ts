import { BASE_BALL_SPEED, SIDES } from './crashball.interfaces';
import { Crashball, CrashballState } from './crashball.class';

describe('CrashballState', () => {
  let state: CrashballState;

  beforeEach(() => {
    state = new CrashballState();
  });

  it('should initialize with 4 players, one per side', () => {
    expect(state.players.length).toBe(4);
    const sides = state.players.map(p => p.side);
    for (const side of SIDES) {
      expect(sides).toContain(side);
    }
  });

  it('should initialize with an empty balls array', () => {
    expect(state.balls).toBeDefined();
    expect(state.balls.length).toBe(0);
  });

  it('should initialize ballSpeed equal to BASE_BALL_SPEED', () => {
    expect(state.ballSpeed).toBe(BASE_BALL_SPEED);
  });

  it('should initialize each player with 20 HP', () => {
    for (const player of state.players) {
      expect(player.hp).toBe(20);
    }
  });
});

describe('Crashball', () => {
  let game: Crashball;

  beforeEach(() => {
    game = new Crashball();
  });

  it('should have 4 players in its players array', () => {
    expect(game.players.length).toBe(4);
  });

  it('should have name equal to "crashball"', () => {
    expect(game.name).toBe('crashball');
  });
});
