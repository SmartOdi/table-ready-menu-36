# Roadmap — Commande QR Code restaurant

## Design (kit branding reçu)

- [x] Thème dark glassmorphism : fond #0D0D0D–#141414, halo lumineux, cartes en verre
- [x] Accents : violet électrique (principal) + bleu cyan (secondaire)
- [x] CTA en orange vif surnaturel, coins pill, texte blanc
- [x] Icônes SVG uniquement (aucun emoji/sticker)
- [ ] Arête des cartes en verre : liseré blanc translucide (10-15 %) pour simuler le reflet
- [ ] Cohérence stricte sur toutes les sections

## Build

- [x] Base de données + stockage images + rôles
- [x] Parcours client : /t/$table, menu par catégories, panier, confirmation
- [x] Auth personnel + dashboard temps réel + facture imprimable
- [x] Admin : identité (nom, logo, couleurs), menu, catégories, tables + QR codes
- [ ] Vérification finale (build + aperçu)
- [x] Caisse : commandes du jour par défaut + historique consultable par calendrier

## Gestion du contenu

- [x] Import CSV de la carte depuis l'espace de gestion (nom, description, prix, catégorie, image, badge)
- [x] Section Équipe dans /admin : attribuer/retirer les rôles staff et admin

## Rôles gérant / cuisine / caisse

- [x] Compte gérant (e-mail du gérant, ex. gerant@restaurant.com) créé avec rôle admin + gérant
- [x] Accès par code à 6 chiffres (page /acces) pour cuisine et caisse, codes de départ à définir
- [x] Écran cuisine : commandes, « en préparation » / « prêt » / « servi », appels serveur + son de notification
- [x] Stabiliser le statut cuisine après « Commencer » malgré les actualisations automatiques
- [x] Séparer les sessions PIN cuisine et caisse dans un même navigateur
- [x] Écran caisse : suivi en lecture seule, facture après « servi », chiffre d'affaires
- [x] Espace gérant : chiffre d'affaires temps réel + gestion des codes PIN
- [x] Supprimer les comptes de test inutiles
- [x] Mot de passe oublié + page de réinitialisation pour les connexions par e-mail

## En attente du client

- [x] Carte réelle importée (29 plats, 9 catégories, photos, badges Signature)
- [ ] Nom, logo et coordonnées réels du restaurant (à remplir dans /admin)
