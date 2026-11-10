# Feature 18 — Raccourcis clavier en big picture

| | |
| --- | --- |
| **Statut** | Livré |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` |
| **Dépend de** | [13 — Big picture](13-big-picture.md) |

## Explication de la feature

En big picture, la grille sert de Stream Deck posé sur un second écran. Les touches **1 à 7** déclenchent les **7 premières cases** de la grille affichée, soit sa première ligne en paysage, comme un clic :

- touche 1 → case 1 (emplacement 0), touche 2 → case 2 (emplacement 1)… touche 7 → case 7 (emplacement 6) ;
- une **action** ouvre son URL dans un nouvel onglet, avec l'animation et le son de lancement ;
- un **dossier** s'ouvre ; dans un dossier, la touche 1 est donc le **retour** ;
- une case vide ne fait rien.

Les raccourcis ne valent qu'en big picture, et sont ignorés pendant une saisie ou quand une fenêtre ou un menu est ouvert (même règle que la touche F de la feature 13).

## TODO

### Étape 1 — Lecture des touches (client)

- [x] `client/src/utils/keyboard.ts` : `isTypingTarget(event)` (saisie, fenêtre ou menu ouvert), extrait de `GridPage.vue` où la touche F l'utilise déjà
- [x] `shortcutSlot(event)` : emplacement 0 à 6 pour les touches 1 à 7, `null` sinon ; lit `event.code` (`Digit1`…`Digit7`, `Numpad1`…`Numpad7`), ignore les touches avec Ctrl, ⌘ ou Alt et les répétitions
- [x] Tests client : rangée du haut, pavé numérique, modificateurs, répétition, touche hors plage

### Étape 2 — Déclenchement (client)

- [x] `ButtonTile.vue` expose `press()`, le même traitement qu'un clic (animation de lancement comprise) ; `ButtonGrid.vue` expose `press(index)`, qui le transmet à la case de cet emplacement
- [x] `GridPage.vue` : en big picture, la touche appelle `press(emplacement)` sur la grille
- [x] Action, dossier, retour, case vide et mode normal vérifiés à la main (le client n'a pas d'environnement DOM pour tester les composants)

### Étape 3 — Repère visuel (client)

- [x] `ButtonTile.vue` : numéro petit, de la couleur du texte de la case, en bas à droite des 7 premières cases, en big picture seulement, sur les appareils à pointeur fin (`@media (pointer: fine)`) ; pas sur une case vide. Le badge dossier reste en haut à droite

### Étape 4 — Documentation

- [x] Fiche 13 : renvoi vers cette feature pour les touches 1 à 7
- [x] Fiche mise à jour (fichiers, vérification à la main), README des features

## Décisions

- **`event.code`, pas `event.key`.** Sur un clavier AZERTY, la rangée du haut donne `&`, `é`, `"`… sans Maj : `event.key` ne vaudrait `1` qu'avec Maj. `event.code` désigne la touche physique (`Digit1`), donc les chiffres marchent sans Maj, en AZERTY comme en QWERTY. Le pavé numérique est aussi accepté.
- **La première ligne, de 1 à 7.** Une touche par case de la première ligne en paysage (7 × 4) : le numéro se lit d'un coup d'œil sur la rangée, et 8 et 9 ne tomberaient pas sur une même ligne.
- **Les 7 premières cases, pas les 7 premiers boutons.** La touche suit l'emplacement, pas l'ordre des boutons présents : une case vide garde son numéro, et ajouter un bouton ne décale pas les autres raccourcis. C'est le fonctionnement d'un Stream Deck.
- **Dans un dossier, 1 est le retour**, puisque c'est la première case. Pas de touche dédiée au retour (Échap sort déjà du big picture).
- **Mêmes emplacements en portrait.** Les touches visent toujours les emplacements 0 à 6 : la première ligne en paysage (7 × 4), la première ligne et le début de la deuxième en portrait (4 × 7).
- **Big picture seulement.** En mode normal, la grille partage l'écran avec le reste de l'application et les chiffres pourraient servir ailleurs ; la configuration ne les écoute pas non plus.
- **Le numéro sur la case sert de rappel**, pas une entrée de menu : le big picture masque le menu « Mon compte ». Il reste petit, en bas à droite, pour ne pas concurrencer l'icône et le libellé.
- **Le clavier passe par le clic.** La touche ne relance pas la logique de `GridPage` à part : elle « appuie » sur la case (`press()`), qui émet `select` ou `back` comme au clic et joue la même animation. Clavier et souris ne peuvent donc pas diverger.
- **Ouverture d'onglet autorisée.** Un `keydown` est un geste de l'utilisateur : le navigateur laisse `window.open` ouvrir l'onglet, comme pour un clic.

## Implémentation

### Flux

```
keydown (fenêtre) → GridPage.onKeydown
  Échap → sortie du big picture
  saisie, fenêtre ou menu ouvert → ignoré
  F → bascule du big picture
  big picture et shortcutSlot(event) = n → ButtonGrid.press(n) → ButtonTile.press()
    → comme un clic : select (action : onglet, son, animation ; dossier : ouverture) ou back
```

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `client/src/utils/keyboard.ts` | `shortcutSlot`, `isTypingTarget`, `SHORTCUT_COUNT` |
| `client/src/components/ButtonTile.vue` | `press()` exposé, numéro de la touche en bas à droite |
| `client/src/components/ButtonGrid.vue` | Prop `shortcuts`, `press(index)` exposé |
| `client/src/pages/GridPage.vue` | Lecture des touches 1 à 7 en big picture |
| `client/test/utils/keyboard.test.ts` | Tests |

### Validation

- [x] Type-check, lint, tests (218) et build sans erreur côté client
- [x] Parcours vérifié à la main (voir plus bas)

### Vérifier à la main

1. Big picture, clavier AZERTY : touches 1 à 7 de la rangée du haut, sans Maj → les cases correspondantes se lancent (onglet, animation, son).
2. Pavé numérique : même résultat.
3. Ouvrir un dossier avec sa touche, puis 1 → retour au dossier parent.
4. Touches 8 et 9 : rien. Touche d'une case vide : rien. Ctrl+1 ou ⌘+1 : le navigateur change d'onglet comme d'habitude, la grille ne réagit pas.
5. Mode normal : les chiffres ne font rien. Fenêtre de réglages ouverte en big picture : rien non plus.
6. Numéros petits, de la couleur du libellé, en bas à droite des 7 premières cases (la première ligne) en big picture, absents au doigt (téléphone, tablette) et en mode normal.
7. Portrait (4 × 7) : la touche 5 lance la première case de la deuxième ligne.
