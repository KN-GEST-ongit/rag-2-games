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

// Pomocniczy typ dla klucza mapy planszy w notacji Abalone (np. "A1", "E5", "I5")
export type THexKey = string;

/**
 * Zamienia współrzędne cube (x,y,z) na notację Abalone (np. "E5").
 * Wiersz: A(y=4)..I(y=-4), Kolumna: od 1 (lewy skraj wiersza).
 */
export function cubeToNotation(c: ICubeCoords): string {
  const row = String.fromCharCode(65 + (4 - c.y));
  const col = c.x + 5 + Math.min(0, c.y);
  return `${row}${col}`;
}

/**
 * Zamienia notację Abalone (np. "E5") na współrzędne cube.
 */
export function notationToCube(notation: string): ICubeCoords {
  const rowIdx = notation.charCodeAt(0) - 65;
  const col = parseInt(notation.substring(1), 10);
  const y = 4 - rowIdx;
  const x = col - 5 - Math.min(0, y);
  return { x, y, z: -x - y };
}

export interface IMarbleAnim {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: TPlayerColor;
  isDying: boolean;
}

export class AbaloneState implements TGameState {
  public board: Record<THexKey, TPlayerColor> = {};
  
  public currentPlayer: TPlayerColor = 'WHITE';
  public cursor: ICubeCoords = { x: 0, y: 0, z: 0 };
  public selectedMarbles: THexKey[] = [];
  public deadMarbles: Record<TPlayerColor, number> = { BLACK: 0, WHITE: 0 };
  public phase: 'SELECT' | 'MOVE' | 'ANIMATING' = 'SELECT';
  public possibleMoves: number[] = [];
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
            this.board[cubeToNotation({ x, y, z })] = color;
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
      board: Map<string, 'BLACK' | 'WHITE'>; // klucze w notacji Abalone, np. "A1", "E5"
      currentPlayer: 'BLACK' | 'WHITE';
      cursor: { x: int, y: int, z: int }; 
      selectedMarbles: string[]; // notacja Abalone, np. ["E5", "E6"]
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