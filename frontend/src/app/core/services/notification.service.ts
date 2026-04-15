import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  message: string;
  type: NotificationType;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new Subject<AppNotification>();
  notifications$ = this.notificationSubject.asObservable();

  success(message: string): void {
    this.notificationSubject.next({ message, type: 'success' });
  }

  error(message: string): void {
    this.notificationSubject.next({ message, type: 'error' });
  }

  info(message: string): void {
    this.notificationSubject.next({ message, type: 'info' });
  }

  warning(message: string): void {
    this.notificationSubject.next({ message, type: 'warning' });
  }
}
