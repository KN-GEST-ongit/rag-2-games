import { AfterViewInit, Component, inject, Input, OnInit } from '@angular/core';
import { UrlParamService } from 'app/shared/services/url-param.service';

@Component({
  selector: 'app-socket-connected-menu',
  standalone: true,
  imports: [],
  template: `
    <button
      (click)="socket?.close()"
      class="my-2 border-b-[1px] border-mainOrange w-full text-center font-black">
      Disconnect
    </button>
    @if (isDataSendingActive) {
      <button
        (click)="stopDataExchange()"
        class="w-full mt-4 text-center text-red-500 hover:text-mainCreme ease-in-out duration-200 transition-all font-bold bg-lightGray hover:bg-red-500 border-red-500 border-[1px] p-1">
        Stop data exchange
      </button>
    } @else {
      <span class="text-mainCreme font-bold">Type sending interval:</span>
      <input
        type="number"
        id="inGameMenuInputFocusAction"
        #sendingIntervalInput
        class="custom-input w-full my-2"
        min="50"
        max="1000"
        step="10"
        [defaultValue]="vSendingInterval.value"
        (change)="updateValue(sendingIntervalInput.valueAsNumber)"
        (keyup)="updateValue(sendingIntervalInput.valueAsNumber)" />
      <button
        [attr.disabled]="
          isPaused || !vSendingInterval.value ? 'disabled' : null
        "
        (click)="startDataExchange(vSendingInterval.value)"
        class="w-full mt-2 text-center {{
          !isPaused && vSendingInterval.value
            ? 'text-green-500 hover:text-mainCreme font-bold border-green-500 bg-lightGray hover:bg-green-500 ease-in-out duration-200 transition-all'
            : ''
        }}  border-[1px] p-1">
        Start data exchange
      </button>
    }
  `,
})
export class SocketConnectedMenuComponent implements OnInit {
  @Input({ required: true }) public isDataSendingActive = false;
  @Input({ required: true }) public vSendingInterval = { value: 50 };
  @Input({ required: true }) public socket: WebSocket | null = null;
  @Input({ required: true }) public startDataExchange = (
    sendingInterval: number
  ): void => {
    console.log(sendingInterval);
  };
  @Input({ required: true }) public stopDataExchange = (): void => {
    console.log('stopDataExchange');
  };
  @Input({ required: true }) public isPaused = false;
  @Input({ required: true }) public playerId!: number;

  private _urlParamService = inject(UrlParamService);

  public ngOnInit(): void {
    this.syncPropsWithUrl();
    this.updateValue(50);
  }

  public updateValue(value: number): void {
    if (value < 50) {
      value = 50;
    }

    this.vSendingInterval.value = value;

    this._urlParamService.setQueryParam(
      'player-' + this.playerId + '-sending-interval',
      this.vSendingInterval.value.toString()
    );
  }

  //

  private syncPropsWithUrl(): void {
    setTimeout(() => {
      const sendingInterval = this._urlParamService.getQueryParam(
        'player-' + this.playerId + '-sending-interval'
      );
      if (sendingInterval !== null) {
        this.vSendingInterval.value = sendingInterval as unknown as number;
      } else {
        this._urlParamService.setQueryParam(
          'player-' + this.playerId + '-sending-interval',
          this.vSendingInterval.value.toString()
        );
      }
    });
  }
}
