/* eslint-disable max-lines */
/* eslint-disable complexity */
import { TowerDefenseState } from './towerdefense.class';
import { IEnemy, ITowerData } from './towerdefense.interfaces';
import { TowerTypes } from './towerdefense.data';

function drawEnemyHealthBar(context: CanvasRenderingContext2D, enemy: IEnemy, radius: number, tileSize: number): void {
    const healthPercentage = enemy.health / enemy.maxHealth;
    const healthBarWidth = tileSize * 0.8;
    const barX = enemy.x - healthBarWidth / 2;
    const barY = enemy.y - radius - 12;

    context.fillStyle = 'red';
    context.fillRect(barX, barY, healthBarWidth, 5);
    context.fillStyle = 'lime';
    context.fillRect(barX, barY, healthBarWidth * healthPercentage, 5);
}

export function drawMap(context: CanvasRenderingContext2D, state: TowerDefenseState): void {
    const { tileSize, map } = state;
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const tileValue = map[y][x];
            const px = x * tileSize;
            const py = y * tileSize;

            context.strokeStyle = '#333';
            context.lineWidth = 1;
        
            switch (tileValue) {
                case 1: context.fillStyle = '#bbb'; break;
                case 2: context.fillStyle = 'yellow'; break;
                case 3: context.fillStyle = 'red'; break;
                default: context.fillStyle = '#072000ff';
            }
            context.fillRect(px, py, tileSize, tileSize);
            context.strokeRect(px, py, tileSize, tileSize);
        }
    }
}

export function drawCursor(context: CanvasRenderingContext2D, state: TowerDefenseState, getSelectedTowerData: () => ITowerData): void {
    const { tileSize, cursorX, cursorY, gold } = state;
    const x = cursorX * tileSize;
    const y = cursorY * tileSize;

    let canAfford = false;
    const towerOnTile = state.towers.find(t => t.x === cursorX && t.y === cursorY);

    if (towerOnTile) {
        const towerData = TowerTypes[towerOnTile.type.toUpperCase() as keyof typeof TowerTypes];
        if (towerData.upgradeCost) {
            canAfford = gold >= towerData.upgradeCost;
        }
    } else {
        const selectedData = getSelectedTowerData();
        if (selectedData.cost > 0) {
            canAfford = gold >= selectedData.cost;
        }
    }

    context.strokeStyle = canAfford ? 'lime' : 'orange';
    context.lineWidth = 3;
    context.strokeRect(x + 1.5, y + 1.5, tileSize - 3, tileSize - 3);
}

export function drawTowers(context: CanvasRenderingContext2D, state: TowerDefenseState): void {
    const { tileSize, towers, isWaveActive } = state;
    for (const tower of towers) {
        const centerX = (tower.x + 0.5) * tileSize;
        const centerY = (tower.y + 0.5) * tileSize;
      
        const towerData = TowerTypes[tower.type.toUpperCase() as keyof typeof TowerTypes];
        context.fillStyle = towerData.color;

        if (!isWaveActive) {
            context.fillStyle = 'rgba(173, 216, 230, 0.2)';
            context.beginPath();
            context.arc(centerX, centerY, tower.range, 0, Math.PI * 2);
            context.fill();
        }

        context.fillStyle = towerData.color;
        context.fillStyle = '#777';
        context.fillRect(centerX - tileSize / 3, centerY - tileSize / 3, tileSize * 2 / 3, tileSize * 2 / 3);
        context.strokeStyle = '#444';
        context.lineWidth = 2;
        context.strokeRect(centerX - tileSize / 3, centerY - tileSize / 3, tileSize * 2 / 3, tileSize * 2 / 3);

        context.save();
        context.translate(centerX, centerY);
        context.rotate(tower.rotation);

        context.fillStyle = towerData.color;
        context.fillRect(0, -tileSize / 8, tileSize / 2, tileSize / 4);
        context.strokeStyle = '#333';
        context.strokeRect(0, -tileSize / 8, tileSize / 2, tileSize / 4);

        context.restore();
    }
}

export function drawEnemies(context: CanvasRenderingContext2D, state: TowerDefenseState): void {
    const { tileSize, enemies } = state;
    const radius = tileSize / 3;

    for (const enemy of enemies) {
        context.save();
        context.translate(enemy.x, enemy.y);
        context.rotate(enemy.rotation);

        context.fillStyle = enemy.color;
        context.strokeStyle = 'black';
        context.lineWidth = 2;

        const currentRadius = (enemy.type === 'BOSS_TANK') ? radius * 1.5 : radius;

        switch (enemy.type) {
            case 'TANK': {
                const tankWidth = currentRadius * 2;
                const tankLength = currentRadius * 2.2;
                context.fillStyle = '#444';
                context.fillRect(-tankLength / 2, -tankWidth / 2, tankLength, tankWidth * 0.3);
                context.fillRect(-tankLength / 2, tankWidth / 2 - tankWidth * 0.3, tankLength, tankWidth * 0.3);

                context.fillStyle = enemy.color;
                context.fillRect(-tankLength / 2 * 0.8, -tankWidth / 2 * 0.6, tankLength * 0.8, tankWidth * 0.6);

                context.fillStyle = '#888';
                context.beginPath();
                context.arc(0, 0, currentRadius * 0.6, 0, Math.PI * 2);
                context.fill();

                context.fillStyle = '#555';
                context.fillRect(0, -currentRadius * 0.15, currentRadius * 1.5, currentRadius * 0.3);
                break;
            }

            case 'HELICOPTER': {
                const heliLength = currentRadius * 2.2;
                const heliWidth = currentRadius * 1.6;

                context.fillStyle = enemy.color;
                context.fillRect(-heliLength / 2, -heliWidth * 0.1, heliLength * 0.4, heliWidth * 0.2);

                context.beginPath();
                context.ellipse(0, 0, heliLength / 3, heliWidth / 2, 0, 0, Math.PI * 2);
                context.fill();
                context.stroke();

                context.fillStyle = '#555';
                context.beginPath();
                context.arc(-heliLength / 2, 0, currentRadius * 0.25, 0, Math.PI * 2);
                context.fill();
                context.restore();

                drawEnemyHealthBar(context, enemy, currentRadius, tileSize);
                context.fillStyle = 'rgba(180, 180, 180, 0.4)';
                context.beginPath();
                context.arc(enemy.x, enemy.y, currentRadius * 1.8, 0, Math.PI * 2);
                context.fill();
                continue;
            }

            case 'BOSS_TANK': {
                const bossWidth = currentRadius * 2;
                const bossLength = currentRadius * 2.2;

                context.fillStyle = '#222';
                context.fillRect(-bossLength / 2, -bossWidth / 2, bossLength, bossWidth * 0.3);
                context.fillRect(-bossLength / 2, bossWidth / 2 - bossWidth * 0.3, bossLength, bossWidth * 0.3);

                context.fillStyle = enemy.color;
                context.fillRect(-bossLength / 2 * 0.8, -bossWidth / 2 * 0.6, bossLength * 0.8, bossWidth * 0.6);

                context.fillStyle = '#FFA500';
                context.beginPath();
                context.arc(0, 0, currentRadius * 0.7, 0, Math.PI * 2);
                context.fill();

                context.fillStyle = '#FF0000';
                context.fillRect(0, -currentRadius * 0.25, currentRadius * 1.5, currentRadius * 0.15);
                context.fillRect(0, currentRadius * 0.1, currentRadius * 1.5, currentRadius * 0.15);
                break;
            }
            case 'JET': {
                const jetLength = radius * 2.5;
                const jetWidth = radius * 2.8;

                context.beginPath();
                context.moveTo(jetLength / 2, 0);
                context.lineTo(-jetLength / 2, -jetWidth / 2);
                context.lineTo(-jetLength / 2 * 0.8, 0);
                context.lineTo(-jetLength / 2, jetWidth / 2);
                context.closePath();
                context.fill();
                context.stroke();
                break;
            }
            case 'VEHICLE': {
                const vehicleWidth = radius * 1.6;
                const vehicleLength = radius * 2.8;
                const wheelRadius = radius * 0.3;

                context.fillStyle = enemy.color;
                context.fillRect(-vehicleLength / 2, -vehicleWidth / 2, vehicleLength, vehicleWidth);
                context.strokeRect(-vehicleLength / 2, -vehicleWidth / 2, vehicleLength, vehicleWidth);

                context.fillStyle = '#696969';

                context.beginPath();
                context.arc(vehicleLength * 0.35, -vehicleWidth / 2, wheelRadius, 0, Math.PI * 2);
                context.arc(vehicleLength * 0.35, vehicleWidth / 2, wheelRadius, 0, Math.PI * 2);
                context.fill();

                context.beginPath();
                context.arc(-vehicleLength * 0.35, -vehicleWidth / 2, wheelRadius, 0, Math.PI * 2);
                context.arc(-vehicleLength * 0.35, vehicleWidth / 2, wheelRadius, 0, Math.PI * 2);
                context.fill();
          
                context.fillStyle = '#A9A9A9'; 
                context.beginPath();
                context.arc(vehicleLength * 0.1, 0, radius * 0.4, 0, Math.PI * 2);
                context.fill();
          
                context.fillStyle = '#696969';
                context.fillRect(vehicleLength * 0.1 + radius * 0.3, -radius * 0.08, radius * 0.6, radius * 0.16);
                break;
            }
        }

        if (enemy.type !== 'HELICOPTER') {
            context.restore();
        }
        drawEnemyHealthBar(context, enemy, currentRadius, tileSize);
    }
}

export function drawBullets(context: CanvasRenderingContext2D, state: TowerDefenseState): void {
    const { bullets } = state;
    for (const bullet of bullets) {
        if (bullet.splashRadius > 0) {
            context.fillStyle = 'black';
            context.beginPath();
            context.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2);
            context.fill();
        } else {
            context.fillStyle = bullet.color;
            context.beginPath();
            context.arc(bullet.x, bullet.y, 3, 0, Math.PI * 2);
            context.fill();
        }
    }
}

export function drawGameOver(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'red';
    context.font = '100px sans-serif';
    context.textAlign = 'center';
    context.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);

    context.font = '18px sans-serif';
    context.fillText('Click Enter or Space to restart!', canvas.width / 2, canvas.height / 2 + 20);
}

export function drawGameWon(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'green';
    context.font = '100px sans-serif';
    context.textAlign = 'center';
    context.fillText('WIN!', canvas.width / 2, canvas.height / 2 - 30);

    context.font = '18px sans-serif';
    context.fillText('Click Enter or Space to continue!', canvas.width / 2, canvas.height / 2 + 20);
}

export function drawPauseScreen(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    context.fillStyle = 'rgba(0, 0, 0, 0.5)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = 'white';
    context.font = '72px sans-serif';
    context.textAlign = 'center';
    context.fillText('PAUSE', canvas.width / 2, canvas.height / 2);
}