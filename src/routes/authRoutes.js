const { Router } = require('express');
const router = Router();

// POST /auth/register — Público
router.post('/register', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// POST /auth/login — Público
router.post('/login', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// POST /auth/refresh — Autenticado
router.post('/refresh', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// POST /auth/logout — Autenticado
router.post('/logout', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// GET /auth/me — Autenticado
router.get('/me', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// PUT /auth/change-password — Autenticado
router.put('/change-password', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

module.exports = router;
