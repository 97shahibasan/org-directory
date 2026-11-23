import { Routes } from '@angular/router';
import { OrganisationDirectoryComponent } from './features/organisations/organisation-directory.component';

export const routes: Routes = [
  { path: '', component: OrganisationDirectoryComponent },
  { path: '**', redirectTo: '' },
];
