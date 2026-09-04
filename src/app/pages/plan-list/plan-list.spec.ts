import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { AuthConfig, OAuthModule } from 'angular-oauth2-oidc';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authConfig } from '../../app.auth';
import { Plan } from '../../models/plan';
import { PlanService } from '../../services/plan.service';
import { PlanList } from './plan-list';

describe('PlanList', () => {

  let component: PlanList;
  let fixture: ComponentFixture<PlanList>;

  const serviceMock = { getAll: vi.fn(), remove: vi.fn() };
  const dialogMock = { open: vi.fn() };

  function dialogAntwortet(confirmed: boolean | undefined): void {
    dialogMock.open.mockReturnValue({ afterClosed: () => of(confirmed) });
  }

  const plans: Plan[] = [
    {
      id: 1,
      name: 'Woche A',
      trainings: [
        { id: 1, name: 'Push', day: 'MONDAY', exercises: [], gym: null },
        { id: 2, name: 'Pull', day: 'THURSDAY', exercises: [], gym: null },
      ]
    }
  ];

  function fehlerMit(status: number): HttpErrorResponse {
    return new HttpErrorResponse({ status, statusText: 'Fehler' });
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    serviceMock.getAll.mockReturnValue(of(plans));
    serviceMock.remove.mockReturnValue(of({ message: 'Plan 1 deleted' }));
    dialogAntwortet(true);

    await TestBed.configureTestingModule({
      imports: [PlanList, OAuthModule.forRoot({ resourceServer: { sendAccessToken: true } })],
      providers: [
        { provide: PlanService, useValue: serviceMock },
        { provide: AuthConfig, useValue: authConfig },
        { provide: MatDialog, useValue: dialogMock },
        provideRouter([]),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlanList);
    component = fixture.componentInstance;
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeTruthy();
  });

  it('sollte die Pläne beim Initialisieren laden', () => {
    fixture.detectChanges();

    expect(serviceMock.getAll).toHaveBeenCalledTimes(1);
    expect(component.plans()).toEqual(plans);
  });

  it('sollte bei 403 auf die Rolle admin hinweisen', () => {
    serviceMock.getAll.mockReturnValue(throwError(() => fehlerMit(403)));

    component.load();

    expect(component.error()).toContain('admin');
  });

  describe('trainingNames', () => {

    it('sollte die Namen kommagetrennt auflisten', () => {
      expect(component.trainingNames(plans[0])).toBe('Push, Pull');
    });

    it('sollte einen Strich zeigen, wenn kein Training zugeordnet ist', () => {
      expect(component.trainingNames({ ...plans[0], trainings: [] })).toBe('-');
    });
  });

  describe('deletePlan', () => {

    it('sollte nach Bestätigung löschen und neu laden', () => {
      component.load();

      component.deletePlan(plans[0]);

      expect(serviceMock.remove).toHaveBeenCalledWith(1);
      expect(serviceMock.getAll).toHaveBeenCalledTimes(2);
    });

    it('sollte bei Abbruch nichts löschen', () => {
      dialogAntwortet(false);

      component.deletePlan(plans[0]);

      expect(serviceMock.remove).not.toHaveBeenCalled();
    });
  });

  it('sollte ohne Rolle admin keine Schreib-Buttons zeigen', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Neuer Plan');
    expect(fixture.nativeElement.querySelectorAll('button[mat-icon-button]').length).toBe(0);
  });
});
