# Feature 17 — Favicon du site comme icône

| | |
| --- | --- |
| **Statut** | À faire |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` et `server/` (validation de l'icône) |
| **Dépend de** | [04 — Configuration des boutons](04-configuration-boutons.md), [06 — UX : couleurs et effets](06-ux-couleurs-effets.md) |

## Explication de la feature

Aujourd'hui, l'icône d'un bouton est une icône MDI, choisie dans le sélecteur ou saisie à la main. Pour un site sans icône MDI (un intranet, un outil maison, un petit site), on se rabat sur `mdi-web`.

Cette feature ajoute un choix **« Icône du site »** dans le sélecteur : la case affiche alors le favicon du site vers lequel pointe l'action, comme les raccourcis d'un navigateur.

- Le choix n'existe que pour une **action** (un dossier n'a pas d'URL).
- **Rien n'est stocké** : ni l'image, ni son adresse. Le bouton retient seulement qu'il utilise l'icône de son site ; le navigateur demande l'image à un service de favicons public à chaque affichage, à partir du domaine de l'URL.
- Si l'URL change, l'icône suit d'elle-même.
- Si le service ne renvoie rien (site inconnu, hors ligne), la case affiche `mdi-web`.

## TODO

### Étape 1 — Choix du service (client)

- [ ] Vérifier le service de Google (voir les décisions) sur quelques sites : grand site, petit site, intranet inaccessible, domaine inexistant. Noter ce qui arrive quand aucune icône n'existe (erreur 404 ou image par défaut)
- [ ] `client/src/utils/favicon.ts` : `faviconUrl(url)` renvoie l'adresse de l'image pour le domaine de l'URL, `null` si l'URL n'est pas une URL http(s) valide
- [ ] Constante `FAVICON_ICON = 'favicon'` dans `client/src/utils/constants.ts` (ou le `constants.ts` le plus proche)
- [ ] Tests client : domaine extrait (avec chemin, port, sous-domaine), URL invalide

### Étape 2 — Valeur acceptée par le serveur

- [ ] `server/src/buttons/validation.ts` : `icon` accepte `"favicon"` en plus d'un nom MDI, pour une action uniquement ; refusé pour un dossier (code d'issue `favicon_needs_url`, à ajouter dans `server/src/constants.ts`)
- [ ] Passage d'une action en dossier avec l'icône du site : refusé de la même façon (`PATCH`)
- [ ] Tests serveur : création et modification acceptées pour une action, refusées pour un dossier
- [ ] Mode invité : même règle dans `client/src/utils/guestStorage.ts` et dans la validation du formulaire (`utils/buttonForm.ts`)

### Étape 3 — Affichage dans la case (client)

- [ ] `ButtonTile.vue` : si `icon === 'favicon'`, une image `<img>` à la place de `<v-icon>`, même taille (`38cqw`), coins arrondis, `alt=""` (le libellé suffit), `loading="lazy"`, `referrerpolicy="no-referrer"`
- [ ] Erreur de chargement (`@error`) : retour à `mdi-web`
- [ ] Même rendu partout où l'icône d'un bouton s'affiche (aperçu du formulaire, résultats de la recherche rapide si la feature 19 est faite)

### Étape 4 — Sélecteur (client)

- [ ] `IconPicker.vue` : première entrée **« Icône du site »**, avec l'aperçu du favicon de l'URL saisie ; masquée ou désactivée pour un dossier
- [ ] `ButtonForm.vue` : passer l'URL et le type au sélecteur ; en passant d'une action à un dossier, l'icône du site redevient l'icône par défaut du dossier
- [ ] Textes `pickers.favicon`, `buttonForm.errors.faviconNeedsUrl` et `issues.favicon_needs_url` dans `locales/fr.ts` et `en.ts`
- [ ] Tests client : validation du formulaire, bascule action → dossier

### Étape 5 — Documentation

- [ ] Fiche mise à jour (décisions, fichiers, vérification à la main)
- [ ] README des features : statut

## Décisions

- **Rien n'est stocké ni relayé par l'application.** Ni image en base, ni cache côté serveur, ni route `/api/favicon` : le navigateur charge l'image directement depuis le service. Le bouton enregistre seulement `icon: "favicon"`.
- **Service : Google (`https://www.google.com/s2/favicons?domain=<domaine>&sz=128`)**, pour sa résolution (128 px, nette sur les grandes cases du big picture). Le service voit les domaines des boutons affichés, mais pas le chemin ni la requête de l'URL. DuckDuckGo (`https://icons.duckduckgo.com/ip3/<domaine>.ico`), plus discret, a été écarté : souvent en 32 px, flou sur une grande case.
- **Une valeur réservée dans `icon`, pas de nouveau champ.** `"favicon"` ne peut pas être un nom MDI (pas de préfixe `mdi-`) : aucune colonne à ajouter, aucune migration, et les anciens boutons ne changent pas.
- **Couleur de la case conservée.** Le favicon garde ses propres couleurs sur la case colorée ; pas de pastille blanche derrière, à revoir si certains favicons sombres se lisent mal.
- **Hors ligne ou service bloqué** (bloqueur de publicité, réseau d'entreprise) : la case retombe sur `mdi-web`, le bouton reste utilisable.

## Implémentation

À compléter pendant la réalisation.

### Vérifier à la main

1. Créer une action vers `https://github.com`, choisir « Icône du site » : l'aperçu puis la case montrent le favicon GitHub.
2. Changer l'URL vers `https://www.wikipedia.org` : l'icône suit.
3. URL vers un domaine inexistant : la case affiche `mdi-web`.
4. Passer l'action en dossier : l'icône redevient celle d'un dossier ; « Icône du site » n'est plus proposé.
5. Big picture : le favicon reste net sur une grande case.
6. Mode invité : même parcours, la grille rechargée garde le choix.
