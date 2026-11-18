import { Injectable, NgZone } from '@angular/core';
import type { Session } from '@supabase/supabase-js';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionSubject = new BehaviorSubject<Session | null>(null);
  readonly session$ = this.sessionSubject.asObservable();
  private readonly ready: Promise<void>;

  constructor(private supabase: SupabaseService, zone: NgZone) {
    this.ready = this.supabase.client.auth
      .getSession()
      .then(({ data }) => this.sessionSubject.next(data.session))
      .catch(() => this.sessionSubject.next(null));

    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      zone.run(() => this.sessionSubject.next(session));
    });
  }

  get email(): string | null {
    return this.sessionSubject.value?.user?.email ?? null;
  }

  async currentSession(): Promise<Session | null> {
    await this.ready;
    return this.sessionSubject.value;
  }

  /** Renvoie null si la connexion réussit, sinon le code (ou message) d'erreur Supabase. */
  async signIn(email: string, password: string): Promise<string | null> {
    try {
      const { error } = await this.supabase.client.auth.signInWithPassword({ email: email.trim(), password });
      return error ? (error.code ?? error.message) : null;
    } catch (e: any) {
      return e?.message ?? 'network_error';
    }
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
  }
}
