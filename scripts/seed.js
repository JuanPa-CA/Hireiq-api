require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('../src/models/Company');
const User = require('../src/models/User');
const JobPosition = require('../src/models/JobPosition');
const Question = require('../src/models/Question');

const seedData = async () => {
  try {
    // 1. Conectar a la base de datos
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Conectado para Seeding...');

    // 2. Limpiar datos existentes
    await Company.deleteMany({});
    await User.deleteMany({});
    await JobPosition.deleteMany({});
    await Question.deleteMany({});
    console.log('Datos antiguos eliminados.');

    // 3. Crear Empresa de prueba
    const company = await Company.create({
      nombre: 'TalentAI Corp',
      email_contacto: 'hr@talentai.com',
      plan: 'pro',
      activa: true
    });
    console.log('Empresa creada:', company.nombre);

    // 4. Crear Usuarios
    // Admin (sin company_id)
    await User.create({
      nombre: 'Admin HireIQ',
      email: 'admin@hireiq.com',
      password: 'Password123!',
      rol: 'admin',
      activo: true
    });

    // Reclutador de la empresa
    const recruiter = await User.create({
      company_id: company._id,
      nombre: 'Juan Reclutador',
      email: 'juan@talentai.com',
      password: 'Password123!',
      rol: 'empresa',
      activo: true
    });

    // Candidato
    await User.create({
      nombre: 'Candidato de Prueba',
      email: 'candidato@gmail.com',
      password: 'Password123!',
      rol: 'candidato',
      activo: true
    });
    console.log('Usuarios base creados (Password: Password123!)');

    // 5. Crear Cargo Técnico
    const position = await JobPosition.create({
      company_id: company._id,
      titulo: 'Fullstack Developer (Node/React)',
      nivel: 'mid',
      tecnologias: ['Node.js', 'React', 'MongoDB', 'Express'],
      descripcion: 'Buscamos un desarrollador con experiencia en el stack MERN.',
      activo: true
    });
    console.log('Cargo creado:', position.titulo);

    // 6. Crear Preguntas iniciales
    const questions = [
      {
        company_id: company._id,
        position_id: position._id,
        pregunta: '¿Cuál es la diferencia entre let, const y var en JavaScript?',
        categoria: 'JavaScript',
        dificultad: 'facil',
        activa: true
      },
      {
        company_id: company._id,
        position_id: position._id,
        pregunta: 'Explica el funcionamiento del Event Loop en Node.js.',
        categoria: 'Node.js',
        dificultad: 'medio',
        activa: true
      },
      {
        company_id: company._id,
        position_id: position._id,
        pregunta: '¿Qué es el Virtual DOM en React y cómo mejora el rendimiento?',
        categoria: 'React',
        dificultad: 'medio',
        activa: true
      },
      {
        company_id: company._id,
        position_id: position._id,
        pregunta: 'Diseña un esquema de base de datos para un sistema de comercio electrónico.',
        categoria: 'Diseño de Sistemas',
        dificultad: 'dificil',
        activa: true
      }
    ];

    await Question.insertMany(questions);
    console.log(`${questions.length} preguntas insertadas.`);

    console.log('Seeding completado con éxito.');
    process.exit(0);
  } catch (error) {
    console.error('Error durante el seeding:', error);
    process.exit(1);
  }
};

seedData();