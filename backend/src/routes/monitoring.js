const express = require('express');
const router = express.Router();

// Route de test pour le monitoring
router.get('/test', (req, res) => {
  res.json({ message: 'Monitoring route working' });
});

// Route pour les métriques (placeholder)
router.get('/metrics', (req, res) => {
  res.json({ 
    message: 'Metrics endpoint - à implémenter',
    metrics: {
      activeCalls: 0,
      totalCalls: 0,
      systemHealth: 'healthy'
    }
  });
});

// Route pour les logs (placeholder)
router.get('/logs', (req, res) => {
  res.json({ 
    message: 'Logs endpoint - à implémenter',
    logs: []
  });
});

module.exports = router;
