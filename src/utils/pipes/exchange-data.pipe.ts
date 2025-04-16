import { Pipe, PipeTransform } from '@angular/core';
import { TExchangeData } from '../../../projects/rag-2-games-lib/src/public-api';

@Pipe({
  name: 'exchange_data',
  standalone: true,
})
export class ExchangeDataPipe implements PipeTransform {
  public transform(value: unknown): Record<string, TExchangeData> {
    return value as Record<string, TExchangeData>;
  }
}
