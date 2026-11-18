# Audits enregistrés, scoring et Vercel — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Les auditeurs connectés remplissent un audit, l'enregistrent dans Supabase avec une note calculée automatiquement, puis le consultent, le modifient, l'impriment ou le suppriment ; l'application est déployable sur Vercel.

**Architecture:** SPA Angular 19 (NgModule) servie statiquement par Vercel ; `@supabase/supabase-js` appelé directement depuis le navigateur (clé `anon` + RLS `authenticated`). Le barème vit dans `form.json` ; un `ScoringService` pur calcule la note ; un `AuditRepository` encapsule la table `audits`.

**Tech Stack:** Angular 19.2, RxJS 7.8, @supabase/supabase-js 2.x, Jasmine/Karma (ChromeHeadless), Vercel.

**Spec:** `docs/superpowers/specs/2026-11-07-audits-enregistres-et-scoring-design.md`

## Global Constraints

- Composants `standalone: false`, déclarés dans `AppModule`.
- Tout texte visible existe en FR et AR ; `dir` RTL respecté.
- Jamais de bande de couleur sur le bord d'une carte, tuile, alerte ou élément de liste ; couleur via fond teinté, pastille, chiffre coloré ou étiquette.
- Aucune clé secrète dans le bundle ; seules `SUPABASE_URL` et `SUPABASE_ANON_KEY`.
- Lettres : A ≥ 85, B ≥ 70, C ≥ 55, D ≥ 40, E < 40 ; ≥ 1 point critique ⇒ lettre plafonnée à C.
- Note arrondie à 0,1 ; stockée avec `form_version`.
- Le brouillon local n'est effacé qu'après un enregistrement réussi.

## Review Focus

1. Champ `number` vidé (valeur `null` ou `''`) : non répondu, neutre — pas 0 point. → test Task 1.
2. Option de choix inconnue (ancienne version de `form.json`) : traitée comme non répondue. → test Task 1.
3. Échec d'écriture Supabase (réseau, session expirée, RLS) : message visible, bouton réactivé, brouillon conservé. → vérification Task 5.
4. Variables d'environnement absentes au build : le build échoue avec un message clair. → vérification Task 2.
5. Rechargement direct d'une URL profonde (`/audits/<id>`) sur Vercel : servie par `index.html`. → `vercel.json` Task 7 + vérification avec un serveur statique.

---

### Task 1: Modèle de barème, visibilité partagée et `ScoringService`

**Files:**
- Modify: `src/app/features/audit/audit.models.ts`
- Create: `src/app/features/audit/data/field-visibility.ts`
- Create: `src/app/features/audit/data/scoring.service.ts`
- Test: `src/app/features/audit/data/scoring.service.spec.ts`
- Modify: `src/app/features/audit/components/field-renderer/field-renderer.component.ts` (utiliser `isFieldVisible`)
- Modify: `src/app/features/audit/data/audit-form.service.ts` (`isSectionValid` ignore les champs masqués)

**Interfaces:**
- Produces (audit.models.ts) : `AuditSection.weight?: number` ; `AuditField.points?: number`, `critical?: boolean`, `scoreRanges?: { max?: number; points: number }[]` ; `AuditOption.points?: number` ; `Grade = 'A'|'B'|'C'|'D'|'E'` ; `SectionScore { id: string; weight: number; earned: number; max: number; percent: number }` ; `AuditScore { score: number; rawGrade: Grade; grade: Grade; capped: boolean; sections: SectionScore[]; criticalFailures: string[]; answeredScorable: number; totalScorable: number }`.
- Produces : `isFieldVisible(field: AuditField, values: Record<string, unknown>): boolean` ; `hasAnswer(value: unknown): boolean`.
- Produces : `ScoringService.compute(def: AuditFormDefinition, answers: Record<string, unknown>): AuditScore` ; `ScoringService.gradeFor(score: number): Grade`.

- [ ] **Step 1: Écrire les tests** (`scoring.service.spec.ts`, définition minimale construite dans le test, 2 sections `a` poids 60 et `b` poids 40) :
  - `tout Oui / meilleures options` → `score === 100`, `grade === 'A'`, `criticalFailures.length === 0`.
  - `toggle Non sur critique` → `criticalFailures` contient la clé ; si `rawGrade` vaut A, `grade === 'C'` et `capped === true`.
  - `facultatif non répondu neutre` : un toggle non requis `null` ne change ni `earned` ni `max` de sa section.
  - `champ masqué ignoré` : champ noté avec `visibleWhen` non satisfait exclu même s'il a une valeur.
  - `number vide neutre` : `null` et `''` → non répondu ; `scoreRanges` : 2 → 3 pts, 5 → 2 pts, 20 → 0 pt.
  - `option inconnue` : valeur `'zzz'` → non répondue.
  - `section sans points exclue` : section poids 20 sans champ noté n'affecte pas la moyenne.
  - `pondération` : section a 50 %, section b 100 % → score `70` (0,6×50 + 0,4×100).
  - `gradeFor` : 85→A, 84.9→B, 70→B, 55→C, 40→D, 39.9→E.
- [ ] **Step 2: Lancer** `npx ng test --watch=false --browsers=ChromeHeadless --include=src/app/features/audit/data/scoring.service.spec.ts` → échec (service absent).
- [ ] **Step 3: Implémenter** types, `field-visibility.ts` (logique `equals`/`in` reprise du renderer), `ScoringService` (règles 1–5 de la spec §7.5). Le renderer et `isSectionValid` délèguent à `isFieldVisible`.
- [ ] **Step 4: Relancer** → PASS.

### Task 2: Configuration Supabase, environnement et dépendance

**Files:**
- Create: `scripts/set-env.mjs`, `src/environments/environment.example.ts`, `.env.example`
- Generated (gitignored): `src/environments/environment.ts`
- Modify: `package.json` (dépendance `@supabase/supabase-js` épinglée sur une version publiée depuis ≥ 2 semaines ; scripts `prestart`, `prebuild`, `pretest` → `node scripts/set-env.mjs`), `.gitignore` (`.env`, `src/environments/environment.ts`)
- Create: `src/app/core/supabase.service.ts`
- Create: `supabase/schema.sql`

**Interfaces:**
- Produces : `environment = { supabaseUrl: string; supabaseAnonKey: string }` exporté de `src/environments/environment.ts`.
- Produces : `SupabaseService.client: SupabaseClient` (singleton `providedIn: 'root'`).

- [ ] **Step 1:** `set-env.mjs` : `try { process.loadEnvFile() } catch {}` ; lit `SUPABASE_URL`, `SUPABASE_ANON_KEY` ; si absentes → `console.error` explicite + `process.exit(1)` ; écrit `environment.ts`.
- [ ] **Step 2: Vérifier** `env -u SUPABASE_URL -u SUPABASE_ANON_KEY node scripts/set-env.mjs` (sans `.env`) → code 1 et message ; avec `.env` d'exemple → fichier généré.
- [ ] **Step 3:** `schema.sql` : table `public.audits` (colonnes spec §7.3), trigger `updated_at`/`updated_by`, `enable row level security`, 4 politiques `to authenticated using (true) with check (true)`, index sur `audit_date desc`.
- [ ] **Step 4:** `SupabaseService` crée le client avec `auth: { persistSession: true, autoRefreshToken: true }`.
- [ ] **Step 5:** `npx ng build` → OK.

### Task 3: Authentification, garde et shell avec barre du haut

**Files:**
- Create: `src/app/core/auth.service.ts`, `src/app/core/auth.guard.ts`
- Create: `src/app/features/auth/login-page/login-page.component.{ts,html,scss}`
- Create: `src/app/core/topbar/topbar.component.{ts,html,scss}` (contenu déplacé de `audit-page.component.html` lignes 1-111 + styles associés)
- Modify: `src/app/app.component.html`, `src/app/app.module.ts`, `src/app/app-routing.module.ts`

**Interfaces:**
- Consumes : `SupabaseService.client`.
- Produces : `AuthService.session$: Observable<Session | null>` (null tant que non connu → utiliser `ready$`/`getSession()`), `AuthService.currentSession(): Promise<Session | null>`, `signIn(email: string, password: string): Promise<string | null>` (renvoie message d'erreur ou null), `signOut(): Promise<void>`.
- Produces : `authGuard: CanActivateFn` (→ `/login` sans session), `guestGuard: CanActivateFn` (→ `/audits` si session).
- Routes : `login` (guestGuard), `audits` (liste), `audits/new` (wizard), `audits/:id` (fiche), `audits/:id/edit` (wizard), `''`→`audits`, `**`→`audits` ; toutes sauf login sous `authGuard`.

- [ ] **Step 1:** Implémenter AuthService, guards, LoginPage (email, mot de passe, bouton, erreur bilingue, état chargement).
- [ ] **Step 2:** TopbarComponent (logo, FR/AR, thème, lien « Audits » et « Déconnexion » visibles si session) ; `AppComponent` = topbar + `router-outlet` ; la topbar applique `dir`/`lang` et `theme.init()`.
- [ ] **Step 3:** `npx ng build` → OK ; `ng serve`, ouvrir `/audits` sans session → redirigé vers `/login`.

### Task 4: `AuditRepository`

**Files:**
- Create: `src/app/features/audit/data/audit-repository.service.ts`
- Modify: `src/app/features/audit/audit.models.ts`

**Interfaces:**
- Produces (models) : `AuditSummary { id; created_at; updated_at; gym_name; governorate; city; audit_date; auditor_name; score; grade: Grade; critical_count }` ; `AuditRecord extends AuditSummary { form_id; form_version; answers: Record<string, unknown>; score_details: AuditScore }`.
- Produces : `AuditRepository.list(): Promise<AuditSummary[]>` (sans `answers`, tri `audit_date desc, created_at desc`), `get(id: string): Promise<AuditRecord>`, `create(def, answers, score): Promise<string>` (id), `update(id, def, answers, score): Promise<void>`, `remove(id): Promise<void>`. Toute erreur Supabase est relancée en `Error` avec message lisible.
- Les colonnes dénormalisées sont dérivées des réponses : `gymName`, `addressGovernorate`, `addressCity`, `auditDate` (`null` si vide), `auditorName`.

- [ ] **Step 1:** Implémenter ; `npx ng build` → OK.

### Task 5: Wizard — enregistrement, brouillon unique, note provisoire, suppression IA

**Files:**
- Delete: `src/app/features/audit/data/aimlapi-audit.service.ts`, `aimlapi-audit.service.spec.ts`, `src/app/features/audit/components/ai-rapport/*`
- Modify: `src/app/features/audit/data/audit-form.service.ts`, `src/app/features/audit/pages/audit-page/audit-page.component.{ts,html,scss}`, `src/app/features/audit/components/audit-wizard/audit-wizard.component.{ts,html,scss}`, `src/app/app.module.ts`
- Modify: `public/assets/data/form.json` (barème spec §7.4 ; retirer `overallScore`)

**Interfaces:**
- Consumes : `ScoringService.compute`, `AuditRepository.create/update/get`.
- Produces : `AuditFormService.loadDefinition(): Observable<AuditFormDefinition>` (mis en cache, `shareReplay(1)`), `buildForm(def, opts: { draftScope: string; initialValues?: Record<string, unknown>; notBefore?: string }): FormGroup` (restaure le brouillon de `bf_audit_draft_<formId>_<draftScope>` sauf s'il est plus ancien que `notBefore`), `clearDraft(formId, draftScope)`, `resetForm(form, def, draftScope, initialValues?)`.
- `AuditWizardComponent` inputs : `def`, `form`, `auditId: string | null`, `draftScope: string`, `initialValues?`.

- [ ] **Step 1:** Supprimer l'IA et ses déclarations ; retirer tout le code brouillon de `AuditPageComponent` et `AuditWizardComponent`.
- [ ] **Step 2:** `AuditPageComponent` lit `:id` ; nouveau → `draftScope 'new'` ; édition → charge `AuditRecord`, `draftScope = id`, `initialValues = answers`, `notBefore = updated_at` ; états chargement/erreur ; bouton Réinitialiser → `resetForm` (sans rechargement).
- [ ] **Step 3:** `submit()` : validation existante → `saving = true` → `compute` → `create`/`update` → `clearDraft` → `router.navigate(['/audits', id])`. En erreur : `saveError` affiché (FR/AR), `saving = false`, brouillon conservé. Bouton désactivé pendant `saving`. Supprimer l'écran « submitted » et le JSON.
- [ ] **Step 4:** Indicateur de note provisoire dans le wizard (note /100 + lettre, recalculée sur `valueChanges` avec `debounceTime(300)`).
- [ ] **Step 5:** Barème dans `form.json`. Vérifier : `node -e` qui charge le JSON et affiche, par section, le poids et la somme des points max (attendu : légal 11, sécurité 11, hygiène 18, infra 14, équipements 11, RH 10, CX 13, marketing 10).
- [ ] **Step 6:** `npx ng build` → OK ; relancer les tests de Task 1 → PASS.

### Task 6: Liste et fiche d'audit (avec impression et suppression)

**Files:**
- Create: `src/app/features/audit/pages/audit-list-page/audit-list-page.component.{ts,html,scss}`
- Create: `src/app/features/audit/pages/audit-detail-page/audit-detail-page.component.{ts,html,scss}`
- Create: `src/app/features/audit/components/score-summary/score-summary.component.{ts,html,scss}`
- Create: `src/app/features/audit/data/answer-format.ts`
- Modify: `src/app/app.module.ts`, `src/styles/bf-ui.scss` (classes de lettre `bf-grade--a…e`, règles `@media print`)

**Interfaces:**
- Consumes : `AuditRepository.list/get/remove`, `isFieldVisible`, `TUNISIA_GOVERNORATES`.
- Produces : `formatAnswer(field: AuditField, value: unknown, locale: Locale): string` (Oui/Non ; libellé d'option ; nom du gouvernorat ; date `dd/mm/yyyy` ; vide → `—`) ; `ScoreSummaryComponent` inputs `score: AuditScore`, `def: AuditFormDefinition`.

- [ ] **Step 1:** Liste : recherche (salle, ville, gouvernorat, auditeur — insensible à la casse et aux accents), tri date décroissante, lettre en pastille, compteur de points critiques, états vide/chargement/erreur, bouton « Nouvel audit ».
- [ ] **Step 2:** Fiche : en-tête, `ScoreSummary` (anneau, lettre, mention plafonnement, barres par section, points critiques avec libellés), réponses par section (sans diviseurs, sans champs masqués), signatures en `<img>`, actions Modifier / Imprimer (`window.print()`) / Supprimer (confirmation → `remove` → `/audits`).
- [ ] **Step 3:** Styles d'impression : fond blanc, topbar et boutons masqués, sections sans coupure interne.
- [ ] **Step 4:** `npx ng build` → OK.

### Task 7: Vercel, index.html, README

**Files:**
- Create: `vercel.json`
- Modify: `src/index.html`, `README.md`, `angular.json` (budgets si possible)

- [ ] **Step 1:** `vercel.json` : `{ "buildCommand": "npm run build", "outputDirectory": "dist/building-fit-audit/browser", "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`.
- [ ] **Step 2:** `index.html` : retirer `aggregateRating`, liens icônes/manifest/browserconfig/og/twitter/canonical/hreflang inexistants ; `robots` → `noindex, nofollow`.
- [ ] **Step 3:** README : mise en place Supabase (schema.sql, inscriptions désactivées, création des comptes), variables locales (`.env`) et Vercel, commandes.
- [ ] **Step 4: Vérifier** `npm run build` puis servir `dist/building-fit-audit/browser` en mode SPA et ouvrir `/audits/xyz` directement → l'application se charge (redirige vers `/login`).

### Task 8: Vérification de bout en bout

- [ ] Avec un projet Supabase (celui du propriétaire ou local) : connexion, création d'un audit complet, note affichée, liste, fiche, modification (note recalculée), impression, suppression ; FR/AR ; clair/sombre ; mobile 375 px.
- [ ] Sans projet Supabase disponible : vérifier au minimum login (erreur affichée proprement), garde de route, wizard + note provisoire, et le dire explicitement au propriétaire.
