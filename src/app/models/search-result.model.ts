export interface SearchResult {
    [columnName: string]: any;
    similarity_score?: number;
  }  