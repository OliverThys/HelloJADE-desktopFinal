const ami = require('asterisk-manager');
const WebSocket = require('ws');
const EventEmitter = require('events');

class AsteriskService extends EventEmitter {
  constructor() {
    super();
    this.ami = null;
    this.connected = false;
    this.activeCalls = new Map();
    this.config = {
      host: process.env.ASTERISK_HOST || 'localhost',
      port: process.env.ASTERISK_AMI_PORT || 5038,
      username: process.env.ASTERISK_AMI_USER || 'admin',
      password: process.env.ASTERISK_AMI_PASS || 'amp111'
    };
  }

  async connect() {
    try {
      this.ami = new ami(this.config.port, this.config.host, this.config.username, this.config.password, true);

      this.ami.on('connect', () => {
        console.log('Connexion AMI établie');
        this.connected = true;
        this.emit('connected');
      });

      this.ami.on('error', (error) => {
        console.warn('Erreur AMI (non-bloquante):', error.message);
        this.connected = false;
        this.emit('error', error);
      });

      this.ami.on('event', (event) => {
        this.handleAMIEvent(event);
      });

      // Ne pas attendre la connexion, retourner immédiatement
      return true;
    } catch (error) {
      console.warn('Erreur de connexion AMI (non-bloquante):', error.message);
      this.connected = false;
      return false;
    }
  }

  async makeMedicalCall(hospitalId, patientNumber, callData) {
    if (!this.connected) {
      throw new Error('AMI non connecté');
    }

    try {
      const callId = `medical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Originate call
      const originateAction = {
        Action: 'Originate',
        Channel: `SIP/${patientNumber}`,
        Context: 'hellojade-medical',
        Exten: 's',
        Priority: 1,
        CallerID: `HelloJADE <${hospitalId}>`,
        Variable: `CALL_ID=${callId},PATIENT_ID=${callData.patientId},HOSPITAL_ID=${hospitalId}`,
        Timeout: 30000,
        Async: true
      };

      const result = await new Promise((resolve, reject) => {
        this.ami.action(originateAction, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      });
      
      if (result.Response === 'Success') {
        this.activeCalls.set(callId, {
          id: callId,
          patientNumber,
          hospitalId,
          callData,
          status: 'ringing',
          startTime: new Date(),
          channel: result.Channel
        });

        this.emit('callStarted', { callId, patientNumber, callData });
        return { callId, channel: result.Channel };
      } else {
        throw new Error(`Échec de l'appel: ${result.Message}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'appel médical:', error);
      throw error;
    }
  }

  async startMedicalDialog(channel, callData) {
    try {
      // Play welcome message
      await this.playAudio(channel, 'welcome');
      
      // Start dialogue flow
      await this.askQuestion(channel, 'identity_verification', callData);
      
    } catch (error) {
      console.error('Erreur lors du dialogue médical:', error);
      throw error;
    }
  }

  async askQuestion(channel, questionType, callData) {
    const questions = {
      identity_verification: {
        audio: 'identity_check',
        expectedResponses: ['oui', 'non', 'exact', 'c\'est moi'],
        nextQuestion: 'birth_date'
      },
      birth_date: {
        audio: 'birth_date_question',
        expectedResponses: ['date'],
        nextQuestion: 'pain_level'
      },
      pain_level: {
        audio: 'pain_question',
        expectedResponses: ['number'],
        nextQuestion: 'medication'
      },
      medication: {
        audio: 'medication_question',
        expectedResponses: ['oui', 'non'],
        nextQuestion: 'transit'
      },
      transit: {
        audio: 'transit_question',
        expectedResponses: ['oui', 'non'],
        nextQuestion: 'mood'
      },
      mood: {
        audio: 'mood_question',
        expectedResponses: ['number'],
        nextQuestion: 'fever'
      },
      fever: {
        audio: 'fever_question',
        expectedResponses: ['oui', 'non'],
        nextQuestion: 'other_complaints'
      },
      other_complaints: {
        audio: 'other_question',
        expectedResponses: ['text'],
        nextQuestion: 'end'
      }
    };

    const question = questions[questionType];
    if (!question) {
      throw new Error(`Type de question inconnu: ${questionType}`);
    }

    // Play question audio
    await this.playAudio(channel, question.audio);
    
    // Wait for response
    const response = await this.waitForResponse(channel, question.expectedResponses);
    
    // Process response
    const processedResponse = this.processResponse(response, questionType);
    
    // Store response
    if (!callData.responses) {
      callData.responses = {};
    }
    callData.responses[questionType] = processedResponse;

    // Continue to next question or end
    if (question.nextQuestion !== 'end') {
      await this.askQuestion(channel, question.nextQuestion, callData);
    } else {
      await this.endMedicalDialog(channel, callData);
    }
  }

  async playAudio(channel, audioFile) {
    const playAction = {
      Action: 'Playback',
      Channel: channel,
      Filename: `hellojade/${audioFile}`
    };

    return await new Promise((resolve, reject) => {
      this.ami.action(playAction, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }

  async waitForResponse(channel, expectedTypes, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout en attente de réponse'));
      }, timeout);

      const eventHandler = (event) => {
        if (event.Channel === channel && event.Event === 'DTMFReceived') {
          clearTimeout(timer);
          this.ami.removeListener('event', eventHandler);
          resolve(event.Digit);
        }
      };

      this.ami.on('event', eventHandler);
    });
  }

  processResponse(response, questionType) {
    switch (questionType) {
      case 'identity_verification':
        return response.toLowerCase().includes('oui') || response.toLowerCase().includes('exact');
      
      case 'birth_date':
        return this.parseDate(response);
      
      case 'pain_level':
      case 'mood':
        return parseInt(response) || 0;
      
      case 'medication':
      case 'transit':
      case 'fever':
        return response.toLowerCase().includes('oui');
      
      case 'other_complaints':
        return response;
      
      default:
        return response;
    }
  }

  parseDate(dateString) {
    // Parse various date formats
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i
    ];

    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        return new Date(match[3], match[2] - 1, match[1]);
      }
    }

    return null;
  }

  calculateMedicalScore(responses) {
    let score = 100;

    // Pain level penalty
    if (responses.pain_level > 5) {
      score -= 20;
    }

    // Medication compliance
    if (!responses.medication) {
      score -= 15;
    }

    // Transit issues
    if (!responses.transit) {
      score -= 10;
    }

    // Mood issues
    if (responses.mood < 5) {
      score -= 15;
    }

    // Fever
    if (responses.fever) {
      score -= 20;
    }

    // Emergency keywords
    const emergencyKeywords = ['urgence', 'ambulance', 'hôpital', 'douleur forte', 'sang'];
    if (responses.other_complaints) {
      const hasEmergency = emergencyKeywords.some(keyword => 
        responses.other_complaints.toLowerCase().includes(keyword)
      );
      if (hasEmergency) {
        score -= 20;
      }
    }

    return Math.max(0, score);
  }

  async handleEmergency(channel, callData) {
    try {
      // Play emergency message
      await this.playAudio(channel, 'emergency_detected');
      
      // Transfer to emergency line
      const transferAction = {
        Action: 'Redirect',
        Channel: channel,
        Context: 'emergency',
        Exten: 's',
        Priority: 1
      };

      await new Promise((resolve, reject) => {
        this.ami.action(transferAction, (err, res) => {
          if (err) reject(err);
          else resolve(res);
        });
      });
      
      this.emit('emergencyDetected', { channel, callData });
    } catch (error) {
      console.error('Erreur lors de la gestion d\'urgence:', error);
      throw error;
    }
  }

  async endMedicalDialog(channel, callData) {
    try {
      // Calculate final score
      const score = this.calculateMedicalScore(callData.responses);
      callData.medicalScore = score;

      // Play closing message
      await this.playAudio(channel, 'call_ending');
      
      // Hangup call
      await this.hangupCall(channel);
      
      this.emit('callCompleted', { channel, callData, score });
    } catch (error) {
      console.error('Erreur lors de la fin du dialogue:', error);
      throw error;
    }
  }

  async hangupCall(channel) {
    const hangupAction = {
      Action: 'Hangup',
      Channel: channel
    };

    return await new Promise((resolve, reject) => {
      this.ami.action(hangupAction, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }

  async saveCallResults(callData, responses, score) {
    // This would typically save to database
    const callResult = {
      callId: callData.id,
      patientId: callData.patientId,
      hospitalId: callData.hospitalId,
      responses,
      score,
      timestamp: new Date(),
      duration: Date.now() - callData.startTime
    };

    // Emit event for database saving
    this.emit('callResults', callResult);
    
    return callResult;
  }

  handleAMIEvent(event) {
    console.log('AMI Event:', event.Event, event.Channel);

    switch (event.Event) {
      case 'Newchannel':
        this.handleNewChannel(event);
        break;
      
      case 'Hangup':
        this.handleHangup(event);
        break;
      
      case 'DTMFReceived':
        this.handleDTMF(event);
        break;
      
      case 'PlaybackFinished':
        this.handlePlaybackFinished(event);
        break;
    }
  }

  handleNewChannel(event) {
    const callId = event.Variable_CALL_ID;
    if (callId && this.activeCalls.has(callId)) {
      const call = this.activeCalls.get(callId);
      call.status = 'connected';
      call.channel = event.Channel;
      this.emit('callConnected', { callId, call });
    }
  }

  handleHangup(event) {
    const callId = event.Variable_CALL_ID;
    if (callId && this.activeCalls.has(callId)) {
      const call = this.activeCalls.get(callId);
      call.status = 'completed';
      call.endTime = new Date();
      call.duration = call.endTime - call.startTime;
      
      this.activeCalls.delete(callId);
      this.emit('callEnded', { callId, call });
    }
  }

  handleDTMF(event) {
    const callId = event.Variable_CALL_ID;
    if (callId && this.activeCalls.has(callId)) {
      this.emit('dtmfReceived', { callId, digit: event.Digit });
    }
  }

  handlePlaybackFinished(event) {
    const callId = event.Variable_CALL_ID;
    if (callId && this.activeCalls.has(callId)) {
      this.emit('playbackFinished', { callId });
    }
  }

  getActiveCalls() {
    return Array.from(this.activeCalls.values());
  }

  getCallStatus(callId) {
    return this.activeCalls.get(callId);
  }

  disconnect() {
    if (this.ami) {
      this.ami.disconnect();
      this.connected = false;
    }
  }
}

module.exports = AsteriskService;
