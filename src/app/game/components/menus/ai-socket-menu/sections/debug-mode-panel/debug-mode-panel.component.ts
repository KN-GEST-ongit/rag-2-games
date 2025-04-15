import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TExchangeData } from '@gameModels/exchange-data.type';
import { KeyValuePipe } from '@angular/common';
import { Player } from '@gameModels/player.class';

@Component({
  selector: 'app-debug-mode-panel',
  standalone: true,
  imports: [KeyValuePipe],
  template: ` @for (variable of inputData | keyvalue; track variable) {
    <div class="flex flex-col space-y-1 {{ $last ? 'mb-0' : 'mb-6' }}">
      <span class="text-mainCreme font-bold">{{ variable.key }}:</span>
      <input
        #variableInput
        id="inGameMenuInputFocusAction"
        class="custom-input w-full"
        type="text"
        [defaultValue]="variable.value" />
      <button
        (click)="emitInputData(variable.key, variableInput.value)"
        class="pt-2 border-b-[1px] border-mainOrange w-full text-center font-black">
        Send
      </button>
    </div>
  }`,
  styles: ``,
})
export class DebugModePanelComponent implements OnInit {
  @Input({ required: true }) public expectedInput: TExchangeData = {};
  @Input({ required: true }) public player!: Player;
  @Output() public inputEmitter = new EventEmitter<TExchangeData>();

  public inputData: TExchangeData = {};

  public ngOnInit(): void {
    this.inputData = JSON.parse(JSON.stringify(this.expectedInput));
  }

  public emitInputData(key: string, value: string): void {
    let parsedValue: unknown = value;
    if (!isNaN(Number(value))) {
      parsedValue = Number(value);
    } else if (
      value.toLowerCase() === 'true' ||
      value.toLowerCase() === 'false'
    ) {
      parsedValue = value.toLowerCase() === 'true';
    }
    const data = { [key]: parsedValue } as TExchangeData;
    this.inputEmitter.emit({ player: this.player, data: data });
  }
}
