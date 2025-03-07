const { Configuration, OpenAIApi } = require("openai");
const multipart = require('parse-multipart');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function analyzeTextWithGPT(text) {
  console.log('Iniciando análisis con GPT');
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Eres un asistente médico experto en analizar informes de laboratorio." },
        { role: "user", content: `Analiza el siguiente informe de laboratorio y proporciona un resumen de los hallazgos principales, destacando cualquier valor anormal y su posible significado clínico: ${text}` }
      ],
      max_tokens: 500,
    });
    console.log('Análisis GPT completado');
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error en analyzeTextWithGPT:', error);
    if (error.response && error.response.status === 429) {
      throw new Error('Se ha excedido el límite de solicitudes a la API de OpenAI. Por favor, intente nuevamente más tarde.');
    }
    throw error;
  }
}

exports.handler = async function(event, context) {
  console.log('INICIO: Función analyze iniciada');

  if (event.httpMethod !== 'POST') {
    console.error('Método no permitido');
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    console.log('Parseando datos multipart');
    const { body, headers } = event;
    const boundary = multipart.getBoundary(headers['content-type']);
    const parts = multipart.Parse(Buffer.from(body, 'base64'), boundary);

    if (parts.length === 0) {
      console.error('No se recibió ningún archivo');
      throw new Error('No se recibió ningún archivo');
    }

    const { filename, data } = parts[0];
    console.log('Archivo recibido:', filename);

    const text = data.toString('utf-8').slice(0, 4000);
    console.log('Longitud del texto a analizar:', text.length);

    console.log('Iniciando análisis del texto');
    const analysis = await analyzeTextWithGPT(text);

    console.log('Análisis completado, preparando respuesta');
    const response = {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Análisis completado",
        filename: filename,
        analysis: analysis
      })
    };

    console.log('FIN: Función analyze finalizada con éxito');
    return response;
  } catch (error) {
    console.error('Error detallado:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.log('FIN: Función analyze finalizada con error');
    return { 
      statusCode: 500, 
      body: JSON.stringify({ 
        error: 'Error al procesar el archivo', 
        details: error.message, 
        stack: error.stack
      }) 
    };
  }
};