# HelloJADE Desktop - Système de gestion post-hospitalisation

![HelloJADE Logo](https://via.placeholder.com/200x100/3B82F6/FFFFFF?text=HelloJADE)

## 🏥 Description

HelloJADE est un système de gestion post-hospitalisation avec appels médicaux automatisés. Il permet de suivre l'état de santé des patients après leur sortie d'hôpital grâce à des appels téléphoniques automatisés utilisant l'intelligence artificielle.

## ✨ Fonctionnalités principales

### 📞 Gestion des appels
- **Appels automatisés** vers les patients post-hospitalisation
- **Dialogue médical interactif** avec reconnaissance vocale
- **Transcription automatique** des conversations
- **Calcul de score médical** basé sur les réponses
- **Détection d'urgences** avec transfert automatique
- **Enregistrement des appels** pour archivage

### 🤖 Intelligence Artificielle
- **Whisper** pour la transcription audio en temps réel
- **Ollama** pour l'analyse et le scoring médical
- **Rasa** pour la gestion du dialogue structuré
- **Extraction d'entités** médicales automatique

### 📊 Interface utilisateur
- **Application desktop** Vue.js 3 + Tauri
- **Tableau de bord** avec statistiques en temps réel
- **Gestion des appels** avec filtres avancés
- **Export des données** en CSV/Excel/PDF
- **Notifications** en temps réel
- **Mode sombre/clair**

### 🔐 Sécurité
- **Authentification Active Directory/LDAP**
- **Gestion des rôles** (admin, user, nurse)
- **Chiffrement des communications**
- **Audit trail** complet

## 🏗️ Architecture technique

### Stack technologique
- **Frontend**: Vue.js 3 + TypeScript + TailwindCSS + Tauri
- **Backend**: Node.js + Express + TypeScript
- **Base de données**: PostgreSQL (HelloJADE) + Oracle (Hôpital)
- **Téléphonie**: Asterisk PBX
- **IA**: Whisper + Ollama + Rasa
- **Cache**: Redis
- **Conteneurisation**: Docker + Docker Compose

### Services
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Asterisk      │
│   (Vue.js +     │◄──►│   (Node.js +    │◄──►│   (PBX)         │
│    Tauri)       │    │    Express)     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   Redis Cache   │    │   AI Services   │
│   (HelloJADE)   │    │                 │    │ Whisper+Ollama  │
│                 │    │                 │    │     +Rasa       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Installation et démarrage

### Prérequis
- Docker Desktop
- Docker Compose
- Node.js 18+ (pour le développement)
- Rust (pour Tauri)

### Démarrage rapide

#### Windows
```powershell
# Cloner le projet
git clone https://github.com/hellojade/desktop.git
cd HelloJADE-desktopFinal

# Démarrer tous les services
.\scripts\start-hellojade.ps1 --dev

# Ou en mode production
.\scripts\start-hellojade.ps1 --build
```

#### Linux/macOS
```bash
# Cloner le projet
git clone https://github.com/hellojade/desktop.git
cd HelloJADE-desktopFinal

# Rendre le script exécutable
chmod +x scripts/start-hellojade.sh

# Démarrer tous les services
./scripts/start-hellojade.sh --dev

# Ou en mode production
./scripts/start-hellojade.sh --build
```

### Services disponibles
- **Frontend**: http://localhost:1420
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Asterisk AMI**: localhost:5038
- **Asterisk ARI**: http://localhost:8088

## 📱 Utilisation

### 1. Connexion
- Ouvrez l'application HelloJADE
- Connectez-vous avec vos identifiants Active Directory
- Accédez au tableau de bord

### 2. Gestion des appels
- Naviguez vers la page "Appels"
- Consultez la liste des appels programmés
- Utilisez les filtres pour rechercher des appels spécifiques
- Lancez manuellement des appels si nécessaire
- Consultez les résumés et scores médicaux

### 3. Monitoring
- Surveillez l'état des services
- Consultez les métriques de performance
- Gérez les alertes et notifications

## 🔧 Configuration

### Variables d'environnement
```bash
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hellojade
DB_USER=hellojade
DB_PASSWORD=hellojade123

# Asterisk
ASTERISK_HOST=localhost
ASTERISK_AMI_PORT=5038
ASTERISK_AMI_USER=hellojade
ASTERISK_AMI_PASS=amp111

# Services IA
WHISPER_URL=http://localhost:8001
OLLAMA_URL=http://localhost:11434
RASA_URL=http://localhost:5005
```

### Configuration Asterisk
Les fichiers de configuration Asterisk sont dans le dossier `asterisk/etc/asterisk/`:
- `asterisk.conf` - Configuration principale
- `pjsip.conf` - Configuration SIP
- `extensions.conf` - Logique d'appels
- `manager.conf` - Interface de gestion
- `ari.conf` - API REST

## 🧪 Tests

### Tests unitaires
```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### Tests d'intégration
```bash
# Tests complets
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📊 Monitoring et logs

### Logs
```bash
# Voir les logs de tous les services
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend
docker-compose logs -f asterisk
```

### Métriques
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001 (si configuré)

## 🔒 Sécurité

### Authentification
- Intégration Active Directory/LDAP
- JWT tokens pour l'API
- Sessions sécurisées

### Chiffrement
- HTTPS/TLS pour toutes les communications
- Chiffrement des données sensibles
- Certificats SSL auto-signés pour le développement

## 🚨 Gestion des urgences

Le système détecte automatiquement les situations d'urgence basées sur:
- Score médical faible (< 40)
- Mots-clés d'urgence dans les réponses
- Niveau de douleur élevé (> 7/10)
- Présence de fièvre

En cas d'urgence détectée:
1. Transfert automatique vers les services d'urgence
2. Notification immédiate du personnel médical
3. Enregistrement de l'incident
4. Suivi post-urgence

## 📈 Évolutions prévues

### Version 2.1
- [ ] Interface mobile (React Native)
- [ ] Intégration WhatsApp
- [ ] Analytics avancées
- [ ] Machine Learning pour l'amélioration du scoring

### Version 2.2
- [ ] Support multi-langues
- [ ] Intégration avec d'autres PBX
- [ ] API publique
- [ ] Marketplace d'extensions

## 🤝 Contribution

### Développement
1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Standards de code
- ESLint + Prettier pour le frontend
- StandardJS pour le backend
- Tests unitaires obligatoires
- Documentation des APIs

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 📞 Support

- **Email**: support@hellojade.com
- **Documentation**: https://docs.hellojade.com
- **Issues**: https://github.com/hellojade/desktop/issues

## 👥 Équipe

- **Développement**: Équipe HelloJADE
- **Médecine**: Dr. [Nom du médecin référent]
- **IT**: [Nom du responsable IT]

---

**HelloJADE** - Révolutionner le suivi post-hospitalisation avec l'IA 🚀
