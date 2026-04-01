const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HireIQ API',
      version: '1.0.0',
      description: 'API REST para gestión de entrevistas técnicas con IA (Gemini).',
    },

    servers: [
      { url: `http://localhost:${process.env.PORT || 3000}/api/v1` },
    ],

    tags: [
      { name: 'Auth', description: 'Autenticación y gestión de cuenta' },
      { name: 'Companies', description: 'Gestión de empresas' },
      { name: 'Positions', description: 'Gestión de cargos/posiciones' },
      { name: 'Questions', description: 'Banco de preguntas' },
      { name: 'Sessions', description: 'Sesiones de entrevista' },
      { name: 'Answers', description: 'Respuestas y evaluaciones' },
      { name: 'Reports', description: 'Reportes y analítica' },
      { name: 'Files', description: 'Gestión de archivos (CV)' },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },

      responses: {
        ValidationError: {
          description: 'Error de validación de campos',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorValidacion' },
            },
          },
        },
        UnauthorizedError: {
          description: 'Token ausente, inválido o expirado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorSimple' },
            },
          },
        },
        ForbiddenError: {
          description: 'No tiene permisos para acceder a este recurso',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorSimple' },
            },
          },
        },
        NotFoundError: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorSimple' },
            },
          },
        },
      },

      schemas: {

        // ===== ERRORS =====
        ErrorValidacion: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Descripción del error' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  msg: { type: 'string' },
                },
              },
            },
            code: { type: 'string', example: 'VALIDATION_ERROR' },
          },
        },

        ErrorSimple: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Descripción del error' },
            code: { type: 'string', example: 'ERROR_CODE' },
          },
        },

        // ===== AUTH =====
        RegisterInput: {
          type: 'object',
          required: ['nombre', 'email', 'password'],
          properties: {
            nombre: { type: 'string', example: 'Juan Pérez' },
            email: { type: 'string', example: 'juan@email.com' },
            password: { type: 'string', example: 'Password123' },
          },
        },

        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'user@hireiq.com' },
            password: { type: 'string', example: 'Password123' },
          },
        },

        // ===== CORE =====
        CompanyInput: {
          type: 'object',
          required: ['nombre', 'email_contacto'],
          properties: {
            nombre: { type: 'string' },
            email_contacto: { type: 'string' },
            plan: { type: 'string', enum: ['free', 'pro', 'enterprise'] },
          },
        },

        PositionInput: {
          type: 'object',
          required: ['titulo', 'nivel'],
          properties: {
            titulo: { type: 'string' },
            nivel: { type: 'string', enum: ['junior', 'mid', 'senior'] },
            tecnologias: { type: 'array', items: { type: 'string' } },
            descripcion: { type: 'string' },
          },
        },

        QuestionInput: {
          type: 'object',
          required: ['position_id', 'pregunta', 'categoria', 'dificultad'],
          properties: {
            position_id: { type: 'string' },
            pregunta: { type: 'string' },
            categoria: { type: 'string' },
            dificultad: { type: 'string', enum: ['facil', 'medio', 'dificil'] },
          },
        },

        QuestionGenerateInput: {
          type: 'object',
          required: ['position_id'],
          properties: {
            position_id: { type: 'string' },
            cantidad: { type: 'integer', default: 5 },
            dificultad: { type: 'string', enum: ['facil', 'medio', 'dificil'] },
            categoria: { type: 'string' },
          },
        },

        AnswerInput: {
          type: 'object',
          required: ['session_id', 'question_id', 'respuesta_texto'],
          properties: {
            session_id: { type: 'string' },
            question_id: { type: 'string' },
            respuesta_texto: { type: 'string' },
          },
        },

        SessionInput: {
          type: 'object',
          required: ['candidate_id', 'position_id'],
          properties: {
            candidate_id: { type: 'string' },
            position_id: { type: 'string' },
            preguntas: { type: 'array', items: { type: 'string' } },
            fecha_expiracion: { type: 'string', format: 'date-time' },
          },
        },

      },
    },

    paths: {

      // ===== AUTH =====
      '/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Registrar un nuevo usuario (Candidato)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterInput' },
              },
            },
          },
          responses: {
            201: { description: 'Usuario registrado exitosamente' },
            400: { $ref: '#/components/responses/ValidationError' },
            409: { description: 'Email ya registrado' },
          },
        },
      },

      '/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Iniciar sesión',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginInput' },
              },
            },
          },
          responses: {
            200: { description: 'Login exitoso' },
            400: { $ref: '#/components/responses/ValidationError' },
            401: { description: 'Credenciales inválidas' },
          },
        },
      },

      '/auth/refresh': {
        post: {
          tags: ['Auth'],
          summary: 'Refrescar token de acceso',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['refreshToken'],
                  properties: { refreshToken: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Token refrescado correctamente' },
            401: { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },

      '/auth/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Cerrar sesión',
          security: [{ bearerAuth: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { refreshToken: { type: 'string' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Sesión cerrada correctamente' },
            401: { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },

      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Obtener perfil del usuario actual',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Perfil obtenido correctamente' },
            401: { $ref: '#/components/responses/UnauthorizedError' },
          },
        },
      },

      '/auth/change-password': {
        put: {
          tags: ['Auth'],
          summary: 'Cambiar contraseña',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['oldPassword', 'newPassword'],
                  properties: {
                    oldPassword: { type: 'string' },
                    newPassword: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Contraseña actualizada correctamente' },
            401: { description: 'Contraseña actual incorrecta' },
          },
        },
      },

      // ===== COMPANIES =====
      '/companies': {
        get: {
          tags: ['Companies'],
          summary: 'Obtener todas las empresas (Admin)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Lista de empresas' },
            401: { $ref: '#/components/responses/UnauthorizedError' },
            403: { $ref: '#/components/responses/ForbiddenError' },
          },
        },
        post: {
          tags: ['Companies'],
          summary: 'Crear una nueva empresa (Admin)',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CompanyInput' },
              },
            },
          },
          responses: {
            201: { description: 'Empresa creada exitosamente' },
            400: { $ref: '#/components/responses/ValidationError' },
          },
        },
      },

      '/companies/{id}': {
        get: {
          tags: ['Companies'],
          summary: 'Obtener una empresa por ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Detalle de la empresa' },
            401: { $ref: '#/components/responses/UnauthorizedError' },
            404: { $ref: '#/components/responses/NotFoundError' },
          },
        },
        put: {
          tags: ['Companies'],
          summary: 'Actualizar una empresa',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CompanyInput' },
              },
            },
          },
          responses: {
            200: { description: 'Empresa actualizada correctamente' },
            400: { $ref: '#/components/responses/ValidationError' },
            404: { $ref: '#/components/responses/NotFoundError' },
          },
        },
        delete: {
          tags: ['Companies'],
          summary: 'Eliminar una empresa (Soft Delete)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            204: { description: 'Empresa eliminada exitosamente' },
            404: { $ref: '#/components/responses/NotFoundError' },
          },
        },
      },

      // ===== POSITIONS =====
      '/positions': {
        get: {
          tags: ['Positions'],
          summary: 'Obtener cargos de la empresa',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Lista de cargos' } },
        },
        post: {
          tags: ['Positions'],
          summary: 'Crear un nuevo cargo',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PositionInput' },
              },
            },
          },
          responses: { 201: { description: 'Cargo creado' } },
        },
      },

      '/positions/{id}': {
        get: {
          tags: ['Positions'],
          summary: 'Obtener un cargo por ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Detalle del cargo' } },
        },
        put: {
          tags: ['Positions'],
          summary: 'Actualizar un cargo',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PositionInput' },
              },
            },
          },
          responses: { 200: { description: 'Cargo actualizado' } },
        },
        delete: {
          tags: ['Positions'],
          summary: 'Eliminar un cargo (Soft Delete)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 204: { description: 'Cargo eliminado' } },
        },
      },

      // ===== QUESTIONS =====
      '/questions': {
        get: {
          tags: ['Questions'],
          summary: 'Obtener preguntas de la empresa',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'position_id', in: 'query', schema: { type: 'string' } },
            { name: 'categoria', in: 'query', schema: { type: 'string' } },
            { name: 'dificultad', in: 'query', schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Lista de preguntas' } },
        },
        post: {
          tags: ['Questions'],
          summary: 'Crear pregunta manualmente',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/QuestionInput' },
              },
            },
          },
          responses: { 201: { description: 'Pregunta creada' } },
        },
      },

      '/questions/{id}': {
        get: {
          tags: ['Questions'],
          summary: 'Obtener una pregunta por ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Detalle de la pregunta' } },
        },
        put: {
          tags: ['Questions'],
          summary: 'Actualizar una pregunta',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/QuestionInput' },
              },
            },
          },
          responses: { 200: { description: 'Pregunta actualizada' } },
        },
        delete: {
          tags: ['Questions'],
          summary: 'Eliminar una pregunta (Soft Delete)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 204: { description: 'Pregunta eliminada' } },
        },
      },

      '/questions/generate-ai': {
        post: {
          tags: ['Questions'],
          summary: 'Generar preguntas usando Gemini AI',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/QuestionGenerateInput' },
              },
            },
          },
          responses: { 201: { description: 'Preguntas generadas con éxito' } },
        },
      },

      '/questions/suggest-category': {
        post: {
          tags: ['Questions'],
          summary: 'Sugerir categoría usando Gemini AI',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['pregunta'],
                  properties: { pregunta: { type: 'string' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Sugerencia obtenida' } },
        },
      },

      // ===== SESSIONS =====
      '/sessions': {
        get: {
          tags: ['Sessions'],
          summary: 'Obtener sesiones de la empresa',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Lista de sesiones' } },
        },
        post: {
          tags: ['Sessions'],
          summary: 'Crear una nueva sesión de entrevista',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SessionInput' },
              },
            },
          },
          responses: { 201: { description: 'Sesión creada' } },
        },
      },

      '/sessions/{id}': {
        get: {
          tags: ['Sessions'],
          summary: 'Obtener sesión por ID',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Detalle de la sesión' } },
        },
      },

      '/sessions/{id}/status': {
        put: {
          tags: ['Sessions'],
          summary: 'Actualizar estado de la sesión',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['estado'],
                  properties: {
                    estado: { type: 'string', enum: ['pendiente', 'en_curso', 'completada', 'expirada'] },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Estado actualizado' } },
        },
      },

      '/sessions/token/{token}': {
        get: {
          tags: ['Sessions'],
          summary: 'Validar token de acceso de candidato',
          parameters: [{ name: 'token', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Token válido' } },
        },
      },

      '/sessions/{id}/start': {
        post: {
          tags: ['Sessions'],
          summary: 'Iniciar sesión por el candidato',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Sesión iniciada' } },
        },
      },

      '/sessions/{id}/complete': {
        post: {
          tags: ['Sessions'],
          summary: 'Completar sesión por el candidato',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Sesión completada' } },
        },
      },

      // ===== ANSWERS =====
      '/answers': {
        post: {
          tags: ['Answers'],
          summary: 'Crear una respuesta y evaluarla con Gemini AI',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AnswerInput' },
              },
            },
          },
          responses: { 201: { description: 'Respuesta guardada' } },
        },
      },

      '/answers/{id}': {
        put: {
          tags: ['Answers'],
          summary: 'Actualizar una respuesta (Candidato)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['respuesta_texto'],
                  properties: { respuesta_texto: { type: 'string' } },
                },
              },
            },
          },
          responses: { 200: { description: 'Respuesta actualizada' } },
        },
      },

      '/answers/session/{sessionId}': {
        get: {
          tags: ['Answers'],
          summary: 'Obtener respuestas de una sesión',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Lista de respuestas' } },
        },
      },

      '/answers/{id}/evaluate': {
        post: {
          tags: ['Answers'],
          summary: 'Re-evaluar respuesta (Admin)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Re-evaluación completada' } },
        },
      },

      // ===== REPORTS =====
      '/reports/session/{id}': {
        get: {
          tags: ['Reports'],
          summary: 'Obtener reporte detallado de una sesión',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Reporte de sesión' } },
        },
      },

      '/reports/company/summary': {
        get: {
          tags: ['Reports'],
          summary: 'Resumen estadístico de la empresa',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Resumen de empresa' } },
        },
      },

      '/reports/candidate/{id}': {
        get: {
          tags: ['Reports'],
          summary: 'Historial de entrevistas de un candidato',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Historial del candidato' } },
        },
      },

      '/reports/position/{id}/insights': {
        get: {
          tags: ['Reports'],
          summary: 'Insights de IA sobre una posición',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Insights de posición' } },
        },
      },

      // ===== FILES =====
      '/files/cv': {
        post: {
          tags: ['Files'],
          summary: 'Cargar CV del candidato',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    file: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'CV cargado' } },
        },
        delete: {
          tags: ['Files'],
          summary: 'Eliminar CV propio',
          security: [{ bearerAuth: [] }],
          responses: { 204: { description: 'CV eliminado' } },
        },
      },

      '/files/cv/{candidateId}': {
        get: {
          tags: ['Files'],
          summary: 'Obtener CV por ID de candidato',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'candidateId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Archivo CV' } },
        },
      },

    },
  },

  apis: [],
};

module.exports = swaggerJsdoc(options);
