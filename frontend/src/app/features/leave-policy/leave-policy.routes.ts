import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const LEAVE_POLICY_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: ['ADMINISTRATOR'] },
    children: [
      {
        path: 'leave-types',
        loadComponent: () =>
          import('./leave-type-management/leave-type-management.component').then(
            m => m.LeaveTypeManagementComponent
          )
      },
      {
        path: 'holidays',
        loadComponent: () =>
          import('./holiday-management/holiday-management.component').then(
            m => m.HolidayManagementComponent
          )
      },
      { path: '', redirectTo: 'leave-types', pathMatch: 'full' }
    ]
  }
];
