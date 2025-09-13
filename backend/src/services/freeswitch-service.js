/**
 * Service FreeSWITCH pour HelloJADE
 * Gère les appels médicaux via FreeSWITCH + Zadarma
 */

const EventSocket = require('freeswitch-esl');
const fs = require('fs');
const path = require('path');

class FreeSWITCHService {
    constructor() {
        this.conn = null;
        this.isConnected = false;
        this.callbacks = new Map();
        this.recordings = new Map();
    }

    /**
     * Connexion à FreeSWITCH via ESL
     */
    async connect() {
        try {
            this.conn = new EventSocket('127.0.0.1', 8021, 'ClueCon');
            
            this.conn.on('connect', () => {
                console.log('✅ Connexion FreeSWITCH établie');
                this.isConnected = true;
            });

            this.conn.on('disconnect', () => {
                console.log('❌ Connexion FreeSWITCH fermée');
                this.isConnected = false;
            });

            this.conn.on('error', (error) => {
                console.error('❌ Erreur FreeSWITCH:', error);
                this.isConnected = false;
            });

            // Écouter les événements d'appel
            this.conn.on('CHANNEL_ANSWER', (event) => {
                console.log('📞 Appel décroché:', event.getHeader('Caller-Caller-ID-Number'));
            });

            this.conn.on('CHANNEL_HANGUP', (event) => {
                const uuid = event.getHeader('Unique-ID');
                const cause = event.getHeader('Hangup-Cause');
                console.log(`📞 Appel terminé: ${uuid}, Cause: ${cause}`);
                
                // Traiter l'enregistrement si disponible
                if (this.recordings.has(uuid)) {
                    this.processRecording(uuid, this.recordings.get(uuid));
                }
            });

            this.conn.on('RECORD_STOP', (event) => {
                const uuid = event.getHeader('Unique-ID');
                const file = event.getHeader('Record-File-Path');
                console.log(`🎙️ Enregistrement terminé: ${file}`);
                this.recordings.set(uuid, file);
            });

            await this.conn.connect();
            return true;
        } catch (error) {
            console.error('❌ Erreur de connexion FreeSWITCH:', error);
            throw error;
        }
    }

    /**
     * Initier un appel médical
     */
    async initiateMedicalCall(patientPhone, medicalScript, hospitalId = 'zadarma') {
        try {
            if (!this.isConnected) {
                await this.connect();
            }

            // Nettoyer le numéro de téléphone
            const cleanPhone = this.cleanPhoneNumber(patientPhone);
            
            // Générer un UUID unique pour l'appel
            const callUuid = this.generateUUID();
            
            // Construire la commande d'appel
            const command = `originate {origination_caller_id_number=+32480206284,origination_caller_id_name='Service Medical',origination_uuid=${callUuid}} sofia/gateway/zadarma/${cleanPhone} &park()`;
            
            console.log(`📞 Initiation d'appel médical vers ${cleanPhone}`);
            console.log(`🔧 Commande: ${command}`);
            
            // Exécuter l'appel
            const result = await this.conn.api(command);
            
            if (result && result.body && result.body.includes('+OK')) {
                console.log(`✅ Appel initié avec succès: ${callUuid}`);
                
                // Programmer l'enregistrement
                await this.startRecording(callUuid, hospitalId, cleanPhone);
                
                // Exécuter le script médical
                await this.executeMedicalScript(callUuid, medicalScript);
                
                return {
                    success: true,
                    callId: callUuid,
                    patientPhone: cleanPhone,
                    hospitalId: hospitalId,
                    status: 'initiated'
                };
            } else {
                throw new Error(`Échec de l'appel: ${result?.body || 'Erreur inconnue'}`);
            }
        } catch (error) {
            console.error('❌ Erreur lors de l\'initiation de l\'appel:', error);
            throw error;
        }
    }

    /**
     * Démarrer l'enregistrement de l'appel
     */
    async startRecording(callUuid, hospitalId, patientPhone) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `medical_${hospitalId}_${patientPhone}_${timestamp}`;
            const recordingPath = `C:\\Program Files\\FreeSWITCH\\recordings\\${filename}.wav`;
            
            const command = `uuid_record ${callUuid} start ${recordingPath}`;
            const result = await this.conn.api(command);
            
            if (result && result.body && result.body.includes('+OK')) {
                console.log(`🎙️ Enregistrement démarré: ${recordingPath}`);
                return recordingPath;
            } else {
                throw new Error(`Échec de l'enregistrement: ${result?.body || 'Erreur inconnue'}`);
            }
        } catch (error) {
            console.error('❌ Erreur lors du démarrage de l\'enregistrement:', error);
            throw error;
        }
    }

    /**
     * Exécuter le script médical
     */
    async executeMedicalScript(callUuid, script) {
        try {
            // Attendre que l'appel soit décroché
            await this.waitForAnswer(callUuid);
            
            // Exécuter le script étape par étape
            for (const step of script.steps) {
                await this.executeScriptStep(callUuid, step);
            }
            
            console.log(`✅ Script médical exécuté pour l'appel ${callUuid}`);
        } catch (error) {
            console.error('❌ Erreur lors de l\'exécution du script médical:', error);
            throw error;
        }
    }

    /**
     * Exécuter une étape du script
     */
    async executeScriptStep(callUuid, step) {
        try {
            switch (step.type) {
                case 'playback':
                    await this.conn.api(`uuid_broadcast ${callUuid} ${step.audio} aleg`);
                    break;
                    
                case 'tts':
                    // Utiliser le TTS intégré de FreeSWITCH
                    const ttsCommand = `uuid_broadcast ${callUuid} say:${step.voice}:${step.text} aleg`;
                    await this.conn.api(ttsCommand);
                    break;
                    
                case 'record':
                    const recordCommand = `uuid_record ${callUuid} start ${step.filename} ${step.maxDuration}`;
                    await this.conn.api(recordCommand);
                    break;
                    
                case 'sleep':
                    await this.sleep(step.duration);
                    break;
                    
                default:
                    console.warn(`⚠️ Type d'étape non supporté: ${step.type}`);
            }
        } catch (error) {
            console.error(`❌ Erreur lors de l'exécution de l'étape ${step.type}:`, error);
            throw error;
        }
    }

    /**
     * Attendre que l'appel soit décroché
     */
    async waitForAnswer(callUuid, timeout = 30000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Timeout: Appel non décroché'));
            }, timeout);

            const checkAnswer = (event) => {
                if (event.getHeader('Unique-ID') === callUuid) {
                    clearTimeout(timeoutId);
                    this.conn.off('CHANNEL_ANSWER', checkAnswer);
                    resolve();
                }
            };

            this.conn.on('CHANNEL_ANSWER', checkAnswer);
        });
    }

    /**
     * Traiter l'enregistrement après l'appel
     */
    async processRecording(callUuid, recordingPath) {
        try {
            if (fs.existsSync(recordingPath)) {
                console.log(`🎙️ Traitement de l'enregistrement: ${recordingPath}`);
                
                // Ici vous pouvez ajouter le traitement IA
                // - Transcription avec Whisper
                // - Analyse médicale avec Rasa
                // - Scoring de l'état de santé
                
                return {
                    callId: callUuid,
                    recordingPath: recordingPath,
                    processed: true
                };
            } else {
                console.warn(`⚠️ Fichier d'enregistrement non trouvé: ${recordingPath}`);
                return null;
            }
        } catch (error) {
            console.error('❌ Erreur lors du traitement de l\'enregistrement:', error);
            throw error;
        }
    }

    /**
     * Nettoyer le numéro de téléphone
     */
    cleanPhoneNumber(phone) {
        // Supprimer tous les caractères non numériques sauf +
        let clean = phone.replace(/[^\d+]/g, '');
        
        // Ajouter le préfixe +33 si nécessaire
        if (clean.startsWith('0')) {
            clean = '+33' + clean.substring(1);
        } else if (!clean.startsWith('+')) {
            clean = '+33' + clean;
        }
        
        return clean;
    }

    /**
     * Générer un UUID
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Attendre un délai
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Obtenir le statut de la connexion
     */
    getStatus() {
        return {
            connected: this.isConnected,
            callbacks: this.callbacks.size,
            recordings: this.recordings.size
        };
    }

    /**
     * Fermer la connexion
     */
    async disconnect() {
        if (this.conn) {
            await this.conn.disconnect();
            this.isConnected = false;
            console.log('🔌 Connexion FreeSWITCH fermée');
        }
    }
}

module.exports = FreeSWITCHService;
