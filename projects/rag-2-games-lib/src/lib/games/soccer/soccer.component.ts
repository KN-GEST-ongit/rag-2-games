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
    this.game.state = new SoccerState();
    this.game.state.scoreRed = savedScoreRed;
    this.game.state.scoreBlue = savedScoreBlue;
  }

  private fullReset(): void {
    this.game.state = new SoccerState();
  }

  protected override update(): void {
    super.update();

    this.handleInput();
    this.physicsStep();
    
    this.render();
  }

  private render(): void {
    const context = this._canvas.getContext('2d');
    if (context) {
      const gameW = this.game.state.width;
      const gameH = this.game.state.height;

      context.clearRect(0, 0, gameW, gameH);

      this.drawGoals(context, gameW, gameH);

      this.drawEntity(context, this.game.state.player1);
      this.drawEntity(context, this.game.state.player2);

      this.drawBall(context, this.game.state.ball);

      context.restore();
    }
  }



  private drawGoals(context: CanvasRenderingContext2D, w: number, h: number): void {
    const goalHeight = 160;
    const goalDepth = 40; 
    const topY = (h - goalHeight) / 2;
    const bottomY = topY + goalHeight;

    //lewa
    context.strokeStyle = this.game.state.teamRedColor;
    context.lineWidth = 4;

    context.beginPath();
    context.moveTo(0, topY);           
    context.lineTo(goalDepth, topY);   
    context.lineTo(goalDepth, bottomY);
    context.lineTo(0, bottomY);        
    context.stroke();

    context.fillStyle = this.game.state.teamRedColor;
    context.globalAlpha = 0.2;
    context.fillRect(0, topY, goalDepth, goalHeight); 

    //prawa
    context.globalAlpha = 1.0;
    context.strokeStyle = this.game.state.teamBlueColor;

    context.beginPath();
    context.moveTo(w, topY);              
    context.lineTo(w - goalDepth, topY);  
    context.lineTo(w - goalDepth, bottomY);
    context.lineTo(w, bottomY);           
    context.stroke();

    context.fillStyle = this.game.state.teamBlueColor;
    context.globalAlpha = 0.2;
    context.fillRect(w - goalDepth, topY, goalDepth, goalHeight);
    
    context.globalAlpha = 1.0;
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

  private physicsStep(): void {
    const state = this.game.state;
    const posts = this.getPosts();

    this.moveEntity(state.player1);
    this.moveEntity(state.player2);
    
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

    this.checkPlayerBallCollision(state.player1, state.ball);
    this.checkPlayerBallCollision(state.player2, state.ball);
  }

  private moveEntity(entity: IMovableEntity): void {
    entity.x += entity.vx;
    entity.y += entity.vy;  

    if (entity.x < entity.radius) entity.x = entity.radius;
    if (entity.x > this.game.state.width - entity.radius) entity.x = this.game.state.width - entity.radius;
    if (entity.y < entity.radius) entity.y = entity.radius;
    if (entity.y > this.game.state.height - entity.radius) entity.y = this.game.state.height - entity.radius;
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

  private getPosts(): { x: number; y: number; w: number; h: number }[] {
    const w = this.game.state.width;
    const h = this.game.state.height;
    const goalHeight = 160;
    const goalDepth = 40; 
    
    const topY = (h - goalHeight) / 2;
    const bottomY = topY + goalHeight;
    const postThick = 10; 
      
    return [
      { x: 0, y: topY - postThick, w: goalDepth, h: postThick }, 
      { x: 0, y: bottomY, w: goalDepth, h: postThick }, 
      { x: w - goalDepth, y: topY - postThick, w: goalDepth, h: postThick }, 
      { x: w - goalDepth, y: bottomY, w: goalDepth, h: postThick } 
    ];
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

  private drawGoalsAndPosts(context: CanvasRenderingContext2D, w: number, h: number): void {
    const goalHeight = 155;
    const goalDepth = 40; 
    const topY = (h - goalHeight) / 2;
    const bottomY = topY + goalHeight;
    const posts = this.getPosts();

    context.fillStyle = this.game.state.teamRedColor;
    context.globalAlpha = 0.2;
    context.fillRect(0, topY, goalDepth, goalHeight); 
    context.fillStyle = this.game.state.teamBlueColor;
    context.fillRect(w - goalDepth, topY, goalDepth, goalHeight); 
    context.globalAlpha = 1.0;

    context.lineWidth = 4;
    context.strokeStyle = this.game.state.teamRedColor;
    context.beginPath(); context.moveTo(0, topY); context.lineTo(goalDepth, topY); context.lineTo(goalDepth, bottomY); context.lineTo(0, bottomY); context.stroke();
    context.strokeStyle = this.game.state.teamBlueColor;
    context.beginPath(); context.moveTo(w, topY); context.lineTo(w - goalDepth, topY); context.lineTo(w - goalDepth, bottomY); context.lineTo(w, bottomY); context.stroke();

    context.fillStyle = '#666'; 
    context.strokeStyle = '#000';
    context.lineWidth = 1;
    posts.forEach(p => {
      context.fillRect(p.x, p.y, p.w, p.h);
      context.strokeRect(p.x, p.y, p.w, p.h);
    });
  }

  private drawPitchLines(context: CanvasRenderingContext2D, w: number, h: number): void {
    context.strokeStyle = '#000000';
    context.lineWidth = 3;
    context.strokeRect(0, 0, w, h);
    context.beginPath();
    context.moveTo(w / 2, 0);
    context.lineTo(w / 2, h);
    context.stroke();
  }

  private checkBallWallCollision(): void {
    const ball = this.game.state.ball;
    const w = this.game.state.width;
    const h = this.game.state.height;
    const r = ball.radius;
    const wallBounce = -this.game.state.wallBounciness;

    if (ball.y - r < 0) { ball.y = r; ball.vy *= wallBounce; }
    if (ball.y + r > h) { ball.y = h - r; ball.vy *= wallBounce; }

    const goalTop = (h / 2) - 80;
    const goalBottom = (h / 2) + 80;

    if (ball.x - r < 0) {
        if (ball.y > goalTop && ball.y < goalBottom) this.handleGoal('blue');
        else { ball.x = r; ball.vx *= wallBounce; }
    }
    if (ball.x + r > w) {
        if (ball.y > goalTop && ball.y < goalBottom) this.handleGoal('red');
        else { ball.x = w - r; ball.vx *= wallBounce; }
    }
  }

  private handleGoal(scorer: 'red' | 'blue'): void {
      if (scorer === 'red') this.game.state.scoreRed++;
      else this.game.state.scoreBlue++;
      this.restart();
  }

  private applyMove(player: IMovableEntity, move: number): void {
    player.vx = 0;
    player.vy = 0;
    const diagSpeed = player.speed * 0.7071; 
    switch(move) {
      case 1: player.vx = player.speed; break;
      case 2: player.vx = -player.speed; break;
      case 3: player.vy = player.speed; break;
      case 4: player.vy = -player.speed; break;
      case 5: player.vx = diagSpeed; player.vy = -diagSpeed; break;
      case 6: player.vx = diagSpeed; player.vy = diagSpeed; break;
      case 7: player.vx = -diagSpeed; player.vy = diagSpeed; break;
      case 8: player.vx = -diagSpeed; player.vy = -diagSpeed; break;
      default: break;
    }
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

  private checkPlayerBallCollision(player: IMovableEntity, ball: IMovableEntity): void {
      const dx = ball.x - player.x;
      const dy = ball.y - player.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < player.radius + ball.radius) {
          const angle = Math.atan2(dy, dx);
          const force = 6;
          ball.vx = Math.cos(angle) * force + player.vx * 0.5;
          ball.vy = Math.sin(angle) * force + player.vy * 0.5;
          const overlap = (player.radius + ball.radius) - dist;
          ball.x += Math.cos(angle) * overlap;
          ball.y += Math.sin(angle) * overlap;
      }
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