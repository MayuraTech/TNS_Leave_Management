import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeaveService } from '../../../core/services/leave.service';
import { LeaveBalance } from '../../../core/models/leave-balance.model';

@Component({
  selector: 'app-leave-balance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './leave-balance.component.html',
  styleUrls: ['./leave-balance.component.scss']
})
export class LeaveBalanceComponent implements OnInit {
  balances: LeaveBalance[] = [];
  loading = true;
  error: string | null = null;

  constructor(private leaveService: LeaveService) {}

  ngOnInit(): void {
    this.loadBalances();
  }

  loadBalances(): void {
    this.loading = true;
    this.error = null;
    this.leaveService.getLeaveBalances().subscribe({
      next: (data) => {
        this.balances = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load leave balances. Please try again.';
        this.loading = false;
      }
    });
  }

  getUsagePercent(balance: LeaveBalance): number {
    const total = balance.accruedDays + balance.usedDays;
    if (total === 0) return 0;
    return Math.min(100, Math.round((balance.usedDays / total) * 100));
  }
}
