# Feature 09 — Comptes utilisateur et base de données SQLite

| | |
| --- | --- |
| **Statut** | À faire (plan à valider) |
| **Personne active** | OverAngelix |
| **Périmètre** | `server/` et `client/` |
| **Dépend de** | [08 — Grille de 28 cases (7 × 4, 4 × 7 en portrait)](08-grille-28-cases.md) |

## Explication de la feature

Une fois en production, plusieurs personnes utiliseront SDPC, chacune avec **sa propre grille**. Deux changements liés :

1. **Base de données.** Les boutons ne sont plus conservés dans `data/buttons.json` mais dans une base **SQLite**, un fichier local géré par le serveur (`data/sdpc.db`), sans service à installer. C'est la persistance de la V1 multi-utilisateur ; une vraie base (PostgreSQL) viendra plus tard, sans changer l'API ni le client.
2. **Comptes.** Une personne crée un compte (e-mail et mot de passe), se connecte, et ne voit et ne modifie que ses propres boutons. Sans connexion, l'application affiche la page de connexion.

Cette feature **remplace** la règle « pas de compte utilisateur » et « configuration conservée dans un fichier JSON » de la V1 (`CLAUDE.md`, `README.md`).

## TODO

### Étape 1 — SQLite à la place du JSON (comportement inchangé, un seul utilisateur)

- [x] Serveur : dépendance SQLite (voir les décisions), ouverture de la base, mode WAL, clés étrangères activées
- [x] Serveur : migrations numérotées (`PRAGMA user_version`), lancées au démarrage ; table `buttons`
- [x] Serveur : `ButtonStore` réécrit sur SQLite ; mêmes méthodes, mêmes règles, mêmes erreurs (400, 404, 409) ; la file d'écriture et le fichier temporaire disparaissent
- [x] Serveur : variable `DATABASE_FILE` à la place de `DATA_FILE` (`.env`, `.env.example`), fichiers `data/*.db*` ignorés par git
- [x] Tests serveur : base (migrations, clés étrangères, unicité), store ; les tests existants (`store`, `router`) restent verts

### Étape 2 — Comptes et sessions (serveur)

- [ ] Migration : tables `users` et `sessions`
- [ ] Mot de passe haché (`scrypt` de `node:crypto`, sel par personne, comparaison en temps constant)
- [ ] `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- [ ] Session : jeton aléatoire dans un cookie `httpOnly`, `SameSite=Lax`, `Secure` en production ; seul son empreinte est stockée en base
- [ ] Validation : e-mail valide et unique (insensible à la casse), mot de passe de 8 à 128 caractères
- [ ] Limitation des tentatives de connexion (essais échoués par adresse IP et e-mail)
- [ ] CORS restreint à `CLIENT_ORIGIN` (le cookie impose une origine explicite)
- [ ] Tests serveur : inscription, doublon, connexion, mauvais mot de passe, déconnexion, session expirée

### Étape 3 — Une grille par personne (serveur)

- [ ] Migration : `buttons.user_id` (clé étrangère, suppression en cascade avec le compte)
- [ ] Middleware d'authentification sur `/api/buttons` : 401 sans session valide
- [ ] Toutes les lectures et écritures du store filtrées par `userId` ; un identifiant d'un autre compte donne 404, jamais 403
- [ ] L'unicité d'un emplacement et le parent dossier valent par personne
- [ ] Tests serveur : isolation entre deux comptes (lecture, modification, déplacement, suppression)

### Étape 4 — Client

- [ ] Interfaces `User` et formulaires dans `client/src/interfaces/`, API `api/auth.ts`
- [ ] Store Pinia `auth` (personne connectée, chargement via `/api/auth/me` au démarrage)
- [ ] Pages **Connexion** et **Créer un compte** (Vuetify, messages d'erreur en français), garde de navigation du routeur
- [ ] Barre d'application : adresse e-mail et bouton Se déconnecter ; sur téléphone, icône seule
- [ ] `http.ts` : un 401 renvoie à la page de connexion ; les boutons déjà chargés sont vidés à la déconnexion
- [ ] Tests client : store `auth`, garde de navigation

### Étape 5 — Documentation

- [ ] `CLAUDE.md`, `README.md` : comptes, SQLite, variables d'environnement, commandes
- [ ] README des features : ligne 09, retrait de « Creation de compte » et « Base de données au lieu de json » de « Plus tard »
- [ ] Fiche mise à jour, vérification manuelle (voir plus bas)

## Décisions (proposées)

- **« pgsql lite » = SQLite.** Fichier local, aucune installation, adapté à un premier déploiement. Le SQL reste dans la couche `store` : passer à PostgreSQL plus tard ne touche ni les routes, ni la validation, ni le client.
- **Une seule feature, livrée en étapes.** Chaque étape est un commit distinct et laisse l'application fonctionnelle : l'étape 1 change seulement le stockage, les étapes 2 à 4 ajoutent les comptes.
- **Pilote SQLite : `better-sqlite3`** (synchrone, éprouvé, binaires précompilés). Alternative écartée : `node:sqlite`, sans dépendance mais encore marqué expérimental dans Node. Les appels synchrones conviennent à SQLite local ; le store garde ses méthodes `async` pour ne pas changer les routes et pour que PostgreSQL puisse les remplacer.
- **Échange de deux boutons : passage par l'emplacement -1.** L'index d'unicité refuse deux boutons sur le même emplacement, même un instant, et SQLite ne permet pas de le différer. Le déplacement se fait donc en trois mises à jour dans une transaction (le bouton déplacé en -1, l'occupant à l'ancienne place, puis le bouton à sa place).
- **Schéma des boutons** : `id` (UUID), `user_id`, `parent_id` (clé étrangère vers `buttons`, `ON DELETE CASCADE`), `position`, `label`, `icon`, `type`, `color`, `url`. La suppression en cascade remplace la boucle de suppression des enfants du store actuel. L'unicité d'un emplacement est un index unique sur `(user_id, parent_id, position)` ; comme SQLite considère deux `NULL` comme différents, la racine (`parent_id` nul) a son propre index partiel. Les règles métier (parent dossier, emplacement 0 réservé, positions 0 à 27) restent dans `validation.ts` : la base n'est qu'un filet de sécurité.
- **Identifiant de connexion : l'e-mail**, enregistré en minuscules. Pas de pseudo : il faudra un e-mail pour réinitialiser un mot de passe plus tard.
- **Sessions côté serveur plutôt que JWT.** Un cookie opaque, stocké haché en base, se révoque (déconnexion, compte supprimé) ; un JWT non. Cookie `httpOnly` (illisible par le JavaScript de la page), `SameSite=Lax` (protège des requêtes forgées depuis un autre site, la seule écriture se fait en JSON). Durée : 30 jours. Lecture du cookie écrite à la main (une fonction) pour ne pas ajouter de dépendance.
- **Mot de passe : `scrypt` de Node.** Aucune dépendance native de plus ; paramètres par défaut renforcés. Aucune règle de composition (majuscules, chiffres…), seulement une longueur minimale de 8.
- **Inscription ouverte.** Tout le monde peut créer un compte (le but est d'ouvrir l'application à plusieurs personnes). Pas de vérification d'e-mail dans cette feature : l'adresse sert d'identifiant uniquement.
- **Un identifiant d'un autre compte renvoie 404.** On ne révèle pas l'existence d'un bouton qui n'est pas à soi.
- **Message de connexion unique** (« E-mail ou mot de passe incorrect ») pour ne pas révéler si une adresse a un compte. L'inscription, elle, indique qu'une adresse est déjà prise : c'est inévitable sans vérification par e-mail.
- **Même origine en développement et en production.** Le proxy de Vite sert déjà `/api` depuis le port 3000, donc le cookie reste sur une seule origine. CORS n'est ouvert qu'à `CLIENT_ORIGIN` si elle est définie (ouvert à tous aujourd'hui, ce qui est incompatible avec les cookies).
- **Pas de reprise de l'ancien `data/buttons.json`.** Il ne contenait que des boutons d'essai : on repart de zéro. La migration qui ajoute `user_id` (étape 3) vide donc la table `buttons`, faute de propriétaire à leur donner. Le fichier JSON n'est plus lu ; il peut être supprimé.
- **Les réglages locaux (sons, thème) restent dans le navigateur.** Ils ne passent pas en base ; ils pourront être rattachés au compte avec la future page de configuration de l'application.
- **Hors périmètre, prévu pour la feature 10** : réinitialisation de mot de passe et vérification par e-mail (il faut un envoi de courriel), changement de mot de passe ou d'e-mail, suppression de compte, connexion via un tiers (Google, GitHub), rôles et administration, PostgreSQL, partage d'une grille entre personnes, mode sans connexion (session Storage) ?

## Implémentation

### Flux

```
Création de compte : POST /api/auth/register { email, password }
  → validation → scrypt(mot de passe) → INSERT users → session créée → cookie sid → 201 { id, email }

Connexion : POST /api/auth/login → vérification du hachage → session → cookie sid → 200 { id, email }

Appel protégé : GET /api/buttons (cookie sid)
  → middleware : empreinte du jeton → session non expirée → req.user
  → store.list(userId) → SELECT … WHERE user_id = ?
  → sans session valide : 401 { error: 'Connexion requise' }

Client : démarrage → GET /api/auth/me
  → 200 : grille   → 401 : page de connexion (le routeur redirige, la destination est retenue)
```

### Schéma

```sql
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,           -- "scrypt$sel$empreinte"
  created_at    TEXT NOT NULL
);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,           -- SHA-256 du jeton du cookie
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE buttons (
  id        TEXT PRIMARY KEY,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES buttons(id) ON DELETE CASCADE,
  position  INTEGER NOT NULL,
  label     TEXT NOT NULL,
  icon      TEXT NOT NULL,
  type      TEXT NOT NULL CHECK (type IN ('action', 'folder')),
  color     TEXT,
  url       TEXT
);
CREATE UNIQUE INDEX buttons_slot ON buttons (user_id, parent_id, position) WHERE parent_id IS NOT NULL;
CREATE UNIQUE INDEX buttons_root_slot ON buttons (user_id, position) WHERE parent_id IS NULL;
```

L'étape 1 crée `buttons` sans `user_id` ; l'étape 3 l'ajoute par une nouvelle migration.

### API

| Méthode | Route | Rôle | Réponses |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Créer un compte et se connecter | 201, 400 (champs), 409 (e-mail pris) |
| POST | `/api/auth/login` | Se connecter | 200, 401, 429 (trop d'essais) |
| POST | `/api/auth/logout` | Se déconnecter (session supprimée, cookie effacé) | 204 |
| GET | `/api/auth/me` | Personne connectée | 200, 401 |
| `*` | `/api/buttons…` | Inchangé, réservé aux personnes connectées | + 401 |

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `server/src/db/database.ts` | Ouverture de la base, pragmas, lancement des migrations |
| `server/src/db/migrations.ts` | Migrations numérotées (`buttons`, puis `users` et `sessions`, puis `user_id`) |
| `server/src/buttons/store.ts` | Store SQLite, filtré par `userId` à partir de l'étape 3 |
| `server/src/auth/store.ts` | Comptes et sessions |
| `server/src/auth/password.ts` | Hachage et vérification (scrypt) |
| `server/src/auth/validation.ts` | Validation e-mail et mot de passe |
| `server/src/auth/router.ts`, `middleware.ts` | Routes `/api/auth`, `requireAuth`, lecture du cookie |
| `server/src/app.ts`, `index.ts` | Câblage, `DATABASE_FILE`, `CLIENT_ORIGIN` |
| `server/test/db/`, `server/test/auth/`, `server/test/buttons/` | Tests miroirs de `src/` (base en mémoire dans `test/helpers/`) |
| `client/src/api/auth.ts`, `interfaces/auth.ts` | Appels et types |
| `client/src/stores/auth.ts` | Personne connectée |
| `client/src/pages/LoginPage.vue`, `RegisterPage.vue` | Connexion et création de compte |
| `client/src/router/index.ts`, `App.vue`, `api/http.ts` | Garde, barre d'application, gestion du 401 |
| `client/test/stores/auth.test.ts` | Tests du store |

### Validation

- [ ] Type-check, lint, tests et build sans erreur côté serveur et côté client
- [ ] Deux comptes ne voient jamais les boutons l'un de l'autre (test automatique et vérification à la main)
- [ ] Le fichier de la base survit à un redémarrage du serveur

### Vérifier à la main

```bash
cd server && npm run dev
cd client && npm run dev
```

1. Sans connexion, ouvrir `http://localhost:3000` : la page de connexion s'affiche.
2. Créer un compte : la grille vide s'affiche, la barre d'application indique l'adresse.
3. Créer un dossier et une action, redémarrer le serveur : les boutons sont toujours là.
4. Se déconnecter, créer un second compte dans une fenêtre privée : sa grille est vide.
5. Mauvais mot de passe : message unique ; au-delà de quelques essais, l'attente est imposée.
