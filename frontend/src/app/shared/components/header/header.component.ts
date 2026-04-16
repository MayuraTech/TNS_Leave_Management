import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthUser } from '../../../core/models/user.model';
import { SidebarService } from '../../../core/services/sidebar.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isOpen = true;
  currentUser: AuthUser | null = null;

  constructor(
    private authService: AuthService,
    private sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.sidebarService.isOpen$.subscribe(isOpen => {
      this.isOpen = isOpen;
    });
  }

  toggleSidebar(): void {
    this.sidebarService.toggle();
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

  logout(): void {
    this.authService.logout();
  }
}
