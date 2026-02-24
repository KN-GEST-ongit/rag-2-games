import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';
import { IMovableEntity } from '../../../games/soccer/models/soccer.object';
import { IEntity } from '../../../games/soccer/models/soccer.object';


export class SoccerState implements TGameState {
    public width = 960;
    public height = 500;

    public scoreRed = 0;
    public scoreBlue = 0;
    public isGoalScored = false;
    public goalTimer = 0;

    public kickPower = 6;
    public friction = 0.98;
    public wallBounciness = 0.5;
    
    public teamRedColor = '#FF0000';
    public teamBlueColor = '#0000FF';

    public kickoffTeam: 'red' | 'blue' | null = null; 

    public player1: IMovableEntity = {
        x: 100,
        y: this.height / 2,
        vx: 0,
        vy: 0,
        radius: 20,
        color: this.teamRedColor,
        speed: 5
  };

     public player2: IMovableEntity = {
        x: this.width - 100,
        y: this.height / 2,
        vx: 0,
        vy: 0,
        radius: 20,
        color: this.teamBlueColor,
        speed: 5
  };

      public ball: IMovableEntity = {
        x: this.width / 2,
        y: this.height / 2,
        vx: 0,
        vy: 0,
        radius: 12,
        color: '#FFFFFF',
        speed: 0 
  };

}

export class Soccer extends Game {
    public override author = "Mateusz Mączyński";
    public override name = 'soccer';
    public override state = new SoccerState();

    public override outputSpec = `
        output:
            width: int;
            height: int;
            scoreRed: int;
            scoreBlue: int;
            player1: { x: float, y: float, vx: float, vy: float, radius: int, color: string, speed: float };
            player2: { x: float, y: float, vx: float, vy: float, radius: int, color: string, speed: float };
            ball: { x: float, y: float, vx: float, vy: float, radius: int };

        default values:
            width: 960;
            height: 500;
            scoreRed: 0;
            scoreBlue: 0;
            player1: { x: 100, y: 250, radius: 20, speed: 5 };
            player2: { x: 860, y: 250, radius: 20, speed: 5 };    
            ball: { x: 480, y: 250, radius: 12 };
    `;
    public override players = [
        new Player(
      0,
      true,
      'Player 1 (Red)',
      { move: 0 },  
      {
        w: {
          variableName: 'move',
          pressedValue: 4, 
          releasedValue: 0,
        },
        s: {
          variableName: 'move',
          pressedValue: 3, 
          releasedValue: 0,
        },
        a: {
          variableName: 'move',
          pressedValue: 2, 
          releasedValue: 0,
        },
        d: {
          variableName: 'move',
          pressedValue: 1, 
          releasedValue: 0,
        },
        

      },
      '<move>: value of {0, 1, 2, 3, 4}, 0: stop, 1: right, 2: left, 3: down, 4: up;',
      {
        up: '[W]',
        down: '[S]',
        left: '[A]',
        right: '[D]',
      }
    ),

    
    new Player(
      1,
      true,
      'Player 2 (Blue)',
      { move: 0 },
      {
        ArrowUp: {
          variableName: 'move',
          pressedValue: 4,
          releasedValue: 0,
        },
        ArrowDown: {
          variableName: 'move',
          pressedValue: 3, 
          releasedValue: 0,
        },
        ArrowLeft: {
          variableName: 'move',
          pressedValue: 2, 
          releasedValue: 0,
        },
        ArrowRight: {
          variableName: 'move',
          pressedValue: 1, 
          releasedValue: 0,
        },
      },
      '<move>: value of {0, 1, 2, 3, 4}, 0: stop, 1: right, 2: left, 3: down, 4: up;',
      {
        up: '[ARROW_UP]',
        down: '[ARROW_DOWN]',
        left: '[ARROW_LEFT]',
        right: '[ARROW_RIGHT]',
      }
    ),
    ];
}