# Feature 14 — Déploiement avec GitHub Actions

| | |
| --- | --- |
| **Statut** | En cours |
| **Personne active** | OverAngelix |
| **Périmètre** | racine (`.github/`, `DEPLOY.md`), `client/` et `server/` (Dockerfiles) |
| **Dépend de** | [09 — Comptes et base SQLite](09-comptes-base-de-donnees.md) |

## Explication de la feature

SDPC se déploie sur le VPS OVH de la même façon qu'awesome-navigation : deux images Docker (client, serveur) construites et poussées par GitHub Actions dans un registre privé, puis tirées par le cluster K3s du VPS (Keel) derrière Traefik.

- **Deux images** : `sdpc-client` (nginx + build Vue) et `sdpc-server` (API Node + SQLite).
- **Deux workflows**, déclenchés à chaque push sur `main` qui touche `client/**` ou `server/**` (ou à la main, `workflow_dispatch`). Contrairement à awesome-navigation, ils **vérifient avant de construire** : lint, type-check et tests ; une image n'est poussée que si tout passe.
- **L'image client ne connaît aucun serveur** : elle appelle `/api` en relatif, et Traefik route `/api` vers le serveur selon le domaine. nginx répond 502 sur `/api/` si la route manque.
- **La base SQLite vit sur le VPS**, dans un dossier `hostPath` monté sur `/app/data`.

## TODO

### Étape 1 — Images Docker

- [x] `server/Dockerfile` : build TypeScript puis image d'exécution (`npm ci --omit=dev`), `NODE_ENV=production`, port 4000, `DATABASE_FILE=/app/data/sdpc.db`
- [x] `client/docker/Dockerfile` et `nginx.conf` : build Vite puis nginx (repli sur `index.html`, cache des ressources, 502 sur `/api/`)
- [x] `.dockerignore` du client et du serveur (contexte de build = le dossier lui-même, un `package-lock.json` par dossier)

### Étape 2 — Workflows GitHub Actions

- [x] `.github/workflows/deploy-server.yml` : type-check, tests, build, push
- [x] `.github/workflows/deploy-client.yml` : lint, type-check, tests, build, push
- [ ] Secrets du dépôt : `REGISTRY_URL`, `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`
- [ ] Premier déclenchement manuel des deux workflows, images visibles dans le registre

### Étape 3 — Serveur derrière Traefik

- [ ] Express derrière un proxy : `trust proxy` pilotée par une variable d'environnement, sinon `req.ip` (limiteur de tentatives de connexion) vaut toujours l'adresse de Traefik
- [x] Sur le VPS (manifests hors dépôt) : `sdpc-client/` et `sdpc-server/` dans `/home/deploy/apps-k3s/` (`deployment`, `service`, `ingressroute`, `middleware`), annotations Keel, sonde sur `/api/health`, `data/` en `hostPath`, `kubectl apply -f .`
- [x] Route `/api` du serveur sur le même domaine que le client, sans `stripPrefix`
- [x] Domaine et HTTPS (le cookie de session est `Secure` en production)

### Étape 4 — Documentation

- [x] `docs/deploy/` : guide générique (rôle de chaque fichier, contrôles) et modèles réutilisables du client et du serveur
- [x] `DEPLOY.md` : infrastructure, images, dossiers sur le VPS, sauvegarde, commandes utiles
- [ ] `README.md`, `CLAUDE.md` : renvoi vers `DEPLOY.md`
- [ ] Vérification manuelle (voir plus bas)

## Décisions

- **Calqué sur awesome-navigation** (deux workflows, deux images, registre privé, Traefik, Keel) pour garder une seule façon de déployer.
- **Tests avant l'image.** Le workflow échoue avant `docker build` si le lint, le type-check ou les tests échouent.
- **Contexte de build par dossier** (`client/`, `server/`) : pas d'espace de travail partagé, chaque dossier a son `package-lock.json` (`npm ci`).
- **Uniquement `main`**, pas de `develop` (il n'existe pas ici). Un seul tag, `latest`, comme awesome-navigation : Keel suit ce tag.
- **Registre en secret** (`REGISTRY_URL`) plutôt qu'écrit en dur dans les workflows : le dépôt est public, l'adresse du registre n'apparaît nulle part (ni workflows, ni documentation).
- **K3s et Keel, pas Docker Compose ni Watchtower** : c'est ce qu'utilise désormais le VPS (dossier `apps-k3s/`, un jeu de manifests par application). Comme pour awesome-navigation, les manifests vivent sur le VPS et pas dans le dépôt ; `DEPLOY.md` liste ce qu'ils doivent contenir.
- **Une seule réplique du serveur** (`Recreate`) : la base SQLite est sur disque local.

## Vérification manuelle

1. Pousser un changement dans `server/` : le workflow serveur passe, `sdpc-server:latest` apparaît dans le registre.
2. Idem dans `client/`.
3. Un test qui échoue empêche le push de l'image.
4. Sur le VPS, après le passage de Keel : `GET /api/health` répond `{"status":"ok"}`, la création de compte et la connexion fonctionnent en HTTPS, la base survit à un redémarrage du conteneur.
