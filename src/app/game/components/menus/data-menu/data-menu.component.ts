/* eslint-disable max-lines */
import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { TExchangeData } from '@gameModels/exchange-data.type';
import { KeyValuePipe } from '@angular/common';
import { DataSelectCheckboxComponent } from './sections/data-select-checkbox/data-select-checkbox.component';
import { DataDownloadComponent } from './sections/data-download/data-download.component';
import { UrlParamService } from 'app/shared/services/url-param.service';
import { Game } from '@gameModels/game.class';
import { Observable, Subscription } from 'rxjs';
import * as feather from 'feather-icons';
import { SideMenuHelperComponent } from '../ai-socket-menu/sections/side-menu-helper/side-menu-helper.component';

@Component({
  selector: 'app-data-menu',
  standalone: true,
  imports: [
    KeyValuePipe,
    DataSelectCheckboxComponent,
    DataDownloadComponent,
    SideMenuHelperComponent,
  ],
  template: `
    <button
      (click)="toggleDataMenu()"
      class="side-menu-right-button top-40 w-12 h-72 {{
        isDataMenuVisible ? 'right-72' : 'right-0'
      }}">
      <span
        class="[writing-mode:vertical-rl] [text-orientation:upright] tracking-[0.45em]"
        >DATA</span
      >
    </button>
    <div
      class="w-72 h-72 overflow-y-auto p-5 bg-lightGray font-mono text-sm side-menu-container top-40 {{
        isDataMenuVisible ? 'right-0' : '-right-72'
      }}">
      <app-side-menu-helper
        [menuType]="'Data menu'"
        [descriptionPart1]="
          'In this menu, you can select the data to collect from your game by setting an interval for how often it saves, then clicking the button to start. Data will be collected until you stop it, after which you can download or delete the records locally.'
        "
        [descriptionPart2]="
          'Every saved game is available on the user’s dashboard.'
        "
        [descriptionPart3]="null" />
      <span class="font-bold text-mainCreme mt-6">Select data to persist:</span>
      @for (variable of dataPossibleToPersist | keyvalue; track variable.key) {
        <app-data-select-checkbox
          [variable]="variable"
          [isDataCollectingActive]="isDataCollectingActive"
          [dataToPersist]="dataToPersist"
          [updateDataToPersist]="updateDataToPersist" />
      }
      <span
        class="font-bold text-mainCreme mt-3 pt-3 pb-1 border-t-[1px] border-mainOrange"
        >Data saving interval limit:</span
      >
      <input
        type="number"
        id="inGameMenuInputFocusAction"
        #dataSavingIntervalLimitInput
        class="custom-input w-full mb-2"
        min="10"
        max="1000"
        step="10"
        [defaultValue]="dataSavingIntervalLimit"
        (change)="onIntervalLimitChange($event)" />
      <app-data-download
        (collectingActiveEmitter)="isDataCollectingActive = $event"
        [game]="game"
        [collectedDataArray]="collectedDataArray"
        (deleteCollectedDataArrayEmitter)="collectedDataArray = []"
        [isStateChanged]="isStateChanged" />
    </div>
  `,
})
export class DataMenuComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input({ required: true }) public game!: Game;
  @Input({ required: true }) public gamePause = new Observable<boolean>();
  @Input({ required: true }) public set setDataPossibleToPersist(
    value: TExchangeData
  ) {
    this.dataPossibleToPersist = value;
    if (this.isDataCollectingActive) {
      this.updateCollectedData();
    }
  }
  @Input({ required: true }) public isStateChanged = false;

  private _lastSavedTime = 0;
  private _pauseSubscription = new Subscription();
  private isPaused = false;
  private _previousData = '';

  public dataPossibleToPersist: TExchangeData = {};
  public dataToPersist: TExchangeData = {};
  public collectedDataArray: TExchangeData[] = [];
  public isDataCollectingActive = false;
  public isDataMenuVisible = false;
  public dataSavingIntervalLimit = 100;

  public constructor(private _urlParamService: UrlParamService) {}

  public ngOnInit(): void {
    this._pauseSubscription = this.gamePause.subscribe(
      isPaused => (this.isPaused = isPaused)
    );
    setTimeout(() => {
      this.dataToPersist = JSON.parse(
        JSON.stringify(this.dataPossibleToPersist)
      );

      this.updateDataToPersistFromURL();
    }, 50);
  }

  public ngAfterViewInit(): void {
    feather.replace();
  }

  public ngOnDestroy(): void {
    this._pauseSubscription.unsubscribe();
  }

  public toggleDataMenu(): void {
    this.isDataMenuVisible = !this.isDataMenuVisible;
  }

  public updateDataToPersist = (
    key: string,
    value: unknown,
    isPresent: boolean
  ): void => {
    if (isPresent) {
      this.dataToPersist[key] = value as TExchangeData[keyof TExchangeData];
    } else {
      delete this.dataToPersist[key];
    }

    this._urlParamService.setQueryParam(key, isPresent ? 'true' : 'false');
  };

  public onIntervalLimitChange = (event: Event): void => {
    this.dataSavingIntervalLimit = (
      event.target as HTMLInputElement
    ).valueAsNumber;
    this._urlParamService.setQueryParam(
      'dataSavingIntervalLimit',
      this.dataSavingIntervalLimit.toString()
    );
  };

  //

  private updateDataToPersistFromURL(): void {
    for (const key in this.dataPossibleToPersist) {
      this.updateDataToPersist(
        key,
        this.dataPossibleToPersist[key],
        this._urlParamService.getQueryParam(key) !== 'false'
      );
    }

    const intervalLimit = this._urlParamService.getQueryParam(
      'dataSavingIntervalLimit'
    ) as unknown as number;

    if (intervalLimit !== null) {
      this.dataSavingIntervalLimit = intervalLimit;
    } else {
      this._urlParamService.setQueryParam(
        'dataSavingIntervalLimit',
        this.dataSavingIntervalLimit.toString()
      );
    }
  }

  private updateCollectedData(): void {
    const newData = JSON.parse(JSON.stringify(this.dataToPersist));
    for (const key in newData) {
      newData[key] = this.dataPossibleToPersist[key];
    }
    if (
      Date.now() - this._lastSavedTime > this.dataSavingIntervalLimit &&
      !this.isPaused
    ) {
      const date = new Date();
      const offsetInMilliseconds = date.getTimezoneOffset() * 60000;
      const localISOTime = new Date(date.getTime() - offsetInMilliseconds)
        .toISOString()
        .slice(0, -1);

      newData['players'] = JSON.parse(JSON.stringify(this.game.players));

      if (JSON.stringify(newData) != this._previousData) {
        this.collectedDataArray.push(this.dataToPersist);
      }

      this._previousData = JSON.stringify(newData);

      newData['timestamp'] = localISOTime;
      this.dataToPersist = newData;

      this._lastSavedTime = Date.now();
    }
  }
}
