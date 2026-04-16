import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { LeaveBalanceService } from '../../core/services/leave-balance.service';
import { AuthUser } from '../../core/models/user.model';
import { LeaveBalance } from '../../core/models/leave-balance.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <p class="welcome-text">Welcome back, {{ currentUser?.username }}!</p>
      </div>

      <div class="dashboard-content">
        <!-- User Details Card -->
        <div class="card user-details-card">
          <div class="card-header">
            <h2>Your Profile</h2>
          </div>
          <div class="card-body">
            <div class="user-avatar">
              <div class="avatar-circle">
                {{ getInitials() }}
              </div>
            </div>
            <div class="user-info">
              <div class="info-row">
                <span class="info-label">Username:</span>
                <span class="info-value">{{ currentUser?.username }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">User ID:</span>
                <span class="info-value">#{{ currentUser?.id }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Roles:</span>
                <div class="roles-container">
                  <span *ngFor="let role of currentUser?.roles" class="role-badge role-{{ role.toLowerCase() }}">
                    {{ role }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Leave Balances Card -->
        <div class="card leave-balances-card">
          <div class="card-header">
            <h2>Leave Balances</h2>
          </div>
          <div class="card-body">
            <div *ngIf="isLoadingBalances" class="loading-state">
              <div class="spinner"></div>
              <p>Loading leave balances...</p>
            </div>

            <div *ngIf="balanceError" class="error-state">
              <p>{{ balanceError }}</p>
            </div>

            <div *ngIf="!isLoadingBalances && !balanceError && leaveBalances.length === 0" class="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <p>No leave balances found</p>
            </div>

            <div *ngIf="!isLoadingBalances && !balanceError && leaveBalances.length > 0" class="balances-grid">
              <div *ngFor="let balance of leaveBalances" class="balance-card">
                <div class="balance-header">
                  <h3>{{ balance.leaveTypeName }}</h3>
                </div>
                <div class="balance-stats">
                  <div class="balance-stat">
                    <div class="stat-label">Available</div>
                    <div class="stat-value available">{{ balance.availableDays }}</div>
                    <div class="stat-unit">days</div>
                  </div>
                  <div class="balance-stat">
                    <div class="stat-label">Used</div>
                    <div class="stat-value used">{{ balance.usedDays || 0 }}</div>
                    <div class="stat-unit">days</div>
                  </div>
                  <div class="balance-stat">
                    <div class="stat-label">Accrued</div>
                    <div class="stat-value accrued">{{ balance.accruedDays || 0 }}</div>
                    <div class="stat-unit">days</div>
                  </div>
                </div>
                <div class="balance-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="getUsagePercentage(balance)"></div>
                  </div>
                  <div class="progress-label">{{ getUsagePercentage(balance) }}% used</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 2rem;
    }

    .dashboard-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 0.5rem;
    }

    .welcome-text {
      font-size: 1rem;
      color: #6b7280;
      margin: 0;
    }

    .dashboard-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .card-header {
      padding: 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .card-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0;
    }

    .card-body {
      padding: 2rem;
    }

    .user-details-card .card-body {
      display: flex;
      gap: 2rem;
      align-items: flex-start;
    }

    .user-avatar {
      flex-shrink: 0;
    }

    .avatar-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3f476e 0%, #4E92F8 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      font-weight: 700;
      color: white;
      box-shadow: 0 4px 12px rgba(63, 71, 110, 0.2);
    }

    .user-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .info-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #6b7280;
      min-width: 120px;
    }

    .info-value {
      font-size: 0.95rem;
      color: #1a1a2e;
      font-weight: 500;
    }

    .roles-container {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .role-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .role-employee {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .role-manager {
      background: #d1fae5;
      color: #065f46;
    }

    .role-administrator {
      background: #ede9fe;
      color: #5b21b6;
    }

    /* Leave Balances Styles */
    .leave-balances-card .card-body {
      padding: 2rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #6b7280;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e5e7eb;
      border-top-color: #3f476e;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state {
      text-align: center;
      padding: 3rem;
      color: #ef4444;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #6b7280;
    }

    .empty-state svg {
      margin-bottom: 1rem;
    }

    .balances-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .balance-card {
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .balance-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    }

    .balance-header h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #3f476e;
      margin: 0 0 1.5rem;
    }

    .balance-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .balance-stat {
      text-align: center;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .stat-value.available {
      color: #10b981;
    }

    .stat-value.used {
      color: #ef4444;
    }

    .stat-value.accrued {
      color: #3f476e;
    }

    .stat-unit {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .balance-progress {
      margin-top: 1rem;
    }

    .progress-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981 0%, #3f476e 100%);
      transition: width 0.3s ease;
    }

    .progress-label {
      font-size: 0.75rem;
      color: #6b7280;
      text-align: right;
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
      }

      .user-details-card .card-body {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .info-row {
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      .info-label {
        min-width: auto;
      }

      .balances-grid {
        grid-template-columns: 1fr;
      }

      .balance-stats {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: AuthUser | null = null;
  leaveBalances: LeaveBalance[] = [];
  isLoadingBalances = false;
  balanceError = '';
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private leaveBalanceService: LeaveBalanceService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });

    this.loadLeaveBalances();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadLeaveBalances(): void {
    this.isLoadingBalances = true;
    this.balanceError = '';

    this.leaveBalanceService.getMyBalances()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (balances: LeaveBalance[]) => {
          this.leaveBalances = balances;
          this.isLoadingBalances = false;
        },
        error: (err: any) => {
          this.balanceError = 'Failed to load leave balances. Please try again later.';
          this.isLoadingBalances = false;
        }
      });
  }

  getInitials(): string {
    if (!this.currentUser) return '';
    const username = this.currentUser.username || '';
    return username.substring(0, 2).toUpperCase();
  }

  getUsagePercentage(balance: LeaveBalance): number {
    const total = (balance.accruedDays || 0) + (balance.availableDays || 0);
    if (total === 0) return 0;
    const used = balance.usedDays || 0;
    return Math.round((used / total) * 100);
  }
}
