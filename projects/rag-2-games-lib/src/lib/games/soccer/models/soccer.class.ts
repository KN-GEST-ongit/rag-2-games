import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export class SoccerState implements TGameState {
  public scoreRed = 0;
  public scoreBlue = 0;
  public kickoffTeam: 'red' | 'blue' | null = null;

  //gracz1
  public player1X = 100;
  public player1Y = 275;
  public player1VX = 0;
  public player1VY = 0;

  //gracz2
  public player2X = 900;
  public player2Y = 275;
  public player2VX = 0;
  public player2VY = 0;

  //pilka
  public ballX = 500;
  public ballY = 275;
  public ballVX = 0;
  public ballVY = 0;
}

export class Soccer extends Game {
  public override author = 'Mateusz Mączyński';
  public override name = 'soccer';
  public override state = new SoccerState();

  public override outputSpec = `
        output:
            scoreRed: int, <0, inf>;
            scoreBlue: int, <0, inf>;
            player1X: float, <16, 984>;
            player1Y: float, <56, 494>;
            player1VX: float, <-2.4, 2.4>;
            player1VY: float, <-2.4, 2.4>;
            player2X: float, <16, 984>;
            player2Y: float, <56, 494>;
            player2VX: float, <-2.35, 2.35>;
            player2VY: float, <-2.35, 2.35>;
            ballX: float, <0, 1000>;
            ballY: float, <52, 498>;
            ballVX: float, <-12, 12>;
            ballVY: float, <-12, 12>;

        default values:
            scoreRed: 0;
            scoreBlue: 0;
            player1X: 100;
            player1Y: 275;
            player2X: 900;
            player2Y: 275;    
            ballX: 500;
            ballY: 275;
    `;
  public override players = [
    new Player(
      0,
      true,
      'Player 1',
      { moveX: 0, moveY: 0, kick: 0 },
      {
        w: { variableName: 'moveY', pressedValue: -1, releasedValue: 0 },
        s: { variableName: 'moveY', pressedValue: 1, releasedValue: 0 },
        a: { variableName: 'moveX', pressedValue: -1, releasedValue: 0 },
        d: { variableName: 'moveX', pressedValue: 1, releasedValue: 0 },

        W: { variableName: 'moveY', pressedValue: -1, releasedValue: 0 },
        S: { variableName: 'moveY', pressedValue: 1, releasedValue: 0 },
        A: { variableName: 'moveX', pressedValue: -1, releasedValue: 0 },
        D: { variableName: 'moveX', pressedValue: 1, releasedValue: 0 },
        ' ': { variableName: 'kick', pressedValue: 1, releasedValue: 0 },
      },
      '<moveX>: -1 left, 1 right; <moveY>: -1 up, 1 down; <kick>: 1 kick',
      { up: '[W]', down: '[S]', left: '[A]', right: '[D]', kick: '[SPACE]' }
    ),

    new Player(
      1,
      true,
      'Player 2',
      { moveX: 0, moveY: 0, kick: 0 },
      {
        ArrowUp: { variableName: 'moveY', pressedValue: -1, releasedValue: 0 },
        ArrowDown: { variableName: 'moveY', pressedValue: 1, releasedValue: 0 },
        ArrowLeft: {
          variableName: 'moveX',
          pressedValue: -1,
          releasedValue: 0,
        },
        ArrowRight: {
          variableName: 'moveX',
          pressedValue: 1,
          releasedValue: 0,
        },
        Enter: { variableName: 'kick', pressedValue: 1, releasedValue: 0 },
      },
      '<moveX>: -1 left, 1 right; <moveY>: -1 up, 1 down; <kick>: 1 kick',
      {
        up: '[ARROW_UP]',
        down: '[ARROW_DOWN]',
        left: '[ARROW_LEFT]',
        right: '[ARROW_RIGHT]',
        kick: '[ENTER]',
      }
    ),
  ];
}
