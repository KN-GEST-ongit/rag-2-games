import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PageVisibilityService {
  private _renderer: Renderer2;
  private _visibilityState$ = new BehaviorSubject<boolean>(true);

  public constructor(rendererFactory: RendererFactory2) {
    this._renderer = rendererFactory.createRenderer(null, null);

    this._renderer.listen('document', 'visibilitychange', () => {
      const isVisible = document.visibilityState === 'visible';
      this._visibilityState$.next(isVisible);
    });
  }

  public getVisibilityState(): Observable<boolean> {
    return this._visibilityState$.asObservable();
  }
}
