import { Component, inject, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { OrganisationStatus } from '../../../core/models/organisation';
import { OrganisationStore } from '../../../core/services/organisation.store';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

type CreateForm = {
  name: string;
  status: OrganisationStatus;
  ownerEmail: string;
  memberCount: number | null;
};

@Component({
  selector: 'app-organisation-create',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './organisation-create.component.html',
  styleUrl: './organisation-create.component.css',
})
export class OrganisationCreateComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(OrganisationStore);
  private readonly i18n = inject(TranslationService);

  readonly created = output<void>();
  readonly cancelled = output<void>();
  readonly submitAttempted = signal(false);
  readonly successMessage = signal<string | null>(null);


  readonly form = this.fb.nonNullable.group({
    name: this.fb.nonNullable.control('', {
      validators: [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(80),
        (control: AbstractControl): ValidationErrors | null => this.uniqueNameValidator(control),
      ],
      updateOn: 'blur',
    }),
    status: this.fb.nonNullable.control<OrganisationStatus>('active', {
      validators: [Validators.required],
      updateOn: 'blur',
    }),
    ownerEmail: this.fb.nonNullable.control('', {
      validators: [Validators.required, Validators.email],
      updateOn: 'blur',
    }),
    memberCount: this.fb.control<number | null>(null, {
      validators: [(c) => (c.value != null && c.value < 0 ? { min: true } : null)],
      updateOn: 'blur',
    }),
  });

  showError(controlName: keyof CreateForm): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.submitAttempted());
  }

  nameError(): string {
    const c = this.form.controls.name;
    if (c.hasError('required')) return this.i18n.t('create.errors.required');
    if (c.hasError('minlength')) return this.i18n.t('create.errors.nameMin');
    if (c.hasError('maxlength')) return this.i18n.t('create.errors.nameMax');
    if (c.hasError('notUnique')) return this.i18n.t('create.errors.nameUnique');
    return this.i18n.t('create.errors.required');
  }

  emailError(): string {
    const c = this.form.controls.ownerEmail;
    if (c.hasError('required')) return this.i18n.t('create.errors.required');
    return this.i18n.t('create.errors.email');
  }

  async onSubmit(): Promise<void> {
    this.submitAttempted.set(true);
    this.successMessage.set(null);
    this.form.markAllAsTouched();
    this.form.controls.name.updateValueAndValidity();

    if (this.form.invalid) {
      return;
    }

    const value = this.form.getRawValue();
    await this.store.create({
      name: value.name.trim(),
      status: value.status,
      ownerEmail: value.ownerEmail.trim(),
      memberCount: value.memberCount,
    });

    this.form.reset({
      name: '',
      status: 'active',
      ownerEmail: '',
      memberCount: null,
    });
    this.submitAttempted.set(false);
    this.successMessage.set(this.i18n.t('create.success'));
    this.created.emit();
  }

  private uniqueNameValidator(control: AbstractControl): ValidationErrors | null {
    const value = typeof control.value === 'string' ? control.value : '';
    if (!value.trim()) {
      return null;
    }
    return this.store.nameExists(value) ? { notUnique: true } : null;
  }
}
