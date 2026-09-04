import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MessageResponse } from '../models/message-response';
import { Training, TrainingRequest } from '../models/training';

@Injectable({
  providedIn: 'root'
})
export class TrainingService {

  private http = inject(HttpClient);

  // URL aus environment.backendBaseUrl, siehe allowedUrls in app.config.ts.
  private readonly baseUrl = environment.backendBaseUrl + 'training';

  public getAll(): Observable<Training[]> {
    return this.http.get<Training[]>(this.baseUrl);
  }

  public getOne(id: number): Observable<Training> {
    return this.http.get<Training>(`${this.baseUrl}/${id}`);
  }

  /** POST erwartet das DTO mit gymId und exerciseIds. */
  public create(request: TrainingRequest): Observable<Training> {
    return this.http.post<Training>(this.baseUrl, request);
  }

  /** PUT erwartet abweichend die ganze Entity, nicht das DTO. */
  public update(id: number, training: Training): Observable<Training> {
    return this.http.put<Training>(`${this.baseUrl}/${id}`, training);
  }

  public remove(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${id}`);
  }
}
