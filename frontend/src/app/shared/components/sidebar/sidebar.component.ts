import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthUser } from '../../../core/models/user.model';
import { SidebarService } from '../../../core/services/sidebar.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles?: ('EMPLOYEE' | 'MANAGER' | 'ADMINISTRATOR')[];
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  isOpen = true; // Start open on desktop
  currentUser: AuthUser | null = null;

  navItems: NavItem[] = [
    { label: 'Dashboard',    route: '/dashboard',              icon: '🏠',          exact: true },
    { label: 'My Leave',     route: '/leave',                  icon: '📋',          exact: true },
    { label: 'Apply Leave',  route: '/leave/new',              icon: '➕',          exact: true },
    { label: 'Approvals',    route: '/approval',               icon: '✅',          exact: false, roles: ['MANAGER', 'ADMINISTRATOR'] },
    { label: 'Users',        route: '/admin/users',            icon: '👥',          exact: true,  roles: ['ADMINISTRATOR'] },
    { label: 'Departments',  route: '/admin/users/departments',icon: '🏢',          exact: true,  roles: ['ADMINISTRATOR'] },
    { label: 'Teams',        route: '/admin/users/teams',      icon: '👨‍👩‍👧‍👦',  exact: true,  roles: ['ADMINISTRATOR'] },
    { label: 'Leave Policy', route: '/admin/policy',           icon: '📜',          exact: true,  roles: ['ADMINISTRATOR'] },
    { label: 'Holidays',     route: '/admin/policy/holidays',  icon: '🗓️',         exact: true,  roles: ['ADMINISTRATOR'] },
    { label: 'Reports',      route: '/admin/reports',          icon: '📊',          exact: true,  roles: ['ADMINISTRATOR'] },
    { label: 'Audit Trail',  route: '/admin/reports/audit',    icon: '🪲',          exact: true,  roles: ['ADMINISTRATOR'] }
  ];

  visibleItems: NavItem[] = [];

  constructor(
    private authService: AuthService,
    private sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.visibleItems = this.navItems.filter(item =>
        !item.roles || this.authService.hasAnyRole(item.roles)
      );
    });

    // Subscribe to sidebar state
    this.sidebarService.isOpen$.subscribe(isOpen => {
      this.isOpen = isOpen;
    });
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
  }

  closeSidebar(): void {
    if (window.innerWidth < 768) {
      this.sidebarService.setOpen(false);
    }
  }

  get displayName(): string {
    return this.currentUser?.username ?? '';
  }

  get roleLabel(): string {
    const roles = this.currentUser?.roles ?? [];
    if (roles.includes('ADMINISTRATOR')) return 'Administrator';
    if (roles.includes('MANAGER')) return 'Manager';
    return 'Employee';
  }
}
