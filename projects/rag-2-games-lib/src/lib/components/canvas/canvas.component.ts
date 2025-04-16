import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CanvasUtilsService } from 'app/game/services/canvas-utils.service';
import * as feather from 'feather-icons';

@Component({
  selector: 'app-canvas',
  standalone: true,
  template: `
    <div class="relative">
      <canvas
        #canvasElement
        [attr.width]="width"
        [attr.height]="height"
        class="border-mainOrange border-2"></canvas>
      <!-- <button
        (click)="toggleFullscreen()"
        class="absolute -bottom-16 -right-16">
        <i
          data-feather="maximize"
          class="size-9 hover:size-10 opacity-70 hover:opacity-100 transition-all ease-in-out duration-100"></i>
      </button> -->
    </div>
  `,
})
export class CanvasComponent implements AfterViewInit, OnInit {
  @Input({ required: true }) public displayMode: 'vertical' | 'horizontal' =
    'horizontal';
  private _canvasUtilsService = inject(CanvasUtilsService);

  @ViewChild('canvasElement', { static: true })
  public canvasElement!: ElementRef<HTMLCanvasElement>;

  public height!: number;
  public width!: number;

  public ngOnInit(): void {
    switch (this.displayMode) {
      case 'horizontal':
        this.height = 600;
        this.width = 1000;
        break;
      case 'vertical':
        this.height = 600;
        this.width = 400;
        break;
      default:
        break;
    }
  }

  private isFullscreen = false;
  private _originalWidth!: number;
  private _originalHeight!: number;
  private _savedImageData: ImageData | null = null;

  public ngAfterViewInit(): void {
    feather.replace();
    this.initializeCanvas();
    this.addFullscreenEventListeners();
    window.addEventListener('resize', this.handleResize.bind(this));
  }

  public initializeCanvas(): void {
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#151515';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    this._originalWidth = canvas.width;
    this._originalHeight = canvas.height;
  }

  public toggleFullscreen(): void {
    if (!this.isFullscreen) {
      this.enterFullscreen();
    } else {
      this.exitFullscreen();
    }
  }

  //

  private enterFullscreen(): void {
    const canvas = this.canvasElement.nativeElement;
    this._savedImageData = this._canvasUtilsService.saveCanvasContent(canvas);
    this._canvasUtilsService.enterFullscreen(canvas).then(() => {
      this.isFullscreen = true;
      this._canvasUtilsService.resizeCanvasToFullscreen(canvas);
      this._canvasUtilsService.scaleCanvasContent(
        canvas,
        this._savedImageData,
        this._originalWidth,
        this._originalHeight,
        canvas.width,
        canvas.height
      );
    });
  }

  private exitFullscreen(): void {
    this._canvasUtilsService.exitFullscreen().then(() => {
      this.isFullscreen = false;
      const canvas = this.canvasElement.nativeElement;
      this._canvasUtilsService.restoreCanvasSize(
        canvas,
        this._originalWidth,
        this._originalHeight
      );
      this._canvasUtilsService.restoreCanvasContent(
        canvas,
        this._savedImageData
      );
    });
  }

  private handleResize(): void {
    if (this.isFullscreen) {
      const canvas = this.canvasElement.nativeElement;
      this._canvasUtilsService.resizeCanvasToFullscreen(canvas);
      this._canvasUtilsService.scaleCanvasContent(
        canvas,
        this._savedImageData,
        this._originalWidth,
        this._originalHeight,
        canvas.width,
        canvas.height
      );
    }
  }

  private addFullscreenEventListeners(): void {
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement) {
        this.isFullscreen = false;
        const canvas = this.canvasElement.nativeElement;
        this._canvasUtilsService.restoreCanvasSize(
          canvas,
          this._originalWidth,
          this._originalHeight
        );
        this._canvasUtilsService.restoreCanvasContent(
          canvas,
          this._savedImageData
        );
      }
    });
  }
}
