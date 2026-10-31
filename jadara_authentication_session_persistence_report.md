# Rapport Technique — Authentification et Persistance de Session (7 Jours) — JADARA

---

## 1. Contexte & Objectif Principal

Le projet **Jadara** utilise une architecture découplée :
- **Backend** : Node.js / Express / Prisma / PostgreSQL / MinIO / JWT avec cookies `HttpOnly`.
- **Frontend** : React 19, TypeScript, TanStack Router, TanStack Query, Axios, TailwindCSS v4.

### Politique d'Authentification du Backend :
- **Access Token** : Durée de vie courte de **15 minutes** (cookie `accessToken`, `path: "/"`, `httpOnly: true`).
- **Refresh Token** : Durée de vie de **7 jours** (cookie `refreshToken`, `path: "/v1/auth"`, `httpOnly: true`, haché en base de données).
- **Rotation de Jeton** : À chaque appel sur `POST /v1/auth/refresh-token`, l'ancien jeton de rafraîchissement est révoqué et un nouveau jeton de 7 jours est émis.
- **Déconnexion** : Révoque tous les jetons de rafraîchissement en base et supprime les cookies.

**Objectif** : Permettre au frontend de maintenir la session de l'utilisateur jusqu'à 7 jours de manière fluide et sécurisée sans stocker aucun jeton dans le `localStorage` ou `sessionStorage`, tout en gérant l'expiration des jetons d'accès, la concurrence des requêtes et les redirections d'itinéraires.

---

## 2. Problèmes Identifiés (Causes Racines)

Avant l'intervention, plusieurs défauts empêchaient la persistance et le bon fonctionnement de la session :

1. **URL de l'API erronée par défaut (`VITE_API_URL`)** :
   Dans `client.ts`, l'absence de fichier `.env` faisait pointer l'API sur `http://localhost:3000` (port du frontend Vite) au lieu du backend sur le port `3001`. Les requêtes API échouaient systématiquement en 404/500.

2. **Interception abusive des erreurs d'authentification (`/auth/login`)** :
   L'intercepteur Axios interceptait **toutes** les erreurs 401 sans vérifier l'URL d'origine. Si un utilisateur saisissait un mauvais mot de passe sur `/auth/login`, l'intercepteur tentait de rafraîchir un jeton inexistant via `/auth/refresh-token`, masquant le message d'erreur réel ("Invalid email or password").

3. **Risque de boucle infinie et absence de verrou de concurrence** :
   - Les requêtes en attente dans la file d'attente ne recevaient pas le drapeau `_retry = true`. En cas de nouvel échec, elles redéclenchaient un rafraîchissement.
   - La requête de rafraîchissement utilisait la même instance Axios `apiClient` avec intercepteur, risquant une récursion infinie.

4. **Incompatibilité de validation Zod/Express sur le Refresh Token** :
   Le backend valide le corps de `POST /v1/auth/refresh-token` avec `zodValidate(refreshTokenSchema)`. Un appel sans corps (`axios.post(url)`) laissait `req.body` à `undefined`, ce qui déclenchait une erreur `422 Unprocessable Entity` ("Validation failed") au lieu d'exécuter la vérification du cookie.

5. **Conservation des données sensibles en cache lors de la déconnexion** :
   Lors de la déconnexion ou de l'invalidation de session, le cache mémoire de `@tanstack/react-query` n'était pas vidé, risquant d'exposer des données de l'utilisateur précédent.

6. **Perte de l'URL cible lors de la redirection** :
   Si un utilisateur non authentifié tentait d'accéder à une page protégée (ex. `/dashboard/projects/1/edit`), il était redirigé vers `/login` sans paramètre de retour. De plus, un utilisateur déjà connecté visitant `/login` n'était pas redirigé automatiquement.

---

## 3. Modifications Réalisées

### A. Client Axios et Intercepteur (`frontend/src/api/client.ts`)
- **Fallback URL** : Correction du port de fallback vers `http://localhost:3001`.
- **Client dédié sans intercepteur (`refreshClient`)** : Création d'une instance Axios isolée pour exécuter `POST /v1/auth/refresh-token` sans risque de boucle récursive.
- **Verrou de concurrence par promesse unique (`refreshPromise`)** : Si 5 requêtes API simultanées reçoivent une 401, une seule requête de rafraîchissement est envoyée au serveur. Les 4 autres attendent la même promesse.
- **Envoi explicite du corps `{}`** : Envoi de `{}` pour satisfaire `express.json()` et `zodValidate`.
- **Exclusion des endpoints d'authentification** : Les routes `/auth/login`, `/auth/register` et `/auth/refresh-token` sont ignorées par le mécanisme de rafraîchissement automatique.
- **Propagation de l'erreur d'origine** : En cas d'échec du rafraîchissement, l'erreur 401 initiale de la requête est restituée au composant appelant.
- **Prise en charge de l'annulation** : Les requêtes annulées (`axios.isCancel`) sont ignorées sans déclencher de rafraîchissement.
- **Sécurité SSR** : Protection des accès à l'objet `window`.

### B. Gestion d'État de Session (`frontend/src/context/AuthContext.tsx`)
- **Dédoublonnage au montage (React StrictMode)** : Partage de la promesse `initialProfilePromise` pour éviter les doubles requêtes réseau vers `/v1/users/me/profile`.
- **Vidage du cache React Query** : Appel de `queryClient.clear()` lors du `logout` et lors de la réception de l'événement `"auth-refresh-failed"`.
- **Gestion des pannes réseau** : Distinction entre coupure réseau (`!error.response`) et révocation réelle de session (401), évitant d'effacer la session à tort en cas de brève interruption de connexion.
- **Ajout de la fonction `refreshUser`** : Permet de re-synchroniser le profil utilisateur après une modification sans recharger la page.

### C. Redirections et Routes Protégées
- **`LoginPage.tsx`** :
  - Redirection automatique des utilisateurs déjà connectés vers leur tableau de bord.
  - Lecture et validation sécurisée du paramètre d'URL `redirect` (chemins relatifs internes uniquement).
- **`routes/login.tsx`** : Ajout de `validateSearch` avec typage strict TanStack Router pour `redirect`.
- **`routes/dashboard.tsx`**, **`routes/admin.tsx`**, **`routes/reviewer.tsx`**, **`routes/company.tsx`** :
  - Attente de la fin de l'initialisation (`isLoading === false`) avant toute décision de redirection.
  - Transmission du chemin en cours (`search: { redirect: location.pathname }`) vers la page `/login`.

### D. Configuration d'Environnement (`frontend/.env`)
- Création du fichier `.env` avec `VITE_API_URL=http://localhost:3001`.

---

## 4. Tests et Validations Effectués

1. **Compilation TypeScript (`npx tsc --noEmit`)** :
   - **Résultat** : Code de sortie 0 (0 erreur de typage).
2. **Build de Production Vite / Nitro (`npm run build`)** :
   - **Résultat** : Succès complet en 1.57s.
3. **Connectivité Backend (`http://localhost:3001/health`)** :
   - **Résultat** : Réponse `status: ok`, base de données connectée.
4. **Validation de l'API Backend via `curl`** :
   - `POST /v1/auth/login` avec identifiants erronés : Retourne `401 Unauthorized` ("Invalid email or password").
   - `POST /v1/auth/refresh-token` avec `{}` : Retourne `401 Unauthorized` ("Refresh token required") et valide la conformité du schéma Zod.
5. **Suite de Tests Automatisés Dédiée (`scratch-test.ts`)** :
   - [x] **Test 1** : Configurations `withCredentials: true` et préfixe `/v1` validées.
   - [x] **Test 2** : Verrou de concurrence validé (5 appels simultanés = exactement 1 requête réseau de rafraîchissement).
   - [x] **Test 3** : Intercepteur et réexécution automatique validés (3 requêtes 401 simultanées = 1 seul rafraîchissement + 3 requêtes rejouées avec succès).
   - [x] **Test 4** : Exclusion de `/auth/login` validée (erreur transmise immédiatement sans tentative de rafraîchissement).
   - [x] **Test 5** : Échec du rafraîchissement validé (émission de l'événement et propagation de l'erreur d'origine).
   - [x] **Test 6** : Requêtes annulées validées (rejet propre sans rafraîchissement).
   - [x] **Sécurité** : Aucun jeton n'est stocké dans `localStorage` ou `sessionStorage`.

---

## 5. Guide de Vérification Manuelle

Pour tester le comportement dans le navigateur :

1. Lancer le frontend :
   ```powershell
   cd d:\jadara\frontend
   npm run dev
   ```
2. Ouvrir les DevTools (F12) -> Onglet **Application** -> **Cookies** (`http://localhost:3001` ou `localhost:3000`).
3. Se connecter sur `/login` :
   - Deux cookies sont déposés : `accessToken` (15 min, `Path: /`) et `refreshToken` (7 jours, `Path: /v1/auth`).
4. Recharger la page : La session est restaurée instantanément sans redirection.
5. **Simuler l'expiration de l'Access Token (15 min)** :
   - Dans DevTools, supprimer uniquement le cookie `accessToken` (laisser `refreshToken`).
   - Cliquer sur un lien ou recharger la page.
   - Dans l'onglet **Réseau**, observer la séquence :
     1. `GET /v1/users/me/profile` renvoie 401.
     2. L'intercepteur envoie automatiquement `POST /v1/auth/refresh-token`.
     3. Le serveur renvoie de nouveaux cookies.
     4. `GET /v1/users/me/profile` est rejoué automatiquement et réussit.
     5. L'utilisateur reste connecté sans aucune interruption.
6. Tester un mauvais mot de passe : Le message d'erreur s'affiche sans délai et aucun appel à `/auth/refresh-token` n'est déclenché.
7. Déconnexion : Vérifier que les cookies sont révoqués et que le cache des requêtes est nettoyé.
