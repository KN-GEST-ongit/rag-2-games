/* eslint-disable max-lines */
import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player, IPlayerControlsBinding } from '../../../models/player.class';

export type TPlayerColor = 'BLACK' | 'WHITE';

export interface ICubeCoords {
  x: number;
  y: number;
  z: number;
}

// Helper type for the board map key in Abalone notation (e.g., "A1", "E5", "I5")
export type THexKey = string;

export const ABALONE_WIN_SCORE = 6;

export const HEX_AXIS_DIRS: ICubeCoords[] = [
  { x: 1, y: -1, z: 0 },
  { x: 1, y: 0, z: -1 },
  { x: 0, y: 1, z: -1 },
];

export function cubeDistance(a: ICubeCoords, b: ICubeCoords): number {
  return (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) + Math.abs(a.z - b.z)) / 2;
}

export function areNeighbors(a: ICubeCoords, b: ICubeCoords): boolean {
  return cubeDistance(a, b) === 1;
}

export function areInLine(a: ICubeCoords, b: ICubeCoords, c: ICubeCoords): boolean {
  const points = [a, b, c];

  for (const axis of HEX_AXIS_DIRS) {
    const projections = points.map(p => p.x * axis.x + p.y * axis.y + p.z * axis.z);
    projections.sort((x, y) => x - y);

    if (projections[1] - projections[0] === 1 && projections[2] - projections[1] === 1) {
      const sorted = [...points].sort((p1, p2) => {
        return (p1.x * axis.x + p1.y * axis.y + p1.z * axis.z) -
               (p2.x * axis.x + p2.y * axis.y + p2.z * axis.z);
      });
      const d1 = { x: sorted[1].x - sorted[0].x, y: sorted[1].y - sorted[0].y, z: sorted[1].z - sorted[0].z };
      const d2 = { x: sorted[2].x - sorted[1].x, y: sorted[2].y - sorted[1].y, z: sorted[2].z - sorted[1].z };

      if (d1.x === d2.x && d1.y === d2.y && d1.z === d2.z &&
          cubeDistance({ x: 0, y: 0, z: 0 }, d1) === 1) {
        return true;
      }
    }
  }
  return false;
}

const ROW_MIN_X = [-4, -4, -4, -4, -4, -3, -2, -1, 0];
const ROW_START_COL = [1, 1, 1, 1, 1, 2, 3, 4, 5];

/** Converts cube coordinates (x,y,z) to Abalone notation (e.g., "E5").
 Row: A(y=4)..I(y=-4), Column: starting from 1 (leftmost edge of the row).*/
export function cubeToNotation(c: ICubeCoords): string {
  const rowIndex = 4 - c.y;
  const row = String.fromCharCode(65 + rowIndex);
  const col = ROW_START_COL[rowIndex] + (c.x - ROW_MIN_X[rowIndex]);
  return `${row}${col}`;
}

// Converts Abalone notation (e.g., "E5") to cube coordinates 
export function notationToCube(notation: string): ICubeCoords {
  const rowIdx = notation.charCodeAt(0) - 65;
  const col = parseInt(notation.substring(1), 10);
  const y = 4 - rowIdx;
  const x = ROW_MIN_X[rowIdx] + (col - ROW_START_COL[rowIdx]);
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
  
  public currentPlayer: TPlayerColor = 'BLACK';
  public cursor: ICubeCoords = { x: 0, y: 0, z: 0 };
  public selectedMarbles: THexKey[] = [];
  public deadMarbles: Record<TPlayerColor, number> = { BLACK: 0, WHITE: 0 };
  public phase: 'SELECT' | 'MOVE' | 'ANIMATING' = 'SELECT';
  public possibleMoves: number[] = [];
  public selectedDirection = 0;
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
          const color = this.getInitialColor(x, y);
          if (color) {
            this.board[cubeToNotation({ x, y, z })] = color;
          }
        }
      }
    }
  }

  private getInitialColor(x: number, y: number): TPlayerColor | null {
    if (y >= 3) return 'BLACK';
    if (y <= -3) return 'WHITE';
    const [min, max] = y > 0 ? [-2, 0] : [0, 2];
    if (Math.abs(y) === 2 && x >= min && x <= max) return y > 0 ? 'BLACK' : 'WHITE';
    return null;
  }
}

export class Abalone extends Game {
  public override name = 'abalone';
  public override author = 'Ignacy Janus';
  public override state = new AbaloneState();
  public isRotationEnabled = false;
  public isHintsEnabled = false;
  public isNumpadHints = false;
  public isConfirmationRequired = true;
  public override outputSpec = `
    state:
      board: Map<string, 'BLACK' | 'WHITE'>; // keys in Abalone notation, e.g., "A1", "E5"
      currentPlayer: 'BLACK' | 'WHITE';
      deadMarbles: { BLACK: int, WHITE: int }; 
      isGameOver: boolean;
      phase: string;
      winner: 'BLACK' | 'WHITE' | null;

    default values:
      currentPlayer: 'BLACK';
      deadMarbles: { BLACK: 0, WHITE: 0 };
      isGameOver: false;
      phase: 'SELECT';
      winner: null;
      board: {};
  `;

  public override players = [
    new Player(
      0,
      true,
      'White',
      { move: 0, action: 0, info: 0 },
      Abalone.getKeyboardBindings(),
      '<move>: 1-6 (hex directions), <action>: 1:Select/Deselect or Execute move, 3:Cancel selection',
      {
        move: 'Q,W,E,D,S,A',
        action: 'Space, Esc'
      }
    ),
    new Player(
      1,
      true,
      'Black',
      { move: 0, action: 0, info: 0 },
      Abalone.getKeyboardBindings(),
      '<move>: 1-6 (hex directions), <action>: 1:Select/Deselect or Execute move, 3:Cancel selection',
      {
        move: 'Q,W,E,D,S,A',
        action: 'Space, Esc'
      }
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
      'Q': { variableName: 'move', pressedValue: 1, releasedValue: 0 },
      'W': { variableName: 'move', pressedValue: 2, releasedValue: 0 },
      'E': { variableName: 'move', pressedValue: 3, releasedValue: 0 },
      'D': { variableName: 'move', pressedValue: 4, releasedValue: 0 },
      'S': { variableName: 'move', pressedValue: 5, releasedValue: 0 },
      'A': { variableName: 'move', pressedValue: 6, releasedValue: 0 },
      '8': { variableName: 'move', pressedValue: 1, releasedValue: 0 },
      '9': { variableName: 'move', pressedValue: 2, releasedValue: 0 },
      '6': { variableName: 'move', pressedValue: 3, releasedValue: 0 },
      '3': { variableName: 'move', pressedValue: 4, releasedValue: 0 },
      '2': { variableName: 'move', pressedValue: 5, releasedValue: 0 },
      '5': { variableName: 'move', pressedValue: 6, releasedValue: 0 },
      ' ': { variableName: 'action', pressedValue: 1, releasedValue: 0 },
      'Enter': { variableName: 'action', pressedValue: 2, releasedValue: 0 },
      'Escape': { variableName: 'action', pressedValue: 3, releasedValue: 0 },
      'Backspace': { variableName: 'action', pressedValue: 3, releasedValue: 0 },
      'i': { variableName: 'info', pressedValue: 1, releasedValue: 0 },
      'I': { variableName: 'info', pressedValue: 1, releasedValue: 0 }
    };
  }
}