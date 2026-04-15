import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AuthUser, UserRole } from '../../../core/models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  currentUser: AuthUser | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  get isEmployee(): boolean {
    return this.authService.hasRole('EMPLOYEE');
  }

  get isManager(): boolean {
    return this.authService.hasRole('MANAGER');
  }

  get isAdmin(): boolean {
    return this.authService.hasRole('ADMINISTRATOR');
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
