import { Component, inject, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { OrganisationStatus } from '../../core/models/organisation';
import { OrganisationStore } from '../../core/services/organisation.store';
import { TranslationService } from '../../core/services/translation.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

type CreateForm = {
  name: string;
  status: OrganisationStatus;
  ownerEmail: string;
  memberCount: number | null;
};

@Component({
  selector: 'app-organisation-create-form',
  standalone: true,
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <section class="create" aria-labelledby="create-heading">
      <h2 id="create-heading">{{ 'create.heading' | t }}</h2>

      @if (submitAttempted() && form.invalid) {
        <p class="banner banner--danger" role="alert">
          {{ 'create.errors.formInvalid' | t }}
        </p>
      }

      @if (successMessage()) {
        <p class="banner banner--success" role="status">{{ successMessage() }}</p>
      }

      <form class="form" [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <label class="field">
          <span class="field__label">{{ 'create.name' | t }}</span>
          <input class="field__control" type="text" formControlName="name" autocomplete="organization" />
          @if (showError('name')) {
            <span class="field__error" role="alert">{{ nameError() }}</span>
          }
        </label>

        <label class="field">
          <span class="field__label">{{ 'create.status' | t }}</span>
          <select class="field__control" formControlName="status">
            <option value="active">{{ 'status.active' | t }}</option>
            <option value="inactive">{{ 'status.inactive' | t }}</option>
            <option value="suspended">{{ 'status.suspended' | t }}</option>
          </select>
          @if (showError('status')) {
            <span class="field__error" role="alert">{{ 'create.errors.required' | t }}</span>
          }
        </label>

        <label class="field">
          <span class="field__label">{{ 'create.ownerEmail' | t }}</span>
          <input class="field__control" type="email" formControlName="ownerEmail" autocomplete="email" />
          @if (showError('ownerEmail')) {
            <span class="field__error" role="alert">{{ emailError() }}</span>
          }
        </label>

        <label class="field">
          <span class="field__label">{{ 'create.memberCount' | t }}</span>
          <input class="field__control" type="number" formControlName="memberCount" min="0" step="1" />
          @if (showError('memberCount')) {
            <span class="field__error" role="alert">{{ 'create.errors.memberMin' | t }}</span>
          }
        </label>

        <button class="submit" type="submit">{{ 'create.submit' | t }}</button>
      </form>
    </section>
  `,
  styles: `
    .create {
      background: var(--color-surface-raised);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: var(--space-5);
      box-shadow: var(--shadow-sm);
    }

    h2 {
      margin: 0 0 var(--space-4);
      font-size: var(--font-size-lg);
      line-height: var(--line-height-tight);
    }

    .form {
      display: grid;
      gap: var(--space-4);
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .field__label {
      font-size: var(--font-size-sm);
      color: var(--color-text-muted);
    }

    .field__control {
      height: var(--control-height);
      padding-inline: var(--space-3);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      color: var(--color-text);
    }

    .field__control.ng-invalid.ng-touched {
      border-color: var(--color-danger);
    }

    .field__error {
      color: var(--color-danger);
      font-size: var(--font-size-sm);
    }

    .banner {
      margin: 0 0 var(--space-4);
      padding: var(--space-3);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-sm);
    }

    .banner--danger {
      background: var(--color-danger-bg);
      color: var(--color-danger);
    }

    .banner--success {
      background: var(--color-success-bg);
      color: var(--color-success);
    }

    .submit {
      height: var(--control-height);
      border: 0;
      border-radius: var(--radius-sm);
      background: var(--color-brand);
      color: var(--color-surface-raised);
      cursor: pointer;
      padding-inline: var(--space-4);
    }

    .submit:hover {
      background: var(--color-brand-hover);
    }
  `,
})
export class OrganisationCreateFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(OrganisationStore);
  private readonly i18n = inject(TranslationService);

  readonly created = output<void>();

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
