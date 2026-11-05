# Feature 13 — Big picture

| | |
| --- | --- |
| **Statut** | En cours |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` |
| **Dépend de** | [03 — Grille de boutons](03-grille-boutons.md), [07 — Responsive](07-responsive.md), [11 — Menu « Mon compte »](11-menu-compte-reglages.md) |

## Explication de la feature

Aujourd'hui la grille partage l'écran avec la barre d'application et des marges, et ses cases sont plafonnées à 124 px. Pour un usage « Stream Deck posé sur un second écran », cette feature ajoute un mode **big picture** : la grille occupe tout l'écran.

- Une entrée **Big picture** dans le menu « Mon compte » (et dans son tiroir sur téléphone) active le mode.
- La barre d'application disparaît ; les cases grandissent pour remplir l'écran, avec leur icône et leur libellé.
- Un **bouton de repli** (icône seule) en haut à gauche, ou la touche Échap, ramène au mode normal.
- Les dossiers et les actions marchent comme d'habitude : ouvrir un dossier, revenir par la case 0, lancer une URL dans un nouvel onglet.

## TODO

### Étape 1 — État du mode (client)

- [x] Store Pinia `client/src/stores/bigPicture.ts` : `active`, `enter()`, `exit()`
- [x] Tests client : inactif au départ, entrer, sortir

### Étape 2 — Entrée du menu (client)

- [x] `'bigPicture'` dans `AccountAction` (`interfaces/account.ts`)
- [x] Entrée dans `AccountMenuItems.vue` (menu déroulant et tiroir)
- [x] `App.vue` : l'action ouvre la grille si on est sur la configuration, puis active le mode
- [x] Textes `menu.bigPicture` et `bigPicture.exit` dans `locales/fr.ts` et `en.ts`

### Étape 3 — Grille plein cadre (client)

- [x] `App.vue` : barre d'application masquée tant que le mode est actif
- [x] `ButtonGrid.vue` : prop `fill` (marges réduites, plafond des cases levé, la grille tient toujours dans l'écran)
- [x] `GridPage.vue` : bouton de repli en haut à gauche, touche Échap, sortie du mode au démontage de la page

### Étape 4 — Documentation

- [x] `CLAUDE.md` : le big picture dans le périmètre de la V1
- [x] README des features : retrait de « Plein écran ou mode kiosque » de « Plus tard » (le vrai plein écran du navigateur y reste)
- [x] Fiche mise à jour, vérification manuelle (voir plus bas)

## Décisions

- **Un état transitoire, pas un réglage du compte.** Le mode se choisit sur le moment (un second écran, un affichage) : il n'est pas enregistré, un rechargement de la page revient au mode normal.
- **Uniquement sur la grille** (routes `grid` et `folder`). Quitter la page (retour du navigateur vers la configuration, déconnexion) sort du mode. La navigation entre dossiers reste possible dans le mode.
- **Page agrandie, pas l'API Fullscreen du navigateur.** On masque la barre et on agrandit la grille dans la fenêtre. Le vrai plein écran (qui n'existe pas sur iOS Safari) reste dans « Plus tard ».
- **Libellés conservés.** Les cases gardent icône et libellé ; seul le bouton de repli est une icône seule.
- **Bouton de repli hors de la grille.** Une bande est réservée en haut de l'écran : le bouton ne recouvre jamais la case 0, qui est le retour d'un dossier.
- **La grille tient toujours dans l'écran**, y compris sur téléphone couché, où le mode normal la laisse défiler (feature 07).
- **Entrée par le menu seulement** pour l'instant, pas de bouton sur la grille.

## Implémentation

### Flux

```
Menu « Mon compte » → Big picture
  → store bigPicture.active = true
  → App.vue : barre d'application retirée
  → GridPage : bouton de repli affiché, ButtonGrid en mode fill (cases agrandies)

Bouton de repli ou Échap → bigPicture.exit() → mode normal
Page grille quittée (retour navigateur, déconnexion) → bigPicture.exit()
```

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `client/src/stores/bigPicture.ts` | État du mode |
| `client/src/interfaces/account.ts` | Action `bigPicture` du menu |
| `client/src/components/AccountMenuItems.vue` | Entrée du menu |
| `client/src/App.vue` | Barre masquée, traitement de l'action |
| `client/src/components/ButtonGrid.vue` | Mode `fill` |
| `client/src/pages/GridPage.vue` | Bouton de repli, Échap, sortie au démontage |
| `client/src/locales/fr.ts`, `en.ts` | Textes |
| `client/test/stores/bigPicture.test.ts` | Tests |

### Validation

- [x] Type-check, lint, tests (171) et build sans erreur côté client
- [ ] Parcours vérifié sur ordinateur et sur téléphone (portrait et paysage)

### Vérifier à la main

```bash
cd server && npm run dev
cd client && npm run dev -- --host
```

1. Menu « Mon compte » → Big picture : barre disparue, grille plein écran, libellés visibles, bouton de repli en haut à gauche sans recouvrir une case.
2. Bouton de repli, puis Échap : retour au mode normal, dans le même dossier.
3. Ouvrir un dossier dans le mode puis revenir par la case 0 : le mode reste actif ; lancer une action ouvre un nouvel onglet.
4. Depuis le mode, retour du navigateur vers la configuration : mode normal.
5. Portrait téléphone (4 × 7), téléphone couché (la grille tient dans l'écran), écran 16:9, thème sombre, effets coupés.
6. Changer de langue : le libellé du menu et l'infobulle du bouton suivent.
