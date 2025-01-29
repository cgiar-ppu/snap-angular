import { Component } from '@angular/core';
import { DataService } from '../../services/data.service';


@Component({
  selector: 'app-dataset-upload',
  templateUrl: './dataset-upload.component.html',
  styleUrls: ['./dataset-upload.component.css'],
  standalone: false,
})
export class DatasetUploadComponent {
  selectedFile: File | null = null;
  datasetInfo: any = null;
  errorMessage: string = '';

  constructor(private dataService: DataService) {}

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  uploadFile() {
    if (!this.selectedFile) {
      this.errorMessage = 'No file selected.';
      return;
    }
    this.dataService.uploadDataset(this.selectedFile).subscribe({
      next: (res) => {
        this.datasetInfo = res;
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Upload failed.';
      }
    });
  }

  selectDefault() {
    this.dataService.selectDefaultDataset().subscribe({
      next: (res) => {
        this.datasetInfo = res;
        this.errorMessage = '';
      },
      error: (err) => {
        this.errorMessage = err.error?.detail || 'Failed to load default dataset.';
      }
    });
  }
}
