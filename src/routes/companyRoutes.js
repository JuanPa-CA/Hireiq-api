const { Router } = require('express');
const router = Router();

// GET /companies — Admin
router.get('/', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// GET /companies/:id — Admin | Empresa propia
router.get('/:id', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// POST /companies — Admin
router.post('/', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// PUT /companies/:id — Admin | Empresa propia
router.put('/:id', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// DELETE /companies/:id — Admin (soft delete)
router.delete('/:id', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

module.exports = router;
