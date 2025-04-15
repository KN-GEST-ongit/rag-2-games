import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CanvasUtilsService {
  public saveCanvasContent(canvas: HTMLCanvasElement): ImageData | null {
    const context = canvas.getContext('2d');
    if (context) {
      return context.getImageData(0, 0, canvas.width, canvas.height);
    }
    return null;
  }

  public restoreCanvasContent(
    canvas: HTMLCanvasElement,
    imageData: ImageData | null
  ): void {
    if (!imageData) return;

    const context = canvas.getContext('2d');
    if (context) {
      context.putImageData(imageData, 0, 0);
    }
  }

  public scaleCanvasContent(
    canvas: HTMLCanvasElement,
    imageData: ImageData | null,
    originalWidth: number,
    originalHeight: number,
    newWidth: number,
    newHeight: number
  ): void {
    if (!imageData) return;

    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, newWidth, newHeight);

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = originalWidth;
      tempCanvas.height = originalHeight;
      const tempContext = tempCanvas.getContext('2d');
      if (tempContext) {
        tempContext.putImageData(imageData, 0, 0);
        context.drawImage(
          tempCanvas,
          0,
          0,
          originalWidth,
          originalHeight,
          0,
          0,
          newWidth,
          newHeight
        );
      }
    }
  }

  public enterFullscreen(canvas: HTMLCanvasElement): Promise<void> {
    return canvas.requestFullscreen
      ? canvas.requestFullscreen()
      : Promise.reject();
  }

  public exitFullscreen(): Promise<void> {
    return document.exitFullscreen
      ? document.exitFullscreen()
      : Promise.reject();
  }

  public resizeCanvasToFullscreen(canvas: HTMLCanvasElement): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  public restoreCanvasSize(
    canvas: HTMLCanvasElement,
    originalWidth: number,
    originalHeight: number
  ): void {
    canvas.width = originalWidth;
    canvas.height = originalHeight;
  }
}
