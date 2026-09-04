import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Plan } from '../../models/plan';
import { Training } from '../../models/training';
import { PlanService } from '../../services/plan.service';
import { TrainingService } from '../../services/training.service';
import { PlanForm } from './plan-form';

describe('PlanForm', () => {

  let component: PlanForm;
  let fixture: ComponentFixture<PlanForm>;
  let router: Router;

  const planMock = { getOne: vi.fn(), create: vi.fn(), update: vi.fn() };
  const trainingMock = { getAll: vi.fn() };

  const trainings: Training[] = [
    { id: 1, name: 'Push', day: 'MONDAY', exercises: [], gym: null },
    { id: 2, name: 'Pull', day: 'THURSDAY', exercises: [], gym: null },
  ];

  const plan: Plan = { id: 3, name: 'Woche A', trainings: [trainings[0]] };

  function fehlerMit(status: number): HttpErrorResponse {
    return new HttpErrorResponse({ status, statusText: 'Fehler' });
  }

  async function setup(routeId: string | null): Promise<void> {
    vi.resetAllMocks();
    trainingMock.getAll.mockReturnValue(of(trainings));
    planMock.getOne.mockReturnValue(of(plan));
    planMock.create.mockReturnValue(of(plan));
    planMock.update.mockReturnValue(of(plan));

    await TestBed.configureTestingModule({
      imports: [PlanForm],
      providers: [
        { provide: PlanService, useValue: planMock },
        { provide: TrainingService, useValue: trainingMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(routeId === null ? {} : { id: routeId }) }
          }
        },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PlanForm);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  }

  describe('Anlegen', () => {

    beforeEach(async () => await setup(null));

    it('sollte erstellt werden', () => {
      expect(component).toBeTruthy();
    });

    it('sollte die Trainings für das Dropdown laden', () => {
      fixture.detectChanges();

      expect(component.trainings()).toEqual(trainings);
      expect(planMock.getOne).not.toHaveBeenCalled();
    });

    it('sollte ohne Namen ungültig sein', () => {
      expect(component.form.invalid).toBe(true);
    });

    it('sollte den Plan mit trainingIds anlegen', () => {
      fixture.detectChanges();
      component.form.patchValue({ name: 'Woche B', trainingIds: [1, 2] });

      component.save();

      expect(planMock.create).toHaveBeenCalledWith({ name: 'Woche B', trainingIds: [1, 2] });
      expect(planMock.update).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['plan']);
    });

    it('sollte bei ungültigem Formular nicht speichern', () => {
      component.save();

      expect(planMock.create).not.toHaveBeenCalled();
      expect(component.form.controls.name.touched).toBe(true);
    });

    it('sollte bei 403 eine Meldung setzen und nicht navigieren', () => {
      planMock.create.mockReturnValue(throwError(() => fehlerMit(403)));
      component.form.controls.name.setValue('Woche B');

      component.save();

      expect(component.error()).toContain('admin');
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('sollte im Dropdown Name und Wochentag zeigen', () => {
      expect(component.trainingLabel(trainings[0])).toBe('Push (Montag)');
    });
  });

  describe('Bearbeiten', () => {

    beforeEach(async () => await setup('3'));

    it('sollte den Plan laden und die IDs ins Formular schreiben', () => {
      fixture.detectChanges();

      expect(component.isEdit()).toBe(true);
      expect(component.title()).toBe('Plan bearbeiten');
      expect(component.form.getRawValue()).toEqual({ name: 'Woche A', trainingIds: [1] });
    });

    it('sollte per update speichern, ebenfalls mit dem DTO', () => {
      fixture.detectChanges();

      component.save();

      expect(planMock.update).toHaveBeenCalledWith(3, { name: 'Woche A', trainingIds: [1] });
      expect(planMock.create).not.toHaveBeenCalled();
    });

    it('sollte einen Plan ohne Trainings verarbeiten', () => {
      planMock.getOne.mockReturnValue(of({ ...plan, trainings: [] }));

      component.loadPlan(3);

      expect(component.form.controls.trainingIds.value).toEqual([]);
    });

    it('sollte bei 404 eine Meldung setzen', () => {
      planMock.getOne.mockReturnValue(throwError(() => fehlerMit(404)));

      component.loadPlan(999);

      expect(component.error()).toContain('404');
    });
  });

  describe('cancel und toMessage', () => {

    beforeEach(async () => await setup(null));

    it('sollte ohne zu speichern zur Liste zurückkehren', () => {
      component.cancel();

      expect(planMock.create).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['plan']);
    });

    it('sollte jeden Statuscode übersetzen', () => {
      expect(component.toMessage(fehlerMit(0))).toContain('Keine Verbindung');
      expect(component.toMessage(fehlerMit(400))).toContain('400');
      expect(component.toMessage(fehlerMit(401))).toContain('Nicht angemeldet');
      expect(component.toMessage(fehlerMit(403))).toContain('admin');
      expect(component.toMessage(fehlerMit(404))).toContain('404');
      expect(component.toMessage(fehlerMit(500))).toContain('500');
    });
  });
});
