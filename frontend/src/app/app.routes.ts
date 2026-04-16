import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Public routes
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  // Protected routes
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      // Dashboard (all authenticated users)
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(
            m => m.DASHBOARD_ROUTES
          )
      },

      // Leave requests (all authenticated users)
      {
        path: 'leave',
        loadChildren: () =>
          import('./features/leave-requests/leave-requests.routes').then(
            m => m.LEAVE_REQUESTS_ROUTES
          )
      },

      // Leave approval (Manager + Administrator)
      {
        path: 'approval',
        loadChildren: () =>
          import('./features/leave-approval/leave-approval.routes').then(
            m => m.LEAVE_APPROVAL_ROUTES
          )
      },

      // User management (Administrator only)
      {
        path: 'admin/users',
        loadChildren: () =>
          import('./features/user-management/user-management.routes').then(
            m => m.USER_MANAGEMENT_ROUTES
          )
      },

      // Leave policy (Administrator only)
      {
        path: 'admin/policy',
        loadChildren: () =>
          import('./features/leave-policy/leave-policy.routes').then(
            m => m.LEAVE_POLICY_ROUTES
          )
      },

      // Reports (Administrator only)
      {
        path: 'admin/reports',
        loadChildren: () =>
          import('./features/reports/reports.routes').then(m => m.REPORTS_ROUTES)
      },

      // Default redirect
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Unauthorized access page
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/auth/unauthorized/unauthorized.component').then(
        m => m.UnauthorizedComponent
      )
  },

  // Fallback
  { path: '**', redirectTo: 'auth/login' }
];
