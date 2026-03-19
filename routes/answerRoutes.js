const { Router } = require('express');
const router = Router();

// POST /answers — Candidato
router.post('/', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// PUT /answers/:id — Candidato propio
router.put('/:id', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// GET /answers/session/:sessionId — Empresa | Candidato propio
router.get('/session/:sessionId', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// POST /answers/:id/evaluate — Sistema / Admin
router.post('/:id/evaluate', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

module.exports = router;
