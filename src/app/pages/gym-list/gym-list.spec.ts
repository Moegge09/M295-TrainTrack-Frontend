import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { AuthConfig, OAuthModule } from 'angular-oauth2-oidc';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authConfig } from '../../app.auth';
import { Gym } from '../../models/gym';
import { GymService } from '../../services/gym.service';
import { GymList } from './gym-list';

describe('GymList', () => {

  let component: GymList;
  let fixture: ComponentFixture<GymList>;

  const serviceMock = { getAll: vi.fn(), remove: vi.fn() };
  const dialogMock = { open: vi.fn() };

  function dialogAntwortet(confirmed: boolean | undefined): void {
    dialogMock.open.mockReturnValue({ afterClosed: () => of(confirmed) });
  }

  const gyms: Gym[] = [
    {
      id: 1,
      name: 'Kraftraum Zürich',
      address: { street: 'Bahnhofstrasse', houseNumber: '12', plz: '8001', city: 'Zürich', country: 'Schweiz' }
    }
  ];

  function fehlerMit(status: number): HttpErrorResponse {
    return new HttpErrorResponse({ status, statusText: 'Fehler' });
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    serviceMock.getAll.mockReturnValue(of(gyms));
    serviceMock.remove.mockReturnValue(of({ message: 'Gym 1 deleted' }));
    dialogAntwortet(true);

    await TestBed.configureTestingModule({
      imports: [GymList, OAuthModule.forRoot({ resourceServer: { sendAccessToken: true } })],
      providers: [
        { provide: GymService, useValue: serviceMock },
        { provide: AuthConfig, useValue: authConfig },
        { provide: MatDialog, useValue: dialogMock },
        provideRouter([]),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(GymList);
    component = fixture.componentInstance;
  });

  it('sollte erstellt werden', () => {
    expect(component).toBeTruthy();
  });

  it('sollte die Gyms beim Initialisieren laden', () => {
    fixture.detectChanges();

    expect(serviceMock.getAll).toHaveBeenCalledTimes(1);
    expect(component.gyms()).toEqual(gyms);
  });

  it('sollte bei 403 auf die Rolle admin hinweisen', () => {
    serviceMock.getAll.mockReturnValue(throwError(() => fehlerMit(403)));

    component.load();

    expect(component.error()).toContain('admin');
  });

  describe('formatAddress', () => {

    it('sollte die Adresse einzeilig zusammensetzen', () => {
      expect(component.formatAddress(gyms[0]))
        .toBe('Bahnhofstrasse 12, 8001 Zürich, Schweiz');
    });

    it('sollte leere Felder überspringen', () => {
      const gym: Gym = {
        name: 'Ohne Strasse',
        address: { street: '', houseNumber: '', plz: '8000', city: 'Ort', country: '' }
      };

      expect(component.formatAddress(gym)).toBe('8000 Ort');
    });

    it('sollte einen Strich zeigen, wenn gar keine Adresse da ist', () => {
      const gym = { name: 'Leer' } as Gym;

      expect(component.formatAddress(gym)).toBe('-');
    });
  });

  describe('deleteGym', () => {

    it('sollte nach Bestätigung löschen und neu laden', () => {
      component.load();

      component.deleteGym(gyms[0]);

      expect(serviceMock.remove).toHaveBeenCalledWith(1);
      expect(serviceMock.getAll).toHaveBeenCalledTimes(2);
    });

    it('sollte bei Abbruch nichts löschen', () => {
      dialogAntwortet(false);

      component.deleteGym(gyms[0]);

      expect(serviceMock.remove).not.toHaveBeenCalled();
    });
  });

  it('sollte ohne Rolle admin keine Schreib-Buttons zeigen', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Neues Gym');
    expect(fixture.nativeElement.querySelectorAll('button[mat-icon-button]').length).toBe(0);
  });
});
