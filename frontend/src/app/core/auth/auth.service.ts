import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from '../services/api.service';
import { AuthUser, UserRole } from '../models/user.model';

interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

interface LoginResponse {
  token: string;
  expiresIn: number;
  user: { id: number; username: string; roles: UserRole[] };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private api: ApiService, private router: Router) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.api.post<LoginResponse>('/auth/login', credentials).pipe(
      tap(res => {
        const authUser: AuthUser = { ...res.user, token: res.token, expiresIn: res.expiresIn };
        sessionStorage.setItem(this.TOKEN_KEY, JSON.stringify(authUser));
        this.currentUserSubject.next(authUser);
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this.currentUserSubject.value?.token ?? null;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  hasRole(role: UserRole): boolean {
    return this.currentUserSubject.value?.roles.includes(role) ?? false;
  }

  hasAnyRole(roles: UserRole[]): boolean {
    return roles.some(r => this.hasRole(r));
  }

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  private loadUser(): AuthUser | null {
    try {
      const raw = sessionStorage.getItem(this.TOKEN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
