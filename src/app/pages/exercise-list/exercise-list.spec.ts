import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Exercise } from '../../models/exercise';
import { ExerciseService } from '../../services/exercise.service';
import { ExerciseList } from './exercise-list';

describe('ExerciseList', () => {

  let component: ExerciseList;
  let fixture: ComponentFixture<ExerciseList>;

  // Der Service wird gemockt: der Unit Test prueft die Komponente, nicht HTTP.
  const serviceMock = {
    getAll: vi.fn()
  };

  const uebungen: Exercise[] = [
    { id: 1, name: 'Bankdruecken', weight: 60 },
    { id: 2, name: 'Kniebeuge', weight: 80 }
  ];

  /** Erzeugt einen HttpErrorResponse mit dem gewuenschten Statuscode. */
  function fehlerMit(status: number): HttpErrorResponse {
    return new HttpErrorResponse({ status, statusText: 'Fehler', url: '/api/exercise' });
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    serviceMock.getAll.mockReturnValue(of(uebungen));

    await TestBed.configureTestingModule({
      imports: [ExerciseList],
      providers: [
        { provide: ExerciseService, useValue: serviceMock }
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

    it('sollte die Uebungen beim Initialisieren laden', () => {
      fixture.detectChanges();

      expect(serviceMock.getAll).toHaveBeenCalledTimes(1);
      expect(component.exercises()).toEqual(uebungen);
    });
  });

  describe('load', () => {

    it('sollte die Uebungen in das Signal schreiben und loading zuruecksetzen', () => {
      component.load();

      expect(component.exercises()).toEqual(uebungen);
      expect(component.exercises().length).toBe(2);
      expect(component.loading()).toBe(false);
      expect(component.error()).toBe('');
    });

    it('sollte eine vorherige Fehlermeldung beim erneuten Laden loeschen', () => {
      serviceMock.getAll.mockReturnValueOnce(throwError(() => fehlerMit(500)));
      component.load();
      expect(component.error()).not.toBe('');

      serviceMock.getAll.mockReturnValueOnce(of(uebungen));
      component.load();

      expect(component.error()).toBe('');
      expect(component.exercises()).toEqual(uebungen);
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

    it('sollte fuer jede Uebung eine Zeile rendern', () => {
      fixture.detectChanges();

      const zeilen = fixture.nativeElement.querySelectorAll('tr[mat-row]');
      expect(zeilen.length).toBe(2);
      expect(fixture.nativeElement.textContent).toContain('Bankdruecken');
      expect(fixture.nativeElement.textContent).toContain('Kniebeuge');
    });

    it('sollte einen Hinweis anzeigen, wenn keine Uebungen erfasst sind', () => {
      serviceMock.getAll.mockReturnValue(of([]));

      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain('Noch keine Uebungen erfasst');
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

      const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
      button.click();

      expect(serviceMock.getAll).toHaveBeenCalledTimes(2);
    });
  });

  it('sollte die drei Tabellenspalten definieren', () => {
    expect(component.displayedColumns).toEqual(['id', 'name', 'weight']);
  });
});
