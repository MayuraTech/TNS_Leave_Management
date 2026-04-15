import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/auth/auth.service';

/**
 * Unit tests for LoginComponent
 * Validates: Requirements 14.1
 */
describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'isAuthenticated']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    authServiceSpy.isAuthenticated.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Form validation ───────────────────────────────────────────────────────

  describe('form validation', () => {
    it('should initialise with an invalid form when fields are empty', () => {
      expect(component.loginForm.invalid).toBeTrue();
    });

    it('should mark usernameOrEmail as invalid when empty and touched', () => {
      const control = component.loginForm.get('usernameOrEmail')!;
      control.markAsTouched();
      expect(control.invalid).toBeTrue();
      expect(control.errors?.['required']).toBeTrue();
    });

    it('should mark password as invalid when empty and touched', () => {
      const control = component.loginForm.get('password')!;
      control.markAsTouched();
      expect(control.invalid).toBeTrue();
      expect(control.errors?.['required']).toBeTrue();
    });

    it('should mark password as invalid when shorter than 6 characters', () => {
      const control = component.loginForm.get('password')!;
      control.setValue('abc');
      control.markAsTouched();
      expect(control.errors?.['minlength']).toBeTruthy();
    });

    it('should not call AuthService.login when form is submitted with empty fields', () => {
      component.onSubmit();
      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched when submitted with empty fields', () => {
      component.onSubmit();
      expect(component.loginForm.get('usernameOrEmail')!.touched).toBeTrue();
      expect(component.loginForm.get('password')!.touched).toBeTrue();
    });

    it('should be valid when both fields are filled correctly', () => {
      component.loginForm.setValue({ usernameOrEmail: 'user@example.com', password: 'secret123' });
      expect(component.loginForm.valid).toBeTrue();
    });
  });

  // ─── Successful login ──────────────────────────────────────────────────────

  describe('successful login', () => {
    beforeEach(() => {
      component.loginForm.setValue({ usernameOrEmail: 'user@example.com', password: 'secret123' });
      authServiceSpy.login.and.returnValue(of({} as any));
    });

    it('should call AuthService.login with the form credentials', () => {
      component.onSubmit();
      expect(authServiceSpy.login).toHaveBeenCalledOnceWith({
        usernameOrEmail: 'user@example.com',
        password: 'secret123'
      });
    });

    it('should navigate to /leave on successful login', fakeAsync(() => {
      component.onSubmit();
      tick();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/leave']);
    }));

    it('should clear any previous error message on successful login', fakeAsync(() => {
      component.errorMessage = 'Previous error';
      component.onSubmit();
      tick();
      expect(component.errorMessage).toBe('');
    }));

    it('should set isLoading to false after successful login', fakeAsync(() => {
      component.onSubmit();
      tick();
      expect(component.isLoading).toBeFalse();
    }));
  });

  // ─── Failed login ──────────────────────────────────────────────────────────

  describe('failed login', () => {
    it('should display an error message when credentials are invalid', fakeAsync(() => {
      component.loginForm.setValue({ usernameOrEmail: 'user@example.com', password: 'wrongpass' });
      const errorResponse = new HttpErrorResponse({
        error: { message: 'Invalid credentials. Please try again.' },
        status: 401
      });
      authServiceSpy.login.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();
      tick();

      expect(component.errorMessage).toBe('Invalid credentials. Please try again.');
      expect(component.isAccountLocked).toBeFalse();
    }));

    it('should display account-locked state when the error message contains "locked"', fakeAsync(() => {
      component.loginForm.setValue({ usernameOrEmail: 'user@example.com', password: 'wrongpass' });
      const errorResponse = new HttpErrorResponse({
        error: { message: 'Account locked due to multiple failed attempts.' },
        status: 403
      });
      authServiceSpy.login.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();
      tick();

      expect(component.isAccountLocked).toBeTrue();
      expect(component.errorMessage).toBe('');
    }));

    it('should fall back to a default error message when the server provides none', fakeAsync(() => {
      component.loginForm.setValue({ usernameOrEmail: 'user@example.com', password: 'wrongpass' });
      const errorResponse = new HttpErrorResponse({ status: 500 });
      authServiceSpy.login.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();
      tick();

      expect(component.errorMessage).toBe('Invalid credentials. Please try again.');
    }));

    it('should set isLoading to false after a failed login', fakeAsync(() => {
      component.loginForm.setValue({ usernameOrEmail: 'user@example.com', password: 'wrongpass' });
      authServiceSpy.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

      component.onSubmit();
      tick();

      expect(component.isLoading).toBeFalse();
    }));

    it('should not navigate to dashboard on failed login', fakeAsync(() => {
      component.loginForm.setValue({ usernameOrEmail: 'user@example.com', password: 'wrongpass' });
      authServiceSpy.login.and.returnValue(throwError(() => new HttpErrorResponse({ status: 401 })));

      component.onSubmit();
      tick();

      expect(routerSpy.navigate).not.toHaveBeenCalledWith(['/leave']);
    }));
  });

  // ─── Already authenticated ─────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should redirect to /leave if user is already authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(true);
      component.ngOnInit();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/leave']);
    });

    it('should not redirect if user is not authenticated', () => {
      authServiceSpy.isAuthenticated.and.returnValue(false);
      component.ngOnInit();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });
});
