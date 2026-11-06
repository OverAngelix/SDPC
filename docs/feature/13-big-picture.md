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
- Un **bouton** d'agrandissement tout à droite de la barre d'application active le mode (touche F aussi) ; le **bouton de repli**, à la même place en haut à droite, ou la touche Échap, ramène au mode normal.
- Le mode est **retenu sur l'appareil** : après un rechargement de la page, la grille se rouvre en big picture.
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
- [x] `GridPage.vue` : bouton de repli en haut à droite, touche Échap, sortie du mode au démontage de la page, message « grille vide » masqué

### Étape 3 bis — Raccourci et mémoire du mode (client)

- [x] Bouton d'agrandissement tout à droite de la barre (pages grille et dossier), touche F pour basculer
- [x] Mode retenu dans le navigateur (`localStorage`, clé `sdpc.bigPicture`) : `utils/rememberedBigPicture.ts`, lu et écrit par le store
- [x] Barre et mode ne valent que sur la grille : un mode retenu ne masque jamais la barre sur la configuration ou la connexion
- [x] Tests client : lecture, écriture, stockage refusé, store (mémorisation, rechargement, bascule)

### Étape 4 — Documentation

- [x] `CLAUDE.md` : le big picture dans le périmètre de la V1
- [x] README des features : retrait de « Plein écran ou mode kiosque » de « Plus tard » (le vrai plein écran du navigateur y reste)
- [x] Fiche mise à jour, vérification manuelle (voir plus bas)

## Décisions

- **Retenu sur l'appareil, pas sur le compte.** Le mode se choisit pour un écran (un second écran, un affichage) : il est mémorisé dans le navigateur (`localStorage`), pas dans les réglages du compte. Un rechargement rouvre la grille en big picture ; sans stockage disponible (navigation privée), il n'est simplement pas retenu.
- **Uniquement sur la grille** (routes `grid` et `folder`). Quitter la page grille (retour du navigateur vers la configuration, déconnexion) sort du mode et l'oublie. La navigation entre dossiers reste possible dans le mode. Un mode retenu n'a aucun effet hors de la grille : la barre reste affichée sur la configuration et la connexion.
- **Page agrandie, pas l'API Fullscreen du navigateur.** On masque la barre et on agrandit la grille dans la fenêtre. Le vrai plein écran (qui n'existe pas sur iOS Safari) reste dans « Plus tard ».
- **Libellés conservés.** Les cases gardent icône et libellé ; seul le bouton de repli est une icône seule.
- **Le bouton de repli prend la place du raccourci d'entrée** : tout à droite de la barre, puis, une fois la barre retirée, au même endroit de l'écran. Une bande est réservée en haut : il ne recouvre jamais une case.
- **Message « grille vide » masqué** dans le mode : il fait déborder la grille hors de l'écran, et il renvoie vers un menu qui n'y est pas.
- **La grille tient toujours dans l'écran**, y compris sur téléphone couché, où le mode normal la laisse défiler (feature 07).
- **Trois entrées** : le menu « Mon compte », le bouton de la barre (grille et dossiers) et la touche F (ignorée pendant une saisie ou quand une fenêtre ou un menu est ouvert).

## Implémentation

### Flux

```
Menu « Mon compte » → Big picture
  → store bigPicture.active = true (retenu dans localStorage)
  → App.vue : barre d'application retirée
  → GridPage : bouton de repli affiché, ButtonGrid en mode fill (cases agrandies)

Bouton de repli, Échap ou F → mode normal (et oublié)
Rechargement de la page → le mode retenu est relu : la grille se rouvre en big picture
Page grille quittée (retour navigateur, déconnexion) → bigPicture.exit()
```

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `client/src/stores/bigPicture.ts` | État du mode, mémorisé |
| `client/src/utils/rememberedBigPicture.ts` | Lecture et écriture du mode dans le navigateur |
| `client/src/interfaces/account.ts` | Action `bigPicture` du menu |
| `client/src/components/AccountMenuItems.vue` | Entrée du menu |
| `client/src/App.vue` | Barre masquée, bouton d'entrée, traitement de l'action |
| `client/src/components/ButtonGrid.vue` | Mode `fill` |
| `client/src/pages/GridPage.vue` | Bouton de repli, touches Échap et F, sortie au démontage |
| `client/src/locales/fr.ts`, `en.ts` | Textes |
| `client/test/stores/bigPicture.test.ts`, `test/utils/rememberedBigPicture.test.ts` | Tests |

### Validation

- [x] Type-check, lint, tests (179) et build sans erreur côté client
- [ ] Parcours vérifié sur ordinateur et sur téléphone (portrait et paysage)

### Vérifier à la main

```bash
cd server && npm run dev
cd client && npm run dev -- --host
```

1. Bouton d'agrandissement tout à droite de la barre (ou menu « Mon compte » → Big picture, ou touche F) : barre disparue, grille plein écran, libellés visibles, bouton de repli en haut à droite à la même place, sans recouvrir une case.
2. Bouton de repli, Échap ou F : retour au mode normal, dans le même dossier. Dans un dossier vide, la grille tient entière à l'écran.
3. Recharger la page en big picture : la grille se rouvre en big picture ; en mode normal, elle reste normale.
4. Ouvrir un dossier dans le mode puis revenir par la case 0 : le mode reste actif ; lancer une action ouvre un nouvel onglet.
5. Depuis le mode, retour du navigateur vers la configuration : mode normal.
6. Portrait téléphone (4 × 7), téléphone couché (la grille tient dans l'écran), écran 16:9, thème sombre, effets coupés.
7. Changer de langue : le libellé du menu et les infobulles des boutons suivent.
8. Saisir un « f » dans un champ ou avec une fenêtre ouverte (réglages, mon compte) : le mode ne bascule pas.
