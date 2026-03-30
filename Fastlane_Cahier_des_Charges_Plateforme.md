# FASTLANE — Cahier des charges plateforme client & back-office

## FASTLANE

Cahier des charges — Plateforme client, crédits, campagnes et back-office

Document de cadrage fonctionnel pour la conception d’une plateforme web centralisant le suivi client, les campagnes, les actions, les documents stratégiques et le portefeuille de crédits.

## Périmètre Espace Super Admin + Espace Client (Sprint / Long Terme)

**Objectif** Créer un OS de pilotage de la relation client et du delivery Fastlane

**Livrables couverts** Dashboard, crédits, campagnes, actions, PDF stratégiques, back-office

**Vision produit** Une tour de contrôle unique entre Fastlane et ses clients

Source de cadrage : ce document s’appuie sur le blueprint opérationnel Fastlane V2 fourni par le porteur de projet, notamment sur les modules déjà envisagés : Dashboard, Sprint actif, Actions, Crédits et espace de valorisation des outils Fastlane.

Finalité du produit : permettre à Fastlane d’industrialiser sa relation client, de rendre la valeur produite visible, d’expliquer clairement la consommation de crédits et de fluidifier l’upsell par recharges ou upgrades.

---

## 1. Contexte du projet

Fastlane opère comme une agence orientée Event-Led Growth, avec un modèle mêlant accompagnement stratégique, delivery opérationnel, campagnes multicanales et logique de consommation par crédits. La plateforme doit devenir l’interface centrale entre Fastlane et ses clients.

Elle doit répondre à deux besoins complémentaires : offrir au client une expérience premium, lisible et rassurante ; et fournir à l’équipe Fastlane un back-office robuste pour gérer les comptes, piloter les campagnes, publier les livrables et administrer le portefeuille de crédits.

## 2. Objectifs de la plateforme

| Objectif | Description |
|---|---|
| Centraliser l’information | Réunir au même endroit les campagnes, actions, KPI, PDF stratégiques, crédits et résultats. |
| Rassurer le client | Donner une vision claire de ce qui est fait, de ce qui est en cours et de la valeur produite. |
| Industrialiser le delivery | Standardiser les opérations, les statuts, les livrables et les règles de pilotage côté Fastlane. |
| Rendre les crédits tangibles | Permettre au client de voir son solde, l’historique, les réservations, les reports et les consommations. |
| Faciliter l’upsell | Permettre l’achat ou la demande de crédits additionnels en autonomie ou avec validation Fastlane. |
| Différencier les statuts clients | Offrir une expérience distincte selon qu’il s’agit d’un sprint gratuit ou d’une offre payante long terme. |

## 3. Périmètre fonctionnel

La plateforme se compose de deux environnements principaux.

| Environnement | Description |
|---|---|
| Espace Super Admin | Back-office interne permettant à Fastlane de gérer les clients, les offres, les crédits, les campagnes, les actions, les documents et les accès. |
| Espace Client | Extranet premium permettant au client de suivre son dashboard, ses campagnes, ses actions, ses crédits et ses documents stratégiques. |
| Mode Sprint | Accès restreint destiné au sprint gratuit de 5 jours, avec focus sur la preuve de valeur, la timeline et les résultats visibles. |
| Mode Long Terme | Accès complet pour les clients payants, avec portefeuille de crédits, campagnes multiples, stratégie et historique détaillé. |

## 4. Utilisateurs et rôles

### 4.1 Rôles internes

| Rôle | Description | Droits principaux |
|---|---|---|
| Super Admin | Administrateur global | Tous les droits, paramétrage global, accès complet à toutes les données. |
| Admin Ops | Pilotage opérationnel | Gestion des clients, campagnes, actions, documents, crédits. |
| Account Manager | Relation client & delivery | Suivi des campagnes, publications, coordination et commentaires. |
| Sprint Manager | Pilotage sprint et acquisition | Suivi des sprints, séquences, résultats et avancement. |
| Finance/Admin | Administration commerciale | Historique crédits, recharges, ajustements, suivi des upgrades. |

### 4.2 Rôles externes

| Rôle | Description | Droits principaux |
|---|---|---|
| Client Owner | Décideur principal côté client | Vue complète du compte, arbitrage de crédits, consultation des documents et campagnes. |
| Collaborateur Client | Membre d’équipe côté client | Accès restreint selon permissions attribuées. |
| Prospect Sprint | Utilisateur invité sur sprint gratuit | Vue sprint, dashboard simplifié, résultats, documents sélectionnés. |

## 5. Principes métier structurants

- Le crédit représente une capacité d’intervention et de pilotage ; il ne doit pas être perçu comme un simple volume technique.
- Le client dispose d’une allocation mensuelle de crédits selon son offre.
- Les crédits non consommés peuvent être reportés selon une règle configurable.
- Chaque action doit pouvoir réserver puis consommer des crédits, avec traçabilité complète.
- Le client doit comprendre à tout moment où va son budget et quelle action il peut déclencher ensuite.
- La plateforme doit matérialiser une logique de campagne, d’action, de livrable et de portefeuille de crédits.

## 6. Architecture métier et objets principaux

| Objet | Rôle dans le système |
|---|---|
| Client | Compte principal avec statut, offre, équipe, accès et portefeuille. |
| Portefeuille de crédits | Solde, report, recharges, réservations, consommations et expirations. |
| Campagne | Conteneur stratégique et opérationnel regroupant objectifs, actions, KPI et livrables. |
| Action | Unité de travail rattachée à une campagne, consommant ou réservant des crédits. |
| Livrable | Résultat visible : PDF, audit, rapport, script, séquence, export, page ou replay. |

Relation cible : un client possède un portefeuille de crédits ; il possède plusieurs campagnes ; chaque campagne regroupe plusieurs actions ; chaque action peut produire un ou plusieurs livrables ; chaque action peut entraîner un débit de crédits.

## 7. Espace Client — Modules fonctionnels

### 7.1 Dashboard

Le dashboard est la page d’accueil après connexion. Il doit fournir une vue synthétique, immédiatement compréhensible et orientée résultats.

| Bloc | Contenu attendu |
|---|---|
| Résumé business | CA généré, leads, meetings, réponses, opportunités, taux de conversion, KPI personnalisés. |
| Résumé crédits | Disponible, réservé, consommé, reporté, acheté, expirant prochainement. |
| Campagnes actives | Cartes synthétiques des campagnes ouvertes avec statut, résultats et prochaine étape. |
| Actions prioritaires | Liste des tâches en cours, en validation ou à venir. |
| Derniers livrables | PDF, audits, scripts, comptes rendus et documents récemment publiés. |
| Prochaines étapes | Planning court terme et échéances visibles. |

Exigence UX majeure : le solde de crédits doit rester visible en permanence, idéalement dans un bandeau fixe ou un footer sticky affichant le disponible, le reporté et le réservé.

### 7.2 Module Stratégie

Ce module doit expliciter la logique de ce qui est mené pour le client. Il ne montre pas seulement des tâches, mais la colonne vertébrale de la mission.

| Niveau | Contenu |
|---|---|
| Vision globale | Objectifs, focus actuel, hypothèses, KPI cibles, roadmap. |
| Blocs stratégiques | Acquisition, conversion, events, automatisation, sales enablement, etc. |
| Livrables stratégiques | PDF, audits, plans d’action, bilans mensuels, recommandations de renouvellement. |

### 7.3 Module Campagnes

Toutes les campagnes doivent être centralisées au même endroit : outbound, LinkedIn, VoiceBlast, webinar, mini-event, landing page, funnel, nurturing, audit, séquence de vente, événement complet.

Chaque campagne doit disposer d’une fiche unique comportant : résumé, objectifs, période, KPI, timeline, actions liées, livrables, consommation de crédits et commentaires.

### 7.4 Module Actions en cours

L’objectif est d’offrir une lecture opérationnelle simple et vivante du delivery.

| Vue | Description |
|---|---|
| Liste | Tableau filtrable par statut, priorité, campagne, responsable et période. |
| Kanban | Colonnes : À valider / Planifiée / En cours / En review / Terminée. |
| Timeline | Vue chronologique des étapes et actions importantes. |

### 7.5 Module Portefeuille de crédits

Le portefeuille de crédits constitue le cœur différenciant du produit. Le client doit comprendre instantanément son budget d’intervention et la façon dont il est utilisé.

| Bloc | Contenu |
|---|---|
| Solde courant | Crédits immédiatement utilisables. |
| Allocation mensuelle | Crédits inclus dans l’offre du mois. |
| Report | Crédits non consommés du mois précédent encore disponibles. |
| Crédits achetés | Recharges validées ou en attente de validation. |
| Réservations | Crédits déjà affectés à des actions planifiées. |
| Consommation | Crédits effectivement débités sur actions terminées. |
| Historique | Journal complet de tous les mouvements de crédits. |

### 7.6 Module Upgrade / recharge

Le client doit pouvoir ajouter facilement des crédits à son portefeuille.

- Choix d’un pack standard : 500, 1000 ou 2000 crédits.
- Choix de l’affectation : campagne existante, nouvelle action, réserve générale.
- Tunnel de confirmation clair avec statut : brouillon, demandé, validé, payé, crédité.
- Historique des recharges accessible dans le portefeuille.

### 7.7 Module Documents & livrables

L’espace documentaire doit devenir la mémoire client centralisée. Il doit permettre de consulter, filtrer, versionner et télécharger les livrables utiles à la relation et au pilotage.

### 7.8 Module Sprint actif

Pour les clients en sprint gratuit, la plateforme doit afficher une timeline très lisible du sprint, des résultats visibles rapidement et une projection pédagogique du fonctionnement long terme.

| Élément | Description |
|---|---|
| Timeline du sprint | Suivi jour par jour du sprint : préparation, lancement, qualification, démos, closing. |
| Résultats visibles | Réponses, leads, calls, démos, preuves d’activité et premiers enseignements. |
| Documents clés | Stratégie, bilan, recommandations ou support de conversion vers l’offre payante. |
| Projection offre payante | Explication de la logique crédits et du pilotage long terme. |

## 8. Espace Super Admin — Modules fonctionnels

### 8.1 Tableau de bord interne

Vue portefeuille de tous les clients avec statuts, offres, owners, santé du compte, niveau de consommation de crédits, renouvellements à venir et opportunités d’upsell.

### 8.2 Gestion des clients

- Créer un client, modifier sa fiche, définir son statut et son offre.
- Activer, suspendre, archiver un compte.
- Inviter des utilisateurs et gérer leurs permissions.
- Consulter l’historique relationnel, documentaire et opérationnel.

### 8.3 Gestion des crédits

Le back-office doit permettre de paramétrer les offres, les allocations mensuelles, les règles de report, les expirations, les packs de recharge et les ajustements manuels.

### 8.4 Gestion des campagnes

Créer, rattacher, piloter, archiver une campagne ; définir ses objectifs, sa période, ses KPI, son owner et ses crédits associés.

### 8.5 Gestion des actions

Créer des actions, les assigner, les planifier, réserver les crédits, faire évoluer le statut et générer le débit final au bon moment métier.

### 8.6 Gestion documentaire

Uploader, publier, versionner, archiver et rattacher des PDF ou livrables à un client, une campagne ou un bloc stratégique.

### 8.7 Gestion des accès et permissions

Inviter des utilisateurs internes ou externes, attribuer un rôle, restreindre le périmètre d’accès et gérer les réinitialisations de mot de passe.

## 9. Parcours utilisateurs clés

### 9.1 Parcours client payant

- Connexion au dashboard principal.
- Consultation des KPI, du portefeuille de crédits et des campagnes actives.
- Accès aux actions en cours et aux livrables publiés.
- Lecture d’un document stratégique en PDF.
- Ajout éventuel de crédits pour accélérer ou étendre une campagne.

### 9.2 Parcours client sprint

- Réception d’un accès temporaire.
- Consultation de la timeline du sprint et des résultats obtenus.
- Téléchargement d’un document de stratégie ou de bilan.
- Projection vers le fonctionnement de l’offre long terme.

### 9.3 Parcours super admin

- Création du compte client.
- Définition du statut : Sprint ou Actif.
- Attribution de l’offre et de l’allocation de crédits.
- Création des campagnes et actions.
- Publication des documents et suivi de la consommation / upsell.

## 10. Règles métier détaillées

| Règle | Détail |
|---|---|
| Allocation mensuelle | Créditée automatiquement à une date fixe selon l’offre. |
| Report | Crédits non consommés reportés selon une règle paramétrable. |
| Réservation | Possible dès la planification d’une action. |
| Débit | Effectif à la clôture de l’action ou à un jalon défini. |
| Recharge | Ajout via pack standard, ajustement manuel ou geste commercial. |
| Expiration | Durée et plafond paramétrables. |
| Priorité de consommation | Utiliser d’abord les crédits les plus anciens ou les crédits du mois selon règle choisie. |
| Traçabilité | Aucune suppression des mouvements ; correction via écriture compensatoire. |

## 11. Exigences UX / UI

- La plateforme doit être perçue comme un OS de pilotage, pas comme un simple extranet client.
- Le design doit être clair, premium, actionnable et transparent.
- Le bandeau de crédits doit être visible en permanence.
- Le client doit pouvoir passer facilement d’une vision stratégique à une vision opérationnelle.
- Les appels à l’action d’upgrade doivent être visibles sans être agressifs.

## 12. Exigences techniques et non fonctionnelles

| Thème | Attendus |
|---|---|
| Authentification | Connexion sécurisée, reset mot de passe, base compatible 2FA en phase 2. |
| Sécurité | Isolation stricte des données client, gestion fine des rôles, journalisation des opérations sensibles. |
| Conformité | Respect RGPD et confidentialité des documents stratégiques. |
| Performance | Chargement rapide des dashboards, pagination des historiques, prévisualisation PDF fluide. |
| Scalabilité | Capacité à absorber davantage de clients, campagnes, actions et mouvements de crédits. |
| Auditabilité | Historique des modifications, changements de statut, publications et ajustements crédits. |

## 13. Modèle de données minimal recommandé

| Table | Description |
|---|---|
| users | Utilisateurs internes et externes. |
| clients | Comptes clients et métadonnées principales. |
| client_members | Association entre utilisateurs et clients. |
| offers | Offres commerciales et règles de crédits. |
| wallets | Portefeuilles de crédits. |
| wallet_transactions | Historique des mouvements de crédits. |
| campaigns | Campagnes client. |
| actions | Actions rattachées aux campagnes. |
| action_status_history | Historique des changements de statut. |
| strategic_blocks | Blocs stratégiques. |
| documents | Documents et livrables. |
| document_versions | Versioning des documents. |
| upgrades | Demandes ou achats de crédits supplémentaires. |
| notifications | Alertes et messages système. |

## 14. MVP recommandé

Pour lancer rapidement la plateforme, il est recommandé de construire un MVP concentré sur les usages critiques.

| Priorité | Module |
|---|---|
| Critique | Authentification et rôles |
| Critique | Gestion clients |
| Critique | Dashboard client |
| Critique | Portefeuille de crédits + historique |
| Critique | Campagnes |
| Critique | Actions en cours |
| Critique | Documents / PDF |
| Critique | Espace Sprint |
| Importante | Back-office Super Admin |
| Importante | Recharge manuelle de crédits |
| Phase 2 | Upgrade autonome payé en ligne |
| Phase 2 | Notifications |
| Phase 2 | Marketplace et recommandations intelligentes |

## 15. Critères de recette

| Critère | Validation attendue |
|---|---|
| Rôles et permissions | Chaque utilisateur ne voit que le périmètre qui lui est autorisé. |
| Double expérience | Distinction effective entre mode Sprint et mode Long Terme. |
| Dashboard | KPI, campagnes et crédits visibles dès l’accueil. |
| Crédits | Solde, report, réservation, débit et historique fonctionnent correctement. |
| Campagnes | Création, consultation et suivi opérationnel disponibles. |
| Actions | Statuts lisibles et mis à jour selon le flux défini. |
| Documents | PDF consultables et rattachables à une campagne ou à un bloc stratégique. |
| Back-office | Création client, campagne, action, document et mouvement de crédits opérationnels. |

## 16. Risques produit à anticiper

| Risque | Réponse recommandée |
|---|---|
| Complexité excessive en V1 | Lancer un MVP centré sur les modules critiques. |
| Crédits incompris | Imposer un ledger clair, des états de crédits explicites et un bandeau permanent. |
| Mélange Sprint / Payant | Construire deux expériences distinctes avec droits séparés. |
| Back-office artisanal | Modéliser proprement client / campagne / action / crédit / document. |
| Documents dispersés | Centraliser tous les livrables dans un module documentaire versionné. |

## 17. Recommandation finale de cadrage

La plateforme doit être pensée comme un Fastlane OS : un espace unique permettant au client de voir la stratégie, les campagnes, les actions, les livrables et le budget de crédits ; et à Fastlane de piloter industrialisation, transparence et upsell dans un même outil.

La proposition de valeur n’est pas simplement de montrer des statistiques, mais de rendre visible la mécanique de création de valeur : ce qui est fait, pourquoi c’est fait, combien cela consomme et quelle action mérite d’être lancée ensuite.

## 18. Formulation synthétique du projet

Créer une plateforme web Fastlane permettant à l’équipe interne de piloter les clients, et aux clients de suivre leurs campagnes, actions, documents stratégiques et crédits, avec une expérience différenciée selon qu’ils sont en sprint gratuit ou en offre payante.

## 19. Source de référence

Blueprint opérationnel Fastlane V2 fourni par le porteur de projet : https://www.genspark.ai/api/files/s/jSbDOec0

---

Source PDF d’origine : https://www.genspark.ai/api/files/s/1e8LhYQg
