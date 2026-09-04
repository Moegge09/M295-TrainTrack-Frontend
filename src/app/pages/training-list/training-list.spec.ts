import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { AuthConfig, OAuthModule } from 'angular-oauth2-oidc';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authConfig } from '../../app.auth';
import { Training } from '../../models/training';
import { TrainingService } from '../../services/training.service';
import { TrainingList } from './training-list';

describe('TrainingList', () => {

  let component: TrainingList;
  let fixture: ComponentFixture<TrainingList>;

  const serviceMock = { getAll: vi.fn(), remove: vi.fn() };
  const dialogMock = { open: vi.fn() };

  function dialogAntwortet(confirmed: boolean | undefined): void {
    dialogMock.open.mockReturnValue({ afterClosed: () => of(confirmed) });
  }

  const trainings: Training[] = [
    {
      id: 1,
      name: 'Push',
      day: 'MONDAY',
      exercises: [
        { id: 1, name: 'Bankdrücken', weight: 60 },
        { id: 2, name: 'Schulterdrücken', weight: 30 },
      ],
      gym: { id: 1, name: 'Kraftraum Zürich', address: { street: '', houseNumber: '', plz: '', city: '', country: '' } }
    }
  ];

  function fehlerMit(status: number): HttpErrorResponse {
    return new HttpErrorResponse({ status, statusText: 'Fehler' });
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    serviceMock.getAll.mockReturnValue(of(trainings));
    serviceMock.remove.mockReturnValue(of({ message: 'Training 1 deleted' }));
    dialogAntwortet(true);

    await TestBed.configureTestingModule({
      imports: [TrainingList, OAuthModule.forRoot({ resourceServer: { sendAccessToken: true } })],
      providers: [
        { provide: TrainingService, useValue: serviceMock },
        { provide: AuthConfig, useValue: authConfig },
        { provide: MatDialog, useValue: dialogMock },
        provideRouter([]),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrainingList);
    component = fixture.componentInstance;
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeTruthy();
  });

  it('sollte die Trainings beim Initialisieren laden', () => {
    fixture.detectChanges();

    expect(serviceMock.getAll).toHaveBeenCalledTimes(1);
    expect(component.trainings()).toEqual(trainings);
  });

  it('sollte bei 403 auf die Rolle update hinweisen', () => {
    serviceMock.getAll.mockReturnValue(throwError(() => fehlerMit(403)));

    component.load();

    expect(component.error()).toContain('update');
  });

  describe('Anzeigehilfen', () => {

    it('sollte den Wochentag auf Deutsch anzeigen', () => {
      expect(component.dayLabel(trainings[0])).toBe('Montag');
    });

    it('sollte einen unbekannten Wochentag unverändert durchreichen', () => {
      const training = { ...trainings[0], day: 'HOLIDAY' } as unknown as Training;

      expect(component.dayLabel(training)).toBe('HOLIDAY');
    });

    it('sollte den Gym-Namen anzeigen und ohne Gym einen Strich', () => {
      expect(component.gymName(trainings[0])).toBe('Kraftraum Zürich');
      expect(component.gymName({ ...trainings[0], gym: null })).toBe('-');
    });

    it('sollte die Übungen zählen', () => {
      expect(component.exerciseCount(trainings[0])).toBe(2);
      expect(component.exerciseCount({ ...trainings[0], exercises: [] })).toBe(0);
    });
  });

  describe('deleteTraining', () => {

    it('sollte nach Bestätigung löschen und neu laden', () => {
      component.load();

      component.deleteTraining(trainings[0]);

      expect(serviceMock.remove).toHaveBeenCalledWith(1);
      expect(serviceMock.getAll).toHaveBeenCalledTimes(2);
    });

    it('sollte bei Abbruch nichts löschen', () => {
      dialogAntwortet(false);

      component.deleteTraining(trainings[0]);

      expect(serviceMock.remove).not.toHaveBeenCalled();
    });
  });

  it('sollte ohne Rolle update keine Schreib-Buttons zeigen', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Neues Training');
    expect(fixture.nativeElement.querySelectorAll('button[mat-icon-button]').length).toBe(0);
  });
});
