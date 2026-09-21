# Plan — Accélérer l'affichage des plats (puis l'effet verre)

## Le problème constaté

Aujourd'hui la page table (`/t/A1`) n'affiche rien de la carte tant que le navigateur n'a pas fini de charger le code de la page, puis d'aller chercher les plats. D'où les rectangles gris au début.

Deux causes vérifiées :

1. **Les plats sont demandés trop tard.** La route `/t/$table` n'a aucun chargement anticipé : nom du restaurant, catégories et plats sont demandés seulement après l'affichage de la page, en trois allers-retours.
2. **Les photos sont lourdes et hébergées à l'extérieur.** Chaque photo pèse 90 à 155 Ko sur `i.ibb.co`, pour 29 plats. Aucune n'a de dimensions déclarées, et aucune n'est priorisée : le navigateur ne sait pas lesquelles montrer en premier.

## Ce qu'on va faire

### 1. Charger la carte avec la page
- Ajouter un chargement anticipé sur `/t/$table` (et sur la page d'accueil) qui prépare restaurant + catégories + plats en parallèle, pour que les plats fassent partie de la page dès son arrivée.
- Ne demander que les colonnes utiles au lieu de tout récupérer, ce qui allège la réponse.
- Garder les plats en mémoire quelques minutes pour qu'un retour au menu soit instantané.

### 2. Rendre les photos plus rapides
- Déclarer les dimensions de chaque photo pour éviter que la page saute pendant le chargement.
- Charger en priorité les toutes premières photos visibles, et laisser les autres se charger à la demande pendant le défilement.
- Afficher un fond dégradé discret le temps que la photo arrive, au lieu d'un trou vide.
- Préconnecter le navigateur à l'hébergeur des photos dès l'ouverture de la page pour gagner le temps de mise en relation.

### 3. Ensuite seulement, l'effet verre
Une fois la vitesse validée, appliquer la direction **Liquid glass amber** retenue sur les cartes : coins très arrondis, bordure blanche translucide, reflet lumineux en haut, ombre profonde et halo ambré au survol, fine ligne de réfraction en bas. Ce sont uniquement des effets de style, sans image ni animation coûteuse — aucun impact sur la vitesse de chargement.

## Détails techniques

- `src/routes/t.$table.tsx` et `src/routes/index.tsx` : `loader` appelant `context.queryClient.ensureQueryData` en `Promise.all` sur `restaurantQuery`, `categoriesQuery`, `menuQuery`; ajout de `errorComponent` et `notFoundComponent`.
- `src/lib/data.ts` : `select` explicite des colonnes sur `menuQuery` et `restaurantQuery`, `staleTime` de 5 min sur les requêtes publiques.
- `src/components/menu-experience.tsx` : `width`/`height`, `decoding="async"`, `fetchPriority="high"` + `loading="eager"` sur les premières cartes, `loading="lazy"` ailleurs, placeholder de fond.
- `src/routes/__root.tsx` : `<link rel="preconnect">` vers `https://i.ibb.co`.
- `src/styles.css` : utilitaire `liquid-glass` (dégradé interne, bordure, reflet, ombre) branché sur les tokens de zone client.

## Validation
- `bunx tsgo --noEmit`.
- Mesure Playwright du temps d'apparition de la première carte avant/après.
- Contrôle visuel sur `/t/A1` en mobile et desktop.
