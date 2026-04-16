import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles?: ('EMPLOYEE' | 'MANAGER' | 'ADMINISTRATOR')[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  navItems: NavItem[] = [
    { label: 'My Leave', route: '/leave', icon: '📋' },
    { label: 'Apply Leave', route: '/leave/new', icon: '➕' },
    { label: 'Approvals', route: '/approval', icon: '✅', roles: ['MANAGER', 'ADMINISTRATOR'] },
    { label: 'Users', route: '/admin/users', icon: '👥', roles: ['ADMINISTRATOR'] },
    { label: 'Departments', route: '/admin/users/departments', icon: '🏢', roles: ['ADMINISTRATOR'] },
    { label: 'Teams', route: '/admin/users/teams', icon: '👨‍👩‍👧‍👦', roles: ['ADMINISTRATOR'] },
    { label: 'Leave Policy', route: '/admin/policy', icon: '📜', roles: ['ADMINISTRATOR'] },
    { label: 'Reports', route: '/admin/reports', icon: '📊', roles: ['ADMINISTRATOR'] },
    { label: 'Audit Trail', route: '/admin/reports/audit', icon: '🔍', roles: ['ADMINISTRATOR'] }
  ];

  visibleItems: NavItem[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(() => {
      this.visibleItems = this.navItems.filter(item =>
        !item.roles || this.authService.hasAnyRole(item.roles)
      );
    });
  }
}
