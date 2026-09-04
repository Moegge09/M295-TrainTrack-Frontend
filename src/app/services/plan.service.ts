import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { MessageResponse } from '../models/message-response';
import { Plan, PlanRequest } from '../models/plan';

@Injectable({
  providedIn: 'root'
})
export class PlanService {

  private http = inject(HttpClient);

  // URL aus environment.backendBaseUrl, siehe allowedUrls in app.config.ts.
  private readonly baseUrl = environment.backendBaseUrl + 'plan';

  public getAll(): Observable<Plan[]> {
    return this.http.get<Plan[]>(this.baseUrl);
  }

  public getOne(id: number): Observable<Plan> {
    return this.http.get<Plan>(`${this.baseUrl}/${id}`);
  }

  /** POST und PUT erwarten beide das DTO mit trainingIds. */
  public create(request: PlanRequest): Observable<Plan> {
    return this.http.post<Plan>(this.baseUrl, request);
  }

  public update(id: number, request: PlanRequest): Observable<Plan> {
    return this.http.put<Plan>(`${this.baseUrl}/${id}`, request);
  }

  public remove(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${id}`);
  }
}
