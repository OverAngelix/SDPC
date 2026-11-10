# Feature 19 — Recherche rapide (⌘F / Ctrl+F)

| | |
| --- | --- |
| **Statut** | Livré |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` |
| **Dépend de** | [03 — Grille de boutons](03-grille-boutons.md), [11 — Menu « Mon compte »](11-menu-compte-reglages.md), [13 — Big picture](13-big-picture.md) |

## Explication de la feature

Avec plusieurs niveaux de dossiers et sans fil d'Ariane, retrouver un bouton demande de se souvenir de son chemin. La recherche rapide ouvre une **barre de recherche en superposition**, dans l'esprit de Spotlight sur Mac :

- **⌘F** (Mac) ou **Ctrl+F** (Windows, Linux) l'ouvre depuis la grille, en mode normal comme en big picture ; une entrée **« Rechercher (⌘F) »** du menu « Mon compte » l'ouvre aussi, pour le téléphone.
- Une fenêtre sans cadre apparaît en haut de l'écran, au-dessus de la grille assombrie et floutée, avec un grand champ de saisie déjà actif.
- En tapant, la liste se filtre sur **tous les boutons, à tous les niveaux** : icône, libellé et, en plus petit, le chemin des dossiers (« Google › Outils ») ou le domaine de l'URL.
- **↑ / ↓** déplacent la sélection, **Entrée** ouvre le résultat, **Échap** ou un clic à côté referme.
- Une **action** s'ouvre dans un nouvel onglet ; un **dossier** remplace la grille par son contenu.

## TODO

### Étape 1 — Recherche (client)

- [x] `client/src/utils/search.ts` : `searchButtons(buttons, query)` renvoie les boutons trouvés avec leur chemin et le domaine de l'URL ; les boutons qui ne s'affichent pas (parent introuvable, boucle, emplacement réservé ou hors grille) sont ignorés
- [x] Comparaison sans casse ni accents (`normalize('NFD')`), sur le libellé et le domaine de l'URL
- [x] Classement : libellé qui commence par la saisie, puis mot du libellé qui commence par la saisie, puis libellé qui la contient, puis domaine ; à égalité, ordre alphabétique
- [x] Au plus 8 résultats (`SEARCH_LIMIT`) ; saisie vide → aucun résultat
- [x] Tests client : casse, accents, classement, dossiers imbriqués, chemin, limite

### Étape 2 — Fenêtre en superposition (client)

- [x] `client/src/components/QuickSearch.vue` : `v-dialog` en haut de l'écran (environ 15 % du haut), largeur limitée (~640 px), coins arrondis, fond translucide flouté (`backdrop-filter`), voile flouté derrière
- [x] Champ de saisie sans libellé, loupe à gauche, rappel `esc` à droite ; liste des résultats dessous, sélection en surbrillance
- [x] Clavier : ↑ / ↓ (en boucle), Entrée, Échap ; la souris survole et clique aussi
- [x] Message « Aucun résultat » ; saisie remise à zéro à chaque ouverture
- [x] Respect des réglages : apparition animée sauf si les effets sont coupés ou `prefers-reduced-motion`
- [x] Icône du résultat : même rendu que la case (y compris le favicon si la feature 17 est faite)

### Étape 3 — Ouverture et raccourci (client)

- [x] `client/src/stores/quickSearch.ts` : `open`, `show()`, `hide()`
- [x] Raccourci ⌘F / Ctrl+F dans `GridPage.vue`, avec `preventDefault()` (le navigateur l'utilise pour sa recherche dans la page) ; ignoré si une autre fenêtre est ouverte
- [x] Ouvrir un résultat : action → `window.open` comme `select` dans `GridPage.vue` (son de lancement compris) ; dossier → `openFolder(id)` ; la fenêtre se referme dans les deux cas
- [x] Entrée **« Rechercher »** dans `AccountMenuItems.vue` (menu et tiroir), avec le raccourci affiché selon le système (`⌘F` sur Mac, `Ctrl F` ailleurs) ; action `'search'` dans `AccountAction` ; sur la configuration, elle ramène d'abord à la grille (comme le big picture)
- [x] Tests client : store, raccourci (⌘F et Ctrl+F partout, rappel ⌘ sur Mac et Ctrl ailleurs) ; l'ouverture d'une action et d'un dossier passe par `select` de `GridPage.vue`, vérifiée à la main (pas d'environnement DOM pour les composants)

### Étape 4 — Textes et documentation

- [x] `search.*` (libellé, invite, « Aucun résultat », rappel d'Échap, raccourcis) et `menu.search` dans `locales/fr.ts` et `en.ts`
- [x] Fiche mise à jour (fichiers, vérification à la main), README des features
- [x] Vérification manuelle (voir plus bas)

## Décisions

- **Grille seulement.** La recherche sert à lancer un raccourci : elle vit sur la page grille (routes `grid` et `folder`), en mode normal et en big picture. Sur la configuration, ⌘F garde la recherche dans la page du navigateur ; l'entrée du menu ramène à la grille avant d'ouvrir la recherche.
- **Spotlight plutôt que palette de commandes.** On ne cherche que des boutons, pas des actions de l'application (réglages, thème…) : la liste reste courte et lisible.
- **Le chemin à la place du fil d'Ariane.** Chaque résultat affiche les dossiers qui le contiennent : c'est là que l'utilisateur apprend où se trouve un bouton, sans ajouter de fil d'Ariane à la grille.
- **Ouvrir un dossier, c'est y naviguer**, pas l'afficher dans la fenêtre : le retour par la case 0 ramène ensuite à son parent, comme d'habitude.
- **⌘F plutôt que ⌘K** : c'est le réflexe naturel pour « chercher ». Sur la grille, la recherche dans la page du navigateur (peu utile sur 28 cases) est remplacée ; ailleurs, elle reste. Le big picture passe de F à B pour ne pas mettre deux actions sur la même lettre.
- **⌘ sur Mac, Ctrl ailleurs**, détecté par `navigator.platform` / `userAgentData`. Les deux touches marchent partout, seul le rappel affiché change.
- **Tout se fait dans le client**, sur les boutons déjà chargés par le store : aucune route serveur, et la recherche marche aussi en mode invité.
- **Big picture : la fenêtre s'ouvre par-dessus**, sans quitter le mode. Les touches 1 à 7 (feature 18) et B sont ignorées tant qu'elle est ouverte (elle est une `v-overlay`) ; Échap ferme la fenêtre sans quitter le big picture.
- **⌘F referme la fenêtre ouverte.** Si une autre fenêtre est ouverte (réglages, bienvenue…), le raccourci est laissé au navigateur.
- **Le survol suit la souris quand elle bouge** (`mousemove`, pas `mouseenter`) : une liste qui apparaît sous un pointeur immobile ne vole pas la sélection du clavier.

## Implémentation

### Flux

```
keydown (fenêtre) → GridPage.onKeydown
  ⌘F / Ctrl+F (isQuickSearchShortcut) :
    recherche ouverte → preventDefault, quickSearch.hide()
    aucune fenêtre ouverte → preventDefault, quickSearch.show()
    autre fenêtre ouverte → laissé au navigateur
Menu « Mon compte » → Rechercher → App.openSearch (retour à la grille depuis la configuration) → quickSearch.show()

QuickSearch (v-dialog, ouvert par quickSearch.open)
  saisie → searchButtons(store.buttons, saisie) → 8 résultats au plus
  ↑ / ↓ → sélection en boucle ; Entrée ou clic → quickSearch.hide(), émet choose(bouton)
    → GridPage.select : action → son + window.open ; dossier → openFolder(id)
```

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `client/src/utils/search.ts` | `searchButtons`, `normalizeText`, `domainOf` |
| `client/src/interfaces/search.ts` | `SearchResult` : bouton, chemin des dossiers, domaine |
| `client/src/utils/constants.ts` | `SEARCH_LIMIT` |
| `client/src/stores/quickSearch.ts` | `open`, `show()`, `hide()` |
| `client/src/utils/keyboard.ts` | `isQuickSearchShortcut`, `isApplePlatform` |
| `client/src/components/QuickSearch.vue` | Fenêtre en haut de l'écran, champ, résultats, clavier |
| `client/src/pages/GridPage.vue` | Raccourci, fenêtre affichée sur la grille, big picture passé de F à B, Échap qui ne quitte plus le big picture depuis une fenêtre |
| `client/src/components/AccountMenuItems.vue`, `client/src/App.vue` | Entrée « Rechercher (⌘F) », action `search` |
| `client/src/interfaces/account.ts` | Action `'search'` |
| `client/src/locales/fr.ts`, `en.ts` | `search.*`, `menu.search`, « Big picture (B) » et slide de bienvenue |
| `client/test/utils/search.test.ts`, `test/utils/keyboard.test.ts`, `test/stores/quickSearch.test.ts` | Tests |

### Validation

- [x] Type-check, lint, tests (249) et build sans erreur côté client
- [x] Parcours vérifié à la main (voir plus bas)

### Vérifier à la main

1. Sur la grille, ⌘F (Mac) ou Ctrl+F : la fenêtre s'ouvre en haut, grille floutée derrière, champ actif ; la recherche dans la page du navigateur ne s'ouvre pas. Sur la configuration, ⌘F ouvre toujours celle du navigateur.
2. Taper « gm » : Gmail apparaît avec le chemin « Google ». Entrée : nouvel onglet, fenêtre refermée.
3. Taper le nom d'un dossier imbriqué, l'ouvrir : la grille affiche son contenu, la case 0 ramène à son parent.
4. Saisie avec ou sans accents, majuscules : mêmes résultats. Saisie sans résultat : « Aucun résultat ».
5. ↑ / ↓ en boucle, survol à la souris, Échap et clic à côté referment.
6. Big picture (touche B) : ⌘F ouvre la fenêtre sans quitter le mode ; B et les chiffres ne réagissent pas tant qu'elle est ouverte, Échap la ferme sans quitter le mode.
7. Téléphone : menu « Mon compte » → « Rechercher » ; depuis la configuration, l'entrée ramène à la grille.
8. Thème sombre, effets coupés, anglais.
