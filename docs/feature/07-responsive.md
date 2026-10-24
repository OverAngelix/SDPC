# Feature 07 — Responsive : grille adaptée au téléphone

| | |
| --- | --- |
| **Statut** | Livré |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` |
| **Dépend de** | [06 — UX : couleurs et effets « juicy »](06-ux-couleurs-effets.md) |

## Explication de la feature

Sur téléphone, la grille de 7 colonnes × 5 lignes est écrasée : en portrait, une case ne mesure qu'une cinquantaine de pixels, l'icône et le libellé sont minuscules et difficiles à toucher. L'application doit être utilisable au doigt, pour **lancer** ses raccourcis comme pour **configurer** ses boutons :

- **Grille en portrait** : sur un écran plus haut que large, la grille passe de 7 × 5 à **5 colonnes × 7 lignes**. Ce sont toujours les mêmes 35 emplacements (0 à 34), mais plus larges : icônes et libellés sont plus grands, les cases plus faciles à toucher. En paysage (ordinateur, téléphone couché), la grille reste en 7 × 5.
- **Cases plus généreuses** : marges et espaces réduits sur petit écran pour que la grille occupe toute la largeur, libellés lisibles.
- **Interface adaptée au tactile** : barre d'application qui tient sur une ligne, zones à toucher assez grandes, boîtes de dialogue en plein écran, déplacement des boutons possible sans souris.

## TODO

- [x] Client : forme de la grille selon l'orientation de l'écran (7 × 5 en paysage, 5 × 7 en portrait), un seul endroit dans `grid.ts`
- [x] Client : vague d'apparition calculée à partir du nombre de colonnes courant (et non plus de la constante 7)
- [x] Client : taille de la grille (largeur et hauteur disponibles) fiable sur mobile : unités `dvh`, réserve de hauteur réduite sur petit écran
- [x] Client : marges de la page et espaces entre cases réduits sur petit écran
- [x] Client : libellés des cases plus grands et lisibles sur petit écran
- [x] Client : barre d'application compacte sur petit écran (onglets réduits aux icônes, titre masqué si besoin)
- [x] Client : effet de survol réservé aux appareils qui survolent (`@media (hover: hover)`), l'appui reste actif au doigt
- [x] Client : zones tactiles des boutons Modifier et Supprimer d'une case suffisamment grandes en configuration
- [x] Client : formulaire d'un bouton (avec son sélecteur d'icône) en plein écran sur petit écran
- [x] Client : déplacer un bouton au doigt, sans glisser-déposer (voir les décisions)
- [x] Tests client de la forme de la grille et de la vague
- [x] Fiche mise à jour
- [ ] Vérification sur téléphone réel (portrait et paysage)
- [x] Retirer « Responsive » de la liste « Plus tard » du README des features, et ajouter la ligne 07 au tableau

## Décisions

- **5 × 7 en portrait, pas de défilement.** Garder 7 colonnes en portrait donnerait des cases de ~50 px ; en 5 colonnes elles passent à ~70 px sur un écran de 390 px, et les 35 emplacements restent visibles d'un coup, comme sur un Stream Deck. Faire défiler la grille ou réduire le nombre d'emplacements changerait le modèle de données : écarté.
- **La forme suit l'orientation de la fenêtre, pas le type d'appareil.** Une fenêtre étroite et haute sur ordinateur obtient aussi 5 × 7 : une grille 7 × 5 y serait tout aussi écrasée. Critère : `(orientation: portrait)`, c'est-à-dire hauteur supérieure à la largeur.
- **Aucun changement côté serveur ni dans les données.** Les emplacements restent 0 à 34, la case 0 d'un dossier reste le retour (en haut à gauche dans les deux formes). Seule la position *visuelle* d'un bouton change d'une orientation à l'autre (ordre de lecture sur 5 colonnes au lieu de 7) ; c'est accepté : la grille se lit toujours de gauche à droite, de haut en bas.
- **Un seul endroit pour la forme de la grille**, dans `client/src/grid.ts`, qui porte déjà `COLUMNS` et `ROWS` (« un seul endroit à changer pour la rendre modulable »). Ces constantes deviennent une forme dépendant de l'orientation, lue par `ButtonGrid.vue` ; `SLOTS` reste égal à 35 dans les deux cas. Ce travail prépare aussi la grille modulable listée dans « Plus tard ».
- **Détection de l'orientation en JavaScript (`matchMedia`) plutôt qu'en CSS seul**, car le nombre de colonnes sert aussi à calculer la vague d'apparition (`wave`) : une media query CSS ne suffit pas. La valeur se met à jour quand l'écran pivote.
- **Pas de refonte de la navigation.** La barre d'application et les onglets Grille / Configuration restent ; on les compacte seulement. Une barre de navigation en bas d'écran n'apporte rien tant qu'il n'y a que deux onglets.
- **Déplacer au doigt : mode « déplacer » en deux touchers, lancé depuis le formulaire.** Le glisser-déposer HTML5 de la feature 05 ne fonctionne pas au toucher sur la plupart des navigateurs mobiles. Plutôt qu'une bibliothèque ou une simulation d'événements de pointeur, le formulaire d'un bouton propose **Déplacer** (trois boutons sur une case de 70 px ne tiennent pas) : le dialogue se ferme, la case est entourée en pointillés et un bandeau avec **Annuler** s'affiche, puis un toucher sur un emplacement la place là (libre) ou échange les deux boutons (occupé), avec les mêmes règles et les mêmes refus que le glisser-déposer (tuile de retour interdite). Ouvrir un autre dossier, modifier ou supprimer annule le déplacement en attente. Le glisser-déposer reste tel quel avec une souris. C'est le seul morceau qui ajoute une interaction : à livrer dans un commit à part.
- **Survol réservé aux souris.** Le soulèvement au survol reste sur ordinateur ; au doigt il resterait « collé » après un toucher. L'effet d'appui et les autres animations (feature 06) sont inchangés, `prefers-reduced-motion` toujours respecté.
- **Confirmation de suppression inchangée.** C'est un petit dialogue centré, déjà lisible sur téléphone : seul le formulaire, long, passe en plein écran.
- **Cases d'édition : le contenu descend sous les boutons Modifier et Supprimer** sur petit écran, sinon ils recouvrent l'icône d'une case de 70 px.
- **Téléphone couché : la grille défile.** En paysage et sous 500 px de hauteur, la page prend toute la largeur et la grille garde de grandes cases, quitte à défiler (au lieu de tenir en hauteur avec des cases de ~50 px). Le conteneur Vuetify, plafonné à 700 px, est levé dans ce cas.
- **Les icônes grandissent avec la case.** Elles sont déjà dimensionnées en unités de conteneur (`cqw`) : agrandir les cases suffit à agrandir les icônes, sans taille supplémentaire à maintenir.

## Implémentation

### Flux

```
Écran pivoté ou redimensionné → matchMedia('(orientation: portrait)') change
  → forme de la grille : portrait 5 colonnes × 7 lignes, paysage 7 colonnes × 5 lignes
  → ButtonGrid : --columns / --rows, largeur maximale, vague d'apparition recalculées

Configuration, au doigt : formulaire d'un bouton → Déplacer → case marquée
  → toucher d'un emplacement → store.move(id, position) (même appel que le glisser-déposer)
```

### Mise en œuvre

- `grid.ts` : fonction pure `gridShape(portrait)` renvoyant `{ columns, rows }`, plus un composable (ex. `useGridShape`) qui lit `matchMedia` et se met à jour. `SLOTS` reste 35.
- `ButtonGrid.vue` : `--columns` et `--rows` viennent de la forme courante ; `wave(index)` utilise le nombre de colonnes courant. La largeur maximale `min(100%, calc((100vh - 200px) × colonnes / lignes))` passe en `dvh` (la barre d'adresse mobile fait varier `vh`) avec une réserve de hauteur plus faible sur petit écran.
- Largeur : en portrait sur téléphone, c'est la largeur qui limite ; en paysage court (moins de 500 px de haut), la grille prend toute la largeur et la page défile.
- `ButtonTile.vue` : survol sous `@media (hover: hover)`, boutons Modifier et Supprimer plus grands sur petit écran, libellé plus grand (`clamp` à ajuster).
- `App.vue` : onglets réduits aux icônes (avec `aria-label`) sous le seuil `xs` de Vuetify.
- `ButtonForm.vue` : `fullscreen` sous `xs` (`useDisplay` de Vuetify), bouton Déplacer.
- `ConfigPage.vue` : état « bouton à déplacer », bandeau Annuler, destination touchée.

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `client/src/grid.ts` | `gridShape` : colonnes et lignes selon l'orientation |
| `client/src/composables/gridShape.ts` | Forme courante de la grille, mise à jour à la rotation de l'écran |
| `client/src/components/ButtonGrid.vue` | Forme variable, vague, taille maximale en `dvh`, mode « déplacer » |
| `client/src/components/ButtonTile.vue` | Survol réservé aux souris, zones tactiles, libellés |
| `client/src/App.vue` | Barre d'application compacte |
| `client/src/components/ButtonForm.vue` | Plein écran sur petit écran, bouton Déplacer |
| `client/src/pages/ConfigPage.vue`, `GridPage.vue` | Déplacement en deux touchers, marges réduites |
| `client/src/interfaces/grid.ts` | Type `GridShape` |
| `client/test/grid.test.ts` | Tests de `gridShape` et de la vague |

### Validation

- [x] Type-check, lint, tests (93) et build sans erreur ; rendu vérifié dans Chrome (cadres de 390 × 844 et 844 × 390) : 5 × 7 en portrait avec les 35 emplacements visibles, 7 × 5 plein largeur en paysage, onglets réduits aux icônes, contenu des cases d'édition sous les boutons
- [ ] Parcours vérifié sur téléphone réel, en portrait et en paysage : lecture et toucher des cases, ouverture d'un dossier et retour, lancement d'une action, création, modification, suppression et déplacement d'un bouton, rotation de l'écran sans perte de l'état (dossier ouvert, formulaire)
- [ ] Parcours vérifié sur ordinateur : la grille reste en 7 × 5, aucune régression de survol ni de glisser-déposer

### Vérifier à la main

```bash
cd server && npm run dev
cd client && npm run dev -- --host   # accessible sur le réseau local : http://<IP de l'ordinateur>:3000
```

L'API passe par le proxy de Vite (`/api`) : le téléphone n'a besoin d'atteindre que le port 3000. Sans téléphone, utiliser le mode appareil des outils de développement du navigateur (portrait et paysage), en gardant en tête que le toucher réel et la barre d'adresse mobile ne s'y simulent qu'imparfaitement.

1. Portrait : la grille est en 5 × 7, remplit la largeur, icônes et libellés bien lisibles ; les 35 emplacements sont visibles.
2. Pivoter l'écran : la grille passe en 7 × 5 sans recharger la page, le dossier ouvert reste ouvert.
3. Ouvrir un dossier, revenir (case en haut à gauche), lancer une action : tout se touche sans erreur de visée.
4. Configuration : créer, modifier, supprimer un bouton ; les dialogues occupent l'écran, le clavier ne masque pas les champs.
5. Configuration : Déplacer un bouton vers un emplacement libre, puis vers un occupé (échange), puis vers la tuile de retour (refus avec message).
6. Ordinateur : survol, glisser-déposer et sons comme avant.

Tests : `npm test` dans `client/`. Seule la logique pure (forme de la grille, vague d'apparition) est couverte par des tests automatiques ; la mise en page et le toucher se vérifient sur appareil (pas d'environnement DOM côté client).
