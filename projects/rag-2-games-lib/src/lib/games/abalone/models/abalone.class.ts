import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player, IPlayerControlsBinding } from '../../../models/player.class';
import { PlayerSourceType } from '../../../models/player-source-type.enum';

export type TPlayerColor = 'BLACK' | 'WHITE';

export interface ICubeCoords {
  x: number;
  y: number;
  z: number;
}

// Pomocniczy typ dla klucza mapy planszy (np. "0,1,-1")
export type THexKey = string;

export class AbaloneState implements TGameState {
  public board = new Map<THexKey, TPlayerColor>();
  
  public currentPlayer: TPlayerColor = 'BLACK';
  public cursor: ICubeCoords = { x: 0, y: 0, z: 0 };
  public selectedMarbles: THexKey[] = [];
  public deadMarbles: Record<TPlayerColor, number> = { BLACK: 0, WHITE: 0 };
 public isGameOver = false;
  public winner: TPlayerColor | null = null;

  public constructor() {
    this.initializeBoard();
  }

  private initializeBoard(): void {
    const radius = 4;
    for (let x = -radius; x <= radius; x++) {
      for (let y = -radius; y <= radius; y++) {
        const z = -x - y;
        if (Math.abs(z) <= radius) {
          const color = this.getInitialColor(x, y, z);
          if (color) {
            this.board.set(`${x},${y},${z}`, color);
          }
        }
      }
    }
  }

private getInitialColor(x: number, y: number, z: number): TPlayerColor | null {
    
    if (y === -4 || y === -3) return 'WHITE';
    if (y === -2 && x >= 0 && x <= 2) return 'WHITE';

    if (y === 4 || y === 3) return 'BLACK';
    if (y === 2 && x >= -2 && x <= 0) return 'BLACK';

    return null;
  }
}


export class Abalone extends Game {
  public override name = 'abalone';
  public override author = 'Ignacy Janus';
  public override state = new AbaloneState();

  public override outputSpec = `
    state:
      board: Map<string, 'BLACK' | 'WHITE'>; 
      currentPlayer: 'BLACK' | 'WHITE';
      cursor: { x: int, y: int, z: int }; 
      selectedMarbles: string[]; 
      deadMarbles: { BLACK: int, WHITE: int }; 
      isGameOver: boolean;
      winner: 'BLACK' | 'WHITE' | null;
  `;

  public override players = [
    new Player(
      1,                                 
      true,                             
      'Gracz',                        
      { move: 0, action: 0 },            
      Abalone.getKeyboardBindings(),      
      '<move>: 1-6 (kierunki hex), <action>: 1:Wybierz/Odznacz, 2:Zatwierdź ruch, 3:Anuluj wybór',
      { 
        move: 'Q,W,E,D,S,A', 
        action: 'Space, Enter, Esc' 
      },
      PlayerSourceType.KEYBOARD
    ),
  ];

  private static getKeyboardBindings(): Record<string, IPlayerControlsBinding> {
    return {
      'q': { variableName: 'move', pressedValue: 1, releasedValue: 0 },
      'w': { variableName: 'move', pressedValue: 2, releasedValue: 0 },
      'e': { variableName: 'move', pressedValue: 3, releasedValue: 0 },
      'd': { variableName: 'move', pressedValue: 4, releasedValue: 0 },
      's': { variableName: 'move', pressedValue: 5, releasedValue: 0 },
      'a': { variableName: 'move', pressedValue: 6, releasedValue: 0 },
      ' ': { variableName: 'action', pressedValue: 1, releasedValue: 0 },
      'Enter': { variableName: 'action', pressedValue: 2, releasedValue: 0 },
      'Escape': { variableName: 'action', pressedValue: 3, releasedValue: 0 }
    };
  }
}