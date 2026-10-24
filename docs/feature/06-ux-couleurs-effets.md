# Feature 06 — UX : couleurs et effets « juicy »

| | |
| --- | --- |
| **Statut** | En cours |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` et `server/` |
| **Dépend de** | [04 — Configuration des boutons](04-configuration-boutons.md), [05 — Glisser-déposer des boutons](05-glisser-deposer.md) |

## Explication de la feature

Rendre la grille plus agréable à utiliser, comme les touches d'un vrai Stream Deck qui répondent sous le doigt :

- **Couleur des cases** : chaque bouton (action ou dossier) prend l'une des **10 couleurs** proposées dans le formulaire de configuration. On repère un raccourci à sa couleur autant qu'à son icône.
- **Effets visuels « juicy »** : les cases réagissent (survol, appui, lancement d'une action), apparaissent l'une après l'autre quand on ouvre un dossier, et le déplacement, la création et le refus d'un dépôt se voient.
- **Effets sonores** : un petit son accompagne chaque geste (lancer une action, ouvrir un dossier, revenir, créer, déplacer, supprimer, refuser). Un bouton dans la barre d'application coupe ou rétablit le son.

## TODO

- [ ] Serveur : champ `color` d'un bouton (10 valeurs, facultatif), validé à la création, à la modification et à la lecture du fichier
- [ ] Client : type `ButtonColor`, palette et couleur par défaut
- [ ] Client : sélecteur de couleur dans le formulaire (création et modification)
- [ ] Client : cases colorées dans la grille et dans la configuration
- [ ] Client : effets visuels des cases (survol, appui, lancement, apparition échelonnée, déplacement)
- [ ] Client : sons synthétisés (Web Audio, aucun fichier audio) et préférence « son » mémorisée
- [ ] Client : sons branchés sur la navigation, le lancement et la configuration
- [ ] Client : bouton son dans la barre d'application
- [ ] Respect de `prefers-reduced-motion` : aucune animation si le système le demande
- [ ] Tests serveur (validation, route) et client (formulaire, palette, sons, préférence)
- [ ] Fiche mise à jour et README du projet

## Décisions

- **Dix couleurs nommées, pas de sélecteur libre.** Une palette fixe garde une grille cohérente et lisible en thème clair comme en thème sombre. Les noms sont ceux de Vuetify (`grey`, `red`, `orange`, `amber`, `green`, `teal`, `cyan`, `blue`, `purple`, `pink`) : le serveur ne stocke que le nom, jamais un code couleur, et le rendu s'adapte au thème.
- **Le gris est la couleur par défaut.** C'est l'aspect actuel de la grille. Un bouton sans `color` (créé avant cette feature) s'affiche en gris : aucune migration du fichier de données.
- **`color` est facultatif côté serveur** (comme `url` pour un dossier) et refusé s'il n'est pas dans la liste. Le formulaire l'envoie toujours.
- **Aucun fichier audio** : les sons sont synthétisés à la volée avec l'API Web Audio (oscillateurs et enveloppes courtes). Pas de poids ajouté, pas de licence à gérer, et chaque son est décrit par des données (notes, durées), donc testable.
- **Le son démarre sur un geste de l'utilisateur** (clic, glisser) : les navigateurs interdisent l'audio automatique, le contexte audio n'est créé qu'à la première lecture.
- **Son activé par défaut, coupable en un clic** ; le choix est mémorisé dans le navigateur (`localStorage`). Le serveur n'en sait rien : pas de compte, c'est une préférence de l'appareil. Le bouton de la barre d'application est un simple interrupteur : l'écran de configuration de l'application (désactiver aussi les effets visuels, thèmes) reste dans « Plus tard » du README des features.
- **Effets visuels en CSS** (transformations et animations), sans bibliothèque. `prefers-reduced-motion: reduce` les désactive.
- **Effets sonores et visuels sur la grille et sur la configuration**, mais le lancement d'une action ne retarde jamais l'ouverture de l'onglet : l'animation joue pendant ce temps (sinon le navigateur bloquerait la fenêtre).

## Implémentation

_À compléter à la livraison._
