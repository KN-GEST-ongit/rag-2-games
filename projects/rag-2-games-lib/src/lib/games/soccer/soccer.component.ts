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
    this.moveEntity(this.game.state.player1);
    this.moveEntity(this.game.state.player2);
  }

  private moveEntity(entity: IMovableEntity): void {
    entity.x += entity.vx;
    entity.y += entity.vy;  

    if (entity.x < entity.radius) entity.x = entity.radius;
    if (entity.x > this.game.state.width - entity.radius) entity.x = this.game.state.width - entity.radius;
    
    if (entity.y < entity.radius) entity.y = entity.radius;
    if (entity.y > this.game.state.height - entity.radius) entity.y = this.game.state.height - entity.radius;
  }

  private applyMove(player: IMovableEntity, move: number): void {
    player.vx = 0;
    player.vy = 0;

    if(move == 1)
      player.vx = player.speed; 
    if(move == 2)
      player.vx = -player.speed;
    if(move == 3)
      player.vy = player.speed;
    if(move == 4)
      player.vy = -player.speed;
    if(move == 4)
      player.vy = -player.speed;
    
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


}

