import { Game } from '../models/game.class';
import { Pong } from '../games/pong/models/pong.class';
import { FlappyBird } from '../games/flappybird/models/flappybird.class';
import { SkiJump } from '../games/skijump/models/skijump.class';
import { HappyJump } from '../games/happyjump/models/happyjump.class';
import { Tetris } from '../games/tetris/models/tetris.class';
export const games: Record<string, Game> = {
  pong: new Pong(),
  skijump: new SkiJump(),
  flappybird: new FlappyBird(),
  happyjump: new HappyJump(),
  tetris: new Tetris(),
};
