# Building Fit Audit — audits enregistrés, scoring automatique, déploiement Vercel

Date : 2026-11-07
Statut : à valider

## 1. Intention

Building Fit audite des salles de sport en Tunisie avec un formulaire bilingue FR/AR (Angular 19, piloté par `public/assets/data/form.json`). Aujourd'hui le formulaire ne fait rien de durable : à l'envoi il affiche le JSON puis efface le brouillon, et la note vient soit d'une saisie manuelle (`overallScore`), soit d'un appel IA exécuté dans le navigateur avec une clé API exposée.

Objectif : une application en ligne sur Vercel où les auditeurs connectés remplissent un audit, l'enregistrent, obtiennent une **note calculée automatiquement à partir des réponses**, et peuvent consulter, modifier, imprimer et supprimer les audits enregistrés.

## 2. Objectifs

- Déployer l'application sur Vercel (SPA statique).
- Enregistrer chaque audit dans Supabase (Postgres).
- Accès réservé aux auditeurs connectés (Supabase Auth, email + mot de passe).
- Note automatique sur 100, lettre A–E, note par section, liste des points critiques, calculées de façon déterministe à partir des réponses et d'un barème déclaré dans `form.json`.
- Page « Audits » : liste avec note, recherche, accès à la fiche.
- Fiche d'audit : toutes les réponses, la note détaillée, les signatures ; actions Modifier, Imprimer/PDF, Supprimer.
- Supprimer entièrement la partie IA.

## 3. Non-objectifs

- Pas d'éditeur de formulaire dans l'application : questions et barème restent dans `form.json`, modifié puis redéployé.
- Pas d'inscription publique : les comptes sont créés par l'administrateur dans le tableau de bord Supabase.
- Pas de rôles différenciés (admin/auditeur) : tous les comptes connectés ont les mêmes droits.
- Pas de génération PDF côté serveur : l'impression passe par le navigateur (`window.print()` + feuille de style d'impression).
- Pas de mode hors-ligne au-delà du brouillon local existant.
- Pas de tableau de bord statistique multi-audits.

## 4. Anti-objectifs (échec même si « ça marche »)

- Une clé secrète présente dans le bundle JavaScript.
- Des audits lisibles par quelqu'un qui n'est pas connecté.
- Une note qui change toute seule après coup : la note d'un audit est figée au moment de l'enregistrement (avec la version du formulaire), recalculée seulement quand l'audit est modifié et ré-enregistré.
- Un « Audit enregistré » affiché alors que l'écriture en base a échoué.
- Perte de saisie : le brouillon local doit survivre à un rechargement et à une erreur réseau à l'envoi.

## 5. Contraintes

- Garder Angular 19 en NgModule (`standalone: false`), le style visuel existant (thèmes clair/sombre `bf-*`), le bilinguisme FR/AR avec RTL.
- Préférence de design du propriétaire : **jamais de bande de couleur sur le bord d'une carte, tuile, alerte ou élément de liste** (pas de `border-left` coloré, etc.). La couleur passe par un fond teinté, une pastille, un chiffre coloré ou une étiquette.
- Vercel ne conserve aucun fichier : toute persistance passe par Supabase.
- La clé `anon` Supabase est publique par conception ; la sécurité repose sur les politiques RLS.

## 6. Décisions du propriétaire

| Sujet | Décision |
|---|---|
| Stockage | Supabase |
| Accès | Comptes auditeurs (email + mot de passe), seuls les connectés voient et remplissent les audits |
| « Formulaire dynamique » | Formulaire réellement fonctionnel, structure et barème pilotés par `form.json` |
| Actions sur un audit | Voir fiche + note, Modifier/compléter, Imprimer/PDF, Supprimer |
| IA | Supprimée |

## 7. Conception

### 7.1 Architecture

```
Navigateur (Angular SPA, hébergée sur Vercel)
   ├── form.json (questions + barème)
   ├── ScoringService (calcul pur, côté client)
   └── supabase-js ──► Supabase
                         ├── Auth (email/mot de passe)
                         └── Postgres : table audits (RLS : authenticated uniquement)
```

Pas de fonction serveur : l'application parle directement à Supabase avec la clé `anon` et la session de l'utilisateur.

### 7.2 Configuration et variables d'environnement

- Variables : `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- Un script Node (`scripts/set-env.mjs`) exécuté avant chaque build (`prebuild`) et avant `start` génère `src/environments/environment.ts` à partir de `process.env` (et d'un fichier `.env` local s'il existe, via `process.loadEnvFile`). Le fichier généré est ignoré par git ; un `src/environments/environment.example.ts` documente la forme.
- Si les variables manquent, le script échoue avec un message clair (pas de build silencieusement cassé).
- Sur Vercel, les deux variables sont définies dans les réglages du projet.

### 7.3 Base de données (`supabase/schema.sql`, versionné)

Table `public.audits` :

| Colonne | Type | Rôle |
|---|---|---|
| `id` | uuid, PK, `gen_random_uuid()` | identifiant |
| `created_at` | timestamptz, `now()` | création |
| `updated_at` | timestamptz, `now()`, trigger | dernière modification |
| `created_by` | uuid → `auth.users`, défaut `auth.uid()` | auteur |
| `updated_by` | uuid → `auth.users` | dernier modificateur |
| `form_id`, `form_version` | text | version du formulaire utilisée pour la note |
| `gym_name`, `governorate`, `city`, `auditor_name` | text | colonnes dénormalisées pour la liste et la recherche |
| `audit_date` | date | date de l'audit |
| `answers` | jsonb | toutes les réponses (signatures incluses, en data URL PNG) |
| `score` | numeric(5,1) | note /100 |
| `grade` | text (`A`–`E`) | lettre finale (après plafonnement éventuel) |
| `critical_count` | int | nombre de points critiques |
| `score_details` | jsonb | détail du calcul (voir 7.5) |

RLS activée ; politiques `select`, `insert`, `update`, `delete` pour le rôle `authenticated` sur toutes les lignes (équipe partagée). Aucune politique pour `anon`.

Dans Supabase : inscriptions publiques désactivées ; comptes créés via « Authentication › Users › Add user ».

### 7.4 Barème dans `form.json`

Extensions du schéma (toutes optionnelles, rétro-compatibles) :

- **Section** : `"weight": <nombre>` — poids de la section dans la note globale. Absent ou 0 = section non notée.
- **Champ `toggle`** : `"points": <n>` — Oui = n, Non = 0. `"critical": true` — un Non est un point critique.
- **Champ `choice`** : chaque option porte `"points": <n>` ; le maximum du champ = plus grand nombre de points parmi ses options.
- **Champ `number`** : `"scoreRanges": [{ "max": 3, "points": 3 }, { "max": 7, "points": 2 }, { "max": 12, "points": 1 }, { "points": 0 }]` — première tranche dont `max` ≥ valeur (la dernière sans `max` attrape le reste) ; maximum du champ = plus grand nombre de points.
- Les autres types ne sont jamais notés.

Barème initial (proposé, modifiable dans le fichier) :

| Section | Poids | Champs notés (points) — *critique* |
|---|---|---|
| Légal | 20 | operatingLicense 3 *critique*, tradeRegister 2, liabilityInsurance 3 *critique*, taxCompliance 2, mandatoryPosters 1 |
| Sécurité | 20 | emergencyExitsVisible 3 *critique*, extinguishersValid 3 *critique*, firstAidKit 2 *critique*, emergencyProcedurePosted 1, staffFirstAidTrained 2 |
| Hygiène | 15 | generalCleanliness 3/2/1/0, machineCleaning 2/1/0, floorsSafe 2, disinfectantsAvailable 1, lockerRoomsClean 2, showersWorking 2, hotWater 1, toiletsClean 2, odorsHumidity 3/2/1/0 |
| Infrastructure | 15 | circulationZoning 2, lighting 3/2/1/0, ventilation 3/2/1/0, sportsFloor 2, wallsCeilingsState 3/2/1/0, mirrorQuality 1 |
| Équipements | 10 | avgMachineAge ≤3 ans 3, ≤7 ans 2, ≤12 ans 1, sinon 0 ; machinesWorking 3, regularMaintenance 2, accessoriesAvailability 2/1/0, usageSignage 1 |
| RH | 10 | certifiedCoaches 3, coachPresence 3/2/1/0, customerRelation 3/2/1/0, staffUniformPresent 1 |
| Expérience client | 5 | welcomeQuality 3/2/1/0, atmosphere 3/2/1/0, peakCrowd 2/1/0, parkingAvailability 3/2/1/0, clientFeedbackCollected 2 |
| Marketing | 5 | pricingMarketFit 2, promotions 1, digitalPresence 4/3/2/1/0, visualIdentityCoherent 2, loyaltyProgram 1 |
| Général, Évaluation globale, Recommandations | 0 | — |

(Pour les choix, les points suivent l'ordre des options dans `form.json`, de la meilleure à la moins bonne.)

Le champ manuel `overallScore` est **supprimé** de la section « Évaluation globale » (remplacé par la note calculée) ; `strengths` et `improvements` restent.

### 7.5 Calcul de la note (`ScoringService`, fonction pure)

Entrées : définition du formulaire + réponses. Sortie (`AuditScore`) :

```ts
{
  score: number;            // 0–100, arrondi à 0,1
  rawGrade: 'A'|'B'|'C'|'D'|'E';
  grade: 'A'|'B'|'C'|'D'|'E';   // après plafonnement
  capped: boolean;
  sections: { id; weight; earned; max; percent }[];
  criticalFailures: string[];   // clés des champs critiques répondus Non
  answeredScorable: number;     // champs notés répondus
  totalScorable: number;        // champs notés visibles
}
```

Règles :
1. Un champ noté compte seulement s'il est **visible** (règle `visibleWhen`) **et répondu**. Un champ facultatif non répondu est neutre (ni gagné ni perdu).
2. Note de section = points gagnés / points max × 100. Une section sans aucun point max est exclue.
3. Note globale = moyenne pondérée des notes de section par `weight`, sur les seules sections incluses.
4. Lettre : A ≥ 85, B ≥ 70, C ≥ 55, D ≥ 40, E < 40.
5. **Plafonnement** : s'il existe au moins un point critique, la lettre ne peut pas dépasser C (la note chiffrée n'est pas modifiée). L'interface affiche la raison (« Lettre plafonnée à C : 2 points critiques »).
6. La note est calculée au moment de l'enregistrement et stockée (`score`, `grade`, `critical_count`, `score_details`, `form_version`). La fiche affiche la note stockée ; les libellés viennent du `form.json` courant.

Le wizard affiche aussi une note **provisoire** en direct (petit indicateur pendant la saisie) — décision du constructeur sur l'emplacement exact.

### 7.6 Pages et navigation

| Route | Page | Accès |
|---|---|---|
| `/login` | Connexion email + mot de passe, message d'erreur bilingue | public (redirige vers `/audits` si déjà connecté) |
| `/audits` | Liste | connecté |
| `/audits/new` | Wizard vierge (ou brouillon « nouveau » restauré) | connecté |
| `/audits/:id` | Fiche | connecté |
| `/audits/:id/edit` | Wizard pré-rempli avec l'audit | connecté |
| `''` et `**` | redirection vers `/audits` | — |

Un garde de route redirige vers `/login` sans session. La barre du haut (logo, langue FR/AR, thème, déconnexion, lien « Audits ») est déplacée de `AuditPageComponent` vers un shell commun dans `AppComponent` ; elle est masquée sur `/login` sauf langue/thème.

**Liste `/audits`** : bouton « Nouvel audit » ; recherche texte (salle, ville, auditeur) ; tri par date d'audit décroissante ; chaque ligne/carte montre salle, gouvernorat/ville, date, auditeur, note /100, lettre en pastille colorée, nombre de points critiques ; clic → fiche. La requête ne sélectionne pas `answers` (signatures lourdes). États vide, chargement, erreur.

**Fiche `/audits/:id`** : en-tête (salle, adresse, date, auditeur) ; bloc note (anneau /100, lettre, mention de plafonnement) ; barres par section ; liste des points critiques (libellé de la question) ; toutes les réponses groupées par section, dans la langue courante (Oui/Non, libellé de l'option choisie, nom du gouvernorat) ; signatures en image ; champs vides affichés « — » ; champs conditionnels masqués non affichés. Actions : Modifier, Imprimer (feuille de style d'impression : fond blanc, sans barre du haut ni boutons), Supprimer (confirmation, puis retour à la liste).

**Wizard** : comportement actuel conservé (étapes, validation, en-têtes au choix). À l'envoi : calcul de la note → insertion (nouveau) ou mise à jour (édition) → navigation vers la fiche. Pendant l'envoi le bouton est désactivé avec un état « Enregistrement… » ; en cas d'erreur, message visible, le brouillon est conservé et l'utilisateur peut réessayer. Le brouillon local n'est effacé qu'après succès.

### 7.7 Brouillons et réinitialisation

Un **seul** mécanisme de brouillon, dans `AuditFormService` : clé `bf_audit_draft_<formId>_new` pour un nouvel audit, `bf_audit_draft_<formId>_<id>` pour une modification. Le code de brouillon en double dans `AuditPageComponent` et `AuditWizardComponent` est supprimé. « Réinitialiser » efface le brouillon de la clé courante et remet le formulaire à ses valeurs par défaut (ou aux valeurs enregistrées en mode édition), sans recharger la page.

*Choix du rédacteur :* en mode édition, le brouillon mémorise le `updated_at` de l'audit sur lequel il a été commencé ; il n'est restauré que si l'audit en base a toujours ce même `updated_at` (sinon quelqu'un l'a ré-enregistré entre-temps : le brouillon est ignoré et effacé). Cette comparaison ne dépend pas de l'horloge de l'appareil. Le brouillon est aussi sauvegardé immédiatement avant chaque envoi et quand la page est masquée ou fermée. Deux personnes qui modifient le même audit en même temps : la dernière sauvegarde l'emporte (pas de verrouillage). Les colonnes dénormalisées (`gym_name`, `city`, `audit_date`…) sont réécrites à chaque sauvegarde à partir des réponses.

### 7.8 Nettoyage

- Supprimer `aimlapi-audit.service.ts` (+ spec), le composant `ai-rapport` (+ déclarations module), toute référence à AIMLAPI et à la clé.
- `index.html` : retirer la fausse note agrégée (4.8/127) du JSON-LD, les liens vers icônes/manifest/browserconfig inexistants, passer `robots` à `noindex, nofollow` (outil interne), retirer canonical/hreflang/og pointant vers un domaine non utilisé.
- Remettre des budgets Angular raisonnables si possible après suppression du gros SCSS IA (sinon les laisser).

### 7.9 Déploiement Vercel

- `vercel.json` : `outputDirectory: dist/building-fit-audit/browser`, réécriture de toutes les routes vers `/index.html` (les fichiers statiques existants restent servis en priorité).
- README : étapes pas à pas — créer le projet Supabase, exécuter `supabase/schema.sql`, désactiver les inscriptions, créer les comptes auditeurs, renseigner les variables dans Vercel, importer le dépôt dans Vercel.

### 7.10 Tests

- Tests unitaires du `ScoringService` (cas : tout Oui = 100/A ; champ facultatif non répondu neutre ; champ conditionnel masqué ignoré ; tranche numérique ; un critique plafonne à C ; section sans points exclue).
- Vérification manuelle dans le navigateur : connexion, création, liste, fiche, modification, impression, suppression, FR/AR, clair/sombre.

## 8. Laissé au constructeur

- Structure exacte des composants/services et noms de fichiers.
- Mise en page détaillée de la liste (tableau sur desktop, cartes sur mobile) et de la fiche, dans le respect du style existant et de la contrainte « pas de bande colorée ».
- Couleurs des lettres A–E (cohérentes avec les thèmes).
- Emplacement de l'indicateur de note provisoire dans le wizard.
- Choix de garder ou non le sélecteur de design d'en-tête du wizard.
