import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Exercise } from '../../models/exercise';
import { Gym } from '../../models/gym';
import { Training } from '../../models/training';
import { ExerciseService } from '../../services/exercise.service';
import { GymService } from '../../services/gym.service';
import { TrainingService } from '../../services/training.service';
import { TrainingForm } from './training-form';

describe('TrainingForm', () => {

  let component: TrainingForm;
  let fixture: ComponentFixture<TrainingForm>;
  let router: Router;

  const trainingMock = { getOne: vi.fn(), create: vi.fn(), update: vi.fn() };
  const gymMock = { getAll: vi.fn() };
  const exerciseMock = { getAll: vi.fn() };

  const gyms: Gym[] = [
    { id: 7, name: 'Kraftraum Zürich', address: { street: '', houseNumber: '', plz: '', city: '', country: '' } }
  ];

  const exercises: Exercise[] = [
    { id: 1, name: 'Bankdrücken', weight: 60 },
    { id: 2, name: 'Kniebeuge', weight: 80 },
  ];

  const training: Training = {
    id: 5,
    name: 'Push',
    day: 'WEDNESDAY',
    exercises: [exercises[0]],
    gym: gyms[0],
  };

  function fehlerMit(status: number): HttpErrorResponse {
    return new HttpErrorResponse({ status, statusText: 'Fehler' });
  }

  async function setup(routeId: string | null): Promise<void> {
    vi.resetAllMocks();
    gymMock.getAll.mockReturnValue(of(gyms));
    exerciseMock.getAll.mockReturnValue(of(exercises));
    trainingMock.getOne.mockReturnValue(of(training));
    trainingMock.create.mockReturnValue(of(training));
    trainingMock.update.mockReturnValue(of(training));

    await TestBed.configureTestingModule({
      imports: [TrainingForm],
      providers: [
        { provide: TrainingService, useValue: trainingMock },
        { provide: GymService, useValue: gymMock },
        { provide: ExerciseService, useValue: exerciseMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(routeId === null ? {} : { id: routeId }) }
          }
        },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrainingForm);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  }

  describe('Anlegen', () => {

    beforeEach(async () => await setup(null));

    it('sollte erstellt werden', () => {
      expect(component).toBeTruthy();
    });

    it('sollte die Auswahllisten laden', () => {
      fixture.detectChanges();

      expect(component.gyms()).toEqual(gyms);
      expect(component.exercises()).toEqual(exercises);
      expect(trainingMock.getOne).not.toHaveBeenCalled();
    });

    it('sollte sieben Wochentage anbieten', () => {
      expect(component.days.length).toBe(7);
      expect(component.days[0]).toEqual(['MONDAY', 'Montag']);
    });

    it('sollte Montag vorbelegen und ohne Namen ungültig sein', () => {
      expect(component.form.controls.day.value).toBe('MONDAY');
      expect(component.form.invalid).toBe(true);
    });

    it('sollte per DTO mit blossen IDs anlegen', () => {
      fixture.detectChanges();
      component.form.patchValue({ name: 'Pull', day: 'FRIDAY', gymId: 7, exerciseIds: [1, 2] });

      component.save();

      expect(trainingMock.create).toHaveBeenCalledWith({
        name: 'Pull',
        day: 'FRIDAY',
        gymId: 7,
        exerciseIds: [1, 2],
      });
      expect(trainingMock.update).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['training']);
    });

    it('sollte bei ungültigem Formular nicht speichern', () => {
      component.save();

      expect(trainingMock.create).not.toHaveBeenCalled();
      expect(component.form.controls.name.touched).toBe(true);
    });

    it('sollte bei 403 eine Meldung setzen und nicht navigieren', () => {
      trainingMock.create.mockReturnValue(throwError(() => fehlerMit(403)));
      component.form.controls.name.setValue('Pull');

      component.save();

      expect(component.error()).toContain('update');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Bearbeiten', () => {

    beforeEach(async () => await setup('5'));

    it('sollte das Training laden und die IDs ins Formular schreiben', () => {
      fixture.detectChanges();

      expect(component.isEdit()).toBe(true);
      expect(component.title()).toBe('Training bearbeiten');
      expect(component.form.getRawValue()).toEqual({
        name: 'Push',
        day: 'WEDNESDAY',
        gymId: 7,
        exerciseIds: [1],
      });
    });

    it('sollte per PUT die ganze Entity senden, nicht das DTO', () => {
      fixture.detectChanges();

      component.save();

      expect(trainingMock.update).toHaveBeenCalledWith(5, {
        id: 5,
        name: 'Push',
        day: 'WEDNESDAY',
        gym: gyms[0],
        exercises: [exercises[0]],
      });
      expect(trainingMock.create).not.toHaveBeenCalled();
    });

    it('sollte ein Training ohne Gym und ohne Übungen verarbeiten', () => {
      trainingMock.getOne.mockReturnValue(of({ ...training, gym: null, exercises: [] }));

      component.loadTraining(5);

      expect(component.form.controls.gymId.value).toBeNull();
      expect(component.form.controls.exerciseIds.value).toEqual([]);
    });

    it('sollte bei 404 eine Meldung setzen', () => {
      trainingMock.getOne.mockReturnValue(throwError(() => fehlerMit(404)));

      component.loadTraining(999);

      expect(component.error()).toContain('404');
    });
  });

  describe('cancel und toMessage', () => {

    beforeEach(async () => await setup(null));

    it('sollte ohne zu speichern zur Liste zurückkehren', () => {
      component.cancel();

      expect(trainingMock.create).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['training']);
    });

    it('sollte jeden Statuscode übersetzen', () => {
      expect(component.toMessage(fehlerMit(0))).toContain('Keine Verbindung');
      expect(component.toMessage(fehlerMit(400))).toContain('400');
      expect(component.toMessage(fehlerMit(401))).toContain('Nicht angemeldet');
      expect(component.toMessage(fehlerMit(403))).toContain('update');
      expect(component.toMessage(fehlerMit(404))).toContain('404');
      expect(component.toMessage(fehlerMit(500))).toContain('500');
    });
  });
});
