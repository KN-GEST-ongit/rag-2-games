import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CanvasComponent } from './canvas.component';
import { ElementRef } from '@angular/core';
import { CanvasUtilsService } from 'app/game/services/canvas-utils.service';

class MockCanvasUtilsService {
  public saveCanvasContent = jasmine.createSpy('saveCanvasContent');
  public enterFullscreen = jasmine
    .createSpy('enterFullscreen')
    .and.returnValue(Promise.resolve());
  public exitFullscreen = jasmine
    .createSpy('exitFullscreen')
    .and.returnValue(Promise.resolve());
  public resizeCanvasToFullscreen = jasmine.createSpy(
    'resizeCanvasToFullscreen'
  );
  public scaleCanvasContent = jasmine.createSpy('scaleCanvasContent');
  public restoreCanvasSize = jasmine.createSpy('restoreCanvasSize');
  public restoreCanvasContent = jasmine.createSpy('restoreCanvasContent');
}

describe('CanvasComponent', () => {
  let component: CanvasComponent;
  let fixture: ComponentFixture<CanvasComponent>;
  let canvasUtilsService: MockCanvasUtilsService;
  let mockCanvasElement: HTMLCanvasElement;
  let mockContext: Partial<CanvasRenderingContext2D>;

  beforeEach(async () => {
    canvasUtilsService = new MockCanvasUtilsService();

    await TestBed.configureTestingModule({
      imports: [CanvasComponent],
      providers: [
        { provide: CanvasUtilsService, useValue: canvasUtilsService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CanvasComponent);
    component = fixture.componentInstance;

    mockCanvasElement = document.createElement('canvas');

    mockContext = {
      fillStyle: '',
      fillRect: jasmine.createSpy('fillRect'),
    };

    spyOn(mockCanvasElement, 'getContext').and.returnValue(
      mockContext as CanvasRenderingContext2D
    );

    component.canvasElement = new ElementRef(mockCanvasElement);
  });

  it('should set width and height to 1000x600 when displayMode is "horizontal"', () => {
    component.displayMode = 'horizontal';

    component.ngOnInit();

    expect(component.width).toBe(1000);
    expect(component.height).toBe(600);
  });

  it('should set width and height to 400x600 when displayMode is "vertical"', () => {
    component.displayMode = 'vertical';

    component.ngOnInit();

    expect(component.width).toBe(400);
    expect(component.height).toBe(600);
  });

  it('should initialize canvas on ngAfterViewInit', () => {
    const fillRectSpy = mockContext.fillRect as jasmine.Spy;

    component.ngAfterViewInit();

    expect(fillRectSpy).toHaveBeenCalledWith(
      0,
      0,
      mockCanvasElement.width,
      mockCanvasElement.height
    );
  });
});
