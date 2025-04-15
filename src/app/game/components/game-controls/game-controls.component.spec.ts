import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameControlsComponent } from './game-controls.component';
import { Game } from '@gameModels/game.class';
import { Player } from '@gameModels/player.class';
import { By } from '@angular/platform-browser';
import { SkiJumpState } from 'app/game/games/skijump/models/skijump.class';

const mockGame: Game = {
  name: 'skijump',
  state: new SkiJumpState(),
  outputSpec: '',
  players: [
    new Player(0, true, 'Player 1', { space: 0, up: 0, down: 0 }, {}, '', {
      start: '[SPACE]',
      jump: '[SPACE]',
      land: '[SPACE]',
      restart: '[SPACE]',
      rotate_up: '[ARROW_DOWN]',
      rotate_down: '[ARROW_UP]',
    }),
  ],
};

describe('GameControlsComponent', () => {
  let component: GameControlsComponent;
  let fixture: ComponentFixture<GameControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameControlsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GameControlsComponent);
    component = fixture.componentInstance;
    component.game = mockGame;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the correct number of players', () => {
    const playerElements = fixture.debugElement.queryAll(
      By.css('.text-bold.text-sm.uppercase.text-mainOrange')
    );
    expect(playerElements.length).toBe(mockGame.players.length);
  });

  it('should display the player name and label it correctly', () => {
    const playerElement = fixture.debugElement.query(
      By.css('.text-bold.text-sm.uppercase.text-mainOrange')
    );
    expect(playerElement.nativeElement.textContent).toContain('Player 1');
  });

  it('should initially have opacity 0 for the controls container', () => {
    const controlsContainer = fixture.debugElement.query(
      By.css('.flex.flex-col.opacity-0.group-hover\\:opacity-100')
    );
    expect(controlsContainer).toBeTruthy();
    expect(controlsContainer.nativeElement.classList).toContain('opacity-0');
  });

  it('should display the info tooltip with correct text', () => {
    const tooltipText = fixture.debugElement
      .query(By.css('.text-center.py-2.pl-12.pr-4.uppercase'))
      .nativeElement.textContent.trim();
    expect(tooltipText).toBe('Game controls:');
  });
});
