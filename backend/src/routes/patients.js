const express = require('express');
const router = express.Router();

// Route de test pour les patients
router.get('/test', (req, res) => {
  res.json({ message: 'Patients route working' });
});

// Route pour lister les patients (placeholder)
router.get('/', (req, res) => {
  res.json({ 
    message: 'List patients endpoint - à implémenter',
    patients: []
  });
});

// Route pour obtenir un patient (placeholder)
router.get('/:id', (req, res) => {
  res.json({ 
    message: 'Get patient endpoint - à implémenter',
    patientId: req.params.id
  });
});

module.exports = router;
