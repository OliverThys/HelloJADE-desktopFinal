const express = require('express');
const router = express.Router();
const AsteriskService = require('../services/AsteriskService');
const { body, validationResult } = require('express-validator');

const asteriskService = new AsteriskService();

// Initialize Asterisk connection
asteriskService.connect().catch(error => {
  console.warn('Asterisk connection failed, continuing without telephony:', error.message);
});

// Middleware to check Asterisk connection
const checkAsteriskConnection = (req, res, next) => {
  if (!asteriskService.connected) {
    return res.status(503).json({
      error: 'Service Asterisk non disponible',
      message: 'Le service téléphonique n\'est pas connecté'
    });
  }
  next();
};

// POST /api/calls/medical - Lancer appel médical
router.post('/medical', [
  body('hospitalId').notEmpty().withMessage('ID hôpital requis'),
  body('patientNumber').isMobilePhone().withMessage('Numéro de téléphone invalide'),
  body('patientId').notEmpty().withMessage('ID patient requis'),
  body('patientName').notEmpty().withMessage('Nom patient requis'),
  body('patientFirstName').notEmpty().withMessage('Prénom patient requis')
], checkAsteriskConnection, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { hospitalId, patientNumber, patientId, patientName, patientFirstName } = req.body;

    const callData = {
      patientId,
      patientName,
      patientFirstName,
      hospitalId,
      startTime: new Date()
    };

    const result = await asteriskService.makeMedicalCall(hospitalId, patientNumber, callData);

    res.json({
      success: true,
      callId: result.callId,
      channel: result.channel,
      message: 'Appel médical lancé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du lancement de l\'appel:', error);
    res.status(500).json({
      error: 'Erreur lors du lancement de l\'appel',
      message: error.message
    });
  }
});

// GET /api/calls/status - Statut du service
router.get('/status', (req, res) => {
  res.json({
    connected: asteriskService.connected,
    activeCalls: asteriskService.getActiveCalls().length,
    timestamp: new Date().toISOString()
  });
});

// GET /api/calls/active - Appels actifs
router.get('/active', (req, res) => {
  const activeCalls = asteriskService.getActiveCalls();
  res.json({
    calls: activeCalls,
    count: activeCalls.length
  });
});

// GET /api/calls/status/:callId - Statut d'un appel spécifique
router.get('/status/:callId', (req, res) => {
  const { callId } = req.params;
  const callStatus = asteriskService.getCallStatus(callId);

  if (!callStatus) {
    return res.status(404).json({
      error: 'Appel non trouvé',
      message: `Aucun appel trouvé avec l'ID: ${callId}`
    });
  }

  res.json({
    callId,
    status: callStatus
  });
});

// POST /api/calls/:callId/hangup - Raccrocher un appel
router.post('/:callId/hangup', checkAsteriskConnection, async (req, res) => {
  try {
    const { callId } = req.params;
    const callStatus = asteriskService.getCallStatus(callId);

    if (!callStatus) {
      return res.status(404).json({
        error: 'Appel non trouvé',
        message: `Aucun appel trouvé avec l'ID: ${callId}`
      });
    }

    await asteriskService.hangupCall(callStatus.channel);

    res.json({
      success: true,
      message: 'Appel raccroché avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du raccrochage:', error);
    res.status(500).json({
      error: 'Erreur lors du raccrochage',
      message: error.message
    });
  }
});

// POST /api/calls/:callId/start - Démarrer un appel
router.post('/:callId/start', checkAsteriskConnection, async (req, res) => {
  try {
    const { callId } = req.params;
    const callStatus = asteriskService.getCallStatus(callId);

    if (!callStatus) {
      return res.status(404).json({
        error: 'Appel non trouvé',
        message: `Aucun appel trouvé avec l'ID: ${callId}`
      });
    }

    if (callStatus.status === 'connected') {
      await asteriskService.startMedicalDialog(callStatus.channel, callStatus.callData);
    }

    res.json({
      success: true,
      message: 'Dialogue médical démarré'
    });

  } catch (error) {
    console.error('Erreur lors du démarrage du dialogue:', error);
    res.status(500).json({
      error: 'Erreur lors du démarrage du dialogue',
      message: error.message
    });
  }
});

// POST /api/calls/:callId/retry - Relancer un appel
router.post('/:callId/retry', checkAsteriskConnection, async (req, res) => {
  try {
    const { callId } = req.params;
    const callStatus = asteriskService.getCallStatus(callId);

    if (!callStatus) {
      return res.status(404).json({
        error: 'Appel non trouvé',
        message: `Aucun appel trouvé avec l'ID: ${callId}`
      });
    }

    // Relancer l'appel avec les mêmes paramètres
    const result = await asteriskService.makeMedicalCall(
      callStatus.hospitalId,
      callStatus.patientNumber,
      callStatus.callData
    );

    res.json({
      success: true,
      callId: result.callId,
      message: 'Appel relancé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la relance:', error);
    res.status(500).json({
      error: 'Erreur lors de la relance',
      message: error.message
    });
  }
});

// GET /api/calls/health - Santé du service
router.get('/health', (req, res) => {
  const health = {
    status: asteriskService.connected ? 'healthy' : 'unhealthy',
    asterisk: {
      connected: asteriskService.connected,
      host: asteriskService.config.host,
      port: asteriskService.config.port
    },
    activeCalls: asteriskService.getActiveCalls().length,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  };

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// POST /api/calls/issues - Signaler un problème
router.post('/issues', [
  body('callId').optional().isString(),
  body('category').notEmpty().withMessage('Catégorie requise'),
  body('description').notEmpty().withMessage('Description requise'),
  body('severity').optional().isIn(['low', 'medium', 'high']),
  body('email').optional().isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const issue = {
      ...req.body,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    };

    // Ici, vous pourriez sauvegarder l'issue dans une base de données
    console.log('Issue signalé:', issue);

    res.json({
      success: true,
      issueId: `issue_${Date.now()}`,
      message: 'Problème signalé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du signalement:', error);
    res.status(500).json({
      error: 'Erreur lors du signalement',
      message: error.message
    });
  }
});

// Export des appels
router.post('/export', async (req, res) => {
  try {
    const { format = 'csv', filters = {} } = req.body;

    // Simulation de données d'export
    const calls = [
      {
        id: '1',
        patientName: 'Dupont',
        patientFirstName: 'Marie',
        phoneNumber: '+33123456789',
        callStatus: 'completed',
        medicalScore: 85,
        callDate: new Date().toISOString()
      }
    ];

    if (format === 'csv') {
      const csv = 'ID,Patient,Prénom,Téléphone,Statut,Score,Date\n' +
        calls.map(call => 
          `${call.id},${call.patientName},${call.patientFirstName},${call.phoneNumber},${call.callStatus},${call.medicalScore},${call.callDate}`
        ).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=appels.csv');
      res.send(csv);
    } else if (format === 'excel') {
      // Pour Excel, vous pourriez utiliser une librairie comme xlsx
      res.json({
        error: 'Export Excel non implémenté',
        message: 'Utilisez le format CSV pour l\'instant'
      });
    } else {
      res.status(400).json({
        error: 'Format non supporté',
        message: 'Formats supportés: csv, excel'
      });
    }

  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'export',
      message: error.message
    });
  }
});

// Route pour sauvegarder les données JADE
router.post('/save-jade-data', async (req, res) => {
  try {
    const { callId, jadeData, transcript, medicalScore } = req.body;

    if (!callId || !jadeData) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Sauvegarder les données JADE dans la base de données
    const query = `
      UPDATE calls 
      SET 
        jade_data = $1,
        transcript = $2,
        medical_score = $3,
        call_status = 'completed',
        actual_call_date = NOW(),
        updated_at = NOW()
      WHERE id = $4
    `;

    // Simuler la sauvegarde (remplacer par vraie DB)
    console.log('💾 Sauvegarde des données JADE:', {
      callId,
      jadeData,
      transcript,
      medicalScore
    });

    res.json({
      success: true,
      message: 'Données JADE sauvegardées avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données JADE:', error);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde' });
  }
});

// Route pour gérer les urgences
router.post('/emergency', async (req, res) => {
  try {
    const { callId, emergencyType, patientData } = req.body;

    console.log(`🚨 URGENCE DÉTECTÉE - Appel ${callId}:`, {
      type: emergencyType,
      patient: patientData
    });

    // Ici, vous pourriez envoyer des notifications d'urgence
    // - Email au médecin
    // - SMS d'alerte
    // - Notification push
    // - Intégration avec système d'urgence

    res.json({
      success: true,
      message: 'Urgence signalée et traitée'
    });
  } catch (error) {
    console.error('Erreur lors du traitement de l\'urgence:', error);
    res.status(500).json({ error: 'Erreur lors du traitement de l\'urgence' });
  }
});

// Route pour l'export des appels
router.post('/export', async (req, res) => {
  try {
    const { format, filters } = req.body;

    // Simuler l'export (remplacer par vraie logique)
    const exportData = {
      format,
      filters,
      timestamp: new Date().toISOString(),
      data: [] // Données d'appels filtrées
    };

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=appels.csv');
      res.send('ID,Patient,Date,Statut,Score\n1,Test,2024-01-01,completed,85\n');
    } else if (format === 'excel') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=appels.xlsx');
      res.send('Excel file content here');
    } else {
      res.status(400).json({ error: 'Format non supporté' });
    }
  } catch (error) {
    console.error('Erreur lors de l\'export:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export' });
  }
});

// Route pour signaler des problèmes
router.post('/issues', async (req, res) => {
  try {
    const { callId, category, description, severity, email } = req.body;

    console.log('📝 Problème signalé:', {
      callId,
      category,
      description,
      severity,
      email
    });

    // Sauvegarder le signalement (remplacer par vraie DB)
    res.json({
      success: true,
      message: 'Problème signalé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors du signalement:', error);
    res.status(500).json({ error: 'Erreur lors du signalement' });
  }
});

module.exports = router;
