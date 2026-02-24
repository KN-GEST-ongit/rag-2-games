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

    <app-canvas
      [displayMode]="'horizontal'"
      #gameCanvas></app-canvas>
    <b>FPS: {{ fps }}</b> `,
})
export class SoccerGameWindowComponent
  extends BaseGameWindowComponent
  implements OnInit, AfterViewInit, OnDestroy
{

  public override game!: Soccer;
  
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

  private fullReset(): void {
    this.game.state = new SoccerState();
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
    const move1 = this.game.players[0].inputData['move'] as number;
    this.applyMove(p1, move1);

    //gracz2
    if (this.game.players.length > 1) {
      const p2 = this.game.state.player2;
      const move2 = this.game.players[1].inputData['move'] as number;
      this.applyMove(p2, move2);
    }
  }

  private applyMove(player: IMovableEntity, move: number): void {
    player.vx = 0;
    player.vy = 0;
    
      if(move == 1) player.vx = player.speed; 
      if(move == 2) player.vx = -player.speed; 
      if(move == 3) player.vy = player.speed; 
      if(move == 4) player.vy = -player.speed; 

  }

  private physicsStep(): void {
    const state = this.game.state;
    const posts = this.getPosts();

    this.moveEntity(state.player1, 'red');
    this.moveEntity(state.player2, 'blue');
    
    this.checkPlayersCollision(state.player1, state.player2);

    posts.forEach(post => {
        this.resolveAABBCollision(state.player1, post);
        this.resolveAABBCollision(state.player2, post);
    });

    const steps = 10; 
    const dt = 1 / steps;

    for (let i = 0; i < steps; i++) {
        state.ball.x += state.ball.vx * dt;
        state.ball.y += state.ball.vy * dt;

        posts.forEach(post => {
            this.resolveRectCollision(state.ball, post);
        });

        this.checkBallWallCollision();
    }

    state.ball.vx *= state.friction;
    state.ball.vy *= state.friction;

    this.checkPlayerBallCollision(state.player1, state.ball, 'red');
    this.checkPlayerBallCollision(state.player2, state.ball, 'blue');
  }

  private moveEntity(entity: IMovableEntity, team: 'red' | 'blue'): void {
    entity.x += entity.vx;
    entity.y += entity.vy;  

    if (entity.x < entity.radius) entity.x = entity.radius;
    if (entity.x > this.game.state.width - entity.radius) entity.x = this.game.state.width - entity.radius;
    if (entity.y < entity.radius) entity.y = entity.radius;
    if (entity.y > this.game.state.height - entity.radius) entity.y = this.game.state.height - entity.radius;

    if (this.game.state.kickoffTeam !== null && this.game.state.kickoffTeam !== team) {
        const midX = this.game.state.width / 2;
        const midY = this.game.state.height / 2;
        
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
    
    const goalHeight = 145  ; 
    const goalDepth = 40;   
    
    const postWidth = 40;   
    const postHeight = 5;

    const topY = (h - goalHeight) / 2;
    const bottomY = topY + goalHeight;

    return [
      { x: goalDepth - postWidth, 
        y: topY - postHeight - 5, 
        w: postWidth, 
        h: postHeight },

      { x: goalDepth - postWidth, 
        y: bottomY + 5, 
        w: postWidth, 
        h: postHeight },

      { x: w - goalDepth, 
        y: topY - postHeight -5, 
        w: postWidth, 
        h: postHeight },

      { x: w - goalDepth, 
        y: bottomY + 5, 
        w: postWidth, 
        h: postHeight }
    ];
  }

  private handleGoal(scorer: 'red' | 'blue'): void {
      if (scorer === 'red') {
        this.game.state.scoreRed++;
        this.game.state.kickoffTeam = 'blue'; 
      }

      else {
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
        const dRight = (rect.x + rect.w) - ball.x;
        const dTop = ball.y - rect.y;
        const dBottom = (rect.y + rect.h) - ball.y;

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
        ball.vx = (ball.vx - 2 * dotProduct * nx) * this.game.state.wallBounciness;
        ball.vy = (ball.vy - 2 * dotProduct * ny) * this.game.state.wallBounciness;
    }
  }

  private resolveAABBCollision(player: IMovableEntity, rect: { x: number; y: number; w: number; h: number }): void {
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

      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

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

    if (ball.y - r < 0) { 
      ball.y = r; 
      ball.vy *= wallBounce; 
    }

    if (ball.y + r > h) { 
      ball.y = h - r; 
      ball.vy *= wallBounce; 
    }

    const goalTop = (h / 2) - 80;
    const goalBottom = (h / 2) + 80;

    if (ball.x - r < 0 + 15) {
        if (ball.y > goalTop && ball.y < goalBottom) 
          this.handleGoal('blue');
        else 
          { 
          ball.x = r; 
          ball.vx *= wallBounce; 
        }

    }
    if (ball.x + r > w - 15) {
        if (ball.y > goalTop && ball.y < goalBottom) 
          this.handleGoal('red');
        else 
          { ball.x = w - r; 
            ball.vx *= wallBounce; 
          }
    }

  }

  private checkPlayersCollision(p1: IMovableEntity, p2: IMovableEntity): void {
    const r1 = p1.radius;
    const r2 = p2.radius;

    const p1Left = p1.x - r1;
    const p1Right = p1.x + r1;
    const p1Top = p1.y - r1;
    const p1Bottom = p1.y + r1;

    const p2Left = p2.x - r2;
    const p2Right = p2.x + r2;
    const p2Top = p2.y - r2;
    const p2Bottom = p2.y + r2;

    if (p1Left < p2Right && p1Right > p2Left &&
        p1Top < p2Bottom && p1Bottom > p2Top) {

      const overlapLeft = p1Right - p2Left;
      const overlapRight = p2Right - p1Left;
      const overlapTop = p1Bottom - p2Top;
      const overlapBottom = p2Bottom - p1Top;

      const minOverlapX = Math.min(overlapLeft, overlapRight);
      const minOverlapY = Math.min(overlapTop, overlapBottom);

      if (minOverlapX < minOverlapY) {
        const separation = minOverlapX / 2;
        
        if (overlapLeft < overlapRight) {
           p1.x -= separation;
           p2.x += separation;
        } else {
           p1.x += separation;
           p2.x -= separation;
        }
      } else {
        const separation = minOverlapY / 2;

        if (overlapTop < overlapBottom) {
           p1.y -= separation;
           p2.y += separation;
        } else {
           p1.y += separation;
           p2.y -= separation;
        }
      }
    }
  }

  private checkPlayerBallCollision(player: IMovableEntity, ball: IMovableEntity, team: 'red' | 'blue'): void {
    if (this.game.state.kickoffTeam !== null && this.game.state.kickoffTeam !== team) {
        return; 
    }

    const halfSize = player.radius; 
    
    let testX = ball.x;
    let testY = ball.y;

    if (ball.x < player.x - halfSize) testX = player.x - halfSize;      // lewa
    else if (ball.x > player.x + halfSize) testX = player.x + halfSize; // prawa

    if (ball.y < player.y - halfSize) testY = player.y - halfSize;      // gorna 
    else if (ball.y > player.y + halfSize) testY = player.y + halfSize; // dolna

    const distX = ball.x - testX;
    const distY = ball.y - testY;
    const distance = Math.sqrt((distX * distX) + (distY * distY));

    if (distance <= ball.radius) {
      
      if (this.game.state.kickoffTeam === team) {
          this.game.state.kickoffTeam = null;
      }

      let nx = 0;
      let ny = 0;
      let penetration = 0;

      if (distance === 0) {
          const distLeft = ball.x - (player.x - halfSize);
          const distRight = (player.x + halfSize) - ball.x;
          const distTop = ball.y - (player.y - halfSize);
          const distBottom = (player.y + halfSize) - ball.y;

          const min = Math.min(distLeft, distRight, distTop, distBottom);

          if (min === distLeft) { 
            nx = -1; ny = 0; 
            penetration = ball.radius + distLeft; 
          }
          else if (min === distRight) { 
            nx = 1; ny = 0; 
            penetration = ball.radius + distRight; 
          }
          else if (min === distTop) { 
            nx = 0; ny = -1; 
            penetration = ball.radius + distTop; 
          }
          else { nx = 0; ny = 1; 
            penetration = ball.radius + distBottom; 
          }
      } else {
          nx = distX / distance;
          ny = distY / distance;
          penetration = ball.radius - distance;
      }

      ball.x += nx * penetration;
      ball.y += ny * penetration;

      const bounce = 0.5;
      
      const rvx = ball.vx - player.vx;
      const rvy = ball.vy - player.vy;
      const velAlongNormal = rvx * nx + rvy * ny;

      if (velAlongNormal < 0) {
          const impulse = -(1 + bounce) * velAlongNormal;
          
          ball.vx += impulse * nx;
          ball.vy += impulse * ny;
      }
    }
  }

  private drawGoals(context: CanvasRenderingContext2D, w: number, h: number): void {
    const goalHeight = 160;
    const goalDepth = 40; 
    const topY = (h - goalHeight) / 2;
    const bottomY = topY + goalHeight;

    context.lineWidth = 4;

    //lewa
    context.strokeStyle = this.game.state.teamRedColor;

    context.beginPath();
    context.moveTo(0, topY);           
    context.lineTo(goalDepth, topY);   
    context.lineTo(goalDepth, bottomY);
    context.lineTo(0, bottomY);        
    context.stroke();

    //prawa
    context.globalAlpha = 1.0;
    context.strokeStyle = this.game.state.teamBlueColor;

    context.beginPath();
    context.moveTo(w, topY);              
    context.lineTo(w - goalDepth, topY);  
    context.lineTo(w - goalDepth, bottomY);
    context.lineTo(w, bottomY);           
    context.stroke();
    
    context.globalAlpha = 1.0;

    const gridSize = 8; 
    context.lineWidth = 1;
    context.strokeStyle = 'rgba(0, 0, 0, 0.4)'; 
    context.beginPath();

    for (let x = 0; x <= goalDepth; x += gridSize) {
        context.moveTo(x, topY);
        context.lineTo(x, bottomY);
    }
    for (let y = topY; y <= bottomY; y += gridSize) {
        context.moveTo(0, y);
        context.lineTo(goalDepth, y);
    }

    for (let x = w - goalDepth; x <= w; x += gridSize) {
        context.moveTo(x, topY);
        context.lineTo(x, bottomY);
    }
    for (let y = topY; y <= bottomY; y += gridSize) {
        context.moveTo(w - goalDepth, y);
        context.lineTo(w, y);
    }
    context.stroke();


    
  }

  private drawEntity(context: CanvasRenderingContext2D, entity: IMovableEntity): void {
    const sideLength = entity.radius * 2;
    const topLeftX = entity.x - entity.radius;
    const topLeftY = entity.y - entity.radius;

    context.fillStyle = entity.color;
    context.fillRect(topLeftX, topLeftY, sideLength, sideLength);
    context.strokeStyle = '#000000'; 
    context.lineWidth = 2;
    context.strokeRect(topLeftX, topLeftY, sideLength, sideLength);
  }

  private drawPitchLines(context: CanvasRenderingContext2D, w: number, h: number): void {
    context.strokeStyle = '#474545';
    context.lineWidth = 3;
    
    context.strokeRect(0, 0, w, h);
    
    context.beginPath();
    context.moveTo(w / 2, 0);
    context.lineTo(w / 2, h);
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

    context.strokeRect(0, penaltyY, penaltyWidth, penaltyHeight);

    context.strokeRect(w - penaltyWidth, penaltyY, penaltyWidth, penaltyHeight);
  }

  private drawBall(context: CanvasRenderingContext2D, ball: IMovableEntity): void {
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fillStyle = ball.color;
    context.fill();
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.stroke();

  }
} 