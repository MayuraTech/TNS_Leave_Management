import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const LEAVE_REQUESTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./request-list/request-list.component').then(m => m.RequestListComponent)
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./request-form/request-form.component').then(m => m.RequestFormComponent)
      },
      {
        path: 'balance',
        loadComponent: () =>
          import('./leave-balance/leave-balance.component').then(m => m.LeaveBalanceComponent)
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./request-detail/request-detail.component').then(m => m.RequestDetailComponent)
      }
    ]
  }
];
