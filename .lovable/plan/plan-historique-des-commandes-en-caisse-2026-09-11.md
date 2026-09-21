# Plan — Historique des commandes en caisse

## Objectif
La caisse affiche uniquement les commandes de la journée par défaut, tout en permettant de consulter une journée passée depuis un calendrier.

## Modifications
- Ajouter un sélecteur « Aujourd’hui / Historique » dans l’écran caisse.
- Afficher un calendrier interactif en mode historique et charger la date choisie.
- Filtrer les commandes côté serveur selon la journée locale de Cotonou, sans charger inutilement toutes les anciennes commandes.
- Adapter le titre, le résumé financier et l’état vide à la date sélectionnée.
- Conserver les appels de tables uniquement dans la vue du jour et maintenir la facture disponible pour les commandes servies de l’historique.
- Vérifier le fonctionnement et l’affichage sur ordinateur et mobile.

## Détails techniques
- Étendre la fonction sécurisée de caisse avec une date optionnelle validée au format `AAAA-MM-JJ`.
- Construire une plage horaire locale `[début, fin[` pour interroger les commandes et calculer les chiffres de cette journée.
- Utiliser le calendrier Shadcn existant dans un popover, avec `pointer-events-auto`.
