import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Exercise } from '../models/exercise';
import { MessageResponse } from '../models/message-response';

@Injectable({
  providedIn: 'root'
})
export class ExerciseService {

  private http = inject(HttpClient);

  private readonly baseUrl = environment.backendBaseUrl + 'exercise';

  public getAll(): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(this.baseUrl);
  }

  public getOne(id: number): Observable<Exercise> {
    return this.http.get<Exercise>(`${this.baseUrl}/${id}`);
  }

  public create(exercise: Exercise): Observable<Exercise> {
    return this.http.post<Exercise>(this.baseUrl, exercise);
  }

  public update(id: number, exercise: Exercise): Observable<Exercise> {
    return this.http.put<Exercise>(`${this.baseUrl}/${id}`, exercise);
  }

  public remove(id: number): Observable<MessageResponse> {
    return this.http.delete<MessageResponse>(`${this.baseUrl}/${id}`);
  }
}
