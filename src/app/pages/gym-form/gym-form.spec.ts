import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Gym } from '../../models/gym';
import { GymService } from '../../services/gym.service';
import { GymForm } from './gym-form';

describe('GymForm', () => {

  let component: GymForm;
  let fixture: ComponentFixture<GymForm>;
  let router: Router;

  const serviceMock = { getOne: vi.fn(), create: vi.fn(), update: vi.fn() };

  const kraftraum: Gym = {
    id: 1,
    name: 'Kraftraum Zürich',
    address: { street: 'Bahnhofstrasse', houseNumber: '12', plz: '8001', city: 'Zürich', country: 'Schweiz' }
  };

  const leereAdresse = { street: '', houseNumber: '', plz: '', city: '', country: '' };

  function fehlerMit(status: number): HttpErrorResponse {
    return new HttpErrorResponse({ status, statusText: 'Fehler' });
  }

  async function setup(routeId: string | null): Promise<void> {
    vi.resetAllMocks();
    serviceMock.getOne.mockReturnValue(of(kraftraum));
    serviceMock.create.mockReturnValue(of(kraftraum));
    serviceMock.update.mockReturnValue(of(kraftraum));

    await TestBed.configureTestingModule({
      imports: [GymForm],
      providers: [
        { provide: GymService, useValue: serviceMock },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(routeId === null ? {} : { id: routeId }) }
          }
        },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GymForm);
    component = fixture.componentInstance;

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  }

  describe('Anlegen', () => {

    beforeEach(async () => await setup(null));

    it('sollte erstellt werden', () => {
      expect(component).toBeTruthy();
    });

    it('sollte im Anlegen-Modus sein', () => {
      fixture.detectChanges();

      expect(component.isEdit()).toBe(false);
      expect(component.title()).toBe('Neues Gym');
      expect(serviceMock.getOne).not.toHaveBeenCalled();
    });

    it('sollte nur den Namen als Pflichtfeld haben', () => {
      expect(component.form.invalid).toBe(true);

      component.form.controls.name.setValue('Neues Gym');

      // die Adressfelder bleiben leer und das Formular ist trotzdem gültig,
      // weil das Backend auf der Adresse keine Validierung hat
      expect(component.form.valid).toBe(true);
    });

    it('sollte unzulässige Zeichen und zu kurze Postleitzahlen ablehnen', () => {
      const plz = component.form.controls.address.controls.plz;

      plz.setValue('80');
      expect(plz.hasError('pattern')).toBe(true);

      plz.setValue('8001!');
      expect(plz.hasError('pattern')).toBe(true);

      plz.setValue(' 8001');
      expect(plz.hasError('pattern')).toBe(true);
    });

    it('sollte Postleitzahlen verschiedener Länder zulassen', () => {
      const plz = component.form.controls.address.controls.plz;

      for (const wert of ['8001', '10115', 'SW1A 1AA', 'K1A 0B1', '1234 AB']) {
        plz.setValue(wert);
        expect(plz.valid).toBe(true);
      }
    });

    it('sollte eine leere PLZ zulassen, weil das Feld optional ist', () => {
      const plz = component.form.controls.address.controls.plz;

      plz.setValue('');

      expect(plz.valid).toBe(true);
    });

    it('sollte einen Namen über 255 Zeichen ablehnen', () => {
      component.form.controls.name.setValue('x'.repeat(256));

      expect(component.form.controls.name.hasError('maxlength')).toBe(true);
    });

    it('sollte das Gym mit verschachtelter Adresse anlegen', () => {
      component.form.setValue({
        name: 'Neues Gym',
        address: { ...leereAdresse, city: 'Bern' }
      });

      component.save();

      expect(serviceMock.create).toHaveBeenCalledWith({
        name: 'Neues Gym',
        address: { ...leereAdresse, city: 'Bern' }
      });
      expect(router.navigate).toHaveBeenCalledWith(['gym']);
    });

    it('sollte bei ungültigem Formular nicht speichern', () => {
      component.save();

      expect(serviceMock.create).not.toHaveBeenCalled();
      expect(component.form.controls.name.touched).toBe(true);
    });

    it('sollte bei 403 eine Meldung setzen und nicht navigieren', () => {
      serviceMock.create.mockReturnValue(throwError(() => fehlerMit(403)));
      component.form.controls.name.setValue('Neues Gym');

      component.save();

      expect(component.error()).toContain('admin');
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Bearbeiten', () => {

    beforeEach(async () => await setup('1'));

    it('sollte das Gym laden und die Adresse ins Formular schreiben', () => {
      fixture.detectChanges();

      expect(component.isEdit()).toBe(true);
      expect(component.title()).toBe('Gym bearbeiten');
      expect(serviceMock.getOne).toHaveBeenCalledWith(1);
      expect(component.form.controls.address.controls.city.value).toBe('Zürich');
    });

    it('sollte per update speichern', () => {
      fixture.detectChanges();

      component.save();

      expect(serviceMock.update).toHaveBeenCalled();
      expect(serviceMock.create).not.toHaveBeenCalled();
    });

    it('sollte eine fehlende Adresse durch leere Felder ersetzen', () => {
      serviceMock.getOne.mockReturnValue(of({ id: 1, name: 'Ohne Adresse' } as Gym));

      component.loadGym(1);

      expect(component.form.controls.address.getRawValue()).toEqual(leereAdresse);
    });

    it('sollte bei 404 eine Meldung setzen', () => {
      serviceMock.getOne.mockReturnValue(throwError(() => fehlerMit(404)));

      component.loadGym(999);

      expect(component.error()).toContain('404');
    });
  });

  describe('cancel und toMessage', () => {

    beforeEach(async () => await setup(null));

    it('sollte ohne zu speichern zur Liste zurückkehren', () => {
      component.cancel();

      expect(serviceMock.create).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['gym']);
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
