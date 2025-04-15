import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-debug-mode-menu',
  standalone: true,
  imports: [],
  template: `
    <input
      id="debugMode"
      type="checkbox"
      #debugCheckbox
      [attr.disabled]="canApplyDebugMode ? null : true"
      class="mb-2 mr-2 mt-1 accent-mainOrange"
      (change)="onDebugModeChange(debugCheckbox.checked)" />
    <label for="debugMode" class="font-bold w-3/4">Debug Mode</label>
  `,
})
export class DebugModeMenuComponent {
  @Input({ required: true }) public canApplyDebugMode = true;
  @Output() public debugModeEmitter = new EventEmitter<boolean>();

  public onDebugModeChange(value: boolean): void {
    this.debugModeEmitter.emit(value);
  }
}
