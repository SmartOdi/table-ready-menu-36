# Remix of Table Ready

NOM DU PROJET : Système de commande par QR Code pour restaurants (Version Démo / Portfolio)

CONTEXTE : Je crée un prototype configurable pour démarcher des restaurateurs à Cotonou. Ce n'est pas un SaaS multi-tenant complexe. C'est un template unique et modulable. Pour chaque nouveau client, je dupliquerai ce projet et changerai simplement le nom, le logo, les couleurs et le menu via une interface admin simple.


1. ARCHITECTURE TECHNIQUE

Frontend : React + TypeScript (avec Tailwind CSS).

Backend & Base de données : Supabase (PostgreSQL).

Authentification : Seulement pour les rôles "Caissier" et "Cuisinier" (pas besoin d'auth pour les clients).

2. BASE DE DONNÉES (Tables nécessaires)

restaurants : Une seule ligne pour ce prototype. Contient nom, logo_url, couleur_principale (hex), couleur_secondaire, telephone, adresse.

tables : Liste des tables. Colonnes : id, numero_table (ex: "A1", "A2"), qr_code_url (chemin généré).

categories : Ex: "Entrées", "Plats", "Boissons", "Desserts".

menu_items : Chaque plat. Colonnes : nom, description, prix (nombre), image_url, categorie_id (clé étrangère), disponible (boolean).

orders : Une commande passée. Colonnes : id, table_id (clé étrangère), statut (enum: 'recu', 'en_preparation', 'servi'), created_at, total.

order_items : Ligne de commande. Colonnes : order_id (clé étrangère), menu_item_id (clé étrangère), quantite, prix_unitaire.

3. FLUX UTILISATEUR (LE CŒUR DE L'APP)

A) Côté Client (sans connexion) :

Le client scanne le QR code posé sur sa table.

Il arrive sur une page d'accueil avec le nom et le logo du restaurant (variables dynamiques).

Il parcourt le menu par catégories (avec photos, descriptions, prix).

Il ajoute des plats dans un panier.

Il valide sa commande. Le système enregistre automatiquement le numero_table (transmis via l'URL/QR code) dans la commande.

Un message de confirmation s'affiche. Aucun paiement en ligne pour cette version (juste un envoi de commande).

B) Côté Restaurant (Dashboard sécurisé par mot de passe) :

Le cuisinier ou le caissier se connecte sur /dashboard.

Il voit une liste en temps réel des commandes reçues, triées par statut (recu > en_preparation > servi).

Il peut cliquer sur "Préparer" (passe en en_preparation) puis "Servir" (passe en servi).

Quand il clique sur "Servir", le système génère automatiquement une facture récapitulative (avec le détail des plats, le total, le numéro de table) qui s'affiche à l'écran (ou est imprimable).

4. INTERFACE ADMIN (POUR MOI, LE CONSULTANT)

Une page /admin protégée par un super-mot-de-passe.

Dans cette page, je peux modifier en 2 clics :

Le nom du resto.

Le logo (upload d'image).

La couleur primaire (le thème visuel change partout).

Ajouter / Modifier / Supprimer des plats et des catégories.

Ajouter / Modifier les numéros de table et regénérer les QR codes.

5. PRIORITÉ ABSOLUE : LA SIMPLICITÉ

L'interface client doit être ultra-rapide et responsive (mobile-first, car les clients scannent avec leur téléphone).

Le dashboard cuisine/caisse doit être clair et épuré (pas de fioritures, que l'essentiel pour ne pas perdre le restaurateur).

Le code doit être propre pour que je puisse dupliquer ce projet facilement pour chaque nouveau restaurant sans casser l'existant.
Tu penses que tu peux le faire ?? si oui je t'envoie le kit branding pour le visuel.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://table-ready-menu-36.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ad824928-fb2c-4f4b-9de6-43a9e30a2e09).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
