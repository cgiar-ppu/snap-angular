import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { DatasetUploadComponent } from './components/dataset-upload/dataset-upload.component';
import { SemanticSearchComponent } from './components/semantic-search/semantic-search.component';

// Services
import { DataService } from './services/data.service';
import { SemanticSearchService } from './services/semantic-search.service';

@NgModule({
  declarations: [
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    AppComponent,
    DatasetUploadComponent,
    SemanticSearchComponent
  ],
  providers: [
    DataService,
    SemanticSearchService
  ],
  bootstrap: []
})
export class AppModule { }
