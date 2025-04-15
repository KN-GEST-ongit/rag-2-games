import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { IAiModel } from '@gameModels/ai-model';
import { catchError, Observable, tap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AiModelsListEndpointsService {
  private _httpClient = inject(HttpClient);

  public getAiModelsList(gameName: string): Observable<IAiModel[]> {
    return this._httpClient
      .get<IAiModel[]>(environment.aiApiUrl + '/ws/' + gameName + '/routes/')
      .pipe(
        tap({
          next: () => {
            console.log('AI model list retrieved successfully');
          },
        }),
        catchError((error: HttpErrorResponse) => {
          return throwError(() => {
            if (error.status === 404) {
              console.error('Wrong path to AI service!');
            } else if (error.status === 500) {
              console.error('AI service is not working!');
            } else {
              console.error('AI service error!');
            }
          });
        })
      );
  }
}
