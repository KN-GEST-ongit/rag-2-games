/* eslint-disable complexity */
/* eslint-disable max-lines */
import { TGameState } from '../../../models/game-state.type';
import { Game } from '../../../models/game.class';
import { Player } from '../../../models/player.class';

export type TPiece = 'b' | 'B' | 'w' | 'W' | null;
export type TColor = 'BLACK' | 'WHITE';

export function posToKey(r: number, c: number): string {
  return String.fromCharCode(65 + r) + (c + 1).toString();
}

export function keyToPos(key: string): { r: number; c: number } {
  const r = key.charCodeAt(0) - 65;
  const c = parseInt(key.substring(1), 10) - 1;
  return { r, c };
}

export interface ICaptureMove {
  dst: string;
  captures: string[];
  path?: string[];
}

export class CheckersState implements TGameState {
  public board: Record<string, TPiece> = {};
  public currentPlayer: TColor = 'WHITE';
  public selected: string | null = null;
  public possibleMoves: (string | ICaptureMove)[] = [];
  public isGameOver = false;
  public winner: TColor | null = null;

  public constructor() {
    this.initializeBoard();
  }

  private initializeBoard(): void {
    this.board = {};
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const key = posToKey(r, c);
        if ((r + c) % 2 === 1) {
          this.board[key] = null;
        }
      }
    }

    for (let r = 0; r <= 2; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          this.board[posToKey(r, c)] = 'b';
        }
      }
    }

    for (let r = 5; r <= 7; r++) {
      for (let c = 0; c < 8; c++) {
        if ((r + c) % 2 === 1) {
          this.board[posToKey(r, c)] = 'w';
        }
      }
    }
  }
}

export class Checkers extends Game {
  public override name = 'checkers';
  public override author = 'NAME SURNAME';
  public override state = new CheckersState();
  public isRotationEnabled = false;

  public override outputSpec = `
    state:
      board: Map<string, 'b'|'B'|'w'|'W'|null>;
      currentPlayer: 'BLACK' | 'WHITE';
      selected: string | null;
      possibleMoves: array;
  `;

  public override players = [
    new Player(0, true, 'White', { restart: 0 }, {}, 'keyboard player', {}, undefined),
    new Player(1, true, 'Black', { restart: 0 }, {}, 'keyboard player', {}, undefined),
  ];

  private readonly _diagonalDirs = [
    { dr: -1, dc: -1 },
    { dr: -1, dc: 1 },
    { dr: 1, dc: -1 },
    { dr: 1, dc: 1 }
  ];

  private isOnBoard(r: number, c: number): boolean {
    return r >= 0 && r < 8 && c >= 0 && c < 8;
  }

  public pieceColor(piece: TPiece): TColor | null {
    if (!piece) {
      return null;
    }
    return (piece === 'b' || piece === 'B') ? 'BLACK' : 'WHITE';
  }

  public getPiece(key: string): TPiece {
    return this.state.board[key] ?? null;
  }

  public setPiece(key: string, piece: TPiece): void {
    this.state.board[key] = piece;
  }

  public clearSelection(): void {
    this.state.selected = null;
    this.state.possibleMoves = [];
  }

  public computeMovesFor(key: string): (string | ICaptureMove)[] {
    const piece = this.getPiece(key);
    if (!piece) {
      return [];
    }

    const captures = this.getAllCaptureSequences(key);
    if (captures.length > 0) {
      let max = 0;
      for (const s of captures) {
        if (s.captures.length > max) {
          max = s.captures.length;
        }
      }
      return captures.filter(s => s.captures.length === max);
    }

    const color = this.pieceColor(piece);
    if (!color) {
      return [];
    }

    const isKing = piece === 'B' || piece === 'W';
    const moves: string[] = [];

    if (isKing) {
      const src = keyToPos(key);
      for (const d of this._diagonalDirs) {
        let nr = src.r + d.dr;
        let nc = src.c + d.dc;
        while (this.isOnBoard(nr, nc)) {
          const k = posToKey(nr, nc);
          if (this.getPiece(k)) {
            break;
          }
          moves.push(k);
          nr += d.dr;
          nc += d.dc;
        }
      }
    } else {
      const forwardDirs = color === 'WHITE' ? [{ dr: -1, dc: -1 }, { dr: -1, dc: 1 }] : [{ dr: 1, dc: -1 }, { dr: 1, dc: 1 }];
      const src = keyToPos(key);
      for (const d of forwardDirs) {
        const nr = src.r + d.dr;
        const nc = src.c + d.dc;
        if (!this.isOnBoard(nr, nc)) {
          continue;
        }
        const k = posToKey(nr, nc);
        if (!this.getPiece(k)) {
          moves.push(k);
        }
      }
    }

    return moves;
  }

  public getCapturingPieces(color: TColor): string[] {
    const res: string[] = [];
    for (const k in this.state.board) {
      const p = this.getPiece(k);
      if (this.pieceColor(p) === color) {
        const caps = this.getAllCaptureSequences(k);
        if (caps && caps.length > 0) {
          res.push(k);
        }
      }
    }
    return res;
  }

  public getPiecesWithMaxCaptures(color: TColor): string[] {
    const bestForPiece: Record<string, number> = {};
    let globalMax = 0;

    for (const k in this.state.board) {
      const p = this.getPiece(k);
      if (this.pieceColor(p) !== color) {
        continue;
      }
      const seqs = this.getAllCaptureSequences(k);
      if (!seqs || seqs.length === 0) {
        continue;
      }
      const best = seqs.reduce((acc, s) => Math.max(acc, s.captures.length), 0);
      if (best > 0) {
        bestForPiece[k] = best;
        if (best > globalMax) {
          globalMax = best;
        }
      }
    }

    if (globalMax === 0) {
      return [];
    }
    return Object.keys(bestForPiece).filter(k => bestForPiece[k] === globalMax);
  }

  private getAllCaptureSequences(srcKey: string): ICaptureMove[] {
    const piece = this.getPiece(srcKey);
    if (!piece) {
      return [];
    }

    if (piece === 'B' || piece === 'W') {
      return this.getKingCaptureSequences(srcKey);
    }
    return this.getManCaptureSequences(srcKey);
  }

  private getManCaptureSequences(srcKey: string): ICaptureMove[] {
    const results: ICaptureMove[] = [];

    const recurse = (
      board: Record<string, TPiece>,
      curKey: string,
      capturedSoFar: string[],
      path: string[]
    ): boolean => {
      let hasDeeper = false;
      const curPos = keyToPos(curKey);
      for (const d of this._diagonalDirs) {
        const ar = curPos.r + d.dr;
        const ac = curPos.c + d.dc;
        const jr = curPos.r + 2 * d.dr;
        const jc = curPos.c + 2 * d.dc;
        if (!this.isOnBoard(ar, ac) || !this.isOnBoard(jr, jc)) {
          continue;
        }
        const aKey = posToKey(ar, ac);
        const jKey = posToKey(jr, jc);
        const mid = board[aKey];
        if (!mid) {
          continue;
        }
        if (this.pieceColor(mid) === this.pieceColor(board[curKey])) {
          continue;
        }
        if (board[jKey]) {
          continue;
        }

        const newBoard = { ...board };
        newBoard[aKey] = null;
        newBoard[curKey] = null;
        newBoard[jKey] = board[curKey];

        const newCaptured = [...capturedSoFar, aKey];
        const newPath = [...path, jKey];
        const hasResult: boolean = recurse(newBoard, jKey, newCaptured, newPath);
        hasDeeper = hasDeeper || hasResult;
      }

      if (!hasDeeper && capturedSoFar.length > 0) {
        results.push({ dst: curKey, captures: capturedSoFar.slice(), path: path.slice() });
      }
      return hasDeeper;
    };

    recurse({ ...this.state.board }, srcKey, [], []);
    return results;
  }

  private getKingCaptureSequences(srcKey: string): ICaptureMove[] {
    const results: ICaptureMove[] = [];

    const recurse = (
      board: Record<string, TPiece>,
      curKey: string,
      capturedSoFar: string[],
      path: string[]
    ): boolean => {
      let hasDeeper = false;
      const curPos = keyToPos(curKey);
      for (const d of this._diagonalDirs) {
        let r = curPos.r + d.dr;
        let c = curPos.c + d.dc;
        while (this.isOnBoard(r, c) && !board[posToKey(r, c)]) {
          r += d.dr;
          c += d.dc;
        }
        if (!this.isOnBoard(r, c)) {
          continue;
        }
        const opponentKey = posToKey(r, c);
        if (this.pieceColor(board[opponentKey]) === this.pieceColor(board[curKey])) {
          continue;
        }

        let lr = r + d.dr;
        let lc = c + d.dc;
        while (this.isOnBoard(lr, lc)) {
          const landKey = posToKey(lr, lc);
          if (board[landKey]) {
            break;
          }
          const newBoard = { ...board };
          newBoard[opponentKey] = null;
          newBoard[curKey] = null;
          newBoard[landKey] = board[curKey];

          const newCaptured = [...capturedSoFar, opponentKey];
          const newPath = [...path, landKey];

          const hasResult: boolean = recurse(newBoard, landKey, newCaptured, newPath);
          hasDeeper = hasDeeper || hasResult;

          lr += d.dr;
          lc += d.dc;
        }
      }

      if (!hasDeeper && capturedSoFar.length > 0) {
        results.push({ dst: curKey, captures: capturedSoFar.slice(), path: path.slice() });
      }
      return hasDeeper;
    };

    recurse({ ...this.state.board }, srcKey, [], []);
    return results;
  }

  public executeMove(src: string, selectedMove: string | ICaptureMove): void {
    const piece = this.getPiece(src);
    if (!piece) {
      return;
    }

    if (typeof selectedMove === 'string') {
      const dst = selectedMove;
      this.setPiece(dst, piece);
      this.setPiece(src, null);
    } else {
      for (const cap of selectedMove.captures) {
        this.setPiece(cap, null);
      }
      this.setPiece(selectedMove.dst, piece);
      this.setPiece(src, null);
    }

    const dstPos = keyToPos(typeof selectedMove === 'string' ? selectedMove : selectedMove.dst);
    if (piece === 'w' && dstPos.r === 0) {
      this.setPiece(typeof selectedMove === 'string' ? selectedMove : selectedMove.dst, 'W');
    }
    if (piece === 'b' && dstPos.r === 7) {
      this.setPiece(typeof selectedMove === 'string' ? selectedMove : selectedMove.dst, 'B');
    }

    this.state.currentPlayer = this.state.currentPlayer === 'WHITE' ? 'BLACK' : 'WHITE';
    this.clearSelection();
    this.updateGameOver();
  }

  private updateGameOver(): void {
    const counts = { WHITE: 0, BLACK: 0 };
    for (const k in this.state.board) {
      const p = this.getPiece(k);
      const col = this.pieceColor(p);
      if (col) {
        counts[col]++;
      }
    }

    if (counts.WHITE === 0 || counts.BLACK === 0) {
      this.state.isGameOver = true;
      this.state.winner = counts.WHITE === 0 ? 'BLACK' : 'WHITE';
      return;
    }

    const cur = this.state.currentPlayer;
    let hasMove = false;
    for (const k in this.state.board) {
      const p = this.getPiece(k);
      if (this.pieceColor(p) === cur) {
        const m = this.computeMovesFor(k);
        if (m.length > 0) {
          hasMove = true;
          break;
        }
      }
    }

    if (!hasMove) {
      this.state.isGameOver = true;
      this.state.winner = cur === 'WHITE' ? 'BLACK' : 'WHITE';
    }
  }
}