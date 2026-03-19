const { Router } = require('express');
const router = Router();

// GET /positions — Empresa
router.get('/', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// GET /positions/:id — Empresa propia
router.get('/:id', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// POST /positions — Empresa
router.post('/', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// PUT /positions/:id — Empresa propia
router.put('/:id', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// DELETE /positions/:id — Empresa propia (soft delete)
router.delete('/:id', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

module.exports = router;
