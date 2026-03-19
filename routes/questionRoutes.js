const { Router } = require('express');
const router = Router();

// GET /questions — Empresa (filtros: cargo, categoría, dificultad)
router.get('/', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// GET /questions/:id — Empresa propia
router.get('/:id', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// POST /questions — Empresa (manual)
router.post('/', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// PUT /questions/:id — Empresa propia
router.put('/:id', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// DELETE /questions/:id — Empresa propia (soft delete)
router.delete('/:id', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// POST /questions/generate-ai — Empresa
router.post('/generate-ai', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// POST /questions/suggest-category — Empresa
router.post('/suggest-category', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

module.exports = router;
