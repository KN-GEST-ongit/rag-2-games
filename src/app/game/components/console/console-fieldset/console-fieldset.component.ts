import { KeyValuePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ExchangeDataPipe } from '@utils/pipes/exchange-data.pipe';
import { TExchangeData } from '@gameModels/exchange-data.type';

@Component({
  selector: 'app-console-fieldset',
  standalone: true,
  imports: [KeyValuePipe, ExchangeDataPipe],
  styles: [
    `
    .console-fieldset {
      margin-top: 0px;
      margin-bottom: 0px;
      margin-left: 2rem;
      margin-right: 0.5rem;
      padding-top: 0.25rem;
      padding-bottom: 0.25rem;
      padding-left: 0.5rem;
      border-left: 1px solid #FF6000;
    }
    .console-key {
      font-weight: 700;
      font-size: 1rem;
      line-height: 1.5rem;
      font-family: monospace;
      position: relative;
      top: -0.5rem;
    }
    .console-value {
      font-size: 0.875rem;
      line-height: 1.25rem;
      color: #FFE6C7;
      font-family: monospace;
      position: relative;
      top: -0.5rem;
    }
    @media (min-width: 1280px) {
      .console-value {
        font-size: 1rem;
        line-height: 1.5rem;
      }
      .console-key{
        font-size: 1.125rem;
        line-height: 1.75rem;
      }
    }
    `
  ],
  template: `
    @for (data of logData | keyvalue; track data.key) {
      <div class="console-fieldset">
        <span class="console-key">
          {{ data.key }}:
        </span>

        @if (isTLogData(data.value)) {
          <app-console-fieldset
            [logData]="data.value | exchange_data"></app-console-fieldset>
        } @else {
          <span class="console-value">
            {{ data.value }}
          </span>
        }
      </div>
    }
  `,
})
export class ConsoleFieldsetComponent {
  @Input({ required: true }) public logData: TExchangeData = {};

  public isTLogData(value: unknown): boolean {
    return value instanceof Object;
  }
}
