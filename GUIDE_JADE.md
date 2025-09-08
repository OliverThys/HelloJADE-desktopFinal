# 🤖 Guide d'utilisation du dialogue JADE

## Vue d'ensemble

Le dialogue JADE (Justified Automated Dialogue Engine) est le cœur du système HelloJADE. Il permet de mener des entretiens médicaux automatisés structurés avec les patients post-hospitalisation.

## 🎯 Objectifs du dialogue JADE

1. **Vérification d'identité** : Confirmer l'identité du patient
2. **Évaluation médicale** : Collecter des données de santé structurées
3. **Calcul de score** : Évaluer l'état de santé du patient
4. **Détection d'urgence** : Identifier les situations nécessitant une intervention immédiate

## 📋 Structure du dialogue

### 1. Introduction
```
🎙️ "Bonjour, je suis Jade, votre assistant vocal de l'hôpital [NOM_HOPITAL]. 
Cet appel dure 3 minutes et est transmis à votre équipe médicale.
Je m'adresse bien à [PRENOM] [NOM] ?"
```

### 2. Vérification d'identité
```
🔐 "Pour votre sécurité, confirmez votre date de naissance.
Dites-moi : jour, mois, année."
```

### 3. Questions médicales

#### A. Douleur
- **Question** : "Votre douleur aujourd'hui, de 0 à 10 ?"
- **Suivi** : "Où avez-vous mal ?"
- **Extraction** : `niveau` (0-10) + `localisation` (string)

#### B. Traitement
- **Question** : "Prenez-vous vos médicaments comme prescrit ? Répondez par oui ou non."
- **Extraction** : `traitement` (boolean)

#### C. Transit
- **Question** : "Allez-vous aux toilettes normalement ? Oui ou non ?"
- **Si NON** : "Quel est le problème ?"
- **Extraction** : `transit` (boolean) + `probleme_transit` (string)

#### D. Moral
- **Question** : "Votre moral aujourd'hui, de 0 à 10 ?"
- **Si < 7** : "Que ressens-vous exactement ?"
- **Extraction** : `moral` (0-10) + `details_moral` (string)

#### E. Fièvre
- **Question** : "Avez-vous de la fièvre ? Oui ou non ?"
- **Si OUI** : "Quelle température ?"
- **Extraction** : `fievre` (boolean) + `temperature` (number)

#### F. Autres
- **Question** : "Autre chose à signaler ? Une phrase suffit."
- **Extraction** : `autres` (string)

### 4. Clôture
```
🎯 "Merci [PRENOM]. Vos réponses sont transmises à votre médecin.
Si besoin, vous serez recontacté dans les 24h.
Bonne journée, c'était Jade."
```

## 🧮 Algorithme de calcul du score

Le score JADE est calculé sur 100 points avec des pénalités :

```javascript
Score = 100 - (
  (douleur > 5 ? 20 : 0) +
  (!traitement_suivi ? 15 : 0) +
  (!transit_normal ? 10 : 0) +
  (moral < 5 ? 15 : 0) +
  (fievre ? 20 : 0) +
  (mots_clés_urgents ? 20 : 0)
)
```

### Catégories de score :
- **80-100** : Excellent (vert)
- **60-79** : Bon (jaune)
- **40-59** : Modéré (orange)
- **0-39** : Préoccupant (rouge)

## 🚨 Détection d'urgence

### Critères d'urgence automatique :
- Douleur > 7/10
- Fièvre présente
- Mots-clés d'urgence dans les plaintes :
  - "urgence"
  - "ambulance"
  - "hôpital"
  - "douleur forte"
  - "sang"
  - "difficulté respiratoire"

### Actions en cas d'urgence :
1. Arrêt immédiat du dialogue
2. Alerte automatique au médecin
3. Notification aux services d'urgence
4. Enregistrement de l'incident

## 📊 Données collectées

### Format JSON de sortie :
```json
{
  "patient_confirme": boolean,
  "identite_verifiee": boolean,
  "douleur_niveau": number,
  "douleur_localisation": string,
  "traitement_suivi": boolean,
  "transit_normal": boolean,
  "probleme_transit": string,
  "moral_niveau": number,
  "moral_details": string,
  "fievre": boolean,
  "temperature": number,
  "autres_plaintes": string,
  "score_medical": number,
  "urgence_detectee": boolean
}
```

## 🔧 Configuration technique

### Services requis :
- **Asterisk** : PBX téléphonique
- **Whisper** : Transcription audio
- **Rasa** : Agent conversationnel
- **Ollama** : Analyse LLM
- **PostgreSQL** : Stockage des données

### Endpoints API :
- `POST /api/calls/medical` : Lancer un appel JADE
- `POST /api/calls/save-jade-data` : Sauvegarder les données
- `POST /api/calls/emergency` : Gérer les urgences
- `POST /api/calls/export` : Exporter les données
- `POST /api/calls/issues` : Signaler des problèmes

## 🎮 Interface utilisateur

### Page d'appels :
- **Filtres** : Date, statut, site, service, score
- **Tableau** : Liste des appels avec colonnes JADE
- **Modal résumé** : Détails complets de l'appel
- **Export** : CSV/Excel des données filtrées
- **Signalement** : Système de feedback

### Colonnes du tableau :
1. Patient (nom, prénom, téléphone)
2. Hospitalisation (site, service, médecin)
3. Appel (date prévue, réelle, durée, statut)
4. **Score JADE** (0-100 avec barre de progression)
5. **Résumé** (boutons voir/écouter)
6. Actions (démarrer, raccrocher, relancer, signaler)

## 📈 Métriques et statistiques

### Tableau de bord :
- Nombre total d'appels
- Taux de réussite
- Score moyen
- Appels en cours
- Urgences détectées

### Filtres disponibles :
- Période (date début/fin)
- Statut (à appeler, en cours, appelé, échec)
- Site hospitalier
- Service médical
- Score minimum

## 🔍 Débogage et monitoring

### Logs importants :
- Connexion AMI Asterisk
- Transcription Whisper
- Réponses Rasa
- Calcul de score
- Détection d'urgence

### Commandes de test :
```bash
# Test complet du système
./scripts/test-jade-system.ps1

# Test des services individuels
curl http://localhost:3000/health
curl http://localhost:5005/
curl http://localhost:9000/
curl http://localhost:11434/api/tags
```

## 🚀 Déploiement

### Prérequis :
1. Docker et Docker Compose
2. Ports disponibles : 3000, 5005, 9000, 11434, 5038
3. Base de données PostgreSQL
4. Configuration Asterisk

### Démarrage :
```bash
# Démarrer tous les services
docker-compose up -d

# Vérifier le statut
docker-compose ps

# Tester le système
./scripts/test-jade-system.ps1
```

## 📞 Support et amélioration continue

### Signalement de problèmes :
- Interface intégrée dans l'application
- Catégorisation des problèmes
- Niveaux de gravité
- Suivi des résolutions

### Amélioration continue :
- Analyse des échecs d'appels
- Optimisation du dialogue
- Ajustement des seuils de score
- Formation des modèles IA

---

**HelloJADE v2.0** - Système de gestion post-hospitalisation avec dialogue médical automatisé JADE
