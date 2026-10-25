# Feature 11 — Menu « Mon compte » et réglages de l'application

| | |
| --- | --- |
| **Statut** | À faire (plan à valider) |
| **Personne active** | OverAngelix |
| **Périmètre** | `server/` (réglages du compte, effacement de la grille) et `client/` |
| **Dépend de** | [09 — Comptes utilisateur et base de données SQLite](09-comptes-base-de-donnees.md) |

La feature 10 (suite des comptes) est repoussée après celle-ci : le numéro 10 reste réservé (voir « Plus tard » dans le README des features).

## Explication de la feature

L'écran principal est la **grille**, rien d'autre. La barre d'application n'affiche plus les onglets « Grille » et « Configuration » : tout ce qui n'est pas la grille passe par un menu **Mon compte**, à la place de l'adresse e-mail de la personne connectée.

- **Sur ordinateur et tablette** : le bouton « Mon compte » ouvre un petit menu déroulant juste en dessous.
- **Sur téléphone** : un bouton burger ouvre un tiroir qui reprend le même contenu, avec **Déconnexion** tout en bas.

Le menu contient :

1. **Configuration de la grille** : la page actuelle (créer, modifier, déplacer, supprimer les boutons).
2. **Configuration de l'application** : son (actif ou non, volume), effets visuels (actifs ou non), thème (clair, sombre, celui de l'appareil). Elle s'ouvre dans une **fenêtre modale** sur ordinateur et dans une **fenêtre modale plein écran** sur téléphone.
3. **Effacer la grille** : supprime tous les boutons du compte, après une fenêtre de confirmation.
4. **Déconnexion**, en dernier.

En tête du menu, l'adresse e-mail de la personne rappelle sous quel compte on est connecté.

Les réglages de l'application sont **enregistrés sur le compte** (table `user_settings`) : on les retrouve sur tous ses appareils.

## TODO

### Étape 1 — Réglages du compte (serveur)

- [x] Migration : table `user_settings` (une ligne par personne, supprimée avec le compte)
- [x] Store des réglages : valeurs par défaut quand la personne n'a encore rien enregistré, enregistrement partiel (seuls les champs envoyés changent)
- [x] Validation : son actif et effets actifs (booléens), volume (entier de 0 à 100), thème (`light`, `dark` ou `system`) ; tout le reste est refusé
- [x] `GET /api/settings` et `PATCH /api/settings` (401 sans session)
- [x] Tests serveur : valeurs par défaut, enregistrement partiel, valeurs invalides (400), persistance, isolation entre deux comptes, 401

### Étape 2 — Réglages de l'application (client)

- [ ] Interface `Settings`, appels `GET` et `PATCH /api/settings`
- [ ] Store `settings` : son actif, **volume**, **effets**, **thème**, chargés avec la session au démarrage et après une connexion, enregistrés à chaque changement (voir les décisions)
- [ ] Sons : `playSound` applique le volume (les volumes de base des notes sont multipliés)
- [ ] Effets : désactivés par une classe sur la page ; **survol** et animations des cases (apparition en vague, lancement, appui, secousse) se coupent comme avec `prefers-reduced-motion`
- [ ] Thème : appliqué à Vuetify au démarrage et à chaque changement, `system` suit l'appareil
- [ ] Tests client : valeurs par défaut, chargement, enregistrement, retour à la valeur précédente quand le serveur refuse, volume des notes

### Étape 3 — Barre d'application et menu du compte (client)

- [ ] Retirer les onglets Grille et Configuration de la barre ; le titre « SDPC » devient un lien vers la grille
- [ ] Retirer le bouton son de la barre (il passe dans les réglages)
- [ ] Menu « Mon compte » (`v-menu`) sur ordinateur et tablette, tiroir (`v-navigation-drawer`) derrière un burger sur téléphone, même contenu pour les deux
- [ ] Contenu : adresse e-mail, Configuration de la grille, Configuration de l'application, Effacer la grille, séparateur, Déconnexion
- [ ] Sur la page de configuration de la grille, l'entrée du menu devient « Retour à la grille »
- [ ] Sans connexion (pages Connexion et Créer un compte) : seulement le titre, ni menu ni burger

### Étape 4 — Fenêtre « Configuration de l'application » (client)

- [ ] Fenêtre modale sur ordinateur, modale plein écran sur téléphone, ouverte depuis le menu
- [ ] Son : interrupteur et curseur de volume (désactivé quand le son est coupé), un son d'essai au relâchement du curseur
- [ ] Effets visuels : interrupteur
- [ ] Thème : choix Clair, Sombre, Appareil
- [ ] Les changements s'appliquent tout de suite, il n'y a pas de bouton Enregistrer

### Étape 5 — Effacer la grille (serveur et client)

- [ ] Serveur : `DELETE /api/buttons` supprime tous les boutons de la personne connectée (204, 401 sans session), ceux des autres comptes ne bougent pas
- [ ] Tests serveur : effacement, grille déjà vide, isolation entre deux comptes, 401
- [ ] Client : fenêtre de confirmation avec le nombre de boutons supprimés, erreur du serveur affichée, retour à la racine de la grille, son de suppression, message de confirmation
- [ ] Le store des boutons se vide et la page se recharge

### Étape 6 — Documentation

- [ ] `CLAUDE.md` et `README.md` : la configuration de la grille s'ouvre depuis le menu du compte ; réglages enregistrés sur le compte
- [ ] README des features : ligne 11, retrait des réglages de « Plus tard »
- [ ] Fiche 09 : la décision « les réglages restent dans le navigateur » renvoie vers cette feature
- [ ] Fiche mise à jour, vérification manuelle (voir plus bas)

## Décisions (proposées)

- **Une seule porte d'entrée : le menu du compte.** La grille est la page d'accueil et n'a plus d'onglet ; la configuration de la grille et les réglages s'ouvrent depuis le menu. Les adresses ne changent pas (`/` pour la grille, `/config` pour sa configuration) : les dossiers ouverts gardent leurs liens (`/folder/:id`, `/config/folder/:id`).
- **Menu déroulant sur ordinateur, tiroir sur téléphone, même contenu.** Un composant unique décrit la liste des entrées, les deux conteneurs ne font que l'afficher (`v-menu` à partir de 600 px, `v-navigation-drawer` en dessous, seuil `xs` déjà utilisé par l'application). Le tiroir s'ouvre à droite, du côté du bouton, et **Déconnexion** est ancrée en bas (zone `append`) ; le menu déroulant la place en dernier, après un séparateur.
- **L'adresse e-mail passe dans le menu.** Elle n'occupe plus la barre (déjà trop chargée sur téléphone) ; le bouton de la barre s'appelle « Mon compte » sur ordinateur (icône de personne et texte) et reste un burger sur téléphone.
- **Réglages sur le compte, table `user_settings`.** Une ligne par personne : `user_id` (clé primaire, clé étrangère vers `users`, suppression en cascade), `sound_enabled`, `volume`, `effects_enabled`, `theme`, avec les valeurs par défaut en base. La ligne n'est créée qu'au premier enregistrement : sans ligne, le serveur renvoie les valeurs par défaut. Colonnes plutôt qu'un bloc JSON : la base refuse elle-même une valeur hors plage (`CHECK`), et ajouter un réglage plus tard est une migration simple.
- **Les réglages se chargent avec la session.** Le routeur attend déjà de savoir si une session est ouverte avant d'afficher une page ; il attend aussi les réglages, pour que le thème soit le bon dès le premier affichage. Avant la connexion (pages Connexion et Créer un compte), les valeurs par défaut s'appliquent : thème de l'appareil, son et effets actifs. À la déconnexion, on y revient.
- **Un réglage s'applique tout de suite, puis s'enregistre.** Le changement est visible et audible immédiatement ; le `PATCH` suit. Si le serveur refuse ou ne répond pas, la valeur précédente revient et la fenêtre affiche le message. Le curseur du volume n'enregistre qu'au relâchement (un appel par réglage, pas un par pixel).
- **L'ancienne préférence du son dans le navigateur (`sdpc.sound`) est abandonnée**, sans reprise : le son est actif par défaut sur le compte. Elle disparaît du code ; son éventuelle valeur dans `localStorage` n'est plus lue.
- **Le bouton son quitte la barre.** Il fait double emploi avec l'interrupteur des réglages et prend de la place sur téléphone. Le son se coupe en trois gestes : Mon compte, Configuration de l'application, interrupteur.
- **Volume = multiplicateur des volumes actuels.** Les notes ont déjà un volume bas et réglé (« la grille se manipule longtemps »). Le curseur, de 0 à 100 %, les multiplie : 100 % donne exactement le son d'aujourd'hui, jamais plus fort. L'interrupteur du son reste distinct du curseur (couper puis remettre rend le volume choisi).
- **« Effets » = tout ce qui anime la grille** : l'effet de **survol** (la case qui se soulève), l'apparition en vague, l'effet de lancement, l'effet d'appui et de création, la secousse d'un refus. Désactivés, la grille reste fonctionnelle et immobile. Par défaut les effets sont actifs. La demande du système de réduire les animations (`prefers-reduced-motion`, déjà respectée) l'emporte toujours, quel que soit le réglage. Les sons restent séparés des effets.
- **Thème : Clair, Sombre, Appareil.** C'est déjà le comportement actuel (Vuetify suit le système) : le réglage permet de le forcer. Valeur par défaut : Appareil.
- **Configuration de l'application : une fenêtre modale**, plein écran sur téléphone (comme le formulaire d'un bouton). On voit la grille changer derrière, sans nouvelle adresse à gérer. Sans bouton Enregistrer : les changements s'appliquent et s'enregistrent un à un.
- **Effacer la grille supprime tous les boutons du compte** (racine, dossiers et contenus), pas le compte ni les réglages. Une fenêtre de confirmation indique le nombre de boutons supprimés et propose un bouton rouge « Effacer la grille » ; aucune saisie à recopier, cohérent avec la suppression d'un dossier. Sur une grille déjà vide, l'entrée du menu est grisée.
- **Un seul appel serveur pour effacer** : `DELETE /api/buttons`, filtré par `userId` comme les autres routes, qui supprime la racine et laisse la cascade de la base vider les dossiers. Faire une boucle de suppressions côté client serait lent et pourrait s'arrêter à moitié.
- **Retour à la grille depuis la configuration.** Le titre « SDPC » de la barre est un lien vers la grille, et l'entrée « Configuration de la grille » du menu devient **« Retour à la grille »** quand on est déjà sur la page de configuration. C'est le même emplacement dans le menu, sans onglet de plus.
- **Pages publiques sans menu.** Connexion et Créer un compte n'ont que le titre : pas de compte à gérer avant d'être connecté.
- **Fermeture automatique.** Le menu et le tiroir se ferment après le choix d'une entrée, y compris quand elle ouvre une fenêtre.
- **Hors périmètre** : image de fond de la grille (liste « Plus tard »), changement de mot de passe ou d'e-mail et suppression du compte (feature 10).

## Implémentation

### Flux

```
Barre d'application → « Mon compte » (ou burger) → menu / tiroir
  ├─ Configuration de la grille     → router.push('/config')           (« Retour à la grille » sur /config)
  ├─ Configuration de l'application → ouvre la fenêtre des réglages
  │      curseur / interrupteurs / thème → store settings (appliqué tout de suite)
  │                                      → PATCH /api/settings → table user_settings
  │      (échec : valeur précédente remise, message affiché)
  ├─ Effacer la grille              → confirmation → DELETE /api/buttons → store.reset() → router.replace('/')
  └─ Déconnexion                    → auth.signOut() → page de connexion, réglages par défaut (inchangé)

Démarrage ou connexion : GET /api/auth/me → GET /api/settings → thème, volume, effets appliqués → page affichée
```

### Réglages du compte

| Réglage | Champ de l'API | Colonne | Valeurs | Défaut |
| --- | --- | --- | --- | --- |
| Son actif | `soundEnabled` | `sound_enabled` | booléen | actif |
| Volume | `volume` | `volume` | entier de 0 à 100 | 100 |
| Effets visuels | `effectsEnabled` | `effects_enabled` | booléen | actifs |
| Thème | `theme` | `theme` | `light`, `dark`, `system` | `system` |

```sql
CREATE TABLE user_settings (
  user_id         TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  sound_enabled   INTEGER NOT NULL DEFAULT 1 CHECK (sound_enabled IN (0, 1)),
  volume          INTEGER NOT NULL DEFAULT 100 CHECK (volume BETWEEN 0 AND 100),
  effects_enabled INTEGER NOT NULL DEFAULT 1 CHECK (effects_enabled IN (0, 1)),
  theme           TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system'))
);
```

### API

| Méthode | Route | Rôle | Réponses |
| --- | --- | --- | --- |
| GET | `/api/settings` | Réglages de la personne connectée (valeurs par défaut sans ligne) | 200, 401 |
| PATCH | `/api/settings` | Modifie un ou plusieurs réglages, renvoie les quatre | 200, 400, 401 |
| DELETE | `/api/buttons` | Supprime tous les boutons de la personne connectée | 204, 401 |

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `server/src/db/migrations.ts` | Migration 4 : table `user_settings` |
| `server/src/settings/store.ts`, `validation.ts`, `router.ts`, `types.ts` | Lecture avec valeurs par défaut, enregistrement partiel, routes `/api/settings` |
| `server/src/buttons/store.ts`, `router.ts` | `clear(userId)`, route `DELETE /api/buttons` |
| `server/src/app.ts`, `index.ts` | Câblage du routeur des réglages |
| `client/src/interfaces/settings.ts` | Type des réglages et du thème |
| `client/src/api/settings.ts` | `fetchSettings`, `updateSettings` |
| `client/src/stores/settings.ts` | Son, volume, effets, thème : chargement, changement, enregistrement, retour arrière |
| `client/src/utils/sounds.ts` | `playSound(name, volume)` : volume appliqué aux notes |
| `client/src/components/AccountMenu.vue` | Menu déroulant (ordinateur) et tiroir (téléphone), contenu partagé |
| `client/src/components/SettingsDialog.vue` | Configuration de l'application |
| `client/src/components/ConfirmClearGrid.vue` | Confirmation de l'effacement, avec le nombre de boutons |
| `client/src/App.vue` | Barre sans onglets, titre-lien, bouton Mon compte / burger, thème et classe des effets |
| `client/src/router/index.ts` | Attend aussi les réglages avant d'afficher une page |
| `client/src/components/ButtonTile.vue`, `ButtonGrid.vue` | Survol et animations coupés quand les effets sont désactivés |
| `client/src/api/buttons.ts`, `stores/buttons.ts` | `clearButtons`, `clear()` |
| `server/test/settings/`, `server/test/buttons/` | Réglages, effacement, isolation |
| `client/test/stores/settings.test.ts`, `test/utils/sounds.test.ts` | Réglages et volume |

### Validation

- [ ] Type-check, lint, tests et build sans erreur côté serveur et côté client
- [ ] Parcours vérifié sur ordinateur : menu déroulant, les quatre entrées, retour à la grille depuis la configuration
- [ ] Parcours vérifié sur téléphone, en portrait et en paysage : burger, tiroir, déconnexion en bas, fenêtre des réglages en plein écran
- [ ] Les réglages suivent le compte d'un appareil à l'autre et ne sont pas partagés entre deux comptes

### Vérifier à la main

```bash
cd server && npm run dev
cd client && npm run dev -- --host
```

1. Connecté : la barre n'affiche que « SDPC » et « Mon compte » (burger sur téléphone), plus aucun onglet.
2. « Mon compte » : le menu s'ouvre sous le bouton, avec l'adresse e-mail, les entrées dans l'ordre demandé et Déconnexion en dernier (en bas du tiroir sur téléphone).
3. Configuration de la grille : la page de configuration s'ouvre ; l'entrée du menu devient « Retour à la grille », tout comme un clic sur « SDPC ».
4. Configuration de l'application : couper le son, remettre le son, déplacer le volume (le son d'essai suit), recharger la page : les réglages sont conservés.
5. Désactiver les effets : les cases n'ont plus de survol, d'apparition ni d'animation de lancement ; les réactiver les rend.
6. Thème : Sombre, Clair, puis Appareil (suit le thème du système). Recharger : pas de flash du mauvais thème.
7. Se connecter avec le même compte sur un autre appareil ou navigateur : les réglages sont les mêmes. Avec un autre compte : réglages par défaut.
8. Couper le serveur puis changer un réglage : la valeur précédente revient et un message s'affiche.
9. Effacer la grille : la fenêtre annonce le nombre de boutons ; Annuler ne supprime rien ; Effacer vide la grille et ramène à la racine ; un second compte garde sa grille.
10. Effacer une grille déjà vide : l'entrée est grisée.
11. Déconnexion depuis le menu : retour à la connexion, qui n'a ni menu ni burger.
