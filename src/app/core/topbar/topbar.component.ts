import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service';
import { ThemeService } from '../theme.service';
import { LocaleService } from '../../features/audit/data/locale.service';

@Component({
  selector: 'app-topbar',
  standalone: false,
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent implements OnInit, OnDestroy {
  signedIn = false;
  scrolled = false;
  private sub?: Subscription;

  constructor(
    public i18n: LocaleService,
    public theme: ThemeService,
    public auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.theme.init();
    this.i18n.setLocale(this.i18n.locale);

    this.sub = this.auth.session$.subscribe(session => {
      const wasSignedIn = this.signedIn;
      this.signedIn = !!session;
      if (wasSignedIn && !session) this.router.navigate(['/login']);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.scrolled = (window.pageYOffset || document.documentElement.scrollTop) > 10;
  }

  setLang(locale: 'fr' | 'ar'): void {
    this.i18n.setLocale(locale);
  }

  async signOut(): Promise<void> {
    await this.auth.signOut();
    this.router.navigate(['/login']);
  }
}
