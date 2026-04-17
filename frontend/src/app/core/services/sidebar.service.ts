import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private isOpenSubject = new BehaviorSubject<boolean>(true);
  isOpen$ = this.isOpenSubject.asObservable();

  toggle(): void {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  setOpen(isOpen: boolean): void {
    this.isOpenSubject.next(isOpen);
  }

  get isOpen(): boolean {
    return this.isOpenSubject.value;
  }
}
