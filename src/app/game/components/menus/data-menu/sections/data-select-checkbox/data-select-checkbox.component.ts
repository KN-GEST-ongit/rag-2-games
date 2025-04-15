import { Component, Input } from '@angular/core';
import { KeyValue } from '@angular/common';
import { TExchangeData } from '@gameModels/exchange-data.type';

@Component({
  selector: 'app-data-select-checkbox',
  standalone: true,
  template: `
    <span class="flex gap-2">
      @if (variable.key && variable.key !== '1') {
        <p>{{ variable.key }}</p>
      }
      <input
        #dataInput
        id="dataInput"
        [attr.disabled]="checkboxAvailable() ? null : 'disabled'"
        type="checkbox"
        class="accent-mainOrange"
        [defaultChecked]="true"
        [checked]="isKeyInDataToPersist(variable.key)"
        (change)="
          updateDataToPersist(variable.key, variable.value, dataInput.checked)
        " />
    </span>
  `,
})
export class DataSelectCheckboxComponent {
  @Input({ required: true }) public variable: KeyValue<string, unknown> = {
    key: '',
    value: '',
  };
  @Input({ required: true }) public dataToPersist: TExchangeData = {};
  @Input({ required: true }) public isDataCollectingActive = false;
  public isKeyInDataToPersist(key: string): boolean {
    return Object.prototype.hasOwnProperty.call(this.dataToPersist, key);
  }
  @Input({ required: true }) public updateDataToPersist = (
    key: string,
    value: unknown,
    checked: boolean
  ): void => {
    console.log('key:', key, 'value:', value, 'checked:', checked);
  };

  public checkboxAvailable(): boolean {
    return !this.isDataCollectingActive;
  }
}
