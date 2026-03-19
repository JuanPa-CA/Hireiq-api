const { Router } = require('express');
const router = Router();

// GET /reports/session/:id — Empresa | Candidato propio
router.get('/session/:id', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// GET /reports/company/summary — Empresa
router.get('/company/summary', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// GET /reports/candidate/:id — Empresa | Admin
router.get('/candidate/:id', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// GET /reports/position/:id/insights — Empresa
router.get('/position/:id/insights', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

module.exports = router;
