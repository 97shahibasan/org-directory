import { Component, input } from '@angular/core';
import { OrganisationStatus } from '../../../core/models/organisation';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

/** Coloured dot + text label (never colour alone). */
@Component({
  selector: 'app-organisation-status',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './organisation-status.component.html',
  styleUrl: './organisation-status.component.css',
})
export class OrganisationStatusComponent {
  readonly status = input.required<OrganisationStatus>();
}
