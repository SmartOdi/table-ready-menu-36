# Plan — Recommandations : performance, visuel et fonctionnalités

## 1. Bug prioritaire : hydration mismatch sur le nom du restaurant

**Problème constaté**
Le serveur rend `"Restaurant"` (valeur par défaut) alors que le client rend `"Mon Restaurant"` après chargement. Cela vient de `BrandProvider` qui utilise `useQuery(restaurantQuery)` : le cache n'est pas garanti synchrone côté serveur, donc le SSR et le client voient deux états.

**Correction proposée**
- Transformer `BrandProvider` pour accepter une prop `initialData` (ou un contexte de route) alimentée par le `loader`.
- Utiliser `useSuspenseQuery` dans `BrandProvider` et `MenuExperience` pour que le rendu attende les données déjà préchargées.
- Vérifier que `src/routes/index.tsx` et `src/routes/t.$table.tsx` passent bien le restaurant au fournisseur.
- Valider avec `bunx tsgo --noEmit` et une passe Playwright sur `/` et `/t/A1`.

## 2. Performance — aller plus loin que le plan actuel

**Ce qu'on va faire**
- Convertir les images hébergées sur `i.ibb.co` en WebP/AVIF si possible, ou ajouter un proxy d'image côté serveur avec allow-list stricte.
- Précharger l'image LCP (la première photo de plat visible) via `<link rel="preload" as="image" fetchpriority="high">` dans le `head()` de `/t/$table` et `/`.
- Ajouter des dimensions explicites `width`/`height` sur toutes les images de la carte pour éviter les sauts de mise en page.
- Mesurer le temps d'affichage de la première carte avec Playwright avant/après.

**Ce qu'on ne fera pas**
- On ne migrera pas les images dans un autre hébergeur payant sans ton accord.

## 3. Visuel et animations — polish du menu

**Ce qu'on va faire**
- Ajouter une transition douce à l'ouverture du panier (glissement depuis le bas sur mobile, fade sur desktop).
- Animer l'apparition des cartes de plats au chargement (stagger léger, sans coût de perf).
- Améliorer le feedback tactile du compteur intégré : petit scale au clic.
- Harmoniser les tailles de police et les espacements dans le panier pour gagner en lisibilité.
- Vérifier que l'effet Liquid Glass reste visible et ne soit pas noyé par les images.

**Ce qu'on ne fera pas**
- Pas d'effet 3D, WebGL ou vidéo de fond : on garde du CSS pur.

## 4. Fonctionnalités métier pour démarcher

**Ce qu'on va ajouter**
- Champ "Note" déjà présent : on le rend plus visible et on l'affiche dans le dashboard cuisine.
- Bouton "Appeler le serveur" dans le panier / en bas du menu : envoie une notification discrète au staff sans commande.
- Lien de partage de l'addition : génère une URL publique `/t/A1/recap` montrant le total et les plats commandés, utile pour payer à plusieurs.
- Badge "Nouveau" / "Signature" déjà en place : on l'améliore visuellement.

**Ce qu'on ne fera pas**
- Pas de paiement en ligne ni d'intégration wallet dans cette itération.

## Détails techniques

- `src/components/brand.tsx` : ajouter `initialData` / passer au contexte.
- `src/components/menu-experience.tsx` : `useSuspenseQuery` pour catégories et menu.
- `src/routes/index.tsx` et `src/routes/t.$table.tsx` : alimenter `BrandProvider` depuis le loader.
- `src/routes/__root.tsx` ou routes feuilles : `preload` de l'image LCP.
- `src/lib/data.ts` : conserver les `select` explicites et le `staleTime`.
- Tests : `bunx tsgo --noEmit`, Playwright mobile/desktop, vérification console sans erreur de hydration.

## Validation

- Plus d'erreur de hydration sur `/` et `/t/A1`.
- Première carte affichée plus tôt (mesure Playwright).
- Panier fluide, feedback tactile visible.
- Dashboard cuisine affiche les notes clients et les appels serveur.
