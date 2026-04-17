import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-wrapper">
      <!-- Left panel - branding -->
      <div class="login-left">
        <div class="brand-content">
          <div class="brand-logo">
            <span class="logo-icon">🏢</span>
          </div>
          <h1 class="brand-title">TNS Leave<br><span>Management</span></h1>
          <p class="brand-tagline">Streamline your team's time-off requests with ease and transparency.</p>
          <div class="brand-features">
            <div class="feature-item">
              <span class="feature-icon">✅</span>
              <span>Smart leave approvals</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📊</span>
              <span>Real-time balance tracking</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🔔</span>
              <span>Instant notifications</span>
            </div>
          </div>
        </div>
        <div class="brand-decoration">
          <div class="deco-circle deco-1"></div>
          <div class="deco-circle deco-2"></div>
          <div class="deco-circle deco-3"></div>
        </div>
      </div>

      <!-- Right panel - form -->
      <div class="login-right">
        <div class="login-card">
          <div class="login-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          <!-- Account locked banner -->
          <div *ngIf="isAccountLocked" class="alert alert-locked" role="alert">
            <span class="alert-icon">🔒</span>
            <div>
              <strong>Account Locked</strong>
              <p>Too many failed attempts. Please try again after 1 minute.</p>
            </div>
          </div>

          <!-- General error banner -->
          <div *ngIf="errorMessage && !isAccountLocked" class="alert alert-error" role="alert">
            <span class="alert-icon">⚠️</span>
            <span>{{ errorMessage }}</span>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
            <!-- Username / Email field -->
            <div class="form-group">
              <label for="usernameOrEmail">Username or Email</label>
              <div class="input-wrapper">
                <span class="input-icon">👤</span>
                <input
                  id="usernameOrEmail"
                  type="text"
                  formControlName="usernameOrEmail"
                  [class.input-error]="isFieldInvalid('usernameOrEmail')"
                  placeholder="Enter username or email"
                  autocomplete="username"
                />
              </div>
              <span *ngIf="isFieldInvalid('usernameOrEmail')" class="field-error">
                Username or email is required.
              </span>
            </div>

            <!-- Password field -->
            <div class="form-group">
              <label for="password">Password</label>
              <div class="input-wrapper">
                <span class="input-icon">🔑</span>
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  [class.input-error]="isFieldInvalid('password')"
                  placeholder="Enter password"
                  autocomplete="current-password"
                />
              </div>
              <span *ngIf="isFieldInvalid('password')" class="field-error">
                <ng-container *ngIf="loginForm.get('password')?.errors?.['required']">Password is required.</ng-container>
                <ng-container *ngIf="loginForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters.</ng-container>
              </span>
            </div>

            <!-- Submit button -->
            <button type="submit" class="btn-submit" [disabled]="isLoading">
              <span class="btn-spinner" *ngIf="isLoading"></span>
              <span>{{ isLoading ? 'Signing in...' : 'Sign In' }}</span>
              <span *ngIf="!isLoading" class="btn-arrow">→</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      position: fixed;
      inset: 0;
      display: flex;
      z-index: 2000;
      font-family: 'Outfit', sans-serif;
    }

    /* ---- Left branding panel ---- */
    .login-left {
      flex: 1;
      background: linear-gradient(145deg, #29196f 0%, #3f476e 60%, #181c80 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      position: relative;
      overflow: hidden;

      @media (max-width: 768px) { display: none; }
    }

    .brand-content {
      position: relative;
      z-index: 2;
      color: #fff;
      max-width: 380px;
    }

    .brand-logo {
      width: 64px;
      height: 64px;
      background: rgba(78, 146, 248, 0.2);
      border: 1px solid rgba(78, 146, 248, 0.4);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin-bottom: 1.5rem;
      backdrop-filter: blur(8px);
    }

    .brand-title {
      font-size: 2.5rem;
      font-weight: 700;
      line-height: 1.15;
      margin: 0 0 1rem;
      letter-spacing: -0.02em;

      span { color: #4E92F8; }
    }

    .brand-tagline {
      font-size: 1rem;
      color: rgba(179, 217, 255, 0.85);
      line-height: 1.6;
      margin: 0 0 2rem;
    }

    .brand-features {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.8);

      .feature-icon {
        width: 32px;
        height: 32px;
        background: rgba(78, 146, 248, 0.15);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
        flex-shrink: 0;
      }
    }

    /* Decorative circles */
    .brand-decoration { position: absolute; inset: 0; z-index: 1; pointer-events: none; }

    .deco-circle {
      position: absolute;
      border-radius: 50%;
      border: 1px solid rgba(78, 146, 248, 0.15);
    }

    .deco-1 {
      width: 400px; height: 400px;
      bottom: -150px; right: -100px;
      background: radial-gradient(circle, rgba(78, 146, 248, 0.08) 0%, transparent 70%);
    }

    .deco-2 {
      width: 250px; height: 250px;
      top: -80px; left: -60px;
      background: radial-gradient(circle, rgba(98, 195, 250, 0.06) 0%, transparent 70%);
    }

    .deco-3 {
      width: 150px; height: 150px;
      top: 40%; right: 10%;
      background: radial-gradient(circle, rgba(204, 122, 242, 0.08) 0%, transparent 70%);
    }

    /* ---- Right form panel ---- */
    .login-right {
      width: 480px;
      background: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;

      @media (max-width: 768px) {
        width: 100%;
        background: linear-gradient(145deg, #29196f 0%, #3f476e 100%);
      }
    }

    .login-card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 20px 48px rgba(41, 25, 111, 0.12);
      padding: 2.5rem;
      width: 100%;
      max-width: 400px;
      animation: slideUp 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .login-header {
      margin-bottom: 1.75rem;

      h2 {
        font-size: 1.75rem;
        font-weight: 700;
        color: #29196f;
        margin: 0 0 0.375rem;
        letter-spacing: -0.02em;
      }

      p {
        color: #6b7280;
        margin: 0;
        font-size: 0.9rem;
      }
    }

    /* Alerts */
    .alert {
      border-radius: 10px;
      padding: 0.875rem 1rem;
      margin-bottom: 1.25rem;
      font-size: 0.875rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;

      .alert-icon { font-size: 1.1rem; flex-shrink: 0; margin-top: 1px; }

      strong { display: block; font-weight: 600; margin-bottom: 2px; }
      p { margin: 0; font-size: 0.8rem; opacity: 0.85; }
    }

    .alert-locked {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      color: #92400e;
    }

    .alert-error {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #b91c1c;
    }

    /* Form */
    .form-group {
      margin-bottom: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    label {
      font-size: 0.8rem;
      font-weight: 600;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      font-size: 1rem;
      pointer-events: none;
      z-index: 1;
    }

    input {
      width: 100%;
      padding: 0.7rem 0.75rem 0.7rem 2.5rem;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      font-size: 0.9rem;
      font-family: 'Outfit', sans-serif;
      color: #111827;
      background: #f9fafb;
      outline: none;
      transition: all 200ms ease;

      &:focus {
        border-color: #4E92F8;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(78, 146, 248, 0.12);
      }

      &.input-error {
        border-color: #ef4444;
        background: #fef2f2;
      }

      &::placeholder { color: #9ca3af; }
    }

    .field-error {
      font-size: 0.78rem;
      color: #ef4444;
      display: flex;
      align-items: center;
      gap: 4px;

      &::before { content: '⚠'; font-size: 0.7rem; }
    }

    /* Submit button */
    .btn-submit {
      width: 100%;
      padding: 0.8rem;
      background: linear-gradient(135deg, #4E92F8, #3498db);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      font-family: 'Outfit', sans-serif;
      cursor: pointer;
      margin-top: 0.75rem;
      transition: all 200ms ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      letter-spacing: 0.01em;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #409eff, #2980b9);
        transform: translateY(-1px);
        box-shadow: 0 8px 24px rgba(78, 146, 248, 0.35);
      }

      &:active:not(:disabled) { transform: scale(0.98); }

      &:disabled {
        background: #c9c9c9;
        cursor: not-allowed;
        transform: none;
      }

      .btn-arrow { font-size: 1.1rem; transition: transform 200ms ease; }
      &:hover:not(:disabled) .btn-arrow { transform: translateX(3px); }
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 600ms linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  isAccountLocked = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.isAccountLocked = false;

    const { usernameOrEmail, password } = this.loginForm.value;

    this.authService.login({ usernameOrEmail, password }).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.isLoading = false;
        const message: string =
          err.error?.message ?? 'Invalid credentials. Please try again.';
        this.isAccountLocked = message.toLowerCase().includes('locked');
        this.errorMessage = this.isAccountLocked ? '' : message;
      }
    });
  }
}
