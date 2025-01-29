import { Component } from '@angular/core';
import { SemanticSearchService } from '../../services/semantic-search.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-semantic-search',
  templateUrl: './semantic-search.component.html',
  styleUrls: ['./semantic-search.component.css']
})
export class SemanticSearchComponent {
  datasetId: string = ''; 
  columnsInput: string = ''; 
  embeddingsMessage: string = '';
  embeddingsError: string = '';

  query: string = '';
  negativeKeywords: string = '';
  includeKeywords: string = '';
  threshold: number = 0.35;

  searchResults: any[] = [];
  searchCount: number = 0;
  searchError: string = '';

  constructor(private semanticSearchSvc: SemanticSearchService) {}

  computeEmbeddings() {
    if (!this.datasetId || !this.columnsInput) {
      this.embeddingsError = 'Please specify dataset ID and text columns.';
      return;
    }
    this.semanticSearchSvc.computeEmbeddings(this.datasetId, this.columnsInput).subscribe({
      next: (res) => {
        this.embeddingsMessage = res.detail;
        this.embeddingsError = '';
      },
      error: (err) => {
        this.embeddingsError = err.error?.detail || 'Error computing embeddings.';
      }
    });
  }

  runSearch() {
    if (!this.datasetId || !this.query) {
      this.searchError = 'Please specify dataset ID and query.';
      return;
    }
    this.semanticSearchSvc.runSearch(
      this.datasetId,
      this.query,
      this.negativeKeywords,
      this.includeKeywords,
      this.threshold
    ).subscribe({
      next: (res) => {
        this.searchResults = res.results;
        this.searchCount = res.count;
        this.searchError = '';
      },
      error: (err) => {
        this.searchError = err.error?.detail || 'Error during search.';
      }
    });
  }

  downloadResults() {
    // Simple approach: create a CSV from this.searchResults
    const rows = this.searchResults;
    if (!rows || rows.length === 0) {
      alert("No results to download.");
      return;
    }

    // Generate CSV
    const columns = Object.keys(rows[0]);
    const header = columns.join(',');
    const csvRows = rows.map(row => {
      return columns.map(col => {
        // Basic CSV escaping
        const val = row[col] ? row[col].toString().replace(/"/g, '""') : '';
        return `"${val}"`;
      }).join(',');
    });
    const csvString = header + '\n' + csvRows.join('\n');

    // Create a Blob and link for download
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'search_results.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  getResultColumns(): string[] {
    if (!this.searchResults || this.searchResults.length === 0) {
      return [];
    }
    return Object.keys(this.searchResults[0]);
  }
}
