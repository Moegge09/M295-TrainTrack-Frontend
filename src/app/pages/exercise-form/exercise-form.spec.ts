import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Exercise } from '../../models/exercise';
import { ExerciseService } from '../../services/exercise.service';
import { ExerciseForm } from './exercise-form';

describe('ExerciseForm', () => {

  let component: ExerciseForm;
  let fixture: ComponentFixture<ExerciseForm>;
  let router: Router;

  const serviceMock = {
    getOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  const benchPress: Exercise = { id: 1, name: 'Bankdrücken', weight: 60 };

  function fehlerMit(status: number): HttpErrorResponse {
    return new HttpErrorResponse({ status, statusText: 'Fehler' });
  }

  /** Baut die Komponente auf - mit ID in der Route heisst das Bearbeiten-Modus. */
  async function setup(routeId: string | null): Promise<void> {
    vi.resetAllMocks();
    serviceMock.getOne.mockReturnValue(of(benchPress));
    serviceMock.create.mockReturnValue(of(benchPress));
    serviceMock.update.mockReturnValue(of(benchPress));

    await TestBed.configureTestingModule({
      imports: [ExerciseForm],
      providers: [
        { provide: ExerciseService, useValue: serviceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap(routeId === null ? {} : { id: routeId })
            }
          }
        },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ExerciseForm);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  }

  describe('Anlegen (Route ohne ID)', () => {

    beforeEach(async () => await setup(null));

    it('sollte erstellt werden', () => {
      expect(component).toBeTruthy();
    });

    it('sollte im Anlegen-Modus sein und nichts nachladen', () => {
      fixture.detectChanges();

      expect(component.isEdit()).toBe(false);
      expect(component.title()).toBe('Neue Übung');
      expect(serviceMock.getOne).not.toHaveBeenCalled();
    });

    it('sollte ein leeres, ungültiges Formular haben', () => {
      expect(component.form.getRawValue()).toEqual({ name: '', weight: 0 });
      expect(component.form.invalid).toBe(true);
    });

    it('sollte einen leeren Namen ablehnen', () => {
      expect(component.form.controls.name.hasError('required')).toBe(true);
    });

    it('sollte einen Namen über 255 Zeichen ablehnen', () => {
      component.form.controls.name.setValue('x'.repeat(256));
      expect(component.form.controls.name.hasError('maxlength')).toBe(true);
    });

    it('sollte ein negatives Gewicht ablehnen', () => {
      component.form.controls.weight.setValue(-1);
      expect(component.form.controls.weight.hasError('min')).toBe(true);
    });
  });

  describe('save', () => {

    beforeEach(async () => await setup(null));

    it('sollte bei ungültigem Formular nicht speichern, aber alles als berührt markieren', () => {
      component.save();

      expect(serviceMock.create).not.toHaveBeenCalled();
      expect(component.form.controls.name.touched).toBe(true);
      expect(component.saving()).toBe(false);
    });

    it('sollte eine neue Übung anlegen und zur Liste zurückkehren', () => {
      component.form.setValue({ name: 'Klimmzug', weight: 0 });

      component.save();

      expect(serviceMock.create).toHaveBeenCalledWith({ name: 'Klimmzug', weight: 0 });
      expect(serviceMock.update).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['exercise']);
      expect(component.saving()).toBe(false);
    });

    it('sollte bei einem Fehler nicht navigieren und die Meldung anzeigen', () => {
      serviceMock.create.mockReturnValue(throwError(() => fehlerMit(403)));
      component.form.setValue({ name: 'Klimmzug', weight: 0 });

      component.save();

      expect(router.navigate).not.toHaveBeenCalled();
      expect(component.error()).toContain('403');
      expect(component.saving()).toBe(false);
    });
  });

  describe('Bearbeiten (Route mit ID)', () => {

    beforeEach(async () => await setup('1'));

    it('sollte im Bearbeiten-Modus sein und die Übung laden', () => {
      fixture.detectChanges();

      expect(component.isEdit()).toBe(true);
      expect(component.title()).toBe('Übung bearbeiten');
      expect(component.id()).toBe(1);
      expect(serviceMock.getOne).toHaveBeenCalledWith(1);
      expect(component.form.getRawValue()).toEqual({ name: 'Bankdrücken', weight: 60 });
    });

    it('sollte per update speichern statt anzulegen', () => {
      fixture.detectChanges();
      component.form.controls.weight.setValue(65);

      component.save();

      expect(serviceMock.update).toHaveBeenCalledWith(1, { name: 'Bankdrücken', weight: 65 });
      expect(serviceMock.create).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['exercise']);
    });
  });

  describe('loadExercise', () => {

    beforeEach(async () => await setup(null));

    it('sollte die geladene Übung ins Formular schreiben', () => {
      component.loadExercise(1);

      expect(component.form.getRawValue()).toEqual({ name: 'Bankdrücken', weight: 60 });
      expect(component.loading()).toBe(false);
    });

    it('sollte bei 404 eine Meldung setzen', () => {
      serviceMock.getOne.mockReturnValue(throwError(() => fehlerMit(404)));

      component.loadExercise(999);

      expect(component.error()).toContain('404');
      expect(component.loading()).toBe(false);
    });
  });

  describe('cancel', () => {

    beforeEach(async () => await setup(null));

    it('sollte ohne zu speichern zur Liste zurückkehren', () => {
      component.cancel();

      expect(serviceMock.create).not.toHaveBeenCalled();
      expect(serviceMock.update).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['exercise']);
    });
  });

  describe('toMessage', () => {

    beforeEach(async () => await setup(null));

    it('sollte jeden Statuscode in eine eigene Meldung übersetzen', () => {
      expect(component.toMessage(fehlerMit(0))).toContain('Keine Verbindung');
      expect(component.toMessage(fehlerMit(400))).toContain('400');
      expect(component.toMessage(fehlerMit(401))).toContain('Nicht angemeldet');
      expect(component.toMessage(fehlerMit(403))).toContain('XSRF');
      expect(component.toMessage(fehlerMit(404))).toContain('404');
      expect(component.toMessage(fehlerMit(500))).toContain('500');
    });
  });
});
