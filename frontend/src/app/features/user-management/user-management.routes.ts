import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';

export const USER_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: { roles: ['ADMINISTRATOR'] },
    children: [
      {
        path: 'users',
        loadComponent: () =>
          import('./user-list/user-list.component').then(m => m.UserListComponent)
      },
      {
        path: 'users/create',
        loadComponent: () =>
          import('./user-create/user-create.component').then(m => m.UserCreateComponent)
      },
      {
        path: 'users/:id/edit',
        loadComponent: () =>
          import('./user-edit/user-edit.component').then(m => m.UserEditComponent)
      },
      {
        path: 'departments',
        loadComponent: () =>
          import('./department-management/department-management.component').then(
            m => m.DepartmentManagementComponent
          )
      },
      {
        path: 'teams',
        loadComponent: () =>
          import('./team-management/team-management.component').then(
            m => m.TeamManagementComponent
          )
      },
      { path: '', redirectTo: 'users', pathMatch: 'full' }
    ]
  }
];
