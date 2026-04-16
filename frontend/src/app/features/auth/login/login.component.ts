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
      <div class="login-card">
        <div class="login-header">
          <h1>Leave Management</h1>
          <p>Sign in to your account</p>
        </div>

        <!-- Account locked banner -->
        <div *ngIf="isAccountLocked" class="alert alert-locked" role="alert">
          <strong>Account Locked</strong>
          <span>Your account has been locked due to multiple failed login attempts. Please try again after 15 minutes.</span>
        </div>

        <!-- General error banner -->
        <div *ngIf="errorMessage && !isAccountLocked" class="alert alert-error" role="alert">
          {{ errorMessage }}
        </div>

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
          <!-- Username / Email field -->
          <div class="form-group">
            <label for="usernameOrEmail">Username or Email</label>
            <input
              id="usernameOrEmail"
              type="text"
              formControlName="usernameOrEmail"
              [class.input-error]="isFieldInvalid('usernameOrEmail')"
              placeholder="Enter username or email"
              autocomplete="username"
            />
            <span *ngIf="isFieldInvalid('usernameOrEmail')" class="field-error">
              Username or email is required.
            </span>
          </div>

          <!-- Password field -->
          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              [class.input-error]="isFieldInvalid('password')"
              placeholder="Enter password"
              autocomplete="current-password"
            />
            <span *ngIf="isFieldInvalid('password')" class="field-error">
              <ng-container *ngIf="loginForm.get('password')?.errors?.['required']">Password is required.</ng-container>
              <ng-container *ngIf="loginForm.get('password')?.errors?.['minlength']">Password must be at least 6 characters.</ng-container>
            </span>
          </div>

          <!-- Submit button -->
          <button type="submit" class="btn-submit" [disabled]="isLoading">
            <span *ngIf="isLoading">Signing in...</span>
            <span *ngIf="!isLoading">Sign In</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f2f5;
      padding: 1rem;
      z-index: 2000;
    }

    .login-card {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.1);
      padding: 2.5rem 2rem;
      width: 100%;
      max-width: 400px;
    }

    .login-header {
      text-align: center;
      margin-bottom: 1.75rem;
    }

    .login-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #3f476e;
      margin: 0 0 0.25rem;
    }

    .login-header p {
      color: #6b7280;
      margin: 0;
      font-size: 0.9rem;
    }

    .alert {
      border-radius: 6px;
      padding: 0.75rem 1rem;
      margin-bottom: 1.25rem;
      font-size: 0.875rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .alert strong {
      font-weight: 600;
    }

    .alert-locked {
      background: #fff3cd;
      border: 1px solid #ffc107;
      color: #856404;
    }

    .alert-error {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #b91c1c;
    }

    .form-group {
      margin-bottom: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    input {
      padding: 0.625rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.9rem;
      outline: none;
      transition: border-color 0.15s;
    }

    input:focus {
      border-color: #4E92F8;
      box-shadow: 0 0 0 3px rgba(78, 146, 248, 0.1);
    }

    input.input-error {
      border-color: #ef4444;
    }

    .field-error {
      font-size: 0.8rem;
      color: #ef4444;
    }

    .btn-submit {
      width: 100%;
      padding: 0.7rem;
      background: #3f476e;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      margin-top: 0.5rem;
      transition: background 0.15s;
    }

    .btn-submit:hover:not(:disabled) {
      background: #29196f;
    }

    .btn-submit:disabled {
      background: #c9c9c9;
      cursor: not-allowed;
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
