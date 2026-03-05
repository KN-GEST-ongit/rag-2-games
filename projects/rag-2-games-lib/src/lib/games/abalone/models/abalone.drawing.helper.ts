import { AbaloneState, ICubeCoords, IMarbleAnim } from './abalone.class';

function cubeToPixel(hexSize: number, x: number, y: number): { x: number; y: number } {
  const px = hexSize * Math.sqrt(3) * (x + y / 2);
  const py = hexSize * (3 / 2) * y;
  return { x: px, y: py };
}

function drawHexagon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle_rad = (Math.PI / 3) * i - (Math.PI / 6);
    const px = x + size * Math.cos(angle_rad);
    const py = y + size * Math.sin(angle_rad);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
}

export function drawHexGrid(ctx: CanvasRenderingContext2D, hexSize: number): void {
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1;

  for (let x = -4; x <= 4; x++) {
    for (let y = -4; y <= 4; y++) {
      const z = -x - y;
      if (Math.abs(z) <= 4) {
        const pos = cubeToPixel(hexSize, x, y);
        drawHexagon(ctx, pos.x, pos.y, hexSize);
      }
    }
  }
}

export function drawMarbles(
  ctx: CanvasRenderingContext2D,
  state: AbaloneState,
  hexSize: number,
  skipKeys?: Set<string>
): void {
  const selectedSet = new Set(state.selectedMarbles);

  state.board.forEach((color, key) => {
    if (skipKeys?.has(key)) return;

    const [x, y] = key.split(',').map(Number);
    const pos = cubeToPixel(hexSize, x, y);
    const marbleRadius = hexSize * 0.8;
    const isSelected = selectedSet.has(key);

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, marbleRadius, 0, Math.PI * 2);
    ctx.fillStyle = color === 'BLACK' ? '#000000' : '#ffffff';
    ctx.fill();

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, marbleRadius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  });
}

export function drawCursor(ctx: CanvasRenderingContext2D, state: AbaloneState, hexSize: number): void {
  const pos = cubeToPixel(hexSize, state.cursor.x, state.cursor.y);
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, hexSize * 0.85, 0, Math.PI * 2);
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export function drawMoveGhosts(
  ctx: CanvasRenderingContext2D,
  state: AbaloneState,
  hexSize: number,
  directions: Record<number, ICubeCoords>,
  keyToCoords: (key: string) => ICubeCoords,
  isOnBoard: (pos: ICubeCoords) => boolean
): void {
  if (state.phase !== 'MOVE' || state.possibleMoves.length === 0) return;

  const selected = state.selectedMarbles.map(k => keyToCoords(k));
  const selectedKeySet = new Set(state.selectedMarbles);

  for (const dirIdx of state.possibleMoves) {
    const dir = directions[dirIdx];

    for (const marble of selected) {
      const dest: ICubeCoords = { x: marble.x + dir.x, y: marble.y + dir.y, z: marble.z + dir.z };
      const destKey = `${dest.x},${dest.y},${dest.z}`;

      if (selectedKeySet.has(destKey) || !isOnBoard(dest)) continue;

      const pos = cubeToPixel(hexSize, dest.x, dest.y);

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, hexSize * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.7)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}

export function drawDirectionCompass(
  ctx: CanvasRenderingContext2D,
  state: AbaloneState,
  hexSize: number,
  directions: Record<number, ICubeCoords>,
  dirKeyLabels: Record<number, string>,
  keyToCoords: (key: string) => ICubeCoords
): void {
  if (state.phase !== 'MOVE' || state.selectedMarbles.length === 0) return;

  const isRotated = state.currentPlayer === 'WHITE';
  const selected = state.selectedMarbles.map(k => keyToCoords(k));
  const cx = selected.reduce((s, c) => s + c.x, 0) / selected.length;
  const cy = selected.reduce((s, c) => s + c.y, 0) / selected.length;

  for (let dirIdx = 1; dirIdx <= 6; dirIdx++) {
    const visualDir = isRotated ? ((dirIdx - 1 + 3) % 6) + 1 : dirIdx;
    const dir = directions[visualDir];
    const isValid = state.possibleMoves.includes(visualDir);

    const targetPx = cubeToPixel(hexSize, cx + dir.x, cy + dir.y);
    const arrowX = targetPx.x;
    const arrowY = targetPx.y;

    ctx.beginPath();
    ctx.arc(arrowX, arrowY, hexSize * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = isValid ? 'rgba(34, 197, 94, 0.75)' : 'rgba(100, 100, 100, 0.25)';
    ctx.fill();

    ctx.save();
    ctx.translate(arrowX, arrowY);
    if (isRotated) {
      ctx.rotate(Math.PI);
    }
    ctx.fillStyle = isValid ? '#ffffff' : 'rgba(180, 180, 180, 0.4)';
    ctx.font = `bold ${hexSize * 0.5}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dirKeyLabels[dirIdx], 0, 0);
    ctx.restore();
  }
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function drawAnimatingMarbles(
  ctx: CanvasRenderingContext2D,
  animations: IMarbleAnim[],
  progress: number,
  hexSize: number
): Set<string> {
  const skipKeys = new Set<string>();
  const easedProgress = easeOutCubic(progress);

  for (const anim of animations) {
    const x = anim.fromX + (anim.toX - anim.fromX) * easedProgress;
    const y = anim.fromY + (anim.toY - anim.fromY) * easedProgress;

    const pos = cubeToPixel(hexSize, x, y);
    const marbleRadius = hexSize * 0.8;

    ctx.save();
    if (anim.isDying) {
      ctx.globalAlpha = 1 - easedProgress;
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, marbleRadius, 0, Math.PI * 2);
    ctx.fillStyle = anim.color === 'BLACK' ? '#000000' : '#ffffff';
    ctx.fill();
    ctx.restore();

    if (!anim.isDying) {
      const toZ = -anim.toX - anim.toY;
      skipKeys.add(`${anim.toX},${anim.toY},${toZ}`);
    }
  }

  return skipKeys;
}
