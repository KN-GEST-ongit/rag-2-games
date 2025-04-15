import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModelSelectionComponent } from './model-selection.component';
import { IAiModel } from '@gameModels/ai-model';
import { AiModelsListEndpointsService } from '@endpoints/ai-models-list-endpoints.service';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { environment } from '@env/environment';

describe('ModelSelectionComponent', () => {
  let component: ModelSelectionComponent;
  let fixture: ComponentFixture<ModelSelectionComponent>;
  let mockAiModelsListEndpointsService: jasmine.SpyObj<AiModelsListEndpointsService>;
  let aiModelServiceUrl: string;

  beforeEach(async () => {
    aiModelServiceUrl = environment.aiApiUrl;

    mockAiModelsListEndpointsService = jasmine.createSpyObj(
      'AiModelsListEndpointsService',
      ['getAiModelsList']
    );

    await TestBed.configureTestingModule({
      imports: [ModelSelectionComponent],
      providers: [
        {
          provide: AiModelsListEndpointsService,
          useValue: mockAiModelsListEndpointsService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ModelSelectionComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch models on initialization', () => {
    const mockModels: IAiModel[] = [
      { name: 'Model 1', path: '/model1' },
      { name: 'Model 2', path: '/model2' },
    ];
    mockAiModelsListEndpointsService.getAiModelsList.and.returnValue(
      of(mockModels)
    );
    component.gameName = 'Test Game';

    fixture.detectChanges();

    expect(
      mockAiModelsListEndpointsService.getAiModelsList
    ).toHaveBeenCalledWith('Test Game');
    expect(component.availableModels).toEqual(mockModels);
  });

  it('should emit correct URL when Select button is clicked', () => {
    const mockModels: IAiModel[] = [{ name: 'Model 1', path: '/model1' }];
    mockAiModelsListEndpointsService.getAiModelsList.and.returnValue(
      of(mockModels)
    );
    component.gameName = 'Test Game';
    spyOn(component.socketDomainEmitter, 'emit');

    fixture.detectChanges();
    const selectButton = fixture.debugElement.query(By.css('button'));
    selectButton.triggerEventHandler('click', null);

    expect(component.socketDomainEmitter.emit).toHaveBeenCalledWith(
      aiModelServiceUrl + '/model1'
    );
  });
});
