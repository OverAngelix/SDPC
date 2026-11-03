# Feature 10 — Fenêtre « Mon compte » : mot de passe, remise à zéro et suppression

| | |
| --- | --- |
| **Statut** | À faire |
| **Personne active** | OverAngelix |
| **Périmètre** | `server/` (routes du compte) et `client/` (fenêtre ouverte depuis le menu) |
| **Dépend de** | [09 — Comptes utilisateur et base de données SQLite](09-comptes-base-de-donnees.md), [11 — Menu « Mon compte » et réglages de l'application](11-menu-compte-reglages.md) |

## Explication de la feature

La suite des comptes se limite à ce qui ne demande **aucun courriel** : pas de vérification d'adresse, pas de lien par e-mail, **aucun serveur SMTP à configurer**. Tout se passe dans une **fenêtre « Mon compte »** (modale, plein écran sur téléphone, comme « Configuration de l'application »), ouverte par une entrée du menu du compte. Elle regroupe trois actions :

1. **Changer le mot de passe** : mot de passe actuel, nouveau, confirmation. La session courante reste ouverte, celles des autres appareils sont fermées.
2. **Remettre la grille à zéro** : l'actuel « Effacer la grille » du menu **déménage dans cette fenêtre**. Même comportement qu'aujourd'hui (confirmation avec le nombre de boutons supprimés), même route.
3. **Supprimer le compte** : après confirmation avec le mot de passe, le compte, sa grille, ses réglages et ses sessions disparaissent, et on revient à la page de connexion.

Le menu du compte devient : Grille, Configuration de la grille, Configuration de l'application, **Mon compte**, Déconnexion.

## TODO

### Étape 1 — Changer le mot de passe (serveur)

- [x] Store `AccountStore` (`server/src/account/store.ts`) : `changePassword(userId, currentPassword, newPassword, keepToken)` vérifie l'actuel, pose le nouveau haché, supprime les autres sessions de la personne
- [x] Validation : nouveau mot de passe de 8 à 128 caractères (règles de l'inscription réutilisées), différent de l'actuel ; actuel requis
- [x] `PUT /api/account/password` (401 sans session), routeur `account` branché dans `app.ts` derrière l'authentification
- [x] Mot de passe actuel faux : **403** (voir les décisions) ; essais comptés par le limiteur, 429 quand il est atteint
- [x] Tests serveur : changement réussi (l'ancien est refusé à la connexion, le nouveau accepté), actuel faux (403, rien ne change), nouveau trop court, trop long ou identique (400), autres sessions fermées et session courante gardée, un autre compte inchangé, 429, 401 sans session

### Étape 2 — Supprimer le compte (serveur)

- [x] `AccountStore.deleteAccount(userId, password)` : vérifie le mot de passe puis supprime la ligne `users` ; la cascade de la base emporte boutons, réglages et sessions
- [x] `DELETE /api/account` avec `{ password }` : 204, cookie de session effacé ; 400 sans mot de passe, 401 sans session, 403 mot de passe faux, 429
- [x] Même limiteur que pour le changement de mot de passe (une seule série d'essais par personne)
- [x] Tests serveur : suppression (plus de connexion possible, lignes `users`, `buttons`, `user_settings`, `sessions` vidées pour cette personne), un autre compte intact, mot de passe faux (403, compte conservé), cookie effacé, 401 sans session, 429

### Étape 3 — Fenêtre « Mon compte » (client)

- [ ] Interfaces des formulaires dans `client/src/interfaces/`, appels `changePassword` et `deleteAccount` dans `client/src/api/account.ts`
- [ ] Composant `AccountDialog.vue` : fenêtre modale (plein écran sur téléphone), adresse e-mail en tête, trois sections : Mot de passe, Grille, Supprimer le compte (la dernière en rouge, séparée)
- [ ] Section **Mot de passe** : trois champs (actuel, nouveau, confirmation), affichage à la demande, validation côté client (longueur, confirmation identique), bouton désactivé pendant l'envoi, erreurs du serveur en français dans la section, message de confirmation à la réussite
- [ ] Section **Grille** : bouton « Effacer la grille » (grisé quand la grille est vide), qui ouvre la confirmation existante (`ConfirmClearGrid.vue`) ; la fenêtre ne perd pas son état
- [ ] Section **Supprimer le compte** : texte qui dit ce qui disparaît, bouton rouge, confirmation avec mot de passe (`ConfirmDeleteAccount.vue`) ; succès → grille, réglages et session remis à zéro, retour à la page de connexion, son de suppression
- [ ] Menu et tiroir : retirer l'entrée « Effacer la grille » (et le grisage lié à la grille vide, qui passe dans la fenêtre), ajouter « Mon compte » après « Configuration de l'application » ; action `account` à la place de `clear` dans `interfaces/account.ts`
- [ ] Tests client : appels d'API (corps envoyé, 403 affiché sans déconnexion), état remis à zéro après la suppression du compte

### Étape 4 — Documentation

- [ ] `CLAUDE.md` et `README.md` : menu du compte, fenêtre « Mon compte » (mot de passe, effacement de la grille, suppression du compte)
- [ ] README des features : ligne 10, « Plus tard » à jour
- [ ] Fiches 09 et 11 : « hors périmètre, prévu pour la feature 10 » renvoie ici ; la fiche 11 note que « Effacer la grille » est ensuite passé dans la fenêtre « Mon compte »
- [ ] Fiche mise à jour, vérification manuelle (voir plus bas)

## Décisions (proposées)

- **Aucun courriel dans cette feature.** Réinitialisation de mot de passe, vérification d'adresse et changement d'e-mail restent dans « Plus tard » : ils demandent un envoi de courriels que le projet n'a pas. Conséquence assumée : **un mot de passe oublié n'est pas récupérable** par l'application.
- **Une fenêtre « Mon compte » pour tout ce qui touche au compte.** Un seul point d'entrée, comme « Configuration de l'application » ; pas d'adresse de plus à gérer. L'entrée du menu s'appelle « Mon compte », la fenêtre aussi (le bouton de la barre garde son nom : il ouvre le menu, la fenêtre s'ouvre depuis une entrée).
- **« Effacer la grille » quitte le menu et va dans la fenêtre.** Elle y est avec les autres actions destructrices, loin des entrées de navigation. Aucun changement côté serveur (`DELETE /api/buttons`) ni dans la confirmation. Le menu se raccourcit, ce qui aide sur téléphone.
- **Le mot de passe est la seule preuve.** Faute de courriel, changer le mot de passe et supprimer le compte redemandent le mot de passe actuel : une session ouverte sur un appareil prêté ne suffit pas à prendre ou détruire le compte. Effacer la grille ne le redemande pas (c'est déjà un geste confirmé, comme aujourd'hui, et la grille se recrée).
- **Mauvais mot de passe : 403, pas 401.** Le client traite tout 401 hors `/auth/` comme une session perdue et renvoie à la connexion (`client/src/api/http.ts`) ; une faute de frappe ne doit pas déconnecter. C'est aussi pourquoi les routes sont sous `/api/account/` et non `/api/auth/`.
- **Limitation des essais.** Le `LoginLimiter` de la feature 09 compte les mots de passe faux, avec une clé propre à la personne (`account|<id>`), remise à zéro après un succès : une session volée ne sert pas à deviner le mot de passe. Même série pour le changement et la suppression.
- **Autres sessions fermées, pas la courante.** Si le mot de passe a été changé parce qu'il fuitait, les autres appareils sont déconnectés ; la personne qui agit garde sa session (jeton lu avec `sessionToken(req)`).
- **Mêmes règles qu'à l'inscription** : 8 à 128 caractères, aucune règle de composition. Un nouveau mot de passe identique à l'actuel est refusé (400). La confirmation du nouveau mot de passe est vérifiée côté client seulement.
- **Suppression immédiate et définitive.** Pas de délai de grâce ni de désactivation. La suppression de la ligne `users` fait tout par cascade (boutons, réglages, sessions) ; une seule instruction, donc rien ne reste à moitié. La confirmation indique le nombre de boutons qui disparaîtront et demande le mot de passe, pas de texte à recopier. Le cookie est effacé dans la même réponse ; le client remet à zéro les stores (session, boutons, réglages par défaut) puis ouvre la page de connexion.
- **Suppression du compte : une adresse peut être réutilisée.** Rien ne garde l'e-mail après la suppression ; on peut se réinscrire avec la même adresse (nouvelle grille vide).
- **Routeur `account` à part**, derrière le middleware d'authentification : il accueillera les futures actions du compte (e-mail) sans toucher aux routes publiques de `/api/auth`.
- **Interfaces dans `src/interfaces/`** (`account.ts` serveur pour les corps de requête, `account.ts` client pour les formulaires et les actions du menu), constantes dans `constants.ts`, tests dans `server/test/account/` et `client/test/` en miroir de `src/`, comme le veut `CLAUDE.md`.
- **Hors périmètre** : réinitialisation de mot de passe, vérification d'e-mail, changement d'e-mail, connexion via un tiers, rôles et administration, PostgreSQL, partage de grille, liste des appareils connectés, export des données.

## Implémentation

### Flux

```
Menu « Mon compte » → « Mon compte » → fenêtre (menu fermé)
  ├─ Mot de passe : PUT /api/account/password { currentPassword, newPassword }
  │     → session valide (401) → limiteur (429) → validation du nouveau (400)
  │     → vérification de l'actuel (403, essai compté) → nouveau haché, autres sessions supprimées → 204
  │     → champs vidés, message « Mot de passe modifié »
  ├─ Grille : « Effacer la grille » → confirmation → DELETE /api/buttons   (inchangé, feature 11)
  └─ Supprimer le compte : confirmation avec mot de passe → DELETE /api/account { password }
        → session valide (401) → limiteur (429) → mot de passe (403) → DELETE users (cascade) → cookie effacé → 204
        → stores remis à zéro → page de connexion
```

### API

| Méthode | Route | Rôle | Réponses |
| --- | --- | --- | --- |
| PUT | `/api/account/password` | Changer le mot de passe de la personne connectée | 204, 400, 401, 403 (actuel incorrect), 429 |
| DELETE | `/api/account` | Supprimer le compte et tout ce qu'il contient | 204, 400, 401, 403 (mot de passe incorrect), 429 |
| DELETE | `/api/buttons` | Inchangé : effacer la grille | 204, 401 |

Corps : `{ "currentPassword": "…", "newPassword": "…" }` pour le changement, `{ "password": "…" }` pour la suppression. Aucune migration : `users.password_hash` existe, les clés étrangères en cascade des tables `buttons`, `user_settings` et `sessions` font le reste.

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `server/src/account/store.ts` | `changePassword`, `deleteAccount` |
| `server/src/account/router.ts`, `validation.ts` | Routes `/api/account`, validation des corps |
| `server/src/interfaces/account.ts` | Types des corps de requête |
| `server/src/app.ts` | Branche `/api/account` derrière l'authentification |
| `server/test/account/` | Tests du store, de la validation et des routes |
| `client/src/interfaces/account.ts` | Formulaires, action `account` du menu (à la place de `clear`) |
| `client/src/api/account.ts` | `changePassword`, `deleteAccount` |
| `client/src/stores/auth.ts` | Remise à zéro après la suppression du compte |
| `client/src/components/AccountDialog.vue` | Fenêtre « Mon compte » : mot de passe, grille, suppression |
| `client/src/components/ConfirmDeleteAccount.vue` | Confirmation de la suppression, avec mot de passe |
| `client/src/components/ConfirmClearGrid.vue` | Inchangé, ouvert depuis la fenêtre |
| `client/src/components/AccountMenuItems.vue`, `AccountMenu.vue`, `AccountDrawer.vue`, `App.vue` | Entrée « Mon compte » à la place d'« Effacer la grille » |
| `client/test/api/account.test.ts`, `client/test/stores/auth.test.ts` | Corps envoyés, 403 sans déconnexion, remise à zéro |

### Validation

- [ ] Type-check, lint, tests et build sans erreur côté serveur et côté client
- [ ] Parcours vérifié sur ordinateur (menu déroulant, fenêtre) et sur téléphone (tiroir, fenêtre plein écran)
- [ ] Une session ouverte sur un autre appareil est bien fermée après le changement de mot de passe
- [ ] Après la suppression du compte, la base ne contient plus aucune ligne de cette personne

### Vérifier à la main

```bash
cd server && npm run dev
cd client && npm run dev -- --host
```

1. Connecté : le menu contient Grille, Configuration de la grille, Configuration de l'application, Mon compte, Déconnexion. Plus d'« Effacer la grille ».
2. « Mon compte » ouvre la fenêtre (plein écran sur téléphone), ferme le menu et affiche l'adresse e-mail.
3. Mot de passe actuel faux : message d'erreur dans la fenêtre, **on reste connecté**. Nouveau mot de passe trop court, identique à l'actuel ou confirmation différente : refusé avec un message clair.
4. Changement valide : message de confirmation, champs vidés. Se déconnecter puis se reconnecter : l'ancien mot de passe est refusé, le nouveau accepté. Une session ouverte dans un autre navigateur est renvoyée à la connexion au prochain appel.
5. Se tromper plus de 5 fois de mot de passe actuel : « Trop de tentatives, réessayez plus tard ».
6. « Effacer la grille » dans la fenêtre : la confirmation annonce le nombre de boutons ; Annuler ne supprime rien ; Effacer vide la grille. Le bouton est grisé sur une grille vide.
7. « Supprimer mon compte » : mauvais mot de passe refusé (on reste connecté, le compte existe encore) ; bon mot de passe → retour à la page de connexion.
8. Se reconnecter avec l'ancien compte est impossible ; recréer un compte avec la même adresse donne une grille vide et des réglages par défaut. Un second compte garde sa grille.
