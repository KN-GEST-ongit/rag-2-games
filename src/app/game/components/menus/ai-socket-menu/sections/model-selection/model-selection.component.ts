/* eslint-disable max-depth */
import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { IAiModel } from '@gameModels/ai-model';
import { AiModelsListEndpointsService } from 'app/game/services/endpoints/ai-models-list-endpoints.service';
import { environment } from '@env/environment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-model-selection',
  standalone: true,
  imports: [],
  template: `
    @if (availableModels.length !== 0) {
      <fieldset class="border-[1px] border-mainOrange p-2">
        <legend class="text-mainCreme font-bold px-1">Prepared models</legend>
        <div
          class="flex flex-col space-y-2 {{
            isDisabled ? 'opacity-40' : 'opacity-100'
          }}">
          @for (model of availableModels; track $index) {
            <button
              class="p-[2px] w-full rounded-md font-bold text-mainGray bg-mainCreme ease-in-out transition-all duration-200 {{
                selectedModelIndex === $index ? 'border-4 border-green-500' : ''
              }} {{
                isDisabled ? '' : 'hover:text-mainCreme hover:bg-mainGray'
              }}"
              (click)="selectPreparedModel(model, $index)">
              {{ model.name }}
            </button>
          }
        </div>
      </fieldset>
    }
  `,
})
export class ModelSelectionComponent implements OnInit, OnDestroy, OnChanges {
  @Input({ required: true }) public isDisabled!: boolean;
  @Input({ required: true }) public gameName!: string;
  @Input({ required: true }) public currentSocketDomain!: string;

  @Output() public socketDomainEmitter = new EventEmitter<string>();
  @Output() public isModelSelected = new EventEmitter<boolean>();

  private _aiModelsListEndpointsService = inject(AiModelsListEndpointsService);

  private _getModelListSubscribtion = new Subscription();

  public availableModels: IAiModel[] = [];
  public aiModelServiceUrl = environment.aiApiUrl;
  public selectedModelIndex = -1;
  public selectedModel: IAiModel | null = null;

  public ngOnInit(): void {
    this._getModelListSubscribtion = this._aiModelsListEndpointsService
      .getAiModelsList(this.gameName)
      .subscribe(models => {
        this.availableModels = models;
      });
  }

  public ngOnChanges(): void {
    if (this.currentSocketDomain && this.selectedModel?.path) {
      if (
        this.currentSocketDomain !==
        this.aiModelServiceUrl + this.selectedModel.path
      ) {
        this.selectedModelIndex = -1;
        this.selectedModel = null;
      }
    }
  }

  public selectPreparedModel(model: IAiModel, modelIndex: number): void {
    if (!this.isDisabled) {
      if (this.selectedModelIndex !== modelIndex) {
        this.selectedModelIndex = modelIndex;
        this.selectedModel = model;
        this.socketDomainEmitter.emit(this.aiModelServiceUrl + model.path);
        this.isModelSelected.emit(true);
      } else {
        this.selectedModelIndex = -1;
        this.selectedModel = null;
        this.socketDomainEmitter.emit('');
        this.isModelSelected.emit(false);
      }
    }
  }

  public ngOnDestroy(): void {
    this._getModelListSubscribtion.unsubscribe();
  }
}
