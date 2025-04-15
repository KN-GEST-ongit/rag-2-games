import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UrlParamService {
  private _queryParams: URLSearchParams;

  public constructor() {
    this._queryParams = new URLSearchParams(window.location.search);
  }

  public getQueryParam(key: string): string | null {
    return this._queryParams.get(key);
  }

  public setQueryParam(key: string, value: string): void {
    this._queryParams.set(key, value);
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}?${this._queryParams}`
    );
  }
}
