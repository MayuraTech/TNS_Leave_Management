import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { LeaveBalance } from '../models/leave-balance.model';

export interface BalanceAdjustmentRequest {
  userId: number;
  leaveTypeId: number;
  amount: number;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class LeaveBalanceService {
  constructor(private api: ApiService) {}

  /**
   * Get leave balances for the authenticated user
   */
  getMyBalances(): Observable<LeaveBalance[]> {
    return this.api.get<LeaveBalance[]>('/leave/balance');
  }

  /**
   * Admin: Manually adjust a user's leave balance
   */
  adjustBalance(request: BalanceAdjustmentRequest): Observable<LeaveBalance> {
    return this.api.post<LeaveBalance>('/admin/leave-balance/adjust', request);
  }

  /**
   * Admin: Trigger manual accrual processing
   */
  processAccrual(): Observable<{ processedCount: number }> {
    return this.api.post<{ processedCount: number }>('/admin/accrual/process', {});
  }
}
