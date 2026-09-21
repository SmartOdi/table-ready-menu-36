# 🍽️ Commande à Table — Application de commande par QR Code pour restaurants

Application web complète qui permet aux clients d'un restaurant de consulter la carte et de commander
depuis leur téléphone en scannant un QR Code posé sur la table. Les commandes arrivent instantanément
sur l'écran de la cuisine et sur celui de la caisse, sans rechargement de page.

---

## ✨ Les quatre espaces de l'application

### 📱 Espace Client — `/t/:table`
Accessible en scannant le QR Code de la table, sans installation ni création de compte.
- Carte du restaurant organisée par catégories, avec photos, descriptions et prix
- Recherche et filtres (plats disponibles, badges « Nouveau », « Populaire », « Végétarien »…)
- Panier interactif avec quantités, notes par plat et total en direct
- Envoi de la commande en un geste, suivi de son statut en temps réel
- Bouton « Appeler un serveur »

### 👨‍🍳 Écran Cuisine (KDS) — `/cuisine`
Pensé pour un écran fixe en cuisine, lisible à distance.
- Affichage temps réel des nouvelles commandes, regroupées par table
- Changement de statut en un clic : *Reçue* → *En préparation* → *Prête* → *Servie*
- Alerte sonore à chaque nouvelle commande
- Accès rapide sécurisé par code PIN

### 🧾 Écran Caisse — `/caisse`
- Liste des commandes en cours et de celles à encaisser
- Chiffre d'affaires du jour et nombre de couverts
- Historique consultable par date
- Impression de tickets et de factures

### ⚙️ Gérance & Administration — `/gerance` et `/admin`
- Gestion complète du menu : catégories, plats, photos, prix, badges, ruptures de stock
- Import de la carte en masse via fichier CSV
- Gestion des tables et génération/téléchargement des QR Codes
- Gestion des membres du personnel, des rôles et des codes PIN d'accès
- Tableau de bord des ventes

---

## 🛠️ Stack technique

| Domaine | Technologie |
| --- | --- |
| Framework | TanStack Start (React 19, SSR + server functions) |
| Langage | TypeScript |
| Build | Vite 7 |
| Styles | Tailwind CSS v4 — thème sombre « glassmorphism » sur mesure |
| Composants | Radix UI / shadcn |
| Données & temps réel | PostgreSQL (Supabase) avec Row Level Security et abonnements temps réel |
| Authentification | Supabase Auth (email/mot de passe + rôles) |

Trois palettes distinctes structurent l'interface : ambre/orange pour l'espace client,
bleu/violet pour l'administration, émeraude pour la cuisine.

---

## 🔐 Sécurité

- Row Level Security activée sur l'ensemble des tables, avec des règles par rôle
- Les rôles utilisateurs sont stockés dans une table dédiée (jamais sur le profil), afin d'éviter
  toute élévation de privilèges
- Les codes PIN du personnel sont hachés côté serveur avec un sel secret (`PIN_PEPPER`)
- Le tout premier compte administrateur se crée avec un code d'installation (`ADMIN_SETUP_CODE`)
- Aucun secret n'est présent dans le dépôt : `.env` est ignoré par Git

---

## 🚀 Démarrage en local

Prérequis : Node.js 20+ et npm.

```sh
git clone <url-du-depot>
cd <nom-du-depot>
npm install
cp .env.example .env   # puis renseignez vos valeurs
npm run dev
```

L'application est alors disponible sur `http://localhost:8080`.

### Variables d'environnement

Côté client (`.env`) :

| Variable | Rôle |
| --- | --- |
| `VITE_SUPABASE_URL` | URL de l'instance de base de données |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publique (conçue pour être exposée) |
| `VITE_SUPABASE_PROJECT_ID` | Identifiant du projet |

Côté serveur (à définir dans les variables d'environnement de l'hébergeur, **jamais** dans le dépôt) :

| Variable | Rôle |
| --- | --- |
| `ADMIN_SETUP_CODE` | Code permettant au premier compte de devenir administrateur |
| `PIN_PEPPER` | Sel secret utilisé pour le hachage des codes PIN du personnel |

---

## 📜 Scripts disponibles

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement avec rechargement à chaud |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualisation du build de production |
| `npm run lint` | Analyse statique du code |
| `npm run format` | Formatage automatique |

---

## 🗺️ Premiers pas après l'installation

1. Rendez-vous sur `/auth` et créez votre compte en saisissant le code d'installation administrateur.
2. Dans `/gerance`, créez vos catégories puis vos plats.
3. Créez vos tables et téléchargez leurs QR Codes.
4. Définissez les codes PIN d'accès de la cuisine et de la caisse.
5. Imprimez les QR Codes, posez-les sur les tables — le service peut commencer.

---

## 📄 Licence

Projet privé. Tous droits réservés.
