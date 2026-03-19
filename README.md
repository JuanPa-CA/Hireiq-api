# HireIQ API - Technical Interviews with AI

API REST diseñada para la gestión de entrevistas técnicas automatizadas utilizando **Gemini AI**. Permite a las empresas crear bancos de preguntas, invitar a candidatos y recibir evaluaciones automáticas basadas en IA.

## 🚀 Tecnologías

- **Runtime:** Node.js (v20+)
- **Framework:** Express
- **Base de Datos:** MongoDB + Mongoose
- **Autenticación:** JWT (Access & Refresh Tokens)
- **IA:** Gemini AI (Google)
- **Documentación:** Swagger UI (`/api-docs`)

## 🛠️ Instalación

1.  **Clonar el repositorio:**
    ```bash
    git clone https://github.com/JuanPa-CA/Hireiq-api.git
    cd Hireiq-api
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configuración (.env):**
    Asegúrate de tener el archivo `.env` configurado en la raíz con las siguientes variables obligatorias:
    - `PORT`, `MONGO_URI`, `JWT_SECRET`, `GEMINI_KEY`.

4.  **Iniciar servidor:**
    - Desarrollo: `npm run dev` (con nodemon)
    - Producción: `npm start`

## 📂 Estructura del Proyecto

- `src/config/`: Configuraciones de DB, Multer, Swagger y Gemini.
- `src/controllers/`: Lógica de negocio por recurso.
- `src/middlewares/`: Auth, validaciones y manejo de errores.
- `src/models/`: Esquemas de Mongoose.
- `src/routes/`: Definición de endpoints.
- `src/utils/`: Utilidades para JWT, paginación y prompts de IA.

## 🧪 Pruebas

Para probar los endpoints, puedes importar el archivo `postman_collection.json` en **Postman**. Todos los endpoints están organizados por recurso y contienen cuerpos de ejemplo.

## 🔒 Seguridad

- Contraseñas cifradas con **bcrypt**.
- Rate limiting en autenticación.
- Validación de esquemas con **express-validator**.

---
*Proyecto v1.0 - TalentAI Corp*
