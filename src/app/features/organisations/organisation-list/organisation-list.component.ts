import { Component, inject } from '@angular/core';

import { OrganisationService } from '../../../core/services/organisation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { OrganisationStatusComponent } from '../organisation-status/organisation-status.component';

@Component({
  selector: 'app-organisation-list',
  standalone: true,
  imports: [TranslatePipe, OrganisationStatusComponent],
  templateUrl: './organisation-list.component.html',
  styleUrl: './organisation-list.component.css',
})
export class OrganisationListComponent {
  readonly orgService = inject(OrganisationService);
}
