import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../environments/environment';
import { Exercise } from '../models/exercise';
import { ExerciseService } from './exercise.service';

describe('ExerciseService', () => {

  let service: ExerciseService;
  let httpMock: HttpTestingController;

  const baseUrl = environment.backendBaseUrl + 'exercise';

  const bankdruecken: Exercise = { id: 1, name: 'Bankdruecken', weight: 60 };
  const kniebeuge: Exercise = { id: 2, name: 'Kniebeuge', weight: 80 };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ExerciseService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });

    service = TestBed.inject(ExerciseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sollte erstellt werden', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {

    it('sollte alle Uebungen laden', () => {
      let result: Exercise[] | undefined;
      service.getAll().subscribe(data => result = data);

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush([bankdruecken, kniebeuge]);

      expect(result).toEqual([bankdruecken, kniebeuge]);
      expect(result?.length).toBe(2);
    });

    it('sollte mit einer leeren Liste umgehen', () => {
      let result: Exercise[] | undefined;
      service.getAll().subscribe(data => result = data);

      httpMock.expectOne(baseUrl).flush([]);

      expect(result).toEqual([]);
    });
  });

  describe('getOne', () => {

    it('sollte eine einzelne Uebung anhand der ID laden', () => {
      let result: Exercise | undefined;
      service.getOne(1).subscribe(data => result = data);

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(bankdruecken);

      expect(result).toEqual(bankdruecken);
    });

    it('sollte einen 404 durchreichen, wenn es die Uebung nicht gibt', () => {
      let status: number | undefined;
      service.getOne(999).subscribe({
        error: err => status = err.status
      });

      httpMock.expectOne(`${baseUrl}/999`)
        .flush('Could not find Exercise 999', { status: 404, statusText: 'Not Found' });

      expect(status).toBe(404);
    });
  });

  describe('create', () => {

    it('sollte eine neue Uebung per POST anlegen', () => {
      const neu: Exercise = { name: 'Klimmzug', weight: 0 };
      let result: Exercise | undefined;

      service.create(neu).subscribe(data => result = data);

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(neu);
      req.flush({ ...neu, id: 3 });

      // die ID vergibt erst die Datenbank
      expect(result?.id).toBe(3);
    });
  });

  describe('update', () => {

    it('sollte eine bestehende Uebung per PUT aktualisieren', () => {
      const geaendert: Exercise = { id: 1, name: 'Bankdruecken', weight: 65 };
      let result: Exercise | undefined;

      service.update(1, geaendert).subscribe(data => result = data);

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(geaendert);
      req.flush(geaendert);

      expect(result?.weight).toBe(65);
    });
  });

  describe('remove', () => {

    it('sollte eine Uebung per DELETE loeschen', () => {
      let message: string | undefined;

      service.remove(1).subscribe(data => message = data.message);

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Exercise 1 deleted' });

      expect(message).toBe('Exercise 1 deleted');
    });

    it('sollte einen 403 durchreichen, wenn die Rolle update fehlt', () => {
      let status: number | undefined;
      service.remove(1).subscribe({
        error: err => status = err.status
      });

      httpMock.expectOne(`${baseUrl}/1`)
        .flush('Forbidden', { status: 403, statusText: 'Forbidden' });

      expect(status).toBe(403);
    });
  });
});
