/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-lines */
/* eslint-disable complexity */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Soccer, SoccerState } from './models/soccer.class';
import { IMovableEntity } from './models/soccer.object';
import { IEntity } from './models/soccer.object';

@Component({
  selector: 'app-soccer',
  standalone: true,
  imports: [CanvasComponent],
  template: `
    <div>{{ game.state.scoreRed }}:{{ game.state.scoreBlue }}</div>

    <app-canvas [displayMode]="'horizontal'" #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b>
  `,
})
export class SoccerGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  public override game!: Soccer;
  private p1Kicking: boolean = false;
  private p2Kicking: boolean = false;

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Soccer;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this._canvas.width = this.game.state.width;
    this._canvas.height = this.game.state.height;
    this.render();
  }

  public override restart(): void {
    const savedScoreRed = this.game.state.scoreRed;
    const savedScoreBlue = this.game.state.scoreBlue;
    const savedKickoffTeam = this.game.state.kickoffTeam;

    this.game.state = new SoccerState();

    this.game.state.scoreRed = savedScoreRed;
    this.game.state.scoreBlue = savedScoreBlue;
    this.game.state.kickoffTeam = savedKickoffTeam;
  }

  protected override update(): void {
    super.update();

    if (!this.isPaused) {
      this.handleInput();
      this.physicsStep();
    }

    this.render();
  }

  private render(): void {
    const context = this._canvas.getContext('2d');
    if (context) {
      const gameW = this.game.state.width;
      const gameH = this.game.state.height;

      context.clearRect(0, 0, gameW, gameH);

      this.drawPitchLines(context, gameW, gameH);

      this.drawGoals(context, gameW, gameH);

      this.drawEntity(context, this.game.state.player1);
      this.drawEntity(context, this.game.state.player2);

      this.drawBall(context, this.game.state.ball);

      context.restore();
    }
  }

  private handleInput(): void {
    //gracz1
    const p1 = this.game.state.player1;
    const mx1 = (this.game.players[0].inputData['moveX'] as number) || 0;
    const my1 = (this.game.players[0].inputData['moveY'] as number) || 0;

    this.p1Kicking = (this.game.players[0].inputData['kick'] as number) === 1;

    this.applyMove(p1, mx1, my1);

    //gracz2
    if (this.game.players.length > 1) {
      const p2 = this.game.state.player2;
      const mx2 = (this.game.players[1].inputData['moveX'] as number) || 0;
      const my2 = (this.game.players[1].inputData['moveY'] as number) || 0;

      this.p2Kicking = (this.game.players[1].inputData['kick'] as number) === 1;

      this.applyMove(p2, mx2, my2);
    }
  }

  private applyMove(
    player: IMovableEntity,
    moveX: number,
    moveY: number
  ): void {
    player.vx = moveX * player.speed;
    player.vy = moveY * player.speed;

    if (moveX !== 0 && moveY !== 0) {
      const normalization = Math.SQRT1_2;
      player.vx *= normalization;
      player.vy *= normalization;
    }
  }

  private physicsStep(): void {
    const state = this.game.state;
    const posts = this.getPosts();

    const steps = 10;
    const dt = 1 / steps;

    for (let i = 0; i < steps; i++) {
      this.moveEntity(state.player1, 'red', dt);
      this.moveEntity(state.player2, 'blue', dt);

      state.ball.x += state.ball.vx * dt;
      state.ball.y += state.ball.vy * dt;

      this.checkPlayersCollision(state.player1, state.player2);

      posts.forEach(post => {
        this.resolveAABBCollision(state.player1, post);
        this.resolveAABBCollision(state.player2, post);
        this.resolveRectCollision(state.ball, post);
      });

      if (Math.random() > 0.5) {
        this.checkPlayerBallCollision(
          state.player1,
          state.ball,
          'red',
          this.p1Kicking
        );
        this.checkPlayerBallCollision(
          state.player2,
          state.ball,
          'blue',
          this.p2Kicking
        );
      } else {
        this.checkPlayerBallCollision(
          state.player2,
          state.ball,
          'blue',
          this.p2Kicking
        );
        this.checkPlayerBallCollision(
          state.player1,
          state.ball,
          'red',
          this.p1Kicking
        );
      }

      this.checkBallWallCollision();
    }

    state.ball.vx *= state.friction;
    state.ball.vy *= state.friction;
  }

  private moveEntity(
    entity: IMovableEntity,
    team: 'red' | 'blue',
    dt: number
  ): void {
    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;

    const marginX = 40;
    const marginY = 40;
    const h = this.game.state.height;
    const w = this.game.state.width;
    const goalTop = h / 2 - 80;
    const goalBottom = h / 2 + 80;

    let minX = marginX;
    let maxX = w - marginX;

    if (
      entity.y > goalTop + entity.radius &&
      entity.y < goalBottom - entity.radius
    ) {
      minX = 0;
      maxX = w;
    }

    if (entity.x < minX + entity.radius) entity.x = minX + entity.radius;
    if (entity.x > maxX - entity.radius) entity.x = maxX - entity.radius;

    if (entity.y < marginY + entity.radius) entity.y = marginY + entity.radius;
    if (entity.y > h - marginY - entity.radius)
      entity.y = h - marginY - entity.radius;

    const cornerR = 120;
    let cx = -1;
    let cy = -1;

    if (entity.x < marginX + cornerR) cx = marginX + cornerR;
    else if (entity.x > w - marginX - cornerR) cx = w - marginX - cornerR;

    if (entity.y < marginY + cornerR) cy = marginY + cornerR;
    else if (entity.y > h - marginY - cornerR) cy = h - marginY - cornerR;

    if (cx !== -1 && cy !== -1) {
      const dx = entity.x - cx;
      const dy = entity.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = cornerR - entity.radius;

      if (dist > maxDist && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        entity.x = cx + nx * maxDist;
        entity.y = cy + ny * maxDist;
      }
    }

    if (
      this.game.state.kickoffTeam !== null &&
      this.game.state.kickoffTeam !== team
    ) {
      const midX = w / 2;
      const midY = h / 2;

      if (team === 'red' && entity.x > midX - entity.radius) {
        entity.x = midX - entity.radius;
        entity.vx = 0;
      }
      if (team === 'blue' && entity.x < midX + entity.radius) {
        entity.x = midX + entity.radius;
        entity.vx = 0;
      }

      const dx = entity.x - midX;
      const dy = entity.y - midY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const centerRadius = 50;
      const minAllowedDist = centerRadius + entity.radius;

      if (dist < minAllowedDist && dist > 0) {
        const overlap = minAllowedDist - dist;
        entity.x += (dx / dist) * overlap;
        entity.y += (dy / dist) * overlap;
      }
    }
  }

  private getPosts(): { x: number; y: number; w: number; h: number }[] {
    const w = this.game.state.width;
    const h = this.game.state.height;

    const goalHeight = 145;
    const goalDepth = 40;

    const postWidth = 40;
    const postHeight = 5;

    const topY = (h - goalHeight) / 2;
    const bottomY = topY + goalHeight;

    return [
      {
        x: goalDepth - postWidth,
        y: topY - postHeight - 5,
        w: postWidth,
        h: postHeight,
      },

      { x: goalDepth - postWidth, y: bottomY + 5, w: postWidth, h: postHeight },

      {
        x: w - goalDepth,
        y: topY - postHeight - 5,
        w: postWidth,
        h: postHeight,
      },

      { x: w - goalDepth, y: bottomY + 5, w: postWidth, h: postHeight },
    ];
  }

  private handleGoal(scorer: 'red' | 'blue'): void {
    if (scorer === 'red') {
      this.game.state.scoreRed++;
      this.game.state.kickoffTeam = 'blue';
    } else {
      this.game.state.scoreBlue++;
      this.game.state.kickoffTeam = 'red';
    }
    this.restart();
  }

  private resolveRectCollision(
    ball: IMovableEntity,
    rect: { x: number; y: number; w: number; h: number }
  ): void {
    const closestX = Math.max(rect.x, Math.min(ball.x, rect.x + rect.w));
    const closestY = Math.max(rect.y, Math.min(ball.y, rect.y + rect.h));

    const dx = ball.x - closestX;
    const dy = ball.y - closestY;

    const distSq = dx * dx + dy * dy;

    if (distSq >= ball.radius * ball.radius && distSq !== 0) {
      return;
    }

    if (distSq === 0) {
      const dLeft = ball.x - rect.x;
      const dRight = rect.x + rect.w - ball.x;
      const dTop = ball.y - rect.y;
      const dBottom = rect.y + rect.h - ball.y;

      const min = Math.min(dLeft, dRight, dTop, dBottom);
      const bounciness = this.game.state.wallBounciness;

      if (min === dLeft) {
        ball.x = rect.x - ball.radius;
        ball.vx = -Math.abs(ball.vx) * bounciness;
      } else if (min === dRight) {
        ball.x = rect.x + rect.w + ball.radius;
        ball.vx = Math.abs(ball.vx) * bounciness;
      } else if (min === dTop) {
        ball.y = rect.y - ball.radius;
        ball.vy = -Math.abs(ball.vy) * bounciness;
      } else {
        ball.y = rect.y + rect.h + ball.radius;
        ball.vy = Math.abs(ball.vy) * bounciness;
      }
      return;
    }

    const dist = Math.sqrt(distSq);
    const overlap = ball.radius - dist;

    const nx = dx / dist;
    const ny = dy / dist;

    ball.x += nx * overlap;
    ball.y += ny * overlap;

    const dotProduct = ball.vx * nx + ball.vy * ny;
    if (dotProduct < 0) {
      ball.vx =
        (ball.vx - 2 * dotProduct * nx) * this.game.state.wallBounciness;
      ball.vy =
        (ball.vy - 2 * dotProduct * ny) * this.game.state.wallBounciness;
    }
  }

  private resolveAABBCollision(
    player: IMovableEntity,
    rect: { x: number; y: number; w: number; h: number }
  ): void {
    const r = player.radius;
    const pLeft = player.x - r;
    const pRight = player.x + r;
    const pTop = player.y - r;
    const pBottom = player.y + r;

    const rLeft = rect.x;
    const rRight = rect.x + rect.w;
    const rTop = rect.y;
    const rBottom = rect.y + rect.h;

    if (pLeft < rRight && pRight > rLeft && pTop < rBottom && pBottom > rTop) {
      const overlapLeft = pRight - rLeft;
      const overlapRight = rRight - pLeft;
      const overlapTop = pBottom - rTop;
      const overlapBottom = rBottom - pTop;

      const minOverlap = Math.min(
        overlapLeft,
        overlapRight,
        overlapTop,
        overlapBottom
      );

      if (minOverlap === overlapLeft) player.x -= overlapLeft;
      else if (minOverlap === overlapRight) player.x += overlapRight;
      else if (minOverlap === overlapTop) player.y -= overlapTop;
      else if (minOverlap === overlapBottom) player.y += overlapBottom;
    }
  }

  private checkBallWallCollision(): void {
    const ball = this.game.state.ball;
    const w = this.game.state.width;
    const h = this.game.state.height;
    const r = ball.radius;
    const wallBounce = -this.game.state.wallBounciness;

    const marginX = 40;
    const marginY = 40;
    const cornerR = 120;

    let cx = -1;
    let cy = -1;

    if (ball.x < marginX + cornerR) cx = marginX + cornerR;
    else if (ball.x > w - marginX - cornerR) cx = w - marginX - cornerR;

    if (ball.y < marginY + cornerR) cy = marginY + cornerR;
    else if (ball.y > h - marginY - cornerR) cy = h - marginY - cornerR;

    if (cx !== -1 && cy !== -1) {
      const dx = ball.x - cx;
      const dy = ball.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = cornerR - r;

      if (dist > maxDist && dist > 0) {
        const nx = dx / dist;
        const ny = dy / dist;
        ball.x = cx + nx * maxDist;
        ball.y = cy + ny * maxDist;

        const dot = ball.vx * nx + ball.vy * ny;
        if (dot > 0) {
          ball.vx = (ball.vx - 2 * dot * nx) * Math.abs(wallBounce);
          ball.vy = (ball.vy - 2 * dot * ny) * Math.abs(wallBounce);
        }
      }
    }

    if (ball.y - r < marginY) {
      ball.y = marginY + r;
      ball.vy *= wallBounce;
    }

    if (ball.y + r > h - marginY) {
      ball.y = h - marginY - r;
      ball.vy *= wallBounce;
    }

    const goalHeight = 160;
    const goalTop = (h - goalHeight) / 2;
    const goalBottom = goalTop + goalHeight;
    const postSize = 10;
    const netTop = goalTop + postSize;
    const netBottom = goalBottom - postSize;

    // lewa strona
    if (ball.x - r < marginX) {
      if (ball.y > netTop && ball.y < netBottom) {
        if (ball.y - r < netTop) {
          ball.y = netTop + r;
          ball.vy *= wallBounce;
        } else if (ball.y + r > netBottom) {
          ball.y = netBottom - r;
          ball.vy *= wallBounce;
        }

        if (ball.x + r < marginX) {
          this.handleGoal('blue');
        }
      } else {
        ball.x = marginX + r;
        ball.vx *= wallBounce;
      }
    }

    // prawa strona
    if (ball.x + r > w - marginX) {
      if (ball.y > netTop && ball.y < netBottom) {
        if (ball.y - r < netTop) {
          ball.y = netTop + r;
          ball.vy *= wallBounce;
        } else if (ball.y + r > netBottom) {
          ball.y = netBottom - r;
          ball.vy *= wallBounce;
        }

        if (ball.x - r > w - marginX) {
          this.handleGoal('red');
        }
      } else {
        ball.x = w - marginX - r;
        ball.vx *= wallBounce;
      }
    }
  }

  private checkPlayersCollision(p1: IMovableEntity, p2: IMovableEntity): void {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDist = p1.radius + p2.radius;

    if (distance < minDist && distance > 0) {
      const penetration = minDist - distance;
      const nx = dx / distance;
      const ny = dy / distance;

      const push = penetration * 0.5;

      p1.x -= nx * push;
      p1.y -= ny * push;

      p2.x += nx * push;
      p2.y += ny * push;
    }
  }

  private checkPlayerBallCollision(
    player: IMovableEntity,
    ball: IMovableEntity,
    team: 'red' | 'blue',
    isKicking: boolean = false
  ): void {
    if (
      this.game.state.kickoffTeam !== null &&
      this.game.state.kickoffTeam !== team
    ) {
      return;
    }

    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDist = ball.radius + player.radius;

    if (distance <= minDist) {
      if (this.game.state.kickoffTeam === team) {
        this.game.state.kickoffTeam = null;
      }

      let nx = 0;
      let ny = 0;
      let penetration = 0;

      if (distance === 0) {
        nx = 1;
        ny = 0;
        penetration = minDist;
      } else {
        nx = dx / distance;
        ny = dy / distance;
        penetration = minDist - distance;
      }

      const ballPush = 0.85;
      const playerPush = 0.15;

      ball.x += nx * (penetration * ballPush);
      ball.y += ny * (penetration * ballPush);

      player.x -= nx * (penetration * playerPush);
      player.y -= ny * (penetration * playerPush);

      const bounce = 0.0;

      const rvx = ball.vx - player.vx;
      const rvy = ball.vy - player.vy;
      const velAlongNormal = rvx * nx + rvy * ny;

      if (velAlongNormal < 0) {
        const impulse = -(1 + bounce) * velAlongNormal * 0.1;

        ball.vx += impulse * ballPush * nx;
        ball.vy += impulse * ballPush * ny;

        player.vx -= impulse * playerPush * nx;
        player.vy -= impulse * playerPush * ny;
      }

      if (isKicking) {
        const kickBoost = this.game.state.kickPower * 2.5;
        const currentSpeedInKickDirection = ball.vx * nx + ball.vy * ny;

        if (currentSpeedInKickDirection < kickBoost) {
          const force = kickBoost - Math.max(0, currentSpeedInKickDirection);
          ball.vx += nx * force;
          ball.vy += ny * force;
        }
      }
    }
  }

  private drawGoals(
    context: CanvasRenderingContext2D,
    w: number,
    h: number
  ): void {
    const goalHeight = 160;
    const margin = 40;
    const topY = (h - goalHeight) / 2;
    const bottomY = topY + goalHeight;

    context.lineWidth = 4;

    //lewa
    context.strokeStyle = this.game.state.teamRedColor;
    context.beginPath();
    context.moveTo(margin, topY);
    context.lineTo(0, topY);
    context.lineTo(0, bottomY);
    context.lineTo(margin, bottomY);
    context.stroke();

    //prawa
    context.strokeStyle = this.game.state.teamBlueColor;
    context.beginPath();
    context.moveTo(w - margin, topY);
    context.lineTo(w, topY);
    context.lineTo(w, bottomY);
    context.lineTo(w - margin, bottomY);
    context.stroke();

    const gridSize = 8;
    context.lineWidth = 1;
    context.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    context.beginPath();

    for (let x = 0; x <= margin; x += gridSize) {
      context.moveTo(x, topY);
      context.lineTo(x, bottomY);
    }
    for (let y = topY; y <= bottomY; y += gridSize) {
      context.moveTo(0, y);
      context.lineTo(margin, y);
    }

    for (let x = w - margin; x <= w; x += gridSize) {
      context.moveTo(x, topY);
      context.lineTo(x, bottomY);
    }
    for (let y = topY; y <= bottomY; y += gridSize) {
      context.moveTo(w - margin, y);
      context.lineTo(w, y);
    }
    context.stroke();
  }

  private drawEntity(
    context: CanvasRenderingContext2D,
    entity: IMovableEntity
  ): void {
    context.beginPath();
    context.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
    context.fillStyle = entity.color;
    context.fill();
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.stroke();
  }

  private drawPitchLines(
    context: CanvasRenderingContext2D,
    w: number,
    h: number
  ): void {
    const marginX = 40;
    const marginY = 40;
    const cornerR = 120;

    context.strokeStyle = '#474545';
    context.lineWidth = 3;

    context.beginPath();
    context.moveTo(marginX + cornerR, marginY);
    context.lineTo(w - marginX - cornerR, marginY);
    context.arc(
      w - marginX - cornerR,
      marginY + cornerR,
      cornerR,
      -Math.PI / 2,
      0
    );
    context.lineTo(w - marginX, h - marginY - cornerR);
    context.arc(
      w - marginX - cornerR,
      h - marginY - cornerR,
      cornerR,
      0,
      Math.PI / 2
    );
    context.lineTo(marginX + cornerR, h - marginY);
    context.arc(
      marginX + cornerR,
      h - marginY - cornerR,
      cornerR,
      Math.PI / 2,
      Math.PI
    );
    context.lineTo(marginX, marginY + cornerR);
    context.arc(
      marginX + cornerR,
      marginY + cornerR,
      cornerR,
      Math.PI,
      -Math.PI / 2
    );
    context.stroke();

    context.beginPath();
    context.moveTo(w / 2, marginY);
    context.lineTo(w / 2, h - marginY);
    context.stroke();

    const centerRadius = 50;
    context.beginPath();
    context.arc(w / 2, h / 2, centerRadius, 0, Math.PI * 2);
    context.stroke();

    const dotRadius = 6;
    context.beginPath();
    context.arc(w / 2, h / 2, dotRadius, 0, Math.PI * 2);
    context.fillStyle = '#474545';
    context.fill();

    const penaltyWidth = 125;
    const penaltyHeight = 250;
    const penaltyY = (h - penaltyHeight) / 2;

    context.strokeRect(marginX, penaltyY, penaltyWidth, penaltyHeight);
    context.strokeRect(
      w - marginX - penaltyWidth,
      penaltyY,
      penaltyWidth,
      penaltyHeight
    );
  }

  private drawBall(
    context: CanvasRenderingContext2D,
    ball: IMovableEntity
  ): void {
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fillStyle = ball.color;
    context.fill();
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.stroke();
  }
}
