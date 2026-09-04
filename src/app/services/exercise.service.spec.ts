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

  const benchPress: Exercise = { id: 1, name: 'Bankdrücken', weight: 60 };
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

    it('sollte alle Übungen laden', () => {
      let result: Exercise[] | undefined;
      service.getAll().subscribe(data => result = data);

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush([benchPress, kniebeuge]);

      expect(result).toEqual([benchPress, kniebeuge]);
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

    it('sollte eine einzelne Übung anhand der ID laden', () => {
      let result: Exercise | undefined;
      service.getOne(1).subscribe(data => result = data);

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(benchPress);

      expect(result).toEqual(benchPress);
    });

    it('sollte einen 404 durchreichen, wenn es die Übung nicht gibt', () => {
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

    it('sollte eine neue Übung per POST anlegen', () => {
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

    it('sollte eine bestehende Übung per PUT aktualisieren', () => {
      const aktualisiert: Exercise = { id: 1, name: 'Bankdrücken', weight: 65 };
      let result: Exercise | undefined;

      service.update(1, aktualisiert).subscribe(data => result = data);

      const req = httpMock.expectOne(`${baseUrl}/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(aktualisiert);
      req.flush(aktualisiert);

      expect(result?.weight).toBe(65);
    });
  });

  describe('remove', () => {

    it('sollte eine Übung per DELETE löschen', () => {
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
