# Feature 06 — UX : couleurs et effets « juicy »

| | |
| --- | --- |
| **Statut** | Livré |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` et `server/` |
| **Dépend de** | [04 — Configuration des boutons](04-configuration-boutons.md), [05 — Glisser-déposer des boutons](05-glisser-deposer.md) |

## Explication de la feature

Rendre la grille plus agréable à utiliser, comme les touches d'un vrai Stream Deck qui répondent sous le doigt :

- **Couleur des cases** : chaque bouton (action ou dossier) prend l'une des **10 couleurs** proposées dans le formulaire de configuration. On repère un raccourci à sa couleur autant qu'à son icône.
- **Effets visuels « juicy »** : les cases réagissent (survol, appui, lancement d'une action), apparaissent l'une après l'autre quand on ouvre un dossier, et le déplacement, la création et le refus d'un dépôt se voient.
- **Effets sonores** : un petit son accompagne chaque geste (lancer une action, ouvrir un dossier, revenir, créer, déplacer, supprimer, refuser). Un bouton dans la barre d'application coupe ou rétablit le son.

## TODO

- [x] Serveur : champ `color` d'un bouton (10 valeurs, facultatif), validé à la création, à la modification et à la lecture du fichier
- [x] Client : type `ButtonColor`, palette et couleur par défaut
- [x] Client : sélecteur de couleur dans le formulaire (création et modification)
- [x] Client : cases colorées dans la grille et dans la configuration
- [x] Client : effets visuels des cases (survol, appui, lancement, apparition échelonnée, déplacement)
- [x] Client : sons synthétisés (Web Audio, aucun fichier audio) et préférence « son » mémorisée
- [x] Client : sons branchés sur la navigation, le lancement et la configuration
- [x] Client : bouton son dans la barre d'application
- [x] Respect de `prefers-reduced-motion` : aucune animation si le système le demande
- [x] Tests serveur (validation, route) et client (formulaire, palette, sons, préférence)
- [x] Fiche mise à jour et README du projet

## Décisions

- **Dix couleurs nommées, pas de sélecteur libre.** Une palette fixe garde une grille cohérente et lisible en thème clair comme en thème sombre. Les noms sont ceux de Vuetify (`grey`, `red`, `orange`, `amber`, `green`, `teal`, `cyan`, `blue`, `purple`, `pink`) : le serveur ne stocke que le nom, jamais un code couleur, et le rendu s'adapte au thème.
- **Cases pleines, texte et icônes en blanc.** Une teinte légère (variante « tonal » de Vuetify) colorait aussi l'icône et le libellé, qui se fondaient dans le fond : la case entière porte la couleur, le contenu reste blanc.
- **Le gris est la couleur par défaut**, en gris foncé (`grey-darken-2`) pour garder un texte blanc lisible. Un bouton sans `color` (créé avant cette feature) s'affiche en gris : aucune migration du fichier de données.
- **`color` est facultatif côté serveur** (comme `url` pour un dossier) et refusé s'il n'est pas dans la liste. Le formulaire l'envoie toujours.
- **Aucun fichier audio** : les sons sont synthétisés à la volée avec l'API Web Audio (oscillateurs et enveloppes courtes). Pas de poids ajouté, pas de licence à gérer, et chaque son est décrit par des données (notes, durées), donc testable.
- **Le son démarre sur un geste de l'utilisateur** (clic, glisser) : les navigateurs interdisent l'audio automatique, le contexte audio n'est créé qu'à la première lecture.
- **Son activé par défaut, coupable en un clic** ; le choix est mémorisé dans le navigateur (`localStorage`). Le serveur n'en sait rien : pas de compte, c'est une préférence de l'appareil. Le bouton de la barre d'application est un simple interrupteur : l'écran de configuration de l'application (désactiver aussi les effets visuels, thèmes) reste dans « Plus tard » du README des features.
- **Effets visuels en CSS** (transformations et animations), sans bibliothèque. `prefers-reduced-motion: reduce` les désactive.
- **Effets sonores et visuels sur la grille et sur la configuration**, mais le lancement d'une action ne retarde jamais l'ouverture de l'onglet : l'animation joue pendant ce temps (sinon le navigateur bloquerait la fenêtre).

## Implémentation

### Flux

```
Formulaire (ColorPicker) → color ∈ 10 noms → POST/PATCH /api/buttons → le serveur valide, stocke le nom
ButtonTile → colorOf(button) → solidColor → case pleine Vuetify, texte blanc (gris = grey-darken-2)

Geste de l'utilisateur → useSettingsStore().play(nom) → si le son est activé : playSound(nom)
  → contexte audio créé à la première lecture → scheduleTones : oscillateurs + enveloppes courtes

ButtonGrid : watch des emplacements → placedIds(avant, après) → effet « pop » sur les cases posées
             dépôt sur la tuile de retour → effet « shake »
ButtonTile : survol, appui, lancement (animation CSS), apparition en vague (--wave)
```

### Palette

`grey` (défaut), `red`, `orange`, `amber`, `green`, `teal`, `cyan`, `blue`, `purple`, `pink`. Le serveur refuse tout autre nom (400, message `color : …`) et relit le fichier de données avec la même règle ; un bouton sans `color` reste valide.

### Sons

| Son | Geste | Forme |
| --- | --- | --- |
| `launch` | lancer une action | deux notes montantes |
| `open` | ouvrir un dossier | glissando montant |
| `back` | revenir | glissando descendant |
| `create` | créer un bouton | arpège de trois notes |
| `move` | déplacer, échanger ou modifier un bouton | note brève montante |
| `delete` | supprimer | glissando grave descendant |
| `refuse` | dépôt ou déplacement refusé | deux notes graves carrées |

Chaque son est une liste de notes (`SOUNDS` dans `client/src/utils/sounds.ts`) : modifier un son revient à modifier des données. Le bouton de la barre d'application écrit la préférence dans `localStorage` (`sdpc.sound`, `off` ou `on`).

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `server/src/buttons/types.ts` | `BUTTON_COLORS`, `ButtonColor`, champ `color` |
| `server/src/buttons/validation.ts` | `parseColor`, `color` conservée à la modification |
| `client/src/interfaces/button.ts` | `ButtonColor`, `color` dans `Button` et `ButtonPatch` |
| `client/src/interfaces/sound.ts` | `SoundName`, `Tone` |
| `client/src/interfaces/buttonForm.ts` | `color` dans les valeurs du formulaire |
| `client/src/utils/colors.ts` | Palette et libellés, `DEFAULT_COLOR`, `colorOf`, `solidColor` |
| `client/src/utils/sounds.ts` | `SOUNDS`, `scheduleTones`, `playSound` |
| `client/src/stores/settings.ts` | Préférence « son », `play` |
| `client/src/grid.ts` | `placedIds` : cases créées, déplacées ou échangées |
| `client/src/components/ColorPicker.vue` | Choix de la couleur dans le formulaire |
| `client/src/components/ButtonTile.vue` | Case pleine colorée et animations CSS |
| `client/src/components/ButtonGrid.vue` | Effets « pop » et « shake », vague d'apparition |
| `client/src/App.vue` | Bouton son |
| `client/src/composables/folderNavigation.ts`, `client/src/pages/*.vue` | Sons branchés sur les gestes |
| `server/test/buttons/*.test.ts` | Couleur : validation, stockage, relecture du fichier, routes |
| `client/test/utils/colors.test.ts`, `sounds.test.ts` | Palette, enveloppes et notes, audio absent ou refusé |
| `client/test/stores/settings.test.ts` | Valeur par défaut, mémorisation, stockage indisponible |
| `client/test/grid.test.ts` | Tests de `placedIds` |

### Validation

- [x] Tests serveur (82) et client (88), type-check, lint et build sans erreur ; couleur vérifiée sur l'API en marche (201 avec `red`, 400 avec `rouge`)
- [ ] Parcours vérifié dans le navigateur, à l'œil et à l'oreille (couleurs en thème clair et sombre, survol, appui, vague d'apparition, pop après création et déplacement, secousse de la tuile de retour, chaque son, bouton son, `prefers-reduced-motion`)

### Vérifier à la main

```bash
cd server && npm run dev
cd client && npm run dev          # puis http://localhost:3000/config
```

1. Créer un bouton, choisir une couleur : la case est pleine, texte blanc, dans la configuration et dans l'onglet Grille. Un bouton plus ancien reste gris.
2. Survoler une case (elle se soulève), appuyer (elle s'enfonce), cliquer une action dans l'onglet Grille (pulsation et son, l'onglet s'ouvre sans attendre).
3. Ouvrir un dossier : les cases apparaissent en vague, avec un son montant ; le retour joue le son inverse.
4. Dans la configuration, créer, déplacer, échanger, supprimer : chaque geste a son son, la case posée fait un « pop ». Lâcher un bouton sur la tuile de retour : elle se secoue, son de refus.
5. Cliquer le haut-parleur de la barre d'application : plus aucun son, y compris après rechargement de la page.
6. Activer « réduire les animations » dans le système : plus aucune animation ni mouvement au survol.

Tests : `npm test` dans `client/` et dans `server/`. Les animations et la lecture réelle des sons ne sont pas couverts par des tests automatiques (pas d'environnement DOM côté client) : la logique testable est dans la palette, la description des sons et leur programmation, la préférence et `placedIds`.
