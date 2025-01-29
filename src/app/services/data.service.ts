import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class DataService {
  // Adjust this if your FastAPI server is at a different URL/port
  private baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  selectDefaultDataset(): Observable<any> {
    return this.http.post(`${this.baseUrl}/select-default-dataset`, {});
  }

  uploadDataset(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${this.baseUrl}/upload-dataset`, formData);
  }
}
