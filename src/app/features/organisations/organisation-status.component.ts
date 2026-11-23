import { Component, input } from '@angular/core';
import { OrganisationStatus } from '../../core/models/organisation';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

/**
 * Conflict 2 resolution: coloured indicator PLUS visible text label.
 * Colour alone is never the only channel.
 */
@Component({
  selector: 'app-organisation-status',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <span class="status" [attr.data-status]="status()">
      <span class="status__dot" aria-hidden="true"></span>
      <span class="status__label">{{ ('status.' + status()) | t }}</span>
    </span>
  `,
  styles: `
    .status {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--font-size-sm);
      line-height: var(--line-height-tight);
      white-space: nowrap;
    }

    .status__dot {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: 50%;
      background: var(--color-status-unknown);
      flex-shrink: 0;
    }

    .status[data-status='active'] .status__dot {
      background: var(--color-status-active);
    }

    .status[data-status='inactive'] .status__dot {
      background: var(--color-status-inactive);
    }

    .status[data-status='suspended'] .status__dot {
      background: var(--color-status-suspended);
    }

    .status[data-status='unknown'] .status__dot {
      background: var(--color-status-unknown);
    }

    .status__label {
      color: var(--color-text);
    }
  `,
})
export class OrganisationStatusComponent {
  readonly status = input.required<OrganisationStatus>();
}
