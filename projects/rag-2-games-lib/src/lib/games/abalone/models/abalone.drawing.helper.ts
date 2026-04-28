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
      const destKey = cubeToNotation(dest);

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

  // Strefa czarnych kulek (po lewej stronie ekranu dla P1 / Białego gracza "u dołu", ale narysujemy obie z boku).
  // Aby była ładna prezentacja, narysujmy je symetrycznie.
  
  const drawPlayerCemetery = (
    colorId: 'BLACK' | 'WHITE',
    count: number,
    xCenter: number,
    startBottom: boolean,
    label: string
  ): void => {
    ctx.save();
    // Tło dla cmentarza
    const w = hexSize * 2.5;
    const h = (maxDead * spacing) + hexSize * 2;
    const yTop = canvasHeight / 2 - h / 2;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    ctx.roundRect(xCenter - w / 2, yTop, w, h, 10);
    ctx.fill();

    // Etykieta
    ctx.fillStyle = '#94a3b8';
    ctx.font = `bold ${hexSize * 0.5}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, xCenter, startBottom ? yTop + h - hexSize : yTop + hexSize);

    // Kulki
    for (let i = 0; i < maxDead; i++) {
        const slotY = startBottom
          ? yTop + h - hexSize * 2.5 - i * spacing
          : yTop + hexSize * 2.5 + i * spacing;

        ctx.beginPath();
        ctx.arc(xCenter, slotY, marbleRadius, 0, Math.PI * 2);

        if (i < count) {
          // Namaluj martwą kulkę o wybranym kolorze
          ctx.fillStyle = colorId === 'BLACK' ? '#000000' : '#ffffff';
          ctx.fill();
        } else {
          // Puste miejsce (slot) oznaczające ile kulek jeszcze pozostało do wypchnięcia
          ctx.fillStyle = 'rgba(0,0,0,0.05)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(100,100,100,0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
    }
    ctx.restore();
  };

  // Czarne kulki (Cmentarz dla czarnych wypchniętych z planszy) -> Zmarłe Czarne znajdują się w cmentarzu
  const leftX = canvasWidth * 0.1;
  const rightX = canvasWidth * 0.9;

  drawPlayerCemetery('BLACK', state.deadMarbles.BLACK, leftX, false, 'CZARNE');
  drawPlayerCemetery('WHITE', state.deadMarbles.WHITE, rightX, true, 'BIAŁE');
}

