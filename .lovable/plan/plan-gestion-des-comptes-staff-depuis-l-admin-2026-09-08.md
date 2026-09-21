# Plan — Gestion des comptes staff depuis l'admin

## Réponses à tes questions (déjà en place, rien à changer)

- **Nombre de tables** : oui, tu ajoutes ou supprimes les tables toi-même dans `/admin`, section Tables. Chaque table a son numéro (ex: A1, B3) et son QR code téléchargeable. Pour un nouveau restaurant, tu adaptes la liste à sa salle.
- **`/auth`** : oui, c'est la page de connexion (et de création de compte) du personnel. `/dashboard` est l'écran cuisine/caisse, accessible uniquement une fois connecté.
- **Premier compte = admin** : aujourd'hui le premier compte créé sur `/auth` devient admin automatiquement. Mais il n'y a pas encore d'écran pour transformer les comptes suivants en staff — c'est ce que ce plan ajoute.

## Ce que j'ajoute

**Section « Équipe » dans `/admin`** (visible uniquement par l'admin) :

1. Un membre du personnel crée son compte tout seul sur `/auth` (e-mail + mot de passe), comme aujourd'hui.
2. Dans `/admin` → Équipe, tu vois la liste des comptes créés (e-mail, rôle actuel).
3. Pour chaque compte, deux actions :
   - **Attribuer le rôle « staff »** (ou « admin ») en un clic.
   - **Retirer un rôle** si quelqu'un quitte l'équipe.
4. Un compte sans rôle peut se connecter mais n'a accès à rien (ni dashboard, ni admin) : l'écran lui dit d'attendre que l'admin l'autorise.

Réutilise la fonction serveur `grantStaffRole` existante et ajoute `listTeamMembers` + `revokeRole` (réservées aux admins).

## Détails techniques

- `src/lib/staff.functions.ts` : ajout de `listTeamMembers` (liste e-mails + rôles via client privilégié) et `revokeRole` (suppression d'un rôle, interdiction de retirer le dernier admin).
- `src/routes/_authenticated/admin.tsx` : nouvelle section Équipe (liste, boutons Attribuer/Retirer).
- `src/routes/_authenticated/dashboard.tsx` : si connecté sans rôle, afficher un message « En attente d'autorisation par l'administrateur » au lieu des commandes.
- Vérification : typecheck + aperçu.
