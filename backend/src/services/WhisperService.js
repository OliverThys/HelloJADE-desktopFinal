const axios = require('axios');

class WhisperService {
  constructor() {
    this.baseUrl = process.env.WHISPER_URL || 'http://localhost:9000';
    this.model = process.env.WHISPER_MODEL || 'base';
    this.language = process.env.WHISPER_LANGUAGE || 'fr';
  }

  async transcribeAudio(audioBuffer, options = {}) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBuffer, 'audio.wav');
      formData.append('model', options.model || this.model);
      formData.append('language', options.language || this.language);

      const response = await axios.post(`${this.baseUrl}/asr`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 secondes
      });

      if (response.data && response.data.text) {
        return {
          success: true,
          text: response.data.text,
          confidence: response.data.confidence || 0.8,
          language: response.data.language || this.language
        };
      } else {
        throw new Error('Réponse invalide du service Whisper');
      }
    } catch (error) {
      console.error('Erreur lors de la transcription Whisper:', error);
      return {
        success: false,
        error: error.message,
        text: ''
      };
    }
  }

  async transcribeFile(audioFilePath) {
    try {
      const fs = require('fs');
      const audioBuffer = fs.readFileSync(audioFilePath);
      return await this.transcribeAudio(audioBuffer);
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier audio:', error);
      return {
        success: false,
        error: error.message,
        text: ''
      };
    }
  }

  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.baseUrl}/models`);
      return {
        success: true,
        models: response.data.models || []
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des modèles:', error);
      return {
        success: false,
        error: error.message,
        models: []
      };
    }
  }

  async getServiceStatus() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
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

  // Méthode pour tester la connexion
  async testConnection() {
    try {
      const status = await this.getServiceStatus();
      if (status.success) {
        console.log('✅ Service Whisper connecté et opérationnel');
        return true;
      } else {
        console.log('❌ Service Whisper non disponible:', status.error);
        return false;
      }
    } catch (error) {
      console.log('❌ Erreur de connexion Whisper:', error.message);
      return false;
    }
  }
}

module.exports = WhisperService;
