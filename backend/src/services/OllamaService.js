const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama2';
  }

  async analyzeMedicalResponse(response, context = {}) {
    try {
      const prompt = this.buildMedicalAnalysisPrompt(response, context);
      
      const requestData = {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: 500
        }
      };

      const response = await axios.post(`${this.baseUrl}/api/generate`, requestData, {
        timeout: 30000
      });

      if (response.data && response.data.response) {
        return {
          success: true,
          analysis: response.data.response,
          model: response.data.model,
          created_at: response.data.created_at
        };
      } else {
        throw new Error('Réponse invalide du service Ollama');
      }
    } catch (error) {
      console.error('Erreur lors de l\'analyse Ollama:', error);
      return {
        success: false,
        error: error.message,
        analysis: ''
      };
    }
  }

  buildMedicalAnalysisPrompt(response, context) {
    return `Tu es un assistant médical IA spécialisé dans l'analyse de réponses de patients post-hospitalisation.

Contexte de l'appel:
- Patient: ${context.patientName || 'Non spécifié'}
- Hôpital: ${context.hospitalName || 'Non spécifié'}
- Service: ${context.serviceName || 'Non spécifié'}

Réponses du patient:
${JSON.stringify(response, null, 2)}

Analyse les réponses et fournis:
1. Un résumé médical concis
2. Les points d'attention (douleur, fièvre, moral, etc.)
3. Le niveau de priorité (faible, moyen, élevé, urgence)
4. Des recommandations pour l'équipe médicale

Réponds en français, de manière professionnelle et concise.`;
  }

  async calculateMedicalScore(responses) {
    try {
      const prompt = this.buildScoringPrompt(responses);
      
      const requestData = {
        model: this.model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.1,
          top_p: 0.8,
          max_tokens: 200
        }
      };

      const response = await axios.post(`${this.baseUrl}/api/generate`, requestData, {
        timeout: 15000
      });

      if (response.data && response.data.response) {
        // Extraire le score de la réponse
        const scoreMatch = response.data.response.match(/(\d+)\/100/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : this.calculateBasicScore(responses);
        
        return {
          success: true,
          score: score,
          reasoning: response.data.response,
          model: response.data.model
        };
      } else {
        return {
          success: true,
          score: this.calculateBasicScore(responses),
          reasoning: 'Calcul basique appliqué',
          model: this.model
        };
      }
    } catch (error) {
      console.error('Erreur lors du calcul de score Ollama:', error);
      return {
        success: true,
        score: this.calculateBasicScore(responses),
        reasoning: 'Calcul basique appliqué (erreur Ollama)',
        error: error.message
      };
    }
  }

  buildScoringPrompt(responses) {
    return `Tu es un système de scoring médical. Analyse ces réponses de patient et calcule un score de 0 à 100.

Réponses:
- Douleur: ${responses.pain_level || 'Non spécifié'}/10
- Médicaments: ${responses.medication_compliance ? 'Oui' : 'Non'}
- Transit: ${responses.transit_normal ? 'Normal' : 'Problème'}
- Moral: ${responses.mood_level || 'Non spécifié'}/10
- Fièvre: ${responses.fever_present ? 'Oui' : 'Non'}
- Autres: ${responses.other_complaints || 'Aucun'}

Critères de scoring:
- Score de base: 100
- Douleur > 5: -20 points
- Pas de médicaments: -15 points
- Problème transit: -10 points
- Moral < 5: -15 points
- Fièvre: -20 points
- Mots d'urgence: -20 points

Calcule le score final et explique brièvement. Format: "Score: X/100 - Explication"`;
  }

  calculateBasicScore(responses) {
    let score = 100;

    // Douleur
    if (responses.pain_level && responses.pain_level > 5) {
      score -= 20;
    }

    // Médicaments
    if (responses.medication_compliance === false) {
      score -= 15;
    }

    // Transit
    if (responses.transit_normal === false) {
      score -= 10;
    }

    // Moral
    if (responses.mood_level && responses.mood_level < 5) {
      score -= 15;
    }

    // Fièvre
    if (responses.fever_present === true) {
      score -= 20;
    }

    // Mots d'urgence
    if (responses.other_complaints) {
      const emergencyKeywords = ['urgence', 'ambulance', 'hôpital', 'douleur forte', 'sang', 'crise'];
      if (emergencyKeywords.some(keyword => responses.other_complaints.toLowerCase().includes(keyword))) {
        score -= 20;
      }
    }

    return Math.max(0, score);
  }

  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return {
        success: true,
        models: response.data.models || []
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des modèles Ollama:', error);
      return {
        success: false,
        error: error.message,
        models: []
      };
    }
  }

  async getServiceStatus() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/version`, {
        timeout: 5000
      });
      return {
        success: true,
        status: 'healthy',
        version: response.data.version || 'unknown'
      };
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  async testConnection() {
    try {
      const status = await this.getServiceStatus();
      if (status.success) {
        console.log('✅ Service Ollama connecté et opérationnel');
        return true;
      } else {
        console.log('❌ Service Ollama non disponible:', status.error);
        return false;
      }
    } catch (error) {
      console.log('❌ Erreur de connexion Ollama:', error.message);
      return false;
    }
  }
}

module.exports = OllamaService;
