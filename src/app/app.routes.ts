import { Routes } from '@angular/router';
import { OrganisationPageComponent } from './features/organisations/organisation-page/organisation-page.component';

export const routes: Routes = [
  { path: '', component: OrganisationPageComponent },
  { path: '**', redirectTo: '' },
];
