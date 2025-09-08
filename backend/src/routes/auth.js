const express = require('express');
const router = express.Router();

// Route de test pour l'authentification
router.get('/test', (req, res) => {
  res.json({ message: 'Auth route working' });
});

// Route de connexion (placeholder)
router.post('/login', (req, res) => {
  res.json({ 
    message: 'Login endpoint - à implémenter',
    token: 'placeholder-token'
  });
});

// Route de déconnexion (placeholder)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout endpoint - à implémenter' });
});

module.exports = router;
