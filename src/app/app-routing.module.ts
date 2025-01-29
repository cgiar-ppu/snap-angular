import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DatasetUploadComponent } from './components/dataset-upload/dataset-upload.component';
import { SemanticSearchComponent } from './components/semantic-search/semantic-search.component';

const routes: Routes = [
  { path: '', redirectTo: '/upload', pathMatch: 'full' },
  { path: 'upload', component: DatasetUploadComponent },
  { path: 'search', component: SemanticSearchComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
