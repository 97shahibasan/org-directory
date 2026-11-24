import { Component, input } from '@angular/core';

import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-organisation-status',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './organisation-status.component.html',
  styleUrl: './organisation-status.component.css',
})
export class OrganisationStatusComponent {
  readonly status = input('unknown');
}
