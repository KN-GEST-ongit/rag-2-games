import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataDownloadComponent } from './data-download.component';
import { DataTransformService } from 'app/shared/services/data-transform.service';
import { TExchangeData } from '@gameModels/exchange-data.type';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { GameRecordEndpointsService } from '@endpoints/game-record-endpoints.service';

describe('DataDownloadComponent', () => {
  let component: DataDownloadComponent;
  let fixture: ComponentFixture<DataDownloadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataDownloadComponent],
      providers: [
        GameRecordEndpointsService,
        DataTransformService,
        HttpClient,
        HttpHandler,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display "Start collecting data" when vIsDataCollectingActive is false', () => {
    fixture.detectChanges();
    const button = fixture.debugElement.query(By.css('button')).nativeElement;
    expect(button.textContent).toContain('Start collecting data');
  });

  it('should call deleteCollectedData on delete button click', () => {
    spyOn(component, 'deleteCollectedData');
    component.collectedDataArray = [
      {
        /* mock data */
      },
    ];
    fixture.detectChanges();
    const button = fixture.debugElement.queryAll(By.css('button'))[2]
      .nativeElement;
    button.click();
    expect(component.deleteCollectedData).toHaveBeenCalled();
  });

  it('should render download JSON button when collectedDataArray is not empty and vIsDataCollectingActive is false', () => {
    component.collectedDataArray = [
      {
        /* mock data */
      },
    ];
    fixture.detectChanges();
    const button = fixture.debugElement.queryAll(By.css('button'))[1]
      .nativeElement;
    expect(button.textContent).toContain('Download JSON');
  });

  it('should not render download JSON button when collectedDataArray is empty', () => {
    component.collectedDataArray = [];
    fixture.detectChanges();
    const button = fixture.debugElement.queryAll(By.css('button'))[1];
    expect(button).toBeUndefined();
  });
});
