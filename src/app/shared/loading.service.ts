import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _loading$ = new BehaviorSubject<boolean>(false);
  readonly loading$ = this._loading$.asObservable();

  private counter = 0;

  show(): void {
    this.counter++;
    if (this.counter > 0) this._loading$.next(true);
  }

  hide(): void {
    this.counter = Math.max(0, this.counter - 1);
    if (this.counter === 0) this._loading$.next(false);
  }

  // forçar esconder (se precisar)
  reset(): void {
    this.counter = 0;
    this._loading$.next(false);
  }
}
