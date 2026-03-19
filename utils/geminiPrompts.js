const buildGenerateQuestionsPrompt = ({ tituloCargo, nivel, tecnologias, cantidad, dificultad, categoria }) => {
  const tecnologiasStr = Array.isArray(tecnologias) ? tecnologias.join(', ') : tecnologias;
  return `Eres un experto en evaluación técnica de desarrolladores de software.
Genera exactamente ${cantidad} preguntas de entrevista técnica para el cargo de ${tituloCargo}.
Nivel requerido: ${nivel}. Tecnologías principales: ${tecnologiasStr}.
Dificultad solicitada: ${dificultad}. Categoría: ${categoria}.
Responde ÚNICAMENTE con un JSON válido con esta estructura:
{ "preguntas": [{ "pregunta": "...", "categoria": "...", "dificultad": "..." }] }.
Sin texto adicional.`;
};

const buildEvaluateAnswerPrompt = ({ tituloCargo, nivel, tecnologias, dificultad, pregunta, respuesta }) => {
  const tecnologiasStr = Array.isArray(tecnologias) ? tecnologias.join(', ') : tecnologias;
  return `Eres un evaluador técnico senior especializado en entrevistas de desarrollo de software.
Evalúa la siguiente respuesta de un candidato:
CARGO: ${tituloCargo} (${nivel}) | TECNOLOGÍAS: ${tecnologiasStr} | DIFICULTAD: ${dificultad}
PREGUNTA: ${pregunta}
RESPUESTA DEL CANDIDATO: ${respuesta}
Responde ÚNICAMENTE con JSON:
{ "puntaje": 0-10, "fortalezas": ["..."], "debilidades": ["..."], "feedback": "máx 300 palabras" }`;
};

module.exports = {
  buildGenerateQuestionsPrompt,
  buildEvaluateAnswerPrompt
};
