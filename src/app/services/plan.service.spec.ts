import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { Plan, PlanRequest } from '../models/plan';
import { PlanService } from './plan.service';

describe('PlanService', () => {

  let service: PlanService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.backendBaseUrl + 'plan';

  const request: PlanRequest = { name: 'Woche A', trainingIds: [1, 2] };
  const plan: Plan = { id: 1, name: 'Woche A', trainings: [] };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlanService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(PlanService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sollte erstellt werden', () => {
    expect(service).toBeTruthy();
  });

  it('getAll sollte alle Pläne laden', () => {
    let result: Plan[] | undefined;
    service.getAll().subscribe(data => result = data);

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('GET');
    req.flush([plan]);

    expect(result?.length).toBe(1);
  });

  it('getOne sollte einen Plan anhand der ID laden', () => {
    let result: Plan | undefined;
    service.getOne(1).subscribe(data => result = data);

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(plan);

    expect(result).toEqual(plan);
  });

  it('create sollte das DTO mit trainingIds senden', () => {
    service.create(request).subscribe();

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(plan);
  });

  it('update sollte ebenfalls das DTO senden', () => {
    service.update(1, request).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush(plan);
  });

  it('remove sollte per DELETE löschen', () => {
    let message: string | undefined;
    service.remove(1).subscribe(data => message = data.message);

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ message: 'Plan 1 deleted' });

    expect(message).toBe('Plan 1 deleted');
  });

  it('sollte einen 403 durchreichen, wenn die Rolle admin fehlt', () => {
    let status: number | undefined;
    service.create(request).subscribe({ error: err => status = err.status });

    httpMock.expectOne(baseUrl).flush('Forbidden', { status: 403, statusText: 'Forbidden' });

    expect(status).toBe(403);
  });
});
