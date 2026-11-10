# Feature 15 — Écran de bienvenue

| | |
| --- | --- |
| **Statut** | Livré |
| **Personne active** | OverAngelix |
| **Périmètre** | `client/` |
| **Dépend de** | [09 — Comptes utilisateur](09-comptes-base-de-donnees.md), [11 — Menu « Mon compte »](11-menu-compte-reglages.md), [12 — Internationalisation](12-i18n.md) |

## Explication de la feature

Un tout petit tutoriel pour découvrir l'application, dans l'esprit des écrans d'accueil en quelques slides de beaucoup de sites. Rien de lourd : une fenêtre, trois slides, un bouton pour passer.

1. **Bienvenue** : la grille de boutons, un clic ouvre le site dans un nouvel onglet.
2. **Dossiers** : un dossier ouvre une autre grille, sa première case ramène en arrière.
3. **À vous de jouer** : la grille se compose depuis « Mon compte », Configuration de la grille ; la touche B passe en big picture (F jusqu'à la feature 19), ⌘F ou Ctrl F cherche un bouton.

- La fenêtre s'ouvre **après la connexion**, une seule fois **par appareil**.
- **Passer**, **C'est parti** (dernière slide), Échap ou un clic à côté la ferment, et elle ne revient plus sur cet appareil.
- **Suivant** et **Précédent** pour avancer ou reculer, des points pour savoir où l'on en est ; sur téléphone, on peut aussi balayer.

## TODO

### Étape 1 — Mémoire de l'écran (client)

- [x] `utils/rememberedWelcome.ts` : lecture et écriture dans le navigateur (`localStorage`, clé `sdpc.welcomeSeen`)
- [x] Tests client : pas vu au départ, vu une fois retenu, valeur inconnue, stockage refusé

### Étape 2 — Fenêtre de bienvenue (client)

- [x] `components/WelcomeDialog.vue` : trois slides (`v-window`), points, Passer, Précédent, Suivant, C'est parti
- [x] `App.vue` : ouverte quand une personne est connectée et que l'écran n'a pas été vu ; retenue comme vue à la fermeture
- [x] Textes `welcome.*` dans `locales/fr.ts` et `en.ts`

### Étape 3 — Documentation

- [x] README des features : feature 15, retrait de « Plus tard »
- [x] Vérification manuelle (voir plus bas)

## Décisions

- **Retenu sur l'appareil, pas sur le compte.** Pas de colonne en base ni d'appel au serveur : une clé dans le `localStorage`, comme le big picture (feature 13). Sur un nouvel appareil ou après avoir vidé le cache du navigateur, l'écran réapparaît une fois, ce qui est acceptable pour un tutoriel. Sans stockage (navigation privée), il s'affiche une fois par ouverture de l'application.
- **Après la connexion seulement.** La page de connexion reste dépouillée ; le tutoriel parle de la grille, que l'on voit juste derrière.
- **Toute fermeture vaut « vu »** : Passer, C'est parti, Échap ou clic à côté. Un tutoriel qui revient après avoir été écarté devient vite agaçant.
- **Pas d'entrée « Revoir le tutoriel »** dans le menu pour l'instant : le contenu est court et la page de configuration explique déjà le glisser-déposer.
- **Icônes MDI, pas d'images** : rien à charger, ça suit le thème clair ou sombre.

## Implémentation

### Flux

```
Connexion (ou session reprise au chargement)
  → App.vue : readWelcomeSeen() faux → WelcomeDialog ouverte
  → Passer / C'est parti / Échap / clic à côté → writeWelcomeSeen() → plus jamais sur cet appareil
```

### Fichiers

| Fichier | Rôle |
| --- | --- |
| `client/src/utils/rememberedWelcome.ts` | Lecture et écriture de l'écran vu dans le navigateur |
| `client/src/components/WelcomeDialog.vue` | Les trois slides |
| `client/src/App.vue` | Ouverture après connexion, mémorisation à la fermeture |
| `client/src/locales/fr.ts`, `en.ts` | Textes |
| `client/test/utils/rememberedWelcome.test.ts` | Tests |

### Vérifier à la main

```bash
cd server && npm run dev
cd client && npm run dev -- --host
```

1. Supprimer la clé `sdpc.welcomeSeen` (outils du navigateur, Stockage local), se connecter : la fenêtre s'ouvre sur la première slide.
2. Suivant, Précédent, points, balayage sur téléphone : on passe d'une slide à l'autre ; la dernière propose « C'est parti ».
3. Fermer (Passer, C'est parti, Échap ou clic à côté), recharger la page, se déconnecter et se reconnecter : la fenêtre ne revient plus.
4. Fenêtre ouverte, taper B : le big picture ne bascule pas.
5. Thème sombre, téléphone portrait et paysage, langue anglaise.
