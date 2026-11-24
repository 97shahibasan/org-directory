import { Component, OnInit, inject, signal } from '@angular/core';

import { OrganisationService } from '../../../core/services/organisation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { OrganisationCreateComponent } from '../organisation-create/organisation-create.component';
import { OrganisationFilterComponent } from '../organisation-filter/organisation-filter.component';
import { OrganisationListComponent } from '../organisation-list/organisation-list.component';

@Component({
  selector: 'app-organisation-page',
  standalone: true,
  imports: [
    TranslatePipe,
    OrganisationFilterComponent,
    OrganisationListComponent,
    OrganisationCreateComponent,
  ],
  templateUrl: './organisation-page.component.html',
  styleUrl: './organisation-page.component.css',
})
export class OrganisationPageComponent implements OnInit {
  readonly orgService = inject(OrganisationService);
  readonly showDialog = signal(false);

  ngOnInit(): void {
    this.orgService.load();
  }

  openDialog(): void {
    this.showDialog.set(true);
  }

  closeDialog(): void {
    this.showDialog.set(false);
  }
}
