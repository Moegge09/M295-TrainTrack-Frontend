import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { Gym } from '../models/gym';
import { GymService } from './gym.service';

describe('GymService', () => {

  let service: GymService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.backendBaseUrl + 'gym';

  const kraftraum: Gym = {
    id: 1,
    name: 'Kraftraum Zürich',
    address: {
      id: 1,
      street: 'Bahnhofstrasse',
      houseNumber: '12',
      plz: '8001',
      city: 'Zürich',
      country: 'Schweiz',
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GymService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(GymService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sollte erstellt werden', () => {
    expect(service).toBeTruthy();
  });

  it('getAll sollte alle Gyms laden', () => {
    let result: Gym[] | undefined;
    service.getAll().subscribe(data => result = data);

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush([kraftraum]);

    expect(result?.length).toBe(1);
    expect(result?.[0].address.city).toBe('Zürich');
  });

  it('getOne sollte ein Gym anhand der ID laden', () => {
    let result: Gym | undefined;
    service.getOne(1).subscribe(data => result = data);

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(kraftraum);

    expect(result).toEqual(kraftraum);
  });

  it('create sollte das Gym mitsamt Adresse senden', () => {
    const neu: Gym = {
      name: 'Neues Gym',
      address: { street: 'Weg', houseNumber: '1', plz: '8000', city: 'Ort', country: 'Schweiz' }
    };
    let result: Gym | undefined;

    service.create(neu).subscribe(data => result = data);

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    // die Adresse muss verschachtelt mitgehen, sie wird per Cascade gespeichert
    expect(req.request.body.address.city).toBe('Ort');
    req.flush({ ...neu, id: 2 });

    expect(result?.id).toBe(2);
  });

  it('update sollte per PUT aktualisieren', () => {
    let result: Gym | undefined;
    service.update(1, kraftraum).subscribe(data => result = data);

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(kraftraum);
    req.flush(kraftraum);

    expect(result?.name).toBe('Kraftraum Zürich');
  });

  it('remove sollte per DELETE löschen', () => {
    let message: string | undefined;
    service.remove(1).subscribe(data => message = data.message);

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Gym 1 deleted' });

    expect(message).toBe('Gym 1 deleted');
  });

  it('remove sollte einen 403 durchreichen, wenn die Rolle admin fehlt', () => {
    let status: number | undefined;
    service.remove(1).subscribe({ error: err => status = err.status });

    httpMock.expectOne(`${baseUrl}/1`).flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(status).toBe(403);
  });
});
