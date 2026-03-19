const { Router } = require('express');
const router = Router();

// GET /sessions/token/:token — Público
router.get('/token/:token', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// GET /sessions — Empresa (filtros: estado, cargo, fecha)
router.get('/', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// GET /sessions/:id — Empresa | Candidato propio
router.get('/:id', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// POST /sessions — Empresa
router.post('/', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// PUT /sessions/:id/status — Empresa
router.put('/:id/status', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// POST /sessions/:id/start — Candidato propio
router.post('/:id/start', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// POST /sessions/:id/complete — Candidato propio
router.post('/:id/complete', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

module.exports = router;
