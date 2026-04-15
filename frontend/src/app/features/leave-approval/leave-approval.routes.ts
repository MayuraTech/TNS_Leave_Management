import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const LEAVE_APPROVAL_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: ['MANAGER', 'ADMINISTRATOR'] },
    children: [
      {
        path: 'pending',
        loadComponent: () =>
          import('./pending-requests/pending-requests.component').then(
            m => m.PendingRequestsComponent
          )
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('./team-calendar/team-calendar.component').then(m => m.TeamCalendarComponent)
      },
      { path: '', redirectTo: 'pending', pathMatch: 'full' }
    ]
  }
];
