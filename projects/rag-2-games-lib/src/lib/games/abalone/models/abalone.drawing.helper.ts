/* eslint-disable max-lines */
import { AbaloneState, ICubeCoords, IMarbleAnim, notationToCube, cubeToNotation } from './abalone.class';

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

  Object.entries(state.board).forEach(([key, color]) => {
    if (skipKeys?.has(key)) return;

    const coords = notationToCube(key);
    const pos = cubeToPixel(hexSize, coords.x, coords.y);
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
  ctx.arc(pos.x, pos.y, hexSize * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = '#3b82f6';
  ctx.fill();
}

function drawArrowLine(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
  hexSize: number
): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);
  const r = hexSize * 0.8;
  const headLen = hexSize * 0.5;
  const headAngle = Math.PI / 6;
  const sx = from.x + Math.cos(angle) * r;
  const sy = from.y + Math.sin(angle) * r;
  const tipX = to.x - Math.cos(angle) * (r * 0.3);
  const tipY = to.y - Math.sin(angle) * (r * 0.3);
  const shaftEndX = tipX - Math.cos(angle) * headLen;
  const shaftEndY = tipY - Math.sin(angle) * headLen;

  const lx1 = tipX - headLen * Math.cos(angle - headAngle);
  const ly1 = tipY - headLen * Math.sin(angle - headAngle);
  const lx2 = tipX - headLen * Math.cos(angle + headAngle);
  const ly2 = tipY - headLen * Math.sin(angle + headAngle);

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(shaftEndX, shaftEndY);
  ctx.stroke();

  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(lx1, ly1);
  ctx.lineTo(lx2, ly2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(shaftEndX, shaftEndY);
  ctx.stroke();

  ctx.fillStyle = '#4ade80';
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(lx1, ly1);
  ctx.lineTo(lx2, ly2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

function drawMarbleGhost(
  ctx: CanvasRenderingContext2D,
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  hexSize: number,
  color: string,
  isMovePhaseDest: boolean
): void {
  ctx.save();
  ctx.globalAlpha = isMovePhaseDest ? 0.55 : 0.35;
  ctx.beginPath();
  ctx.arc(toPos.x, toPos.y, isMovePhaseDest ? hexSize * 0.8 : hexSize * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = isMovePhaseDest ? color : 'rgba(34, 197, 94, 1.0)';
  ctx.fill();
  if (isMovePhaseDest) {
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();

  if (isMovePhaseDest) {
    drawArrowLine(ctx, fromPos, toPos, hexSize);
  }
}


function sortAlongDir(marbles: ICubeCoords[], dir: ICubeCoords): ICubeCoords[] {
  return [...marbles].sort((a, b) =>
    (a.x * dir.x + a.y * dir.y + a.z * dir.z) - (b.x * dir.x + b.y * dir.y + b.z * dir.z)
  );
}

function isInlineMove(selected: ICubeCoords[], dir: ICubeCoords): boolean {
  if (selected.length <= 1) return true;
  const ax = selected[1].x - selected[0].x;
  const ay = selected[1].y - selected[0].y;
  const az = selected[1].z - selected[0].z;
  return (dir.x === ax && dir.y === ay && dir.z === az) ||
         (dir.x === -ax && dir.y === -ay && dir.z === -az);
}

function drawEliminationMark(ctx: CanvasRenderingContext2D, pos: { x: number; y: number }, hexSize: number): void {
  const r = hexSize * 0.45;
  ctx.save();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = hexSize * 0.22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pos.x - r, pos.y - r);
  ctx.lineTo(pos.x + r, pos.y + r);
  ctx.moveTo(pos.x + r, pos.y - r);
  ctx.lineTo(pos.x - r, pos.y + r);
  ctx.stroke();
  ctx.restore();
}

function drawInlineGhosts(
  ctx: CanvasRenderingContext2D,
  state: AbaloneState,
  dir: ICubeCoords,
  hexSize: number,
  isOnBoard: (pos: ICubeCoords) => boolean,
  ownColor: string,
  oppColor: string
): void {
  const sorted = sortAlongDir(state.selectedMarbles.map(k => notationToCube(k)), dir);
  const front = sorted[sorted.length - 1];

  for (const marble of sorted) {
    const dest: ICubeCoords = { x: marble.x + dir.x, y: marble.y + dir.y, z: marble.z + dir.z };
    if (!isOnBoard(dest)) continue;
    drawMarbleGhost(ctx, cubeToPixel(hexSize, marble.x, marble.y), cubeToPixel(hexSize, dest.x, dest.y), hexSize, ownColor, true);
  }

  let pushPos: ICubeCoords = { x: front.x + dir.x, y: front.y + dir.y, z: front.z + dir.z };
  while (isOnBoard(pushPos)) {
    const color = state.board[cubeToNotation(pushPos)];
    if (!color || color === state.currentPlayer) break;
    const newPos: ICubeCoords = { x: pushPos.x + dir.x, y: pushPos.y + dir.y, z: pushPos.z + dir.z };
    drawMarbleGhost(ctx, cubeToPixel(hexSize, pushPos.x, pushPos.y), cubeToPixel(hexSize, newPos.x, newPos.y), hexSize, oppColor, true);
    if (!isOnBoard(newPos)) drawEliminationMark(ctx, cubeToPixel(hexSize, newPos.x, newPos.y), hexSize);
    pushPos = newPos;
  }
}

function drawBroadsideGhosts(
  ctx: CanvasRenderingContext2D,
  state: AbaloneState,
  selected: ICubeCoords[],
  dir: ICubeCoords,
  hexSize: number,
  isOnBoard: (pos: ICubeCoords) => boolean,
  ownColor: string
): void {
  const selectedKeySet = new Set(state.selectedMarbles);
  for (const marble of selected) {
    const dest: ICubeCoords = { x: marble.x + dir.x, y: marble.y + dir.y, z: marble.z + dir.z };
    const destKey = cubeToNotation(dest);
    if (!isOnBoard(dest) || selectedKeySet.has(destKey) || state.board[destKey]) continue;
    drawMarbleGhost(ctx, cubeToPixel(hexSize, marble.x, marble.y), cubeToPixel(hexSize, dest.x, dest.y), hexSize, ownColor, true);
  }
}

export function drawMoveGhosts(
  ctx: CanvasRenderingContext2D,
  state: AbaloneState,
  hexSize: number,
  directions: Record<number, ICubeCoords>,
  keyToCoords: (key: string) => ICubeCoords,
  isOnBoard: (pos: ICubeCoords) => boolean
): void {
  if (state.phase !== 'MOVE' || !state.selectedDirection) return;

  const dir = directions[state.selectedDirection];
  const selected = state.selectedMarbles.map(k => keyToCoords(k));
  const ownColor = state.currentPlayer === 'BLACK' ? '#000000' : '#ffffff';
  const oppColor = state.currentPlayer === 'BLACK' ? '#ffffff' : '#000000';

  if (isInlineMove(selected, dir)) {
    drawInlineGhosts(ctx, state, dir, hexSize, isOnBoard, ownColor, oppColor);
  } else {
    drawBroadsideGhosts(ctx, state, selected, dir, hexSize, isOnBoard, ownColor);
  }
}

function getArrowColors(isSelected: boolean, isValid: boolean): { bg: string; text: string } {
  if (isSelected) return { bg: 'rgba(34, 197, 94, 1.0)', text: '#000000' };
  if (isValid) return { bg: 'rgba(34, 197, 94, 0.75)', text: '#ffffff' };
  return { bg: 'rgba(100, 100, 100, 0.25)', text: 'rgba(180, 180, 180, 0.4)' };
}

export function drawDirectionCompass(
  ctx: CanvasRenderingContext2D,
  state: AbaloneState,
  hexSize: number,
  directions: Record<number, ICubeCoords>,
  dirKeyLabels: Record<number, string>,
  keyToCoords: (key: string) => ICubeCoords,
  isRotated: boolean
): void {
  if (!['SELECT', 'MOVE'].includes(state.phase) || state.selectedMarbles.length === 0) return;
  const selected = state.selectedMarbles.map(k => keyToCoords(k));
  const cx = selected.reduce((s, c) => s + c.x, 0) / selected.length;
  const cy = selected.reduce((s, c) => s + c.y, 0) / selected.length;

  for (let dirIdx = 1; dirIdx <= 6; dirIdx++) {
    const dir = directions[dirIdx];
    const isValid = state.possibleMoves.includes(dirIdx);
    const isSelected = state.selectedDirection === dirIdx;
    const colors = getArrowColors(isSelected, isValid);

    const targetPx = cubeToPixel(hexSize, cx + dir.x, cy + dir.y);

    ctx.beginPath();
    ctx.arc(targetPx.x, targetPx.y, hexSize * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = colors.bg;
    ctx.fill();

    ctx.save();
    ctx.translate(targetPx.x, targetPx.y);
    if (isRotated) ctx.rotate(Math.PI);
    ctx.fillStyle = colors.text;
    ctx.font = `bold ${hexSize * 0.5}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(dirKeyLabels[dirIdx] ?? '', 0, 0);
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
      skipKeys.add(cubeToNotation({ x: anim.toX, y: anim.toY, z: -anim.toX - anim.toY }));
    }
  }

  return skipKeys;
}

function drawRowLabels(ctx: CanvasRenderingContext2D, hexSize: number, isRotated: boolean): void {
  for (let y = 4; y >= -4; y--) {
    const pos = cubeToPixel(hexSize, Math.max(-4, -4 - y), y);
    const lx = isRotated ? -(pos.x - hexSize * 1.3) : pos.x - hexSize * 1.3;
    const ly = isRotated ? -pos.y : pos.y;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.save();
    if (isRotated) ctx.rotate(Math.PI);
    ctx.fillText(String.fromCharCode(65 + 4 - y), lx, ly);
    ctx.restore();
  }
}

function drawColumnLabels(ctx: CanvasRenderingContext2D, hexSize: number, isRotated: boolean): void {
  const off = hexSize * 1.3;
  const ox = 0.5 * off;
  const oy = 0.866 * off;
  for (let x = -4; x <= 4; x++) {
    const pos = cubeToPixel(hexSize, x, x <= 0 ? 4 : 4 - x);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.save();
    if (isRotated) ctx.rotate(Math.PI);
    ctx.fillText(`${x + 5}`, isRotated ? -(pos.x + ox) : pos.x + ox, isRotated ? -(pos.y + oy) : pos.y + oy);
    ctx.restore();
  }
}

export function drawBoardLabels(ctx: CanvasRenderingContext2D, hexSize: number, isRotated: boolean): void {
  ctx.fillStyle = '#94a3b8';
  ctx.font = `bold ${hexSize * 0.45}px monospace`;
  drawRowLabels(ctx, hexSize, isRotated);
  drawColumnLabels(ctx, hexSize, isRotated);
}

export function drawCemetery(
  ctx: CanvasRenderingContext2D,
  state: AbaloneState,
  canvasWidth: number,
  canvasHeight: number,
  hexSize: number
): void {
  const marbleRadius = hexSize * 0.8;
  const maxDead = 6;
  const spacing = hexSize * 2.2;

  // Dead marbles area 
  
  const drawPlayerCemetery = (
    colorId: 'BLACK' | 'WHITE',
    count: number,
    xCenter: number,
    startBottom: boolean,
    label: string
  ): void => {
    ctx.save();
    // Cemetery background
    const w = hexSize * 2.5;
    const h = (maxDead * spacing) + hexSize * 2;
    const yTop = canvasHeight / 2 - h / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.roundRect(xCenter - w / 2, yTop, w, h, 10);
    ctx.fill();

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = `bold ${hexSize * 0.5}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, xCenter, startBottom ? yTop + h - hexSize : yTop + hexSize);

    // Marbles
    for (let i = 0; i < maxDead; i++) {
        const slotY = startBottom
          ? yTop + h - hexSize * 2.5 - i * spacing
          : yTop + hexSize * 2.5 + i * spacing;

        ctx.beginPath();
        ctx.arc(xCenter, slotY, marbleRadius, 0, Math.PI * 2);

        if (i < count) {
          ctx.fillStyle = colorId === 'BLACK' ? '#000000' : '#ffffff';
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(0,0,0,0.05)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(100,100,100,0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
    }
    ctx.restore();
  };

  // Dead black marbles
  const leftX = canvasWidth * 0.1;
  const rightX = canvasWidth * 0.9;

  drawPlayerCemetery('BLACK', state.deadMarbles.BLACK, leftX, false, 'BLACK');
  drawPlayerCemetery('WHITE', state.deadMarbles.WHITE, rightX, true, 'WHITE');
}

export function drawGameOver(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, state: AbaloneState): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const panelWidth = 600;
  const panelHeight = 300;
  const panelX = centerX - panelWidth / 2;
  const panelY = centerY - panelHeight / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;

  ctx.fillStyle = '#1e293b'; // Ciemnoniebieski z palety tailwind slate-800
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 20);
  ctx.fill();

  ctx.strokeStyle = state.winner === 'BLACK' ? '#333' : '#f8fafc';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = state.winner === 'BLACK' ? '#0f172a' : '#f8fafc'; 
  const strokeColor = state.winner === 'BLACK' ? '#f8fafc' : '#0f172a';
  
  ctx.lineWidth = 2;
  ctx.strokeStyle = strokeColor;
  ctx.font = 'bold 50px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const winnerText = state.winner === 'BLACK' ? 'BLACK WINS!' : 'WHITE WINS!';
  
  ctx.fillStyle = '#fbbf24'; // amber-400
  ctx.font = 'bold 36px monospace';
  ctx.fillText('GAME OVER', centerX, centerY - 80);

  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
  ctx.shadowBlur = 10;
  ctx.font = 'bold 48px sans-serif';
  ctx.fillStyle = state.winner === 'BLACK' ? '#334155' : '#f8fafc';
  ctx.fillText(winnerText, centerX, centerY);
  ctx.strokeText(winnerText, centerX, centerY);
  ctx.restore();

}
