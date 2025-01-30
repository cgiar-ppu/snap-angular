import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';

// Root component
import { AppComponent } from './app.component';

// Child components
import { DatasetUploadComponent } from './components/dataset-upload/dataset-upload.component';
import { SemanticSearchComponent } from './components/semantic-search/semantic-search.component';

// Services
import { DataService } from './services/data.service';
import { SemanticSearchService } from './services/semantic-search.service';

// PrimeNG modules
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MenubarModule } from 'primeng/menubar';  // if you plan to use a menubar
import { TableModule } from 'primeng/table';
import { KnobModule } from 'primeng/knob';

@NgModule({
  declarations: [
    AppComponent,            // declare the root
    DatasetUploadComponent,  // declare child components
    SemanticSearchComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    // PrimeNG modules
    ButtonModule,
    InputTextModule,
    TooltipModule,
    MenubarModule,
    TableModule,
    KnobModule
  ],
  providers: [
    DataService,
    SemanticSearchService
  ],
  bootstrap: [AppComponent] // bootstrap the root component
})
export class AppModule {}