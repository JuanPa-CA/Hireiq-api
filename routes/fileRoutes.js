const { Router } = require('express');
const router = Router();

// POST /files/cv — Candidato
router.post('/cv', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// GET /files/cv/:candidateId — Empresa | Candidato propio
router.get('/cv/:candidateId', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

// DELETE /files/cv — Candidato
router.delete('/cv', (req, res) => res.status(501).json({ success: false, message: 'Not implemented' }));

module.exports = router;
