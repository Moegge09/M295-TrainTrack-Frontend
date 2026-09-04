import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Gym } from '../models/gym';
import { MessageResponse } from '../models/message-response';

@Injectable({
  providedIn: 'root'
})
export class GymService {

  private http = inject(HttpClient);

  // URL aus environment.backendBaseUrl, siehe allowedUrls in app.config.ts.
  private readonly baseUrl = environment.backendBaseUrl + 'gym';

  public getAll(): Observable<Gym[]> {
    return this.http.get<Gym[]>(this.baseUrl);
  }

  public getOne(id: number): Observable<Gym> {
    return this.http.get<Gym>(`${this.baseUrl}/${id}`);
  }

  public create(gym: Gym): Observable<Gym> {
    return this.http.post<Gym>(this.baseUrl, gym);
  }

  public update(id: number, gym: Gym): Observable<Gym> {
    return this.http.put<Gym>(`${this.baseUrl}/${id}`, gym);
  }

  public remove(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${id}`);
  }
}
