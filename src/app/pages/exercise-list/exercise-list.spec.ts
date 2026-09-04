import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthConfig, OAuthModule } from 'angular-oauth2-oidc';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Exercise } from '../../models/exercise';
import { ExerciseService } from '../../services/exercise.service';
import { authConfig } from '../../app.auth';
import { ExerciseList } from './exercise-list';

describe('ExerciseList', () => {

  let component: ExerciseList;
  let fixture: ComponentFixture<ExerciseList>;

  // Der Service wird gemockt: der Unit Test prüft die Komponente, nicht HTTP.
  const serviceMock = {
    getAll: vi.fn(),
    remove: vi.fn()
  };

  // MatDialog wird ersetzt: der Unit Test soll keinen echten Overlay öffnen.
  // afterClosed() liefert das, was der Benutzer im Dialog geklickt hätte.
  const dialogMock = {
    open: vi.fn()
  };

  function dialogAntwortet(confirmed: boolean | undefined): void {
    dialogMock.open.mockReturnValue({ afterClosed: () => of(confirmed) });
  }

  const exercises: Exercise[] = [
    { id: 1, name: 'Bankdrücken', weight: 60 },
    { id: 2, name: 'Kniebeuge', weight: 80 }
  ];

  /** Erzeugt einen HttpErrorResponse mit dem gewünschten Statuscode. */
  function fehlerMit(status: number): HttpErrorResponse {
    return new HttpErrorResponse({ status, statusText: 'Fehler', url: '/api/exercise' });
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    serviceMock.getAll.mockReturnValue(of(exercises));

    await TestBed.configureTestingModule({
      // Die Liste bindet über *appIsInRoles den AppAuthService ein, der den
      // OAuthService braucht - sonst scheitert schon createComponent (NG0201).
      imports: [
        ExerciseList,
        OAuthModule.forRoot({ resourceServer: { sendAccessToken: true } })
      ],
      providers: [
        { provide: ExerciseService, useValue: serviceMock },
        { provide: AuthConfig, useValue: authConfig },
        { provide: MatDialog, useValue: dialogMock },
        provideRouter([]),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExerciseList);
    component = fixture.componentInstance;
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeTruthy();
  });

  it('sollte vor dem Laden leer sein', () => {
    // noch kein detectChanges -> ngOnInit ist noch nicht gelaufen
    expect(component.exercises()).toEqual([]);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('');
  });

  describe('ngOnInit', () => {

    it('sollte die Übungen beim Initialisieren laden', () => {
      fixture.detectChanges();

      expect(serviceMock.getAll).toHaveBeenCalledTimes(1);
      expect(component.exercises()).toEqual(exercises);
    });
  });

  describe('load', () => {

    it('sollte die Übungen in das Signal schreiben und loading zurücksetzen', () => {
      component.load();

      expect(component.exercises()).toEqual(exercises);
      expect(component.exercises().length).toBe(2);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('');
    });

    it('sollte eine vorherige Fehlermeldung beim erneuten Laden löschen', () => {
      serviceMock.getAll.mockReturnValueOnce(throwError(() => fehlerMit(500)));
      component.load();
      expect(component.error()).not.toBe('');

      serviceMock.getAll.mockReturnValueOnce(of(exercises));
      component.load();

      expect(component.error()).toBe('');
      expect(component.exercises()).toEqual(exercises);
    });

    it('sollte bei Status 0 auf das nicht erreichbare Backend hinweisen', () => {
      serviceMock.getAll.mockReturnValue(throwError(() => fehlerMit(0)));

      component.load();

      expect(component.error()).toContain('Keine Verbindung');
      expect(component.loading()).toBe(false);
      expect(component.exercises()).toEqual([]);
    });

    it('sollte bei 401 auf den fehlenden Token hinweisen', () => {
      serviceMock.getAll.mockReturnValue(throwError(() => fehlerMit(401)));

      component.load();

      expect(component.error()).toContain('Nicht angemeldet');
    });

    it('sollte bei 403 auf die fehlende Rolle read hinweisen', () => {
      serviceMock.getAll.mockReturnValue(throwError(() => fehlerMit(403)));

      component.load();

      expect(component.error()).toContain('read');
    });

    it('sollte bei allen anderen Fehlern den Statuscode nennen', () => {
      serviceMock.getAll.mockReturnValue(throwError(() => fehlerMit(500)));

      component.load();

      expect(component.error()).toContain('500');
    });
  });

  describe('Template', () => {

    it('sollte für jede Übung eine Zeile rendern', () => {
      fixture.detectChanges();

      const zeilen = fixture.nativeElement.querySelectorAll('tr[mat-row]');
      expect(zeilen.length).toBe(2);
      expect(fixture.nativeElement.textContent).toContain('Bankdrücken');
      expect(fixture.nativeElement.textContent).toContain('Kniebeuge');
    });

    it('sollte einen Hinweis anzeigen, wenn keine Übungen erfasst sind', () => {
      serviceMock.getAll.mockReturnValue(of([]));

      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Noch keine Übungen erfasst');
    });

    it('sollte die Fehlermeldung statt der Tabelle anzeigen', () => {
      serviceMock.getAll.mockReturnValue(throwError(() => fehlerMit(403)));

      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('tr[mat-row]').length).toBe(0);
      expect(fixture.nativeElement.textContent).toContain('Keine Berechtigung');
    });

    it('sollte beim Klick auf Neu laden erneut laden', () => {
      fixture.detectChanges();
      expect(serviceMock.getAll).toHaveBeenCalledTimes(1);

      const button: HTMLButtonElement =
        fixture.nativeElement.querySelector('mat-card-actions button');
      button.click();

      expect(serviceMock.getAll).toHaveBeenCalledTimes(2);
    });

    it('sollte ohne Rolle update keine Schreib-Buttons zeigen', () => {
      fixture.detectChanges();

      // *appIsInRoles entfernt "Neue Übung" und die Bearbeiten-Icons aus dem DOM
      expect(fixture.nativeElement.textContent).not.toContain('Neue Übung');
      expect(fixture.nativeElement.querySelectorAll('button[mat-icon-button]').length).toBe(0);
    });
  });

  describe('deleteExercise', () => {

    it('sollte nach Bestätigung löschen und die Liste neu laden', () => {
      dialogAntwortet(true);
      component.load();
      expect(serviceMock.getAll).toHaveBeenCalledTimes(1);

      component.deleteExercise(exercises[0]);

      expect(dialogMock.open).toHaveBeenCalled();
      expect(serviceMock.remove).toHaveBeenCalledWith(1);
      expect(serviceMock.getAll).toHaveBeenCalledTimes(2);
    });

    it('sollte bei Abbruch nichts löschen', () => {
      dialogAntwortet(false);

      component.deleteExercise(exercises[0]);

      expect(serviceMock.remove).not.toHaveBeenCalled();
    });

    it('sollte auch bei geschlossenem Dialog ohne Antwort nichts löschen', () => {
      dialogAntwortet(undefined);

      component.deleteExercise(exercises[0]);

      expect(serviceMock.remove).not.toHaveBeenCalled();
    });

    it('sollte einen Fehler beim Löschen anzeigen', () => {
      dialogAntwortet(true);
      serviceMock.remove.mockReturnValue(throwError(() => fehlerMit(403)));

      component.deleteExercise(exercises[0]);

      expect(component.error()).toContain('403');
    });
  });

  describe('remove', () => {

    it('sollte direkt löschen und neu laden, ohne Dialog', () => {
      component.remove(2);

      expect(dialogMock.open).not.toHaveBeenCalled();
      expect(serviceMock.remove).toHaveBeenCalledWith(2);
      expect(serviceMock.getAll).toHaveBeenCalledTimes(1);
    });
  });

  it('sollte die vier Tabellenspalten definieren', () => {
    expect(component.displayedColumns).toEqual(['id', 'name', 'weight', 'actions']);
  });
});
