import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { OrganisationService } from '../../../core/services/organisation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-organisation-filter',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './organisation-filter.component.html',
  styleUrl: './organisation-filter.component.css',
})
export class OrganisationFilterComponent {
  readonly orgService = inject(OrganisationService);

  onSearch(value: string): void {
    this.orgService.search.set(value);
  }

  onStatus(value: string): void {
    this.orgService.statusFilter.set(value);
  }

  clear(): void {
    this.orgService.search.set('');
    this.orgService.statusFilter.set('all');
  }
}
