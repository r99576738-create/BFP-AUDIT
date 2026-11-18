import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { LocaleService } from '../../audit/data/locale.service';

@Component({
  selector: 'app-login-page',
  standalone: false,
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
})
export class LoginPageComponent {
  loading = false;
  errorCode: string | null = null;

  readonly form;

  constructor(
    fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    public i18n: LocaleService,
  ) {
    this.form = fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.loading) return;

    this.loading = true;
    this.errorCode = null;
    const { email, password } = this.form.getRawValue();
    const code = await this.auth.signIn(email, password);
    this.loading = false;

    if (code) {
      this.errorCode = code;
      return;
    }
    this.router.navigate(['/audits']);
  }

  get error(): string | null {
    if (!this.errorCode) return null;
    if (this.errorCode === 'invalid_credentials') {
      return this.i18n.tr('Email ou mot de passe incorrect.', 'البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    }
    if (/fetch|network/i.test(this.errorCode)) {
      return this.i18n.tr('Serveur injoignable. Vérifiez votre connexion internet puis réessayez.', 'تعذّر الاتصال بالخادم. تحقّق من اتصالك بالإنترنت ثم أعد المحاولة.');
    }
    return this.i18n.tr(`Connexion impossible (${this.errorCode}).`, `تعذّر تسجيل الدخول (${this.errorCode}).`);
  }
}
