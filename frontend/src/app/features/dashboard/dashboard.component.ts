import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { LeaveBalanceService } from '../../core/services/leave-balance.service';
import { UserService } from '../../core/services/user.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthUser } from '../../core/models/user.model';
import { LeaveBalance } from '../../core/models/leave-balance.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <p class="welcome-text">Welcome back, {{ currentUser?.username }}!</p>
      </div>

      <div class="dashboard-content">
        <!-- 1. Your Profile -->
        <div class="card user-details-card">
          <div class="card-header">
            <h2>Your Profile</h2>
          </div>
          <div class="card-body">
            <div class="user-avatar">
              <div class="avatar-circle">{{ getInitials() }}</div>
            </div>
            <div class="user-info">
              <div class="info-row">
                <span class="info-label">Username:</span>
                <span class="info-value username-row" *ngIf="!editingUsername">
                  {{ currentUser?.username }}
                  <button class="edit-username-btn" (click)="startEditUsername()" title="Edit username">✏️</button>
                </span>
                <span class="info-value username-edit" *ngIf="editingUsername">
                  <input type="text" [(ngModel)]="usernameInput" class="username-input"
                    (keydown.enter)="promptConfirm()" (keydown.escape)="cancelEditUsername()"
                    [disabled]="savingUsername" autofocus />
                  <button class="save-username-btn" (click)="promptConfirm()" [disabled]="savingUsername">✓</button>
                  <button class="cancel-username-btn" (click)="cancelEditUsername()" [disabled]="savingUsername">✕</button>
                </span>
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

        <!-- 2. Leave Balances -->
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

        <!-- 3. Team Capacity (Manager / Admin only) -->
        <div class="card capacity-card" *ngIf="isManagerOrAdmin && capacityData">
          <div class="card-header">
            <h2>Team Capacity Today</h2>
          </div>
          <div class="card-body capacity-body">
            <div class="donut-wrapper">
              <svg viewBox="0 0 120 120" class="donut-svg">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#e5e7eb" stroke-width="14"/>
                <circle cx="60" cy="60" r="48" fill="none"
                  stroke="#ef4444" stroke-width="14"
                  [attr.stroke-dasharray]="onLeaveDash + ' ' + totalDash"
                  [attr.stroke-dashoffset]="dashOffset"
                  stroke-linecap="round"
                  transform="rotate(-90 60 60)"/>
                <circle cx="60" cy="60" r="48" fill="none"
                  stroke="#4E92F8" stroke-width="14"
                  [attr.stroke-dasharray]="availableDash + ' ' + totalDash"
                  [attr.stroke-dashoffset]="availableOffset"
                  stroke-linecap="round"
                  transform="rotate(-90 60 60)"/>
                <text x="60" y="55" text-anchor="middle" class="donut-pct">{{ capacityData.capacityPercent }}%</text>
                <text x="60" y="70" text-anchor="middle" class="donut-label">capacity</text>
              </svg>
            </div>
            <div class="capacity-legend">
              <div class="legend-item">
                <span class="legend-dot dot-available"></span>
                <div class="legend-text">
                  <span class="legend-count">{{ capacityData.available }}</span>
                  <span class="legend-desc">Available</span>
                </div>
              </div>
              <div class="legend-item">
                <span class="legend-dot dot-leave"></span>
                <div class="legend-text">
                  <span class="legend-count">{{ capacityData.onLeaveToday }}</span>
                  <span class="legend-desc">On Leave</span>
                </div>
              </div>
              <div class="legend-item">
                <span class="legend-dot dot-total"></span>
                <div class="legend-text">
                  <span class="legend-count">{{ capacityData.totalEmployees }}</span>
                  <span class="legend-desc">Total</span>
                </div>
              </div>
            </div>
            <p class="capacity-caption">
              Team is at <strong>{{ capacityData.capacityPercent }}% capacity</strong>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <div class="overlay" *ngIf="showConfirm" (click)="abortConfirm()">
      <div class="confirm-dialog" (click)="$event.stopPropagation()">
        <div class="confirm-icon">⚠️</div>
        <h3 class="confirm-title">Log in again using new username</h3>
        <p class="confirm-body">
          Your username will be changed to <strong>{{ usernameInput }}</strong>.
          You will be logged out and must sign in with the new username.
        </p>
        <div class="confirm-actions">
          <button class="btn-abort" (click)="abortConfirm()">Abort</button>
          <button class="btn-proceed" (click)="proceedSave()">Proceed</button>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div class="loading-overlay" *ngIf="savingUsername">
      <div class="loading-spinner-wrap">
        <div class="big-spinner"></div>
        <p class="loading-text">Updating username...</p>
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

    /* Left border accents per card */
    .user-details-card  { border-left: 4px solid #4E92F8; }
    .leave-balances-card { border-left: 4px solid #10b981; }
    .capacity-card      { border-left: 4px solid #f59e0b; }

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

    .username-row {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .edit-username-btn {
      background: none; border: none; cursor: pointer;
      font-size: 0.9rem; padding: 2px 4px; border-radius: 4px;
      opacity: 0.6; transition: opacity 150ms ease;
      line-height: 1;
    }
    .edit-username-btn:hover { opacity: 1; }

    .username-edit {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }

    .username-input {
      padding: 4px 8px; border: 1.5px solid #4E92F8;
      border-radius: 6px; font-size: 0.9rem; font-family: 'Outfit', sans-serif;
      outline: none; width: 160px;
    }

    .save-username-btn, .cancel-username-btn {
      width: 28px; height: 28px; border-radius: 6px; border: none;
      cursor: pointer; font-size: 0.85rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      transition: all 150ms ease;
    }

    .save-username-btn {
      background: #d1fae5; color: #065f46;
      &:hover:not(:disabled) { background: #a7f3d0; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .cancel-username-btn {
      background: #fee2e2; color: #b91c1c;
      &:hover:not(:disabled) { background: #fecaca; }
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
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    @media (max-width: 900px) {
      .balances-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 560px) {
      .balances-grid { grid-template-columns: 1fr; }
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

    /* ---- Team Capacity Card ---- */
    .capacity-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      padding: 1.5rem 2rem;
    }

    .donut-wrapper {
      width: 160px;
      height: 160px;
    }

    .donut-svg {
      width: 100%;
      height: 100%;
    }

    .donut-pct {
      font-size: 22px;
      font-weight: 700;
      fill: #1a1a2e;
      font-family: 'Outfit', sans-serif;
    }

    .donut-label {
      font-size: 10px;
      fill: #6b7280;
      font-family: 'Outfit', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .capacity-legend {
      display: flex;
      gap: 2rem;
      justify-content: center;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .dot-available { background: #4E92F8; }
    .dot-leave     { background: #ef4444; }
    .dot-total     { background: #e5e7eb; border: 1px solid #d1d5db; }

    .legend-text {
      display: flex;
      flex-direction: column;
    }

    .legend-count {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1.2;
    }

    .legend-desc {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .capacity-caption {
      font-size: 0.9rem;
      color: #374151;
      margin: 0;
      text-align: center;
    }

    .capacity-caption strong {
      color: #4E92F8;
    }

    /* ---- Confirmation Dialog ---- */
    .overlay {
      position: fixed; inset: 0; z-index: 3000;
      background: rgba(10, 18, 40, 0.6);
      backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 150ms ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .confirm-dialog {
      background: #fff; border-radius: 16px;
      padding: 2rem; max-width: 420px; width: calc(100vw - 2rem);
      box-shadow: 0 24px 64px rgba(0,0,0,0.2);
      text-align: center;
      animation: slideUp 200ms cubic-bezier(0.34,1.56,0.64,1);
    }

    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    .confirm-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }

    .confirm-title {
      font-size: 1.1rem; font-weight: 700; color: #1a1a2e;
      margin: 0 0 0.75rem;
    }

    .confirm-body {
      font-size: 0.9rem; color: #6b7280; margin: 0 0 1.5rem;
      line-height: 1.6;
      strong { color: #1a1a2e; }
    }

    .confirm-actions {
      display: flex; gap: 0.75rem; justify-content: center;
    }

    .btn-abort {
      padding: 0.6rem 1.5rem; border-radius: 8px; font-size: 0.9rem;
      font-weight: 600; cursor: pointer; transition: all 150ms ease;
      background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;
      &:hover { background: #e5e7eb; }
    }

    .btn-proceed {
      padding: 0.6rem 1.5rem; border-radius: 8px; font-size: 0.9rem;
      font-weight: 600; cursor: pointer; transition: all 150ms ease;
      background: #4E92F8; color: #fff; border: none;
      &:hover { background: #3498db; transform: translateY(-1px); }
      &:active { transform: scale(0.97); }
    }

    /* ---- Loading Overlay ---- */
    .loading-overlay {
      position: fixed; inset: 0; z-index: 4000;
      background: rgba(10, 18, 40, 0.65);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
    }

    .loading-spinner-wrap {
      display: flex; flex-direction: column; align-items: center; gap: 1rem;
    }

    .big-spinner {
      width: 56px; height: 56px;
      border: 5px solid rgba(255,255,255,0.2);
      border-top-color: #4E92F8;
      border-radius: 50%;
      animation: spin 700ms linear infinite;
    }

    .loading-text {
      color: #fff; font-size: 0.95rem; font-weight: 500; margin: 0;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: AuthUser | null = null;
  leaveBalances: LeaveBalance[] = [];
  isLoadingBalances = false;
  balanceError = '';

  // Team capacity
  capacityData: { totalEmployees: number; onLeaveToday: number; available: number; capacityPercent: number } | null = null;

  // Username editing
  editingUsername = false;
  usernameInput = '';
  savingUsername = false;
  showConfirm = false;

  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private leaveBalanceService: LeaveBalanceService,
    private http: HttpClient,
    private userService: UserService,
    private notificationService: NotificationService
  ) {}

  get isManagerOrAdmin(): boolean {
    const roles = this.currentUser?.roles ?? [];
    return roles.includes('MANAGER') || roles.includes('ADMINISTRATOR');
  }

  // SVG donut math
  get circumference(): number { return 2 * Math.PI * 48; }
  get totalDash(): number { return this.circumference; }
  get onLeaveDash(): number {
    if (!this.capacityData || this.capacityData.totalEmployees === 0) return 0;
    return (this.capacityData.onLeaveToday / this.capacityData.totalEmployees) * this.circumference;
  }
  get availableDash(): number {
    if (!this.capacityData || this.capacityData.totalEmployees === 0) return this.circumference;
    return (this.capacityData.available / this.capacityData.totalEmployees) * this.circumference;
  }
  // on-leave arc starts at 0 (top after rotate -90)
  get dashOffset(): number { return 0; }
  // available arc starts after on-leave arc
  get availableOffset(): number { return -this.onLeaveDash; }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (this.isManagerOrAdmin) {
          this.loadTeamCapacity();
        }
      });

    this.loadLeaveBalances();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  startEditUsername(): void {
    this.usernameInput = this.currentUser?.username ?? '';
    this.editingUsername = true;
  }

  cancelEditUsername(): void {
    this.editingUsername = false;
    this.usernameInput = '';
    this.showConfirm = false;
  }

  promptConfirm(): void {
    const trimmed = this.usernameInput.trim();
    if (!trimmed || trimmed.length < 3) return;
    if (trimmed === this.currentUser?.username) {
      this.cancelEditUsername();
      return;
    }
    this.showConfirm = true;
  }

  abortConfirm(): void {
    this.showConfirm = false;
    // Keep editing mode open so user can change the input
  }

  proceedSave(): void {
    this.showConfirm = false;
    this.savingUsername = true;
    this.userService.updateMyUsername(this.usernameInput.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Username changed — log out
          this.authService.logout();
        },
        error: (err) => {
          this.savingUsername = false;
          this.notificationService.error(err?.error?.message ?? 'Failed to update username.');
        }
      });
  }

  loadTeamCapacity(): void {
    this.http.get<{ totalEmployees: number; onLeaveToday: number; available: number; capacityPercent: number }>(
      `${environment.apiUrl}/dashboard/team-capacity`
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (data) => { this.capacityData = data; },
      error: () => { /* non-critical, silently fail */ }
    });
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
        error: () => {
          this.balanceError = 'Failed to load leave balances. Please try again later.';
          this.isLoadingBalances = false;
        }
      });
  }

  getInitials(): string {
    if (!this.currentUser) return '';
    return (this.currentUser.username || '').substring(0, 2).toUpperCase();
  }

  getUsagePercentage(balance: LeaveBalance): number {
    const total = (balance.accruedDays || 0) + (balance.availableDays || 0);
    if (total === 0) return 0;
    return Math.round(((balance.usedDays || 0) / total) * 100);
  }
}
