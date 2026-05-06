/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/no-inferrable-types */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable max-lines */
/* eslint-disable complexity */
import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { CanvasComponent } from '../../components/canvas/canvas.component';
import { BaseGameWindowComponent } from '../base-game.component';
import { Soccer, SoccerState } from './models/soccer.class';

type TPhysicsEntity = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

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

  private readonly GAME_WIDTH = 1000;
  private readonly GAME_HEIGHT = 550;

  private readonly PLAYER_RADIUS = 15;
  private readonly BALL_RADIUS = 10;
  private readonly PLAYER_SPEED = 2.35;

  private readonly TEAM_RED_COLOR = '#FF0000';
  private readonly TEAM_BLUE_COLOR = '#0000FF';
  private readonly BALL_COLOR = '#1b1a1a';

  public override ngOnInit(): void {
    super.ngOnInit();
    this.game = this.game as Soccer;
  }

  public override ngAfterViewInit(): void {
    super.ngAfterViewInit();
    this._canvas.width = this.GAME_WIDTH;
    this._canvas.height = this.GAME_HEIGHT;
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

  private drawCircle(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string
  ): void {
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
    context.strokeStyle = '#000000';
    context.lineWidth = 2;
    context.stroke();
  }

  private render(): void {
    const context = this._canvas.getContext('2d');
    if (context) {
      const gameW = this.GAME_WIDTH;
      const gameH = this.GAME_HEIGHT;

      context.clearRect(0, 0, gameW, gameH);

      this.drawPitchLines(context, gameW, gameH);

      this.drawGoals(context, gameW, gameH);

      this.drawCircle(
        context,
        this.game.state.player1X,
        this.game.state.player1Y,
        this.PLAYER_RADIUS,
        this.TEAM_RED_COLOR
      );
      this.drawCircle(
        context,
        this.game.state.player2X,
        this.game.state.player2Y,
        this.PLAYER_RADIUS,
        this.TEAM_BLUE_COLOR
      );
      this.drawCircle(
        context,
        this.game.state.ballX,
        this.game.state.ballY,
        this.BALL_RADIUS,
        this.BALL_COLOR
      );

      context.restore();
    }
  }

  private handleInput(): void {
    const state = this.game.state;

    //gracz1
    const mx1 = (this.game.players[0].inputData['moveX'] as number) || 0;
    const my1 = (this.game.players[0].inputData['moveY'] as number) || 0;
    this.p1Kicking = (this.game.players[0].inputData['kick'] as number) === 1;

    let vx1 = mx1 * this.PLAYER_SPEED;
    let vy1 = my1 * this.PLAYER_SPEED;

    if (mx1 !== 0 && my1 !== 0) {
      vx1 *= Math.SQRT1_2;
      vy1 *= Math.SQRT1_2;
    }

    state.player1VX = vx1;
    state.player1VY = vy1;

    //gracz2
    if (this.game.players.length > 1) {
      const mx2 = (this.game.players[1].inputData['moveX'] as number) || 0;
      const my2 = (this.game.players[1].inputData['moveY'] as number) || 0;
      this.p2Kicking = (this.game.players[1].inputData['kick'] as number) === 1;

      let vx2 = mx2;
      let vy2 = my2;

      if (mx2 !== 0 && my2 !== 0) {
        vx2 *= Math.SQRT1_2;
        vy2 *= Math.SQRT1_2;
      }

      state.player2VX = vx2 * this.PLAYER_SPEED;
      state.player2VY = vy2 * this.PLAYER_SPEED;
    }
  }

  private physicsStep(): void {
    const state = this.game.state;
    const posts = this.getPosts();
    const steps = 10;
    const dt = 1 / steps;

    for (let i = 0; i < steps; i++) {
      const p1: TPhysicsEntity = {
        x: state.player1X,
        y: state.player1Y,
        vx: state.player1VX,
        vy: state.player1VY,
        radius: this.PLAYER_RADIUS,
      };
      const p2: TPhysicsEntity = {
        x: state.player2X,
        y: state.player2Y,
        vx: state.player2VX,
        vy: state.player2VY,
        radius: this.PLAYER_RADIUS,
      };
      const ball: TPhysicsEntity = {
        x: state.ballX,
        y: state.ballY,
        vx: state.ballVX,
        vy: state.ballVY,
        radius: this.BALL_RADIUS,
      };

      this.moveEntity(p1, 'red', dt);
      this.moveEntity(p2, 'blue', dt);

      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      this.checkPlayersCollision(p1, p2);

      posts.forEach(post => {
        this.resolveAABBCollision(p1, post);
        this.resolveAABBCollision(p2, post);
        this.resolveRectCollision(ball, post);
      });

      this.checkPlayerBallCollisionBalanced(
        p1,
        p2,
        ball,
        this.p1Kicking,
        this.p2Kicking
      );

      if (this.checkBallWallCollision(ball)) {
        break;
      }

      state.player1X = p1.x;
      state.player1Y = p1.y;
      state.player1VX = p1.vx;
      state.player1VY = p1.vy;
      state.player2X = p2.x;
      state.player2Y = p2.y;
      state.player2VX = p2.vx;
      state.player2VY = p2.vy;
      state.ballX = ball.x;
      state.ballY = ball.y;
      state.ballVX = ball.vx;
      state.ballVY = ball.vy;
    }

    state.ballVX *= state.friction;
    state.ballVY *= state.friction;
  }

  private moveEntity(
    entity: TPhysicsEntity,
    team: 'red' | 'blue',
    dt: number
  ): void {
    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;

    const marginX = 40;
    const marginY = 40;
    const h = this.GAME_HEIGHT;
    const w = this.GAME_WIDTH;
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

  private checkPlayerBallCollisionBalanced(
    player1: TPhysicsEntity,
    player2: TPhysicsEntity,
    ball: TPhysicsEntity,
    p1Kicking: boolean,
    p2Kicking: boolean
  ): void {
    const state = this.game.state;

    if (state.kickoffTeam !== null) {
      if (state.kickoffTeam === 'red') {
        this.checkPlayerBallCollision(player1, ball, 'red', p1Kicking);
      } else {
        this.checkPlayerBallCollision(player2, ball, 'blue', p2Kicking);
      }
      return;
    }

    const dx1 = ball.x - player1.x;
    const dy1 = ball.y - player1.y;
    const distance1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

    const dx2 = ball.x - player2.x;
    const dy2 = ball.y - player2.y;
    const distance2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

    const minDist = ball.radius + player1.radius;

    if (distance1 <= minDist && distance2 <= minDist) {
      let nx1 = distance1 > 0 ? dx1 / distance1 : 1;
      let ny1 = distance1 > 0 ? dy1 / distance1 : 0;
      let nx2 = distance2 > 0 ? dx2 / distance2 : -1;
      let ny2 = distance2 > 0 ? dy2 / distance2 : 0;

      const dotProduct = nx1 * nx2 + ny1 * ny2;

      if (dotProduct < -0.5) {
        const penetration1 = minDist - distance1;
        const penetration2 = minDist - distance2;

        ball.x += (nx1 * penetration1 + nx2 * penetration2) * 0.5;
        ball.y += (ny1 * penetration1 + ny2 * penetration2) * 0.5;

        player1.x -= nx1 * penetration1 * 0.5;
        player1.y -= ny1 * penetration1 * 0.5;

        player2.x -= nx2 * penetration2 * 0.5;
        player2.y -= ny2 * penetration2 * 0.5;

        ball.vx *= 0.5;
        ball.vy *= 0.5;
      } else {
        this.checkPlayerBallCollision(player1, ball, 'red', p1Kicking);
        this.checkPlayerBallCollision(player2, ball, 'blue', p2Kicking);
      }
    } else if (distance1 <= minDist) {
      this.checkPlayerBallCollision(player1, ball, 'red', p1Kicking);
    } else if (distance2 <= minDist) {
      this.checkPlayerBallCollision(player2, ball, 'blue', p2Kicking);
    }
  }

  private getPosts(): { x: number; y: number; w: number; h: number }[] {
    const w = this.GAME_WIDTH;
    const h = this.GAME_HEIGHT;

    const goalHeight = 160;
    const margin = 40;

    const postSize = 10;
    const topY = (h - goalHeight) / 2;
    const bottomY = topY + goalHeight;

    return [
      { x: 0, y: topY - postSize, w: margin, h: postSize },
      { x: 0, y: bottomY, w: margin, h: postSize },
      { x: w - margin, y: topY - postSize, w: margin, h: postSize },
      { x: w - margin, y: bottomY, w: margin, h: postSize },
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
    ball: TPhysicsEntity,
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
      const bounce = this.game.state.wallBounciness;
      ball.vx -= (1 + bounce) * dotProduct * nx;
      ball.vy -= (1 + bounce) * dotProduct * ny;
    }
  }

  private resolveAABBCollision(
    player: TPhysicsEntity,
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

  private checkBallWallCollision(ball: TPhysicsEntity): boolean {
    const w = this.GAME_WIDTH;
    const h = this.GAME_HEIGHT;
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
          const bounce = Math.abs(wallBounce);
          ball.vx -= (1 + bounce) * dot * nx;
          ball.vy -= (1 + bounce) * dot * ny;
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
    const topY = (h - goalHeight) / 2;
    const bottomY = topY + goalHeight;

    //lewa strona boiska
    if (ball.x - r < marginX) {
      if (ball.y >= topY && ball.y <= bottomY) {
        if (ball.x + r < marginX) {
          this.handleGoal('blue');
          return true;
        }

        if (ball.x - r < 0) {
          ball.x = r;
          ball.vx *= wallBounce;
        }
      } else {
        ball.x = marginX + r;
        ball.vx *= wallBounce;
      }
    }

    //prawa strona boiska
    if (ball.x + r > w - marginX) {
      if (ball.y >= topY && ball.y <= bottomY) {
        if (ball.x - r > w - marginX) {
          this.handleGoal('red');
          return true;
        }
        if (ball.x + r > w) {
          ball.x = w - r;
          ball.vx *= wallBounce;
        }
      } else {
        ball.x = w - marginX - r;
        ball.vx *= wallBounce;
      }
    }

    return false;
  }

  private checkPlayersCollision(p1: TPhysicsEntity, p2: TPhysicsEntity): void {
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
    player: TPhysicsEntity,
    ball: TPhysicsEntity,
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

      const ballPush = isKicking ? 0.35 : 0.35;
      const playerPush = isKicking ? 0.65 : 0.65;

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

  private isPlayerBallColliding(
    player: TPhysicsEntity,
    ball: TPhysicsEntity
  ): boolean {
    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDist = ball.radius + player.radius;
    return distance <= minDist;
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
    context.strokeStyle = '#FF0000';
    context.beginPath();
    context.moveTo(margin, topY);
    context.lineTo(0, topY);
    context.lineTo(0, bottomY);
    context.lineTo(margin, bottomY);
    context.stroke();

    //prawa
    context.strokeStyle = '#0000FF';
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
}
