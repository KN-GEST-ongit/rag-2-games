import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CantDisplayGameComponent } from './cant-display-game.component';
import { NgOptimizedImage } from '@angular/common';
import { By } from '@angular/platform-browser';

describe('Error404PageComponent', () => {
  let component: CantDisplayGameComponent;
  let fixture: ComponentFixture<CantDisplayGameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CantDisplayGameComponent, NgOptimizedImage],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CantDisplayGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should display the correct title text', () => {
    const titleElement = fixture.debugElement.query(By.css('h1'));
    expect(titleElement.nativeElement.textContent).toContain(
      'THE GAME CANNOT BE DISPLAYED'
    );
  });

  it('should display the correct subtitle text', () => {
    const subtitleElement = fixture.debugElement.query(By.css('h2'));
    expect(subtitleElement.nativeElement.textContent).toContain(
      'Unfortunately...'
    );
  });

  it('should display the correct body text', () => {
    const bodyTextElement = fixture.debugElement.query(By.css('span'));
    expect(bodyTextElement.nativeElement.textContent).toContain(
      'The screen resolution you are trying to view the game on is too low. It must be at least 1280 px.'
    );
  });

  it('should display the image with the correct attributes', () => {
    const imgElement = fixture.debugElement.query(By.css('img'));
    expect(imgElement.nativeElement.src).toContain('images/rag-2.png');
    expect(imgElement.nativeElement.alt).toBe('Logo RAG-2');
  });

  it('should have the correct classes applied to the main div', () => {
    const mainDivElement = fixture.debugElement.query(
      By.css('div.flex.flex-col.min-h-all')
    );
    expect(mainDivElement.nativeElement.classList).toContain('bg-gray-400');
    expect(mainDivElement.nativeElement.classList).toContain('text-mainOrange');
  });

  it('should have the correct classes applied to the container div', () => {
    const containerDivElement = fixture.debugElement.query(
      By.css('div.flex.flex-col.md\\:flex-row')
    );
    expect(containerDivElement.nativeElement.classList).toContain(
      'border-mainOrange'
    );
    expect(containerDivElement.nativeElement.classList).toContain(
      'text-mainCreme'
    );
  });
});
