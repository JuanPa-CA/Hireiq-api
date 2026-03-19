require('dotenv').config();
const express = require('express');
const morgan = require('morgan');

// Rutas
const authRoutes = require('./routes/authRoutes');
const companyRoutes = require('./routes/companyRoutes');
const positionRoutes = require('./routes/positionRoutes');
const questionRoutes = require('./routes/questionRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const answerRoutes = require('./routes/answerRoutes');
const reportRoutes = require('./routes/reportRoutes');
const fileRoutes = require('./routes/fileRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares base
app.use(morgan('dev'));
app.use(express.json());

// Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'HireIQ API running'
  });
});

// Montar rutas
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/positions', positionRoutes);
app.use('/api/v1/questions', questionRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/answers', answerRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/files', fileRoutes);

// TODO: conectar MongoDB

// Exportar app para testing
if (require.main === module) {
  app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
}

module.exports = app;
