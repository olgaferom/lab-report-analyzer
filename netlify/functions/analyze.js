const multipart = require('parse-multipart');
const pdf = require('pdf-parse');
const { Configuration, OpenAIApi } = require("openai");

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
    throw error;
  }
}

exports.handler = async function(event, context) {
  // Logs forzados al inicio de la función
  console.log('Función analyze iniciada - Log de prueba');
  console.log('Método HTTP:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers));
  console.log('Body length:', event.body ? event.body.length : 0);

  // Continuamos con la lógica original de la función
  console.log('Función analyze iniciada');
  console.log('Método HTTP:', event.httpMethod);

  if (event.httpMethod !== 'POST') {
    console.log('Método no permitido');
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    console.log('Parseando datos multipart');
    const { body, headers } = event;
    const boundary = multipart.getBoundary(headers['content-type']);
    const parts = multipart.Parse(Buffer.from(body, 'base64'), boundary);

    if (parts.length === 0) {
      console.log('No se recibió ningún archivo');
      throw new Error('No se recibió ningún archivo');
    }

    const { filename, data } = parts[0];
    console.log('Archivo recibido:', filename);

    console.log('Extrayendo texto del PDF');
    const pdfData = await pdf(data);
    const text = pdfData.text;
    console.log('Texto extraído del PDF, longitud:', text.length);

    console.log('Iniciando análisis del texto');
    const analysis = await analyzeTextWithGPT(text.slice(0, 4000)); // Limitamos a 4000 caracteres para este ejemplo

    console.log('Análisis completado, preparando respuesta');
    const response = {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Análisis completado",
        filename: filename,
        numPages: pdfData.numpages,
        analysis: analysis
      })
    };

    console.log('Función analyze finalizada con éxito');
    return response;
  } catch (error) {
    console.error('Error en la función:', error);
    console.log('Función analyze finalizada con error');
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Error al procesar el archivo', details: error.message }) 
    };
  }
};