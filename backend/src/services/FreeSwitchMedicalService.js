const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

// Configuration du logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'logs/medical-calls.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

class FreeSwitchMedicalService extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            host: config.host || '127.0.0.1',
            port: config.port || 8021,
            password: config.password || 'ClueCon',
            ...config
        };
        
        this.connection = null;
        this.activeCalls = new Map();
        this.isConnected = false;
    }

    /**
     * Connexion au serveur FreeSWITCH ESL
     */
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                // Simulation de connexion ESL (à remplacer par la vraie lib ESL)
                logger.info('Connecting to FreeSWITCH ESL...');
                
                // Pour l'instant, on simule la connexion
                setTimeout(() => {
                    this.isConnected = true;
                    logger.info('Connected to FreeSWITCH ESL');
                    this.setupEventListeners();
                    resolve();
                }, 1000);
                
            } catch (error) {
                logger.error('ESL Connection Error:', error);
                reject(error);
            }
        });
    }

    /**
     * Configuration des écouteurs d'événements
     */
    setupEventListeners() {
        logger.info('Setting up event listeners...');
        // Les vrais écouteurs ESL seront ajoutés ici
    }

    /**
     * Initier un appel médical vers +32471034785
     */
    async callPatient(phoneNumber = '+32471034785', scriptType = 'standard') {
        const callId = uuidv4();
        
        // Formater le numéro pour la Belgique
        const formattedNumber = this.formatBelgianNumber(phoneNumber);
        
        // Paramètres de l'appel
        const originateParams = {
            callId,
            phoneNumber: formattedNumber,
            scriptType,
            timestamp: new Date().toISOString()
        };
        
        // Stocker les informations de l'appel
        this.activeCalls.set(callId, originateParams);
        
        logger.info(`Initiating medical call to ${formattedNumber}`, { callId });
        
        // Commande originate avec variables personnalisées
        const command = this.buildOriginateCommand(callId, formattedNumber, scriptType);
        
        try {
            // Exécuter la commande (simulation pour l'instant)
            const result = await this.executeOriginateCommand(command);
            
            logger.info(`Call initiated successfully to ${formattedNumber}`);
            return {
                success: true,
                callId,
                message: 'Call initiated',
                phoneNumber: formattedNumber,
                command: command
            };
        } catch (error) {
            logger.error(`Failed to initiate call: ${error.message}`);
            this.activeCalls.delete(callId);
            throw error;
        }
    }

    /**
     * Construire la commande originate
     */
    buildOriginateCommand(callId, phoneNumber, scriptType) {
        return `originate {` +
            `origination_uuid=${callId},` +
            `medical_script_type=${scriptType},` +
            `medical_patient_phone=${phoneNumber},` +
            `origination_caller_id_name='Centre Medical',` +
            `origination_caller_id_number='111111',` +
            `ignore_early_media=true` +
            `}sofia/gateway/zadarma/${phoneNumber} ` +
            `&execute_extension(medical_call_${phoneNumber.replace('+', '')} XML medical)`;
    }

    /**
     * Exécuter la commande originate (simulation)
     */
    async executeOriginateCommand(command) {
        return new Promise((resolve, reject) => {
            // Simulation de l'exécution de la commande
            logger.info(`Executing command: ${command}`);
            
            setTimeout(() => {
                // Simuler une réponse positive
                resolve({
                    success: true,
                    response: '+OK'
                });
            }, 2000);
        });
    }

    /**
     * Appel avec script médical personnalisé
     */
    async callWithMedicalScript(phoneNumber, questions) {
        const callId = uuidv4();
        const formattedNumber = this.formatBelgianNumber(phoneNumber);
        
        logger.info(`Initiating custom medical script call to ${formattedNumber}`, { callId });
        
        // Stocker le script personnalisé
        await this.storeCustomScript(callId, questions);
        
        const command = `originate {` +
            `origination_uuid=${callId},` +
            `medical_script_type=custom,` +
            `medical_script_id=${callId},` +
            `medical_patient_phone=${phoneNumber}` +
            `}sofia/gateway/zadarma/${formattedNumber} ` +
            `&execute_extension(medical_ivr_${phoneNumber.replace('+', '')} XML medical)`;
        
        try {
            const result = await this.executeOriginateCommand(command);
            
            return {
                success: true,
                callId,
                phoneNumber: formattedNumber,
                command: command
            };
        } catch (error) {
            logger.error(`Failed to initiate custom script call: ${error.message}`);
            throw error;
        }
    }

    /**
     * Récupérer l'état d'un appel
     */
    async getCallStatus(callId) {
        if (!this.activeCalls.has(callId)) {
            return {
                exists: false,
                status: 'Not found'
            };
        }

        const callData = this.activeCalls.get(callId);
        
        return {
            exists: true,
            status: 'Active',
            callId: callId,
            phoneNumber: callData.phoneNumber,
            scriptType: callData.scriptType,
            startTime: callData.timestamp,
            duration: Date.now() - new Date(callData.timestamp).getTime()
        };
    }

    /**
     * Arrêter un appel en cours
     */
    async hangupCall(callId, reason = 'NORMAL_CLEARING') {
        const command = `uuid_kill ${callId} ${reason}`;
        
        logger.info(`Hanging up call ${callId} with reason: ${reason}`);
        
        try {
            // Simulation de l'arrêt d'appel
            this.activeCalls.delete(callId);
            
            return {
                success: true,
                message: 'Call terminated',
                callId: callId
            };
        } catch (error) {
            logger.error(`Failed to hangup call: ${error.message}`);
            throw error;
        }
    }

    /**
     * Jouer un message TTS pendant l'appel
     */
    async playTTS(callId, text, language = 'fr') {
        const command = `uuid_broadcast ${callId} speak::tts_commandline|${language}|${text}`;
        
        logger.info(`Playing TTS for call ${callId}: ${text}`);
        
        try {
            // Simulation de la lecture TTS
            return {
                success: true,
                callId: callId,
                text: text,
                language: language
            };
        } catch (error) {
            logger.error(`Failed to play TTS: ${error.message}`);
            throw error;
        }
    }

    /**
     * Envoyer des DTMF
     */
    async sendDTMF(callId, digits) {
        const command = `uuid_send_dtmf ${callId} ${digits}`;
        
        logger.info(`Sending DTMF to call ${callId}: ${digits}`);
        
        try {
            // Simulation de l'envoi DTMF
            return {
                success: true,
                callId: callId,
                digits: digits
            };
        } catch (error) {
            logger.error(`Failed to send DTMF: ${error.message}`);
            throw error;
        }
    }

    /**
     * Formater un numéro belge
     */
    formatBelgianNumber(phoneNumber) {
        // Nettoyer le numéro
        let clean = phoneNumber.replace(/[^\d+]/g, '');
        
        // Si commence par 0, remplacer par +32
        if (clean.startsWith('0')) {
            clean = '+32' + clean.substring(1);
        }
        // Si commence par 32, ajouter +
        else if (clean.startsWith('32')) {
            clean = '+' + clean;
        }
        // Si ne commence pas par +, ajouter +32
        else if (!clean.startsWith('+')) {
            clean = '+32' + clean;
        }
        
        return clean;
    }

    /**
     * Stocker un script personnalisé
     */
    async storeCustomScript(callId, questions) {
        const script = {
            callId: callId,
            questions: questions,
            timestamp: new Date().toISOString()
        };
        
        logger.info(`Storing custom script for call ${callId}`, { questions: questions.length });
        
        // Ici vous pourriez stocker dans une base de données
        // Pour l'instant, on simule
        return script;
    }

    /**
     * Traiter les résultats médicaux
     */
    async processMedicalResults(data) {
        logger.info('Processing medical results', data);
        
        const analysis = {
            callId: data.callId,
            patientPhone: data.phoneNumber,
            results: {
                healthScore: parseInt(data.healthScore) || 0,
                medicationCompliance: data.medicationTaken === '1',
                appointmentRequested: data.appointmentNeeded === '1'
            },
            recordingPath: data.recordingFile,
            analysisDate: new Date()
        };
        
        // Déterminer les actions de suivi
        if (analysis.results.healthScore <= 3) {
            analysis.urgency = 'HIGH';
            analysis.action = 'Immediate medical attention required';
        } else if (analysis.results.healthScore <= 6) {
            analysis.urgency = 'MEDIUM';
            analysis.action = 'Schedule follow-up within 48 hours';
        } else {
            analysis.urgency = 'LOW';
            analysis.action = 'Continue current treatment';
        }
        
        logger.info('Medical analysis completed', analysis);
        
        // Émettre l'événement
        this.emit('medical.analysis.complete', analysis);
        
        return analysis;
    }

    /**
     * Obtenir les appels actifs
     */
    getActiveCalls() {
        return Array.from(this.activeCalls.values());
    }

    /**
     * Obtenir le statut du service
     */
    getStatus() {
        return {
            connected: this.isConnected,
            activeCalls: this.activeCalls.size,
            host: this.config.host,
            port: this.config.port
        };
    }

    /**
     * Déconnexion
     */
    async disconnect() {
        logger.info('Disconnecting from FreeSWITCH ESL...');
        this.isConnected = false;
        this.activeCalls.clear();
        logger.info('Disconnected from FreeSWITCH ESL');
    }
}

module.exports = FreeSwitchMedicalService;
