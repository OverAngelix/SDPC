# Feature 16 — Mode invité et migration vers un compte

| | |
| --- | --- |
| **Statut** | En cours |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/`, `server/` |
| **Dépend de** | [09 — Comptes utilisateur](09-comptes-base-de-donnees.md), [10 — Fenêtre « Mon compte »](10-fenetre-mon-compte.md), [11 — Menu « Mon compte »](11-menu-compte-reglages.md), [15 — Écran de bienvenue](15-ecran-bienvenue.md) |

## Explication de la feature

Aujourd'hui, il faut créer un compte avant de voir quoi que ce soit. Le **mode invité** permet d'essayer l'application sans compte, puis, si on l'apprécie, de **créer un compte en emportant tout ce qu'on a fait**.

- La page de connexion est remontée et suivie d'une seconde carte **« Mode invité »** : une phrase d'explication et un bouton **« Entrer en mode invité »**.
- En mode invité, tout fonctionne comme avec un compte : grille, dossiers, configuration, glisser-déposer, réglages (son, volume, effets, thème, langue), big picture, écran de bienvenue.
- La grille et les réglages de l'invité sont gardés **dans le navigateur** (`localStorage`), pas sur le serveur : rien n'est partagé entre appareils, et vider le cache du navigateur efface tout.
- Le menu « Mon compte » devient le menu de l'invité : Configuration de la grille, Réglages, Big picture, **Effacer la grille**, **Créer un compte**, **Se connecter**, **Quitter le mode invité**. Pas de mot de passe à changer ni de compte à supprimer.
- **Grille d'exemple** : un invité qui arrive et un nouveau compte ne partent pas d'une grille vide (voir plus bas).
- **Créer un compte depuis le mode invité** : la grille et les réglages de l'invité deviennent ceux du nouveau compte, enregistrés en base.
- **Se connecter à un compte existant depuis le mode invité** : c'est la grille du compte qui s'affiche ; celle de l'invité est abandonnée, sans question.
- Dans les deux cas, les données de l'invité sont ensuite effacées du navigateur.

### Grille d'exemple

| Emplacement | Bouton | Type | Icône | Couleur | Contenu |
| --- | --- | --- | --- | --- | --- |
| 0 | GitHub | Action | `mdi-github` | grey | `https://github.com` |
| 1 | YouTube | Action | `mdi-youtube` | red | `https://www.youtube.com` |
| 2 | Google | Dossier | `mdi-google` | blue | voir ci-dessous |

Dans le dossier Google (l'emplacement 0 est le retour) :

| Emplacement | Bouton | Type | Icône | Couleur | Contenu |
| --- | --- | --- | --- | --- | --- |
| 1 | Maps | Action | `mdi-google-maps` | green | `https://maps.google.com` |
| 2 | Gmail | Action | `mdi-gmail` | red | `https://mail.google.com` |

Les libellés sont des noms propres : ils se lisent pareil en français et en anglais, il n'y a rien à traduire.

## TODO

### Étape 1 — Grille d'exemple et import (serveur)

- [x] `buttons/constants.ts` : `EXAMPLE_GRID`, la grille d'exemple (seule définition, client compris)
- [x] `GET /api/buttons/example` : accessible sans connexion, renvoie la grille d'exemple (le client s'en sert pour un nouvel invité)
- [x] Création de compte : la grille d'exemple est posée dans la même transaction que le compte, sauf si une grille d'invité est fournie (voir import)
- [x] `POST /api/buttons/import` : reçoit une grille entière (identifiants provisoires, `parentId` qui s'y réfèrent), la valide comme le reste de l'API (types, URL, emplacements, emplacement 0 réservé dans un dossier, pas de doublon d'emplacement, pas de cycle, parents existants et de type dossier) et **remplace** la grille de la personne connectée en une seule transaction ; le serveur attribue de nouveaux identifiants et renvoie la grille créée
- [x] Limite de taille (nombre de boutons) et codes d'erreur dans `constants.ts`
- [x] Tests serveur : grille d'exemple valide selon les règles de l'API, posée à la création de compte, comptes existants non touchés ; import valide (racine et dossiers imbriqués), grille remplacée, refus sans rien écrire (cycle, parent inconnu, emplacement occupé, URL interdite), autre personne non touchée

### Étape 2 — Stockage de l'invité (client)

- [x] `utils/guestStorage.ts` : lecture et écriture de la grille et des réglages de l'invité (`sdpc.guest.buttons`, `sdpc.guest.settings`) et du mode invité lui-même (`sdpc.guest`) ; tolère une valeur illisible ou un stockage refusé
- [x] `api/guestButtons.ts` : mêmes fonctions que `api/buttons.ts` (lister, créer, modifier, déplacer avec échange, supprimer avec le contenu d'un dossier, effacer), mais sur le stockage local ; identifiants générés par `crypto.randomUUID()` ; mêmes refus que le serveur pour l'emplacement réservé ou occupé (mêmes codes d'erreur, donc mêmes messages)
- [x] Premier passage en mode invité : grille d'exemple demandée au serveur ; s'il ne répond pas, grille vide
- [x] Tests client : chaque opération, échange de places, suppression récursive, données corrompues, stockage refusé

### Étape 3 — Stores et routeur (client)

- [x] `stores/guest.ts` : le mode invité, repris au chargement si `sdpc.guest` est retenu ; `stores/auth.ts` : `enterGuest`, `leaveGuest`
- [x] `stores/buttons.ts` et `stores/settings.ts` : passent par le stockage local en mode invité, par l'API sinon (le reste du store ne change pas)
- [x] `router/guard.ts` : l'invité accède à la grille et à la configuration ; la connexion et la création de compte restent accessibles pour lui
- [x] Tests client : garde de route en invité, stores branchés sur la bonne source

### Étape 4 — Interface (client)

- [x] `AuthForm.vue` (page de connexion) : formulaire remonté, seconde carte « Mode invité » avec le bouton « Entrer en mode invité »
- [x] Menu du compte en mode invité (voir plus haut) ; « Effacer la grille » réutilise `ConfirmClearGrid`
- [x] `AuthForm.vue` en mode invité, création de compte : message « votre grille sera enregistrée sur le compte » ; connexion : alerte d'avertissement « Attention : en vous connectant avec un compte existant, vous allez perdre votre grille d'invité »
- [x] Textes `guest.*` dans `locales/fr.ts` et `en.ts`, erreurs d'import dans `errors.*`

### Étape 5 — Migration (client)

- [x] Création de compte depuis le mode invité : envoi de la grille (`/buttons/import`) et des réglages (`PATCH /settings`), puis effacement des données de l'invité
- [x] En cas d'échec de l'envoi : le compte est ouvert (avec la grille d'exemple), les données de l'invité restent dans le navigateur, un message propose de réessayer
- [x] Connexion à un compte existant depuis le mode invité : données de l'invité effacées, grille du compte chargée
- [x] Tests client : migration réussie, échec conservant les données, connexion abandonnant la grille d'invité

### Étape 6 — Documentation

- [x] `CLAUDE.md` : « sans connexion, seule la page de connexion est accessible » devient faux, à réécrire ; mentionner le mode invité et la grille d'exemple
- [x] README des features : statut, ordre de réalisation
- [ ] Vérification manuelle (voir plus bas)

## Décisions

- **Le serveur n'intervient pas en mode invité**, sauf pour donner la grille d'exemple. Pas de compte anonyme en base, pas de session : tout reste dans le navigateur, comme le big picture (feature 13) et l'écran de bienvenue (feature 15).
- **Même interface, autre source.** Les composants ne savent pas s'ils parlent au serveur ou au navigateur : seuls les stores choisissent. Le mode invité ne duplique aucune page.
- **Grille d'exemple définie une seule fois, sur le serveur.** Le client la demande plutôt que d'en garder une copie qui finirait par diverger.
- **Grille d'exemple pour les nouveaux comptes seulement** : les comptes existants gardent leur grille, même vide.
- **Création de compte : la grille de l'invité part en base.** Le compte est neuf, il n'y a rien à perdre ; la grille d'exemple posée à la création est remplacée par celle de l'invité.
- **Connexion à un compte existant : le compte gagne.** Pas de fenêtre de choix ni de fusion : la grille de l'invité est abandonnée. Le message sur la page de connexion prévient avant.
- **Import en un seul appel**, pas une suite de `POST /buttons` : une migration qui échoue à moitié laisserait une demi-grille. Le serveur réattribue les identifiants pour ne jamais faire confiance à ceux du navigateur.
- **Les réglages suivent la grille** : migrés à la création de compte, abandonnés à la connexion.
- **Échec de la migration** : le compte est créé quand même (avec la grille d'exemple) et un message persistant propose « Réessayer ». La grille de l'invité reste dans le navigateur ; si la page est fermée, « Entrer en mode invité » la retrouve.
- **Mêmes erreurs qu'avec le serveur** : les refus du mode invité (emplacement pris ou réservé, dossier non vide…) ont la forme d'une erreur de l'API, avec les mêmes codes, et s'affichent donc avec les mêmes messages.
- **Quitter le mode invité ne supprime rien** : on revient à la page de connexion, et « Entrer en mode invité » retrouve la grille laissée. Pour repartir de zéro : « Effacer la grille ».

## Implémentation

### Flux

```
Page de connexion → carte « Mode invité » → « Entrer en mode invité »
  → auth.enterGuest() : sdpc.guest retenu
  → pas de grille d'invité ? GET /buttons/example → grille (stockage local)

Invité → « Créer un compte » → RegisterPage
  → inscription réussie (grille d'exemple posée) → POST /buttons/import + PATCH /settings
  → données de l'invité effacées → grille du compte = grille de l'invité

Invité → « Se connecter » → LoginPage
  → connexion réussie → données de l'invité effacées → grille du compte

Nouvelle personne → « Créer un compte » (sans passer par le mode invité)
  → inscription réussie → grille d'exemple
```

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `server/src/buttons/constants.ts` | Grille d'exemple |
| `server/src/buttons/router.ts`, `store.ts`, `validation.ts` | Routes d'exemple et d'import, validation de la grille entière, transaction |
| `server/src/auth/router.ts` | Grille d'exemple à la création de compte |
| `server/src/app.ts` | `GET /api/buttons/example`, sans connexion |
| `server/src/constants.ts` | Codes d'erreur de l'import |
| `server/test/buttons/`, `server/test/auth/` | Tests |
| `client/src/utils/guestStorage.ts` | Données de l'invité dans le navigateur (repli en mémoire si le stockage est refusé) |
| `client/src/api/guestButtons.ts` | Opérations sur les boutons de l'invité |
| `client/src/api/buttons.ts` | `fetchExampleButtons`, `importButtons` |
| `client/src/stores/guest.ts` | Mode invité actif ou non, retenu sur l'appareil |
| `client/src/stores/auth.ts` | Entrée et sortie du mode invité, migration et nouvel essai |
| `client/src/stores/buttons.ts`, `settings.ts` | Navigateur en mode invité, serveur sinon |
| `client/src/router/guard.ts`, `index.ts` | Accès de l'invité |
| `client/src/components/AuthForm.vue` | Carte « Mode invité », alertes de la connexion et de la création de compte |
| `client/src/components/AccountMenuItems.vue`, `AccountMenu.vue`, `AccountDrawer.vue` | Menu de l'invité |
| `client/src/App.vue` | Actions du menu, message d'échec de la migration |
| `client/src/interfaces/account.ts` | Actions du menu de l'invité |
| `client/src/locales/fr.ts`, `en.ts` | Textes `guest.*`, entrées du menu, codes de l'import |
| `client/test/helpers/storage.ts` | Faux stockage du navigateur pour les tests |
| `client/test/…` | Tests (miroir de `src/`) |

### Vérifier à la main

```bash
cd server && npm run dev
cd client && npm run dev -- --host
```

1. Déconnecté : le formulaire est en haut, la carte « Mode invité » en dessous ; « Entrer en mode invité » ouvre la grille d'exemple et l'écran de bienvenue.
2. Le dossier Google s'ouvre, Maps et Gmail redirigent, le retour fonctionne.
3. Créer des boutons, déplacer, changer le thème : recharger la page, tout est là.
4. Quitter le mode invité puis revenir : la grille est retrouvée.
5. Créer un compte depuis le mode invité : la grille et le thème sont sur le compte ; se connecter sur un autre navigateur, ils y sont.
6. Nouvel invité, modifier la grille, se connecter à un compte existant : c'est la grille du compte qui s'affiche ; revenir en mode invité repart de la grille d'exemple.
7. Créer un compte sans passer par le mode invité : grille d'exemple.
8. Serveur arrêté au moment de la migration : le message de réessai s'affiche, la grille d'invité n'est pas perdue.
9. Navigation privée avec stockage refusé : le mode invité fonctionne le temps de l'onglet.
10. Thème sombre, téléphone portrait et paysage, langue anglaise.
