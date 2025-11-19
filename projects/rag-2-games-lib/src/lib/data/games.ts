import { Game } from '../models/game.class';
import { Pong } from '../games/pong/models/pong.class';
import { FlappyBird } from '../games/flappybird/models/flappybird.class';
import { SkiJump } from '../games/skijump/models/skijump.class';
import { HappyJump } from '../games/happyjump/models/happyjump.class';
import { Spaceinvaders } from '../games/spaceinvaders/models/spaceinvaders.class';
import { Snake } from '../games/snake/models/snake.class';
import { Pacman } from '../games/pacman/models/pacman.class';
import { TowerDefense } from '../games/towerdefense/models/towerdefense.class';
export const games: Record<string, Game> = {
  pong: new Pong(),
  skijump: new SkiJump(),
  flappybird: new FlappyBird(),
  happyjump: new HappyJump(),
  spaceinvaders: new Spaceinvaders(),
  snake: new Snake(),
  pacman: new Pacman(),
  towerdefense: new TowerDefense(),
};
