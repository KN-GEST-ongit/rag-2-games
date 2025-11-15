/* eslint-disable complexity */
export function findShortestPath(map: number[][]): { x: number; y: number }[] {
    const mapHeight = map.length;
    const mapWidth = map[0].length;
    let startPos: { x: number; y: number } | null = null;
    let endPos: { x: number; y: number } | null = null;

    for (let y = 0; y < mapHeight; y++) {
        for (let x = 0; x < mapWidth; x++) {
            if (map[y][x] === 2) startPos = { x, y };
            else if (map[y][x] === 3) endPos = { x, y };
        }
    }

    if (!startPos || !endPos) {
        console.error("Error: Start (2) or End (3) not found on map!");
        return [];
    }

    const queue: { x: number; y: number }[] = [startPos];
    const cameFrom = new Map<string, { x: number; y: number } | null>();
    cameFrom.set(`${startPos.y},${startPos.x}`, null);

    let finalEndPos: { x: number; y: number } | null = null;

    while (queue.length > 0) {
        const current = queue.shift();
        
        if (!current) {
            console.error("BFS Error: Queue shift returned undefined unexpectedly.");
            break;
        }

        if (current.x === endPos.x && current.y === endPos.y) {
            finalEndPos = current;
            break;
        }

        const neighbors = [
            { x: current.x, y: current.y - 1 }, { x: current.x, y: current.y + 1 },
            { x: current.x - 1, y: current.y }, { x: current.x + 1, y: current.y },
        ];

        for (const next of neighbors) {
            const nextKey = `${next.y},${next.x}`;
            if (next.x < 0 || next.x >= mapWidth || next.y < 0 || next.y >= mapHeight) {
                continue;
            }
      
            const tileValue = map[next.y][next.x];
            if ((tileValue === 1 || tileValue === 3) && !cameFrom.has(nextKey)) { 
                queue.push(next);
                cameFrom.set(nextKey, current);
            }
        }
    }

    const path: { x: number; y: number }[] = [];
    if (finalEndPos) {
        let current: { x: number; y: number } | null = finalEndPos;
        let currentKey: string | null = null;
        while (current !== null) {
            path.push(current);
            currentKey = `${current.y},${current.x}`;
            current = cameFrom.get(currentKey) ?? null;
        }
        path.reverse();
    } else {
        console.error("Error: BFS could not find a path from Start to End!");
    }

  return path;
}