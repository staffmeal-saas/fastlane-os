# Fastlane OS — Plateforme de Pilotage Client & Back-Office

Fastlane OS est une application web premium de type SaaS B2B permettant la gestion de campagnes, d'actions, de crédits (wallet) et de livrables entre une agence et ses clients. 

Le stack technique est composé de :
- **Frontend** : React 19, Vite, Vanilla CSS (design system "Fastlane")
- **Backend / BaaS** : Nhost (self-hosted) via Docker Compose
- **Base de Données** : PostgreSQL (14 tables)
- **API** : Hasura GraphQL Engine

---

## 🛠 Prérequis

Pour collaborer et lancer le projet en local, vous avez besoin de :
- **Docker** et **Docker Compose**
- **Node.js** (v18+) et **npm**
- **Git**

---

## 🚀 Installation locale (Onboarding Collaborateurs)

1. **Forkez** ce dépôt sur votre propre compte GitHub (bouton "Fork" en haut à droite).
2. **Clonez** votre fork localement :
   ```bash
   git clone https://github.com/VOTRE_USERNAME/fastlane-os.git
   cd fastlane-os
   ```
3. **Lancez le script d'initialisation complet** :
   ```bash
   bash setup.sh
   ```
   Ce script s'occupe de :
   - Lancer les containers Nhost en arrière-plan (`docker-compose up -d`).
   - Attendre que Hasura soit prêt.
   - Initialiser la structure de la base de données PostgreSQL incluse dans `initdb.d/0001-fastlane-schema.sql`.
   - Appliquer l'API GraphQL, les relations et les permissions CRUD exportées dans `hasura_metadata.json`.
   - Installer les dépendances NPM du dossier `frontend/`.

4. **Démarrez le serveur Frontend (Vite)** :
   ```bash
   cd frontend
   npm run dev
   ```
   L'application sera accessible sur `http://localhost:5173`.

---

## 🔐 Identifiants par défaut

Le projet intègre des rôles via la sécurité Nhost Auth locale. Un Super Admin est déjà configuré dans la logique d'authentification.
- **Login Admin** : `admin@fastlane.io`
- **Mot de passe** : `fastlane2026`

Connectez-vous pour commencer à :
1. Envoyer des invitations et créer des Clients (Wizard d'Onboarding).
2. Ajouter des campagnes et des actions spécifiques.

---

## 🤝 Comment collaborer et configurer des PR (Pull Requests) ?

1. Assurez-vous d'être à jour avec la branche principale (`main`).
2. Créez une branche pour votre fonctionnalité / bug correction :
   ```bash
   git checkout -b feature/ma-nouvelle-fonctionnalite
   ```
3. Développez et testez en local avec le serveur Vite. Testez bien que vos requêtes GraphQL utilisent `nhost.graphql.request`.
4. Effectuez vos commits et poussez votre branche vers votre fork :
   ```bash
   git add .
   git commit -m "✨ feat: ajout de la page de facturation"
   git push origin feature/ma-nouvelle-fonctionnalite
   ```
5. Depuis GitHub, ouvrez une **Pull Request** vers la branche `main` de ce dépôt (staffmeal-saas/fastlane-os).

### Modifier l'API et la BDD
Toute modification ou **nouvelle table de base de données** doit être reflétée dans :
- Le schéma SQL : `/initdb.d/0001-fastlane-schema.sql` (ou créez un nouveau fichier `0002-...sql`).
- **N'oubliez pas d'exporter à nouveau les metadata Hasura** si vous y avez ajouté des permissions ou relations via la console Hasura (`http://localhost:8080`) :
   ```bash
   curl -d '{"type": "export_metadata", "args": {}}' -H 'X-Hasura-Admin-Secret: fastlane-admin-secret-2026' http://localhost:8080/v1/metadata > hasura_metadata.json
   ```

---

Bon code sur Fastlane OS ! 🏁
