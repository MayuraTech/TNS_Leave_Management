import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { RequestFormComponent } from './request-form.component';
import { LeaveService } from '../../../core/services/leave.service';

/**
 * Unit tests for RequestFormComponent
 * Validates: Requirements 7.3, 7.4
 */
describe('RequestFormComponent', () => {
  let component: RequestFormComponent;
  let fixture: ComponentFixture<RequestFormComponent>;
  let leaveServiceSpy: jasmine.SpyObj<LeaveService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    leaveServiceSpy = jasmine.createSpyObj('LeaveService', [
      'getLeaveTypes',
      'getLeaveBalances',
      'submitLeaveRequest'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    leaveServiceSpy.getLeaveTypes.and.returnValue(of([]));
    leaveServiceSpy.getLeaveBalances.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [RequestFormComponent, ReactiveFormsModule],
      providers: [
        { provide: LeaveService, useValue: leaveServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RequestFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Half-day: sessionType required ───────────────────────────────────────

  describe('half-day form requires session type (Requirement 7.3)', () => {
    beforeEach(() => {
      component.setDurationType('HALF_DAY');
    });

    it('should be invalid when sessionType is not set', () => {
      component.form.patchValue({
        leaveTypeId: '1',
        startDate: '2025-09-01',
        reason: 'Medical appointment'
      });
      // sessionType is null (not set)
      expect(component.form.get('sessionType')!.invalid).toBeTrue();
      expect(component.form.invalid).toBeTrue();
    });

    it('should be valid when sessionType is MORNING', () => {
      component.form.patchValue({
        leaveTypeId: '1',
        startDate: '2025-09-01',
        sessionType: 'MORNING',
        reason: 'Medical appointment'
      });
      expect(component.form.get('sessionType')!.valid).toBeTrue();
    });

    it('should be valid when sessionType is AFTERNOON', () => {
      component.form.patchValue({
        leaveTypeId: '1',
        startDate: '2025-09-01',
        sessionType: 'AFTERNOON',
        reason: 'Medical appointment'
      });
      expect(component.form.get('sessionType')!.valid).toBeTrue();
    });

    it('should have required error on sessionType when value is null', () => {
      const ctrl = component.form.get('sessionType')!;
      ctrl.markAsTouched();
      expect(ctrl.errors?.['required']).toBeTrue();
    });
  });

  // ─── Hourly: durationInHours required and within 0.5–8 ───────────────────

  describe('hourly form requires hours within 0.5–8 range (Requirement 7.4)', () => {
    beforeEach(() => {
      component.setDurationType('HOURLY');
    });

    it('should be invalid when durationInHours is not set', () => {
      component.form.patchValue({
        leaveTypeId: '1',
        startDate: '2025-09-01',
        reason: 'Errand'
      });
      expect(component.form.get('durationInHours')!.invalid).toBeTrue();
      expect(component.form.invalid).toBeTrue();
    });

    it('should have required error when durationInHours is null', () => {
      const ctrl = component.form.get('durationInHours')!;
      ctrl.markAsTouched();
      expect(ctrl.errors?.['required']).toBeTrue();
    });

    it('should be invalid when durationInHours is below minimum (0.5)', () => {
      component.form.get('durationInHours')!.setValue(0.25);
      expect(component.form.get('durationInHours')!.errors?.['min']).toBeTruthy();
    });

    it('should be invalid when durationInHours exceeds maximum (8)', () => {
      component.form.get('durationInHours')!.setValue(9);
      expect(component.form.get('durationInHours')!.errors?.['max']).toBeTruthy();
    });

    it('should be valid at the minimum boundary value of 0.5', () => {
      component.form.patchValue({
        leaveTypeId: '1',
        startDate: '2025-09-01',
        durationInHours: 0.5,
        reason: 'Errand'
      });
      expect(component.form.get('durationInHours')!.valid).toBeTrue();
    });

    it('should be valid at the maximum boundary value of 8', () => {
      component.form.patchValue({
        leaveTypeId: '1',
        startDate: '2025-09-01',
        durationInHours: 8,
        reason: 'Errand'
      });
      expect(component.form.get('durationInHours')!.valid).toBeTrue();
    });

    it('should be valid for a mid-range value like 4', () => {
      component.form.patchValue({
        leaveTypeId: '1',
        startDate: '2025-09-01',
        durationInHours: 4,
        reason: 'Errand'
      });
      expect(component.form.get('durationInHours')!.valid).toBeTrue();
    });
  });

  // ─── End date before start date ───────────────────────────────────────────

  describe('form is invalid when end date is before start date', () => {
    beforeEach(() => {
      component.setDurationType('FULL_DAY');
    });

    it('should have endBeforeStart error when endDate is before startDate', () => {
      component.form.patchValue({
        leaveTypeId: '1',
        startDate: '2025-09-10',
        endDate: '2025-09-05',
        reason: 'Vacation'
      });
      expect(component.form.errors?.['endBeforeStart']).toBeTrue();
      expect(component.form.invalid).toBeTrue();
    });

    it('should be valid when endDate equals startDate', () => {
      component.form.patchValue({
        leaveTypeId: '1',
        startDate: '2025-09-10',
        endDate: '2025-09-10',
        reason: 'Vacation'
      });
      expect(component.form.errors?.['endBeforeStart']).toBeFalsy();
    });

    it('should be valid when endDate is after startDate', () => {
      component.form.patchValue({
        leaveTypeId: '1',
        startDate: '2025-09-10',
        endDate: '2025-09-15',
        reason: 'Vacation'
      });
      expect(component.form.errors?.['endBeforeStart']).toBeFalsy();
    });

    it('should not apply endBeforeStart error when dates are not yet set', () => {
      // Fresh form with no dates
      expect(component.form.errors?.['endBeforeStart']).toBeFalsy();
    });
  });
});
