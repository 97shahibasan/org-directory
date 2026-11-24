import { Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { OrganisationService } from '../../../core/services/organisation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-organisation-create',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './organisation-create.component.html',
  styleUrl: './organisation-create.component.css',
})
export class OrganisationCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly orgService = inject(OrganisationService);

  readonly saved = output<void>();
  readonly cancelled = output<void>();

  readonly triedSubmit = signal(false);

  // Errors are only shown after blur/submit (see showError), not while typing.
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    status: ['active', Validators.required],
    ownerEmail: ['', [Validators.required, Validators.email]],
    memberCount: this.fb.control<number | null>(null),
  });



  /** Show error only after blur or after submit click. */
  showError(field: 'name' | 'status' | 'ownerEmail' | 'memberCount'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.triedSubmit());
  }

  nameTaken(): boolean {
    const name = this.form.controls.name.value;
    return !!name && this.orgService.nameExists(name);
  }

  onSubmit(): void {
    this.triedSubmit.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid || this.nameTaken()) {
      return;
    }

    const value = this.form.getRawValue();
    this.orgService.add({
      name: value.name.trim(),
      status: value.status,
      ownerEmail: value.ownerEmail.trim(),
      memberCount: value.memberCount,
    });

    this.saved.emit();
  }
}
