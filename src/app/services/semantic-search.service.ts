import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class SemanticSearchService {
  private baseUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  computeEmbeddings(datasetId: string, textColumns: string): Observable<any> {
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('text_columns', textColumns);

    return this.http.post(`${this.baseUrl}/compute-embeddings`, formData);
  }

  runSearch(
    datasetId: string,
    query: string,
    negativeKeywords: string,
    includeKeywords: string,
    threshold: number
  ): Observable<any> {
    const formData = new FormData();
    formData.append('dataset_id', datasetId);
    formData.append('query', query);
    formData.append('negative_keywords', negativeKeywords);
    formData.append('include_keywords', includeKeywords);
    formData.append('threshold', String(threshold));

    return this.http.post(`${this.baseUrl}/search`, formData);
  }
}
