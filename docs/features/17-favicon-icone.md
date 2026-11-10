# Feature 17 — Favicon du site comme icône

| | |
| --- | --- |
| **Statut** | Livré |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` et `server/` (validation de l'icône) |
| **Dépend de** | [04 — Configuration des boutons](04-configuration-boutons.md), [06 — UX : couleurs et effets](06-ux-couleurs-effets.md) |

## Explication de la feature

Aujourd'hui, l'icône d'un bouton est une icône MDI, choisie dans le sélecteur ou saisie à la main. Pour un site sans icône MDI (un intranet, un outil maison, un petit site), on se rabat sur `mdi-web`.

Cette feature ajoute un choix **« Icône du site »** dans le sélecteur : la case affiche alors le favicon du site vers lequel pointe l'action, comme les raccourcis d'un navigateur. C'est l'icône par défaut d'une nouvelle action.

- Le choix n'existe que pour une **action** (un dossier n'a pas d'URL).
- **Rien n'est stocké** : ni l'image, ni son adresse. Le bouton retient seulement qu'il utilise l'icône de son site ; le navigateur demande l'image à un service de favicons public à chaque affichage, à partir du domaine de l'URL.
- Si l'URL change, l'icône suit d'elle-même.
- Si le service ne renvoie rien (site inconnu, hors ligne), la case affiche `mdi-web`.
- Le formulaire est revu au passage : le champ texte du nom d'icône MDI disparaît, l'URL passe juste sous le libellé, et un **aperçu de la case** (la vraie `ButtonTile`) se place à gauche du choix de l'icône (en dessous sur téléphone, comme résultat des choix) : bascule « Icône du site / Bibliothèque », grille d'icônes sur deux lignes, sans titre « Icône », puis le fond (dix pastilles sur une ligne).

## TODO

### Étape 1 — Choix du service (client)

- [x] Vérifier le service de Google (voir les décisions) sur quelques sites : grand site, petit site, intranet inaccessible, domaine inexistant. Sans icône (site inconnu, intranet, domaine inexistant) : statut 404 et globe générique de 16 × 16 px, que le navigateur affiche quand même ; un grand site renvoie au moins 32 px
- [x] `client/src/utils/favicon.ts` : `faviconUrl(url)` renvoie l'adresse de l'image pour le domaine de l'URL, `null` si l'URL n'est pas une URL http(s) valide
- [x] Constante `FAVICON_ICON = 'favicon'` dans `client/src/utils/constants.ts`
- [x] Tests client : domaine extrait (avec chemin, port, sous-domaine), URL invalide

### Étape 2 — Valeur acceptée par le serveur

- [x] `server/src/buttons/validation.ts` : `icon` accepte `"favicon"` en plus d'un nom MDI, pour une action uniquement ; refusé pour un dossier (code d'issue `favicon_needs_url`, à ajouter dans `server/src/constants.ts`)
- [x] Passage d'une action en dossier avec l'icône du site : refusé de la même façon (`PATCH`)
- [x] Tests serveur : création et modification acceptées pour une action, refusées pour un dossier
- [x] Mode invité : même règle dans la validation du formulaire (`utils/buttonForm.ts`), seule validation de l'icône en mode invité ; `guestStorage.ts` ne vérifie que le type de `icon`, inchangé

### Étape 3 — Affichage dans la case (client)

- [x] `ButtonTile.vue` : si `icon === 'favicon'`, une image `<img>` à la place de `<v-icon>`, même taille (`38cqw`), coins arrondis, `alt=""` (le libellé suffit), `loading="lazy"`, `referrerpolicy="no-referrer"`
- [x] Erreur de chargement (`@error`) ou image générique du service (16 px au plus) : retour à `mdi-web`
- [x] Même rendu partout où l'icône d'un bouton s'affiche : composant `ButtonIcon.vue`, utilisé par la case (donc l'aperçu du formulaire) et la bascule du sélecteur (à reprendre pour la recherche rapide, feature 19)

### Étape 4 — Sélecteur (client)

- [x] `IconPicker.vue` : bascule **« Icône du site / Bibliothèque »** avec l'aperçu du favicon de l'URL saisie, masquée pour un dossier ; grille d'icônes qui passe à la ligne (deux lignes visibles, défilement vertical). Revenir à la bibliothèque rend la dernière icône choisie. Champ texte du nom MDI retiré
- [x] `ButtonForm.vue` : passer l'URL et le type au sélecteur ; en passant d'une action à un dossier, l'icône du site redevient l'icône par défaut du dossier
- [x] `ColorPicker.vue` : titre « Fond », dix pastilles de 28 px sur une seule ligne, même sur téléphone
- [x] `ButtonForm.vue` : aperçu de la case à gauche (en dessous sur téléphone), inerte
- [x] Textes `pickers.favicon`, `pickers.library`, `buttonForm.errors.faviconNeedsUrl` et `issues.favicon_needs_url` dans `locales/fr.ts` et `en.ts`
- [x] Tests client : validation du formulaire, bascule action → dossier

### Étape 5 — Documentation

- [x] Fiche mise à jour (décisions, fichiers, vérification à la main)
- [x] README des features : statut

## Décisions

- **Rien n'est stocké ni relayé par l'application.** Ni image en base, ni cache côté serveur, ni route `/api/favicon` : le navigateur charge l'image directement depuis le service. Le bouton enregistre seulement `icon: "favicon"`.
- **Service : Google (`https://www.google.com/s2/favicons?domain=<domaine>&sz=128`)**, pour sa résolution (128 px, nette sur les grandes cases du big picture). Le service voit les domaines des boutons affichés, mais pas le chemin ni la requête de l'URL. DuckDuckGo (`https://icons.duckduckgo.com/ip3/<domaine>.ico`), plus discret, a été écarté : souvent en 32 px, flou sur une grande case.
- **Une valeur réservée dans `icon`, pas de nouveau champ.** `"favicon"` ne peut pas être un nom MDI (pas de préfixe `mdi-`) : aucune colonne à ajouter, aucune migration, et les anciens boutons ne changent pas.
- **Couleur de la case conservée.** Le favicon garde ses propres couleurs sur la case colorée ; pas de pastille blanche derrière, à revoir si certains favicons sombres se lisent mal.
- **Icône du site par défaut pour une action.** Une nouvelle action part de `favicon` ; passer en dossier remplace l'icône du site par `mdi-folder` (comme l'icône par défaut), une icône MDI choisie est gardée.
- **Image générique = pas d'icône.** Pour un site sans favicon, Google renvoie un globe de 16 px (avec un statut 404, mais l'image s'affiche). Une image de 16 px au plus est donc traitée comme absente : la case montre `mdi-web`, plus net. Un vrai favicon de 16 px est traité de même.
- **Plus de saisie libre du nom d'icône.** Le nom `mdi-…` ne parle pas à l'utilisateur : on choisit dans la liste ou l'icône du site. Le serveur accepte toujours n'importe quel nom MDI valide.
- **Hors ligne ou service bloqué** (bloqueur de publicité, réseau d'entreprise) : la case retombe sur `mdi-web`, le bouton reste utilisable.

## Implémentation

### Fichiers

- `client/src/utils/constants.ts` : `FAVICON_ICON`, `FAVICON_FALLBACK_ICON`, `FAVICON_MISSING_SIZE`, `DEFAULT_ICONS`
- `client/src/utils/favicon.ts` : `faviconUrl(url)`
- `client/src/components/ButtonIcon.vue` : favicon ou icône MDI, repli sur `mdi-web`
- `client/src/components/ButtonTile.vue` : la case passe par `ButtonIcon`
- `client/src/components/IconPicker.vue` : bascule « Icône du site / Bibliothèque », grille sur plusieurs lignes, champ texte retiré
- `client/src/components/ColorPicker.vue` : « Fond », pastilles sur une ligne
- `client/src/components/ButtonForm.vue` : URL sous le libellé, aperçu de la case à côté de l'icône et du fond
- `client/src/utils/buttonForm.ts` : validation de `favicon`, `iconAfterTypeChange`
- `server/src/buttons/validation.ts`, `server/src/buttons/constants.ts`, `server/src/constants.ts` : `favicon` accepté pour une action, `favicon_needs_url` pour un dossier
- Tests : `client/test/utils/favicon.test.ts`, `client/test/utils/buttonForm.test.ts`, `server/test/buttons/validation.test.ts`

### Vérifier à la main

1. Créer une action vers `https://github.com`, choisir « Icône du site » : l'aperçu puis la case montrent le favicon GitHub.
2. Changer l'URL vers `https://www.wikipedia.org` : l'icône suit.
3. URL vers un domaine inexistant : la case affiche `mdi-web`.
4. Passer l'action en dossier : l'icône redevient celle d'un dossier ; « Icône du site » n'est plus proposé.
5. Big picture : le favicon reste net sur une grande case.
6. Mode invité : même parcours, la grille rechargée garde le choix.
