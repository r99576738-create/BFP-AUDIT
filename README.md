# Building Fit Audit

Application d'audit des salles de sport Building Fit (Tunisie) : formulaire bilingue FR/AR en plusieurs étapes, **note calculée automatiquement** à partir des réponses, enregistrement des audits et consultation (liste, fiche, modification, impression/PDF, suppression).

- Front : Angular 19, hébergé en statique sur **Vercel**
- Données et comptes : **Supabase** (Postgres + Auth), appelé directement depuis le navigateur avec la clé publique `anon` ; l'accès est protégé par les règles RLS (seuls les utilisateurs connectés lisent/écrivent).

## 1. Mettre en place Supabase (une seule fois)

1. Créer un projet sur [supabase.com](https://supabase.com).
2. **SQL Editor** → coller le contenu de [`supabase/schema.sql`](supabase/schema.sql) → *Run*. (Le script peut être relancé sans risque.)
3. **Authentication → Sign In / Providers** → désactiver *Allow new users to sign up* : personne ne peut créer de compte seul.
4. **Authentication → Users → Add user → Create new user** pour chaque auditeur (email + mot de passe, cocher *Auto Confirm User*).
5. **Project Settings → API** : noter l'**URL du projet** et la **clé `anon` / publishable**. (Ne jamais utiliser la clé `service_role` dans cette application.)

## 2. Lancer en local

```bash
cp .env.example .env      # puis renseigner SUPABASE_URL et SUPABASE_ANON_KEY
npm install
npm start                 # http://localhost:4200
```

`npm start`, `npm run build` et `npm test` génèrent d'abord `src/environments/environment.ts` à partir des variables (script `scripts/set-env.mjs`). Ce fichier n'est pas versionné.

## 3. Déployer sur Vercel

1. Pousser le dépôt sur GitHub, puis sur Vercel : *Add New → Project* → importer le dépôt.
2. Les réglages de build sont lus dans [`vercel.json`](vercel.json) (`npm run build`, sortie `dist/building-fit-audit/browser`, toutes les routes servies par `index.html`).
3. *Settings → Environment Variables* : ajouter `SUPABASE_URL` et `SUPABASE_ANON_KEY` (Production et Preview), puis redéployer.
4. Dans Supabase, *Authentication → URL Configuration* : mettre l'URL Vercel comme *Site URL*.

Si une variable manque, le build échoue avec un message explicite au lieu de publier une application cassée.

## 4. La note d'audit

Le calcul est fait par `ScoringService` (`src/app/features/audit/data/scoring.service.ts`) à partir du barème déclaré dans [`public/assets/data/form.json`](public/assets/data/form.json) :

| Où | Propriété | Effet |
|---|---|---|
| Section | `"weight": 20` | Poids de la section dans la note globale (absent ou 0 = section non notée) |
| Question Oui/Non | `"points": 3` | Oui = 3 points, Non = 0 |
| Question Oui/Non | `"critical": true` | Un « Non » est un **point critique** |
| Option d'un choix | `"points": 2` | Points obtenus si cette option est choisie |
| Nombre | `"scoreRanges": [{ "max": 3, "points": 3 }, …, { "points": 0 }]` | Première tranche dont `max` ≥ valeur |

Règles :

- Note de section = points obtenus / points possibles × 100 ; note globale = moyenne pondérée par `weight`, sur 100.
- Une question facultative sans réponse, ou masquée par une condition, ne compte ni pour ni contre.
- Lettre : **A** ≥ 85, **B** ≥ 70, **C** ≥ 55, **D** ≥ 40, **E** < 40.
- Au moins un point critique ⇒ la lettre est plafonnée à **C** (la note chiffrée ne change pas).
- La note est figée à l'enregistrement (avec la version du formulaire) ; elle est recalculée quand l'audit est modifié et ré-enregistré.

Pour changer le barème : modifier `form.json`, augmenter `meta.version`, redéployer. Les audits déjà enregistrés gardent leur note jusqu'à leur prochaine modification.

## 5. Tests

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

Les tests couvrent le calcul de la note, les brouillons, la conversion vers la base, l'affichage des réponses et la recherche.
