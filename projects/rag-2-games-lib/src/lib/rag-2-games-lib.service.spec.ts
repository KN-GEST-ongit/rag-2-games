import { TestBed } from '@angular/core/testing';

import { Rag2GamesLibService } from './rag-2-games-lib.service';

describe('Rag2GamesLibService', () => {
  let service: Rag2GamesLibService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Rag2GamesLibService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
