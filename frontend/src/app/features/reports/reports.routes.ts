import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: ['ADMINISTRATOR'] },
    children: [
      {
        path: 'leave-usage',
        loadComponent: () =>
          import('./leave-usage-report/leave-usage-report.component').then(
            m => m.LeaveUsageReportComponent
          )
      },
      {
        path: 'balance',
        loadComponent: () =>
          import('./balance-report/balance-report.component').then(m => m.BalanceReportComponent)
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./audit-report/audit-report.component').then(m => m.AuditReportComponent)
      },
      { path: '', redirectTo: 'leave-usage', pathMatch: 'full' }
    ]
  }
];
