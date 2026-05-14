import { AbaloneState, ICubeCoords, IMarbleAnim, cubeToNotation } from './abalone.class';

type TSortMarblesAlongDir = (marbles: ICubeCoords[], dir: ICubeCoords) => ICubeCoords[];
type TIsOnBoard = (pos: ICubeCoords) => boolean;

export function executeInlineMove(
  state: AbaloneState,
  selected: ICubeCoords[],
  dir: ICubeCoords,
  sortMarblesAlongDir: TSortMarblesAlongDir,
  isOnBoard: TIsOnBoard
): void {
  const sorted = sortMarblesAlongDir(selected, dir);
  const front = sorted[sorted.length - 1];

  // Collect opponent marbles to push
  let pushPos: ICubeCoords = { x: front.x + dir.x, y: front.y + dir.y, z: front.z + dir.z };
  const opponentMarbles: ICubeCoords[] = [];

  while (isOnBoard(pushPos)) {
    const key = cubeToNotation(pushPos);
    const color = state.board[key];
    if (!color || color === state.currentPlayer) break;
    opponentMarbles.push({ ...pushPos });
    pushPos = { x: pushPos.x + dir.x, y: pushPos.y + dir.y, z: pushPos.z + dir.z };
  }

  // Move opponent marbles (starting from the furthest)
  for (let i = opponentMarbles.length - 1; i >= 0; i--) {
    const opp = opponentMarbles[i];
    const oppKey = cubeToNotation(opp);
    const oppColor = state.board[oppKey];
    delete state.board[oppKey];

    if (!oppColor) continue;

    const newPos: ICubeCoords = { x: opp.x + dir.x, y: opp.y + dir.y, z: opp.z + dir.z };
    if (isOnBoard(newPos)) {
      state.board[cubeToNotation(newPos)] = oppColor;
    } else {
      state.deadMarbles[oppColor]++;
    }
  }

  // Move own marbles
  const colors = sorted.map(m => state.board[cubeToNotation(m)] ?? state.currentPlayer);
  sorted.forEach(m => delete state.board[cubeToNotation(m)]);
  sorted.forEach((m, i) => {
    state.board[cubeToNotation({ x: m.x + dir.x, y: m.y + dir.y, z: m.z + dir.z })] = colors[i];
  });
}

export function executeBroadsideMove(
  state: AbaloneState,
  selected: ICubeCoords[],
  dir: ICubeCoords
): void {
  const colors = selected.map(m => state.board[cubeToNotation(m)] ?? state.currentPlayer);
  selected.forEach(m => delete state.board[cubeToNotation(m)]);
  selected.forEach((m, i) => {
    state.board[cubeToNotation({ x: m.x + dir.x, y: m.y + dir.y, z: m.z + dir.z })] = colors[i];
  });
}

export function captureInlineAnimData(
  state: AbaloneState,
  selected: ICubeCoords[],
  dir: ICubeCoords,
  sortMarblesAlongDir: TSortMarblesAlongDir,
  isOnBoard: TIsOnBoard
): IMarbleAnim[] {
  const sorted = sortMarblesAlongDir(selected, dir);
  const front = sorted[sorted.length - 1];
  const anims: IMarbleAnim[] = [];

  // Opponent marbles (pushed / moved)
  let pushPos: ICubeCoords = { x: front.x + dir.x, y: front.y + dir.y, z: front.z + dir.z };
  while (isOnBoard(pushPos)) {
    const key = cubeToNotation(pushPos);
    const color = state.board[key];
    if (!color || color === state.currentPlayer) break;

    const newPos: ICubeCoords = { x: pushPos.x + dir.x, y: pushPos.y + dir.y, z: pushPos.z + dir.z };
    anims.push({
      fromX: pushPos.x,
      fromY: pushPos.y,
      toX: newPos.x,
      toY: newPos.y,
      color,
      isDying: !isOnBoard(newPos)
    });
    pushPos = newPos;
  }

  // Own marbles
  for (const marble of sorted) {
    const color = state.board[cubeToNotation(marble)] ?? state.currentPlayer;
    anims.push({
      fromX: marble.x,
      fromY: marble.y,
      toX: marble.x + dir.x,
      toY: marble.y + dir.y,
      color,
      isDying: false
    });
  }

  return anims;
}

export function captureBroadsideAnimData(
  state: AbaloneState,
  selected: ICubeCoords[],
  dir: ICubeCoords
): IMarbleAnim[] {
  const anims: IMarbleAnim[] = [];

  for (const marble of selected) {
    const color = state.board[cubeToNotation(marble)] ?? state.currentPlayer;
    anims.push({
      fromX: marble.x,
      fromY: marble.y,
      toX: marble.x + dir.x,
      toY: marble.y + dir.y,
      color,
      isDying: false
    });
  }

  return anims;
}